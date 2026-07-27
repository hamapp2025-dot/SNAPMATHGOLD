/**
 * Chapter — premium lesson timeline for a unit.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PremiumAccessScreen from '../components/PremiumAccessScreen';
import { findUnitById } from '../src/data/grade12';
import { useScoreHistory } from '../src/hooks/useScoreHistory';
import { MASTERY_FILL, MASTERY_LABELS, MasteryLevel, useMasteryMap } from '../src/hooks/useMastery';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { canOpenUnit } from '../src/subscriptions/subscriptionAccess';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { withAlpha } from '../src/theme/colorUtils';
import { buildCompletedLessonIdSet, countCompletedLessonsInUnit } from '../src/utils/lessonProgress';

function LessonMedal({
  level,
  index,
  completed,
  size = 56,
}: {
  level: MasteryLevel;
  index: number;
  completed: boolean;
  size?: number;
}) {
  const { theme } = useAppTheme();
  const started = completed || level > 0;
  const accentColor = completed ? theme.primary[0] : started ? theme.accent : withAlpha(theme.text, 0.52);
  const shellColors: [string, string] = completed
    ? theme.primary
    : started
      ? [withAlpha(theme.accent, 0.26), withAlpha(theme.primary[1], 0.12)]
      : [withAlpha(theme.surfaceSoft, 0.96), withAlpha(theme.surface, 0.94)];
  const coreSize = size - 10;

  return (
    <View style={[styles.medalShadow, { shadowColor: completed ? theme.logoShadow : accentColor }]}>
      <LinearGradient
        colors={shellColors}
        style={[
          styles.medalShell,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: withAlpha(accentColor, started ? 0.34 : 0.16),
          },
        ]}>
        <View
          style={[
            styles.medalCore,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              borderColor: withAlpha(accentColor, started ? 0.24 : 0.12),
              backgroundColor: completed
                ? withAlpha(theme.primaryInk, 0.18)
                : withAlpha(theme.bg, theme.id === 'light' ? 0.08 : 0.4),
            },
          ]}>
          {completed ? (
            <Ionicons
              name={level === 4 ? 'checkmark-done' : 'checkmark'}
              size={size * 0.34}
              color={theme.primaryInk}
            />
          ) : (
            <Text
              style={[
                styles.medalNumber,
                {
                  color: accentColor,
                  fontSize: size * 0.25,
                },
              ]}>
              {index + 1}
            </Text>
          )}
        </View>
      </LinearGradient>

      {started && !completed ? (
        <View
          style={[
            styles.medalProgressDot,
            {
              backgroundColor: theme.bg,
              borderColor: accentColor,
            },
          ]}>
          <View
            style={[
              styles.medalProgressDotInner,
              {
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function ChapterScreen() {
  const { currentTier } = useSubscription();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();

  if (!canOpenUnit(currentTier, unitId)) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return <ChapterContent />;
}

function ChapterContent() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { lessonHistory } = useScoreHistory();

  const unit = useMemo(() => findUnitById(unitId), [unitId]);
  const lessonIds = useMemo(() => unit?.lessons.map((lesson) => lesson.id) ?? [], [unit]);
  const masteryMap = useMasteryMap(lessonIds);
  const completedLessonIds = useMemo(() => buildCompletedLessonIdSet(lessonHistory), [lessonHistory]);
  const completedCount = useMemo(
    () => (unit ? countCompletedLessonsInUnit(completedLessonIds, unit) : 0),
    [completedLessonIds, unit],
  );

  const progressPct = useMemo(() => {
    if (!unit) return 0;
    return unit.lessons.length > 0 ? Math.round((completedCount / unit.lessons.length) * 100) : 0;
  }, [completedCount, unit]);

  if (!unit) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <Text style={[styles.placeholder, { color: theme.text }]}>
          {isAr ? 'وحدة غير موجودة' : 'Unit not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.accent }}>{isAr ? 'رجوع' : 'Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unitTitle = isAr ? unit.titleAr : unit.titleEn;
  const resumeLesson =
    unit.lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? unit.lessons[0] ?? null;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, isAr && styles.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.82}>
          {unitTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
        <LinearGradient
          colors={[theme.primary[0], theme.primary[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progressPct}%` }]}
        />
        <Text style={[styles.progressLabel, { color: theme.muted }]}>
          {progressPct}% {isAr ? 'مكتمل' : 'complete'} · {unit.lessons.length}{' '}
          {isAr ? 'درس' : 'lessons'}
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LinearGradient
          colors={[withAlpha(theme.accent, 0.14), withAlpha(theme.primary[1], 0.04)]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.heroTopRow, isAr && styles.headerRtl]}>
          <View style={[styles.heroBadge, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.24) }]}>
            <Ionicons name="sparkles-outline" size={14} color={theme.accent} />
            <Text style={[styles.heroBadgeText, { color: theme.accent }]}>
              {isAr ? 'الخطة التالية' : 'Next Focus'}
            </Text>
          </View>
          <Text style={[styles.heroProgress, { color: theme.accent }]}>
            {completedCount}/{unit.lessons.length}
          </Text>
        </View>
        <Text style={[styles.heroTitle, { color: theme.text }, isAr && styles.lessonTitleRtl]}>
          {isAr ? 'استمر من الدرس التالي مباشرة' : 'Continue with the next lesson'}
        </Text>
        <Text style={[styles.heroSub, { color: theme.muted }, isAr && styles.lessonTitleRtl]}>
          {resumeLesson ? (isAr ? resumeLesson.titleAr : resumeLesson.titleEn) : unitTitle}
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!resumeLesson}
          onPress={() =>
            resumeLesson &&
            router.push({
              pathname: '/lesson-player',
              params: { unitId: unit.id, lessonId: resumeLesson.id },
            })
          }
          style={styles.heroCtaWrap}>
          <LinearGradient colors={theme.primary} style={[styles.heroCta, isAr && styles.lessonMetaRowRtl]}>
            <Text style={[styles.heroCtaText, { color: theme.primaryInk }]}>
              {isAr ? 'ابدأ الآن' : 'Resume Lesson'}
            </Text>
            <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={16} color={theme.primaryInk} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {unit.lessons.map((lesson, index) => {
          const mastery = masteryMap[lesson.id] ?? 0;
          const masteryPct = Math.round(MASTERY_FILL[mastery] * 100);
          const title = isAr ? lesson.titleAr : lesson.titleEn;
          const isCompleted = completedLessonIds.has(lesson.id);
          const isLocked = false;
          const accentColor = isCompleted ? theme.primary[0] : mastery > 0 ? theme.accent : theme.muted;
          const statusLabel = isCompleted
            ? isAr
              ? mastery === 4
                ? 'أتقنت'
                : 'مكتمل'
              : mastery === 4
                ? 'Mastered'
                : 'Completed'
            : MASTERY_LABELS[mastery][isAr ? 'ar' : 'en'];
          const statusIcon: keyof typeof Ionicons.glyphMap = isCompleted
            ? mastery === 4
              ? 'diamond-outline'
              : 'checkmark-circle'
            : mastery > 0
              ? 'sparkles-outline'
              : 'ellipse-outline';

          return (
            <View key={lesson.id} style={styles.lessonStack}>
              <View style={[styles.lessonRow, isAr && styles.lessonRowRtl]}>
                <View style={styles.timelineCol}>
                  <LessonMedal level={mastery} index={index} completed={isCompleted} />
                  {index < unit.lessons.length - 1 ? (
                    <LinearGradient
                      colors={[withAlpha(accentColor, 0.28), withAlpha(accentColor, 0.02)]}
                      style={styles.timelineLine}
                    />
                  ) : null}
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() =>
                    !isLocked &&
                    router.push({
                      pathname: '/lesson-player',
                      params: { unitId: unit.id, lessonId: lesson.id },
                    })
                  }
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: withAlpha(
                        accentColor,
                        isCompleted ? 0.34 : mastery > 0 ? 0.22 : 0.12,
                      ),
                      opacity: isLocked ? 0.5 : 1,
                    },
                  ]}>
                  {(isCompleted || mastery > 0) ? (
                    <LinearGradient
                      colors={[withAlpha(accentColor, theme.id === 'light' ? 0.12 : 0.14), 'transparent']}
                      style={StyleSheet.absoluteFillObject}
                    />
                  ) : null}

                  <View style={[styles.lessonCardTop, isAr && styles.lessonCardTopRtl]}>
                    <View style={styles.lessonTitleWrap}>
                      <Text
                        style={[styles.lessonTitle, { color: theme.text }, isAr && styles.lessonTitleRtl]}
                        numberOfLines={2}>
                        {title}
                      </Text>
                      <Text
                        style={[styles.lessonSub, { color: theme.muted }, isAr && styles.lessonTitleRtl]}>
                        {isAr ? `الدرس ${index + 1}` : `Lesson ${index + 1}`}
                      </Text>
                    </View>

                    <Ionicons
                      name={isAr ? 'chevron-back' : 'chevron-forward'}
                      size={18}
                      color={withAlpha(accentColor, 0.92)}
                    />
                  </View>

                  <View style={[styles.lessonMetaRow, isAr && styles.lessonMetaRowRtl]}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: withAlpha(accentColor, isCompleted ? 0.18 : 0.12),
                          borderColor: withAlpha(accentColor, 0.24),
                        },
                      ]}>
                      <Ionicons name={statusIcon} size={12} color={accentColor} />
                      <Text style={[styles.statusPillText, { color: accentColor }]}>
                        {statusLabel}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.infoChip,
                        {
                          backgroundColor: withAlpha(theme.text, 0.05),
                          borderColor: theme.border,
                        },
                      ]}>
                      <Ionicons name="document-text-outline" size={12} color={theme.muted} />
                      <Text style={[styles.infoChipText, { color: theme.muted }]}>
                        {lesson.keyFormulas.length} {isAr ? 'صيغ' : 'formulas'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.infoChip,
                        {
                          backgroundColor: withAlpha(theme.text, 0.05),
                          borderColor: theme.border,
                        },
                      ]}>
                      <Ionicons name="help-circle-outline" size={12} color={theme.muted} />
                      <Text style={[styles.infoChipText, { color: theme.muted }]}>
                        {lesson.practiceQ.length} {isAr ? 'أسئلة' : 'questions'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.masteryTrack,
                      { backgroundColor: withAlpha(theme.text, 0.08) },
                    ]}>
                    <LinearGradient
                      colors={[accentColor, isCompleted ? theme.primary[1] : theme.accent]}
                      style={[
                        styles.masteryFill,
                        {
                          width: `${masteryPct}%`,
                          opacity: masteryPct > 0 ? 1 : 0,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  placeholder: { fontSize: 18, textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRtl: { flexDirection: 'row-reverse' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  progressBar: { marginHorizontal: 20, borderRadius: 12, padding: 12, marginBottom: 16 },
  progressFill: { height: 6, borderRadius: 999, marginBottom: 6 },
  progressLabel: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  heroCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  heroProgress: {
    fontSize: 16,
    fontFamily: 'Amiri_700Bold',
  },
  heroTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Amiri_700Bold',
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 12,
    fontFamily: 'Amiri_400Regular',
  },
  heroCtaWrap: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  heroCtaText: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 80 },
  lessonStack: { marginBottom: 10 },
  lessonRow: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  lessonRowRtl: { flexDirection: 'row-reverse' },
  timelineCol: { width: 64, alignItems: 'center' },
  timelineLine: {
    width: 3,
    flex: 1,
    minHeight: 30,
    borderRadius: 999,
    marginTop: 10,
  },
  medalShadow: {
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  medalShell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  medalCore: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  medalNumber: { fontFamily: 'Amiri_700Bold' },
  medalProgressDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalProgressDotInner: { width: 7, height: 7, borderRadius: 3.5 },
  lessonCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  lessonCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lessonCardTopRtl: { flexDirection: 'row-reverse' },
  lessonTitleWrap: { flex: 1, minWidth: 0 },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    lineHeight: 22,
  },
  lessonTitleRtl: { textAlign: 'right' },
  lessonSub: { fontSize: 12, marginTop: 4, fontFamily: 'Amiri_400Regular' },
  lessonMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  lessonMetaRowRtl: { flexDirection: 'row-reverse' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  infoChipText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  masteryTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  masteryFill: { height: '100%', borderRadius: 999 },
});
