import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { BookmarkItem, useBookmarks } from '../src/hooks/useBookmarks';
import { useXP, XP_CORRECT_ANSWER } from '../src/hooks/useXP';
import { ALL_UNITS } from '../src/data/grade12';
import { withAlpha } from '../src/theme/colorUtils';
import { getThemeSemantics } from '../src/theme/themeSemantics';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { getLocalizedQuestionOption } from '../src/utils/questionOptions';

// Build a flat question pool from ALL_UNITS practice questions
type FlashQ = {
  id: string;
  qEn: string;
  qAr: string;
  options: string[];
  correct: number;
  topicEn: string;
  topicAr: string;
};

type LessonEntry = {
  unit: (typeof ALL_UNITS)[number];
  lesson: (typeof ALL_UNITS)[number]['lessons'][number];
};

function buildFallbackPool(): FlashQ[] {
  const pool: FlashQ[] = [];
  for (const unit of ALL_UNITS) {
    for (const lesson of unit.lessons) {
      for (const q of lesson.practiceQ) {
        pool.push({
          id: `${lesson.id}-${pool.length}`,
          qEn: q.qEn,
          qAr: q.qAr,
          options: q.options,
          correct: q.correct,
          topicEn: lesson.titleEn,
          topicAr: lesson.titleAr,
        });
      }
    }
  }
  return pool;
}

function findLessonEntry(predicate: (lesson: LessonEntry['lesson']) => boolean): LessonEntry | null {
  for (const unit of ALL_UNITS) {
    const lesson = unit.lessons.find(predicate);
    if (lesson) {
      return { unit, lesson };
    }
  }
  return null;
}

function buildQuestionFromLesson(entry: LessonEntry, questionIndex: number, bookmarkId: string): FlashQ | null {
  const question = entry.lesson.practiceQ[questionIndex] ?? entry.lesson.practiceQ[0];
  if (!question) return null;

  return {
    id: bookmarkId,
    qEn: question.qEn,
    qAr: question.qAr,
    options: question.options,
    correct: question.correct,
    topicEn: entry.lesson.titleEn,
    topicAr: entry.lesson.titleAr,
  };
}

function buildQuestionFromBookmark(bookmark: BookmarkItem): FlashQ | null {
  const practiceMatch = bookmark.id.match(/^(.+)-practice-(\d+)$/);
  if (practiceMatch) {
    const [, lessonId, questionIndex] = practiceMatch;
    const entry = findLessonEntry((lesson) => lesson.id === lessonId);
    if (entry) {
      return buildQuestionFromLesson(entry, Number(questionIndex), bookmark.id);
    }
  }

  const lessonEntry = findLessonEntry(
    (lesson) =>
      lesson.id === bookmark.id ||
      lesson.titleEn === bookmark.titleEn ||
      lesson.titleAr === bookmark.titleAr,
  );

  if (lessonEntry) {
    return buildQuestionFromLesson(lessonEntry, 0, bookmark.id);
  }

  return null;
}

function parseSelectedIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export default function BookmarkReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ids?: string | string[] }>();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const ui = getThemeSemantics(theme);
  const { bookmarks, updateScore } = useBookmarks();
  const { addXP } = useXP();
  const fallbackPool = useMemo(() => buildFallbackPool(), []);
  const selectedIds = useMemo(() => parseSelectedIds(params.ids), [params.ids]);
  const reviewBookmarks = useMemo(() => {
    if (!selectedIds.length) return bookmarks;
    const selectedSet = new Set(selectedIds);
    const filtered = bookmarks.filter((bookmark) => selectedSet.has(bookmark.id));
    return filtered.length > 0 ? filtered : bookmarks;
  }, [bookmarks, selectedIds]);
  const questions = useMemo<FlashQ[]>(
    () =>
      reviewBookmarks.length > 0
        ? reviewBookmarks.map(
            (bookmark, index) =>
              buildQuestionFromBookmark(bookmark) ??
              fallbackPool[index % fallbackPool.length],
          )
        : fallbackPool.slice(0, 10),
    [fallbackPool, reviewBookmarks],
  );

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [scores, setScores] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const q = questions[current];
  if (!q) return null;

  const confirm = async () => {
    if (selected === null) return;
    const correct = selected === q.correct;
    const nextCorrectCount = scores.filter(Boolean).length + (correct ? 1 : 0);
    const pct = Math.round((nextCorrectCount / (current + 1)) * 100);
    setConfirmed(true);
    setScores((prev) => [...prev, correct]);
    if (correct) {
      await addXP(XP_CORRECT_ANSWER);
    }
    await updateScore(q.id, pct);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScores([]);
    setDone(false);
  };

  const pct = done && questions.length > 0
    ? Math.round((scores.filter(Boolean).length / questions.length) * 100)
    : 0;
  const questionProgressText = isAr ? `${current + 1} / ${questions.length}` : `${current + 1}/${questions.length}`;

  // ── Results ──────────────────────────────────────────────────────────────────
  if (done) {
    const correct = scores.filter(Boolean).length;
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
    const resultSummaryText = isAr
      ? `${correct} من ${questions.length} صحيحة`
      : `${correct}/${questions.length} correct`;
    return (
      <View style={[s.root, { backgroundColor: theme.bg }]}>
        <LinearGradient colors={theme.primary} style={s.resultBanner}>
          <Text style={s.resultEmoji}>{pct >= 75 ? '🏆' : pct >= 50 ? '📈' : '📚'}</Text>
          <Text style={[s.resultGrade, { color: theme.primaryInk }]}>{grade}</Text>
          <Text style={[s.resultPct, { color: theme.primaryInk }]}>{pct}%</Text>
          <Text
            style={[
              s.resultSub,
              { color: withAlpha(theme.primaryInk, 0.78) },
              isAr ? s.textRtlFlow : s.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(resultSummaryText, isAr)}
          </Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={s.resultContent} showsVerticalScrollIndicator={false}>
          {questions.map((qq, i) => (
            <View
              key={qq.id + i}
              style={[s.reviewRow, isAr && s.reviewRowRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[s.reviewDot, { backgroundColor: scores[i] ? ui.successSoft : ui.dangerSoft }]}>
                <Ionicons name={scores[i] ? 'checkmark' : 'close'} size={14} color={scores[i] ? ui.success : theme.danger} />
              </View>
              <Text
                style={[
                  s.reviewQ,
                  { color: theme.text },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}
                numberOfLines={2}>
                {stabilizeMixedMathText(isAr ? qq.qAr : qq.qEn, isAr)}
              </Text>
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[s.resultActions, isAr && s.rowRtl]}>
          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: theme.border }]}
            onPress={restart}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color={theme.accent} />
            <Text style={[s.outlineBtnText, { color: theme.accent }]}>{isAr ? 'إعادة' : 'Restart'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.solidBtn} onPress={() => router.back()} activeOpacity={0.9}>
            <LinearGradient colors={theme.primary} style={s.solidBtnGrad}>
              <Text style={[s.solidBtnText, { color: theme.primaryInk }]}>{isAr ? 'العودة' : 'Back to Bookmarks'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <LinearGradient colors={theme.primary} style={s.header}>
        <View style={[s.headerRow, isAr && s.headerRowRtl]}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.primaryInk} />
          </TouchableOpacity>
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { backgroundColor: theme.primaryInk, width: `${(current / questions.length) * 100}%` }]} />
            </View>
            <Text
              style={[
                s.progressLabel,
                { color: withAlpha(theme.primaryInk, 0.74) },
                isAr ? s.textRtlFlow : s.textLtrFlow,
              ]}>
              {stabilizeMixedMathText(questionProgressText, isAr)}
            </Text>
          </View>
          <View style={s.iconBtn} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Topic label */}
        <Text
          style={[
            s.topicLabel,
            { color: theme.accent },
            isAr ? s.textRtlFlow : s.textLtrFlow,
            isAr && s.textRtl,
          ]}>
          {stabilizeMixedMathText(isAr ? q.topicAr : q.topicEn, isAr)}
        </Text>

        {/* Question */}
        <View style={[s.qCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.qNumRow, isAr && { flexDirection: 'row-reverse' }]}>
            <View style={[s.qNumBadge, { backgroundColor: theme.accent }]}>
              <Text style={[s.qNumText, { color: theme.primaryInk }]}>{isAr ? `س${current + 1}` : `Q${current + 1}`}</Text>
            </View>
            <Text
              style={[
                s.qMeta,
                { color: theme.accent },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && s.textRtl,
              ]}>
              {stabilizeMixedMathText(isAr ? 'اختيار من متعدد' : 'Multiple Choice', isAr)}
            </Text>
          </View>
          <Text
            style={[
              s.qText,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(isAr ? q.qAr : q.qEn, isAr)}
          </Text>
        </View>

        {/* Options */}
        {q.options.map((opt, ai) => {
          const localizedOption = getLocalizedQuestionOption(opt, isAr);
          const isSel = selected === ai;
          const isCorrect = ai === q.correct;
          let bg = theme.surface;
          let border = theme.border;
          let textCol = theme.text;
          let icon: string | null = null;

          if (confirmed && isCorrect) {
            bg = ui.successSoft; border = ui.success; textCol = ui.success; icon = 'checkmark-circle';
          } else if (confirmed && isSel && !isCorrect) {
            bg = ui.dangerSoft; border = theme.danger; textCol = theme.danger; icon = 'close-circle';
          } else if (isSel) {
            bg = withAlpha(theme.accent, 0.15); border = theme.accent; textCol = theme.accent;
          }

          return (
            <TouchableOpacity
              key={ai}
              style={[s.optionBtn, { backgroundColor: bg, borderColor: border }, isAr && s.optionBtnRtl]}
              onPress={() => !confirmed && setSelected(ai)}
              disabled={confirmed}
              activeOpacity={0.85}
            >
              <View style={[s.optionLetter, { borderColor: border }]}>
                <Text style={[s.optionLetterText, { color: textCol }]}>
                  {String.fromCharCode(65 + ai)}
                </Text>
              </View>
              <Text
                style={[
                  s.optionText,
                  { color: textCol, flex: 1 },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {stabilizeMixedMathText(localizedOption, isAr)}
              </Text>
              {icon && <Ionicons name={icon as any} size={20} color={textCol} />}
            </TouchableOpacity>
          );
        })}

        {/* CTA */}
        {!confirmed ? (
          <TouchableOpacity
            style={[s.ctaBtn, { opacity: selected === null ? 0.4 : 1 }]}
            onPress={confirm}
            disabled={selected === null}
            activeOpacity={0.9}
          >
            <LinearGradient colors={theme.primary} style={[s.ctaBtnGrad, isAr && s.rowRtl]}>
              <Text style={[s.ctaBtnText, { color: theme.primaryInk }]}>{isAr ? 'تحقق' : 'Check Answer'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.ctaBtn} onPress={next} activeOpacity={0.9}>
            <LinearGradient colors={theme.primary} style={[s.ctaBtnGrad, isAr && s.rowRtl]}>
              <Text style={[s.ctaBtnText, { color: theme.primaryInk }]}>
                {current + 1 >= questions.length
                  ? (isAr ? 'عرض النتائج' : 'View Results')
                  : (isAr ? 'التالي' : 'Next')}
              </Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.primaryInk} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRowRtl: { flexDirection: 'row-reverse' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  progressWrap: { flex: 1, alignItems: 'center', gap: 5 },
  progressTrack: { width: '100%', height: 6, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { color: 'rgba(27,29,48,0.7)', fontSize: 12, fontFamily: 'Amiri_700Bold', fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 50 },

  topicLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },

  qCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 18 },
  qNumRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  qNumBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  qNumText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  qMeta: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.3 },
  qText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 26 },

  optionBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  optionBtnRtl: { flexDirection: 'row-reverse' },
  optionLetter: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  optionText: { fontSize: 15, fontFamily: 'Amiri_400Regular', lineHeight: 22 },

  ctaBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
  ctaBtnGrad: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaBtnText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Results
  resultBanner: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 28,
    alignItems: 'center',
  },
  resultEmoji: { fontSize: 44, marginBottom: 6 },
  resultGrade: { fontSize: 56, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  resultPct: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginTop: 2 },
  resultSub: { fontSize: 14, fontFamily: 'Amiri_400Regular', color: 'rgba(27,29,48,0.7)', marginTop: 4 },
  resultContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  reviewRowRtl: { flexDirection: 'row-reverse' },
  reviewDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reviewQ: { flex: 1, fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 20 },
  resultActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, backgroundColor: 'transparent' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 28, borderWidth: 1.5, height: 54 },
  outlineBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  solidBtn: { flex: 1, borderRadius: 28, overflow: 'hidden' },
  solidBtnGrad: { height: 54, alignItems: 'center', justifyContent: 'center' },
  solidBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  rowRtl: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
