export type SubscriptionTier = 'free' | 'bronze' | 'silver' | 'gold';
export type PaidPlanKey = Exclude<SubscriptionTier, 'free'>;
export type SubscriptionFeatureKey = 'grade12Path' | 'mathscan' | 'aiChat' | 'premiumThemes';

export const PLAN_PREVIEW_STORAGE = '@snapmath_plan_preview';
export const LEGACY_SUBSCRIPTION_STORAGE = '@snapmath_subscribed';
export const SUBSCRIPTION_TIER_STORAGE = '@snapmath_subscription_tier';

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
};

const FEATURE_REQUIREMENTS: Record<SubscriptionFeatureKey, SubscriptionTier> = {
  // Hybrid model: one Premium unlock opens every feature. Free access to
  // Unit 1 + the daily practice quota is handled separately (see isUnitFree).
  grade12Path: 'bronze',
  mathscan: 'bronze',
  aiChat: 'bronze',
  premiumThemes: 'bronze',
};

const FEATURE_COPY = {
  grade12Path: {
    icon: 'school-outline',
    shortLabelEn: 'Grade 12 Path',
    shortLabelAr: 'مسار الصف 12',
    titleEn: 'Unlock the Grade 12 path',
    titleAr: 'افتح مسار الصف الثاني عشر',
    bodyEn:
      'Upgrade to Bronze to open the Jordan Grade 12 curriculum, lessons, exams, and guided practice.',
    bodyAr:
      'قم بالترقية إلى الخطة البرونزية لفتح منهاج الصف الثاني عشر الأردني والدروس والاختبارات والتدريب الموجّه.',
    highlightsEn: [
      'Full Jordan Grade 12 curriculum map',
      'Lesson player, chapter flow, exams, and practice',
      'Premium learning path with progress tracking',
    ],
    highlightsAr: [
      'خريطة كاملة لمنهاج الصف 12 الأردني',
      'الدروس والفصول والاختبارات والتدريب',
      'مسار تعلم فاخر مع تتبع التقدم',
    ],
  },
  mathscan: {
    icon: 'scan-outline',
    shortLabelEn: 'MathScan',
    shortLabelAr: 'MathScan',
    titleEn: 'MathScan is part of Silver',
    titleAr: 'MathScan ضمن الخطة الفضية',
    bodyEn:
      'Upgrade to Silver to scan textbook questions and get step-by-step Jordan-style guidance.',
    bodyAr:
      'قم بالترقية إلى الخطة الفضية لمسح أسئلة الكتاب والحصول على إرشاد خطوة بخطوة بأسلوب الأردن.',
    highlightsEn: [
      'Scan textbook questions with step-by-step help',
      'Jordan-style guidance for harder problems',
      'Faster review when practice gets stuck',
    ],
    highlightsAr: [
      'مسح أسئلة الكتاب مع حل خطوة بخطوة',
      'إرشاد بأسلوب الأردن للمسائل الأصعب',
      'مراجعة أسرع عندما يتعثر التدريب',
    ],
  },
  aiChat: {
    icon: 'chatbubble-ellipses-outline',
    shortLabelEn: 'AI Coach',
    shortLabelAr: 'المدرب الذكي',
    titleEn: 'AI Coach is part of Gold',
    titleAr: 'المدرب الذكي ضمن الخطة الذهبية',
    bodyEn:
      'Upgrade to Gold for the full AI Coach experience with Jordan Grade 12 explanations and guided help.',
    bodyAr:
      'قم بالترقية إلى الخطة الذهبية للحصول على تجربة المدرب الذكي الكاملة مع شروحات الصف الثاني عشر الأردني والمساعدة الموجّهة.',
    highlightsEn: [
      'Unlimited AI tutor conversations',
      'Jordan Grade 12 explanations and exam coaching',
      'Path-based support for weak topics and revision',
    ],
    highlightsAr: [
      'محادثات غير محدودة مع المدرب الذكي',
      'شروحات الصف 12 الأردني وتدريب للاختبارات',
      'دعم موجه لنقاط الضعف والمراجعة',
    ],
  },
  premiumThemes: {
    icon: 'color-palette-outline',
    shortLabelEn: 'Premium Themes',
    shortLabelAr: 'الثيمات المميزة',
    titleEn: 'Premium themes need Silver',
    titleAr: 'الثيمات المميزة تحتاج الخطة الفضية',
    bodyEn:
      'Upgrade to Silver or Gold to unlock premium themes and profile styling across the app.',
    bodyAr:
      'قم بالترقية إلى الخطة الفضية أو الذهبية لفتح الثيمات المميزة وتنسيق الحساب في التطبيق.',
    highlightsEn: [
      'Premium themes across the app',
      'Upgraded profile styling and trust surfaces',
      'A clearer premium identity for students and parents',
    ],
    highlightsAr: [
      'ثيمات مميزة في جميع أنحاء التطبيق',
      'تنسيق أرقى للملف الشخصي وواجهات الثقة',
      'هوية فاخرة أوضح للطالب وولي الأمر',
    ],
  },
} as const;

export function isPaidPlanKey(value: string | null | undefined): value is PaidPlanKey {
  return value === 'bronze' || value === 'silver' || value === 'gold';
}

export function coerceSubscriptionTier(value: string | null | undefined): SubscriptionTier | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'free') return 'free';
  if (normalized === 'bronze') return 'bronze';
  if (normalized === 'silver') return 'silver';
  if (normalized === 'gold') return 'gold';
  return null;
}

export function hasTierAccess(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_RANK[currentTier] >= TIER_RANK[requiredTier];
}

export function getFeatureRequiredTier(feature: SubscriptionFeatureKey): SubscriptionTier {
  return FEATURE_REQUIREMENTS[feature];
}

export function canAccessFeature(currentTier: SubscriptionTier, feature: SubscriptionFeatureKey): boolean {
  return hasTierAccess(currentTier, FEATURE_REQUIREMENTS[feature]);
}

export const FREE_UNIT_IDS = ['u1'];

export function isUnitFree(unitId: string | null | undefined): boolean {
  return !!unitId && FREE_UNIT_IDS.includes(unitId);
}

export function canOpenUnit(currentTier: SubscriptionTier, unitId: string | null | undefined): boolean {
  return isUnitFree(unitId) || canAccessFeature(currentTier, 'grade12Path');
}

export function getHigherTier(a: SubscriptionTier, b: SubscriptionTier): SubscriptionTier {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b;
}

export function getTierLabel(tier: SubscriptionTier, isAr: boolean): string {
  switch (tier) {
    case 'gold':
      return isAr ? 'المميزة' : 'Premium';
    case 'silver':
      return isAr ? 'الفضية' : 'Silver';
    case 'bronze':
      return isAr ? 'البرونزية' : 'Bronze';
    default:
      return isAr ? 'المجانية' : 'Free';
  }
}

export function getTierRequirementLabel(tier: SubscriptionTier, isAr: boolean): string {
  if (tier === 'free') {
    return getTierLabel(tier, isAr);
  }

  return isAr ? `${getTierLabel(tier, true)} أو أعلى` : `${getTierLabel(tier, false)} or higher`;
}

export function getFeatureGateContent(feature: SubscriptionFeatureKey, isAr: boolean) {
  const details = FEATURE_COPY[feature];
  return {
    requiredTier: FEATURE_REQUIREMENTS[feature],
    icon: details.icon,
    title: isAr ? details.titleAr : details.titleEn,
    body: isAr ? details.bodyAr : details.bodyEn,
  };
}

export function getFeatureShortLabel(feature: SubscriptionFeatureKey, isAr: boolean): string {
  const details = FEATURE_COPY[feature];
  return isAr ? details.shortLabelAr : details.shortLabelEn;
}

export function getFeatureGateHighlights(feature: SubscriptionFeatureKey, isAr: boolean): string[] {
  const details = FEATURE_COPY[feature];
  return [...(isAr ? details.highlightsAr : details.highlightsEn)];
}

export function inferTierFromText(value: string | null | undefined): SubscriptionTier | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (normalized.includes('gold') || normalized.includes('ذهبي') || normalized.includes('golden')) {
    return 'gold';
  }
  if (normalized.includes('silver') || normalized.includes('فضي')) {
    return 'silver';
  }
  if (normalized.includes('bronze') || normalized.includes('برونزي')) {
    return 'bronze';
  }
  if (normalized.includes('free') || normalized.includes('مجاني')) {
    return 'free';
  }

  return null;
}
