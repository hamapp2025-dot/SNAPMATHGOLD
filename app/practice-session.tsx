import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PremiumAccessScreen from '../components/PremiumAccessScreen';

import { getExamBlueprint } from '../src/data/exams';
import { ALL_UNITS, SEMESTER_1_UNITS, SEMESTER_2_UNITS, findUnitById, getLocalizedFormulaLabel } from '../src/data/grade12';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { useScoreHistory } from '../src/hooks/useScoreHistory';
import { useXP, XP_CORRECT_ANSWER, XP_PERFECT_QUIZ } from '../src/hooks/useXP';
import { useT } from '../src/config/LanguageContext';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { canOpenUnit } from '../src/subscriptions/subscriptionAccess';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import {
  FREE_DAILY_QUESTION_LIMIT,
  getDailyQuestionCount,
  incrementDailyQuestionCount,
} from '../src/utils/dailyQuestionLimit';
import { useAppTheme } from '../src/theme/ThemeContext';
import { withAlpha } from '../src/theme/colorUtils';
import { getThemeSemantics } from '../src/theme/themeSemantics';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { getLocalizedQuestionOption } from '../src/utils/questionOptions';

type PracticeQuestion = {
  id: string;
  qEn: string;
  qAr: string;
  options: string[];
  correct: number;
  lessonTitleEn: string;
  lessonTitleAr: string;
  unitTitleEn: string;
  unitTitleAr: string;
  hintTitleEn: string;
  hintTitleAr: string;
  hintBodyEn: string;
  hintBodyAr: string;
};

function buildPool(unitId?: string): PracticeQuestion[] {
  const unit = unitId ? findUnitById(unitId) : null;
  const units = unit ? [unit] : ALL_UNITS;

  const pool: PracticeQuestion[] = [];
  for (const currentUnit of units) {
    for (const lesson of currentUnit.lessons) {
      for (let i = 0; i < lesson.practiceQ.length; i += 1) {
        const question = lesson.practiceQ[i];
        const focusFormula = lesson.keyFormulas[0];
        const focusExample = lesson.examples[0];
        pool.push({
          id: `${lesson.id}-practice-${i}`,
          qEn: question.qEn,
          qAr: question.qAr,
          options: question.options,
          correct: question.correct,
          lessonTitleEn: lesson.titleEn,
          lessonTitleAr: lesson.titleAr,
          unitTitleEn: currentUnit.titleEn,
          unitTitleAr: currentUnit.titleAr,
          hintTitleEn: focusFormula ? `Key rule: ${focusFormula.label}` : `Key idea from ${lesson.titleEn}`,
          hintTitleAr: focusFormula
            ? `قاعدة أساسية: ${getLocalizedFormulaLabel(focusFormula.label, true, 0)}`
            : `فكرة أساسية من ${lesson.titleAr}`,
          hintBodyEn:
            focusFormula?.formula ??
            focusExample?.answer ??
            `Review the worked example from ${lesson.titleEn}.`,
          hintBodyAr:
            focusFormula?.formula ??
            focusExample?.answer ??
            `راجع المثال المحلول من درس ${lesson.titleAr}.`,
        });
      }
    }
  }

  return pool;
}

function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function useFreeDailyQuestionQuota(enabled: boolean) {
  const [ready, setReady] = useState(!enabled);
  const [remaining, setRemaining] = useState(0);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const storedUid = await AsyncStorage.getItem('@snapmath_uid').catch(() => null);
      const uid = auth.currentUser?.uid ?? storedUid ?? 'guest';
      uidRef.current = uid;
      const count = await getDailyQuestionCount(uid);
      if (!cancelled) {
        setRemaining(Math.max(FREE_DAILY_QUESTION_LIMIT - count, 0));
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const consume = useCallback((n: number) => {
    const uid = uidRef.current;
    if (!uid || n <= 0) return;
    (async () => {
      for (let i = 0; i < n; i += 1) {
        await incrementDailyQuestionCount(uid);
      }
    })();
  }, []);

  return { ready, remaining, consume };
}

export default function PracticeSessionScreen() {
  const { currentTier } = useSubscription();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();
  const { theme } = useAppTheme();
  const isFreeContent = canOpenUnit(currentTier, unitId);
  const quota = useFreeDailyQuestionQuota(!isFreeContent);

  if (isFreeContent) {
    return <PracticeSessionContent />;
  }

  if (!quota.ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (quota.remaining <= 0) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return (
    <PracticeSessionContent maxFreeQuestions={quota.remaining} onConsumeFreeQuestions={quota.consume} />
  );
}

function PracticeSessionContent({
  maxFreeQuestions,
  onConsumeFreeQuestions,
}: {
  maxFreeQuestions?: number;
  onConsumeFreeQuestions?: (n: number) => void;
}) {
  const router = useRouter();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const ui = getThemeSemantics(theme);
  const { addXP } = useXP();
  const { addEntry } = useScoreHistory();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [sessionSeed, setSessionSeed] = useState(() => Date.now());

  const questions = useMemo(() => {
    const pool = buildPool(unitId);
    const fallback = buildPool();
    const selectedPool = pool.length ? pool : fallback;
    const cap = typeof maxFreeQuestions === 'number' ? Math.max(0, Math.min(6, maxFreeQuestions)) : 6;
    return shuffleSeeded(selectedPool, sessionSeed).slice(0, cap);
  }, [sessionSeed, unitId, maxFreeQuestions]);

  const hasConsumedFreeRef = useRef(false);
  useEffect(() => {
    if (
      !hasConsumedFreeRef.current &&
      typeof maxFreeQuestions === 'number' &&
      questions.length > 0
    ) {
      hasConsumedFreeRef.current = true;
      onConsumeFreeQuestions?.(questions.length);
    }
  }, [maxFreeQuestions, onConsumeFreeQuestions, questions.length]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasCommittedResult = useRef(false);

  useEffect(() => {
    setSessionSeed(Date.now());
    hasCommittedResult.current = false;
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers({});
    setCompleted(false);
    setHintOpen(false);
    setResultXp(0);
  }, [unitId]);

  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const remainingCount = Math.max(questions.length - answeredCount, 0);
  const correctCount = useMemo(
    () => questions.filter((item, index) => answers[index] === item.correct).length,
    [answers, questions]
  );
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const perfect = questions.length > 0 && correctCount === questions.length;
  const bookmarked = question ? isBookmarked(question.id) : false;
  const questionProgressText = isAr
    ? `السؤال ${currentIndex + 1} من ${questions.length}`
    : `Question ${currentIndex + 1} of ${questions.length}`;
  const recommendedExam = useMemo(() => {
    if (unitId && SEMESTER_1_UNITS.some((unit) => unit.id === unitId)) {
      return getExamBlueprint('wb1-drill');
    }
    if (unitId && SEMESTER_2_UNITS.some((unit) => unit.id === unitId)) {
      return getExamBlueprint('wb2-drill');
    }
    return getExamBlueprint('quick-15');
  }, [unitId]);
  const resultSummaryText = isAr
    ? `${correctCount} من ${questions.length} صحيحة`
    : `${correctCount} of ${questions.length} correct`;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: questions.length > 0 ? (currentIndex + 1) / questions.length : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questions.length, progressAnim]);

  useEffect(() => {
    if (!completed || hasCommittedResult.current) return;
    hasCommittedResult.current = true;

    const xpEarned = correctCount * XP_CORRECT_ANSWER + (perfect ? XP_PERFECT_QUIZ : 0);
    setResultXp(xpEarned);

    const firstQuestion = questions[0];
    const titleEn = firstQuestion
      ? `Practice Session: ${firstQuestion.unitTitleEn.replace(/^Unit \d+ · /, '')}`
      : 'Practice Session';
    const titleAr = firstQuestion
      ? `جلسة تدريب: ${firstQuestion.unitTitleAr.replace(/^الوحدة \d+ · /, '')}`
      : 'جلسة تدريب';

    addXP(xpEarned).catch(() => {});
    addEntry({
      type: 'practice',
      unitId: unitId ?? undefined,
      titleEn,
      titleAr,
      score: scorePct,
      correct: correctCount,
      total: questions.length,
      xpEarned,
    }).catch(() => {});
  }, [addEntry, addXP, completed, correctCount, perfect, questions, scorePct]);

  const submitAnswer = () => {
    if (selectedIndex === null || !question) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: selectedIndex }));
    setSubmitted(true);
  };

  const goNext = () => {
    if (currentIndex >= questions.length - 1) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedIndex(null);
    setSubmitted(false);
    setHintOpen(false);
  };

  const restart = () => {
    setSessionSeed(Date.now());
    hasCommittedResult.current = false;
    setCurrentIndex(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAnswers({});
    setCompleted(false);
    setHintOpen(false);
    setResultXp(0);
  };

  const toggleBookmark = async () => {
    if (!question) return;

    if (bookmarked) {
      await removeBookmark(question.id);
      return;
    }

    await addBookmark({
      id: question.id,
      titleEn: question.lessonTitleEn,
      titleAr: question.lessonTitleAr,
      topicEn: question.unitTitleEn,
      topicAr: question.unitTitleAr,
      attempts: 0,
    });
  };

  if (!question) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.bg }]}>
        <Ionicons name="alert-circle-outline" size={28} color={theme.accent} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {isAr ? 'لا توجد أسئلة متاحة الآن' : 'No practice questions available right now'}
        </Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()}>
          <Text style={[styles.emptyLink, { color: theme.accent }]}>
            {isAr ? 'العودة' : 'Go back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (completed) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.resultScroll}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.primary} style={styles.resultHero}>
          <Ionicons
            name={scorePct >= 80 ? 'trophy-outline' : scorePct >= 60 ? 'star-outline' : 'refresh-outline'}
            size={34}
            color={theme.primaryInk}
          />
          <Text style={[styles.resultPct, { color: theme.primaryInk }]}>{scorePct}%</Text>
          <Text style={[styles.resultTitle, { color: theme.primaryInk }]}>
            {isAr ? 'اكتملت الجلسة' : 'Session Complete'}
          </Text>
          <Text
            style={[
              styles.resultSub,
              { color: withAlpha(theme.primaryInk, 0.78) },
              isAr ? styles.textRtlFlow : styles.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(resultSummaryText, isAr)}
          </Text>
        </LinearGradient>

        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.summaryRow, isAr && styles.summaryRowRtl]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{correctCount}</Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>{isAr ? 'صحيحة' : 'Correct'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{resultXp}</Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>XP</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{perfect ? '100%' : `${scorePct}%`}</Text>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>{isAr ? 'الدقة' : 'Accuracy'}</Text>
            </View>
          </View>

          <Text
            style={[
              styles.resultMessage,
              { color: theme.text },
              isAr ? styles.textRtlFlow : styles.textLtrFlow,
              isAr && styles.textRtl,
            ]}>
            {stabilizeMixedMathText(
              perfect
                ? (isAr ? 'نتيجة ممتازة. حصلت على مكافأة إضافية للإتقان.' : 'Perfect run. You earned the mastery bonus.')
                : scorePct >= 70
                  ? (isAr ? 'أداء قوي. استمر بجلسة أخرى لتثبيت المهارة.' : 'Strong work. One more session will lock it in.')
                  : (isAr ? 'ابدأ من جديد وراجع التلميحات لتحسين نتيجتك.' : 'Try again and use the hints to improve your score.'),
              isAr,
            )}
          </Text>
        </View>

        <View style={[styles.nextRouteCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.22) }]}>
          <LinearGradient
            colors={[withAlpha(theme.accent, 0.14), withAlpha(theme.accent, 0.02)]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.nextRouteTop, isAr && styles.nextRouteTopRtl]}>
            <View style={[styles.nextRouteBadge, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.24) }]}>
              <Ionicons name="trail-sign-outline" size={14} color={theme.accent} />
              <Text style={[styles.nextRouteBadgeText, { color: theme.accent }]}>
                {isAr ? 'الخطوة التالية' : 'Next Step'}
              </Text>
            </View>
            <Text style={[styles.nextRouteMeta, { color: theme.muted }]}>
              {isAr ? 'تدريب ← اختبار' : 'Practice → Drill'}
            </Text>
          </View>
          <Text style={[styles.nextRouteTitle, { color: theme.text }, isAr && styles.textRtl]}>
            {isAr ? 'حوّل هذه الجولة إلى اختبار قصير لترى تقدمك على شاشة نتائج كاملة.' : 'Turn this run into a short drill to see your progress on a full results screen.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/exam',
                params: { examId: recommendedExam.id },
              })
            }>
            <LinearGradient colors={theme.primary} style={styles.resultCta}>
              <Ionicons name="school-outline" size={18} color={theme.primaryInk} />
              <Text style={[styles.resultCtaText, { color: theme.primaryInk }]}>
                {isAr ? 'ابدأ اختبار المراجعة' : 'Start Review Drill'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.nextRouteLabel, { color: theme.muted }, isAr && styles.textRtl]} numberOfLines={1}>
            {isAr ? recommendedExam.titleAr : recommendedExam.titleEn}
          </Text>
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={restart} style={styles.resultCtaWrap}>
          <LinearGradient colors={theme.primary} style={styles.resultCta}>
            <Ionicons name="refresh-outline" size={18} color={theme.primaryInk} />
            <Text style={[styles.resultCtaText, { color: theme.primaryInk }]}>{isAr ? 'إعادة الجلسة' : 'Retry Session'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)/practice')}
          style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
            {isAr ? 'العودة إلى التدريب' : 'Back to Practice'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, isAr && styles.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={[styles.headerIconBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isAr ? 'جلسة تدريب' : 'Practice Session'}
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: theme.muted },
              isAr ? styles.textRtlFlow : styles.textLtrFlow,
              isAr && styles.textRtl,
            ]}>
            {stabilizeMixedMathText(questionProgressText, isAr)}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleBookmark} activeOpacity={0.8} style={[styles.headerIconBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: theme.surface }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.accent,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {typeof maxFreeQuestions === 'number' ? (
          <TouchableOpacity
            onPress={() => router.push('/subscription')}
            activeOpacity={0.9}
            style={{
              flexDirection: isAr ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              borderWidth: 1,
              backgroundColor: withAlpha(theme.accent, 0.1),
              borderColor: withAlpha(theme.accent, 0.28),
            }}>
            <Ionicons name="sparkles-outline" size={16} color={theme.accent} />
            <Text style={{ flex: 1, color: theme.text, fontSize: 13, textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? 'تدريب يومي مجاني · قم بالترقية للوصول غير المحدود' : 'Free daily practice · Upgrade for unlimited access'}
            </Text>
            <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.accent} />
          </TouchableOpacity>
        ) : null}
        <View style={[styles.metaRow, isAr && styles.metaRowRtl]}>
          <View style={[styles.metaPill, isAr && styles.metaPillRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="layers-outline" size={14} color={theme.accent} />
            <Text
              style={[
                styles.metaText,
                { color: theme.muted },
                isAr ? styles.textRtlFlow : styles.textLtrFlow,
                isAr && styles.textRtl,
              ]}>
              {stabilizeMixedMathText(isAr ? question.unitTitleAr : question.unitTitleEn, isAr)}
            </Text>
          </View>
          <View style={[styles.metaPill, isAr && styles.metaPillRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="school-outline" size={14} color={theme.accent} />
            <Text
              style={[
                styles.metaText,
                { color: theme.muted },
                isAr ? styles.textRtlFlow : styles.textLtrFlow,
                isAr && styles.textRtl,
              ]}>
              {stabilizeMixedMathText(isAr ? question.lessonTitleAr : question.lessonTitleEn, isAr)}
            </Text>
          </View>
        </View>

        <View style={[styles.sessionHero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.sessionHeroTop, isAr && styles.metaRowRtl]}>
            <View style={[styles.sessionHeroPill, { backgroundColor: ui.accentSoft, borderColor: ui.accentBorder }, isAr && styles.sessionHeroPillRtl]}>
              <Ionicons name="sparkles-outline" size={14} color={theme.accent} />
              <Text style={[styles.sessionHeroPillText, { color: theme.accent }]}>
                {isAr ? 'جلسة مركزة' : 'Focused Session'}
              </Text>
            </View>
            <Text style={[styles.sessionHeroScore, { color: theme.accent }]}>
              {answeredCount > 0 ? `${scorePct}%` : '--'}
            </Text>
          </View>
          <Text style={[styles.sessionHeroTitle, { color: theme.text }, isAr ? styles.textRtlFlow : styles.textLtrFlow, isAr && styles.textRtl]}>
            {stabilizeMixedMathText(isAr ? question.lessonTitleAr : question.lessonTitleEn, isAr)}
          </Text>
          <Text style={[styles.sessionHeroSub, { color: theme.muted }, isAr ? styles.textRtlFlow : styles.textLtrFlow, isAr && styles.textRtl]}>
            {stabilizeMixedMathText(
              isAr
                ? `${answeredCount} مجابة · ${remainingCount} متبقية`
                : `${answeredCount} answered · ${remainingCount} left`,
              isAr,
            )}
          </Text>
          <View style={[styles.metaRow, isAr && styles.metaRowRtl]}>
            {[
              { icon: 'help-circle-outline', label: isAr ? `${questions.length} أسئلة` : `${questions.length} questions` },
              { icon: 'flash-outline', label: isAr ? `حتى ${questions.length * XP_CORRECT_ANSWER + XP_PERFECT_QUIZ} XP` : `Up to ${questions.length * XP_CORRECT_ANSWER + XP_PERFECT_QUIZ} XP` },
            ].map((item) => (
              <View key={item.label} style={[styles.metaPill, isAr && styles.metaPillRtl, { backgroundColor: withAlpha(theme.text, 0.04), borderColor: theme.border }]}>
                <Ionicons name={item.icon as any} size={14} color={theme.muted} />
                <Text style={[styles.metaText, { color: theme.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.questionPrompt, { color: theme.text }, isAr ? styles.textRtlFlow : styles.textLtrFlow, isAr && styles.textRtl]}>
            {stabilizeMixedMathText(isAr ? question.qAr : question.qEn, isAr)}
          </Text>

          <View style={styles.choiceList}>
            {question.options.map((option, index) => {
              const localizedOption = getLocalizedQuestionOption(option, isAr);
              const isSelected = selectedIndex === index;
              const isCorrect = submitted && index === question.correct;
              const isWrong = submitted && isSelected && index !== question.correct;

              return (
                <TouchableOpacity
                  key={`${question.id}-${index}`}
                  activeOpacity={0.85}
                  disabled={submitted}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: isCorrect
                        ? ui.successSoft
                        : isWrong
                          ? ui.dangerSoft
                          : isSelected
                            ? withAlpha(theme.accent, 0.14)
                            : theme.bg,
                      borderColor: isCorrect
                        ? ui.success
                        : isWrong
                          ? theme.danger
                          : isSelected
                            ? theme.accent
                            : theme.border,
                    },
                    isAr && styles.choiceBtnRtl,
                  ]}
                  onPress={() => setSelectedIndex(index)}>
                  <View style={[styles.choiceCircle, { borderColor: isCorrect ? ui.success : isWrong ? theme.danger : theme.border }]}>
                    <Text style={[styles.choiceCircleText, { color: theme.text }]}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text style={[styles.choiceText, { color: theme.text }, isAr ? styles.textRtlFlow : styles.textLtrFlow, isAr && styles.textRtl]}>
                    {stabilizeMixedMathText(localizedOption, isAr)}
                  </Text>
                  {submitted && isCorrect ? <Ionicons name="checkmark-circle" size={18} color={ui.success} /> : null}
                  {submitted && isWrong ? <Ionicons name="close-circle" size={18} color={theme.danger} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setHintOpen((prev) => !prev)}
            style={[styles.hintToggle, isAr && styles.hintToggleRtl]}>
            <Ionicons name={hintOpen ? 'bulb' : 'bulb-outline'} size={16} color={theme.accent} />
            <Text style={[styles.hintToggleText, { color: theme.accent }]}>
              {isAr ? (hintOpen ? 'إخفاء التلميح' : 'إظهار التلميح') : (hintOpen ? 'Hide hint' : 'Show hint')}
            </Text>
          </TouchableOpacity>

          {hintOpen ? (
            <View style={[styles.hintBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text
                style={[
                  styles.hintTitle,
                  { color: theme.text },
                  isAr ? styles.textRtlFlow : styles.textLtrFlow,
                  isAr && styles.textRtl,
                ]}>
                {stabilizeMixedMathText(isAr ? question.hintTitleAr : question.hintTitleEn, isAr)}
              </Text>
              <Text
                style={[
                  styles.hintBody,
                  { color: theme.muted },
                  isAr ? styles.textRtlFlow : styles.textLtrFlow,
                  isAr && styles.textRtl,
                ]}>
                {stabilizeMixedMathText(isAr ? question.hintBodyAr : question.hintBodyEn, isAr)}
              </Text>
              <Text
                style={[
                  styles.hintMeta,
                  { color: theme.muted },
                  isAr ? styles.textRtlFlow : styles.textLtrFlow,
                  isAr && styles.textRtl,
                ]}>
                {stabilizeMixedMathText(
                  isAr ? `راجع درس: ${question.lessonTitleAr}` : `Review lesson: ${question.lessonTitleEn}`,
                  isAr,
                )}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {!submitted ? (
          <TouchableOpacity activeOpacity={0.9} onPress={submitAnswer} disabled={selectedIndex === null}>
            <LinearGradient
              colors={selectedIndex === null ? ['#595E74', '#595E74'] : theme.primary}
              style={styles.primaryBtn}>
              <Text style={[styles.primaryBtnText, { color: theme.primaryInk }]}>{isAr ? 'تأكيد الإجابة' : 'Submit Answer'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.9} onPress={goNext}>
            <LinearGradient colors={theme.primary} style={styles.primaryBtn}>
              <Ionicons name={currentIndex === questions.length - 1 ? 'ribbon-outline' : 'arrow-forward-outline'} size={18} color={theme.primaryInk} />
              <Text style={[styles.primaryBtnText, { color: theme.primaryInk }]}>
                {currentIndex === questions.length - 1
                  ? (isAr ? 'إنهاء الجلسة' : 'Finish Session')
                  : (isAr ? 'السؤال التالي' : 'Next Question')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Amiri_700Bold',
  },
  emptyLink: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerRtl: { flexDirection: 'row-reverse' },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: 12 },
  headerTitle: { fontSize: 21, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  headerSub: { fontSize: 12, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  progressWrap: { paddingHorizontal: 20, paddingBottom: 10 },
  progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  scroll: { paddingHorizontal: 20, paddingBottom: 128 },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  metaRowRtl: { flexDirection: 'row-reverse' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaPillRtl: { flexDirection: 'row-reverse' },
  metaText: { flexShrink: 1, fontSize: 12, fontFamily: 'Amiri_400Regular' },
  sessionHero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sessionHeroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sessionHeroPillRtl: { flexDirection: 'row-reverse' },
  sessionHeroPillText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  sessionHeroScore: {
    fontSize: 16,
    fontFamily: 'Amiri_700Bold',
  },
  sessionHeroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Amiri_700Bold',
  },
  sessionHeroSub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
    marginTop: 4,
    marginBottom: 12,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  questionPrompt: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: 'Amiri_700Bold',
  },
  choiceList: { gap: 10 },
  choiceBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  choiceBtnRtl: { flexDirection: 'row-reverse' },
  choiceCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCircleText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  choiceText: { flex: 1, fontSize: 15, lineHeight: 22, fontFamily: 'Amiri_400Regular' },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  hintToggleRtl: { flexDirection: 'row-reverse' },
  hintToggleText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  hintBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  hintTitle: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_700Bold' },
  hintBody: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', marginTop: 4 },
  hintMeta: { fontSize: 12, lineHeight: 18, fontFamily: 'Amiri_400Regular', marginTop: 8 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  resultScroll: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  resultHero: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultPct: { fontSize: 44, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginTop: 6 },
  resultTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginTop: 6 },
  resultSub: { color: 'rgba(27,29,48,0.78)', fontSize: 14, fontFamily: 'Amiri_400Regular', marginTop: 4 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryRowRtl: { flexDirection: 'row-reverse' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  summaryLabel: { fontSize: 12, marginTop: 4, fontFamily: 'Amiri_400Regular' },
  resultMessage: { fontSize: 15, lineHeight: 24, fontFamily: 'Amiri_400Regular' },
  nextRouteCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  nextRouteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  nextRouteTopRtl: { flexDirection: 'row-reverse' },
  nextRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nextRouteBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  nextRouteMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  nextRouteTitle: { fontSize: 15, lineHeight: 23, fontFamily: 'Amiri_700Bold', marginBottom: 12 },
  nextRouteLabel: { fontSize: 12, fontFamily: 'Amiri_400Regular', marginTop: 10 },
  resultCtaWrap: { marginBottom: 12 },
  resultCta: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resultCtaText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  secondaryBtn: {
    height: 52,
    borderWidth: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
