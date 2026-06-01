/**
 * useBookmarks — persist bookmarked question IDs to AsyncStorage
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncNow } from './useFirestoreSync';
import { emitStorageUpdate, safeParseJson, subscribeToStorageUpdates } from '../utils/storage';

const KEY = '@snapmath_bookmarks';

export type BookmarkItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  topicEn: string;
  topicAr: string;
  score?: number;    // last score (0-100), optional
  attempts: number;
};

function normalizeBookmarks(raw: unknown): BookmarkItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((entry): entry is Partial<BookmarkItem> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      id: typeof entry.id === 'string' ? entry.id : `bookmark-${Date.now()}`,
      titleEn: typeof entry.titleEn === 'string' ? entry.titleEn : 'Saved item',
      titleAr: typeof entry.titleAr === 'string' ? entry.titleAr : 'عنصر محفوظ',
      topicEn: typeof entry.topicEn === 'string' ? entry.topicEn : 'SnapMath',
      topicAr: typeof entry.topicAr === 'string' ? entry.topicAr : 'سناب ماث',
      score: typeof entry.score === 'number' ? entry.score : undefined,
      attempts: typeof entry.attempts === 'number' ? entry.attempts : 0,
    }));
}

async function readBookmarks() {
  const raw = await AsyncStorage.getItem(KEY);
  return normalizeBookmarks(safeParseJson<unknown>(raw, []));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const nextBookmarks = await readBookmarks();
      if (!cancelled) {
        setBookmarks(nextBookmarks);
      }
    };

    load();
    const unsubscribe = subscribeToStorageUpdates(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const save = useCallback(async (updated: BookmarkItem[]) => {
    setBookmarks(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    emitStorageUpdate();
    syncNow().catch(() => {});
  }, []);

  const addBookmark = useCallback(async (item: BookmarkItem) => {
    const currentBookmarks = await readBookmarks();
    const exists = currentBookmarks.find((bookmark) => bookmark.id === item.id);
    if (exists) return;
    await save([item, ...currentBookmarks]);
  }, [save]);

  const removeBookmark = useCallback(async (id: string) => {
    const currentBookmarks = await readBookmarks();
    await save(currentBookmarks.filter((bookmark) => bookmark.id !== id));
  }, [save]);

  const isBookmarked = useCallback((id: string) => bookmarks.some((b) => b.id === id), [bookmarks]);

  const updateScore = useCallback(async (id: string, score: number) => {
    const currentBookmarks = await readBookmarks();
    await save(
      currentBookmarks.map((bookmark) =>
        bookmark.id === id
          ? { ...bookmark, score, attempts: bookmark.attempts + 1 }
          : bookmark
      )
    );
  }, [save]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, updateScore };
}
