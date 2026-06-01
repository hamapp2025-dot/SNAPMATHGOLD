import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import SampleFounderAvatar from '../../components/SampleFounderAvatar';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useXP } from '../../src/hooks/useXP';
import { getInitials, runtimeConfig } from '../../src/config/runtimeConfig';
import { founderMedia } from '../../src/media/founderMedia';
import { useSubscription } from '../../src/subscriptions/SubscriptionContext';
import type { SubscriptionTier } from '../../src/subscriptions/subscriptionAccess';
import { withAlpha } from '../../src/theme/colorUtils';
import { getThemeSemantics } from '../../src/theme/themeSemantics';

const TERMS_URL = 'https://snapmathacademy.com/terms';
const PRIVACY_URL = 'https://snapmathacademy.com/privacy';
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const CALENDAR_WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const CALENDAR_MONTH_FONT = Platform.select({
  ios: 'AvenirNext-DemiBold',
  android: 'sans-serif-medium',
  default: undefined,
});
const CALENDAR_DAY_FONT = Platform.select({
  ios: 'AvenirNext-Medium',
  android: 'sans-serif-medium',
  default: undefined,
});
const SOCIAL_LINKS = (Constants.expoConfig?.extra?.socialLinks ?? {}) as Record<string, string>;
const SOCIAL_FALLBACKS: Record<string, string> = {
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/',
  snapchat: 'https://www.snapchat.com/',
  youtube: 'https://www.youtube.com/',
  facebook: 'https://www.facebook.com/',
  twitter: 'https://x.com/',
};
const SOCIAL_ITEMS = [
  { key: 'instagram', icon: 'logo-instagram', labelEn: 'Instagram', labelAr: 'إنستغرام' },
  { key: 'tiktok', icon: 'logo-tiktok', labelEn: 'TikTok', labelAr: 'تيك توك' },
  { key: 'snapchat', icon: 'logo-snapchat', labelEn: 'Snapchat', labelAr: 'سناب شات' },
  { key: 'youtube', icon: 'logo-youtube', labelEn: 'YouTube', labelAr: 'يوتيوب' },
  { key: 'facebook', icon: 'logo-facebook', labelEn: 'Facebook', labelAr: 'فيسبوك' },
  { key: 'twitter', icon: 'logo-twitter', labelEn: 'Twitter / X', labelAr: 'تويتر / X' },
] as const;

function getSubscriptionMeta(tier: SubscriptionTier, isAr: boolean, accent: string, preferAccentForGold = false) {
  if (tier === 'gold') {
    return {
      color: preferAccentForGold ? accent : '#FFD700',
      label: isAr ? 'الخطة الذهبية' : 'Gold Plan',
    };
  }

  if (tier === 'silver') {
    return {
      color: '#C0C0D8',
      label: isAr ? 'الخطة الفضية' : 'Silver Plan',
    };
  }

  if (tier === 'bronze') {
    return {
      color: '#CD7F32',
      label: isAr ? 'الخطة البرونزية' : 'Bronze Plan',
    };
  }

  return {
    color: accent,
    label: isAr ? 'الخطة المجانية' : 'Free Plan',
  };
}

function Row({
  icon,
  color,
  title,
  subtitle,
  textColor,
  subColor,
  surfaceColor,
  borderColor,
  onPress,
  isAr,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  subtitle: string;
  textColor: string;
  subColor: string;
  surfaceColor: string;
  borderColor: string;
  onPress?: () => void;
  isAr?: boolean;
}) {
  return (
    <TouchableOpacity style={[s.row, isAr && s.rowRtl, { backgroundColor: surfaceColor, borderColor }]} activeOpacity={0.85} onPress={onPress}>
      <View style={[s.rowIcon, isAr ? s.rowIconRtl : s.rowIconLtr, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowTitle, { color: textColor }, isAr && s.textRtl]}>{title}</Text>
        <Text style={[s.rowSub, { color: subColor }, isAr && s.textRtl]}>{subtitle}</Text>
      </View>
      <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={subColor} />
    </TouchableOpacity>
  );
}

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

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const ui = useMemo(() => getThemeSemantics(theme), [theme]);
  const { totalXP, level, xpProgress, streak, activeDays } = useXP();
  const {
    currentTier: subscriptionTier,
    currentPeriodEndsAt,
    hasRevenueCatConfig,
    billingMode,
  } = useSubscription();
  const [userName, setUserName] = useState('');
  const [avatarColor, setAvatarColor] = useState(theme.accent);
  const [avatarUri, setAvatarUri] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lightTintOpacity = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0.16],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      AsyncStorage.multiGet([
        '@snapmath_name',
        '@snapmath_avatar_color',
        '@snapmath_avatar_uri',
      ]).then((vals) => {
        if (!active) return;

        const map = Object.fromEntries(vals.map(([k, v]) => [k, v ?? '']));
        if (map['@snapmath_name']) setUserName(map['@snapmath_name']);
        if (map['@snapmath_avatar_color']) setAvatarColor(map['@snapmath_avatar_color']);
        if (map['@snapmath_avatar_uri']) setAvatarUri(map['@snapmath_avatar_uri']);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 850);
    return () => clearTimeout(t);
  }, []);

  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(isAr ? 'إذن مطلوب' : 'Permission required', isAr ? 'اسمح بالوصول للصور من إعدادات الجهاز.' : 'Please allow photo library access in device settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        await AsyncStorage.setItem('@snapmath_avatar_uri', uri);
      }
    } catch {
      Alert.alert(isAr ? 'ميزة غير متاحة' : 'Feature unavailable', isAr ? 'تعذر فتح معرض الصور حالياً.' : 'Unable to open photo library right now.');
    }
  };

  const contactCoach = () => {
    router.push('/support');
  };

  const subscriptionMeta = getSubscriptionMeta(subscriptionTier, isAr, theme.accent, theme.id === 'light');
  const isPreviewAccessIncluded = billingMode === 'preview' && subscriptionTier !== 'free';
  const subscriptionRenewalLabel = useMemo(() => {
    if (!currentPeriodEndsAt) return null;

    const renewalDate = new Date(currentPeriodEndsAt);
    if (Number.isNaN(renewalDate.valueOf())) return null;

    const formatted = renewalDate.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
      month: isAr ? 'long' : 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return isAr ? `يتجدد ${formatted}` : `Renews ${formatted}`;
  }, [currentPeriodEndsAt, isAr]);
  const subscriptionSubtitle =
    subscriptionTier === 'free'
      ? (hasRevenueCatConfig
          ? (isAr ? 'لا يوجد اشتراك نشط حالياً' : 'No active subscription right now')
          : (isAr ? 'الاشتراكات لم تُربط بعد، وما زالت هذه الشاشة في وضع المعاينة' : 'Subscriptions are not connected yet, so this screen is still in preview mode'))
      : isPreviewAccessIncluded
        ? (isAr
            ? `${subscriptionMeta.label} · مشمولة حالياً في هذه النسخة التجريبية`
            : `${subscriptionMeta.label} · included in this preview build`)
      : (hasRevenueCatConfig
          ? (isAr
              ? `${subscriptionMeta.label} · ${subscriptionRenewalLabel ?? 'اشتراكك مرتبط مع App Store'}`
              : `${subscriptionMeta.label} · ${subscriptionRenewalLabel ?? 'your App Store subscription is active'}`)
          : (isAr
              ? `${subscriptionMeta.label} · اختيار محفوظ على هذا الجهاز فقط`
              : `${subscriptionMeta.label} · saved preview on this device`));
  const trustSummary = subscriptionTier === 'free'
    ? (isAr
        ? 'ملفك جاهز، ويمكنك ترقية الخطة لفتح المسار الكامل وميزات MathScan و AI Coach.'
        : 'Your profile is ready, and upgrading unlocks the full path plus MathScan and AI Coach.')
    : isPreviewAccessIncluded
      ? (isAr
          ? `هذه النسخة التجريبية تشمل ${subscriptionMeta.label} حالياً حتى يكتمل تشغيل الفوترة عبر App Store.`
          : `This preview build currently includes ${subscriptionMeta.label} while App Store billing is being finalized.`)
    : (isAr
        ? `${subscriptionMeta.label} نشطة الآن، وكل تقدمك محفوظ داخل تجربة SnapMath Academy.`
        : `${subscriptionMeta.label} is active, and your progress is saved inside the SnapMath Academy experience.`);
  const trustPills = [
    {
      key: 'billing',
      icon: billingMode === 'revenuecat' ? 'card-outline' : 'eye-outline',
      label: isPreviewAccessIncluded
        ? (isAr ? 'وصول تجريبي مشمول' : 'Preview access included')
        : billingMode === 'revenuecat'
        ? (isAr ? 'فوترة App Store جاهزة' : 'App Store billing ready')
        : (isAr ? 'وضع معاينة للاشتراك' : 'Subscription preview mode'),
    },
    {
      key: 'language',
      icon: 'language-outline',
      label: isAr ? 'English + العربية' : 'English + Arabic',
    },
    {
      key: 'support',
      icon: 'shield-checkmark-outline',
      label: isAr ? 'دعم سريع من داخل التطبيق' : 'Fast in-app support',
    },
  ];
  const founderTitle = isAr ? runtimeConfig.founderTitleAr : runtimeConfig.founderTitleEn;
  const founderMessage = isAr ? runtimeConfig.founderMessageAr : runtimeConfig.founderMessageEn;
  const founderInitials = getInitials(runtimeConfig.founderName);
  const founderImageSource = founderMedia.founderImageSource;
  const calendarLocale = isAr ? 'ar-JO' : 'en-US';
  const calendarWeekdays = isAr ? CALENDAR_WEEKDAYS_AR : CALENDAR_WEEKDAYS_EN;

  if (showSkeleton) {
    return (
      <View style={[s.container, { backgroundColor: theme.bg }]}>
        {theme.id === 'light' ? (
          <Animated.View pointerEvents="none" style={[s.lightTintOverlay, { opacity: lightTintOpacity }]}>
            <LinearGradient
              colors={[withAlpha(theme.primary[0], 0.22), withAlpha(theme.accent, 0.14), 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        ) : null}
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.header, isAr && s.headerRtl]}>
            <SkeletonBlock style={{ width: 130, height: 28 }} />
            <SkeletonBlock style={{ width: 24, height: 24, borderRadius: 12 }} />
          </View>

          <View style={s.avatarWrap}>
            <SkeletonBlock style={{ width: 116, height: 116, borderRadius: 58 }} />
          </View>
          <SkeletonBlock style={{ width: 140, height: 22, alignSelf: 'center', marginBottom: 16 }} />

          <SkeletonBlock style={{ height: 74, marginBottom: 10 }} />
          <SkeletonBlock style={{ height: 74, marginBottom: 10 }} />
          <SkeletonBlock style={{ height: 120, marginBottom: 14 }} />
          <SkeletonBlock style={{ height: 180, marginBottom: 14 }} />
          <SkeletonBlock style={{ height: 74, marginBottom: 10 }} />
          <SkeletonBlock style={{ height: 74, marginBottom: 10 }} />
        </ScrollView>
      </View>
    );
  }

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        isAr ? 'تعذر الفتح' : 'Unable to open',
        isAr ? 'حاول مرة أخرى لاحقاً.' : 'Please try again later.',
      );
    }
  };

  const openLegalLinks = () => {
    Alert.alert(
      isAr ? 'الشروط والخصوصية' : 'Terms & Privacy',
      isAr ? 'اختر الصفحة التي تريد مراجعتها.' : 'Choose which page you want to review.',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isAr ? 'الشروط' : 'Terms', onPress: () => void openUrl(TERMS_URL) },
        { text: isAr ? 'الخصوصية' : 'Privacy', onPress: () => void openUrl(PRIVACY_URL) },
      ],
    );
  };

  const openSocial = async (key: string, label: string) => {
    const rawUrl = SOCIAL_LINKS[key] || SOCIAL_FALLBACKS[key];
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        isAr ? 'تعذر الفتح' : 'Unable to open',
        isAr ? 'حاول مرة أخرى لاحقاً.' : 'Please try again later.',
      );
    }
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {theme.id === 'light' ? (
        <Animated.View pointerEvents="none" style={[s.lightTintOverlay, { opacity: lightTintOpacity }]}>
          <LinearGradient
            colors={[withAlpha(theme.primary[0], 0.22), withAlpha(theme.accent, 0.14), 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
      <AnimatedScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}>
        <View style={[s.header, isAr && s.headerRtl]}>
          <Text style={[s.headerTitle, { color: theme.text }]}>{t('profile')}</Text>
          <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={23} color={theme.text} />
          </TouchableOpacity>
        </View>

      <View style={s.avatarWrap}>
        <View style={[s.avatarCircle, { backgroundColor: avatarColor }]}> 
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={s.avatarImage} />
          ) : (
            <Text style={[s.avatarInitial, { color: theme.primaryInk }]}>{userName ? userName[0].toUpperCase() : '?'}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[s.camBadge, { backgroundColor: theme.accent, borderColor: theme.bg }, isAr && s.camBadgeRtl]}
          activeOpacity={0.85}
          onPress={pickAvatar}>
          <Ionicons name="camera" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Text style={[s.userName, { color: theme.text }]}>{userName || (isAr ? 'مستخدم' : 'Student')}</Text>

      <View style={[s.trustCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.trustTopRow, isAr && s.rowRtl]}>
          <View style={[s.trustBadge, { backgroundColor: withAlpha(subscriptionMeta.color, 0.12), borderColor: withAlpha(subscriptionMeta.color, 0.24) }]}>
            <Ionicons name="sparkles-outline" size={14} color={subscriptionMeta.color} />
            <Text style={[s.trustBadgeText, { color: subscriptionMeta.color }]}>
              {subscriptionMeta.label}
            </Text>
          </View>
          <Text style={[s.trustMeta, { color: theme.muted }, isAr && s.textRtl]}>
            {subscriptionRenewalLabel ?? (isAr ? 'حسابك جاهز الآن' : 'Your account is ready')}
          </Text>
        </View>
        <Text style={[s.trustSummary, { color: theme.text }, isAr && s.textRtl]}>{trustSummary}</Text>
        <View style={[s.trustPillRow, isAr && s.rowRtl]}>
          {trustPills.map((item) => (
            <View key={item.key} style={[s.trustPill, { backgroundColor: ui.accentSoft, borderColor: ui.accentBorder }, isAr && s.rowRtl]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={theme.accent} />
              <Text style={[s.trustPillText, { color: theme.text }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[s.founderCard, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && s.rowRtl]}>
        {founderImageSource ? (
          <View style={[s.founderAvatar, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.28) }]}>
            <Image source={founderImageSource} style={s.founderAvatarImage} />
          </View>
        ) : (
          <SampleFounderAvatar theme={theme} initials={founderInitials} size={54} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.founderName, { color: theme.text }, isAr && s.textRtl]}>{runtimeConfig.founderName}</Text>
          <Text style={[s.founderRole, { color: theme.accent }, isAr && s.textRtl]}>{founderTitle}</Text>
          <Text style={[s.founderCopy, { color: theme.muted }, isAr && s.textRtl]}>{founderMessage}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/textbook')}
            style={[s.founderBtn, { backgroundColor: ui.accentSoft }, isAr && s.rowRtl]}>
            <Ionicons name="document-text-outline" size={16} color={theme.accent} />
            <Text style={[s.founderBtnText, { color: theme.accent }]}>{isAr ? 'افتح الكتاب المدرسي' : 'Open textbook'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[s.section, { color: theme.muted }, isAr && s.textRtl]}>{t('connectSocial')}</Text>
      <View style={[s.socialCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.socialStrip, isAr && s.socialStripRtl]}>
          {SOCIAL_ITEMS.map((item) => {
            const label = isAr ? item.labelAr : item.labelEn;
            return (
              <TouchableOpacity
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={label}
                activeOpacity={0.84}
                onPress={() => void openSocial(item.key, label)}
                style={[
                  s.socialIconBtn,
                  {
                    backgroundColor: ui.accentSoft,
                    borderColor: ui.accentBorder,
                  },
                ]}>
                <Ionicons name={item.icon} size={18} color={theme.accent} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Row
        icon="card-outline"
        color={subscriptionMeta.color}
        textColor={theme.text}
        subColor={theme.muted}
        surfaceColor={theme.surface}
        borderColor={subscriptionTier === 'free' ? theme.border : `${subscriptionMeta.color}66`}
        title={isAr ? 'الاشتراك' : 'Subscription'}
        subtitle={subscriptionSubtitle}
        onPress={() => router.push('/subscription')}
        isAr={isAr}
      />
      <Row
        icon="gift-outline"
        color={theme.accent}
        textColor={theme.text}
        subColor={theme.muted}
        surfaceColor={theme.surface}
        borderColor={theme.border}
        title={isAr ? 'مكافآت الإحالة و XP' : 'Referral XP Rewards'}
        subtitle={isAr ? 'ادعُ زملاءك وافتح مراحل XP' : 'Invite classmates and unlock XP milestones'}
        onPress={() => router.push('/referral')}
        isAr={isAr}
      />

      <Text style={[s.section, { color: theme.muted }, isAr && s.textRtl]}>{isAr ? 'تقدمك' : 'YOUR PROGRESS'}</Text>

      <Row icon="trophy-outline" color={theme.accent} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={withAlpha(theme.accent, 0.33)} title={isAr ? 'لوحة المتصدرين' : 'Leaderboard'} subtitle={isAr ? 'شاهد ترتيبك مقارنة بالآخرين' : 'See how you rank against others'} onPress={() => router.push('/(tabs)/leaderboard')} isAr={isAr} />
      <Row icon="stats-chart-outline" color={theme.primary[0]} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'التقدم وسجل النتائج' : 'Score History & Progress'} subtitle={isAr ? 'نتائج الاختبارات ومعدلاتك' : 'Past exam scores and unit progress'} onPress={() => router.push('/progress')} isAr={isAr} />
      <Row icon="school-outline" color={theme.accent} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'محاكاة الاختبارات' : 'Exam Simulators'} subtitle={isAr ? 'اختبارات قصيرة وكاملة للتوجيهي' : 'Short and full-length Tawjihi mock exams'} onPress={() => router.push('/(tabs)/exams')} isAr={isAr} />
      <Row icon="people-outline" color={theme.primary[1]} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'لوحة ولي الأمر' : 'Parent Dashboard'} subtitle={isAr ? 'مشاركة التقدم مع الأهل' : 'Share progress with a parent view'} onPress={() => router.push('/(tabs)/parent')} isAr={isAr} />

      <LinearGradient colors={theme.primary} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.xpCard}>
        <View style={s.xpCardInner}>
          <View style={s.levelBadge}>
            <Text style={[s.levelNum, { color: theme.primaryInk }]}>{level}</Text>
            <Text style={[s.levelLabel, { color: withAlpha(theme.primaryInk, 0.7) }]}>{isAr ? 'مستوى' : 'LV'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.xpTopRow}>
              <Text style={[s.xpTotal, { color: theme.primaryInk }]}>{totalXP.toLocaleString()} XP</Text>
              <View style={s.streakBadge}>
                <Ionicons name="flame" size={13} color={streak > 0 ? '#FF6B3D' : withAlpha(theme.primaryInk, 0.5)} />
                <Text style={[s.streakCount, { color: withAlpha(theme.primaryInk, 0.8) }, streak > 0 && { color: '#FF6B3D' }]}>{streak} {isAr ? 'يوم' : 'days'}</Text>
              </View>
            </View>
            <View style={s.xpTrack}>
              <View style={[s.xpFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
            </View>
            <Text style={[s.xpNextLabel, { color: withAlpha(theme.primaryInk, 0.7) }]}>{isAr ? `${(100 - Math.round(xpProgress * 100))} نقطة للمستوى التالي` : `${(100 - Math.round(xpProgress * 100))}% to next level`}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[s.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Text style={[s.calendarMonth, { color: theme.text }]}>
          {new Date().toLocaleDateString(calendarLocale, { month: 'long', year: 'numeric' })}
        </Text>
        <View style={s.weekRow}>
          {calendarWeekdays.map((d) => (
            <Text key={d} style={[s.weekLabel, { color: theme.muted }]}>{d}</Text>
          ))}
        </View>
        <View style={s.daysGrid}>
          {(() => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const totalDays = new Date(year, month + 1, 0).getDate();
            const firstDow = new Date(year, month, 1).getDay();
            const cells: React.ReactElement[] = [];
            for (let p = 0; p < firstDow; p++) cells.push(<View key={`pad-${p}`} style={s.dayDot} />);
            for (let d = 1; d <= totalDays; d++) {
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isActive = activeDays.includes(iso);
              const isToday = d === now.getDate();
              cells.push(
                <View key={d} style={[s.dayDot, isActive && [s.dayDotActive, { backgroundColor: theme.accent }], isToday && [s.dayDotToday, { borderColor: theme.accent }]]}>
                  <Text style={[s.dayNumber, { color: isActive ? theme.primaryInk : theme.text }]}>{d}</Text>
                </View>
              );
            }
            return cells;
          })()}
        </View>
      </View>

      <Row icon="analytics-outline" color={theme.accent} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title="MathScan" subtitle={isAr ? 'صوّر مسألتك لتحصل على إرشاد خطوة بخطوة' : 'Snap a problem for step-by-step help'} onPress={() => router.push('/mathscan')} isAr={isAr} />

      <Text style={[s.section, { color: theme.muted }, isAr && s.textRtl]}>{isAr ? 'تدريب شخصي' : 'PERSONAL COACHING'}</Text>
      <Row icon="chatbubble-ellipses-outline" color={theme.accent} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'مساعدة دراسية مخصصة' : 'Get Study Help'} subtitle={isAr ? 'تواصل مع فريق SnapMath للدعم الأكاديمي' : 'Reach the SnapMath team for study guidance'} onPress={contactCoach} isAr={isAr} />

      <Text style={[s.section, { color: theme.muted }, isAr && s.textRtl]}>{isAr ? 'الدعم والملاحظات' : 'FEEDBACK & SUPPORT'}</Text>
      <Row icon="mail-outline" color={theme.accent} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'تواصل مع الدعم' : 'Contact Support'} subtitle={isAr ? 'نرد عادة خلال يوم' : 'We usually reply within a day'} onPress={() => router.push('/support')} isAr={isAr} />
      <Row icon="document-text-outline" color={theme.primary[1]} textColor={theme.text} subColor={theme.muted} surfaceColor={theme.surface} borderColor={theme.border} title={isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'} subtitle={isAr ? 'راجع سياسة الحساب والشروط' : 'Review policy and account terms'} onPress={openLegalLinks} isAr={isAr} />
      </AnimatedScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, direction: 'ltr' },
  lightTintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 230, zIndex: 0 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 22, fontFamily: 'Amiri_700Bold' },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatarCircle: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 44, fontFamily: 'Amiri_700Bold' },
  camBadge: { position: 'absolute', right: 4, bottom: 4, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  camBadgeRtl: { right: undefined, left: 4 },
  userName: { textAlign: 'center', fontSize: 20, marginBottom: 16, fontFamily: 'Amiri_700Bold' },
  trustCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 12 },
  trustTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  trustBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  trustMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular', flexShrink: 1 },
  trustSummary: { fontSize: 14, lineHeight: 22, fontFamily: 'Amiri_400Regular', marginBottom: 12 },
  trustPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  trustPillText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  founderCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 },
  founderAvatar: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  founderAvatarImage: { width: '100%', height: '100%' },
  founderAvatarText: { fontSize: 18, fontFamily: 'Amiri_700Bold' },
  founderName: { fontSize: 15, fontFamily: 'Amiri_700Bold' },
  founderRole: { marginTop: 2, fontSize: 12, fontFamily: 'Amiri_700Bold' },
  founderSampleTag: { marginTop: 8, alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  founderSampleTagText: { fontSize: 11, fontFamily: 'Amiri_700Bold' },
  founderCopy: { marginTop: 6, fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  founderBtn: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  founderBtnText: { fontSize: 13, fontFamily: 'Amiri_700Bold' },
  socialCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  socialStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  socialStripRtl: { flexDirection: 'row-reverse' },
  socialIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 10 },
  rowRtl: { flexDirection: 'row-reverse' },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowIconLtr: { marginRight: 12 },
  rowIconRtl: { marginLeft: 12 },
  rowTitle: { fontSize: 16, fontFamily: 'Amiri_700Bold' },
  rowSub: { fontSize: 12, marginTop: 1, fontFamily: 'Amiri_400Regular' },
  textRtl: { textAlign: 'right' },
  section: { color: '#8A92B5', fontSize: 11, letterSpacing: 1.6, marginTop: 12, marginBottom: 10, fontFamily: 'Amiri_700Bold', alignSelf: 'stretch' },

  xpCard: { borderRadius: 18, marginBottom: 14, overflow: 'hidden' },
  xpCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  levelBadge: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  levelNum: { color: '#FFF', fontSize: 22, fontFamily: 'Amiri_700Bold', lineHeight: 26 },
  levelLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Amiri_400Regular', letterSpacing: 1 },
  xpTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  xpTotal: { color: '#FFF', fontSize: 18, fontFamily: 'Amiri_700Bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  streakCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Amiri_700Bold' },
  xpTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  xpNextLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Amiri_400Regular' },

  calendarCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 2, marginBottom: 10 },
  calendarMonth: { textAlign: 'center', fontSize: 16, marginBottom: 10, fontFamily: CALENDAR_MONTH_FONT, letterSpacing: 0.2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekLabel: { color: '#8F95AD', fontSize: 12, width: '14%', textAlign: 'center', fontFamily: CALENDAR_DAY_FONT, letterSpacing: 0.2 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  dayDot: { width: '14%', alignItems: 'center', justifyContent: 'center', height: 28 },
  dayDotActive: { backgroundColor: '#C9A84C', borderRadius: 10 },
  dayDotToday: { borderWidth: 1, borderColor: '#C9A84C', borderRadius: 10 },
  dayNumber: { fontSize: 12, fontFamily: CALENDAR_DAY_FONT },
});
