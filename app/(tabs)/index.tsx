import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useXP } from '../../src/hooks/useXP';
import { useScoreHistory } from '../../src/hooks/useScoreHistory';
import { SEMESTER_1_UNITS, SEMESTER_2_UNITS, type Grade12Unit } from '../../src/data/grade12';
import type { AppTheme } from '../../src/theme/themes';
import { withAlpha } from '../../src/theme/colorUtils';
import { buildCompletedLessonIdSet, isLessonCompleted } from '../../src/utils/lessonProgress';

const WHITE = '#FFFFFF';
const SUCCESS = '#2ED573';
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const CALENDAR_LOCALE_EN = 'en-US';
const CALENDAR_LOCALE_AR = 'ar-JO';
const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
const ENGLISH_DAY_FONT = Platform.select({
  ios: 'AvenirNext-Medium',
  android: 'sans-serif-medium',
  default: undefined,
});

function stripUnitPrefix(title: string, isAr: boolean) {
  return isAr
    ? title.replace(/^الوحدة\s+\d+\s*·\s*/, '')
    : title.replace(/^Unit\s+\d+\s*·\s*/, '');
}

function Day({
  label,
  kind,
  theme,
  isAr,
}: {
  label: string;
  kind: 'today' | 'done' | 'idle';
  theme: AppTheme;
  isAr: boolean;
}) {
  return (
    <View style={s.dayCol}>
      <View
        style={[
          s.dayCircle,
          { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
          kind === 'today' && { borderColor: theme.accent, backgroundColor: withAlpha(theme.accent, 0.12) },
          kind === 'done' && s.dayDone,
        ]}>
        {kind === 'done' ? (
          <Ionicons name="checkmark" size={13} color={SUCCESS} />
        ) : kind === 'today' ? (
          <View style={[s.dayDot, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={s.dayIdleDot} />
        )}
      </View>
      <Text
        style={[
          s.dayLabel,
          { color: kind === 'today' ? theme.accent : theme.muted },
          isAr && s.dayLabelAr,
          kind === 'today' && s.dayLabelToday,
          isAr && kind === 'today' && s.dayLabelTodayAr,
        ]}>
        {label}
      </Text>
    </View>
  );
}

export default function ForYouScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t: tRaw, isAr } = useT() as any;
  const t = tRaw as (key: string, values?: Record<string, string | number>) => string;
  const [userName, setUserName] = useState('');
  const { streak, totalXP, level, xpProgress, xpToNext, activeDays } = useXP();
  const { lessonHistory } = useScoreHistory();
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const localizedUserName = userName
    ? isAr
      ? ` \u2068${userName}\u2069`
      : ` ${userName}`
    : '';

  const greetingTitle = isAr ? `مرحباً${localizedUserName}` : `Hello${localizedUserName}`;
  const headerSupport = isAr
    ? 'واجهة اليوم مصممة لتوصلك مباشرة إلى الخطوة التالية.'
    : 'Today is organised to take you straight to the next best step.';

  useEffect(() => {
    AsyncStorage.getItem('@snapmath_name').then((value) => {
      if (value) setUserName(value);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  useEffect(() => {
    Animated.spring(xpBarAnim, {
      toValue: xpProgress,
      useNativeDriver: false,
      friction: 6,
    }).start();
  }, [xpBarAnim, xpProgress]);

  const allUnits = useMemo(() => [...SEMESTER_1_UNITS, ...SEMESTER_2_UNITS], []);
  const completedLessonIds = useMemo(
    () => buildCompletedLessonIdSet(lessonHistory),
    [lessonHistory]
  );

  const recommendedUnit = useMemo<Grade12Unit>(() => {
    return (
      allUnits.find((unit) => unit.lessons.some((lesson) => !isLessonCompleted(completedLessonIds, lesson))) ??
      allUnits[0]
    );
  }, [allUnits, completedLessonIds]);

  const nextLesson = useMemo(() => {
    return (
      recommendedUnit.lessons.find((lesson) => !isLessonCompleted(completedLessonIds, lesson)) ??
      recommendedUnit.lessons[0]
    );
  }, [recommendedUnit, completedLessonIds]);

  const recommendedCompleted = useMemo(() => {
    return recommendedUnit.lessons.filter((lesson) => isLessonCompleted(completedLessonIds, lesson)).length;
  }, [recommendedUnit, completedLessonIds]);

  const recommendedTotal = recommendedUnit.lessons.length;
  const recommendedPct = recommendedTotal > 0 ? Math.round((recommendedCompleted / recommendedTotal) * 100) : 0;

  const totalLessonsCount = useMemo(
    () => allUnits.reduce((sum, unit) => sum + unit.lessons.length, 0),
    [allUnits]
  );
  const completedLessonsCount = useMemo(() => {
    return allUnits.reduce(
      (sum, unit) => sum + unit.lessons.filter((lesson) => isLessonCompleted(completedLessonIds, lesson)).length,
      0,
    );
  }, [allUnits, completedLessonIds]);
  const overallPct = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  const weekDays = useMemo(() => {
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    const activeDaySet = new Set(activeDays);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekdayLabels = isAr ? WEEKDAY_LABELS_AR : WEEKDAY_LABELS_EN;

    return Array.from({ length: 7 }, (_, index) => {
      const nextDay = new Date(weekStart);
      nextDay.setDate(weekStart.getDate() + index);
      const iso = nextDay.toISOString().slice(0, 10);
      const dayIndex = nextDay.getDay();
      const kind: 'today' | 'done' | 'idle' =
        iso === todayISO ? 'today' : activeDaySet.has(iso) ? 'done' : 'idle';

      return {
        iso,
        label: weekdayLabels[dayIndex],
        kind,
      };
    });
  }, [activeDays, isAr]);

  const activeWeekCount = weekDays.filter((day) => day.kind !== 'idle').length;
  const isLightTheme = theme.id === 'light';
  const heroInk = theme.primaryInk;
  const heroMuted = withAlpha(theme.primaryInk, theme.primaryInk === WHITE ? 0.82 : 0.74);
  const cardShadowColor = isLightTheme ? withAlpha(theme.accent, 0.18) : theme.logoShadow;
  const heroCtaBg = isLightTheme ? withAlpha(WHITE, 0.96) : heroInk;
  const heroCtaInk = isLightTheme ? theme.primary[1] : WHITE;
  const calendarLocale = isAr ? CALENDAR_LOCALE_AR : CALENDAR_LOCALE_EN;
  const lightTintOpacity = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0.16],
    extrapolate: 'clamp',
  });
  const recommendedUnitLabel = isAr ? `الوحدة ${recommendedUnit.id.slice(1)}` : `Unit ${recommendedUnit.id.slice(1)}`;
  const recommendedUnitTitle = stripUnitPrefix(isAr ? recommendedUnit.titleAr : recommendedUnit.titleEn, isAr);
  const nextLessonTitle = isAr ? nextLesson.titleAr : nextLesson.titleEn;
  const heroMeta = recommendedPct > 0
    ? (isAr ? 'أكمل من حيث توقفت' : 'Continue where you left off')
    : (isAr ? 'أفضل بداية الآن' : 'Best place to start');
  const heroSub = isAr
    ? `ابدأ بدرس ${nextLessonTitle}، ثم أكمل مجموعة تدريب قصيرة لتثبيت الفكرة.`
    : `Start with ${nextLessonTitle}, then finish one short practice set to lock it in.`;
  const heroCta = recommendedPct > 0
    ? (isAr ? 'تابع هذه الوحدة' : 'Continue this unit')
    : (isAr ? 'ابدأ هذه الوحدة' : 'Start this unit');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, direction: 'ltr' }}>
      {theme.id === 'light' ? (
        <Animated.View pointerEvents="none" style={[s.lightTintOverlay, { opacity: lightTintOpacity }]}>
          <LinearGradient
            colors={[withAlpha(theme.primary[0], 0.22), withAlpha(theme.accent, 0.14), 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
      <AnimatedScrollView
        ref={scrollRef}
        style={[s.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}>
        <View
          style={[
            s.headerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: cardShadowColor,
              shadowOpacity: isLightTheme ? 0.07 : 0.12,
              shadowRadius: isLightTheme ? 12 : 18,
              shadowOffset: { width: 0, height: isLightTheme ? 6 : 10 },
              elevation: isLightTheme ? 4 : 8,
            },
          ]}>
          <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']} style={StyleSheet.absoluteFillObject} />

          <View style={[s.headerTopRow, isAr && s.rowReverse]}>
            <View style={[s.headerTextWrap, isAr && s.headerTextWrapRtl]}>
              <Text style={[s.headerDate, { color: theme.muted }, isAr && s.textRtl, isAr && s.headerDateAr]}>
                {new Date().toLocaleDateString(calendarLocale, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={[s.headerGreeting, { color: theme.text }, isAr && s.textRtl]}>{greetingTitle}</Text>
              <Text style={[s.headerSupport, { color: theme.muted }, isAr && s.textRtl]}>{headerSupport}</Text>
            </View>

            <View style={[s.metricRow, isAr && s.rowReverse]}>
              <View
                style={[
                  s.metricChip,
                  { backgroundColor: theme.surfaceSoft, borderColor: streak > 0 ? 'rgba(255,107,61,0.35)' : theme.border },
                  streak > 0 && s.metricChipActive,
                ]}>
                <Ionicons name="flame" size={15} color={streak > 0 ? '#FF6B3D' : theme.accent} />
                <Text style={[s.metricValue, { color: streak > 0 ? '#FF6B3D' : theme.text }]}>{streak}</Text>
              </View>

              <View style={[s.metricChip, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                <Ionicons name="star" size={15} color={theme.accent} />
                <Text style={[s.metricValue, { color: theme.text }]}>{totalXP}</Text>
              </View>
            </View>
          </View>

          <View style={s.progressBlock}>
            <View style={[s.progressRow, isAr && s.rowReverse]}>
              <Text style={[s.progressLabel, { color: theme.muted }, isAr && s.textRtl]}>
                {t('homeLevelProgress', { level, xp: xpToNext })}
              </Text>
              <Text style={[s.progressPct, { color: theme.text }]}>{Math.round(xpProgress * 100)}%</Text>
            </View>

            <View style={[s.progressTrack, { backgroundColor: theme.surfaceSoft }]}>
              <Animated.View
                style={[
                  s.progressFill,
                  {
                    backgroundColor: theme.accent,
                    width: xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
          </View>

          <View style={[s.weekPanel, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <View style={[s.weekHeaderRow, isAr && s.rowReverse]}>
              <Text style={[s.weekTitle, { color: theme.text }]}>{isAr ? 'هذا الأسبوع' : 'This Week'}</Text>
              <Text style={[s.weekMeta, { color: theme.muted }]}>
                {isAr ? `${activeWeekCount}/7 أيام نشطة` : `${activeWeekCount}/7 active days`}
              </Text>
            </View>

            <View style={[s.weekDayRow, isAr && s.rowReverse]}>
              {weekDays.map((day) => (
                <Day key={day.iso} label={day.label} kind={day.kind} theme={theme} isAr={isAr} />
              ))}
            </View>
          </View>
        </View>

        <LinearGradient
          colors={[theme.primary[0], theme.primary[1]]}
          style={[
            s.heroCard,
            {
              shadowColor: cardShadowColor,
              shadowOpacity: isLightTheme ? 0.1 : 0.16,
              shadowRadius: isLightTheme ? 14 : 20,
              shadowOffset: { width: 0, height: isLightTheme ? 8 : 12 },
              elevation: isLightTheme ? 6 : 10,
            },
          ]}>
          <View style={[s.heroBadgeRow, isAr && s.rowReverse]}>
            <View style={s.heroBadge}>
              <Ionicons name="sparkles" size={13} color={heroInk} />
              <Text style={[s.heroBadgeText, { color: heroInk }]}>{isAr ? 'موصى به اليوم' : 'Recommended Today'}</Text>
            </View>
            <Text style={[s.heroMeta, { color: heroMuted }, isAr && s.textRtl]}>{heroMeta}</Text>
          </View>

          <Text style={[s.heroEyebrow, { color: heroMuted }, isAr && s.textRtl]}>
            {isAr ? `أفضل خطوة الآن · ${recommendedUnitLabel}` : `Best next step · ${recommendedUnitLabel}`}
          </Text>
          <Text style={[s.heroTitle, { color: heroInk }, isAr && s.textRtl]}>{recommendedUnitTitle}</Text>
          <Text style={[s.heroSub, { color: heroMuted }, isAr && s.textRtl]}>{heroSub}</Text>

          <View style={s.heroLessonCard}>
            <View style={[s.heroLessonRow, isAr && s.rowReverse]}>
              <Text style={[s.heroLessonLabel, { color: heroMuted }]}>{isAr ? 'الدرس التالي' : 'Next lesson'}</Text>
              <Text style={[s.heroLessonCount, { color: heroInk }]}>
                {isAr
                  ? `${recommendedCompleted}/${recommendedTotal} مكتمل`
                  : `${recommendedCompleted}/${recommendedTotal} completed`}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[s.heroLessonTitle, { color: heroInk }, isAr && s.textRtl]}>
              {nextLessonTitle}
            </Text>

            <View style={s.heroLessonTrack}>
              <View style={[s.heroLessonFill, { width: `${recommendedPct}%`, backgroundColor: heroInk }]} />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              s.heroCta,
              {
                backgroundColor: heroCtaBg,
                borderWidth: isLightTheme ? 1 : 0,
                borderColor: isLightTheme ? withAlpha(theme.primary[1], 0.14) : 'transparent',
              },
              isAr && s.rowReverse,
            ]}
            onPress={() => router.push({ pathname: '/chapter', params: { unitId: recommendedUnit.id } })}>
            <Text style={[s.heroCtaText, { color: heroCtaInk }]}>{heroCta}</Text>
            <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={16} color={heroCtaInk} />
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/curriculum')}
          style={[s.utilityCard, s.journeyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.journeyTopRow, isAr && s.rowReverse]}>
            <View style={[s.journeyIconWrap, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
              <Ionicons name="map-outline" size={20} color={theme.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[s.utilityEyebrow, { color: theme.accent }, isAr && s.textRtl]}>
                {isAr ? 'التقدم الكلي' : 'Overall progress'}
              </Text>
              <Text style={[s.utilityTitle, { color: theme.text }, isAr && s.textRtl]}>
                {t('curriculumTitle')}
              </Text>
              <Text style={[s.utilitySub, { color: theme.muted }, isAr && s.textRtl]}>
                {t('homeJourneyMeta')}
              </Text>
            </View>

            <Text style={[s.journeyPercent, { color: theme.text }]}>{overallPct}%</Text>
          </View>

          <View style={[s.journeyTrack, { backgroundColor: theme.surfaceSoft }]}>
            <LinearGradient colors={[theme.primary[0], theme.primary[1]]} style={[s.journeyFill, { width: `${overallPct}%` }]} />
          </View>

          <View style={[s.journeyFooter, isAr && s.rowReverse]}>
            <Text style={[s.journeyFooterText, { color: theme.muted }, isAr && s.textRtl]}>
              {t('homeLessonsCount', { completed: completedLessonsCount, total: totalLessonsCount })}
            </Text>
            <View style={[s.journeyCta, isAr && s.rowReverse]}>
              <Text style={[s.journeyCtaText, { color: theme.accent }]}>
                {t('openCurriculum')}
              </Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={14} color={theme.accent} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/mathscan')}
          activeOpacity={0.9}
          style={[s.utilityCard, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && s.rowReverse]}>
          <View style={[s.utilityIconBox, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
            <View style={[s.utilityIconGlow, { backgroundColor: withAlpha(theme.accent, 0.08) }]} />
            <Ionicons name="scan" size={22} color={theme.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[s.utilityEyebrow, { color: theme.accent }, isAr && s.textRtl]}>
              {isAr ? 'أداة سريعة' : 'Quick tool'}
            </Text>
            <Text style={[s.utilityTitle, { color: theme.text }, isAr && s.textRtl]}>MathScan</Text>
            <Text style={[s.utilitySub, { color: theme.muted }, isAr && s.textRtl]}>
              {t('homeMathScanSub')}
            </Text>
          </View>

          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.accent} />
        </TouchableOpacity>
      </AnimatedScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  lightTintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    zIndex: 0,
  },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

  rowReverse: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },

  headerCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    marginBottom: 18,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  headerTextWrap: { flex: 1 },
  headerTextWrapRtl: { alignItems: 'flex-end' },
  headerDate: { fontSize: 12, letterSpacing: 0.2, marginBottom: 4, fontFamily: ENGLISH_DAY_FONT },
  headerDateAr: { fontFamily: 'Amiri_700Bold', letterSpacing: 0 },
  headerGreeting: { fontSize: 28, lineHeight: 34, fontFamily: 'Amiri_700Bold' },
  headerSupport: { fontSize: 13, lineHeight: 20, marginTop: 4, fontFamily: 'Amiri_400Regular' },

  metricRow: { flexDirection: 'row', gap: 8 },
  metricChip: {
    minWidth: 54,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  metricChipActive: { backgroundColor: 'rgba(255,107,61,0.08)' },
  metricValue: { fontSize: 14, fontFamily: 'Amiri_700Bold' },

  progressBlock: { marginBottom: 16 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  progressLabel: { flex: 1, fontSize: 12, lineHeight: 18, fontFamily: 'Amiri_400Regular' },
  progressPct: { fontSize: 13, fontFamily: 'Amiri_700Bold' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },

  weekPanel: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  weekTitle: { fontSize: 15, fontFamily: 'Amiri_700Bold' },
  weekMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  weekDayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', flex: 1 },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDone: { borderColor: 'rgba(46,213,115,0.42)', backgroundColor: 'rgba(46,213,115,0.16)' },
  dayDot: { width: 8, height: 8, borderRadius: 4 },
  dayIdleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(143,151,180,0.7)' },
  dayLabel: { fontSize: 12, marginTop: 8, fontFamily: ENGLISH_DAY_FONT, letterSpacing: 0.2 },
  dayLabelAr: { fontFamily: 'Amiri_700Bold', letterSpacing: 0 },
  dayLabelToday: { fontFamily: ENGLISH_DAY_FONT },
  dayLabelTodayAr: { fontFamily: 'Amiri_700Bold' },

  heroCard: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  heroMeta: { flex: 1, fontSize: 12, fontFamily: 'Amiri_400Regular' },
  heroEyebrow: { fontSize: 12, marginBottom: 6, fontFamily: 'Amiri_700Bold' },
  heroTitle: { fontSize: 28, lineHeight: 34, marginBottom: 8, fontFamily: 'Amiri_700Bold' },
  heroSub: { fontSize: 14, lineHeight: 22, marginBottom: 16, fontFamily: 'Amiri_400Regular' },
  heroLessonCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  heroLessonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  heroLessonLabel: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  heroLessonCount: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  heroLessonTitle: { fontSize: 18, marginBottom: 10, fontFamily: 'Amiri_700Bold' },
  heroLessonTrack: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.22)' },
  heroLessonFill: { height: '100%', borderRadius: 999 },
  heroCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  heroCtaText: { fontSize: 14, fontFamily: 'Amiri_700Bold' },

  utilityCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  utilityIconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  utilityIconGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  utilityEyebrow: { fontSize: 12, marginBottom: 4, fontFamily: 'Amiri_700Bold' },
  utilityTitle: { fontSize: 20, marginBottom: 2, fontFamily: 'Amiri_700Bold' },
  utilitySub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },

  journeyCard: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  },
  journeyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  journeyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  journeyPercent: { fontSize: 20, fontFamily: 'Amiri_700Bold' },
  journeyTrack: { height: 10, borderRadius: 999, overflow: 'hidden', marginBottom: 12 },
  journeyFill: { height: '100%', borderRadius: 999 },
  journeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  journeyFooterText: { flex: 1, fontSize: 12, fontFamily: 'Amiri_400Regular' },
  journeyCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  journeyCtaText: { fontSize: 13, fontFamily: 'Amiri_700Bold' },
});
