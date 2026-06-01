import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SnapMathLogo from '../components/SnapMathLogo';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { runtimeConfig } from '../src/config/runtimeConfig';
import { founderMedia } from '../src/media/founderMedia';
import { withAlpha } from '../src/theme/colorUtils';

const { width: SW, height: SH } = Dimensions.get('window');

type NextRoute = '/auth' | '/onboarding' | '/(tabs)';

const COLD_LAUNCH_MIN_DISPLAY_MS = 3000;
const COLD_LAUNCH_SKIP_ENABLE_MS = 1100;
const SCENE_SIZE = Math.min(SW * 0.58, 228);

const INTRO_VIDEO_SOURCE = founderMedia.introVideoSource;

function normalizeNextRoute(value: string | string[] | undefined): NextRoute {
  const route = Array.isArray(value) ? value[0] : value;
  if (route === '/auth' || route === '/onboarding' || route === '/(tabs)') {
    return route;
  }
  return '/auth';
}

function normalizeReturnTo(value: string | string[] | undefined): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  try {
    const decodedValue = decodeURIComponent(rawValue);
    if (!decodedValue || decodedValue === '/intro') return null;
    if (decodedValue === '/' || decodedValue === '/index') return '/(tabs)';
    return decodedValue;
  } catch {
    if (rawValue === '/' || rawValue === '/index') return '/(tabs)';
    return rawValue === '/intro' ? null : rawValue;
  }
}

export default function IntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[]; returnTo?: string | string[] }>();
  const { theme } = useAppTheme();
  const { t, isAr } = useT() as any;
  const nextRoute = useMemo(() => normalizeNextRoute(params.next), [params.next]);
  const returnTo = useMemo(() => normalizeReturnTo(params.returnTo), [params.returnTo]);
  const isResumeVariant = !!returnTo;
  const minDisplayMs = COLD_LAUNCH_MIN_DISPLAY_MS;
  const skipEnableMs = COLD_LAUNCH_SKIP_ENABLE_MS;

  const badgeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.94)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const introVideoRef = useRef<Video | null>(null);

  const didNavigateRef = useRef(false);
  const minReachedRef = useRef(false);
  const videoFinishedRef = useRef(!INTRO_VIDEO_SOURCE);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!INTRO_VIDEO_SOURCE) return;

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
  }, []);

  const advance = useCallback(async () => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;
    await AsyncStorage.setItem('@snapmath_seen_intro', '1').catch(() => {});
    if (returnTo) {
      router.replace(returnTo as any);
      return;
    }
    if (nextRoute === '/auth') {
      router.replace({ pathname: '/welcome', params: { next: nextRoute } });
      return;
    }
    router.replace(nextRoute);
  }, [nextRoute, returnTo, router]);

  useEffect(() => {
    didNavigateRef.current = false;
    minReachedRef.current = false;
    videoFinishedRef.current = !INTRO_VIDEO_SOURCE;
    setCanSkip(false);
    badgeAnim.setValue(0);
    logoAnim.setValue(0);
    titleAnim.setValue(0);
    subtitleAnim.setValue(0);
    footerAnim.setValue(0);
    glowAnim.setValue(0.94);
    shimmerAnim.setValue(-1);
    orbitAnim.setValue(0);
    progressAnim.setValue(0);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.08,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.94,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const entrance = Animated.stagger(120, [
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        speed: 10,
        bounciness: 8,
        useNativeDriver: true,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    pulse.start();
    orbitLoop.start();
    shimmerLoop.start();
    entrance.start();
    if (!INTRO_VIDEO_SOURCE) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: minDisplayMs,
        useNativeDriver: false,
      }).start();
    }

    const skipTimer = setTimeout(() => setCanSkip(true), skipEnableMs);
    const minTimer = setTimeout(() => {
      minReachedRef.current = true;
      if (videoFinishedRef.current) {
        advance();
      }
    }, minDisplayMs);

    return () => {
      pulse.stop();
      orbitLoop.stop();
      shimmerLoop.stop();
      entrance.stop();
      clearTimeout(skipTimer);
      clearTimeout(minTimer);
    };
  }, [
    advance,
    badgeAnim,
    footerAnim,
    glowAnim,
    logoAnim,
    minDisplayMs,
    orbitAnim,
    progressAnim,
    shimmerAnim,
    skipEnableMs,
    subtitleAnim,
    titleAnim,
  ]);

  const onVideoLoad = useCallback(async () => {
    if (!introVideoRef.current) return;
    videoFinishedRef.current = false;
    progressAnim.setValue(0);
    try {
      await introVideoRef.current.setPositionAsync(0);
      await introVideoRef.current.playAsync();
    } catch {
      // Let the video continue with its default playback state if resetting fails.
    }
  }, [progressAnim]);

  const onVideoStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis && status.positionMillis != null) {
      progressAnim.setValue(Math.min(status.positionMillis / status.durationMillis, 1));
    }
    if (status.didJustFinish) {
      videoFinishedRef.current = true;
      progressAnim.setValue(1);
      if (minReachedRef.current) {
        advance();
      }
    }
  }, [advance, progressAnim]);

  const hasIntroVideo = !!INTRO_VIDEO_SOURCE;
  const appName = 'SnapMath Academy';
  const badgeText = isAr ? 'رياضيات التوجيهي' : 'Grade 12 Tawjihi';
  const subtitleText = t('launchTagline');
  const prepText = hasIntroVideo
    ? null
    : (isResumeVariant
      ? (isAr ? 'نعيدك بسرعة إلى مكانك...' : 'Taking you right back in...')
      : (isAr ? 'جاري تجهيز تجربة التعلّم...' : 'Preparing your learning experience...'));
  const loadingText = isAr ? 'جاري تجهيز التطبيق' : 'Setting things up';
  const footerMeta = null;
  const founderCredit = isAr ? `مع ${runtimeConfig.founderName}` : `with ${runtimeConfig.founderName}`;
  const skipText = t('skip');
  const backgroundGradient = useMemo<[string, string, string]>(
    () => [theme.bg, theme.surface, theme.surfaceSoft],
    [theme.bg, theme.surface, theme.surfaceSoft],
  );
  const overlayGradient = useMemo<[string, string, string]>(
    () => (hasIntroVideo
      ? [
          withAlpha(theme.bg, theme.id === 'light' ? 0.04 : 0.08),
          withAlpha(theme.bg, theme.id === 'light' ? 0.16 : 0.28),
          withAlpha(theme.bg, theme.id === 'light' ? 0.58 : 0.72),
        ]
      : [
          withAlpha(theme.primary[0], theme.id === 'light' ? 0.16 : 0.06),
          withAlpha(theme.bg, theme.id === 'light' ? 0.08 : 0.22),
          withAlpha(theme.bg, theme.id === 'light' ? 0.18 : 0.42),
        ]),
    [hasIntroVideo, theme.bg, theme.id, theme.primary],
  );
  const badgeGradient = useMemo<[string, string]>(
    () => [withAlpha(theme.accent, 0.24), withAlpha(theme.primary[1], 0.1)],
    [theme.accent, theme.primary],
  );
  const footerGradient = useMemo<[string, string]>(
    () => (hasIntroVideo
      ? [withAlpha(theme.surface, 0.72), withAlpha(theme.bg, 0.86)]
      : [withAlpha(theme.surface, 0.94), withAlpha(theme.bg, 0.94)]),
    [hasIntroVideo, theme.bg, theme.surface],
  );
  const videoCardGradient = useMemo<[string, string, string]>(
    () => [
      withAlpha(theme.surface, theme.id === 'light' ? 0.18 : 0.22),
      withAlpha(theme.bg, theme.id === 'light' ? 0.34 : 0.44),
      withAlpha(theme.bg, theme.id === 'light' ? 0.56 : 0.62),
    ],
    [theme.bg, theme.id, theme.surface],
  );
  const videoBadgeGradient = useMemo<[string, string]>(
    () => [withAlpha(theme.accent, 0.22), withAlpha(theme.primary[0], 0.1)],
    [theme.accent, theme.primary],
  );
  const progressTrackGradient = useMemo<[string, string]>(
    () => [withAlpha(theme.accent, 0.08), withAlpha(theme.primary[1], 0.12)],
    [theme.accent, theme.primary],
  );
  const progressFillGradient = useMemo<[string, string, string]>(
    () => [theme.primary[0], theme.accent, theme.primary[1]],
    [theme.accent, theme.primary],
  );

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const ringRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const ringRotateReverse = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-140, 240],
  });

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {INTRO_VIDEO_SOURCE ? (
        <Video
          ref={introVideoRef}
          source={INTRO_VIDEO_SOURCE}
          style={StyleSheet.absoluteFillObject}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          isMuted={false}
          progressUpdateIntervalMillis={250}
          onLoad={onVideoLoad}
          onPlaybackStatusUpdate={onVideoStatusUpdate}
        />
      ) : (
        <>
          <LinearGradient
            colors={backgroundGradient}
            style={StyleSheet.absoluteFillObject}
          />
          <Animated.View
            style={[
              s.topGlow,
              {
                backgroundColor: withAlpha(theme.primary[0], 0.12),
                shadowColor: theme.logoShadow,
                transform: [{ scale: glowAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              s.leftGlow,
              {
                backgroundColor: withAlpha(theme.accent, 0.1),
                shadowColor: theme.logoShadow,
                transform: [{ scale: glowAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              s.bottomGlow,
              {
                backgroundColor: withAlpha(theme.primary[1], 0.12),
                shadowColor: theme.logoShadow,
                transform: [{ scale: glowAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              s.centerBloom,
              {
                backgroundColor: withAlpha(theme.accent, 0.12),
                shadowColor: theme.logoShadow,
                transform: [{ scale: glowAnim }],
              },
            ]}
          />
        </>
      )}

      <LinearGradient
        colors={overlayGradient}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.topRow}>
          <View style={s.skipSpacer} />
          {canSkip ? (
            <Pressable
              onPress={advance}
              style={[
                s.skipPill,
                {
                  backgroundColor: withAlpha(theme.surface, 0.76),
                  borderColor: withAlpha(theme.accent, 0.18),
                },
              ]}
            >
              <Text style={[s.skipText, { color: theme.text }, isAr && s.skipTextRtl]}>{skipText}</Text>
            </Pressable>
          ) : (
            <View style={s.skipSpacer} />
          )}
        </View>

        <View style={[s.centerWrap, hasIntroVideo && s.centerWrapVideo]}>
          {!hasIntroVideo ? (
            <Animated.View
              style={[
                s.badge,
                {
                  opacity: badgeAnim,
                  transform: [
                    {
                      translateY: badgeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={badgeGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={[s.badgeText, { color: theme.text }]}>{badgeText}</Text>
            </Animated.View>
          ) : null}

          <Animated.View
            style={[
              s.sceneWrap,
              hasIntroVideo && s.sceneWrapVideo,
              {
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1],
                    }),
                  },
                  ...(hasIntroVideo ? [{ translateY: 40 }, { scale: 0.56 }] : []),
                ],
              },
            ]}
          >
            {!hasIntroVideo ? (
              <>
                <Animated.View
                  style={[
                    s.orbitRing,
                    {
                      borderColor: withAlpha(theme.accent, 0.2),
                      transform: [{ rotate: ringRotate }, { scale: glowAnim }],
                    },
                  ]}
                >
                  <View style={[s.orbitDot, s.orbitDotTop, { backgroundColor: theme.primary[0], shadowColor: theme.logoShadow }]} />
                  <View style={[s.orbitDot, s.orbitDotRight, { backgroundColor: theme.accent, shadowColor: theme.logoShadow }]} />
                </Animated.View>
                <Animated.View
                  style={[
                    s.orbitRingInner,
                    {
                      borderColor: withAlpha(theme.primary[1], 0.16),
                      transform: [{ rotate: ringRotateReverse }],
                    },
                  ]}
                >
                  <View style={[s.orbitMiniDot, s.orbitMiniDotBottom, { backgroundColor: theme.text }]} />
                </Animated.View>
                <Animated.View
                  style={[
                    s.logoAura,
                    {
                      backgroundColor: withAlpha(theme.accent, 0.16),
                      shadowColor: theme.logoShadow,
                      transform: [{ scale: glowAnim }],
                    },
                  ]}
                />
              </>
            ) : null}
            <View
              style={[
                s.logoShell,
                hasIntroVideo && s.logoShellVideo,
                {
                  backgroundColor: withAlpha(theme.surface, hasIntroVideo ? (theme.id === 'light' ? 0.72 : 0.52) : (theme.id === 'light' ? 0.92 : 0.82)),
                  borderColor: withAlpha(theme.accent, hasIntroVideo ? 0.3 : 0.18),
                  shadowColor: theme.logoShadow,
                },
              ]}
            >
              <SnapMathLogo size={94} showLabel={false} />
            </View>
          </Animated.View>

          {hasIntroVideo ? (
            <View
              style={[
                s.videoTextCard,
                {
                  borderColor: withAlpha(theme.accent, 0.16),
                  shadowColor: theme.logoShadow,
                },
              ]}
            >
              <LinearGradient
                colors={videoCardGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.12, y: 0 }}
                end={{ x: 0.92, y: 1 }}
              />
              <Animated.View
                style={[
                  s.videoBadgePill,
                  {
                    borderColor: withAlpha(theme.accent, 0.2),
                    opacity: badgeAnim,
                    transform: [
                      {
                        translateY: badgeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={videoBadgeGradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={[s.videoBadgeText, { color: theme.accent }]}>{badgeText}</Text>
              </Animated.View>

              <Animated.Text
                style={[
                  s.title,
                  s.titleVideo,
                  {
                    color: theme.accent,
                    letterSpacing: isAr ? 0 : 0.6,
                    opacity: titleAnim,
                    transform: [
                      {
                        translateY: titleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {appName}
              </Animated.Text>

              <Animated.Text
                style={[
                  s.subtitle,
                  s.subtitleVideo,
                  {
                    color: withAlpha(theme.text, 0.96),
                    opacity: subtitleAnim,
                    transform: [
                      {
                        translateY: subtitleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {subtitleText}
              </Animated.Text>

              {prepText ? (
                <Animated.Text
                  style={[
                    s.prepText,
                    s.prepTextVideo,
                    {
                      color: withAlpha(theme.text, 0.76),
                      opacity: footerAnim,
                      transform: [
                        {
                          translateY: footerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {prepText}
                </Animated.Text>
              ) : null}
            </View>
          ) : (
            <>
              <Animated.Text
                style={[
                  s.title,
                  {
                    color: theme.text,
                    letterSpacing: isAr ? 0 : 0.6,
                    opacity: titleAnim,
                    transform: [
                      {
                        translateY: titleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {appName}
              </Animated.Text>

              <Animated.Text
                style={[
                  s.subtitle,
                  {
                    color: withAlpha(theme.text, 0.94),
                    opacity: subtitleAnim,
                    transform: [
                      {
                        translateY: subtitleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {subtitleText}
              </Animated.Text>

              {prepText ? (
                <Animated.Text
                  style={[
                    s.prepText,
                    {
                      color: withAlpha(theme.text, 0.72),
                      opacity: footerAnim,
                      transform: [
                        {
                          translateY: footerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {prepText}
                </Animated.Text>
              ) : null}
            </>
          )}

          {!INTRO_VIDEO_SOURCE ? (
            <Animated.View
              style={[
                s.sampleModePill,
                {
                  backgroundColor: withAlpha(theme.surface, 0.76),
                  borderColor: withAlpha(theme.accent, 0.18),
                  opacity: footerAnim,
                  transform: [
                    {
                      translateY: footerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="sparkles-outline" size={14} color={theme.accent} />
              <Text style={[s.sampleModeText, { color: theme.text }]}>{founderCredit}</Text>
            </Animated.View>
          ) : null}
        </View>

        <Animated.View
          style={[
            s.bottomWrap,
            {
              opacity: footerAnim,
              transform: [
                {
                  translateY: footerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={footerGradient}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[s.footerRow, isAr && s.footerRowRtl, !footerMeta && s.footerRowSingle]}>
            <Text style={[s.footerLabel, { color: theme.text }, isAr && s.footerLabelRtl]}>{loadingText}</Text>
            {footerMeta ? (
              <Text style={[s.footerMeta, { color: withAlpha(theme.text, 0.64) }, isAr && s.footerMetaRtl]}>{footerMeta}</Text>
            ) : null}
          </View>
          <View style={[s.progressTrack, { backgroundColor: withAlpha(theme.text, 0.08) }, isAr && s.progressTrackRtl]}>
            <LinearGradient
              colors={progressTrackGradient}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Animated.View
              style={[
                s.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            >
              <LinearGradient
                colors={progressFillGradient}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
            <Animated.View
              style={[
                s.progressShimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 18,
  },
  topRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  skipSpacer: {
    minWidth: 54,
    minHeight: 32,
  },
  skipPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
  },
  skipTextRtl: {
    writingDirection: 'rtl',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 18,
  },
  centerWrapVideo: {
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingTop: 28,
  },
  badge: {
    minWidth: 132,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  badgeText: {
    color: '#F7E3BE',
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 0.3,
    fontFamily: 'Amiri_700Bold',
  },
  sampleModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 16,
  },
  sampleModeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  sceneWrap: {
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sceneWrapVideo: {
    marginBottom: 8,
  },
  orbitRing: {
    position: 'absolute',
    width: SCENE_SIZE,
    height: SCENE_SIZE,
    borderRadius: 999,
    borderWidth: 1,
  },
  orbitRingInner: {
    position: 'absolute',
    width: SCENE_SIZE - 34,
    height: SCENE_SIZE - 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  orbitDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 999,
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitDotTop: {
    top: 8,
    alignSelf: 'center',
  },
  orbitDotRight: {
    right: 12,
    top: 50,
  },
  orbitMiniDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  orbitMiniDotBottom: {
    bottom: 10,
    alignSelf: 'center',
  },
  logoAura: {
    position: 'absolute',
    width: SCENE_SIZE * 0.5,
    height: SCENE_SIZE * 0.5,
    borderRadius: 999,
    shadowOpacity: 0.3,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 },
  },
  logoShell: {
    width: SCENE_SIZE * 0.72,
    height: SCENE_SIZE * 0.72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoShellVideo: {
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  videoTextCard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  videoBadgePill: {
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  videoBadgeText: {
    fontSize: 12,
    letterSpacing: 0.3,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
  },
  title: {
    color: '#FFF5E7',
    fontSize: 32,
    letterSpacing: 1.3,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
  },
  titleVideo: {
    marginTop: 0,
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 16,
  },
  subtitle: {
    color: '#FFF2DE',
    fontSize: 25,
    lineHeight: 35,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  subtitleVideo: {
    marginTop: 4,
    fontSize: 22,
    lineHeight: 30,
    maxWidth: 286,
  },
  prepText: {
    color: 'rgba(255,239,213,0.76)',
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 320,
  },
  prepTextVideo: {
    marginTop: 8,
    fontSize: 13,
    maxWidth: 260,
  },
  bottomWrap: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  footerRowSingle: {
    justifyContent: 'flex-start',
  },
  footerRowRtl: {
    flexDirection: 'row-reverse',
  },
  footerLabel: {
    color: '#F7E3BE',
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  footerLabelRtl: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  footerMeta: {
    color: 'rgba(255,235,204,0.64)',
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
  },
  footerMetaRtl: {
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  progressTrack: {
    width: '100%',
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressTrackRtl: {
    transform: [{ scaleX: -1 }],
  },
  progressFill: {
    overflow: 'hidden',
    height: '100%',
    borderRadius: 999,
  },
  progressShimmer: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 54,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    opacity: 0.42,
  },
  topGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: Math.min(SW * 0.82, 320),
    height: Math.min(SH * 0.24, 220),
    borderRadius: 999,
    shadowOpacity: 0.22,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  leftGlow: {
    position: 'absolute',
    left: -50,
    top: SH * 0.26,
    width: Math.min(SW * 0.5, 180),
    height: Math.min(SH * 0.18, 160),
    borderRadius: 999,
    shadowOpacity: 0.18,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomGlow: {
    position: 'absolute',
    bottom: SH * 0.12,
    right: -20,
    width: Math.min(SW * 0.62, 240),
    height: Math.min(SH * 0.18, 180),
    borderRadius: 999,
    shadowOpacity: 0.18,
    shadowRadius: 52,
    shadowOffset: { width: 0, height: 0 },
  },
  centerBloom: {
    position: 'absolute',
    top: SH * 0.3,
    alignSelf: 'center',
    width: Math.min(SW * 0.4, 160),
    height: Math.min(SW * 0.4, 160),
    borderRadius: 999,
    shadowOpacity: 0.28,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
});
