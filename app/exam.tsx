import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PremiumAccessScreen from '../components/PremiumAccessScreen';
import { getExamBlueprint, getExamPool } from '../src/data/exams';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useXP, XP_PERFECT_QUIZ } from '../src/hooks/useXP';
import { useScoreHistory } from '../src/hooks/useScoreHistory';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../src/subscriptions/subscriptionAccess';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { getLocalizedQuestionOption } from '../src/utils/questionOptions';
import { withAlpha } from '../src/theme/colorUtils';
import { getThemeSemantics } from '../src/theme/themeSemantics';

const { width: SW } = Dimensions.get('window');
const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';

// Deterministic shuffle using Fisher-Yates with a seed
function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'intro' | 'quiz' | 'result';

export default function ExamScreen() {
  const { currentTier } = useSubscription();

  if (!canAccessFeature(currentTier, 'grade12Path')) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return <ExamContent />;
}

function ExamContent() {
  const { examId } = useLocalSearchParams<{ examId?: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const ui = useMemo(() => getThemeSemantics(theme), [theme]);
  const { addXP } = useXP();
  const { addEntry } = useScoreHistory();

  const exam = useMemo(() => getExamBlueprint(examId), [examId]);
  const [sessionSeed, setSessionSeed] = useState(() => Date.now());

  const questions = useMemo(() => {
    const all = getExamPool(examId);
    const baseSeed = examId ? examId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 42;
    const seed = baseSeed + sessionSeed;
    return shuffleSeeded(all, seed).slice(0, exam.questions);
  }, [exam.questions, examId, sessionSeed]);
  const hasQuestions = questions.length > 0;

  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.minutes * 60);
  const [selectedNow, setSelectedNow] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFinalizedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const coveredUnitCount = useMemo(() => new Set(questions.map((question) => question.unitId)).size, [questions]);

  useEffect(() => {
    setSessionSeed(Date.now());
    setSecondsLeft(exam.minutes * 60);
    setAnswers({});
    setCurrent(0);
    setSelectedNow(null);
    setPhase('intro');
    hasFinalizedRef.current = false;
  }, [exam.id, exam.minutes]);

  const awardXP = useCallback(async () => {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const total = questions.length;
    if (total === 0) return;
    const pct = Math.round((correct / total) * 100);
    const perfect = correct === total;
    const safeTotal = Math.max(total, 1);
    const xp = Math.round((correct / safeTotal) * 80) + (perfect ? XP_PERFECT_QUIZ : 0);
    await addXP(xp);
    await addEntry({
      type: 'exam',
      examId: exam.id,
      titleEn: exam.titleEn,
      titleAr: exam.titleAr,
      score: pct,
      correct,
      total,
      xpEarned: xp,
    });
  }, [addEntry, addXP, answers, exam, questions]);

  const finishExam = useCallback(async () => {
    if (hasFinalizedRef.current) {
      setPhase('result');
      return;
    }

    hasFinalizedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await awardXP();
    } finally {
      setPhase('result');
    }
  }, [awardXP]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'quiz' || secondsLeft > 0) return;
    void finishExam();
  }, [finishExam, phase, secondsLeft]);

  // Progress bar animation
  useEffect(() => {
    if (phase !== 'quiz' || !hasQuestions) return;
    Animated.timing(progressAnim, {
      toValue: (current + 1) / questions.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [current, hasQuestions, questions.length, phase, progressAnim]);

  const slideIn = useCallback(() => {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
  }, [slideAnim]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const timeWarning = secondsLeft <= 120;

  const selectAnswer = (ai: number) => {
    if (selectedNow !== null) return;
    setSelectedNow(ai);
    setAnswers((prev) => ({ ...prev, [current]: ai }));
  };

  const next = async () => {
    if (!hasQuestions) return;
    setSelectedNow(null);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      slideIn();
    } else {
      await finishExam();
    }
  };

  // ── Score computation ──────────────────────────────────────────────────────
  const score = useMemo(() => {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const total = questions.length;
    const safeTotal = Math.max(total, 1);
    const pct = total > 0 ? Math.round((correct / safeTotal) * 100) : 0;
    return { correct, total, pct };
  }, [answers, questions]);
  const answeredCount = Object.keys(answers).length;
  const liveScorePct = answeredCount > 0 ? Math.round((score.correct / answeredCount) * 100) : 0;

  const q = questions[current];

  const renderUnavailableState = () => (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <View style={[s.header, isAr && s.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.iconBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>{isAr ? 'الاختبار' : 'Exam'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.introContent} showsVerticalScrollIndicator={false}>
        <View style={[s.emptyStateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.emptyStateIcon, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
            <Ionicons name="document-text-outline" size={28} color={theme.accent} />
          </View>
          <Text style={[s.emptyStateTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
            {isAr ? 'هذا الاختبار غير جاهز بعد' : 'This exam is not ready yet'}
          </Text>
          <Text style={[s.emptyStateBody, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
            {isAr
              ? 'مخطط الاختبار موجود، لكن لا توجد أسئلة متاحة له حالياً. اختر اختباراً آخر أو ارجع لاحقاً بعد إضافة البنك.'
              : 'The exam blueprint exists, but it currently has no available questions. Choose another exam or come back after the bank is expanded.'}
          </Text>
        </View>

        <TouchableOpacity
          style={s.startBtn}
          activeOpacity={0.9}
          onPress={() => router.back()}>
          <LinearGradient colors={theme.primary} style={s.startBtnGrad}>
            <Text style={[s.startBtnText, { color: theme.primaryInk }]}>{isAr ? 'العودة' : 'Back'}</Text>
            <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={20} color={theme.primaryInk} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (!hasQuestions) {
    return renderUnavailableState();
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <View style={[s.root, { backgroundColor: theme.bg }]}>
        <View style={[s.header, isAr && s.headerRtl]}>
          <TouchableOpacity onPress={() => router.back()} style={[s.iconBtn, { backgroundColor: theme.surface }]}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: theme.text }]}>{isAr ? 'الاختبار' : 'Exam'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.introContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={theme.primary} style={s.introBanner}>
            <Ionicons name="school-outline" size={48} color={theme.primaryInk} />
            <Text style={[s.introBannerTitle, { color: theme.primaryInk }]}>{isAr ? exam.titleAr : exam.titleEn}</Text>
            <Text
              style={[
                s.introBannerSub,
                { color: withAlpha(theme.primaryInk, 0.75) },
                isAr ? s.textRtlFlow : s.textLtrFlow,
              ]}>
              {stabilizeMixedMathText(
                isAr
                  ? `الصف 12 · ${exam.questions} سؤال · ${exam.minutes} دقيقة`
                  : `Grade 12 · ${exam.questions} questions · ${exam.minutes} min`,
                isAr,
              )}
            </Text>
          </LinearGradient>

          <View style={[s.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {[
              { icon: 'help-circle-outline', en: `${exam.questions} multiple-choice questions`, ar: `${exam.questions} سؤال اختيار من متعدد` },
              { icon: 'timer-outline', en: `${exam.minutes}-minute time limit`, ar: `مدة ${exam.minutes} دقيقة` },
              { icon: 'layers-outline', en: `Covers ${coveredUnitCount} Grade 12 units`, ar: `يغطي ${coveredUnitCount} وحدات من الصف 12` },
              { icon: 'star-outline', en: 'Earn up to 80 XP + 30 bonus for perfect score', ar: 'احصل على 80 XP + 30 مكافأة للعلامة الكاملة' },
            ].map((item, i) => (
                <View key={i} style={[s.infoRow, isAr && s.infoRowRtl, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <View style={[s.infoIcon, { backgroundColor: withAlpha(theme.accent, 0.12) }]}><Ionicons name={item.icon as any} size={18} color={theme.accent} /></View>
                <Text
                  style={[
                    s.infoText,
                    { color: theme.text },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && { textAlign: 'right' },
                  ]}>
                  {stabilizeMixedMathText(isAr ? item.ar : item.en, isAr)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[s.tipBox, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.27) }]}>
            <Ionicons name="bulb-outline" size={18} color={theme.accent} style={{ marginBottom: 6 }} />
            <Text
              style={[
                s.tipText,
                { color: theme.muted },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && { textAlign: 'right' },
              ]}>
              {stabilizeMixedMathText(
                isAr
                  ? 'ابدأ بالأسئلة الأسرع أولاً، ثم عد للأسئلة الأطول. هذا الاختبار يعرض فقط الأسئلة المتوفرة فعلاً في بنك الأسئلة الحالي.'
                  : 'Start with the quickest wins first, then return to longer questions. This simulator only uses questions that currently exist in your bank.',
                isAr,
              )}
            </Text>
          </View>

          <TouchableOpacity
            style={s.startBtn}
            activeOpacity={0.9}
            onPress={() => { setPhase('quiz'); slideIn(); }}>
            <LinearGradient colors={theme.primary} style={s.startBtnGrad}>
              <Text style={[s.startBtnText, { color: theme.primaryInk }]}>{isAr ? 'ابدأ الاختبار' : 'Start Exam'}</Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={20} color={theme.primaryInk} />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <View style={[s.root, { backgroundColor: theme.bg }]}>
        {/* Header with timer */}
        <LinearGradient colors={theme.primary} style={s.quizHeader}>
          <View style={[s.quizHeaderRow, isAr && s.headerRtl]}>
            <TouchableOpacity onPress={async () => { await finishExam(); }}>
              <Ionicons name="close" size={24} color={theme.primaryInk} />
            </TouchableOpacity>
            <Text style={[s.quizCounter, { color: theme.primaryInk }]}>{current + 1} / {questions.length}</Text>
            <View style={[s.timerBadge, timeWarning && s.timerWarning]}>
              <Ionicons name="timer-outline" size={14} color={timeWarning ? '#FF3B30' : theme.primaryInk} />
              <Text style={[s.timerText, { color: theme.primaryInk }, timeWarning && { color: '#FF3B30' }]}>{formatTime(secondsLeft)}</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, {
              backgroundColor: theme.primaryInk,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={s.quizContent} showsVerticalScrollIndicator={false}>
          <View style={[s.quizMetaRow, isAr && s.quizMetaRowRtl]}>
            <View style={[s.quizMetaPill, isAr && s.quizMetaPillRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="layers-outline" size={14} color={theme.accent} />
              <Text style={[s.quizMetaText, { color: theme.muted }]}>
                {isAr ? `${coveredUnitCount} وحدات` : `${coveredUnitCount} units`}
              </Text>
            </View>
            <View style={[s.quizMetaPill, isAr && s.quizMetaPillRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="analytics-outline" size={14} color={theme.accent} />
              <Text style={[s.quizMetaText, { color: theme.muted }]}>
                {answeredCount > 0
                  ? (isAr ? `${liveScorePct}% حتى الآن` : `${liveScorePct}% so far`)
                  : (isAr ? 'لم تبدأ النتيجة بعد' : 'Score starts after answer 1')}
              </Text>
            </View>
          </View>

          {/* Unit label */}
          <Text
            style={[
              s.unitLabel,
              { color: theme.accent },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && { textAlign: 'right' },
            ]}>
            {stabilizeMixedMathText(isAr ? q.unitTitleAr : q.unitTitleEn, isAr)}
          </Text>

          {/* Question */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text
              style={[
                s.question,
                { color: theme.text },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && { textAlign: 'right' },
              ]}>
              {stabilizeMixedMathText(isAr ? q.qAr : q.qEn, isAr)}
            </Text>

            {/* Options */}
            <View style={s.optionsWrap}>
              {q.options.map((opt, ai) => {
                const localizedOption = getLocalizedQuestionOption(opt, isAr);
                const sel = selectedNow === ai;
                const revealed = selectedNow !== null;
                const correct = ai === q.correct;
                let bg = theme.surface;
                let border = theme.border;
                let textCol = theme.text;
                let icon: string | null = null;
                if (revealed && correct) { bg = ui.successSoft; border = ui.success; textCol = ui.success; icon = 'checkmark-circle'; }
                else if (revealed && sel && !correct) { bg = ui.dangerSoft; border = theme.danger; textCol = theme.danger; icon = 'close-circle'; }
                else if (sel) { bg = withAlpha(theme.accent, 0.15); border = theme.accent; textCol = theme.accent; }
                return (
                  <TouchableOpacity
                    key={ai}
                    style={[s.optionBtn, isAr && s.optionBtnRtl, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => selectAnswer(ai)}
                    disabled={revealed}
                    activeOpacity={0.8}>
                    <View style={[s.optionLetter, { borderColor: border }]}>
                      <Text style={[s.optionLetterText, { color: textCol }]}>{String.fromCharCode(65 + ai)}</Text>
                    </View>
                    <Text
                      style={[
                        s.optionText,
                        { color: textCol, flex: 1 },
                        isAr ? s.textRtlFlow : s.textLtrFlow,
                        isAr && { textAlign: 'right' },
                      ]}>
                      {stabilizeMixedMathText(localizedOption, isAr)}
                    </Text>
                    {icon && <Ionicons name={icon as any} size={20} color={textCol} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {selectedNow !== null && (
            <TouchableOpacity style={s.nextBtn} activeOpacity={0.9} onPress={next}>
              <LinearGradient colors={theme.primary} style={s.nextBtnGrad}>
                <Text style={[s.nextBtnText, { color: theme.primaryInk }]}>
                  {current < questions.length - 1 ? (isAr ? 'التالي' : 'Next') : (isAr ? 'إنهاء' : 'Finish')}
                </Text>
                <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.primaryInk} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  const grade = score.pct >= 90 ? 'A' : score.pct >= 75 ? 'B' : score.pct >= 60 ? 'C' : score.pct >= 50 ? 'D' : 'F';
  const wrongIndices = questions.map((_, i) => i).filter((i) => answers[i] !== questions[i].correct);
  const resultSummaryText = isAr
    ? `${score.correct} من ${score.total} صحيحة`
    : `${score.correct}/${score.total} correct`;

  return (
    <ScrollView style={[s.root, { backgroundColor: theme.bg }]} contentContainerStyle={s.resultContent} showsVerticalScrollIndicator={false}>
      {/* Score banner */}
      <LinearGradient colors={theme.primary} style={s.resultBanner}>
        <Text style={s.resultEmoji}>{score.pct >= 75 ? '🏆' : score.pct >= 50 ? '📈' : '📚'}</Text>
        <Text style={[s.resultGrade, { color: theme.primaryInk }]}>{grade}</Text>
        <Text style={[s.resultPct, { color: theme.primaryInk }]}>{score.pct}%</Text>
        <Text
          style={[
            s.resultSub,
            { color: withAlpha(theme.primaryInk, 0.75) },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(resultSummaryText, isAr)}
        </Text>
      </LinearGradient>

      {/* Stats row */}
      <View style={[s.statsRow, isAr && s.statsRowRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          { icon: 'checkmark-circle-outline', val: String(score.correct), label: isAr ? 'صحيح' : 'Correct', color: '#2ED573' },
          { icon: 'close-circle-outline', val: String(score.total - score.correct), label: isAr ? 'خطأ' : 'Wrong', color: '#FF3B30' },
            { icon: 'timer-outline', val: formatTime(exam.minutes * 60 - secondsLeft), label: isAr ? 'الوقت' : 'Time', color: theme.accent },
        ].map((st) => (
          <View key={st.label} style={s.statItem}>
            <Ionicons name={st.icon as any} size={20} color={st.color} />
            <Text style={[s.statVal, { color: theme.text }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Wrong answers review */}
      {wrongIndices.length > 0 && (
        <>
          <Text style={[s.reviewTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
            {isAr ? 'مراجعة الأخطاء' : 'Review Wrong Answers'}
          </Text>
          {wrongIndices.slice(0, 5).map((i) => {
            const wq = questions[i];
            const selectedAnswerText =
              getLocalizedQuestionOption(
                wq.options[answers[i] ?? -1] ?? (isAr ? 'إجابة غير متاحة' : 'Answer unavailable'),
                isAr,
              );
            const correctAnswerText =
              getLocalizedQuestionOption(
                wq.options[wq.correct] ?? (isAr ? 'الإجابة الصحيحة غير متاحة' : 'Correct answer unavailable'),
                isAr,
              );
            return (
              <View key={i} style={[s.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text
                  style={[
                    s.reviewQ,
                    { color: theme.text },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && { textAlign: 'right' },
                  ]}
                  numberOfLines={3}>
                  {stabilizeMixedMathText(isAr ? wq.qAr : wq.qEn, isAr)}
                </Text>
                <View style={[s.reviewAnswerRow, isAr && s.reviewAnswerRowRtl]}>
                  <View style={[s.reviewWrong, isAr && s.reviewAnswerCellRtl]}>
                    <Ionicons name="close-circle" size={14} color="#FF3B30" style={s.reviewAnswerIcon} />
                    <View style={s.reviewAnswerTextWrap}>
                      <Text
                        style={[
                          s.reviewAnswerLabel,
                          { color: '#FF3B30' },
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && { textAlign: 'right' },
                        ]}>
                        {isAr ? 'اختيارك' : 'Your answer'}
                      </Text>
                      <Text
                        style={[
                          s.reviewWrongText,
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && { textAlign: 'right' },
                        ]}
                        numberOfLines={2}>
                        {stabilizeMixedMathText(selectedAnswerText, isAr)}
                      </Text>
                    </View>
                  </View>
                  <View style={[s.reviewCorrect, isAr && s.reviewAnswerCellRtl]}>
                    <Ionicons name="checkmark-circle" size={14} color="#2ED573" style={s.reviewAnswerIcon} />
                    <View style={s.reviewAnswerTextWrap}>
                      <Text
                        style={[
                          s.reviewAnswerLabel,
                          { color: '#2ED573' },
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && { textAlign: 'right' },
                        ]}>
                        {isAr ? 'الصحيح' : 'Correct answer'}
                      </Text>
                      <Text
                        style={[
                          s.reviewCorrectText,
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && { textAlign: 'right' },
                        ]}
                        numberOfLines={2}>
                        {stabilizeMixedMathText(correctAnswerText, isAr)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Actions */}
      <TouchableOpacity style={s.startBtn} activeOpacity={0.9}
        onPress={() => {
          setSessionSeed(Date.now());
          setAnswers({});
          setCurrent(0);
          setSelectedNow(null);
          setSecondsLeft(exam.minutes * 60);
          hasFinalizedRef.current = false;
          setPhase('quiz');
          slideIn();
        }}>
        <LinearGradient colors={theme.primary} style={s.startBtnGrad}>
          <Ionicons name="refresh" size={18} color={theme.primaryInk} />
          <Text style={[s.startBtnText, { color: theme.primaryInk }]}>{isAr ? 'إعادة المحاولة' : 'Try Again'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.outlineBtn, { borderColor: theme.border }]}
        activeOpacity={0.8}
        onPress={() => router.back()}>
        <Text style={[s.outlineBtnText, { color: theme.muted }]}>{isAr ? 'العودة' : 'Back to Exams'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingHorizontal: 20, paddingBottom: 12 },
  headerRtl: { flexDirection: 'row-reverse' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Intro
  introContent: { paddingHorizontal: 20, paddingBottom: 40 },
  introBanner: { borderRadius: 22, padding: 28, alignItems: 'center', marginBottom: 16 },
  introBannerTitle: { color: '#1B1D30', fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginTop: 10 },
  introBannerSub: { color: 'rgba(27,29,48,0.75)', fontSize: 14, fontFamily: 'Amiri_400Regular', marginTop: 4 },
  infoCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  infoRowRtl: { flexDirection: 'row-reverse' },
  infoIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 20 },
  tipBox: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 20 },
  tipText: { fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 22, textAlign: 'center' },
  emptyStateCard: { borderRadius: 18, borderWidth: 1, padding: 18, alignItems: 'center', marginBottom: 20 },
  emptyStateIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyStateTitle: { fontSize: 18, fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  emptyStateBody: { marginTop: 8, fontSize: 14, lineHeight: 22, fontFamily: 'Amiri_400Regular', textAlign: 'center' },
  startBtn: { borderRadius: 28, overflow: 'hidden' },
  startBtnGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startBtnText: { color: '#1B1D30', fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Quiz header
  quizHeader: { paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 12, paddingHorizontal: 20 },
  quizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  quizCounter: { color: '#1B1D30', fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  timerWarning: { backgroundColor: 'rgba(255,59,48,0.15)' },
  timerText: { color: '#1B1D30', fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: '#1B1D30' },

  // Quiz content
  quizContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  quizMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  quizMetaRowRtl: { flexDirection: 'row-reverse' },
  quizMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quizMetaPillRtl: { flexDirection: 'row-reverse' },
  quizMetaText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  unitLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  question: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 26, marginBottom: 24 },
  optionsWrap: { gap: 10 },
  optionBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  optionBtnRtl: { flexDirection: 'row-reverse' },
  optionLetter: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  optionText: { fontSize: 15, fontFamily: 'Amiri_400Regular', lineHeight: 22 },
  nextBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 24 },
  nextBtnGrad: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextBtnText: { color: '#1B1D30', fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Result
  resultContent: { paddingHorizontal: 20, paddingBottom: 60 },
  resultBanner: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 28, alignItems: 'center', marginBottom: 16 },
  resultEmoji: { fontSize: 44, marginBottom: 8 },
  resultGrade: { fontSize: 56, fontWeight: '700', fontFamily: 'Amiri_700Bold', color: '#1B1D30' },
  resultPct: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold', color: '#1B1D30', marginTop: 2 },
  resultSub: { fontSize: 15, fontFamily: 'Amiri_400Regular', color: 'rgba(27,29,48,0.75)', marginTop: 4 },

  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  statsRowRtl: { flexDirection: 'row-reverse' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Amiri_400Regular' },

  reviewTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 12 },
  reviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  reviewQ: { fontSize: 14, fontFamily: 'Amiri_700Bold', marginBottom: 10, lineHeight: 20 },
  reviewAnswerRow: { flexDirection: 'row', gap: 10 },
  reviewAnswerRowRtl: { flexDirection: 'row-reverse' },
  reviewWrong: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,59,48,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  reviewAnswerCellRtl: { flexDirection: 'row-reverse' },
  reviewAnswerIcon: { marginTop: 2 },
  reviewAnswerTextWrap: { flex: 1, gap: 2 },
  reviewAnswerLabel: { fontSize: 11, fontFamily: 'Amiri_700Bold' },
  reviewWrongText: { flex: 1, color: '#FF3B30', fontSize: 12, fontFamily: 'Amiri_400Regular' },
  reviewCorrect: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(46,213,115,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  reviewCorrectText: { flex: 1, color: '#2ED573', fontSize: 12, fontFamily: 'Amiri_400Regular' },

  outlineBtn: { borderRadius: 28, borderWidth: 1, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  outlineBtnText: { fontSize: 15, fontFamily: 'Amiri_400Regular' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
