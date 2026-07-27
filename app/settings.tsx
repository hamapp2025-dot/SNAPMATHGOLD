import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import PlaceholderLogo from '../components/PlaceholderLogo';
import LanguageToggle from '../src/components/LanguageToggle';
import { auth } from '../firebaseConfig';
import { useAppTheme } from '../src/theme/ThemeContext';
import { THEMES } from '../src/theme/themes';
import { getThemeSemantics } from '../src/theme/themeSemantics';
import { useT } from '../src/config/LanguageContext';
import { useNotifications } from '../src/hooks/useNotifications';
import { getFeatureGateContent, getTierLabel } from '../src/subscriptions/subscriptionAccess';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { clearUserSessionStorage } from '../src/utils/sessionStorage';

const APP_VERSION = `${Constants.expoConfig?.version ?? '1.0.0'} (build ${Constants.expoConfig?.ios?.buildNumber ?? '23'})`;
const SUPPORT_EMAIL = Constants.expoConfig?.extra?.supportEmail ?? 'support@snapmathacademy.com';

function SectionTitle({ text, color, isAr }: { text: string; color: string; isAr: boolean }) {
  return (
    <Text style={[s.sectionTitle, { color }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.sectionTitleRtl]}>
      {stabilizeMixedMathText(text, isAr)}
    </Text>
  );
}

function MetaText({ text, color, isAr }: { text: string; color: string; isAr: boolean }) {
  return (
    <Text style={[s.rowMeta, { color }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.rowMetaRtl]}>
      {stabilizeMixedMathText(text, isAr)}
    </Text>
  );
}

function Row({
  label,
  right,
  noBorder,
  danger,
  textColor,
  borderColor,
  dangerColor,
  isAr,
}: {
  label: string;
  right?: React.ReactNode;
  noBorder?: boolean;
  danger?: boolean;
  textColor: string;
  borderColor: string;
  dangerColor: string;
  isAr?: boolean;
}) {
  return (
    <View style={[s.row, isAr && s.rowRtl, { borderBottomColor: borderColor }, noBorder && s.noBorder]}>
      <Text
        style={[
          s.rowLabel,
          isAr && s.rowLabelRtl,
          isAr ? s.textRtlFlow : s.textLtrFlow,
          { color: textColor },
          danger && { color: dangerColor },
        ]}>
        {stabilizeMixedMathText(label, !!isAr)}
      </Text>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeId, setThemeId, canUseThemeId } = useAppTheme();
  const { t, isAr } = useT();
  const ui = getThemeSemantics(theme);
  const {
    supported: notificationsSupported,
    enabled: reminderOn,
    hour,
    minute,
    toggle: toggleReminder,
    setTime,
  } = useNotifications();
  const { currentTier, billingMode } = useSubscription();
  const isSignedIn = !!auth.currentUser;
  const premiumThemeGate = getFeatureGateContent('premiumThemes', isAr);
  const settingsStatusPills = [
    {
      key: 'plan',
      icon: 'card-outline',
      label: isAr ? `الخطة ${getTierLabel(currentTier, isAr)}` : `${getTierLabel(currentTier, isAr)} plan`,
    },
    {
      key: 'sync',
      icon: isSignedIn ? 'cloud-done-outline' : 'phone-portrait-outline',
      label: isSignedIn ? (isAr ? 'حفظ مع الحساب' : 'Saved with account') : (isAr ? 'حفظ على هذا الجهاز' : 'Saved on this device'),
    },
    {
      key: 'notify',
      icon: notificationsSupported ? 'notifications-outline' : 'alert-circle-outline',
      label: notificationsSupported ? (isAr ? 'التذكيرات مدعومة' : 'Reminders supported') : (isAr ? 'التذكيرات تحتاج TestFlight' : 'Reminders need TestFlight'),
    },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      isAr ? 'حذف الحساب' : 'Delete account',
      isAr
        ? 'لحذف حسابك، راسل الدعم من البريد المرتبط بحسابك وسنساعدك بسرعة.'
        : 'To delete your account, email support from the address linked to your account and we will help you quickly.',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'مراسلة الدعم' : 'Email Support',
          style: 'destructive',
          onPress: async () => {
            const subject = encodeURIComponent(
              isAr
                ? 'طلب حذف حساب SnapMath Academy'
                : 'SnapMath Academy account deletion request',
            );
            const body = encodeURIComponent(
              isAr
                ? 'مرحباً، أود حذف الحساب المرتبط بهذا البريد الإلكتروني.'
                : 'Hello, I would like to delete the account associated with this email address.',
            );
            const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

            try {
              const canOpen = await Linking.canOpenURL(mailtoUrl);
              if (!canOpen) throw new Error('unsupported');
              await Linking.openURL(mailtoUrl);
            } catch {
              Alert.alert(
                isAr ? 'تعذر الفتح' : 'Unable to open',
                isAr ? 'حاول مرة أخرى لاحقاً.' : 'Please try again later.',
              );
            }
          },
        },
      ],
    );
  };

  const logout = () => {
    Alert.alert(isAr ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to log out?', '', [
      { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
      {
        text: isAr ? 'تسجيل الخروج' : 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            await clearUserSessionStorage();
            await AsyncStorage.setItem('@snapmath_seen_welcome', '1');
            router.replace('/auth');
          } catch {
            Alert.alert(
              t('settingsLogoutErrorTitle'),
              t('settingsLogoutErrorBody')
            );
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={[s.header, isAr && s.headerRtl, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
          {stabilizeMixedMathText(t('settings'), isAr)}
        </Text>
        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={21} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[s.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.statusTopRow, isAr && s.rowRtl]}>
          <View style={[s.statusBadge, { backgroundColor: ui.accentSoft, borderColor: ui.accentBorder }]}>
            <Ionicons name={billingMode === 'revenuecat' ? 'shield-checkmark-outline' : 'construct-outline'} size={14} color={theme.accent} />
            <Text style={[s.statusBadgeText, { color: theme.accent }]}>
              {billingMode === 'revenuecat'
                ? (isAr ? 'الإعدادات جاهزة للإطلاق' : 'Settings ready for launch')
                : billingMode === 'preview' && currentTier !== 'free'
                  ? (isAr ? 'نسخة تجريبية مع وصول مشمول' : 'Preview build with included access')
                : (isAr ? 'الإعدادات في وضع المعاينة' : 'Settings in preview mode')}
            </Text>
          </View>
          <Text style={[s.statusVersion, { color: theme.muted }]}>v{APP_VERSION}</Text>
        </View>
        <Text style={[s.statusSummary, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
          {stabilizeMixedMathText(
            isAr
              ? 'من هنا تدير الثيم، اللغة، التذكيرات، وبيانات الحساب في مكان واحد.'
              : 'Manage theme, language, reminders, and account data from one place.',
            isAr,
          )}
        </Text>
        <View style={[s.statusPillRow, isAr && s.rowRtl]}>
          {settingsStatusPills.map((item) => (
            <View key={item.key} style={[s.statusPill, { backgroundColor: ui.panelRaised, borderColor: theme.border }, isAr && s.rowRtl]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={theme.accent} />
              <Text style={[s.statusPillText, { color: theme.text }]}>{stabilizeMixedMathText(item.label, isAr)}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionTitle text={isAr ? 'الثيم واللغة' : `THEME & ${t('appLanguage')}`} color={theme.muted} isAr={isAr} />
      <View style={[s.themeGrid, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {Object.values(THEMES).map((opt) => {
          const active = opt.id === themeId;
          const locked = !canUseThemeId(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.85}
              style={[
                s.themeCard,
                {
                  borderColor: active ? opt.accent : theme.border,
                  backgroundColor: opt.bg,
                  opacity: locked ? 0.76 : 1,
                },
              ]}
              onPress={async () => {
                if (locked) {
                  Alert.alert(
                    isAr ? 'الثيمات المميزة مغلقة' : 'Premium themes are locked',
                    premiumThemeGate.body,
                    [
                      { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
                      {
                        text: isAr ? 'عرض الخطط' : 'View Plans',
                        onPress: () => router.push('/subscription'),
                      },
                    ],
                  );
                  return;
                }

                await setThemeId(opt.id);
              }}>
              {/* Gradient preview strip */}
              <LinearGradient colors={opt.logoGradient} style={s.themeStrip} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={s.themeCardBody}>
                <View style={[s.themeMetaRow, isAr && s.rowRtl]}>
                  <Text style={[s.themeName, { color: opt.text }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
                    {stabilizeMixedMathText(isAr ? opt.nameAr : opt.nameEn, isAr)}
                  </Text>
                  {opt.tier !== 'free' ? (
                    <View
                      style={[
                        s.themeTierPill,
                        {
                          backgroundColor: locked ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.16)',
                          borderColor: locked ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.26)',
                        },
                      ]}>
                      <Text style={[s.themeTierText, { color: opt.text }]}>
                        {isAr ? 'المميزة' : 'Premium'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[s.themeTierHint, { color: opt.text }]}>
                  {locked
                    ? (isAr ? 'يتطلب ترقية' : 'Upgrade required')
                    : (opt.tier === 'free' ? (isAr ? 'مفتوح' : 'Open') : (isAr ? 'مفتوح الآن' : 'Unlocked'))}
                </Text>
                <View style={s.themeSwatches}>
                  <View style={[s.swatch, { backgroundColor: opt.bg }]} />
                  <View style={[s.swatch, { backgroundColor: opt.surfaceSoft }]} />
                  <View style={[s.swatch, { backgroundColor: opt.accent }]} />
                </View>
              </View>
              {active && (
                <View style={[s.themeCheck, { backgroundColor: opt.accent }]}>
                  <Ionicons name="checkmark" size={12} color={opt.primaryInk} />
                </View>
              )}
              {locked ? (
                <View style={[s.themeLock, { backgroundColor: ui.scrim }]}>
                  <Ionicons name="lock-closed" size={12} color={opt.text} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Language toggle — prominent row */}
      <View style={[s.langCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.langLabelWrap, isAr && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="language-outline" size={20} color={theme.accent} />
          <Text style={[s.langLabel, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
            {stabilizeMixedMathText(isAr ? 'لغة التطبيق' : 'App Language', isAr)}
          </Text>
        </View>
        <LanguageToggle />
      </View>

      <SectionTitle text={t('settingsProgressData')} color={theme.muted} isAr={isAr} />
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Row
          label={t('settingsSaveMode')}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <MetaText text={isSignedIn ? t('settingsLocalCloud') : t('settingsLocalOnly')} color={theme.muted} isAr={isAr} />
          }
        />
        <Row
          label={t('settingsWhatGetsSaved')}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <MetaText text={t('settingsSavedItems')} color={theme.muted} isAr={isAr} />
          }
        />
        <Row
          label={t('settingsLessonMastery')}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <MetaText text={isSignedIn ? t('settingsBackedUp') : t('settingsOnDevice')} color={theme.muted} isAr={isAr} />
          }
        />
        <Row
          label={t('settingsTimedSessions')}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <MetaText text={t('settingsInsideExamSim')} color={theme.muted} isAr={isAr} />
          }
        />
        <Row
          label={t('settingsSyncStatus')}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          noBorder
          right={
            <MetaText text={isSignedIn ? t('settingsAutoSync') : t('settingsSignInForCloud')} color={theme.muted} isAr={isAr} />
          }
        />
      </View>

      <SectionTitle text={isAr ? 'التذكير اليومي' : 'DAILY REMINDER'} color={theme.muted} isAr={isAr} />
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Row
          label={isAr ? 'تذكير يومي بالتدريب' : 'Daily Practice Reminder'}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <Switch
              value={reminderOn}
              onValueChange={async (v) => {
                const enabledNow = await toggleReminder(v, isAr);
                if (v && enabledNow) {
                  Alert.alert(
                    isAr ? '🔔 تم التفعيل!' : '🔔 Reminder Set!',
                    isAr
                      ? `ستصلك تذكيرات يومية عند الساعة ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
                      : `You'll get daily reminders at ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`
                  );
                } else if (v && !notificationsSupported) {
                  Alert.alert(
                    isAr ? 'غير متاح هنا' : 'Not available here',
                    isAr
                      ? 'التذكيرات تحتاج نسخة تطوير أو TestFlight، ولن تعمل داخل Expo Go.'
                      : 'Reminders need a development build or TestFlight and will not work inside Expo Go.',
                  );
                }
              }}
              trackColor={{ false: ui.switchTrackOff, true: theme.accent }}
              thumbColor={ui.switchThumb}
              ios_backgroundColor={ui.switchTrackOff}
            />
          }
        />
        <Row
          label={isAr ? 'وقت التذكير' : 'Reminder Time'}
          textColor={theme.text}
          borderColor={theme.border}
          dangerColor={theme.danger}
          isAr={isAr}
          right={
            <TouchableOpacity
              activeOpacity={0.8}
              style={[s.timeBtn, { borderColor: theme.accent }, isAr && s.rowRtl]}
              onPress={() => {
                const times = [[7, 0], [12, 0], [19, 0], [21, 0]];
                const cur = times.findIndex(([h]) => h === hour);
                const next = times[(cur + 1) % times.length];
                setTime(next[0], next[1], isAr);
              }}>
              <Ionicons name="alarm-outline" size={15} color={theme.accent} />
              <Text style={[s.timeBtnText, { color: theme.accent }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, isAr)}
              </Text>
            </TouchableOpacity>
          }
        />
        {reminderOn && (
          <TouchableOpacity
            style={[s.testNotifBtn, { borderColor: theme.border }, isAr && s.rowRtl]}
            activeOpacity={0.8}
            onPress={async () => {
              if (!notificationsSupported) {
                Alert.alert(
                  isAr ? 'غير متاح هنا' : 'Not available here',
                  isAr
                    ? 'الإشعار التجريبي يحتاج نسخة تطوير أو TestFlight، ولن يعمل داخل Expo Go.'
                    : 'Test notifications need a development build or TestFlight and will not work inside Expo Go.',
                );
                return;
              }
              const { status } = await Notifications.getPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  isAr ? 'الإذن مطلوب' : 'Permission Required',
                  isAr ? 'يرجى السماح بالإشعارات في إعدادات الجهاز.' : 'Please allow notifications in device settings.'
                );
                return;
              }
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: isAr ? '📚 وقت الرياضيات!' : '📚 Math Time!',
                  body: isAr ? 'هذا اختبار للإشعار. سيصلك تذكيرك اليومي في الوقت المحدد.' : 'Test notification! Your daily reminder is working perfectly.',
                  sound: true,
                },
                trigger: { seconds: 3, type: 'timeInterval' } as any,
              });
              Alert.alert(
                isAr ? 'تم الإرسال!' : 'Sent!',
                isAr ? 'ستصل إشعار تجريبي خلال 3 ثوانٍ.' : 'A test notification will arrive in 3 seconds.'
              );
            }}
          >
            <Ionicons name="notifications-outline" size={16} color={theme.muted} />
            <Text style={[s.testNotifText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
              {stabilizeMixedMathText(isAr ? 'إرسال إشعار تجريبي' : 'Send test notification', isAr)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionTitle text={t('accountMgmt')} color={theme.muted} isAr={isAr} />
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity onPress={logout} activeOpacity={0.8}>
          <Row
            label={t('logOut')}
            textColor={theme.text}
            borderColor={theme.border}
            dangerColor={theme.danger}
            isAr={isAr}
            right={<Ionicons name="log-out-outline" size={20} color={theme.muted} />}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.8}>
          <Row
            label={t('deleteAccount')}
            textColor={theme.text}
            borderColor={theme.border}
            dangerColor={theme.danger}
            isAr={isAr}
            danger
            noBorder
            right={<Ionicons name="trash-outline" size={20} color={theme.danger} />}
          />
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <PlaceholderLogo size={50} showLabel={false} />
        <Text style={[s.version, { color: theme.muted }, s.textLtrFlow]}>
          {stabilizeMixedMathText(`SnapMath Academy · v${APP_VERSION}`, isAr)}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, direction: 'ltr' },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingBottom: 12 },
  headerRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 17, fontFamily: 'Amiri_700Bold' },
  statusCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  statusTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  statusBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  statusVersion: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  statusSummary: { fontSize: 14, lineHeight: 21, fontFamily: 'Amiri_400Regular', marginBottom: 10 },
  statusPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  statusPillText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  sectionTitle: { color: '#8A92B5', fontSize: 16, letterSpacing: 0.8, marginTop: 16, marginBottom: 8, fontFamily: 'Amiri_700Bold' },
  sectionTitleRtl: { letterSpacing: 0, textAlign: 'right' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  themeGrid: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  themeCard: {
    width: '48.5%',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  themeStrip: { height: 6 },
  themeCardBody: { padding: 10 },
  themeMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  themeSwatches: { flexDirection: 'row', gap: 5, marginTop: 6 },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  themeName: { fontSize: 14, fontFamily: 'Amiri_700Bold' },
  themeTierPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  themeTierText: { fontSize: 10, fontFamily: 'Amiri_700Bold' },
  themeTierHint: { fontSize: 11, fontFamily: 'Amiri_700Bold', marginTop: 6 },
  themeCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeLock: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },

  // Language pill card
  langCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  langLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langLabel: { fontSize: 15, fontFamily: 'Amiri_700Bold' },
  row: { minHeight: 74, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowRtl: { flexDirection: 'row-reverse' },
  noBorder: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 17, flex: 1, paddingRight: 12, fontFamily: 'Amiri_700Bold' },
  rowLabelRtl: { textAlign: 'right', paddingRight: 0, paddingLeft: 12 },
  rowValue: { fontSize: 17, fontFamily: 'Amiri_700Bold' },
  rowMeta: { fontSize: 13, fontFamily: 'Amiri_400Regular', textAlign: 'left', maxWidth: 148 },
  rowMetaRtl: { textAlign: 'right' },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  timeBtnText: { fontSize: 14, fontFamily: 'Amiri_700Bold' },
  testNotifBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 14, paddingVertical: 10, borderTopWidth: 1 },
  testNotifText: { fontSize: 13, fontFamily: 'Amiri_400Regular' },
  footer: { alignItems: 'center', marginTop: 26, marginBottom: 10 },
  version: { fontSize: 13, marginTop: 12, textAlign: 'center', fontFamily: 'Amiri_400Regular' },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
