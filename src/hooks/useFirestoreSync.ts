/**
 * useFirestoreSync — syncs XP, history, bookmarks, and mastery to Firestore
 * for the currently authenticated Firebase user.
 *
 * Strategy: "local-first with cloud backup"
 *   - Pull once per signed-in user and merge with local data.
 *   - Keep the higher XP / mastery, union active days, and dedupe arrays by id.
 *   - Emit local storage updates after merges so mounted hooks refresh immediately.
 */

import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth, db } from '../../firebaseConfig';
import { emitStorageUpdate, safeParseInt, safeParseJson, safeStringArray } from '../utils/storage';

const KEY_XP = '@snapmath_xp_total';
const KEY_TODAY_XP = '@snapmath_xp_today';
const KEY_TODAY_DATE = '@snapmath_xp_today_date';
const KEY_STREAK = '@snapmath_streak';
const KEY_LAST_DATE = '@snapmath_last_active_date';
const KEY_ACTIVE_DAYS = '@snapmath_active_days';
const KEY_HISTORY = '@snapmath_score_history';
const KEY_BOOKMARKS = '@snapmath_bookmarks';
const KEY_NAME = '@snapmath_name';
const KEY_GRADE = '@snapmath_grade';
const MASTERY_PREFIX = '@mastery_';

type SyncPayload = {
  totalXP: number;
  todayXP: number;
  todayXPDate: string;
  streak: number;
  lastActiveDate: string;
  activeDays: string[];
  scoreHistory: Record<string, unknown>[];
  bookmarks: Record<string, unknown>[];
  mastery: Record<string, number>;
  name: string;
  grade: string;
  updatedAt: unknown;
};

function normalizeObjectArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    : [];
}

function latestDate(...dates: string[]) {
  return dates.filter(Boolean).sort().at(-1) ?? '';
}

function mergeHistory(localHistory: Record<string, unknown>[], cloudHistory: Record<string, unknown>[]) {
  const merged = new Map<string, Record<string, unknown>>();

  for (const entry of [...cloudHistory, ...localHistory]) {
    const id = typeof entry.id === 'string' ? entry.id : '';
    if (!id) continue;

    const existing = merged.get(id);
    const entryDate = typeof entry.date === 'string' ? entry.date : '';
    const existingDate = typeof existing?.date === 'string' ? existing.date : '';

    if (!existing || entryDate >= existingDate) {
      merged.set(id, entry);
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, 50);
}

function mergeBookmarks(localBookmarks: Record<string, unknown>[], cloudBookmarks: Record<string, unknown>[]) {
  const merged = new Map<string, Record<string, unknown>>();

  for (const entry of [...cloudBookmarks, ...localBookmarks]) {
    const id = typeof entry.id === 'string' ? entry.id : '';
    if (!id) continue;

    const existing = merged.get(id);
    if (!existing) {
      merged.set(id, entry);
      continue;
    }

    merged.set(id, {
      ...existing,
      ...entry,
      attempts: Math.max(
        typeof existing.attempts === 'number' ? existing.attempts : 0,
        typeof entry.attempts === 'number' ? entry.attempts : 0
      ),
      score:
        typeof entry.score === 'number'
          ? entry.score
          : typeof existing.score === 'number'
            ? existing.score
            : undefined,
    });
  }

  return Array.from(merged.values());
}

async function readMasterySnapshot() {
  const allKeys = await AsyncStorage.getAllKeys();
  const masteryKeys = allKeys.filter((key) => key.startsWith(MASTERY_PREFIX));
  if (!masteryKeys.length) return {} as Record<string, number>;

  const pairs = await AsyncStorage.multiGet(masteryKeys);
  return Object.fromEntries(
    pairs
      .map(([key, value]) => [key.slice(MASTERY_PREFIX.length), safeParseInt(value, 0)] as const)
      .filter(([, level]) => level >= 0 && level <= 4)
  );
}

async function readLocalSnapshot(): Promise<Omit<SyncPayload, 'updatedAt'>> {
  const pairs = await AsyncStorage.multiGet([
    KEY_XP,
    KEY_TODAY_XP,
    KEY_TODAY_DATE,
    KEY_STREAK,
    KEY_LAST_DATE,
    KEY_ACTIVE_DAYS,
    KEY_HISTORY,
    KEY_BOOKMARKS,
    KEY_NAME,
    KEY_GRADE,
  ]);
  const map = Object.fromEntries(pairs.map(([key, value]) => [key, value ?? '']));
  const rawHistory = safeParseJson<unknown>(map[KEY_HISTORY], []);
  const rawBookmarks = safeParseJson<unknown>(map[KEY_BOOKMARKS], []);

  return {
    totalXP: safeParseInt(map[KEY_XP], 0),
    todayXP: safeParseInt(map[KEY_TODAY_XP], 0),
    todayXPDate: map[KEY_TODAY_DATE] || '',
    streak: safeParseInt(map[KEY_STREAK], 0),
    lastActiveDate: map[KEY_LAST_DATE] || '',
    activeDays: safeStringArray(map[KEY_ACTIVE_DAYS]),
    scoreHistory: normalizeObjectArray(rawHistory),
    bookmarks: normalizeObjectArray(rawBookmarks),
    mastery: await readMasterySnapshot(),
    name: map[KEY_NAME] || '',
    grade: map[KEY_GRADE] || '',
  };
}

async function mergeCloudIntoLocal(cloud: Partial<SyncPayload>) {
  const local = await readLocalSnapshot();
  const cloudXP = typeof cloud.totalXP === 'number' ? cloud.totalXP : 0;
  const cloudTodayXP = typeof cloud.todayXP === 'number' ? cloud.todayXP : 0;
  const cloudTodayXPDate = typeof cloud.todayXPDate === 'string' ? cloud.todayXPDate : '';
  const cloudStreak = typeof cloud.streak === 'number' ? cloud.streak : 0;
  const cloudLastActiveDate = typeof cloud.lastActiveDate === 'string' ? cloud.lastActiveDate : '';
  const cloudActiveDays = Array.isArray(cloud.activeDays)
    ? cloud.activeDays.filter((item): item is string => typeof item === 'string')
    : [];
  const cloudHistory = normalizeObjectArray(cloud.scoreHistory);
  const cloudBookmarks = normalizeObjectArray(cloud.bookmarks);
  const cloudMastery =
    typeof cloud.mastery === 'object' && cloud.mastery !== null
      ? Object.fromEntries(
          Object.entries(cloud.mastery).filter(
            ([lessonId, level]) => typeof lessonId === 'string' && typeof level === 'number' && level >= 0 && level <= 4
          )
        )
      : {};

  const mergedXP = Math.max(local.totalXP, cloudXP);
  const mergedStreak = Math.max(local.streak, cloudStreak);
  const mergedLastActiveDate = latestDate(local.lastActiveDate, cloudLastActiveDate);
  const mergedTodayXPDate = latestDate(local.todayXPDate, cloudTodayXPDate);
  const mergedTodayXP =
    mergedTodayXPDate === local.todayXPDate && mergedTodayXPDate === cloudTodayXPDate
      ? Math.max(local.todayXP, cloudTodayXP)
      : mergedTodayXPDate === local.todayXPDate
        ? local.todayXP
        : mergedTodayXPDate === cloudTodayXPDate
          ? cloudTodayXP
          : 0;
  const mergedActiveDays = Array.from(new Set([...local.activeDays, ...cloudActiveDays])).sort();
  const mergedHistory = mergeHistory(local.scoreHistory, cloudHistory);
  const mergedBookmarks = mergeBookmarks(local.bookmarks, cloudBookmarks);
  const mergedMastery = { ...local.mastery };

  for (const [lessonId, level] of Object.entries(cloudMastery)) {
    mergedMastery[lessonId] = Math.max(mergedMastery[lessonId] ?? 0, level);
  }

  const masteryPairs = Object.entries(mergedMastery).map(
    ([lessonId, level]) => [`${MASTERY_PREFIX}${lessonId}`, String(level)] as [string, string]
  );

  await AsyncStorage.multiSet([
    [KEY_XP, String(mergedXP)],
    [KEY_TODAY_XP, String(mergedTodayXP)],
    [KEY_TODAY_DATE, mergedTodayXPDate],
    [KEY_STREAK, String(mergedStreak)],
    [KEY_LAST_DATE, mergedLastActiveDate],
    [KEY_ACTIVE_DAYS, JSON.stringify(mergedActiveDays)],
    [KEY_HISTORY, JSON.stringify(mergedHistory)],
    [KEY_BOOKMARKS, JSON.stringify(mergedBookmarks)],
    [KEY_NAME, local.name || (typeof cloud.name === 'string' ? cloud.name : '')],
    [KEY_GRADE, local.grade || (typeof cloud.grade === 'string' ? cloud.grade : '') || 'g12'],
    ...masteryPairs,
  ]);

  emitStorageUpdate();
}

export async function pushToCloud(uid: string) {
  try {
    const local = await readLocalSnapshot();
    const ref = doc(db, 'users', uid);
    await setDoc(
      ref,
      {
        ...local,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (__DEV__) console.warn('[FirestoreSync] push failed:', error);
  }
}

export function useFirestoreSync() {
  const syncedUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        syncedUidRef.current = null;
        return;
      }

      if (syncedUidRef.current === user.uid) return;
      syncedUidRef.current = user.uid;

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          await mergeCloudIntoLocal(snap.data() as Partial<SyncPayload>);
        } else {
          await pushToCloud(user.uid);
        }
      } catch (error) {
        if (__DEV__) console.warn('[FirestoreSync] pull failed:', error);
      }
    });

    return unsubscribe;
  }, []);
}

export async function syncNow() {
  const user = auth.currentUser;
  if (!user) return;
  await pushToCloud(user.uid);
}
