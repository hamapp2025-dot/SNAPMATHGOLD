import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { stabilizeMixedMathText } from '../src/utils/bidi';

const SUPPORT_EMAIL = 'support@snapmathacademy.com';
const WEBSITE_URL = 'https://snapmathacademy.com';
const TERMS_URL = 'https://snapmathacademy.com/terms';
const APP_VERSION = `${Constants.expoConfig?.version ?? '1.0.0'} (${Constants.expoConfig?.ios?.buildNumber ?? 'dev'})`;

// ─── FAQ data ────────────────────────────────────────────────────────────────
const FAQ_EN = [
  {
    q: 'How do I reset my progress?',
    a: 'Open Profile → Score History & Progress, then tap the trash icon and confirm. This clears saved lesson and exam history on this device.',
  },
  {
    q: 'Why is MathScan not recognising my problem?',
    a: 'Make sure the problem is well-lit and fits inside the scan frame. Handwritten problems may need clearer contrast. If it still misses the question, retake the photo straighter or crop closer before scanning.',
  },
  {
    q: 'Can I use the app offline?',
    a: 'Yes! All lesson content, practice questions, and your progress are stored locally on your device. The AI Chat and cloud sync require an internet connection.',
  },
  {
    q: 'How do I switch the app language?',
    a: 'Open Profile → Settings, then use the App Language toggle to switch between English and Arabic.',
  },
  {
    q: 'My subscription is not being restored — what do I do?',
    a: 'Tap "Restore Purchases" on the Subscription screen. Make sure you are signed in with the same Apple ID used for the original purchase. If the issue persists, contact us.',
  },
];

const FAQ_AR = [
  {
    q: 'كيف أعيد تعيين تقدمي؟',
    a: 'افتح الملف الشخصي ← التقدم وسجل النتائج، ثم اضغط رمز الحذف وأكد العملية. سيؤدي ذلك إلى مسح سجل الدروس والاختبارات المحفوظ على هذا الجهاز.',
  },
  {
    q: 'لماذا لا يتعرف MathScan على مسألتي؟',
    a: 'تأكد من أن المسألة مضاءة جيداً وتقع داخل إطار المسح. المسائل المكتوبة بخط اليد تحتاج إلى تباين أوضح. وإذا لم يلتقط السؤال جيداً، فأعد تصويره بشكل مستقيم أو قص الصورة بشكل أقرب قبل المسح.',
  },
  {
    q: 'هل يمكنني استخدام التطبيق بدون إنترنت؟',
    a: 'نعم! جميع محتويات الدروس وأسئلة التدريب وتقدمك محفوظة محلياً. تتطلب محادثة الذكاء الاصطناعي والمزامنة السحابية اتصالاً بالإنترنت.',
  },
  {
    q: 'كيف أغير لغة التطبيق؟',
    a: 'افتح الملف الشخصي ← الإعدادات، ثم استخدم مفتاح لغة التطبيق للتبديل بين English و Arabic.',
  },
  {
    q: 'اشتراكي لا يُستعاد — ماذا أفعل؟',
    a: 'اضغط "استعادة المشتريات" في شاشة الاشتراك. تأكد من تسجيل الدخول بنفس معرف Apple المستخدم في الشراء الأصلي. إذا استمرت المشكلة، تواصل معنا.',
  },
];

// ─── FAQ Accordion item ───────────────────────────────────────────────────────
function FAQItem({ q, a, isAr }: { q: string; a: string; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      style={[s.faqItem, { backgroundColor: theme.surface, borderColor: open ? theme.accent : theme.border }]}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.85}>
      <View style={[s.faqRow, isAr && s.rowRtl]}>
        <Text
          style={[
            s.faqQ,
            { color: theme.text, flex: 1 },
            isAr ? s.textRtlFlow : s.textLtrFlow,
            isAr && s.textRtl,
          ]}>
          {stabilizeMixedMathText(q, isAr)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={theme.accent} />
      </View>
      {open ? (
        <Text
          style={[
            s.faqA,
            { color: theme.muted },
            isAr ? s.textRtlFlow : s.textLtrFlow,
            isAr && s.textRtl,
          ]}>
          {stabilizeMixedMathText(a, isAr)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SupportScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [composerOpened, setComposerOpened] = useState(false);

  const faq = isAr ? FAQ_AR : FAQ_EN;
  const supportTrustPills = [
    { key: 'reply', icon: 'time-outline', label: isAr ? 'نرد عادة خلال يوم' : 'Usually replies within a day' },
    { key: 'mail', icon: 'mail-outline', label: SUPPORT_EMAIL },
    { key: 'version', icon: 'shield-checkmark-outline', label: `v${APP_VERSION}` },
  ];
  const composerTips = isAr
    ? ['اكتب الخطأ أو الصفحة بوضوح', 'اذكر إن كانت اللغة عربية أو English', 'أرفق لقطة شاشة عند الحاجة']
    : ['Describe the issue or page clearly', 'Mention whether it happened in Arabic or English', 'Add a screenshot when helpful'];

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        isAr ? 'تعذر الفتح' : 'Unable to open',
        isAr ? 'حاول مرة أخرى لاحقاً.' : 'Please try again later.',
      );
    });
  };

  const openEmail = async () => {
    const uri = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || t('supportDirectSubject'))}&body=${encodeURIComponent(message)}`;
    try {
      const canOpen = await Linking.canOpenURL(uri);
      if (!canOpen) throw new Error('unsupported');
      await Linking.openURL(uri);
    } catch {
      Alert.alert(
        t('supportMailOpenErrorTitle'),
        t('supportMailOpenErrorBody', { email: SUPPORT_EMAIL }),
      );
    }
  };

  const openWebsite = () => {
    openUrl(WEBSITE_URL);
  };

  const openTerms = () => {
    openUrl(TERMS_URL);
  };

  const sendFeedback = async () => {
    if (!message.trim()) {
      Alert.alert(
        t('supportEmptyMessageTitle'),
        t('supportEmptyMessageBody'),
      );
      return;
    }

    try {
      const entries = await AsyncStorage.multiGet(['@snapmath_name', '@snapmath_uid']);
      const map = Object.fromEntries(entries.map(([key, value]) => [key, value ?? '']));
      const composedSubject = subject.trim() || t('supportComposerSubject');
      const composedBody = [
        message.trim(),
        '',
        '---',
        `App version: ${APP_VERSION}`,
        `Language: ${isAr ? 'Arabic' : 'English'}`,
        `Student name: ${map['@snapmath_name'] || 'Unknown'}`,
        `User ID: ${map['@snapmath_uid'] || 'Unknown'}`,
      ].join('\n');
      const uri = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(composedSubject)}&body=${encodeURIComponent(composedBody)}`;
      const canOpen = await Linking.canOpenURL(uri);

      if (!canOpen) {
        throw new Error('unsupported');
      }

      await Linking.openURL(uri);
      setComposerOpened(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setComposerOpened(false), 3000);

      Alert.alert(
        t('supportMailOpenedTitle'),
        t('supportMailOpenedBody'),
      );
    } catch {
      const fallbackText = `${SUPPORT_EMAIL}\n\n${subject || t('supportComposerSubject')}\n\n${message}`;
      await Clipboard.setStringAsync(fallbackText);
      Alert.alert(
        t('supportMailUnavailableTitle'),
        t('supportMailUnavailableBody'),
      );
    }
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[s.header, isAr && s.rowRtl]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[
            s.headerTitle,
            { color: theme.text },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(t('supportTitle'), isAr)}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hero */}
      <View style={s.heroWrap}>
        <LinearGradient colors={theme.primary} style={[s.heroCircle, { shadowColor: theme.logoShadow }]}>
          <Ionicons name="headset" size={32} color={theme.primaryInk} />
        </LinearGradient>
        <Text
          style={[
            s.heroTitle,
            { color: theme.text },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(t('supportHeroTitle'), isAr)}
        </Text>
        <Text
          style={[
            s.heroSub,
            { color: theme.muted },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(t('supportHeroSub'), isAr)}
        </Text>
      </View>

      <View style={[s.trustCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[s.trustTitle, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
          {stabilizeMixedMathText(isAr ? 'قبل أن تراسلنا' : 'Before you contact us', isAr)}
        </Text>
        <Text style={[s.trustSub, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
          {stabilizeMixedMathText(
            isAr ? 'جهزنا لك أسرع الطرق للوصول إلى الدعم، مع معلومات واضحة عن الاستجابة والإصدار الحالي.' : 'We prepared the fastest support paths, with clear response and app version details.',
            isAr,
          )}
        </Text>
        <View style={[s.trustPillRow, isAr && s.rowRtl]}>
          {supportTrustPills.map((item) => (
            <View key={item.key} style={[s.trustPill, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && s.rowRtl]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} color={theme.accent} />
              <Text style={[s.trustPillText, { color: theme.text }, item.key === 'mail' && s.textLtrFlow]}>
                {stabilizeMixedMathText(item.label, isAr)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick contact buttons */}
      <View style={[s.contactRow, isAr && s.rowRtl]}>
        <TouchableOpacity
          style={[s.contactBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={openEmail}
          activeOpacity={0.8}>
          <Ionicons name="mail-outline" size={22} color={theme.accent} />
          <Text style={[s.contactBtnText, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
            {stabilizeMixedMathText(t('supportContactEmail'), isAr)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.contactBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={openWebsite}
          activeOpacity={0.8}>
          <Ionicons name="globe-outline" size={22} color={theme.accent} />
          <Text style={[s.contactBtnText, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
            {stabilizeMixedMathText(t('supportContactWebsite'), isAr)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.contactBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={openTerms}
          activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={22} color={theme.accent} />
          <Text style={[s.contactBtnText, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
            {stabilizeMixedMathText(t('supportContactTerms'), isAr)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <Text
        style={[
          s.sectionLabel,
          { color: theme.muted },
          isAr ? s.textRtlFlow : s.textLtrFlow,
          isAr && s.textRtl,
          isAr && s.sectionLabelRtl,
        ]}>
        {stabilizeMixedMathText(t('supportFaqTitle'), isAr)}
      </Text>
      {faq.map((item, i) => (
        <FAQItem key={i} q={item.q} a={item.a} isAr={isAr} />
      ))}

      {/* Feedback form */}
      <Text
        style={[
          s.sectionLabel,
          { color: theme.muted, marginTop: 28 },
          isAr ? s.textRtlFlow : s.textLtrFlow,
          isAr && s.textRtl,
          isAr && s.sectionLabelRtl,
        ]}>
        {stabilizeMixedMathText(t('supportMessageTitle'), isAr)}
      </Text>
      <View style={[s.composerTipsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {composerTips.map((tip) => (
          <View key={tip} style={[s.composerTipRow, isAr && s.rowRtl]}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.accent} />
            <Text style={[s.composerTipText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
              {stabilizeMixedMathText(tip, isAr)}
            </Text>
          </View>
        ))}
      </View>
      <TextInput
        value={subject}
        onChangeText={setSubject}
        placeholder={t('supportSubjectPlaceholder')}
        placeholderTextColor={theme.muted}
        style={[
          s.input,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          isAr ? s.textRtlFlow : s.textLtrFlow,
          isAr && s.textRtl,
        ]}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        multiline
        placeholder={t('supportMessagePlaceholder')}
        placeholderTextColor={theme.muted}
        style={[
          s.textarea,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          isAr ? s.textRtlFlow : s.textLtrFlow,
          isAr && s.textRtl,
        ]}
      />

      {/* CTA row */}
      <View style={[s.ctaRow, isAr && s.rowRtl]}>
        <TouchableOpacity style={s.emailBtn} onPress={openEmail} activeOpacity={0.85}>
          <View style={[s.emailBtnInner, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && s.rowRtl]}>
            <Ionicons name="open-outline" size={16} color={theme.accent} />
            <Text style={[s.emailBtnText, { color: theme.text }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
              {stabilizeMixedMathText(t('supportOpenMail'), isAr)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.sendBtn} onPress={sendFeedback} activeOpacity={0.9}>
          <LinearGradient colors={theme.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.sendBtnGrad, isAr && s.rowRtl]}>
            <Ionicons name={composerOpened ? 'checkmark' : 'send-outline'} size={16} color={theme.primaryInk} />
            <Text style={[s.sendBtnText, { color: theme.primaryInk }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
              {stabilizeMixedMathText(
                composerOpened ? t('supportReadyInMail') : t('supportSendToSupport'),
                isAr,
              )}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Email address shown */}
      <Text style={[s.emailNote, { color: theme.muted }, s.textLtrFlow]}>
        {SUPPORT_EMAIL}
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  rowRtl: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },

  heroWrap: { alignItems: 'center', marginBottom: 28 },
  heroCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  heroTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  heroSub: { fontSize: 13, fontFamily: 'Amiri_400Regular', marginTop: 4, textAlign: 'center' },
  trustCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  trustTitle: { fontSize: 15, fontFamily: 'Amiri_700Bold', marginBottom: 4 },
  trustSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', marginBottom: 10 },
  trustPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trustPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  trustPillText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },

  contactRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  contactBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 6 },
  contactBtnText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12, fontFamily: 'Amiri_700Bold' },
  sectionLabelRtl: { letterSpacing: 0 },

  faqItem: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQ: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 20 },
  faqA: { fontSize: 13, fontFamily: 'Amiri_400Regular', lineHeight: 22, marginTop: 10 },

  composerTipsCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  composerTipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  composerTipText: { flex: 1, fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Amiri_400Regular', marginBottom: 10 },
  textarea: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Amiri_400Regular', minHeight: 110, textAlignVertical: 'top', marginBottom: 14 },

  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  emailBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  emailBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingVertical: 14 },
  emailBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sendBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  sendBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  sendBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  emailNote: { textAlign: 'center', fontSize: 12, fontFamily: 'Amiri_400Regular' },
});
