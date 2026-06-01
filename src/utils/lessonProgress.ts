import { ALL_UNITS, type Grade12Lesson, type Grade12Unit } from '../data/grade12';
import type { ScoreEntry } from '../hooks/useScoreHistory';

const lessonIdByEnglishTitle = new Map<string, string>();
const lessonIdByArabicTitle = new Map<string, string>();

for (const unit of ALL_UNITS) {
  for (const lesson of unit.lessons) {
    lessonIdByEnglishTitle.set(lesson.titleEn, lesson.id);
    lessonIdByArabicTitle.set(lesson.titleAr, lesson.id);
  }
}

export function resolveLessonIdFromHistoryEntry(entry: Pick<ScoreEntry, 'lessonId' | 'titleEn' | 'titleAr'>): string | null {
  if (entry.lessonId) {
    return entry.lessonId;
  }

  return lessonIdByEnglishTitle.get(entry.titleEn) ?? lessonIdByArabicTitle.get(entry.titleAr) ?? null;
}

export function buildCompletedLessonIdSet(history: ScoreEntry[]): Set<string> {
  const completed = new Set<string>();

  for (const entry of history) {
    if (entry.type !== 'lesson') continue;
    const lessonId = resolveLessonIdFromHistoryEntry(entry);
    if (lessonId) {
      completed.add(lessonId);
    }
  }

  return completed;
}

export function isLessonCompleted(completedLessonIds: Set<string>, lesson: Grade12Lesson): boolean {
  return completedLessonIds.has(lesson.id);
}

export function countCompletedLessonsInUnit(completedLessonIds: Set<string>, unit: Grade12Unit): number {
  return unit.lessons.filter((lesson) => isLessonCompleted(completedLessonIds, lesson)).length;
}
