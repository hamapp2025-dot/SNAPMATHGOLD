/**
 * Mastery level per lesson: 0 Not Started, 1 Familiar, 2 Practiced, 3 Proficient, 4 Mastered.
 * Stored in AsyncStorage; upgrade-only.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncNow } from './useFirestoreSync';
import { emitStorageUpdate, safeParseInt, subscribeToStorageUpdates } from '../utils/storage';

const PREFIX = '@mastery_';

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;

export const MASTERY_LABELS: Record<MasteryLevel, { en: string; ar: string }> = {
  0: { en: 'Not started', ar: 'لم تبدأ' },
  1: { en: 'Familiar', ar: 'تعرف' },
  2: { en: 'Practiced', ar: 'تدربت' },
  3: { en: 'Proficient', ar: 'متقن' },
  4: { en: 'Mastered', ar: 'أتقنت' },
};

export const MASTERY_FILL: Record<MasteryLevel, number> = {
  0: 0,
  1: 0.25,
  2: 0.5,
  3: 0.75,
  4: 1,
};

export async function getMasteryLevel(lessonId: string): Promise<MasteryLevel> {
  const raw = await AsyncStorage.getItem(PREFIX + lessonId);
  const n = safeParseInt(raw, 0);
  if (n >= 0 && n <= 4) return n as MasteryLevel;
  return 0;
}

export async function setMasteryLevel(lessonId: string, newLevel: MasteryLevel): Promise<void> {
  const current = await getMasteryLevel(lessonId);
  if (newLevel > current) {
    await AsyncStorage.setItem(PREFIX + lessonId, String(newLevel));
    emitStorageUpdate();
    syncNow().catch(() => {});
  }
}

export function getMasteryLevelForLessonCompletion(correct: number, total: number): MasteryLevel {
  if (total <= 0) {
    return 1;
  }

  const pct = (correct / total) * 100;
  if (pct >= 100) return 4;
  if (pct >= 75) return 3;
  if (pct >= 40) return 2;
  return 1;
}

export function useMastery(lessonId?: string) {
  const [level, setLevel] = useState<MasteryLevel>(0);

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    const load = async () => {
      const nextLevel = await getMasteryLevel(lessonId);
      if (!cancelled) {
        setLevel(nextLevel);
      }
    };

    load();
    const unsubscribe = subscribeToStorageUpdates(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [lessonId]);

  const upgrade = useCallback(async (newLevel: MasteryLevel) => {
    if (!lessonId) return;
    const current = await getMasteryLevel(lessonId);
    if (newLevel > current) {
      await AsyncStorage.setItem(PREFIX + lessonId, String(newLevel));
      setLevel(newLevel);
      emitStorageUpdate();
      syncNow().catch(() => {});
    }
  }, [lessonId]);

  return { level, upgrade, getLevel: getMasteryLevel };
}

export function useMasteryMap(lessonIds: string[]) {
  const [map, setMap] = useState<Record<string, MasteryLevel>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const out: Record<string, MasteryLevel> = {};
      for (const id of lessonIds) {
        out[id] = await getMasteryLevel(id);
      }
      if (!cancelled) {
        setMap(out);
      }
    };

    load();
    const unsubscribe = subscribeToStorageUpdates(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [lessonIds.join(',')]);

  return map;
}
