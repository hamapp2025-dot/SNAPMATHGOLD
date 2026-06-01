/**
 * useScoreHistory — persists exam results & lesson completions
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncNow } from './useFirestoreSync';
import { emitStorageUpdate, safeParseJson, subscribeToStorageUpdates } from '../utils/storage';

const KEY = '@snapmath_score_history';

export type ScoreEntry = {
  id: string;
  type: 'exam' | 'lesson' | 'practice';
  titleEn: string;
  titleAr: string;
  lessonId?: string;
  unitId?: string;
  examId?: string;
  score: number;     // 0-100
  correct: number;
  total: number;
  xpEarned: number;
  date: string;      // ISO
};

function normalizeHistory(raw: unknown): ScoreEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Partial<ScoreEntry> => typeof entry === 'object' && entry !== null)
    .map((entry, index) => ({
      id: typeof entry.id === 'string' ? entry.id : `legacy-${index}`,
      type:
        entry.type === 'exam' || entry.type === 'lesson' || entry.type === 'practice'
          ? entry.type
          : 'practice',
      titleEn: typeof entry.titleEn === 'string' ? entry.titleEn : 'Practice Session',
      titleAr: typeof entry.titleAr === 'string' ? entry.titleAr : 'جلسة تدريب',
      lessonId: typeof entry.lessonId === 'string' ? entry.lessonId : undefined,
      unitId: typeof entry.unitId === 'string' ? entry.unitId : undefined,
      examId: typeof entry.examId === 'string' ? entry.examId : undefined,
      score: typeof entry.score === 'number' ? entry.score : 0,
      correct: typeof entry.correct === 'number' ? entry.correct : 0,
      total: typeof entry.total === 'number' ? entry.total : 0,
      xpEarned: typeof entry.xpEarned === 'number' ? entry.xpEarned : 0,
      date: typeof entry.date === 'string' ? entry.date : new Date(0).toISOString(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);
}

async function readHistory() {
  const raw = await AsyncStorage.getItem(KEY);
  return normalizeHistory(safeParseJson<unknown>(raw, []));
}

export function useScoreHistory() {
  const [history, setHistory] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextHistory = await readHistory();
      if (!cancelled) {
        setHistory(nextHistory);
      }
    };

    load();
    const unsubscribe = subscribeToStorageUpdates(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const addEntry = useCallback(async (entry: Omit<ScoreEntry, 'id' | 'date'>) => {
    const currentHistory = await readHistory();
    const newEntry: ScoreEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
    };
    const updated = [newEntry, ...currentHistory].slice(0, 50);
    setHistory(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    emitStorageUpdate();
    syncNow().catch(() => {});
    return newEntry;
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(KEY);
    emitStorageUpdate();
    syncNow().catch(() => {});
  }, []);

  // Derived stats
  const bestScore = history.length ? Math.max(...history.map((h) => h.score)) : 0;
  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
    : 0;
  const totalXpFromHistory = history.reduce((s, h) => s + h.xpEarned, 0);
  const examHistory = history.filter((h) => h.type === 'exam');
  const lessonHistory = history.filter((h) => h.type === 'lesson');

  return { history, addEntry, clearHistory, bestScore, avgScore, totalXpFromHistory, examHistory, lessonHistory };
}
