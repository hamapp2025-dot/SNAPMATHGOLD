import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getExamBlueprint } from '../../src/data/exams';
import { SEMESTER_1_UNITS, SEMESTER_2_UNITS } from '../../src/data/grade12';
import PremiumAccessScreen from '../../components/PremiumAccessScreen';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { withAlpha } from '../../src/theme/colorUtils';
import { useT } from '../../src/config/LanguageContext';
import LanguageToggle from '../../src/components/LanguageToggle';
import { useScoreHistory } from '../../src/hooks/useScoreHistory';
import { useSubscription } from '../../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../../src/subscriptions/subscriptionAccess';
import { buildCompletedLessonIdSet, countCompletedLessonsInUnit } from '../../src/utils/lessonProgress';

function SkeletonBlock({ style }: { style?: any }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const { theme } = useAppTheme();
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: withAlpha(theme.accent, theme.id === 'light' ? 0.1 : 0.14),
          borderRadius: 10,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

function UnitCard({
  unit,
  isAr,
  index,
  progress,
  onPress,
}: {
  unit: (typeof SEMESTER_1_UNITS)[number];
  isAr: boolean;
  index: number;
  progress: number;
  onPress: () => void;
}) {
  const { t } = useT();
  const { theme } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      delay: index * 55,
      friction: 7,
    }).start();
  }, []);

  const num = unit.titleEn.match(/^Unit (\d+)/)?.[1] ?? `${index + 1}`;
  const topicEn = unit.titleEn.replace(/^Unit \d+ · /, '');
  const topicAr = unit.titleAr.replace(/^الوحدة \d+ · /, '');
  const icon = (unit.icon as keyof typeof Ionicons.glyphMap) ?? 'book-outline';
  const isStarted = progress > 0;
  const isLocked = false;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[
          s.unitCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
          isLocked && s.unitCardLocked,
        ]}>
        {isStarted && (
          <LinearGradient
            colors={[`${theme.accent}22`, 'transparent']}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
          />
        )}
        <View style={[s.unitCardInner, isAr && { flexDirection: 'row-reverse' }]}>
          {/* Icon bubble */}
          <View
            style={[
              s.iconBubble,
              {
                backgroundColor: isLocked ? theme.surfaceSoft : withAlpha(theme.accent, 0.16),
                borderColor: isLocked ? theme.border : withAlpha(theme.accent, 0.34),
              },
            ]}>
            <Ionicons name={isLocked ? 'lock-closed-outline' : icon} size={22} color={isLocked ? theme.muted : theme.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={[s.unitMeta, isAr && { flexDirection: 'row-reverse' }]}>
              <Text style={[s.unitNum, { color: theme.accent }]}>{isAr ? `الوحدة ${num}` : `Unit ${num}`}</Text>
              <Text style={[s.lessonCount, { color: theme.muted }]}>
                {unit.lessons.length} {isAr ? 'درس' : 'lessons'}
              </Text>
            </View>
            <Text style={[s.unitTopic, { color: theme.text }, isAr && { textAlign: 'right' }]} numberOfLines={2}>
              {isAr ? topicAr : topicEn}
            </Text>

            {/* Progress bar */}
            <View style={[s.progressTrack, { backgroundColor: theme.surfaceSoft }]}>
              <View style={[s.progressFill, { width: `${progress}%` as any, backgroundColor: isStarted ? theme.accent : 'transparent' }]} />
            </View>
            <Text style={[s.progressLabel, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
              {isStarted
                ? t('curriculumPercentComplete', { progress })
                : isLocked
                ? t('curriculumLocked')
                : t('curriculumNotStarted')}
            </Text>
          </View>

          {/* Status indicator */}
          <View style={s.statusCol}>
            {isStarted ? (
              <View style={[s.startedBadge, { backgroundColor: theme.accent }]}>
                <Ionicons name="play" size={11} color={theme.primaryInk} />
              </View>
            ) : isLocked ? (
              <Ionicons name="chevron-forward" size={16} color={theme.muted} />
            ) : (
              <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.muted} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CurriculumScreen() {
  // Free users can browse the full curriculum; premium is enforced when opening
  // a locked unit's chapter/lesson (Unit 1 is free).
  return <CurriculumContent />;
}

function CurriculumContent() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const { lessonHistory } = useScoreHistory();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 850);
    return () => clearTimeout(t);
  }, []);

  // Compute real progress per unit from lesson history
  const unitProgress = useMemo(() => {
    const progressMap: Record<string, number> = {};
    const allUnits = [...SEMESTER_1_UNITS, ...SEMESTER_2_UNITS];
    const completedLessonIds = buildCompletedLessonIdSet(lessonHistory);
    for (const unit of allUnits) {
      const completedCount = countCompletedLessonsInUnit(completedLessonIds, unit);
      const pct = unit.lessons.length > 0 ? Math.round((completedCount / unit.lessons.length) * 100) : 0;
      progressMap[unit.id] = pct;
    }
    return progressMap;
  }, [lessonHistory]);

  const totalLessons = [...SEMESTER_1_UNITS, ...SEMESTER_2_UNITS].reduce((acc, u) => acc + u.lessons.length, 0);
  const totalUnits = SEMESTER_1_UNITS.length + SEMESTER_2_UNITS.length;
  const overallProgress = Math.round(
    Object.values(unitProgress).reduce((a, b) => a + b, 0) / totalUnits
  );

  const completedUnits = Object.values(unitProgress).filter((p) => p === 100).length;
  const latestUnit = [...SEMESTER_1_UNITS, ...SEMESTER_2_UNITS].find((u) => (unitProgress[u.id] ?? 0) > 0 && (unitProgress[u.id] ?? 0) < 100);
  const latestPct = latestUnit ? (unitProgress[latestUnit.id] ?? 0) : 0;

  const sem1Progress = Math.round(
    SEMESTER_1_UNITS.reduce((s, u) => s + (unitProgress[u.id] ?? 0), 0) / SEMESTER_1_UNITS.length
  );
  const sem2Progress = Math.round(
    SEMESTER_2_UNITS.reduce((s, u) => s + (unitProgress[u.id] ?? 0), 0) / SEMESTER_2_UNITS.length
  );
  const semester1Drill = getExamBlueprint('wb1-drill');
  const semester2Drill = getExamBlueprint('wb2-drill');
  const mixedSimulator = getExamBlueprint('tawjihi-full');
  const featuredUnit = SEMESTER_1_UNITS[0];
  const featuredLesson = featuredUnit?.lessons[0] ?? null;
  const featuredProgress = featuredUnit ? (unitProgress[featuredUnit.id] ?? 0) : 0;

  if (showSkeleton) {
    return (
      <View style={[s.container, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.header, isAr && s.rowRtl]}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: theme.text }]}>{t('curriculumTitle')}</Text>
            <LanguageToggle />
          </View>

          <View style={[s.overviewCard, { backgroundColor: theme.surface }]}>
            <SkeletonBlock style={{ height: 20, width: '52%', marginBottom: 10 }} />
            <SkeletonBlock style={{ height: 14, width: '70%', marginBottom: 16 }} />
            <SkeletonBlock style={{ height: 8, width: '100%', marginBottom: 10 }} />
            <SkeletonBlock style={{ height: 12, width: '32%' }} />
          </View>

          <View style={s.statsRow}>
            <SkeletonBlock style={{ height: 72, flex: 1 }} />
            <SkeletonBlock style={{ height: 72, flex: 1 }} />
            <SkeletonBlock style={{ height: 72, flex: 1 }} />
            <SkeletonBlock style={{ height: 72, flex: 1 }} />
          </View>

          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.unitCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <View style={s.unitCardInner}>
                <SkeletonBlock style={{ width: 48, height: 48, borderRadius: 24 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonBlock style={{ height: 12, width: '45%', marginBottom: 6 }} />
                  <SkeletonBlock style={{ height: 18, width: '80%', marginBottom: 8 }} />
                  <SkeletonBlock style={{ height: 4, width: '100%', marginBottom: 6 }} />
                  <SkeletonBlock style={{ height: 11, width: '40%' }} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, isAr && s.rowRtl]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: theme.text }]}>
            {t('curriculumTitle')}
          </Text>
          <LanguageToggle />
        </View>

        {/* Overview card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient colors={theme.primary} style={s.overviewCard}>
            <View style={s.overviewTop}>
              <View
                style={[
                  s.overviewIconCircle,
                  { backgroundColor: withAlpha(theme.primaryInk, theme.id === 'light' ? 0.14 : 0.18) },
                ]}>
                <Ionicons name="school" size={28} color={theme.primaryInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.overviewGrade, { color: theme.primaryInk }]}>{t('curriculumGrade12Math')}</Text>
                <Text style={[s.overviewSub, { color: withAlpha(theme.primaryInk, 0.76) }]}>
                  {t('curriculumOverviewSummary', { units: totalUnits, lessons: totalLessons })}
                </Text>
              </View>
            </View>
            {/* Overall progress bar */}
            <View style={[s.overviewTrack, { backgroundColor: withAlpha(theme.primaryInk, theme.id === 'light' ? 0.18 : 0.26) }]}>
              <View style={[s.overviewFill, { width: `${overallProgress}%` as any, backgroundColor: theme.primaryInk }]} />
            </View>
            <View style={[s.overviewPctRow, isAr && s.rowRtl]}>
              <Text style={[s.overviewPctLabel, { color: withAlpha(theme.primaryInk, 0.72) }]}>{t('curriculumOverallProgress')}</Text>
              <Text style={[s.overviewPct, { color: theme.primaryInk }]}>{overallProgress}%</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {featuredUnit && featuredLesson ? (
          <View style={[s.demoRouteCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.22) }]}>
            <LinearGradient
              colors={[withAlpha(theme.accent, 0.16), withAlpha(theme.accent, 0.02)]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[s.demoRouteTop, isAr && s.rowRtl]}>
              <View style={[s.demoRouteBadge, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.24) }, isAr && s.demoRouteBadgeRtl]}>
                <Ionicons name="sparkles-outline" size={14} color={theme.accent} />
                <Text style={[s.demoRouteBadgeText, { color: theme.accent }]}>
                  {isAr ? 'المسار الموصى به' : 'Recommended Path'}
                </Text>
              </View>
              <Text style={[s.demoRouteProgress, { color: theme.muted }]}>
                {featuredProgress > 0
                  ? (isAr ? `${featuredProgress}% مكتمل` : `${featuredProgress}% complete`)
                  : (isAr ? 'ابدأ من هنا' : 'Start here')}
              </Text>
            </View>
            <Text style={[s.demoRouteTitle, { color: theme.text }, isAr && s.textRtl]}>
              {isAr ? 'ابدأ من الوحدة 1 ثم أكمل التمرين القصير واختبار المراجعة للفصل الأول.' : 'Start with Unit 1, then follow it with the short practice session and Semester 1 review drill.'}
            </Text>
            <Text style={[s.demoRouteSub, { color: theme.muted }, isAr && s.textRtl]}>
              {isAr
                ? `${featuredLesson.titleAr} · ${semester1Drill.questions} سؤال في اختبار المراجعة`
                : `${featuredLesson.titleEn} · ${semester1Drill.questions}-question review drill`}
            </Text>
            <View style={[s.demoRouteActions, isAr && s.rowRtl]}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/chapter', params: { unitId: featuredUnit.id } })}>
                <LinearGradient colors={theme.primary} style={s.demoRoutePrimary}>
                  <Ionicons name="book-outline" size={16} color={theme.primaryInk} />
                  <Text style={[s.demoRoutePrimaryText, { color: theme.primaryInk }]}>
                    {isAr ? 'افتح الوحدة 1' : 'Open Unit 1'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/lesson-player',
                    params: { unitId: featuredUnit.id, lessonId: featuredLesson.id },
                  })
                }
                style={[s.demoRouteSecondary, { borderColor: theme.border, backgroundColor: withAlpha(theme.bg, 0.28) }]}>
                <Text style={[s.demoRouteSecondaryText, { color: theme.text }]}>
                  {isAr ? 'ابدأ الدرس الأول' : 'Start First Lesson'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Stats pills */}
        <View style={[s.statsRow, isAr && s.rowRtl]}>
          {[
            { icon: 'book-outline' as const, val: `${totalUnits}`, label: t('curriculumUnits') },
            { icon: 'play-outline' as const, val: `${totalLessons}`, label: t('curriculumLessons') },
            { icon: 'checkmark-done-outline' as const, val: String(completedUnits), label: t('curriculumDone') },
            { icon: 'flame-outline' as const, val: latestUnit ? `${latestPct}%` : '—', label: t('curriculumActive') },
          ].map((stat) => (
            <View key={stat.label} style={[s.statPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name={stat.icon} size={16} color={theme.accent} />
              <Text style={[s.statVal, { color: theme.accent }]}>{stat.val}</Text>
              <Text style={[s.statLabel, { color: theme.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Semester 1 */}
        <View style={[s.semesterHeader, isAr && s.rowRtl]}>
          <LinearGradient colors={theme.primary} style={s.semBadge}>
            <Text style={[s.semBadgeText, { color: theme.primaryInk }]}>{isAr ? 'الفصل الأول' : 'Semester 1'}</Text>
          </LinearGradient>
          <View style={[s.semProgress, { backgroundColor: theme.surfaceSoft }]}>
            <View style={[s.semProgressFill, { width: `${sem1Progress}%` as any, backgroundColor: theme.accent }]} />
          </View>
          <Text style={[s.semPct, { color: sem1Progress > 0 ? theme.accent : theme.muted }]}>{sem1Progress}%</Text>
        </View>

        {SEMESTER_1_UNITS.map((unit, i) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isAr={isAr}
            index={i}
            progress={unitProgress[unit.id] ?? 0}
            onPress={() => router.push({ pathname: '/chapter', params: { unitId: unit.id } })}
          />
        ))}

        {/* Semester 2 */}
        <View style={[s.semesterHeader, s.semesterHeader2, isAr && s.rowRtl]}>
          <LinearGradient colors={theme.primary} style={s.semBadge}>
            <Text style={[s.semBadgeText, { color: theme.primaryInk }]}>{isAr ? 'الفصل الثاني' : 'Semester 2'}</Text>
          </LinearGradient>
          <View style={[s.semProgress, { backgroundColor: theme.surfaceSoft }]}>
            <View style={[s.semProgressFill, { width: `${sem2Progress}%` as any, backgroundColor: theme.accent }]} />
          </View>
          <Text style={[s.semPct, { color: sem2Progress > 0 ? theme.accent : theme.muted }]}>{sem2Progress}%</Text>
        </View>

        {SEMESTER_2_UNITS.map((unit, i) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isAr={isAr}
            index={SEMESTER_1_UNITS.length + i}
            progress={unitProgress[unit.id] ?? 0}
            onPress={() => router.push({ pathname: '/chapter', params: { unitId: unit.id } })}
          />
        ))}

        {/* Live resources */}
        <View style={[s.lockedSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.lockedHeader, isAr && s.rowRtl]}>
            <View style={[s.lockIconCircle, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
              <Ionicons name="library-outline" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.lockedTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                {t('curriculumResourcesTitle')}
              </Text>
              <Text style={[s.lockedSub, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
                {t('curriculumResourcesSub')}
              </Text>
            </View>
          </View>
          {[
            {
              key: 'textbook',
              icon: 'document-text-outline' as const,
              title: t('curriculumTextbook'),
              subtitle: t('curriculumTextbookSub'),
              onPress: () => router.push('/textbook'),
            },
            {
              key: semester1Drill.id,
              icon: 'flash-outline' as const,
              title: isAr ? semester1Drill.titleAr : semester1Drill.titleEn,
              subtitle: isAr
                ? `${semester1Drill.questions} سؤال · ${semester1Drill.minutes} دقيقة`
                : `${semester1Drill.questions} questions · ${semester1Drill.minutes} min`,
              onPress: () => router.push({ pathname: '/exam', params: { examId: semester1Drill.id } }),
            },
            {
              key: semester2Drill.id,
              icon: 'flash-outline' as const,
              title: isAr ? semester2Drill.titleAr : semester2Drill.titleEn,
              subtitle: isAr
                ? `${semester2Drill.questions} سؤال · ${semester2Drill.minutes} دقيقة`
                : `${semester2Drill.questions} questions · ${semester2Drill.minutes} min`,
              onPress: () => router.push({ pathname: '/exam', params: { examId: semester2Drill.id } }),
            },
            {
              key: mixedSimulator.id,
              icon: 'school-outline' as const,
              title: isAr ? mixedSimulator.titleAr : mixedSimulator.titleEn,
              subtitle: isAr
                ? `${mixedSimulator.questions} سؤال حقيقي من بنك الأسئلة الحالي`
                : `${mixedSimulator.questions} live-bank questions available now`,
              onPress: () => router.push({ pathname: '/exam', params: { examId: mixedSimulator.id } }),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              onPress={item.onPress}
              style={[s.lockedRow, { borderColor: theme.border }, isAr && s.rowRtl]}>
              <Ionicons name={item.icon} size={16} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[s.lockedRowText, { color: theme.text }, isAr && { textAlign: 'right' }]}>{item.title}</Text>
                <Text style={[s.lockedSub, { color: theme.muted }, isAr && { textAlign: 'right' }]}>{item.subtitle}</Text>
              </View>
              <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, direction: 'ltr' },
  scroll: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  rowRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Overview card
  overviewCard: { borderRadius: 22, padding: 18, marginBottom: 14 },
  overviewTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  overviewIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  overviewGrade: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  overviewSub: { fontSize: 13, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  overviewTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  overviewFill: { height: '100%', borderRadius: 4 },
  overviewPctRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewPctLabel: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  overviewPct: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statPill: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Amiri_400Regular', textAlign: 'center' },
  demoRouteCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, overflow: 'hidden' },
  demoRouteTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  demoRouteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  demoRouteBadgeRtl: { flexDirection: 'row-reverse' },
  demoRouteBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  demoRouteProgress: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  demoRouteTitle: { fontSize: 16, lineHeight: 24, fontFamily: 'Amiri_700Bold', marginBottom: 6 },
  demoRouteSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', marginBottom: 14 },
  demoRouteActions: { flexDirection: 'row', gap: 10 },
  demoRoutePrimary: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  demoRoutePrimaryText: { fontSize: 14, fontFamily: 'Amiri_700Bold' },
  demoRouteSecondary: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  demoRouteSecondaryText: { fontSize: 14, fontFamily: 'Amiri_700Bold' },

  // Semester header
  semesterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  semesterHeader2: { marginTop: 20 },
  semBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  semBadgeText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  semProgress: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  semProgressFill: { height: '100%', borderRadius: 3 },
  semPct: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Unit card
  unitCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: '#1A1F3E', marginBottom: 10, overflow: 'hidden' },
  unitCardLocked: { opacity: 0.65 },
  unitCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  iconBubble: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  unitMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  unitNum: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.3 },
  lessonCount: { fontSize: 11, fontFamily: 'Amiri_400Regular' },
  unitTopic: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 22, marginBottom: 8 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: 'Amiri_400Regular' },
  statusCol: { flexShrink: 0 },
  startedBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Locked section
  lockedSection: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 12 },
  lockedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  lockIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C2140', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lockedTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  lockedSub: { fontSize: 12, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  lockedRowText: { fontSize: 14, fontFamily: 'Amiri_400Regular' },
  textRtl: { textAlign: 'right' },
});
