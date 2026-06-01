import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ALL_UNITS, findUnitById, getLocalizedFormulaLabel } from '../src/data/grade12';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { stabilizeMixedMathText } from '../src/utils/bidi';

const WHITE = '#FFFFFF';

// Distinct accent color per unit (matches sound-library card colors)
const UNIT_ACCENT: Record<string, string> = {
  u1: '#0A7AFF',
  u2: '#2E8BFF',
  u3: '#4F6DFF',
  u4: '#2CC5FF',
  u5: '#5B8FF9',
  u6: '#4BC4B5',
  u7: '#7A88FF',
};

// Tips per unit
const UNIT_TIPS: Record<string, { en: string; ar: string }> = {
  u1: { en: 'Solve one example, then do one timed practice set to lock the method.', ar: 'حل مثالاً واحداً ثم أنجز مجموعة تدريب زمنية لتثبيت الطريقة.' },
  u2: { en: 'Memorise the 3 Pythagorean identities first — they unlock most proofs.', ar: 'احفظ المتطابقات الفيثاغورية الثلاث أولاً — فهي تفتح معظم البراهين.' },
  u3: { en: 'Always find critical points (f\'(x) = 0) before sketching curves.', ar: 'دائماً أوجد النقاط الحرجة (f\'(x) = 0) قبل رسم المنحنيات.' },
  u4: { en: 'Work in modulus-argument form for multiplication/division of complex numbers.', ar: 'استخدم صيغة المعامل-الزاوية لضرب وقسمة الأعداد المركبة.' },
  u5: { en: 'Learn the standard integrals table by heart — speed comes from recognition.', ar: 'احفظ جدول التكاملات الأساسية عن ظهر قلب — السرعة تأتي من التعرف الفوري.' },
  u6: { en: 'Draw a diagram for every vectors problem — direction errors cost marks.', ar: 'ارسم مخططاً لكل مسألة متجهات — أخطاء الاتجاه تُضيّع الدرجات.' },
  u7: { en: 'Distinguish P(A∩B) from P(A)·P(B) — independence is key.', ar: 'ميّز بين P(A∩B) و P(A)·P(B) — مفهوم الاستقلالية هو المحور الرئيسي.' },
};

export default function SoundDetailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { unitId } = useLocalSearchParams<{ unitId?: string }>();
  const unit = findUnitById(unitId) ?? ALL_UNITS[0];

  const accent = UNIT_ACCENT[unit.id] ?? theme.accent;
  const unitName = isAr
    ? unit.titleAr.replace(/^الوحدة \d+ · /, '')
    : unit.titleEn.replace(/^Unit \d+ · /, '');
  const unitCodeEn = unit.titleEn.match(/^Unit \d+/)?.[0] ?? 'Unit';
  const unitNumber = unitCodeEn.match(/\d+/)?.[0] ?? '1';
  const unitCodeAr = `الوحدة ${unitNumber}`;

  // Real lessons as chips
  const lessonChipsEn = unit.lessons.map((l) => l.titleEn);
  const lessonChipsAr = unit.lessons.map((l) => l.titleAr);
  const chips = isAr ? lessonChipsAr : lessonChipsEn;

  // Pull formulas across the unit so the library reflects the real curriculum better.
  const formulas = unit.lessons.flatMap((lesson) => lesson.keyFormulas).slice(0, 6);

  const tip = UNIT_TIPS[unit.id] ?? UNIT_TIPS.u1;

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={[accent, accent + 'CC']} style={s.topGrad}>
        <View style={[s.header, isAr && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={s.soundWrap}>
            <Text style={s.symbol}>{isAr ? unitCodeAr : unitCodeEn}</Text>
            <Text style={s.label} numberOfLines={2}>{unitName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({ pathname: '/chapter', params: { unitId: unit.id } })}>
            <Ionicons name="play-circle" size={34} color={WHITE} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Lessons chips */}
        <Text style={[s.section, { color: theme.text }]}>{isAr ? 'الدروس' : 'Lessons'}</Text>
        <View style={[s.examplesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.exampleRow}>
            {chips.map((chip, i) => (
              <TouchableOpacity
                key={chip}
                style={[s.wordChip, { backgroundColor: accent + '28', borderColor: accent + '55', borderWidth: 1 }]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/lesson-player',
                  params: { unitId: unit.id, lessonId: unit.lessons[i].id },
                })}
              >
                <Text style={[s.wordChipText, { color: WHITE }]} numberOfLines={2}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Key Formulas */}
        {formulas.length > 0 && (
          <>
            <Text style={[s.section, { color: theme.text }]}>{isAr ? 'صيغ رئيسية' : 'Key Formulas'}</Text>
            <View style={[s.formulasCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {formulas.map((f, i) => (
                <View
                  key={f.label}
                  style={[
                    s.formulaRow,
                    isAr && { flexDirection: 'row-reverse' },
                    i > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                  ]}
                >
                  <View style={[s.formulaLabelWrap, { backgroundColor: accent + '22' }]}>
                    <Text style={[s.formulaLabel, { color: accent }]} numberOfLines={2}>
                      {getLocalizedFormulaLabel(f.label, isAr, i)}
                    </Text>
                  </View>
                  <Text style={[s.formulaValue, { color: theme.text }, isAr && { textAlign: 'right' }]} numberOfLines={2}>
                    {stabilizeMixedMathText(f.formula, isAr)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Tip */}
        <Text style={[s.section, { color: theme.text }]}>{isAr ? 'نصيحة المدرب' : 'Coach Tip'}</Text>
        <View style={[s.tipCard, { backgroundColor: theme.surface, borderColor: `${accent}44` }]}>
          <View style={[s.tipRow, isAr && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="bulb-outline" size={20} color={accent} style={{ flexShrink: 0 }} />
            <Text style={[s.tipText, { color: theme.text }, isAr && { textAlign: 'right' }]}>
              {stabilizeMixedMathText(isAr ? tip.ar : tip.en, isAr)}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={[s.statsRow, isAr && { flexDirection: 'row-reverse' }]}>
          {[
            { icon: 'book-outline' as const, val: String(unit.lessons.length), label: isAr ? 'درس' : 'Lessons' },
            { icon: 'code-working-outline' as const, val: String(formulas.length), label: isAr ? 'صيغة' : 'Formulas' },
            { icon: 'help-circle-outline' as const, val: String(unit.lessons.reduce((s, l) => s + l.practiceQ.length, 0)), label: isAr ? 'سؤال' : 'Questions' },
          ].map((st) => (
            <View key={st.label} style={[s.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name={st.icon} size={18} color={accent} />
              <Text style={[s.statVal, { color: theme.text }]}>{st.val}</Text>
              <Text style={[s.statLabel, { color: theme.muted }]}>{st.label}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <View style={s.bottom}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/chapter', params: { unitId: unit.id } })}
        >
          <LinearGradient colors={[accent, accent + 'BB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.cta}>
            <Ionicons name="play" size={18} color={WHITE} />
            <Text style={s.ctaText}>
              {isAr ? `ابدأ ${unitCodeAr}` : `Start ${unitCodeEn}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topGrad: { paddingTop: 56, paddingBottom: 18, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soundWrap: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  symbol: { color: WHITE, fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', opacity: 0.8 },
  label: { color: 'rgba(255,255,255,0.9)', fontSize: 16, marginTop: 3, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
  section: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 10, marginTop: 16 },

  examplesCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wordChip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, maxWidth: '48%' },
  wordChipText: { fontSize: 13, fontFamily: 'Amiri_700Bold', lineHeight: 19 },

  formulasCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  formulaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  formulaLabelWrap: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: '38%' },
  formulaLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  formulaValue: { flex: 1, fontSize: 13, fontFamily: 'Amiri_400Regular', lineHeight: 19 },

  tipCard: { borderRadius: 16, borderWidth: 1, padding: 14 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 22 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Amiri_400Regular' },

  bottom: { position: 'absolute', left: 20, right: 20, bottom: 28 },
  cta: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
