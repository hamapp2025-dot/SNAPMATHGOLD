import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SnapMathLogo from '../components/SnapMathLogo';
import SampleFounderAvatar from '../components/SampleFounderAvatar';
import { useAppTheme } from '../src/theme/ThemeContext';
import type { AppTheme } from '../src/theme/themes';
import { useT } from '../src/config/LanguageContext';
import { getInitials, runtimeConfig } from '../src/config/runtimeConfig';
import { founderMedia } from '../src/media/founderMedia';
import { withAlpha } from '../src/theme/colorUtils';

const { width: SW, height: SH } = Dimensions.get('window');
const KEY = '@snapmath_seen_welcome';
const HERO_W = Math.min(SW - 40, 356);
const HERO_H = Math.min(SH * 0.42, HERO_W * 1.18);
type NextRoute = '/auth' | '/onboarding' | '/(tabs)';

const WELCOME_VIDEO_SOURCE = founderMedia.welcomeVideoSource;
const WELCOME_POSTER_SOURCE = founderMedia.welcomePosterSource;

function useLoopRange(from: number, to: number, duration: number, delay: number = 0) {
  const anim = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: to,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: from,
          duration,
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [anim, delay, duration, from, to]);

  return anim;
}

function FeatureChip({
  icon,
  label,
  style,
  floatY,
  theme,
  isAr,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  style?: any;
  floatY: Animated.Value;
  theme: AppTheme;
  isAr: boolean;
}) {
  return (
    <Animated.View
      style={[
        s.featureChip,
        style,
        {
          backgroundColor: withAlpha(theme.surface, theme.id === 'light' ? 0.9 : 0.88),
          borderColor: theme.border,
          transform: [{ translateY: floatY }],
        },
      ]}>
      <Ionicons name={icon} size={14} color={theme.accent} />
      <Text numberOfLines={1} style={[s.featureChipText, { color: theme.text }, isAr && s.featureChipTextAr]}>{label}</Text>
    </Animated.View>
  );
}

function WelcomePoster({ isAr, theme }: { isAr: boolean; theme: AppTheme }) {
  const chipOne = useLoopRange(-8, 8, 2800);
  const chipTwo = useLoopRange(10, -6, 3200, 320);
  const posterFloat = useLoopRange(-6, 6, 3400, 160);
  const glowScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.06,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.96,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [glowScale]);

  return (
    <View style={s.posterWrap}>
      <Animated.View
        style={[
          s.posterGlow,
          {
            backgroundColor: withAlpha(theme.accent, 0.18),
            shadowColor: theme.logoShadow,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <FeatureChip
        icon="sparkles-outline"
        label={isAr ? 'المدرب الذكي' : 'AI Coach'}
        style={s.featureChipRight}
        floatY={chipTwo}
        theme={theme}
        isAr={isAr}
      />

      <Animated.View
        style={[
          s.deviceShell,
          {
            backgroundColor: withAlpha(theme.surfaceSoft, theme.id === 'light' ? 0.84 : 0.82),
            borderColor: withAlpha(theme.text, 0.16),
            shadowColor: theme.logoShadow,
            transform: [{ translateY: posterFloat }],
          },
        ]}>
        <LinearGradient
          colors={[withAlpha(theme.text, 0.14), withAlpha(theme.text, 0.03)]}
          style={StyleSheet.absoluteFillObject}
        />

        <View
          style={[
            s.screenWrap,
            {
              backgroundColor: withAlpha(theme.bg, 0.92),
              borderColor: theme.border,
            },
          ]}>
          <LinearGradient
            colors={[withAlpha(theme.surfaceSoft, 0.96), withAlpha(theme.bg, 0.98)]}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={[s.screenTop, isAr && s.rowReverse]}>
            <View
              style={[
                s.previewTag,
                isAr && s.rowReverse,
                {
                  backgroundColor: withAlpha(theme.text, 0.06),
                  borderColor: theme.border,
                },
              ]}>
              <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
              <Text style={[s.previewTagText, { color: theme.text }]}>{isAr ? 'داخل SnapMath' : 'Inside SnapMath'}</Text>
            </View>
            <View
              style={[
                s.progressPill,
                {
                  backgroundColor: withAlpha(theme.text, 0.06),
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[s.progressPillText, { color: withAlpha(theme.text, 0.78) }]}>{isAr ? 'إتقان 82%' : '82% mastery'}</Text>
            </View>
          </View>

          <LinearGradient
            colors={[withAlpha(theme.accent, 0.18), withAlpha(theme.primary[1], 0.08)]}
            style={[s.scanCard, { borderColor: withAlpha(theme.accent, 0.2) }]}>
            <Text style={[s.scanKicker, { color: theme.accent }, isAr && s.textRight]}>{isAr ? 'امسح السؤال' : 'Scan the problem'}</Text>
            <Text style={[s.equationText, { color: theme.text }]}>2x + 5 = 17</Text>
            <View style={[s.scanTrack, { backgroundColor: withAlpha(theme.text, 0.08) }]}>
              <View style={[s.scanFill, { backgroundColor: theme.accent }]} />
            </View>
          </LinearGradient>

          <View
            style={[
              s.stepCard,
              isAr && s.rowReverse,
              {
                backgroundColor: withAlpha(theme.text, 0.05),
                borderColor: theme.border,
              },
            ]}>
            <View style={[s.stepIndex, { backgroundColor: withAlpha(theme.accent, 0.18) }]}>
              <Text style={[s.stepIndexText, { color: theme.accent }]}>1</Text>
            </View>
            <View style={s.stepBody}>
              <Text style={[s.stepTitle, { color: theme.text }, isAr && s.textRight]}>
                {isAr ? 'اعزل المتغير' : 'Isolate the variable'}
              </Text>
              <Text style={[s.stepSub, { color: theme.muted }, isAr && s.textRight]}>
                {isAr ? 'اطرح 5 من الطرفين' : 'Subtract 5 from both sides'}
              </Text>
            </View>
          </View>

          <View
            style={[
              s.previewInsightCard,
              isAr && s.rowReverse,
              {
                backgroundColor: withAlpha(theme.text, 0.05),
                borderColor: theme.border,
              },
            ]}>
            <View style={[s.previewInsightIcon, { backgroundColor: withAlpha(theme.accent, 0.14) }]}>
              <Ionicons name="sparkles-outline" size={16} color={theme.accent} />
            </View>
            <View style={s.previewInsightBody}>
              <Text style={[s.previewInsightTitle, { color: theme.text }, isAr && s.textRight]}>
                {isAr ? 'شرح ذكي مباشر' : 'Live smart guidance'}
              </Text>
              <Text style={[s.previewInsightSub, { color: theme.muted }, isAr && s.textRight]}>
                {isAr ? 'المدرب يوجهك للخطوة التالية بوضوح' : 'The coach points you to the next step clearly.'}
              </Text>
            </View>
          </View>

          <LinearGradient colors={theme.primary} style={s.dayPlanCard}>
            <Text style={[s.dayPlanKicker, { color: withAlpha(theme.primaryInk, 0.72) }]}>{isAr ? 'خطتك لليوم' : 'Today\'s plan'}</Text>
            <Text style={[s.dayPlanText, { color: theme.primaryInk }]}>{isAr ? 'مسح + شرح + تدريب' : 'Scan + Learn + Practice'}</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}

function normalizeNextRoute(value: string | string[] | undefined): NextRoute {
  const route = Array.isArray(value) ? value[0] : value;
  if (route === '/auth' || route === '/onboarding' || route === '/(tabs)') {
    return route;
  }
  return '/auth';
}

export default function WelcomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const nextRoute = normalizeNextRoute(params.next);
  const isFreshAuthFlow = nextRoute === '/auth';

  const titleText = isAr
    ? 'أتقن رياضيات التوجيهي بأسلوب ذكي وجميل'
    : 'Master Tawjihi math with clarity';
  const subtitleText = t('launchTagline');
  const primaryAppName = isAr ? 'سناب ماث أكاديمي' : 'SnapMath Academy';
  const secondaryAppName = isAr ? 'SnapMath Academy' : 'سناب ماث أكاديمي';
  const brandBadgeText = isAr ? 'رياضيات التوجيهي' : 'Grade 12 Tawjihi';
  const ctaText = isFreshAuthFlow
    ? (isAr ? 'أنشئ حساباً' : 'Create Account')
    : nextRoute === '/onboarding'
      ? (isAr ? 'أكمل الإعداد' : 'Continue Setup')
      : (isAr ? 'ادخل الآن' : 'Enter Now');
  const hintText = isFreshAuthFlow
    ? (isAr ? 'لديك حساب بالفعل؟ سجّل الدخول' : 'Already have an account? Sign in')
    : nextRoute === '/onboarding'
      ? (isAr ? 'أكمل تجهيز حسابك' : 'Finish setting up your account')
      : (isAr ? 'ادخل إلى خطتك اليومية' : 'Go to your daily plan');
  const founderTitle = isAr ? runtimeConfig.founderTitleAr : runtimeConfig.founderTitleEn;
  const founderMessage = isAr ? runtimeConfig.founderMessageAr : runtimeConfig.founderMessageEn;
  const founderInitials = getInitials(runtimeConfig.founderName);
  const founderImageSource = founderMedia.founderImageSource;
  const showWelcomeVideo = !!WELCOME_VIDEO_SOURCE;
  const welcomeHeroImageSource = showWelcomeVideo ? null : WELCOME_POSTER_SOURCE;
  const hasWelcomeHeroMedia = showWelcomeVideo || !!welcomeHeroImageSource;
  const overlayGradient = useMemo<[string, string, string, string]>(
    () => (
      hasWelcomeHeroMedia
        ? [withAlpha(theme.bg, 0.02), withAlpha(theme.bg, 0.14), withAlpha(theme.bg, 0.7), withAlpha(theme.bg, 0.96)]
        : theme.id === 'light'
          ? [withAlpha(theme.primary[0], 0.18), withAlpha(theme.bg, 0.58), withAlpha(theme.bg, 0.82), withAlpha(theme.bg, 0.96)]
          : [withAlpha(theme.bg, 0.08), withAlpha(theme.bg, 0.42), withAlpha(theme.bg, 0.72), withAlpha(theme.bg, 0.9)]
    ),
    [hasWelcomeHeroMedia, theme.bg, theme.id, theme.primary],
  );
  const copyCardGradient = useMemo<[string, string, string]>(
    () => (
      hasWelcomeHeroMedia
        ? [
            withAlpha(theme.surface, theme.id === 'light' ? 0.2 : 0.24),
            withAlpha(theme.bg, theme.id === 'light' ? 0.34 : 0.48),
            withAlpha(theme.bg, theme.id === 'light' ? 0.54 : 0.62),
          ]
        : [
            withAlpha(theme.surface, theme.id === 'light' ? 0.96 : 0.9),
            withAlpha(theme.surfaceSoft, theme.id === 'light' ? 0.94 : 0.82),
            withAlpha(theme.bg, theme.id === 'light' ? 0.92 : 0.94),
          ]
    ),
    [hasWelcomeHeroMedia, theme.bg, theme.id, theme.surface, theme.surfaceSoft],
  );
  const founderCardGradient = useMemo<[string, string]>(
    () => [
      withAlpha(theme.surface, theme.id === 'light' ? 0.96 : 0.88),
      withAlpha(theme.bg, theme.id === 'light' ? 0.9 : 0.96),
    ],
    [theme.bg, theme.id, theme.surface],
  );
  const badgeGradient = useMemo<[string, string]>(
    () => [withAlpha(theme.accent, 0.2), withAlpha(theme.primary[0], 0.08)],
    [theme.accent, theme.primary],
  );
  const ctaGradient = useMemo<[string, string, string]>(
    () => [theme.primary[0], theme.accent, theme.primary[1]],
    [theme.accent, theme.primary],
  );

  useEffect(() => {
    if (!showWelcomeVideo) return;

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, [showWelcomeVideo]);

  const markWelcomeSeen = async () => {
    await AsyncStorage.setItem(KEY, '1');
  };

  const continueToNextRoute = async () => {
    await markWelcomeSeen();
    if (isFreshAuthFlow) {
      router.replace({ pathname: '/auth', params: { next: nextRoute, mode: 'signup' } });
      return;
    }
    router.replace(nextRoute);
  };

  const openExistingAccount = async () => {
    await markWelcomeSeen();
    router.replace({ pathname: '/auth', params: { next: nextRoute, mode: 'login' } });
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {showWelcomeVideo ? (
        <Video
          source={WELCOME_VIDEO_SOURCE}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          isMuted={false}
          shouldPlay
        />
      ) : welcomeHeroImageSource ? (
        <Image source={welcomeHeroImageSource} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : null}

      <View
        style={[
          s.topOrb,
          {
            backgroundColor: withAlpha(theme.accent, theme.id === 'light' ? 0.16 : 0.09),
            shadowColor: theme.logoShadow,
          },
        ]}
      />
      <View
        style={[
          s.bottomOrb,
          {
            backgroundColor: withAlpha(theme.primary[1], theme.id === 'light' ? 0.14 : 0.06),
            shadowColor: theme.logoShadow,
          },
        ]}
      />
      <LinearGradient
        colors={overlayGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <TouchableOpacity
          onPress={continueToNextRoute}
          activeOpacity={0.85}
          style={[
            s.skipPill,
            {
              borderColor: theme.border,
              backgroundColor: withAlpha(theme.surface, theme.id === 'light' ? 0.82 : 0.42),
            },
            isAr && s.skipPillRtl,
          ]}>
          <Text style={[s.skipText, { color: theme.text }, isAr && s.skipTextRtl]}>{t('skip')}</Text>
        </TouchableOpacity>

        <View style={[s.content, hasWelcomeHeroMedia && s.contentWithVideo]}>
          <View style={[s.heroStage, hasWelcomeHeroMedia && s.heroStageVideo]}>
            {!hasWelcomeHeroMedia ? <WelcomePoster isAr={isAr} theme={theme} /> : null}
          </View>

          <View style={[s.copyBlock, hasWelcomeHeroMedia && s.copyBlockVideo]}>
            <View
              style={[
                s.copyCard,
                hasWelcomeHeroMedia && s.copyCardVideo,
                {
                  borderColor: withAlpha(theme.accent, hasWelcomeHeroMedia ? 0.18 : 0.14),
                  shadowColor: theme.logoShadow,
                },
              ]}>
              <LinearGradient
                colors={copyCardGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.92, y: 1 }}
              />

              <View
                style={[
                  s.brandBadge,
                  isAr && s.rowReverse,
                  {
                    borderColor: withAlpha(theme.accent, 0.18),
                  },
                ]}>
                <LinearGradient
                  colors={badgeGradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
                <Text style={[s.brandBadgeText, { color: theme.accent }]}>{brandBadgeText}</Text>
              </View>

              <View style={[s.brandRow, hasWelcomeHeroMedia && s.brandRowVideo]}>
                <SnapMathLogo size={48} showLabel={false} />
                <View style={s.brandTextWrap}>
                  <Text style={[s.brandName, { color: theme.text }]}>{primaryAppName}</Text>
                  <Text style={[s.brandNameSecondary, { color: theme.muted }, isAr && s.brandNameSecondaryAr]}>
                    {secondaryAppName}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  s.title,
                  { color: theme.text },
                  hasWelcomeHeroMedia && s.titleVideo,
                  isAr && s.titleAr,
                  hasWelcomeHeroMedia && isAr && s.titleArVideo,
                ]}>
                {titleText}
              </Text>

              <Text style={[s.subtitle, { color: theme.muted }, hasWelcomeHeroMedia && s.subtitleVideo, isAr && s.subtitleAr]}>
                {subtitleText}
              </Text>

              <View style={[s.ctaWrap, hasWelcomeHeroMedia && s.ctaWrapVideo]}>
                <TouchableOpacity
                  onPress={continueToNextRoute}
                  activeOpacity={0.92}
                  style={[s.ctaTouch, { shadowColor: theme.logoShadow }]}>
                  <LinearGradient colors={ctaGradient} style={s.cta}>
                    <Text style={[s.ctaText, { color: theme.logoGlyph }]}>{ctaText}</Text>
                    <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.logoGlyph} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text
                onPress={isFreshAuthFlow ? openExistingAccount : continueToNextRoute}
                style={[s.signInHint, { color: theme.muted }, hasWelcomeHeroMedia && s.signInHintVideo]}>
                {hintText}
              </Text>
            </View>

            {!hasWelcomeHeroMedia ? (
              <View
                style={[
                  s.founderCard,
                  { borderColor: withAlpha(theme.accent, 0.12), shadowColor: theme.logoShadow },
                  isAr && s.founderCardRtl,
                ]}>
                <LinearGradient
                  colors={founderCardGradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0.08, y: 0 }}
                  end={{ x: 0.92, y: 1 }}
                />
                {founderImageSource ? (
                  <View style={[s.founderAvatar, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.26) }]}>
                    <Image source={founderImageSource} style={s.founderAvatarImage} />
                  </View>
                ) : (
                  <SampleFounderAvatar theme={theme} initials={founderInitials} size={52} />
                )}
                <View style={s.founderBody}>
                  <Text style={[s.founderName, { color: theme.text }, isAr && s.textRight]}>
                    {runtimeConfig.founderName}
                  </Text>
                  <Text style={[s.founderTitle, { color: theme.accent }, isAr && s.textRight]}>
                    {founderTitle}
                  </Text>
                  <Text style={[s.founderMessage, { color: theme.muted }, isAr && s.textRight]}>
                    {founderMessage}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A17',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 18,
  },
  topOrb: {
    position: 'absolute',
    top: -42,
    left: -30,
    width: 148,
    height: 148,
    borderRadius: 74,
    shadowOpacity: 0.16,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomOrb: {
    position: 'absolute',
    right: -64,
    bottom: SH * 0.14,
    width: 190,
    height: 190,
    borderRadius: 95,
    shadowOpacity: 0.1,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 0 },
  },
  skipPill: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  skipPillRtl: {
    alignSelf: 'flex-start',
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
  },
  skipTextRtl: {
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 14,
  },
  contentWithVideo: {
    paddingTop: 0,
  },
  heroStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  heroStageVideo: {
    flex: 1,
    minHeight: SH * 0.22,
    marginBottom: 0,
  },
  sampleModePill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sampleModeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  posterWrap: {
    width: HERO_W,
    height: HERO_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterGlow: {
    position: 'absolute',
    width: HERO_W * 0.88,
    height: HERO_H * 0.38,
    borderRadius: 120,
    shadowOpacity: 0.24,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 0 },
  },
  featureChip: {
    position: 'absolute',
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureChipRight: {
    top: -8,
    right: 12,
  },
  featureChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  featureChipTextAr: {
    fontSize: 11,
    lineHeight: 14,
  },
  deviceShell: {
    width: HERO_W,
    height: HERO_H,
    borderRadius: 36,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  screenWrap: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  screenTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  previewTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Amiri_700Bold',
  },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  progressPillText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontFamily: 'Amiri_700Bold',
  },
  scanCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  scanKicker: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Amiri_700Bold',
  },
  equationText: {
    fontSize: 27,
    lineHeight: 32,
    fontFamily: 'Amiri_700Bold',
  },
  scanTrack: {
    height: 6,
    borderRadius: 999,
    marginTop: 12,
    overflow: 'hidden',
  },
  scanFill: {
    width: '62%',
    height: '100%',
    borderRadius: 999,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
  },
  stepIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
  },
  stepSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Amiri_400Regular',
  },
  previewInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  previewInsightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInsightBody: {
    flex: 1,
  },
  previewInsightTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
  },
  previewInsightSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Amiri_400Regular',
  },
  dayPlanCard: {
    marginTop: 'auto',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dayPlanKicker: {
    fontSize: 11,
    fontFamily: 'Amiri_700Bold',
  },
  dayPlanText: {
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Amiri_700Bold',
  },
  copyBlock: {
    marginTop: 0,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  copyBlockVideo: {
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  copyCard: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  copyCardVideo: {
    borderRadius: 30,
    paddingBottom: 18,
  },
  brandBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  brandBadgeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  brandRowVideo: {
    marginBottom: 8,
  },
  brandTextWrap: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
  },
  brandNameSecondary: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    fontFamily: 'Amiri_400Regular',
  },
  brandNameSecondaryAr: {
    fontFamily: 'Amiri_700Bold',
  },
  title: {
    fontSize: 33,
    lineHeight: 39,
    textAlign: 'center',
    fontFamily: 'Amiri_700Bold',
    maxWidth: 336,
    alignSelf: 'center',
  },
  titleVideo: {
    fontSize: 27,
    lineHeight: 33,
    maxWidth: 308,
  },
  titleAr: {
    fontSize: 31,
    lineHeight: 46,
    maxWidth: 316,
  },
  titleArVideo: {
    fontSize: 27,
    lineHeight: 39,
    maxWidth: 286,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 294,
    alignSelf: 'center',
    fontFamily: 'Amiri_400Regular',
  },
  subtitleVideo: {
    marginTop: 4,
  },
  subtitleAr: {
    lineHeight: 24,
  },
  founderCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  founderCardVideo: {
    marginTop: 12,
    padding: 12,
  },
  founderCardRtl: {
    flexDirection: 'row-reverse',
  },
  founderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  founderAvatarImage: {
    width: '100%',
    height: '100%',
  },
  founderAvatarText: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
  },
  founderBody: {
    flex: 1,
  },
  founderName: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  founderNameVideo: {
    fontSize: 14,
  },
  founderTitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  founderTitleVideo: {
    fontSize: 11,
  },
  sampleFounderTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sampleFounderTagText: {
    fontSize: 11,
    fontFamily: 'Amiri_700Bold',
  },
  founderMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
  founderMessageVideo: {
    fontSize: 12,
    lineHeight: 18,
  },
  ctaWrap: {
    marginTop: 16,
  },
  ctaWrapVideo: {
    marginTop: 12,
  },
  ctaTouch: {
    borderRadius: 29,
    overflow: 'hidden',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  cta: {
    height: 56,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Amiri_700Bold',
  },
  signInHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Amiri_400Regular',
    alignSelf: 'center',
  },
  signInHintVideo: {
    marginTop: 10,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
