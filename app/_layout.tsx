import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Cairo_700Bold } from '@expo-google-fonts/cairo';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

import { NetworkStatus } from '../components/NetworkStatus';
import { AppThemeProvider, useAppTheme } from '../src/theme/ThemeContext';
import { LanguageProvider, useT } from '../src/config/LanguageContext';
import { useFirestoreSync } from '../src/hooks/useFirestoreSync';
import { SubscriptionProvider } from '../src/subscriptions/SubscriptionContext';
import { withAlpha } from '../src/theme/colorUtils';

import { db } from '../firebaseConfig';
import SnapMathLogo from '../components/SnapMathLogo';
import ErrorBoundary from './ErrorBoundary';

export const unstable_settings = {
  anchor: '(tabs)',
};

const CONNECTION_TIMEOUT_MS = 4500;

void SplashScreen.preventAutoHideAsync().catch(() => {});

function LocalizedErrorBoundary({ children }: { children: ReactNode }) {
  const { isAr } = useT();

  return <ErrorBoundary isAr={isAr}>{children}</ErrorBoundary>;
}

function RootLayoutInner() {
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const [connecting, setConnecting] = useState(true);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sync user progress to/from Firestore when auth state changes
  useFirestoreSync();

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[Hamza Academy] Checking Firebase connection...');
        }
        const q = query(collection(db, 'units'), limit(1));
        await Promise.race([
          getDocs(q),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection check timed out.')), CONNECTION_TIMEOUT_MS);
          }),
        ]);
        if (cancelled) return;
        setServerReachable(true);
        setConnectionError(null);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[Hamza Academy] Firebase connected successfully.');
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setServerReachable(false);
        setConnectionError(message);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[Hamza Academy] Firebase connection failed:', message);
        }
      } finally {
        if (!cancelled) setConnecting(false);
      }
    }

    checkConnection();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const TextWithDefaults = Text as typeof Text & { defaultProps?: { style?: any } };
    TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
    TextWithDefaults.defaultProps.style = [
      {
        fontFamily: 'Amiri_400Regular',
        writingDirection: isAr ? 'rtl' : 'ltr',
        textAlign: isAr ? 'right' : 'left',
      },
      TextWithDefaults.defaultProps.style,
    ];

    const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: { style?: any } };
    TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
    TextInputWithDefaults.defaultProps.style = [
      {
        fontFamily: 'Amiri_400Regular',
        writingDirection: isAr ? 'rtl' : 'ltr',
        textAlign: isAr ? 'right' : 'left',
      },
      TextInputWithDefaults.defaultProps.style,
    ];
  }, [isAr]);

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
          {!connecting && (
            <NetworkStatus
              isReachable={serverReachable}
              errorMessage={connectionError ?? undefined}
            />
          )}
          <View style={styles.stackWrap}>
            <Stack
              screenOptions={{
                animation: isAr ? 'slide_from_left' : 'slide_from_right',
                animationDuration: 280,
                contentStyle: { backgroundColor: theme.bg },
              }}>
              <Stack.Screen name="index" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="intro" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="sound-library" options={{ headerShown: false }} />
              <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
              <Stack.Screen name="bookmark-review" options={{ headerShown: false }} />
              <Stack.Screen name="sound-detail" options={{ headerShown: false }} />
              <Stack.Screen name="subscription" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="referral" options={{ headerShown: false }} />
              <Stack.Screen name="support" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="chapter" options={{ headerShown: false }} />
              <Stack.Screen name="lesson-player" options={{ headerShown: false }} />
              <Stack.Screen name="lesson-summary" options={{ headerShown: false }} />
              <Stack.Screen name="lesson-feedback" options={{ headerShown: false }} />
              <Stack.Screen name="practice-session" options={{ headerShown: false }} />
              <Stack.Screen name="progress" options={{ headerShown: false }} />
              <Stack.Screen name="exam" options={{ headerShown: false }} />
              <Stack.Screen name="textbook" options={{ headerShown: false }} />
              <Stack.Screen name="mathscan" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
          </View>
      </View>
      <StatusBar style={theme.id === 'light' ? 'dark' : 'light'} />
    </ThemeProvider>
  );
}

function LaunchOverlay({ onDone }: { onDone: () => void }) {
  const { theme } = useAppTheme();
  const { t } = useT();
  const backdropOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const glow = useRef(new Animated.Value(0.86)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 58,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1.08,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(420),
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onDone();
      }
    });

    return () => {
      animation.stop();
    };
  }, [backdropOpacity, contentOpacity, glow, onDone, scale, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.launchOverlay,
        {
          backgroundColor: theme.bg,
          opacity: backdropOpacity,
        },
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.launchGlow,
          {
            backgroundColor: withAlpha(theme.accent, 0.14),
            shadowColor: theme.logoShadow,
            opacity: contentOpacity,
            transform: [{ scale: glow }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.launchGlowSecondary,
          {
            backgroundColor: withAlpha(theme.primary[1], 0.12),
            shadowColor: theme.logoShadow,
            opacity: contentOpacity,
            transform: [{ scale: glow }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.launchLogoShell,
          {
            backgroundColor: withAlpha(theme.surface, theme.id === 'light' ? 0.94 : 0.86),
            borderColor: withAlpha(theme.accent, 0.18),
            opacity: contentOpacity,
            transform: [{ translateY }, { scale }],
          },
        ]}>
        <LinearGradient
          colors={[withAlpha(theme.primary[0], 0.18), withAlpha(theme.accent, 0.08), 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <SnapMathLogo size={92} showLabel={false} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.launchTitle,
          {
            color: theme.text,
            opacity: contentOpacity,
            transform: [{ translateY }],
          },
        ]}>
        {t('appName')}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.launchSubtitle,
          {
            color: withAlpha(theme.text, 0.72),
            opacity: contentOpacity,
            transform: [{ translateY }],
          },
        ]}>
        {t('launchTagline')}
      </Animated.Text>
    </Animated.View>
  );
}

function AppBootstrap({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { theme } = useAppTheme();
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.fontLoading, { backgroundColor: theme.bg }]}>
        <SnapMathLogo size={88} showLabel={false} />
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.bootstrapRoot}>
      <RootLayoutInner />
      {showLaunchOverlay ? <LaunchOverlay onDone={() => setShowLaunchOverlay(false)} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Cairo_700Bold,
  });

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <LocalizedErrorBoundary>
          <SubscriptionProvider>
            <AppThemeProvider>
              <AppBootstrap fontsLoaded={fontsLoaded} />
            </AppThemeProvider>
          </SubscriptionProvider>
        </LocalizedErrorBoundary>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bootstrapRoot: {
    flex: 1,
  },
  stackWrap: {
    flex: 1,
  },
  fontLoading: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  launchOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 20,
  },
  launchGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowOpacity: 0.24,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 0 },
  },
  launchGlowSecondary: {
    position: 'absolute',
    width: 300,
    height: 160,
    borderRadius: 999,
    top: 120,
    shadowOpacity: 0.14,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  launchLogoShell: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  launchTitle: {
    fontSize: 22,
    fontFamily: 'Amiri_700Bold',
    letterSpacing: 0.4,
  },
  launchSubtitle: {
    fontSize: 13,
    fontFamily: 'Amiri_400Regular',
    letterSpacing: 0.2,
  },
});
