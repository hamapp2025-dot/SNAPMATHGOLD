// src/screens/OnboardingScreen.js - Single-screen 4-step wizard, no tabs
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AnimatedLogo from '../components/AnimatedLogo';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import {
  BG,
  SURFACE,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  GOLD,
  GOLD_BUTTON_GRADIENT,
  GOLD_BTN_TEXT,
  ECLIPSE_GLOW,
  FONTS,
  TYPE_SCALE,
} from '../config/theme';

const PROGRESS_TRACK = '#352E16';
const PROGRESS_FILL = GOLD;

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 4;
const PROGRESS_HEIGHT = 3;

export default function OnboardingScreen({ onComplete, onLogin }) {
  const { t, isAr } = useT();
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const textAlign = isAr ? 'right' : 'left';
  const rowDir = isAr ? 'row-reverse' : 'row';

  const progressFrac = (step + 1) / TOTAL_STEPS;

  const goNext = () => {
    if (step >= TOTAL_STEPS - 1) {
      onComplete?.();
      return;
    }
    const dir = isAr ? width : -width;
    Animated.timing(slideAnim, { toValue: dir, duration: 300, useNativeDriver: true }).start(() => {
      setStep((s) => s + 1);
      slideAnim.setValue(-dir);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
  };

  const goBack = () => {
    if (step <= 0) return;
    const dir = isAr ? -width : width;
    Animated.timing(slideAnim, { toValue: dir, duration: 300, useNativeDriver: true }).start(() => {
      setStep((s) => s - 1);
      slideAnim.setValue(-dir);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
  };

  const toggleSubject = (id) => {
    setSubjects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return grade !== null;
    if (step === 2) return subjects.length > 0;
    return true;
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Slim gold progress bar at top */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: `${progressFrac * 100}%` }]} />
          </View>
        </View>

        {/* Back arrow (steps 2–4 only) */}
        {step > 0 && (
          <TouchableOpacity
            style={[s.backBtn, isAr && s.backBtnRtl]}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAr ? 'chevron-forward' : 'chevron-back'}
              size={26}
              color={TEXT_TERTIARY}
            />
          </TouchableOpacity>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.keyboard}
        >
          {/* Eclipse glow behind top */}
          <View style={s.heroWrap} pointerEvents="none">
            <LinearGradient
              colors={ECLIPSE_GLOW.colors}
              locations={ECLIPSE_GLOW.locations}
              style={s.eclipse}
            />
            <View style={s.orbWrap}>
              <AnimatedLogo size={80} showParticles={false} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[s.stepContent, { transform: [{ translateX: slideAnim }] }]}>
              {step === 0 && (
                <View style={s.stepInner}>
                  <View style={[s.step1Header, { flexDirection: rowDir }]}>
                    <View style={{ flex: 1 }} />
                    <LanguageToggle />
                  </View>
                  <Text style={[s.stepTitle, { fontFamily: fontBold, textAlign }]}>
                    {t('onbWelcome')}
                  </Text>
                  <Text style={[s.stepSub, { fontFamily: fontReg, textAlign }]}>
                    {t('onbWelcomeSub')}
                  </Text>
                  <TouchableOpacity style={s.continueBtn} onPress={goNext} activeOpacity={0.9}>
                    <LinearGradient
                      colors={GOLD_BUTTON_GRADIENT.colors}
                      start={GOLD_BUTTON_GRADIENT.start}
                      end={GOLD_BUTTON_GRADIENT.end}
                      style={s.continueBtnGrad}
                    >
                      <Text style={[s.continueBtnText, { fontFamily: fontBold }]}>
                        {t('onbGetStarted')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.loginLink} onPress={() => onLogin?.()} activeOpacity={0.8}>
                    <Text style={[s.loginLinkText, { fontFamily: fontReg }]}>{t('hasAccount')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 1 && (
                <View style={s.stepInner}>
                  <Text style={[s.stepTitle, { fontFamily: fontBold, textAlign }]}>
                    {t('onbStepGrade')}
                  </Text>
                  <Text style={[s.stepSub, { fontFamily: fontReg, textAlign }]}>
                    {t('onbWelcomeSub')}
                  </Text>
                  <View style={s.optionsRow}>
                    {[
                      { id: '10', key: 'onbGrade10' },
                      { id: '11', key: 'onbGrade11' },
                      { id: '12', key: 'onbGrade12' },
                    ].map(({ id, key }) => (
                      <TouchableOpacity
                        key={id}
                        style={[s.optionCard, grade === id && s.optionCardSelected]}
                        onPress={() => setGrade(id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            s.optionCardText,
                            { fontFamily: fontBold, textAlign },
                            grade === id && s.optionCardTextSelected,
                          ]}
                        >
                          {t(key)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={s.continueBtn}
                    onPress={goNext}
                    disabled={!canProceed()}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={GOLD_BUTTON_GRADIENT.colors}
                      start={GOLD_BUTTON_GRADIENT.start}
                      end={GOLD_BUTTON_GRADIENT.end}
                      style={[s.continueBtnGrad, !canProceed() && s.continueBtnDisabled]}
                    >
                      <Text style={[s.continueBtnText, { fontFamily: fontBold }]}>
                        {t('onbContinue')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View style={s.stepInner}>
                  <Text style={[s.stepTitle, { fontFamily: fontBold, textAlign }]}>
                    {t('onbStepFocus')}
                  </Text>
                  <Text style={[s.stepSub, { fontFamily: fontReg, textAlign }]}>
                    {t('onbWelcomeSub')}
                  </Text>
                  <View style={s.optionsRow}>
                    {[
                      { id: 'math', key: 'onbSubjectMath' },
                      { id: 'sci', key: 'onbSubjectSci' },
                      { id: 'lit', key: 'onbSubjectLit' },
                    ].map(({ id, key }) => (
                      <TouchableOpacity
                        key={id}
                        style={[
                          s.optionCard,
                          subjects.includes(id) && s.optionCardSelected,
                        ]}
                        onPress={() => toggleSubject(id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            s.optionCardText,
                            { fontFamily: fontBold, textAlign },
                            subjects.includes(id) && s.optionCardTextSelected,
                          ]}
                        >
                          {t(key)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={s.continueBtn}
                    onPress={goNext}
                    disabled={!canProceed()}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={GOLD_BUTTON_GRADIENT.colors}
                      start={GOLD_BUTTON_GRADIENT.start}
                      end={GOLD_BUTTON_GRADIENT.end}
                      style={[s.continueBtnGrad, !canProceed() && s.continueBtnDisabled]}
                    >
                      <Text style={[s.continueBtnText, { fontFamily: fontBold }]}>
                        {t('onbContinue')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View style={s.stepInner}>
                  <Text style={[s.stepTitle, { fontFamily: fontBold, textAlign }]}>
                    {t('onbAllSet')}
                  </Text>
                  <Text style={[s.stepSub, { fontFamily: fontReg, textAlign }]}>
                    {t('onbReadySub')}
                  </Text>
                  <TouchableOpacity
                    style={s.startNowBtn}
                    onPress={() => onComplete?.()}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={GOLD_BUTTON_GRADIENT.colors}
                      start={GOLD_BUTTON_GRADIENT.start}
                      end={GOLD_BUTTON_GRADIENT.end}
                      style={s.startNowGrad}
                    >
                      <Text style={[s.startNowText, { fontFamily: fontBold }]}>
                        {t('onbStartLearning')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  progressTrack: {
    height: PROGRESS_HEIGHT,
    borderRadius: 2,
    backgroundColor: PROGRESS_TRACK,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: PROGRESS_FILL,
  },
  step1Header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  backBtnRtl: { left: undefined, right: 16 },
  heroWrap: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eclipse: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  orbWrap: { marginTop: 8 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepContent: { minHeight: 320 },
  stepInner: { paddingTop: 24, gap: 20 },
  stepTitle: {
    fontSize: TYPE_SCALE.h1,
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: TYPE_SCALE.body,
    color: TEXT_SECONDARY,
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsRow: { gap: 12, marginBottom: 24 },
  optionCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  optionCardSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(197,162,77,0.12)',
  },
  optionCardText: { fontSize: TYPE_SCALE.body, color: TEXT_PRIMARY },
  optionCardTextSelected: { color: GOLD },
  continueBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 56,
  },
  continueBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.5 },
  continueBtnText: {
    fontSize: TYPE_SCALE.body,
    color: GOLD_BTN_TEXT,
    fontWeight: '700',
  },
  loginLink: { alignItems: 'center', paddingVertical: 16 },
  loginLinkText: { fontSize: TYPE_SCALE.bodySmall, color: TEXT_SECONDARY },
  startNowBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 60,
    marginTop: 16,
  },
  startNowGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startNowText: {
    fontSize: TYPE_SCALE.h2,
    color: GOLD_BTN_TEXT,
    fontWeight: '700',
  },
});
