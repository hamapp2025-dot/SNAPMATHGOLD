import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ALL_UNITS, SEMESTER_1_UNITS, SEMESTER_2_UNITS, findLessonById, getLocalizedFormulaLabel } from '../src/data/grade12';
import { getExamBlueprint } from '../src/data/exams';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { withAlpha } from '../src/theme/colorUtils';
import { stabilizeMixedMathText } from '../src/utils/bidi';

const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';
const ARABIC_TEXT = /[\u0600-\u06FF]/;

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

// Find a lesson by exact English or Arabic title match
function findLessonByTitle(titleEn: string, titleAr: string) {
  const normalizedTitleEn = normalizeTitle(titleEn);
  const normalizedTitleAr = normalizeTitle(titleAr);

  for (const unit of ALL_UNITS) {
    for (const lesson of unit.lessons) {
      if (
        (normalizedTitleEn && normalizeTitle(lesson.titleEn) === normalizedTitleEn) ||
        (normalizedTitleAr && normalizeTitle(lesson.titleAr) === normalizedTitleAr)
      ) {
        return { unit, lesson };
      }
    }
  }
  return null;
}

// Generic takeaways per unit topic when no specific lesson found
const GENERIC_TIPS: { en: string; ar: string }[][] = [
  [
    { en: 'Remainder Theorem: f(a) = remainder of f(x) ÷ (x − a).', ar: 'نظرية الباقي: f(a) = باقي قسمة f(x) على (x − a).' },
    { en: 'Factor Theorem: (x − a) is a factor if and only if f(a) = 0.', ar: 'نظرية العامل: (x − a) عامل إذا وفقط إذا كانت f(a) = 0.' },
    { en: 'Always verify your factorisation by expanding back.', ar: 'تحقق دائماً من تحليلك بإعادة الضرب.' },
  ],
  [
    { en: 'sin²θ + cos²θ = 1 is the foundation of all trig identities.', ar: 'sin²θ + cos²θ = 1 هي أساس جميع المتطابقات المثلثية.' },
    { en: 'Double angle: cos(2θ) = 1 − 2sin²θ = 2cos²θ − 1.', ar: 'ضعف الزاوية: cos(2θ) = 1 − 2sin²θ = 2cos²θ − 1.' },
    { en: 'Solve trig equations by finding the general solution first.', ar: 'حل المعادلات المثلثية بإيجاد الحل العام أولاً.' },
  ],
  [
    { en: "Chain rule: d/dx[f(g(x))] = f'(g(x)) · g'(x).", ar: "قاعدة السلسلة: d/dx[f(g(x))] = f'(g(x)) · g'(x)." },
    { en: "Find stationary points by setting f'(x) = 0.", ar: "أوجد النقاط الساكنة بوضع f'(x) = 0." },
    { en: "Use the second derivative test to classify turning points.", ar: "استخدم اختبار المشتقة الثانية لتصنيف نقاط الانعطاف." },
  ],
  [
    { en: 'Complex numbers: z = a + bi, where i² = −1.', ar: 'الأعداد المركبة: z = a + bi حيث i² = −1.' },
    { en: 'Modulus: |z| = √(a² + b²). Argument: θ = arctan(b/a).', ar: 'المعامل: |z| = √(a² + b²). الزاوية: θ = arctan(b/a).' },
    { en: 'Use the conjugate to simplify division in complex numbers.', ar: 'استخدم المرافق لتبسيط القسمة في الأعداد المركبة.' },
  ],
  [
    { en: 'Standard integral: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1).', ar: 'تكامل أساسي: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1).' },
    { en: 'Substitution: identify u = g(x) so that du = g\'(x) dx.', ar: 'تعويض: عرّف u = g(x) بحيث du = g\'(x) dx.' },
    { en: 'Area between curves: ∫(upper − lower) dx between the bounds.', ar: 'المساحة بين المنحنيين: ∫(الأعلى − الأسفل) dx بين الحدين.' },
  ],
  [
    { en: 'Dot product: a·b = |a||b|cosθ = a₁b₁ + a₂b₂ + a₃b₃.', ar: 'الجداء النقطي: a·b = |a||b|cosθ = a₁b₁ + a₂b₂ + a₃b₃.' },
    { en: 'Vector equation of a line: r = a + λb.', ar: 'معادلة المستقيم بالمتجهات: r = a + λb.' },
    { en: 'Two lines intersect if their direction vectors are not parallel.', ar: 'خطان يتقاطعان إذا لم تكن متجهاتهما الاتجاهية متوازية.' },
  ],
  [
    { en: 'Binomial: X ~ B(n,p), P(X=r) = C(n,r)·pʳ·(1−p)ⁿ⁻ʳ.', ar: 'ذو الحدين: X ~ B(n,p)، P(X=r) = C(n,r)·pʳ·(1−p)ⁿ⁻ʳ.' },
    { en: 'Normal: Z = (X − μ)/σ to standardise for the z-table.', ar: 'الطبيعي: Z = (X − μ)/σ للتحويل إلى جدول التوزيع.' },
    { en: 'Always state your distribution and parameters clearly in exams.', ar: 'دائماً اذكر التوزيع ومعاملاته بوضوح في الامتحانات.' },
  ],
];

export default function LessonSummaryScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT() as any;
  const params = useLocalSearchParams<{
    lessonId?: string;
    lessonTitle?: string;
    lessonTitleAr?: string;
    xpEarned?: string;
    unitId?: string;
  }>();

  const fallbackTitleEn = 'Lesson Summary';
  const fallbackTitleAr = 'ملخص الدرس';
  const titleEn = params.lessonTitle ?? fallbackTitleEn;
  const titleAr = params.lessonTitleAr
    ?? (params.lessonTitle && ARABIC_TEXT.test(params.lessonTitle) ? params.lessonTitle : fallbackTitleAr);
  const displayTitle = isAr ? titleAr : titleEn;
  const parsedXp = parseInt(params.xpEarned ?? '50', 10);
  const xp = Number.isFinite(parsedXp) ? parsedXp : 50;

  // Try to find the lesson in the grade12 data
  const found = useMemo(() => {
    if (params.lessonId) {
      const exact = findLessonById(params.lessonId);
      if (exact) return exact;
    }
    return findLessonByTitle(titleEn, titleAr);
  }, [params.lessonId, titleEn, titleAr]);

  // Determine which unit index this belongs to for generic tips fallback
  const unitIndex = useMemo(() => {
    if (found) {
      return ALL_UNITS.findIndex((u) => u.id === found.unit.id);
    }
    if (params.unitId) {
      return ALL_UNITS.findIndex((u) => u.id === params.unitId);
    }
    return 0;
  }, [found, params.unitId]);

  // Build bullet points: use real key formulas if found, else generic tips
  const bullets: { en: string; ar: string }[] = useMemo(() => {
    if (found && found.lesson.keyFormulas.length > 0) {
      return found.lesson.keyFormulas.slice(0, 4).map((f, index) => ({
        en: `${f.label}: ${f.formula}`,
        ar: `${getLocalizedFormulaLabel(f.label, true, index)}: ${f.formula}`,
      }));
    }
    const tips = GENERIC_TIPS[Math.max(0, Math.min(unitIndex, GENERIC_TIPS.length - 1))];
    return tips;
  }, [found, unitIndex]);

  // Build "what's next" lesson title
  const nextLesson = useMemo(() => {
    if (!found) return null;
    const { unit, lesson } = found;
    const lessonIdx = unit.lessons.findIndex((l) => l.id === lesson.id);
    if (lessonIdx >= 0 && lessonIdx + 1 < unit.lessons.length) {
      return unit.lessons[lessonIdx + 1];
    }
    // try next unit's first lesson
    const unitIdx = ALL_UNITS.findIndex((u) => u.id === unit.id);
    if (unitIdx >= 0 && unitIdx + 1 < ALL_UNITS.length) {
      return ALL_UNITS[unitIdx + 1].lessons[0] ?? null;
    }
    return null;
  }, [found]);

  const recommendedUnitId = found?.unit.id ?? params.unitId ?? null;
  const recommendedExam = useMemo(() => {
    if (recommendedUnitId && SEMESTER_1_UNITS.some((unit) => unit.id === recommendedUnitId)) {
      return getExamBlueprint('wb1-drill');
    }
    if (recommendedUnitId && SEMESTER_2_UNITS.some((unit) => unit.id === recommendedUnitId)) {
      return getExamBlueprint('wb2-drill');
    }
    return getExamBlueprint('quick-15');
  }, [recommendedUnitId]);

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Badge */}
      <View style={[s.badge, { backgroundColor: theme.accent }]}>
        <Text style={[s.badgeText, { color: theme.primaryInk }]}>{isAr ? 'ملخص الدرس' : 'LESSON SUMMARY'}</Text>
      </View>
      <Text style={[s.title, isAr && s.textRtl, { color: theme.text }]}>
        {stabilizeMixedMathText(displayTitle, isAr)}
      </Text>

      {/* XP earned banner */}
      <LinearGradient colors={[withAlpha(theme.accent, 0.18), withAlpha(theme.accent, 0.06)]} style={[s.xpBanner, { borderColor: withAlpha(theme.accent, 0.25) }]}>
        <Ionicons name="star" size={22} color={theme.accent} />
        <Text style={[s.xpBannerText, { color: theme.accent }]}>
          {isAr ? `حصلت على ${xp} نقطة XP` : `+${xp} XP earned`}
        </Text>
        <Ionicons name="checkmark-circle" size={22} color="#2ED573" />
      </LinearGradient>

      {/* Key takeaways — real data */}
      <Text style={[s.section, isAr && s.textRtl, { color: theme.text }]}>
        {isAr ? 'النقاط الرئيسية' : 'Key Takeaways'}
      </Text>
      <View style={[s.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {bullets.map((b, i) => (
          <View key={i} style={[s.bulletRow, isAr && { flexDirection: 'row-reverse' }, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={s.bulletDot}>
              <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
            </View>
            <Text style={[s.bullet, { color: theme.text }, isAr && s.textRtl]} numberOfLines={3}>
              {stabilizeMixedMathText(isAr ? b.ar : b.en, isAr)}
            </Text>
          </View>
        ))}
      </View>

      {/* Practice questions count if available */}
      {found && found.lesson.practiceQ.length > 0 && (
        <View style={[s.practiceHint, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.27) }]}>
          <Ionicons name="help-circle-outline" size={18} color={theme.accent} />
          <Text style={[s.practiceHintText, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
            {isAr
              ? `${found.lesson.practiceQ.length} سؤال تدريبي متاح لهذا الدرس`
              : `${found.lesson.practiceQ.length} practice questions available for this lesson`}
          </Text>
        </View>
      )}

      <Text style={[s.section, isAr && s.textRtl, { color: theme.text }]}>
        {isAr ? 'المسار المقترح الآن' : 'Recommended Next Step'}
      </Text>
      <View style={[s.pathCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.24) }]}>
        <LinearGradient
          colors={[withAlpha(theme.accent, 0.16), withAlpha(theme.accent, 0.02)]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[s.pathTopRow, isAr && s.pathTopRowRtl]}>
          <View style={[s.pathBadge, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.24) }]}>
            <Ionicons name="flash-outline" size={14} color={theme.accent} />
            <Text style={[s.pathBadgeText, { color: theme.accent }]}>
              {isAr ? 'أفضل مسار للعرض' : 'Best Demo Route'}
            </Text>
          </View>
          <Text style={[s.pathMeta, { color: theme.muted }]}>
            {isAr ? 'درس -> تدريب -> اختبار' : 'Lesson -> Practice -> Drill'}
          </Text>
        </View>
        <Text style={[s.pathTitle, { color: theme.text }, isAr && s.textRtl]}>
          {isAr ? 'ثبّت الفكرة بجلسة تدريب قصيرة ثم انتقل إلى اختبار مراجعة سريع.' : 'Lock the idea in with a short practice session, then take a quick review drill.'}
        </Text>
        <View style={s.pathActions}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/practice-session',
                params: recommendedUnitId ? { unitId: recommendedUnitId } : {},
              })
            }>
            <LinearGradient colors={theme.primary} style={s.pathPrimaryAction}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.primaryInk} />
              <Text style={[s.pathPrimaryActionText, { color: theme.primaryInk }]}>
                {isAr ? 'ابدأ جلسة التدريب' : 'Start Focused Practice'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/exam',
                params: { examId: recommendedExam.id },
              })
            }
            style={[s.pathSecondaryAction, { borderColor: theme.border, backgroundColor: withAlpha(theme.bg, 0.34) }]}>
            <View style={[s.pathSecondaryActionInner, isAr && s.pathSecondaryActionInnerRtl]}>
              <Ionicons name="school-outline" size={16} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[s.pathSecondaryTitle, { color: theme.text }, isAr && s.textRtl]}>
                  {isAr ? 'بعدها: اختبار المراجعة' : 'Then: Review Drill'}
                </Text>
                <Text style={[s.pathSecondarySub, { color: theme.muted }, isAr && s.textRtl]} numberOfLines={1}>
                  {isAr ? recommendedExam.titleAr : recommendedExam.titleEn}
                </Text>
              </View>
              <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.muted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* What's next */}
      <TouchableOpacity
        style={[s.nextRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
        activeOpacity={0.85}
        onPress={() => {
          if (nextLesson && found) {
            router.replace({
              pathname: '/lesson-player',
              params: { unitId: found.unit.id, lessonId: nextLesson.id },
            });
          } else {
            router.back();
          }
        }}
      >
        <View style={[s.nextIcon, { backgroundColor: theme.accent }]}>
          <Ionicons name="rocket" size={20} color={theme.primaryInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.nextTitle, { color: theme.text }, isAr && s.textRtl]}>
            {isAr ? 'ما التالي؟' : "What's next?"}
          </Text>
          <Text style={[s.nextSub, { color: theme.muted }, isAr && s.textRtl]} numberOfLines={1}>
            {nextLesson
              ? (isAr ? nextLesson.titleAr : nextLesson.titleEn)
              : (isAr ? 'العودة إلى المنهج' : 'Back to curriculum')}
          </Text>
        </View>
        <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={theme.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/lesson-feedback',
            params: {
              lessonId: found?.lesson.id ?? params.lessonId,
              lessonTitle: found?.lesson.titleEn ?? titleEn,
              lessonTitleAr: found?.lesson.titleAr ?? titleAr,
              unitId: found?.unit.id ?? params.unitId,
            },
          })
        }
        activeOpacity={0.9}>
        <LinearGradient colors={theme.primary} style={s.cta}>
          <Text style={[s.ctaText, { color: theme.primaryInk }]}>{isAr ? 'شارك ملاحظتك عن الدرس' : 'Share Lesson Feedback'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, alignItems: 'center' }}>
        <Text style={{ color: theme.muted, fontSize: 14, fontFamily: 'Amiri_400Regular', textDecorationLine: 'underline' }}>
          {isAr ? 'العودة' : 'Go back'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  badge: { alignSelf: 'center', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, fontFamily: 'Amiri_700Bold' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 16, fontFamily: 'Amiri_700Bold' },
  xpBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 16, borderWidth: 1 },
  xpBannerText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  section: { fontSize: 17, fontWeight: '700', marginTop: 4, marginBottom: 10, fontFamily: 'Amiri_700Bold' },
  summaryCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  bulletDot: { marginTop: 2, flexShrink: 0 },
  bullet: { flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Amiri_400Regular' },
  practiceHint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 16 },
  practiceHintText: { flex: 1, fontSize: 13, fontFamily: 'Amiri_400Regular' },
  pathCard: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', marginBottom: 16, gap: 14 },
  pathTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pathTopRowRtl: { flexDirection: 'row-reverse' },
  pathBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pathBadgeText: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  pathMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  pathTitle: { fontSize: 15, lineHeight: 23, fontFamily: 'Amiri_700Bold' },
  pathActions: { gap: 10 },
  pathPrimaryAction: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  pathPrimaryActionText: { fontSize: 15, fontFamily: 'Amiri_700Bold' },
  pathSecondaryAction: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  pathSecondaryActionInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pathSecondaryActionInnerRtl: { flexDirection: 'row-reverse' },
  pathSecondaryTitle: { fontSize: 14, fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  pathSecondarySub: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  nextIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  nextSub: { fontSize: 13, fontFamily: 'Amiri_400Regular' },
  cta: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  textRtl: { textAlign: 'right' },
});
