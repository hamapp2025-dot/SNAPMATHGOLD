import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import SnapMathLogo from '../components/SnapMathLogo';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import type { AppTheme } from '../src/theme/themes';
import { withAlpha } from '../src/theme/colorUtils';
import { getThemeSemantics } from '../src/theme/themeSemantics';

const { width: SW } = Dimensions.get('window');
const WHITE = '#FFFFFF';
const TOTAL_STEPS = 4;
export const ONBOARDING_KEY = '@snapmath_onboarding_done';

// ─── Data ────────────────────────────────────────────────────────────────────
const GRADES = [
  { id: 'g10', labelEn: 'Grade 10', labelAr: 'الصف العاشر', icon: 'school-outline' },
  { id: 'g11', labelEn: 'Grade 11', labelAr: 'الصف الحادي عشر', icon: 'school-outline' },
  { id: 'g12', labelEn: 'Grade 12 · Tawjihi', labelAr: 'الصف الثاني عشر · توجيهي', icon: 'ribbon-outline' },
];

const AVATAR_COLORS = ['#0A7AFF', '#2590FF', '#4F8CFF', '#2CC5FF', '#5B8FF9', '#4BC4B5', '#7A88FF'];

const GOALS = [
  { id: '10', labelEn: '10 min / day', labelAr: '١٠ دقائق / يوم', icon: 'flash-outline' },
  { id: '20', labelEn: '20 min / day', labelAr: '٢٠ دقيقة / يوم', icon: 'flame-outline' },
  { id: '30', labelEn: '30 min / day', labelAr: '٣٠ دقيقة / يوم', icon: 'trending-up-outline' },
  { id: '60', labelEn: '1 hour / day', labelAr: 'ساعة / يوم', icon: 'trophy-outline' },
];

const UNITS = [
  { id: 'u1', labelEn: 'Functions & Algebra', labelAr: 'الدوال والجبر', symbol: 'f(x)' },
  { id: 'u2', labelEn: 'Trig Identities', labelAr: 'المتطابقات المثلثية', symbol: 'sin θ' },
  { id: 'u3', labelEn: 'Differentiation', labelAr: 'التفاضل', symbol: "f'(x)" },
  { id: 'u4', labelEn: 'Complex Numbers', labelAr: 'الأعداد المركبة', symbol: 'z' },
  { id: 'u5', labelEn: 'Integration', labelAr: 'التكامل', symbol: '∫' },
  { id: 'u6', labelEn: 'Vectors', labelAr: 'المتجهات', symbol: 'v⃗' },
];

// ─── Shared step header ───────────────────────────────────────────────────────
function StepHeader({ step, theme }: { step: number; theme: AppTheme }) {
  const progress = useRef(new Animated.Value((step - 1) / TOTAL_STEPS)).current;
  const [trackWidth, setTrackWidth] = useState(280);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: step / TOTAL_STEPS,
      useNativeDriver: false,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [step]);

  return (
    <View
      style={sh.wrap}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - 48)}>
      {/* Track */}
      <View style={[sh.track, { width: trackWidth, backgroundColor: theme.surfaceSoft }]}>
        <Animated.View
          style={[
            sh.fill,
            {
              backgroundColor: theme.accent,
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, trackWidth],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>
      {/* Step label */}
      <Text style={[sh.label, { color: theme.muted }]}>
        {step}/{TOTAL_STEPS}
      </Text>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 24,
  },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
    minWidth: 28,
    textAlign: 'right',
  },
});

// ─── Step 1: Grade selector ───────────────────────────────────────────────────
function Step1({
  selected,
  onSelect,
  isAr,
  theme,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  isAr: boolean;
  theme: AppTheme;
}) {
  const { t } = useT();
  return (
    <View style={s.stepWrap}>
      <View style={s.logoRow}>
        <SnapMathLogo size={72} showLabel={false} animate />
      </View>
      <Text style={[s.stepTitle, { color: theme.text }]}>
        {t('onboardingWelcomeTitle')}
      </Text>
      <Text style={[s.stepSub, { color: theme.muted }]}>
        {t('onboardingWelcomeSub')}
      </Text>

      <View style={s.cardList}>
        {GRADES.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[
                s.gradeCard,
                isAr && s.gradeCardRtl,
                { backgroundColor: active ? withAlpha(theme.accent, 0.18) : theme.surface, borderColor: active ? theme.accent : theme.border },
              ]}
              onPress={() => onSelect(g.id)}
              activeOpacity={0.85}>
              <LinearGradient
                colors={active ? theme.primary : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                style={s.gradeIcon}>
                <Ionicons name={g.icon as any} size={22} color={active ? theme.primaryInk : theme.muted} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.gradeLabel, isAr && s.textRtl, { color: active ? theme.accent : theme.text }]}>
                  {isAr ? g.labelAr : g.labelEn}
                </Text>
                {g.id === 'g12' && (
                  <Text style={[s.gradeSub, isAr && s.textRtl, { color: theme.muted }]}>
                    {t('onboardingGradeTawjihiSub')}
                  </Text>
                )}
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 2: Name + avatar color ─────────────────────────────────────────────
function Step2({
  name,
  setName,
  avatarColor,
  setAvatarColor,
  isAr,
  theme,
}: {
  name: string;
  setName: (v: string) => void;
  avatarColor: string;
  setAvatarColor: (v: string) => void;
  isAr: boolean;
  theme: AppTheme;
}) {
  const { t } = useT();
  return (
    <View style={s.stepWrap}>
      {/* Live avatar preview */}
      <View style={[s.avatarPreview, { backgroundColor: avatarColor }]}>
        <Text style={[s.avatarInitial, { color: theme.primaryInk }]}>
          {name.trim() ? name.trim()[0].toUpperCase() : '?'}
        </Text>
      </View>

      <Text style={[s.stepTitle, { color: theme.text }]}>
        {t('onboardingNameTitle')}
      </Text>
      <Text style={[s.stepSub, { color: theme.muted }]}>
        {t('onboardingNameSub')}
      </Text>

      {/* Name input */}
      <View style={[s.nameInputWrap, isAr && s.nameInputWrapRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="person-outline" size={18} color={theme.muted} />
        <TextInput
          style={[s.nameInput, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}
          placeholder={t('onboardingNamePlaceholder')}
          placeholderTextColor={theme.muted}
          value={name}
          onChangeText={setName}
          maxLength={24}
          autoFocus
        />
      </View>

      {/* Avatar color swatches */}
      <Text style={[s.swatchLabel, isAr && s.textRtl, { color: theme.muted }]}>
        {t('onboardingAvatarColor')}
      </Text>
      <View style={[s.swatches, isAr && s.swatchesRtl]}>
        {AVATAR_COLORS.map((c, index) => (
          <TouchableOpacity
            key={`${c}-${index}`}
            style={[s.swatch, { backgroundColor: c }, avatarColor === c && s.swatchActive]}
            onPress={() => setAvatarColor(c)}
            activeOpacity={0.8}>
            {avatarColor === c && <Ionicons name="checkmark" size={14} color={WHITE} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Step 3: Daily goal ───────────────────────────────────────────────────────
function Step3({
  selected,
  onSelect,
  isAr,
  theme,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  isAr: boolean;
  theme: AppTheme;
}) {
  const { t } = useT();
  return (
    <View style={s.stepWrap}>
      <View style={[s.iconCircle, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.25) }]}>
        <Ionicons name="time-outline" size={40} color={theme.accent} />
      </View>
      <Text style={[s.stepTitle, { color: theme.text }]}>
        {t('onboardingGoalTitle')}
      </Text>
      <Text style={[s.stepSub, { color: theme.muted }]}>
        {t('onboardingGoalSub')}
      </Text>

      <View style={s.cardList}>
        {GOALS.map((g) => {
          const active = selected === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={[
                s.goalCard,
                { backgroundColor: active ? withAlpha(theme.accent, 0.18) : theme.surface, borderColor: active ? theme.accent : theme.border },
                isAr && s.goalCardRtl,
              ]}
              onPress={() => onSelect(g.id)}
              activeOpacity={0.85}>
              <View style={[s.goalIcon, { backgroundColor: active ? theme.accent : theme.surfaceSoft }]}>
                <Ionicons name={g.icon as any} size={20} color={active ? theme.primaryInk : theme.muted} />
              </View>
              <Text style={[s.goalLabel, isAr && s.textRtl, { color: active ? theme.accent : theme.text }]}>
                {isAr ? g.labelAr : g.labelEn}
              </Text>
              {active && !isAr && <Ionicons name="checkmark-circle" size={20} color={theme.accent} style={{ marginLeft: 'auto' }} />}
              {active && isAr && <Ionicons name="checkmark-circle" size={20} color={theme.accent} style={{ marginRight: 'auto' }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 4: First unit picker ────────────────────────────────────────────────
function Step4({
  selected,
  onSelect,
  isAr,
  theme,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  isAr: boolean;
  theme: AppTheme;
}) {
  const { t } = useT();
  return (
    <View style={s.stepWrap}>
      <View style={[s.iconCircle, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.25) }]}>
        <Ionicons name="map-outline" size={40} color={theme.accent} />
      </View>
      <Text style={[s.stepTitle, { color: theme.text }]}>
        {t('onboardingStartTitle')}
      </Text>
      <Text style={[s.stepSub, { color: theme.muted }]}>
        {t('onboardingStartSub')}
      </Text>

      <View style={[s.unitGrid, isAr && s.unitGridRtl]}>
        {UNITS.map((u) => {
          const active = selected === u.id;
          return (
            <TouchableOpacity
              key={u.id}
              style={[
                s.unitCard,
                { backgroundColor: active ? withAlpha(theme.accent, 0.18) : theme.surface, borderColor: active ? theme.accent : theme.border },
              ]}
              onPress={() => onSelect(u.id)}
              activeOpacity={0.85}>
              <Text style={[s.unitSymbol, isAr && s.textRtl, { color: active ? theme.accent : theme.muted }]}>
                {u.symbol}
              </Text>
              <Text style={[s.unitLabel, isAr && s.textRtl, { color: active ? theme.accent : theme.text }]} numberOfLines={2}>
                {isAr ? u.labelAr : u.labelEn}
              </Text>
              {active && (
                <View style={[s.unitCheck, { backgroundColor: theme.accent }, isAr && s.unitCheckRtl]}>
                  <Ionicons name="checkmark" size={12} color={theme.primaryInk} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main onboarding screen ───────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const ui = getThemeSemantics(theme);

  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState<string | null>('g12');
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [goal, setGoal] = useState<string | null>('20');
  const [startUnit, setStartUnit] = useState<string | null>('u1');

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    void (async () => {
      const entries = await AsyncStorage.multiGet([
        '@snapmath_grade',
        '@snapmath_name',
        '@snapmath_avatar_color',
        '@snapmath_goal',
        '@snapmath_start_unit',
      ]);

      if (!active) return;

      const saved = Object.fromEntries(entries);
      if (saved['@snapmath_grade']) setGrade(saved['@snapmath_grade']);
      if (saved['@snapmath_name']) setName(saved['@snapmath_name']);
      if (saved['@snapmath_avatar_color']) setAvatarColor(saved['@snapmath_avatar_color']);
      if (saved['@snapmath_goal']) setGoal(saved['@snapmath_goal']);
      if (saved['@snapmath_start_unit']) setStartUnit(saved['@snapmath_start_unit']);
    })();

    return () => {
      active = false;
    };
  }, []);

  const canContinue = () => {
    if (step === 1) return !!grade;
    if (step === 2) return name.trim().length >= 2;
    if (step === 3) return !!goal;
    if (step === 4) return !!startUnit;
    return false;
  };

  const goNext = async () => {
    if (!canContinue()) return;
    if (step < TOTAL_STEPS) {
      // Slide animation
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setStep((s) => s + 1);
    } else {
      // Save onboarding data and enter the main app.
      await AsyncStorage.multiSet([
        [ONBOARDING_KEY, '1'],
        ['@snapmath_seen_welcome', '1'],
        ['@snapmath_grade', grade ?? 'g12'],
        ['@snapmath_name', name.trim()],
        ['@snapmath_avatar_color', avatarColor],
        ['@snapmath_goal', goal ?? '20'],
        ['@snapmath_start_unit', startUnit ?? 'u1'],
      ]);
      router.replace('/(tabs)');
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const stepLabels = [
    t('onboardingStepGrade'),
    t('onboardingStepAbout'),
    t('onboardingStepGoal'),
    t('onboardingStepFirstUnit'),
  ];
  const selectedGradeLabel = GRADES.find((item) => item.id === grade)?.[isAr ? 'labelAr' : 'labelEn'] ?? null;
  const selectedGoalLabel = GOALS.find((item) => item.id === goal)?.[isAr ? 'labelAr' : 'labelEn'] ?? null;
  const selectedUnitLabel = UNITS.find((item) => item.id === startUnit)?.[isAr ? 'labelAr' : 'labelEn'] ?? null;
  const summaryPills = [
    selectedGradeLabel,
    step >= 3 ? selectedGoalLabel : null,
    step >= 4 ? selectedUnitLabel : null,
  ].filter(Boolean) as string[];

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Subtle top glow */}
      <View style={[s.topGlow, { backgroundColor: withAlpha(theme.accent, 0.06), shadowColor: theme.logoShadow }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={[s.topBar, isAr && s.topBarRtl]}>
          {step > 1 ? (
            <TouchableOpacity
              onPress={goBack}
              style={[s.topBarBtn, { backgroundColor: ui.panelRaised, borderColor: ui.accentBorder }]}
              activeOpacity={0.8}>
              <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={[s.topBarBtn, { opacity: 0 }]} />
          )}
          <Text style={[s.stepBadge, { color: theme.text, backgroundColor: ui.panelRaised, borderColor: theme.border }]}>
            {step} / {TOTAL_STEPS} · {stepLabels[step - 1] ?? ''}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/auth', params: { next: '/onboarding' } })}
            activeOpacity={0.7}
            style={[s.skipBtn, { backgroundColor: ui.panelRaised, borderColor: theme.border }]}>
            <Text style={[s.skipText, { color: theme.muted }]}>{t('skip')}</Text>
          </TouchableOpacity>
        </View>

        <StepHeader step={step} theme={theme} />

        {/* Step content */}
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {step === 1 && <Step1 selected={grade} onSelect={setGrade} isAr={isAr} theme={theme} />}
            {step === 2 && <Step2 name={name} setName={setName} avatarColor={avatarColor} setAvatarColor={setAvatarColor} isAr={isAr} theme={theme} />}
            {step === 3 && <Step3 selected={goal} onSelect={setGoal} isAr={isAr} theme={theme} />}
            {step === 4 && <Step4 selected={startUnit} onSelect={setStartUnit} isAr={isAr} theme={theme} />}
          </Animated.View>
        </ScrollView>

        {summaryPills.length > 0 ? (
          <View style={[s.summaryRow, isAr && s.summaryRowRtl]}>
            {summaryPills.map((pill) => (
              <View
                key={pill}
                style={[
                  s.summaryPill,
                  {
                    backgroundColor: ui.accentSoft,
                    borderColor: ui.accentBorder,
                  },
                ]}>
                <Text style={[s.summaryPillText, { color: theme.text }]}>{pill}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* CTA */}
        <View style={s.ctaArea}>
          <TouchableOpacity
            style={[s.ctaWrap, { opacity: canContinue() ? 1 : 0.45 }]}
            onPress={goNext}
            disabled={!canContinue()}
            activeOpacity={0.9}>
            <LinearGradient colors={[theme.primary[0], theme.primary[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.cta, isAr && s.ctaRtl]}>
              <Text style={[s.ctaText, { color: theme.primaryInk }]}>
                {step < TOTAL_STEPS
                  ? t('onbContinue')
                  : t('onbStartLearning')}
              </Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.primaryInk} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = (SW - 48 - 10) / 2;

const s = StyleSheet.create({
  container: { flex: 1 },

  topGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'transparent',
    shadowColor: WHITE,
    shadowOpacity: 0.35,
    shadowRadius: 70,
    shadowOffset: { width: 0, height: 0 },
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topBarRtl: { flexDirection: 'row-reverse' },
  topBarBtn: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
  },
  skipBtn: {
    minWidth: 72,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
  },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },

  stepWrap: { paddingTop: 4 },

  logoRow: { alignItems: 'center', marginBottom: 20 },

  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 15,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  cardList: { gap: 12 },

  // Grade cards
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  gradeCardRtl: { flexDirection: 'row-reverse' },
  gradeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLabel: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  gradeSub: { fontSize: 12, marginTop: 2, fontFamily: 'Amiri_400Regular' },

  // Avatar step
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: WHITE,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: {
    color: WHITE,
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
  },
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  nameInputWrapRtl: { flexDirection: 'row-reverse' },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Amiri_400Regular',
    height: '100%',
  },
  swatchLabel: {
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  swatches: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatchesRtl: { flexDirection: 'row-reverse' },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: WHITE,
  },

  // Goal cards
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  goalCardRtl: { flexDirection: 'row-reverse' },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Amiri_700Bold', flex: 1 },

  // Unit grid
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  unitGridRtl: { flexDirection: 'row-reverse' },
  unitCard: {
    width: CARD_W,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  unitSymbol: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 8 },
  unitLabel: { fontSize: 13, fontFamily: 'Amiri_700Bold', lineHeight: 18 },
  unitCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitCheckRtl: {
    right: undefined,
    left: 10,
  },

  // CTA
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  summaryRowRtl: {
    flexDirection: 'row-reverse',
  },
  summaryPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryPillText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  ctaArea: { paddingHorizontal: 24, paddingBottom: 8 },
  ctaWrap: { borderRadius: 28, overflow: 'hidden' },
  cta: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
  },
  ctaRtl: { flexDirection: 'row-reverse' },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  textRtl: { textAlign: 'right' },
});
