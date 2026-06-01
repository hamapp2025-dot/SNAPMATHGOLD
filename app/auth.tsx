import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import SnapMathLogo from '../components/SnapMathLogo';
import { useT } from '../src/config/LanguageContext';
import { useAppTheme } from '../src/theme/ThemeContext';
import type { AppTheme } from '../src/theme/themes';
import { withAlpha } from '../src/theme/colorUtils';
import { getThemeSemantics } from '../src/theme/themeSemantics';
import { clearUserSessionStorage } from '../src/utils/sessionStorage';

const BG = '#070A17';
const SURFACE = 'rgba(20,26,54,0.84)';
const SURFACE_SOFT = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.68)';
const TEXT = '#FFFFFF';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E9D7A2';
const DANGER = '#F08484';
const INK = '#121626';
const WELCOME_KEY = '@snapmath_seen_welcome';
const GOOGLE_IOS_CLIENT_ID = (Constants.expoConfig?.extra?.googleIosClientId ?? '').trim();
const GOOGLE_WEB_CLIENT_ID = (Constants.expoConfig?.extra?.googleWebClientId ?? '').trim();

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'signup';
type NextRoute = '/auth' | '/onboarding' | '/(tabs)';

function normalizeNextRoute(value: string | string[] | undefined): NextRoute {
  const route = Array.isArray(value) ? value[0] : value;
  if (route === '/auth' || route === '/onboarding' || route === '/(tabs)') {
    return route;
  }
  return '/auth';
}

function normalizeAuthMode(value: string | string[] | undefined, fallback: AuthMode): AuthMode {
  const mode = Array.isArray(value) ? value[0] : value;
  return mode === 'signup' || mode === 'login' ? mode : fallback;
}

type AuthFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isAr: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  showToggle?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  autoFocus?: boolean;
};

function AuthField({
  icon,
  value,
  onChangeText,
  placeholder,
  isAr,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  showToggle = false,
  revealed = false,
  onToggleReveal,
  autoFocus = false,
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppTheme();
  const ui = getThemeSemantics(theme);
  const idleBorder = theme.border;
  const idleSurface = ui.panelRaised;
  const activeBorder = ui.accentBorder;
  const activeSurface = ui.accentSoft;
  const mutedColor = theme.muted;
  const textColor = theme.text;
  const highlightColor = theme.accent;

  return (
    <View
      style={[
        s.inputShell,
        {
          borderColor: focused ? activeBorder : idleBorder,
          backgroundColor: focused ? activeSurface : idleSurface,
        },
        isAr && s.rowReverse,
      ]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused ? highlightColor : mutedColor}
        style={isAr ? s.iconRtl : s.iconLtr}
      />
      <TextInput
        style={[s.input, { color: textColor }, isAr && s.textRight]}
        placeholder={placeholder}
        placeholderTextColor={mutedColor}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry && !revealed}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
      />
      {showToggle ? (
        <TouchableOpacity
          onPress={onToggleReveal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={revealed ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={mutedColor}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type GoogleProviderButtonProps = {
  theme: AppTheme;
  isAr: boolean;
  disabled: boolean;
  loading: boolean;
  isConfigured: boolean;
  onLoadingChange: (value: boolean) => void;
  onGoogleToken: (idToken: string) => Promise<void>;
  mapProviderError: (err: any) => string;
  setError: (value: string | null) => void;
  onUnavailablePress: () => void;
};

type SocialCircleButtonProps = {
  theme: AppTheme;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
};

function SocialCircleButton({
  theme,
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  dimmed = false,
}: SocialCircleButtonProps) {
  const ui = getThemeSemantics(theme);
  const circleBg = ui.accentSoft;
  const circleBorder = ui.accentBorder;
  const circleShadow = theme.logoShadow;
  const circleIcon = theme.accent;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.socialCircle,
        {
          backgroundColor: circleBg,
          borderColor: circleBorder,
          shadowColor: circleShadow,
          opacity: dimmed ? 0.72 : disabled && !loading ? 0.78 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={circleIcon} size="small" />
      ) : (
        <Ionicons name={icon} size={28} color={circleIcon} />
      )}
    </TouchableOpacity>
  );
}

type ConfiguredGoogleProviderButtonProps = Omit<GoogleProviderButtonProps, 'isConfigured' | 'onUnavailablePress'>;

function ConfiguredGoogleProviderButton({
  theme,
  isAr,
  disabled,
  loading,
  onLoadingChange,
  onGoogleToken,
  mapProviderError,
  setError,
}: ConfiguredGoogleProviderButtonProps) {
  const [request, response, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
  });
  const handledTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;

    if (response.type !== 'success') {
      onLoadingChange(false);
      return;
    }

    const idToken = response.params?.id_token;
    if (!idToken) {
      onLoadingChange(false);
      setError(isAr ? 'تعذر الحصول على رمز Google.' : 'Could not get a Google sign-in token.');
      return;
    }
    if (handledTokenRef.current === idToken) {
      return;
    }
    handledTokenRef.current = idToken;

    void (async () => {
      try {
        await onGoogleToken(idToken);
      } catch (err) {
        setError(mapProviderError(err));
      } finally {
        onLoadingChange(false);
      }
    })();
  }, [response, isAr, mapProviderError, onGoogleToken, onLoadingChange, setError]);

  const handlePress = async () => {
    if (!request) {
      setError(isAr ? 'تعذر بدء تسجيل الدخول عبر Google.' : 'Could not start Google sign-in.');
      return;
    }

    onLoadingChange(true);
    setError(null);

    try {
      await promptGoogleAsync();
    } catch (err) {
      onLoadingChange(false);
      setError(mapProviderError(err));
    }
  };

  return (
    <SocialCircleButton
      theme={theme}
      icon="logo-google"
      label={isAr ? 'المتابعة باستخدام Google' : 'Continue with Google'}
      onPress={handlePress}
      disabled={disabled}
      loading={loading}
    />
  );
}

function GoogleProviderButton({
  isConfigured,
  onUnavailablePress,
  ...props
}: GoogleProviderButtonProps) {
  if (!isConfigured) {
    return (
      <SocialCircleButton
        theme={props.theme}
        icon="logo-google"
        label={props.isAr ? 'Google قريباً' : 'Google coming soon'}
        onPress={onUnavailablePress}
        disabled={props.disabled}
        dimmed
      />
    );
  }

  return <ConfiguredGoogleProviderButton {...props} />;
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string | string[]; mode?: string | string[] }>();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const isLightTheme = theme.id === 'light';
  const ui = useMemo(() => getThemeSemantics(theme), [theme]);
  const nextRoute = normalizeNextRoute(params.next);
  const initialMode = useMemo(
    () => normalizeAuthMode(params.mode, nextRoute === '/auth' ? 'signup' : 'login'),
    [params.mode, nextRoute]
  );
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<'google' | null>(null);
  const hasGoogleConfig = !!(GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  const canUseGoogleProvider = hasGoogleConfig;
  const showGoogleProvider = canUseGoogleProvider;
  const showFacebookProvider = false;
  const showProviderSection = showGoogleProvider || showFacebookProvider;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const copy = useMemo(() => {
    if (mode === 'login') {
      return {
        eyebrow: isAr ? 'حسابك الشخصي' : 'Your personal account',
        title: isAr ? 'مرحباً بعودتك' : 'Welcome back',
        subtitle: isAr
          ? 'سجّل الدخول لمتابعة الخطة اليومية، التقدم، والمدرب الذكي عبر أجهزتك.'
          : 'Sign in to keep your daily plan, progress, and AI coach synced across devices.',
        cardTitle: isAr ? 'ادخل وكمّل من حيث توقفت' : 'Pick up right where you left off',
        cardSub: isAr ? 'البريد الإلكتروني هو أسرع طريق للدخول الآن.' : 'Email sign-in is the fastest way in right now.',
      };
    }

    return {
      eyebrow: isAr ? 'ابدأ رحلتك' : 'Start your journey',
      title: isAr ? 'أنشئ حسابك' : 'Create your account',
      subtitle: isAr
        ? 'أنشئ حساباً للاحتفاظ بالإنجازات، التوصيات، والتقدم الدراسي.'
        : 'Create an account to save your streak, recommendations, and study progress.',
      cardTitle: isAr ? 'أنشئ حساباً خلال دقيقة' : 'Create your account in under a minute',
      cardSub: isAr ? 'نبدأ بالاسم، البريد، وكلمة المرور فقط.' : 'We only need your name, email, and password.',
    };
  }, [isAr, mode]);
  const valuePills = useMemo(
    () => [
      isAr ? 'الصف 12 الأردن' : 'Jordan Grade 12',
      isAr ? 'ثنائي اللغة' : 'Bilingual',
      isAr ? 'مدرب ذكي' : 'AI Coach',
    ],
    [isAr],
  );

  const persistProviderUser = async (uid: string, displayName: string) => {
    const [existingName, onboardingDone] = await Promise.all([
      AsyncStorage.getItem('@snapmath_name'),
      AsyncStorage.getItem('@snapmath_onboarding_done'),
    ]);

    const pairs: [string, string][] = [
      [WELCOME_KEY, '1'],
      ['@snapmath_uid', uid],
    ];

    if (!existingName && displayName) {
      pairs.push(['@snapmath_name', displayName]);
    }

    await AsyncStorage.multiSet(pairs);
    router.replace(onboardingDone === '1' ? '/(tabs)' : '/onboarding');
  };

  const mapProviderError = (err: any) => {
    const code = err?.code ?? '';
    if (
      code === 'auth/account-exists-with-different-credential' ||
      code === 'auth/credential-already-in-use'
    ) {
      return isAr
        ? 'هذا البريد مرتبط بطريقة تسجيل دخول مختلفة. جرّب البريد وكلمة المرور أولاً.'
        : 'This email is already linked to a different sign-in method. Try email and password first.';
    }
    if (code === 'auth/operation-not-allowed') {
      return isAr
        ? 'طريقة تسجيل الدخول هذه غير مفعلة بعد في إعدادات Firebase.'
        : 'This sign-in method is not enabled yet in Firebase.';
    }
    if (code === 'auth/invalid-credential') {
      return isAr ? 'تعذر التحقق من بيانات تسجيل الدخول.' : 'Could not verify the sign-in credential.';
    }
    if (code === 'auth/network-request-failed') {
      return t('authNetworkError');
    }
    return isAr ? 'تعذر تسجيل الدخول حالياً. حاول مرة أخرى.' : 'Unable to sign in right now. Please try again.';
  };

  const handleProviderCredential = async (credential: any, providedName?: string) => {
    setError(null);
    const result = await signInWithCredential(auth, credential);
    const resolvedName =
      result.user.displayName?.trim() ||
      providedName?.trim() ||
      result.user.email?.split('@')[0] ||
      (isAr ? 'طالب' : 'Student');

    if (!result.user.displayName && resolvedName) {
      await updateProfile(result.user, { displayName: resolvedName });
    }

    await persistProviderUser(result.user.uid, resolvedName);
  };

  const handleGoogleToken = async (idToken: string) => {
    await handleProviderCredential(GoogleAuthProvider.credential(idToken));
  };

  const showProviderAlert = (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      Alert.alert(
        isAr ? 'Google غير مهيأ بعد' : 'Google not configured yet',
        isAr
          ? 'أعدت زر Google بالشكل القديم، لكننا ما زلنا بحاجة إلى Google iOS/Web client IDs لتفعيل تسجيل الدخول.'
          : 'I restored the Google icon, but we still need the Google iOS/Web client IDs before sign in can work.',
      );
      return;
    }

    Alert.alert(
      isAr ? 'Facebook قريباً' : 'Facebook coming soon',
      isAr
        ? 'أعدت أيقونة Facebook بالشكل القديم، وسأربط تسجيل الدخول الحقيقي بعد إضافة Facebook SDK وربطه مع Firebase.'
        : 'I restored the Facebook icon, and I can wire real sign in after adding the Facebook SDK and Firebase auth setup.',
    );
  };

  const socialAuthDisabled = loading || providerLoading !== null;
  const socialDividerText = isAr ? 'أو تابع باستخدام' : 'Or continue with';

  const enterApp = async () => {
    setError(null);

    if (!email.trim()) {
      setError(t('authMissingEmail'));
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError(t('authShortPassword'));
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError(t('authMissingName'));
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await AsyncStorage.removeItem('@snapmath_onboarding_done');
        await AsyncStorage.multiSet([
          ['@snapmath_name', name.trim()],
          ['@snapmath_grade', 'g12'],
          [WELCOME_KEY, '1'],
          ['@snapmath_uid', cred.user.uid],
        ]);
        router.replace('/onboarding');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const displayName = cred.user.displayName ?? cred.user.email?.split('@')[0] ?? 'Student';
        const existingName = await AsyncStorage.getItem('@snapmath_name');
        if (!existingName) {
          await AsyncStorage.setItem('@snapmath_name', displayName);
        }
        const onboardingDone = await AsyncStorage.getItem('@snapmath_onboarding_done');
        await AsyncStorage.multiSet([
          [WELCOME_KEY, '1'],
          ['@snapmath_uid', cred.user.uid],
        ]);
        router.replace(onboardingDone === '1' ? '/(tabs)' : '/onboarding');
      }
    } catch (err: any) {
      const code: string = err?.code ?? '';
      let msg = t('authGenericError');
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        msg = t('authIncorrectCredentials');
      } else if (code === 'auth/email-already-in-use') {
        msg = t('authEmailInUse');
      } else if (code === 'auth/invalid-email') {
        msg = t('authInvalidEmail');
      } else if (code === 'auth/network-request-failed') {
        msg = t('authNetworkError');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!email.trim()) {
      Alert.alert(
        isAr ? 'أدخل بريدك الإلكتروني أولاً' : 'Enter your email first',
        isAr
          ? 'أدخل بريدك الإلكتروني ثم اضغط إعادة تعيين كلمة المرور.'
          : 'Enter your email, then tap reset password.',
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        isAr ? 'تم إرسال الرابط' : 'Reset link sent',
        isAr
          ? 'أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
          : 'We sent a password reset link to your email.',
      );
    } catch {
      Alert.alert(
        isAr ? 'تعذر الإرسال' : 'Could not send reset email',
        isAr
          ? 'تحقق من البريد الإلكتروني ثم حاول مرة أخرى.'
          : 'Please check the email and try again.',
      );
    }
  };

  const enterAsGuest = async () => {
    const [savedName, onboardingDone] = await Promise.all([
      AsyncStorage.getItem('@snapmath_name'),
      AsyncStorage.getItem('@snapmath_onboarding_done'),
    ]);

    if (savedName && onboardingDone) {
      router.replace('/(tabs)');
      return;
    }

    if (savedName) {
      router.replace('/onboarding');
      return;
    }

    if (auth.currentUser) {
      await signOut(auth);
      await clearUserSessionStorage();
    }

    await AsyncStorage.multiSet([
      [WELCOME_KEY, '1'],
      ['@snapmath_name', isAr ? 'ضيف' : 'Guest'],
      ['@snapmath_grade', 'g12'],
    ]);
    router.replace('/onboarding');
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <View style={[s.topOrb, { backgroundColor: withAlpha(theme.accent, isLightTheme ? 0.14 : 0.1), shadowColor: theme.accent }]} />
      <View style={[s.bottomOrb, { backgroundColor: withAlpha(theme.primary[0], isLightTheme ? 0.14 : 0.08), shadowColor: theme.primary[0] }]} />
      <LinearGradient
        colors={
          isLightTheme
            ? [withAlpha(theme.primary[0], 0.08), withAlpha(theme.accent, 0.05), 'transparent']
            : ['rgba(7,10,23,0.18)', 'rgba(7,10,23,0.42)', 'rgba(7,10,23,0.9)']
        }
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.keyboard}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              onPress={() => router.replace({ pathname: '/welcome', params: { next: nextRoute } })}
              activeOpacity={0.85}
              style={[s.backPill, { borderColor: ui.accentBorder, backgroundColor: ui.panelRaised }, isAr && s.backPillRtl]}>
              <Ionicons
                name={isAr ? 'arrow-forward' : 'arrow-back'}
                size={18}
                color={theme.text}
              />
            </TouchableOpacity>

            <View style={s.heroBlock}>
              <View style={s.brandRow}>
                <SnapMathLogo size={56} showLabel={false} />
                <View style={s.brandTextWrap}>
                  <Text style={[s.brandName, { color: theme.text }]}>{t('appName')}</Text>
                  <Text style={[s.brandMeta, { color: theme.accent }]}>ACADEMY</Text>
                </View>
              </View>

              <View style={[s.heroPill, { borderColor: ui.accentBorder, backgroundColor: ui.accentSoft }]}>
                <Text style={[s.heroPillText, { color: theme.accent }]}>{copy.eyebrow}</Text>
              </View>

              <Text style={[s.heroTitle, { color: theme.text }]}>{copy.title}</Text>
              <Text style={[s.heroSub, { color: theme.muted }]}>{copy.subtitle}</Text>
              <View style={[s.valueRow, isAr && s.rowReverse]}>
                {valuePills.map((pill) => (
                  <View key={pill} style={[s.valuePill, { backgroundColor: ui.accentSoft, borderColor: ui.accentBorder }]}>
                    <Text style={[s.valuePillText, { color: theme.text }]}>{pill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.logoShadow, shadowOpacity: isLightTheme ? 0.08 : 0.24 }]}>
              <View style={[s.tabRow, { backgroundColor: theme.surfaceSoft }]}>
                {(['login', 'signup'] as const).map((value) => {
                  const active = mode === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        setMode(value);
                        setError(null);
                      }}
                      activeOpacity={0.86}
                      style={[s.tabBtn, active && s.tabBtnActive, active && { backgroundColor: theme.accent }]}>
                      <Text style={[s.tabText, { color: active ? theme.primaryInk : theme.muted }]}>
                        {value === 'login' ? t('authSignInTab') : t('authSignUpTab')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.cardTitle, { color: theme.text }]}>{copy.cardTitle}</Text>
              <Text style={[s.cardSub, { color: theme.muted }]}>{copy.cardSub}</Text>

              {showProviderSection ? (
                <>
                  <View style={s.socialRow}>
                    {showGoogleProvider ? (
                      <GoogleProviderButton
                        theme={theme}
                        isAr={isAr}
                        disabled={socialAuthDisabled}
                        loading={providerLoading === 'google'}
                        isConfigured={canUseGoogleProvider}
                        onLoadingChange={(loadingNow) => setProviderLoading(loadingNow ? 'google' : null)}
                        onGoogleToken={handleGoogleToken}
                        mapProviderError={mapProviderError}
                        setError={setError}
                        onUnavailablePress={() => showProviderAlert('google')}
                      />
                    ) : null}

                    {showFacebookProvider ? (
                      <SocialCircleButton
                        theme={theme}
                        icon="logo-facebook"
                        label={isAr ? 'Facebook قريباً' : 'Facebook coming soon'}
                        onPress={() => showProviderAlert('facebook')}
                        disabled={socialAuthDisabled}
                        dimmed
                      />
                    ) : null}
                  </View>

                  <View style={[s.providerDivider, isAr && s.rowReverse]}>
                    <View style={[s.providerDividerLine, { backgroundColor: theme.border }]} />
                    <Text style={[s.providerDividerText, { color: theme.muted }]}>{socialDividerText}</Text>
                    <View style={[s.providerDividerLine, { backgroundColor: theme.border }]} />
                  </View>
                </>
              ) : null}

              {mode === 'signup' ? (
                <View style={s.fieldWrap}>
                  <Text style={[s.fieldLabel, { color: theme.muted }, isAr && s.textRight]}>{t('authFullName')}</Text>
                  <AuthField
                    icon="person-outline"
                    value={name}
                    onChangeText={setName}
                    placeholder={t('authYourNamePlaceholder')}
                    isAr={isAr}
                    autoCapitalize="words"
                    autoFocus
                  />
                </View>
              ) : null}

              <View style={s.fieldWrap}>
                <Text style={[s.fieldLabel, { color: theme.muted }, isAr && s.textRight]}>{t('email')}</Text>
                <AuthField
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('authEmailPlaceholder')}
                  isAr={isAr}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus={mode === 'login'}
                />
              </View>

              <View style={s.fieldWrap}>
                <Text style={[s.fieldLabel, { color: theme.muted }, isAr && s.textRight]}>{t('password')}</Text>
                <AuthField
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('authPasswordPlaceholder')}
                  isAr={isAr}
                  secureTextEntry
                  showToggle
                  revealed={showPass}
                  onToggleReveal={() => setShowPass((value) => !value)}
                />
              </View>

              {mode === 'login' ? (
                <TouchableOpacity
                  style={[s.forgotRow, isAr && s.forgotRowRtl]}
                  onPress={handleForgotPassword}
                  activeOpacity={0.8}>
                  <Text style={[s.forgotText, { color: theme.accent }]}>{t('forgotPass')}</Text>
                </TouchableOpacity>
              ) : null}

              {error ? (
                <View style={[s.errorBanner, isAr && s.rowReverse, { borderColor: withAlpha(theme.danger, 0.22), backgroundColor: ui.dangerSoft }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                  <Text style={[s.errorText, { color: theme.danger }, isAr && s.textRight]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={s.ctaWrap}
                onPress={enterApp}
                activeOpacity={0.92}
                disabled={loading}>
                <LinearGradient
                  colors={theme.primary}
                  style={s.cta}>
                  {loading ? (
                    <ActivityIndicator color={theme.primaryInk} size="small" />
                  ) : (
                    <>
                      <Text style={[s.ctaText, { color: theme.primaryInk }]}>
                        {mode === 'login' ? t('authSignInTab') : t('authCreateAccount')}
                      </Text>
                      <Ionicons
                        name={isAr ? 'arrow-back' : 'arrow-forward'}
                        size={18}
                        color={theme.primaryInk}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

            <TouchableOpacity
              onPress={enterAsGuest}
              activeOpacity={0.8}
              style={s.guestWrap}>
              <View style={[s.guestInner, { borderColor: ui.accentBorder, backgroundColor: ui.panelRaised }, isAr && s.rowReverse]}>
                <Ionicons name="compass-outline" size={17} color={theme.accent} />
                <Text style={[s.guestText, { color: theme.accent }]}>{t('authExploreGuest')}</Text>
              </View>
            </TouchableOpacity>

            <Text style={[s.guestHint, { color: theme.muted }]}>
              {isAr
                ? 'ابدأ كضيف الآن، ويمكنك إنشاء حساب لاحقاً بدون تعقيد.'
                : 'Start as a guest now, then create an account later when you are ready.'}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    direction: 'ltr',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 18,
  },
  keyboard: {
    flex: 1,
  },
  topOrb: {
    position: 'absolute',
    top: -56,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(201,168,76,0.10)',
    shadowColor: GOLD,
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomOrb: {
    position: 'absolute',
    right: -70,
    bottom: 120,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(80,100,210,0.08)',
    shadowColor: '#6387FF',
    shadowOpacity: 0.12,
    shadowRadius: 56,
    shadowOffset: { width: 0, height: 0 },
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backPill: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(12,16,38,0.76)',
  },
  backPillRtl: {
    alignSelf: 'flex-end',
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  brandTextWrap: {
    alignItems: 'center',
  },
  brandName: {
    color: TEXT,
    fontSize: 20,
    fontFamily: 'Amiri_700Bold',
  },
  brandMeta: {
    color: GOLD_LIGHT,
    fontSize: 10,
    letterSpacing: 4,
    marginTop: 1,
    fontFamily: 'Amiri_700Bold',
  },
  heroPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  heroPillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  heroTitle: {
    color: TEXT,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    maxWidth: 320,
    fontFamily: 'Amiri_700Bold',
  },
  heroSub: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 8,
    fontFamily: 'Amiri_400Regular',
  },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  valuePillText: {
    fontSize: 11,
    fontFamily: 'Amiri_700Bold',
  },
  card: {
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 16,
  },
  tabBtnActive: {
    backgroundColor: GOLD,
  },
  tabText: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  tabTextActive: {
    color: INK,
  },
  tabTextInactive: {
    color: MUTED,
  },
  cardTitle: {
    color: TEXT,
    fontSize: 22,
    textAlign: 'center',
    fontFamily: 'Amiri_700Bold',
  },
  cardSub: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
    fontFamily: 'Amiri_400Regular',
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: MUTED,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: 'Amiri_700Bold',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE_SOFT,
  },
  inputShellActive: {
    borderColor: 'rgba(233,215,162,0.58)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  input: {
    flex: 1,
    height: '100%',
    color: TEXT,
    fontSize: 16,
    fontFamily: 'Amiri_400Regular',
  },
  iconLtr: {},
  iconRtl: {},
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -2,
    marginBottom: 14,
  },
  forgotRowRtl: {
    alignItems: 'flex-start',
  },
  forgotText: {
    color: GOLD_LIGHT,
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(240,132,132,0.22)',
    backgroundColor: 'rgba(240,132,132,0.12)',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
  },
  ctaWrap: {
    marginTop: 4,
    borderRadius: 28,
    overflow: 'hidden',
  },
  cta: {
    height: 58,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: INK,
    fontSize: 17,
    fontFamily: 'Amiri_700Bold',
  },
  providerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  providerDividerLine: {
    flex: 1,
    height: 1,
  },
  providerDividerText: {
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 4,
  },
  socialCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  guestWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  guestInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(233,215,162,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  guestText: {
    color: GOLD_LIGHT,
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  guestHint: {
    color: MUTED,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 20,
    fontFamily: 'Amiri_400Regular',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
});
