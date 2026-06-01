/**
 * useXP — SnapMath XP & streak engine
 *
 * Tracks:
 *  - totalXP        total points earned all-time
 *  - level          1-based level derived from XP thresholds
 *  - xpToNext       XP needed to reach the next level
 *  - xpProgress     0-1 fraction through current level
 *  - streak         consecutive days with at least one practice session
 *  - lastActiveDate ISO date string of last activity
 *  - todayXP        XP earned today (resets at midnight)
 *  - activeDays     array of ISO date strings (for heatmap)
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncNow } from './useFirestoreSync';
import { emitStorageUpdate, safeParseInt, safeStringArray, subscribeToStorageUpdates } from '../utils/storage';

// ─── XP required to reach each level (cumulative) ───────────────────────────
const LEVEL_THRESHOLDS = [
  0,     // L1
  100,   // L2
  250,   // L3
  500,   // L4
  900,   // L5
  1400,  // L6
  2000,  // L7
  2800,  // L8
  3800,  // L9
  5000,  // L10
];

// ─── XP rewards ─────────────────────────────────────────────────────────────
export const XP_CORRECT_ANSWER = 10;
export const XP_LESSON_COMPLETE = 50;
export const XP_PERFECT_QUIZ = 30;     // bonus for 100% quiz score
export const XP_DAILY_GOAL = 20;       // bonus for hitting daily goal

// ─── Storage keys ────────────────────────────────────────────────────────────
const KEY_XP         = '@snapmath_xp_total';
const KEY_TODAY_XP   = '@snapmath_xp_today';
const KEY_TODAY_DATE = '@snapmath_xp_today_date';
const KEY_STREAK     = '@snapmath_streak';
const KEY_LAST_DATE  = '@snapmath_last_active_date';
const KEY_ACTIVE_DAYS = '@snapmath_active_days';

function todayISO() {
  return new Date().toISOString().slice(0, 10); // "2026-03-15"
}

function levelFromXP(xp: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length);
}

function xpForLevel(level: number) {
  return LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)];
}

type XPStorageSnapshot = {
  totalXP: number;
  streak: number;
  lastActiveDate: string;
  todayXP: number;
  activeDays: string[];
  repairPairs: [string, string][];
};

async function readXPStorage(): Promise<XPStorageSnapshot> {
  const values = await AsyncStorage.multiGet([
    KEY_XP,
    KEY_TODAY_XP,
    KEY_TODAY_DATE,
    KEY_STREAK,
    KEY_LAST_DATE,
    KEY_ACTIVE_DAYS,
  ]);
  const map = Object.fromEntries(values.map(([key, value]) => [key, value ?? '']));
  const today = todayISO();
  const savedTodayDate = map[KEY_TODAY_DATE] ?? '';
  const storedTodayXP = safeParseInt(map[KEY_TODAY_XP], 0);
  const storedStreak = safeParseInt(map[KEY_STREAK], 0);
  const lastActiveDate = map[KEY_LAST_DATE] ?? '';
  const repairPairs: [string, string][] = [];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);

  const correctedTodayXP = savedTodayDate === today ? storedTodayXP : 0;
  const correctedStreak =
    !lastActiveDate || lastActiveDate === today || lastActiveDate === yesterdayISO
      ? storedStreak
      : 0;

  if (savedTodayDate !== today && (storedTodayXP !== 0 || savedTodayDate !== '')) {
    repairPairs.push([KEY_TODAY_XP, '0'], [KEY_TODAY_DATE, today]);
  }

  if (correctedStreak !== storedStreak) {
    repairPairs.push([KEY_STREAK, String(correctedStreak)]);
  }

  return {
    totalXP: safeParseInt(map[KEY_XP], 0),
    streak: correctedStreak,
    lastActiveDate,
    todayXP: correctedTodayXP,
    activeDays: safeStringArray(map[KEY_ACTIVE_DAYS]),
    repairPairs,
  };
}

export type XPState = {
  totalXP: number;
  level: number;
  xpToNext: number;
  xpProgress: number; // 0-1
  streak: number;
  lastActiveDate: string;
  todayXP: number;
  activeDays: string[];
  addXP: (amount: number) => Promise<{ newLevel: number; leveledUp: boolean; newStreak: boolean }>;
  reset: () => Promise<void>;
};

export function useXP(): XPState {
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState('');
  const [todayXP, setTodayXP] = useState(0);
  const [activeDays, setActiveDays] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const snapshot = await readXPStorage();
      if (snapshot.repairPairs.length) {
        await AsyncStorage.multiSet(snapshot.repairPairs);
        emitStorageUpdate();
      }

      if (cancelled) return;

      setTotalXP(snapshot.totalXP);
      setStreak(snapshot.streak);
      setLastActiveDate(snapshot.lastActiveDate);
      setTodayXP(snapshot.todayXP);
      setActiveDays(snapshot.activeDays);
    };

    load();
    const unsubscribe = subscribeToStorageUpdates(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const level = levelFromXP(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = level < LEVEL_THRESHOLDS.length ? xpForLevel(level + 1) : xpForLevel(level) + 500;
  const xpToNext = nextLevelXP - totalXP;
  const xpRange = nextLevelXP - currentLevelXP;
  const xpProgress = Math.min((totalXP - currentLevelXP) / xpRange, 1);

  const addXP = useCallback(async (amount: number) => {
    const current = await readXPStorage();
    const today = todayISO();
    const prevLevel = levelFromXP(current.totalXP);

    const newTotal = current.totalXP + amount;
    const newTodayXP = current.todayXP + amount;
    const newLevel = levelFromXP(newTotal);
    const leveledUp = newLevel > prevLevel;

    let newStreak = current.streak;
    let newStreakFlag = false;
    const isNewDay = current.lastActiveDate !== today;
    if (isNewDay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yISO = yesterday.toISOString().slice(0, 10);
      newStreak = current.lastActiveDate === yISO ? current.streak + 1 : 1;
      newStreakFlag = true;
    }

    const newActiveDays = current.activeDays.includes(today)
      ? current.activeDays
      : [...current.activeDays, today].sort();

    await AsyncStorage.multiSet([
      [KEY_XP, String(newTotal)],
      [KEY_TODAY_XP, String(newTodayXP)],
      [KEY_TODAY_DATE, today],
      [KEY_STREAK, String(newStreak)],
      [KEY_LAST_DATE, today],
      [KEY_ACTIVE_DAYS, JSON.stringify(newActiveDays)],
    ]);

    setTotalXP(newTotal);
    setTodayXP(newTodayXP);
    setStreak(newStreak);
    setLastActiveDate(today);
    setActiveDays(newActiveDays);
    emitStorageUpdate();

    syncNow().catch(() => {});

    return { newLevel, leveledUp, newStreak: newStreakFlag };
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.multiRemove([KEY_XP, KEY_TODAY_XP, KEY_TODAY_DATE, KEY_STREAK, KEY_LAST_DATE, KEY_ACTIVE_DAYS]);
    setTotalXP(0); setStreak(0); setLastActiveDate(''); setTodayXP(0); setActiveDays([]);
    emitStorageUpdate();
  }, []);

  return { totalXP, level, xpToNext, xpProgress, streak, lastActiveDate, todayXP, activeDays, addXP, reset };
}
