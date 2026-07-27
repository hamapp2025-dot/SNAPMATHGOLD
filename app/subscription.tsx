import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import {
  getFeatureGateHighlights,
  getFeatureShortLabel,
  getTierLabel as getSubscriptionTierLabel,
  type SubscriptionFeatureKey,
} from '../src/subscriptions/subscriptionAccess';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { withAlpha } from '../src/theme/colorUtils';
import {
  PREMIUM_GOLD as GOLD,
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_INK,
  premiumGoldTint,
} from '../src/theme/premiumGold';

const GOLD_DIM = premiumGoldTint(0.18);
const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';

const PREMIUM_FEATURES_AR = [
  { text: 'الوصول إلى جميع دروس الصف 12', included: true },
  { text: 'مجموعات تدريب لا محدودة', included: true },
  { text: 'MathScan — إرشاد خطوة بخطوة للمسائل', included: true },
  { text: 'ثيمات مميزة وملف شخصي فاخر', included: true },
  { text: 'محادثة AI غير محدودة', included: true },
];
const PREMIUM_FEATURES_EN = [
  { text: 'Access to all Grade 12 lessons', included: true },
  { text: 'Unlimited practice sets', included: true },
  { text: 'MathScan — step-by-step problem help', included: true },
  { text: 'Premium themes & profile styles', included: true },
  { text: 'Unlimited AI Chat tutor', included: true },
];

const TERMS_URL = 'https://snapmathacademy.com/terms';
const PRIVACY_URL = 'https://snapmathacademy.com/privacy';

type Plan = {
  key: 'monthly' | 'semester' | 'annual';
  title: string;
  subtitle: string;
  features: { text: string; included: boolean }[];
  badge?: string;
  price: string;
  priceNote: string;
  trialDays?: number;
  accent: string;
  gradient: [string, string];
  tint: string;
  icon: keyof typeof Ionicons.glyphMap;
  ink: string;
};

const PLAN_KEYS = ['monthly', 'semester', 'annual'] as const;

function isPlanKey(value: string | null): value is Plan['key'] {
  return !!value && PLAN_KEYS.includes(value as Plan['key']);
}

function isFeatureKey(value: string | string[] | undefined): value is SubscriptionFeatureKey {
  return value === 'grade12Path' || value === 'mathscan' || value === 'aiChat' || value === 'premiumThemes';
}

function getPlanLabel(planKey: Plan['key'], isAr: boolean) {
  if (planKey === 'annual') return isAr ? 'السنوية' : 'Annual';
  if (planKey === 'semester') return isAr ? 'الفصلية' : 'Semester';
  return isAr ? 'الشهرية' : 'Monthly';
}

function PlanCard({
  plan,
  selected,
  onSelect,
  isAr,
  theme,
  showPreviewBadge,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
  isAr: boolean;
  theme: any;
  showPreviewBadge: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.88}
      style={[
        s.planCard,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? plan.accent : theme.border,
          shadowColor: selected ? plan.accent : 'transparent',
        },
        selected && s.planCardHL,
      ]}>
      {selected ? (
        <LinearGradient colors={[plan.tint, 'rgba(255,255,255,0.01)']} style={StyleSheet.absoluteFillObject} />
      ) : null}

      <View style={[s.planToneRow, isAr && s.rowRtl]}>
        <LinearGradient colors={plan.gradient} style={s.planIconWrap}>
          <Ionicons name={plan.icon} size={18} color={plan.ink} />
        </LinearGradient>

        <View style={[s.tierPill, { borderColor: selected ? plan.accent : theme.border, backgroundColor: selected ? plan.tint : theme.surfaceSoft }]}>
          <Text
            style={[
              s.tierPillText,
              { color: selected ? plan.accent : theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(isAr ? 'فئة معدنية' : 'Metal Tier', isAr)}
          </Text>
        </View>
      </View>

      <View style={[s.planHeader, isAr && s.rowRtl]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              s.planTitle,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(plan.title, isAr)}
          </Text>
          <Text
            style={[
              s.planSubtitle,
              { color: theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(plan.subtitle, isAr)}
          </Text>
        </View>
        <View style={[s.badgeRow, isAr && s.badgeRowRtl]}>
          {showPreviewBadge ? (
            <View style={s.trialBadge}>
              <Ionicons name="eye-outline" size={12} color="#1B1D30" />
              <Text style={[s.trialText, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(isAr ? 'معاينة' : 'Preview', isAr)}
              </Text>
            </View>
          ) : null}
          {plan.badge ? (
            <View style={[s.popularBadge, { backgroundColor: plan.accent }]}>
              <Text style={[s.popularText, { color: plan.ink }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(plan.badge, isAr)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {plan.features.map((f, i) => (
        <View key={i} style={[s.tickRow, isAr && s.rowRtl]}>
          <Ionicons name={f.included ? 'checkmark-circle' : 'close-circle'} size={18} color={f.included ? plan.accent : '#6B7394'} />
          <Text
            style={[
              s.tickText,
              { color: f.included ? theme.text : theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(f.text, isAr)}
          </Text>
        </View>
      ))}

      <View style={[s.priceRow, { borderColor: selected ? plan.accent : theme.border }, selected && { backgroundColor: plan.tint }, isAr && s.rowRtl]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              s.priceValue,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(plan.price, isAr)}
          </Text>
          <Text
            style={[
              s.priceNote,
              { color: theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(plan.priceNote, isAr)}
          </Text>
        </View>
        <View style={[s.radioCircle, { borderColor: selected ? plan.accent : 'rgba(255,255,255,0.2)' }, selected && { backgroundColor: plan.accent }]}>
          {selected ? <Ionicons name="checkmark" size={16} color={plan.ink} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ recommendedTier?: string; focusFeature?: string }>();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const {
    billingMode,
    currentTier,
    currentPeriodEndsAt,
    currentOffering,
    hasRevenueCatConfig,
    isLoading: subscriptionLoading,
    packagesByDuration,
    purchaseDuration,
    refresh,
    restorePurchases,
  } = useSubscription();
  const [selectedKey, setSelectedKey] = useState<Plan['key']>('annual');
  const [loading, setLoading] = useState(false);
  const recommendedTierParam = typeof params.recommendedTier === 'string' ? params.recommendedTier : null;
  const focusFeature = isFeatureKey(params.focusFeature) ? params.focusFeature : null;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile');
  };

  useEffect(() => {
    if (isPlanKey(recommendedTierParam)) {
      setSelectedKey(recommendedTierParam);
      return;
    }

    if (isPlanKey(currentTier)) {
      setSelectedKey(currentTier);
    }
  }, [currentTier, recommendedTierParam]);

  const premiumFeatures = isAr ? PREMIUM_FEATURES_AR : PREMIUM_FEATURES_EN;
  const plans: Plan[] = [
    {
      key: 'monthly',
      title: isAr ? 'شهري' : 'Monthly',
      subtitle: isAr ? 'وصول كامل بفوترة شهرية' : 'Full access, billed monthly',
      trialDays: 7,
      features: premiumFeatures,
      badge: isAr ? 'مرن' : 'FLEXIBLE',
      price: '—',
      priceNote: isAr ? 'يتجدد شهرياً' : 'Renews monthly',
      accent: '#C0C0D8',
      gradient: ['#E0E0F0', '#A0A0C0'],
      tint: 'rgba(192,192,216,0.16)',
      icon: 'calendar-outline',
      ink: '#1B1D30',
    },
    {
      key: 'semester',
      title: isAr ? 'فصلي' : 'Semester',
      subtitle: isAr ? 'يغطي فصلاً دراسياً كاملاً' : 'Covers a full semester',
      trialDays: 7,
      features: premiumFeatures,
      badge: isAr ? 'الأنسب للتوجيهي' : 'BEST FOR TAWJIHI',
      price: '—',
      priceNote: isAr ? 'يتجدد كل 6 أشهر' : 'Renews every 6 months',
      accent: GOLD,
      gradient: PREMIUM_GOLD_GRADIENT,
      tint: premiumGoldTint(0.16),
      icon: 'school-outline',
      ink: PREMIUM_GOLD_INK,
    },
    {
      key: 'annual',
      title: isAr ? 'سنوي' : 'Annual',
      subtitle: isAr ? 'أفضل قيمة على مدار السنة' : 'Best value across the year',
      trialDays: 7,
      features: premiumFeatures,
      badge: isAr ? 'أفضل قيمة' : 'BEST VALUE',
      price: '—',
      priceNote: isAr ? 'يتجدد سنوياً' : 'Renews yearly',
      accent: GOLD,
      gradient: PREMIUM_GOLD_GRADIENT,
      tint: premiumGoldTint(0.16),
      icon: 'trophy-outline',
      ink: PREMIUM_GOLD_INK,
    },
  ];

  const plansWithPricing = plans.map((plan) => {
    const pkg = packagesByDuration[plan.key];
    if (!pkg) return plan;

    return {
      ...plan,
      price: pkg.product.priceString || plan.price,
    };
  });

  const selectedPlan = plansWithPricing.find((p) => p.key === selectedKey) ?? plansWithPricing[0];
  const selectedPackage = packagesByDuration[selectedKey];
  const currentPlanLabel = getSubscriptionTierLabel(currentTier, isAr);
  const isPreviewAccessIncluded = billingMode === 'preview' && currentTier !== 'free';
  const focusFeatureLabel = focusFeature ? getFeatureShortLabel(focusFeature, isAr) : null;
  const focusFeatureHighlights = focusFeature ? getFeatureGateHighlights(focusFeature, isAr) : [];
  const renewalDate = currentPeriodEndsAt ? new Date(currentPeriodEndsAt) : null;
  const renewalLabel = renewalDate && !Number.isNaN(renewalDate.valueOf())
    ? renewalDate.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        month: isAr ? 'long' : 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const currentPlanSummary = currentTier === 'free'
    ? (isAr
        ? 'أنت الآن على الخطة المجانية. الوحدة 1 مجانية — اشترك في الخطة المميزة لفتح جميع الوحدات وMathScan والمدرب الذكي.'
        : 'You are on the Free plan. Unit 1 is free — subscribe to Premium to unlock all units, MathScan, and the AI Coach.')
    : isPreviewAccessIncluded
      ? (isAr
          ? `هذه النسخة التجريبية تمنحك حالياً وصول ${currentPlanLabel} حتى يكتمل ربط الشراء عبر App Store.`
          : `This preview build currently includes ${currentPlanLabel} access while App Store billing is being finalized.`)
    : (isAr
        ? `أنت الآن على الخطة ${currentPlanLabel}${renewalLabel ? ` · يتجدد ${renewalLabel}` : ''}.`
        : `You are currently on ${currentPlanLabel}${renewalLabel ? ` · renews ${renewalLabel}` : ''}.`);
  const isPremiumActive = currentTier !== 'free';
  const selectedPlanSummary = isPremiumActive
    ? (isAr ? 'اشتراكك المميز نشط.' : 'Your Premium subscription is active.')
    : (isAr ? 'اختر مدة الاشتراك التي تناسبك لفتح الوصول الكامل.' : 'Choose the plan length that suits you to unlock full access.');
  const isCurrentSelectionActive = isPremiumActive;
  const mappedPlanKeys = PLAN_KEYS.filter((key): key is Plan['key'] => !!packagesByDuration[key]);
  const mappedPlanLabel = mappedPlanKeys.length
    ? mappedPlanKeys.map((key) => getPlanLabel(key, isAr)).join(isAr ? '، ' : ', ')
    : (isAr ? 'لا توجد خطط مربوطة بعد' : 'No plans mapped yet');
  const setupRows = billingMode === 'revenuecat'
    ? [
        {
          key: 'revenuecat',
          ready: hasRevenueCatConfig,
          title: isAr ? 'مفتاح RevenueCat' : 'RevenueCat API key',
          note: hasRevenueCatConfig
            ? (isAr ? 'تمت إضافة المفتاح داخل إعدادات التطبيق.' : 'The API key is connected in app config.')
            : (isAr ? 'ما زال مفتاح RevenueCat مفقوداً.' : 'The RevenueCat API key is still missing.'),
        },
        {
          key: 'offering',
          ready: !!currentOffering,
          title: isAr ? 'العرض الحالي' : 'Current offering',
          note: currentOffering
            ? `${isAr ? 'تم تحميل العرض' : 'Loaded offering'}: ${currentOffering.identifier}`
            : (isAr ? 'لم يتم تحميل Offering من RevenueCat بعد.' : 'No offering has loaded from RevenueCat yet.'),
        },
        {
          key: 'plans',
          ready: mappedPlanKeys.length > 0,
          title: isAr ? 'الخطط المربوطة' : 'Mapped plans',
          note: mappedPlanKeys.length > 0
            ? `${mappedPlanKeys.length}/3 ${isAr ? 'جاهزة الآن' : 'ready now'} · ${mappedPlanLabel}`
            : mappedPlanLabel,
        },
      ]
    : [
        {
          key: 'preview',
          ready: true,
          title: isAr ? 'وصول المعاينة الحالي' : 'Current preview access',
          note: isPreviewAccessIncluded
            ? (isAr
                ? `هذه النسخة تمنحك حالياً وصول ${currentPlanLabel} للحفاظ على المسار الكامل أثناء الاختبار.`
                : `This build currently includes ${currentPlanLabel} access so the full demo path stays open during testing.`)
            : (isAr
                ? 'هذه الشاشة تعمل حالياً كمعاينة فقط حتى يكتمل ربط الفوترة.'
                : 'This screen is currently informational only until billing is fully connected.'),
        },
        {
          key: 'billing',
          ready: false,
          title: isAr ? 'شراء App Store' : 'App Store checkout',
          note: isAr
            ? 'ما زالت مفاتيح RevenueCat ومنتجات App Store غير مضافة بعد، لذلك الشراء الحقيقي غير متاح حالياً.'
            : 'The RevenueCat keys and App Store products are still missing, so live checkout is not available yet.',
        },
        {
          key: 'restore',
          ready: false,
          title: isAr ? 'استعادة المشتريات' : 'Restore purchases',
          note: isAr
            ? 'سيعمل زر الاستعادة تلقائياً فور تفعيل الفوترة الحقيقية.'
            : 'The restore flow will turn on automatically as soon as live billing is configured.',
        },
      ];
  const primaryActionLabel = loading || subscriptionLoading
    ? (isAr ? 'جارٍ...' : 'Loading…')
    : isPreviewAccessIncluded
      ? (isAr ? 'الوصول التجريبي مشمول' : 'Preview access included')
    : isCurrentSelectionActive
      ? (isAr ? 'الخطة الحالية مفعلة' : 'Current plan active')
    : billingMode === 'revenuecat'
      ? selectedPackage
        ? (isAr ? `اشترك في ${selectedPlan.title}` : `Subscribe to ${selectedPlan.title}`)
        : (isAr ? 'الخطة غير جاهزة بعد' : 'Plan not ready yet')
      : (isAr ? 'احفظ الخطة المفضلة' : 'Save Plan Preference');

  const handlePrimaryAction = async () => {
    if (isPreviewAccessIncluded) {
      Alert.alert(
        isAr ? 'الوصول التجريبي مشمول' : 'Preview access included',
        isAr
          ? `هذه النسخة التجريبية تمنحك حالياً وصول ${currentPlanLabel}. سيتحوّل هذا الزر إلى شراء حقيقي فور ربط App Store وRevenueCat.`
          : `This preview build already includes ${currentPlanLabel} access. This button will switch to real App Store checkout once RevenueCat is connected.`,
      );
      return;
    }

    if (isCurrentSelectionActive) {
      Alert.alert(
        isAr ? 'خطة مفعلة بالفعل' : 'Plan already active',
        isAr ? `اشتراكك الحالي هو ${selectedPlan.title}. يمكنك اختيار خطة أخرى للترقية أو التغيير.` : `Your current subscription is ${selectedPlan.title}. Pick another plan if you want to change or upgrade.`,
      );
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseDuration(selectedKey);

      if (result === 'preview') {
        Alert.alert(
          isAr ? 'تم حفظ اختيارك' : 'Plan preference saved',
          isAr
            ? 'تم حفظ الخطة المفضلة على هذا الجهاز. أضف مفاتيح ومنتجات RevenueCat لفتح الشراء الحقيقي.'
            : 'Your preferred plan was saved on this device. Add the RevenueCat keys and products to enable real purchases.',
        );
        return;
      }

      if (result === 'unavailable') {
        Alert.alert(
          isAr ? 'الخطة غير جاهزة بعد' : 'Plan not ready yet',
          isAr
            ? 'هذه الخطة غير مرتبطة بعد بمنتج App Store داخل RevenueCat.'
            : 'This plan is not mapped to an App Store product in RevenueCat yet.',
        );
        return;
      }

      if (result === 'cancelled') {
        return;
      }

      Alert.alert(
        isAr ? 'تم تفعيل الاشتراك' : 'Subscription activated',
        isAr
          ? `تم تحديث حسابك إلى خطة ${selectedPlan.title}.`
          : `Your account was updated to the ${selectedPlan.title} plan.`,
      );
    } catch (_) {
      Alert.alert(
        isAr ? 'تعذر إكمال العملية' : 'Could not complete purchase',
        isAr ? 'يرجى المحاولة مرة أخرى.' : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!hasRevenueCatConfig) {
      openSupport();
      return;
    }

    setLoading(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? (isAr ? 'تمت الاستعادة' : 'Purchases restored') : (isAr ? 'لا يوجد اشتراك' : 'No active purchases found'),
        restored
          ? (isAr ? 'تمت مزامنة اشتراكك الحالي مع هذا الجهاز.' : 'Your current subscription was synced to this device.')
          : (isAr ? 'لم نعثر على مشتريات نشطة لهذا الحساب.' : 'We could not find any active purchases for this account.'),
      );
    } catch {
      Alert.alert(
        isAr ? 'تعذر الاستعادة' : 'Could not restore purchases',
        isAr ? 'يرجى المحاولة مرة أخرى.' : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const openSupport = () => {
    router.push('/support');
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, isAr && s.rowRtl]}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
          </TouchableOpacity>
          <Text
            style={[
              s.headerTitle,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(isAr ? 'الاشتراك' : 'Subscription', isAr)}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero */}
        <View style={s.heroWrap}>
          <LinearGradient colors={PREMIUM_GOLD_GRADIENT} style={s.heroIconCircle}>
            <Ionicons name="trophy" size={32} color={PREMIUM_GOLD_INK} />
          </LinearGradient>
          <Text
            style={[
              s.title,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(
              isAr ? 'اختر خطتك' : 'Choose Your Plan',
              isAr,
            )}
          </Text>
          <Text
            style={[
              s.titleSub,
              { color: theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
            ]}>
            {stabilizeMixedMathText(
              billingMode === 'revenuecat'
                ? (isAr
                    ? 'إذا كانت منتجات App Store مرتبطة في RevenueCat فسيتم الشراء الحقيقي من هذه الشاشة، وإلا ستظهر لك أي خطة ما زالت غير مربوطة.'
                    : 'If your App Store products are connected in RevenueCat, purchases happen from this screen. If a plan is not mapped yet, the app will tell you.')
                : isPreviewAccessIncluded
                  ? (isAr
                      ? `أنت تختبر الآن وصول ${currentPlanLabel} داخل النسخة التجريبية. ستعود هذه الشاشة للشراء الحقيقي بعد إضافة App Store وRevenueCat.`
                      : `You are currently testing ${currentPlanLabel} access in this preview build. This screen will switch to real checkout once App Store and RevenueCat are connected.`)
                : (isAr
                    ? 'استعرض خطط Bronze و Silver و Gold واحفظ الخطة التي تفضّلها إلى أن تكتمل ربط الفوترة.'
                    : 'Preview Bronze, Silver, and Gold and save the plan you want until billing setup is fully connected.'),
              isAr,
            )}
          </Text>
        </View>

        <View style={[s.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.statusTopRow, isAr && s.rowRtl]}>
            <View style={[s.statusPill, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.24) }]}>
              <Ionicons name={currentTier === 'free' ? 'sparkles-outline' : 'shield-checkmark-outline'} size={14} color={theme.accent} />
              <Text style={[s.statusPillText, { color: theme.accent }]}>
                {isAr ? `خطتك الآن: ${currentPlanLabel}` : `Current plan: ${currentPlanLabel}`}
              </Text>
            </View>
            {focusFeatureLabel ? (
              <View style={[s.statusPill, { backgroundColor: withAlpha(selectedPlan.accent, 0.12), borderColor: withAlpha(selectedPlan.accent, 0.26) }]}>
                <Ionicons name="flash-outline" size={14} color={selectedPlan.accent} />
                <Text style={[s.statusPillText, { color: selectedPlan.accent }]}>
                  {isAr ? `موصى به لـ ${focusFeatureLabel}` : `Best for ${focusFeatureLabel}`}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              s.statusSummary,
              { color: theme.text },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(currentPlanSummary, isAr)}
          </Text>
          <Text
            style={[
              s.statusSub,
              { color: theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(selectedPlanSummary, isAr)}
          </Text>
        </View>

        {focusFeatureLabel ? (
          <View style={[s.focusCard, { backgroundColor: theme.surface, borderColor: withAlpha(selectedPlan.accent, 0.24) }]}>
            <View style={[s.focusTopRow, isAr && s.rowRtl]}>
              <View style={[s.focusIconWrap, { backgroundColor: withAlpha(selectedPlan.accent, 0.12), borderColor: withAlpha(selectedPlan.accent, 0.22) }]}>
                <Ionicons name="star-outline" size={15} color={selectedPlan.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    s.focusTitle,
                    { color: theme.text },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {stabilizeMixedMathText(
                    isAr ? `${focusFeatureLabel} تصبح متاحة مع ${selectedPlan.title}` : `${focusFeatureLabel} unlocks with ${selectedPlan.title}`,
                    isAr,
                  )}
                </Text>
                <Text
                  style={[
                    s.focusSub,
                    { color: theme.muted },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {stabilizeMixedMathText(
                    isAr ? 'هذا هو الاختيار الأسرع للوصول إلى الميزة التي جئت من أجلها.' : 'This is the fastest path to the feature you came for.',
                    isAr,
                  )}
                </Text>
              </View>
            </View>
            <View style={[s.focusTagRow, isAr && s.rowRtl]}>
              {focusFeatureHighlights.map((item) => (
                <View key={item} style={[s.focusTag, { backgroundColor: withAlpha(selectedPlan.accent, 0.1), borderColor: withAlpha(selectedPlan.accent, 0.16) }]}>
                  <Text style={[s.focusTagText, { color: theme.text }]}>{stabilizeMixedMathText(item, isAr)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[s.setupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.setupHeader, isAr && s.rowRtl]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.setupTitle,
                  { color: theme.text },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {stabilizeMixedMathText(
                  billingMode === 'revenuecat'
                    ? (isAr ? 'حالة الفوترة الآن' : 'Billing readiness')
                    : (isAr ? 'ما الذي ينقص للتشغيل؟' : 'What still needs to be connected?'),
                  isAr,
                )}
              </Text>
              <Text
                style={[
                  s.setupSub,
                  { color: theme.muted },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {stabilizeMixedMathText(
                  billingMode === 'revenuecat'
                    ? (isAr ? 'تحقق من هذه النقاط الثلاث قبل إطلاق الشراء الحقيقي.' : 'Check these three items before live purchases go public.')
                    : (isAr ? 'بمجرد إضافة القيم الحقيقية سيتحوّل هذا القسم إلى شراء مباشر من App Store.' : 'As soon as the real values are added, this screen will switch to live App Store purchases.'),
                  isAr,
                )}
              </Text>
            </View>

            {billingMode === 'revenuecat' ? (
              <TouchableOpacity
                onPress={() => void refresh()}
                activeOpacity={0.8}
                style={[s.refreshPill, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
                disabled={loading || subscriptionLoading}>
                <Ionicons name="refresh" size={15} color={theme.accent} />
              </TouchableOpacity>
            ) : null}
          </View>

          {setupRows.map((row, index) => (
            <View
              key={row.key}
              style={[
                s.setupRow,
                isAr && s.rowRtl,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
              ]}>
              <View
                style={[
                  s.setupIconWrap,
                  {
                    backgroundColor: row.ready ? withAlpha(theme.accent, 0.12) : withAlpha(theme.text, 0.05),
                    borderColor: row.ready ? withAlpha(theme.accent, 0.24) : theme.border,
                  },
                ]}>
                <Ionicons
                  name={row.ready ? 'checkmark-circle' : 'alert-circle-outline'}
                  size={16}
                  color={row.ready ? theme.accent : theme.muted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    s.setupRowTitle,
                    { color: theme.text },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {stabilizeMixedMathText(row.title, isAr)}
                </Text>
                <Text
                  style={[
                    s.setupRowNote,
                    { color: theme.muted },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {stabilizeMixedMathText(row.note, isAr)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        {plansWithPricing.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={selectedKey === plan.key}
            onSelect={() => setSelectedKey(plan.key)}
            isAr={isAr}
            theme={theme}
            showPreviewBadge={billingMode !== 'revenuecat'}
          />
        ))}

        <Text
          style={[
            s.guarantee,
            { color: theme.muted },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(
            billingMode === 'revenuecat'
              ? (isAr
                  ? `تتم إدارة الاشتراكات عبر App Store وRevenueCat. الخطط المربوطة حالياً: ${mappedPlanLabel}.`
                  : `Subscriptions are managed through the App Store and RevenueCat. Plans currently mapped: ${mappedPlanLabel}.`)
              : isPreviewAccessIncluded
                ? (isAr
                    ? `هذه النسخة التجريبية تشمل وصول ${currentPlanLabel} الآن، وسيحل الشراء الحقيقي عبر App Store محلّه بعد إكمال ربط RevenueCat.`
                    : `This preview build currently includes ${currentPlanLabel} access, and real App Store billing will replace it after RevenueCat is connected.`)
              : (isAr
                  ? 'هذه الشاشة ما زالت في وضع المعاينة حتى تتم إضافة مفاتيح RevenueCat ومنتجات App Store.'
                  : 'This screen is still in preview mode until the RevenueCat keys and App Store products are added.'),
            isAr,
          )}
        </Text>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottom, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={handlePrimaryAction} disabled={loading || subscriptionLoading} activeOpacity={0.9}>
          <LinearGradient colors={selectedPlan.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.cta, { shadowColor: selectedPlan.accent }]}>
            <Ionicons name={billingMode === 'revenuecat' ? 'card-outline' : 'bookmark-outline'} size={18} color={selectedPlan.ink} />
            <Text
              style={[
                s.ctaText,
                { color: selectedPlan.ink },
                isAr ? s.textRtlFlow : s.textLtrFlow,
              ]}>
              {stabilizeMixedMathText(primaryActionLabel, isAr)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={[s.linksRow, isAr && s.rowRtl]}>
          {hasRevenueCatConfig ? (
            <TouchableOpacity onPress={handleRestore}>
              <Text style={[s.linkText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(isAr ? 'استعادة المشتريات' : 'Restore Purchases', isAr)}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={openSupport}>
              <Text style={[s.linkText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(isAr ? 'تواصل مع الدعم' : 'Contact Support', isAr)}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={[s.linkDot, { color: theme.muted }]}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={[s.linkText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
              {stabilizeMixedMathText(isAr ? 'الشروط' : 'Terms', isAr)}
            </Text>
          </TouchableOpacity>
          <Text style={[s.linkDot, { color: theme.muted }]}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={[s.linkText, { color: theme.muted }, isAr ? s.textRtlFlow : s.textLtrFlow]}>
              {stabilizeMixedMathText(isAr ? 'الخصوصية' : 'Privacy', isAr)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 160 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  rowRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  heroWrap: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  heroIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: GOLD, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', fontFamily: 'Amiri_700Bold' },
  titleSub: { fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  statusCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  statusTopRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  statusPillText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  statusSummary: { fontSize: 15, lineHeight: 22, fontFamily: 'Amiri_700Bold', marginBottom: 6 },
  statusSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  focusCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 18 },
  focusTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  focusIconWrap: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  focusTitle: { fontSize: 15, fontFamily: 'Amiri_700Bold' },
  focusSub: { fontSize: 12, lineHeight: 18, marginTop: 3, fontFamily: 'Amiri_400Regular' },
  focusTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  focusTag: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  focusTagText: { fontSize: 12, lineHeight: 18, fontFamily: 'Amiri_400Regular' },
  setupCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 18 },
  setupHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  setupTitle: { fontSize: 16, fontFamily: 'Amiri_700Bold' },
  setupSub: { fontSize: 12, lineHeight: 18, marginTop: 4, fontFamily: 'Amiri_400Regular' },
  refreshPill: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  setupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 12, marginTop: 12 },
  setupIconWrap: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  setupRowTitle: { fontSize: 14, fontFamily: 'Amiri_700Bold' },
  setupRowNote: { fontSize: 12, lineHeight: 18, marginTop: 2, fontFamily: 'Amiri_400Regular' },

  planCard: { borderRadius: 22, borderWidth: 1.5, padding: 18, marginBottom: 14, overflow: 'hidden' },
  planCardHL: { shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  planToneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  tierPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  tierPillText: { fontSize: 11, fontFamily: 'Amiri_700Bold' },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  planTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  planSubtitle: { fontSize: 13, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  badgeRow: { flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  badgeRowRtl: { alignItems: 'flex-start' },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2ED573', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  trialText: { color: '#1B1D30', fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  popularBadge: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  popularText: { color: '#1B1D30', fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  tickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tickText: { fontSize: 14, flex: 1, fontFamily: 'Amiri_400Regular' },
  priceRow: { marginTop: 14, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  priceRowActive: { borderColor: GOLD, backgroundColor: premiumGoldTint(0.08) },
  priceValue: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  priceNote: { fontSize: 12, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  radioCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  radioCircleHL: { backgroundColor: GOLD, borderColor: GOLD },
  guarantee: { textAlign: 'center', fontSize: 13, marginTop: 6, marginBottom: 8, fontFamily: 'Amiri_400Regular' },

  bottom: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  cta: { borderRadius: 28, height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: GOLD, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  ctaText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 14 },
  linkText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  linkDot: { fontSize: 12 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
