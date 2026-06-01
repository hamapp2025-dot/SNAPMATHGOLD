// src/screens/FormulasScreen.js - TASK 14
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import { BG, SURFACE, SURFACE_BORDER, INPUT_BG, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, GOLD, GOLD_TINT, FONTS, TYPE_SCALE } from '../config/theme';

const FORMULAS = [
  {
    unitAr: 'الجبر', unitEn: 'Algebra',
    items: [
      { nameAr: 'الكسور الجزئية', nameEn: 'Partial Fractions', formula: 'P(x)/[(x-a)(x-b)] = A/(x-a) + B/(x-b)', descAr: 'تحليل كسر إلى كسور أبسط' },
      { nameAr: 'نظرية الباقي', nameEn: 'Remainder Theorem', formula: 'f(a) = remainder when f(x) ÷ (x-a)', descAr: 'الباقي يساوي قيمة الدالة عند x=a' },
      { nameAr: 'نظرية العامل', nameEn: 'Factor Theorem', formula: 'If f(a) = 0, then (x-a) is a factor', descAr: 'إذا كان f(a)=0 فإن (x-a) عامل' },
    ],
  },
  {
    unitAr: 'المثلثات', unitEn: 'Trigonometry',
    items: [
      { nameAr: 'متطابقة فيثاغورس', nameEn: 'Pythagorean Identity', formula: 'sin²x + cos²x = 1', descAr: 'المتطابقة المثلثية الأساسية' },
      { nameAr: 'الزوايا المركبة - الجيب', nameEn: 'Compound Angle - Sin', formula: 'sin(A±B) = sinA·cosB ± cosA·sinB', descAr: 'جيب مجموع أو فرق زاويتين' },
      { nameAr: 'الزوايا المركبة - التمام', nameEn: 'Compound Angle - Cos', formula: 'cos(A±B) = cosA·cosB ∓ sinA·sinB', descAr: 'تمام مجموع أو فرق زاويتين' },
      { nameAr: 'الزاوية المضاعفة', nameEn: 'Double Angle', formula: 'sin2A = 2sinA·cosA\ncos2A = cos²A - sin²A', descAr: 'الزاوية المضاعفة للجيب والتمام' },
      { nameAr: 'المتطابقات الأخرى', nameEn: 'Other Identities', formula: '1 + tan²x = sec²x\n1 + cot²x = csc²x', descAr: 'متطابقات مهمة' },
    ],
  },
  {
    unitAr: 'التفاضل', unitEn: 'Differentiation',
    items: [
      { nameAr: 'القوة', nameEn: 'Power Rule', formula: 'd/dx(xⁿ) = n·xⁿ⁻¹', descAr: 'اشتقاق الدالة الأسية' },
      { nameAr: 'الجيب والتمام', nameEn: 'Sin & Cos', formula: "d/dx(sinx) = cosx\nd/dx(cosx) = -sinx", descAr: 'اشتقاق الدوال المثلثية' },
      { nameAr: 'الأسية واللوغاريتم', nameEn: 'Exp & Log', formula: 'd/dx(eˣ) = eˣ\nd/dx(lnx) = 1/x', descAr: 'اشتقاق الدوال الأسية واللوغاريتمية' },
      { nameAr: 'قاعدة الضرب', nameEn: 'Product Rule', formula: "(uv)' = u'v + uv'", descAr: 'اشتقاق حاصل ضرب دالتين' },
      { nameAr: 'قاعدة القسمة', nameEn: 'Quotient Rule', formula: "(u/v)' = (u'v - uv') / v²", descAr: 'اشتقاق حاصل قسمة دالتين' },
      { nameAr: 'قاعدة السلسلة', nameEn: 'Chain Rule', formula: '[f(g(x))]\' = f\'(g(x)) · g\'(x)', descAr: 'اشتقاق الدالة المركبة' },
    ],
  },
  {
    unitAr: 'الأعداد المركبة', unitEn: 'Complex Numbers',
    items: [
      { nameAr: 'الوحدة التخيلية', nameEn: 'Imaginary Unit', formula: 'i² = -1, i = √(-1)', descAr: 'تعريف الوحدة التخيلية' },
      { nameAr: 'الصورة الجبرية', nameEn: 'Algebraic Form', formula: 'z = a + bi', descAr: 'الجزء الحقيقي a، الجزء التخيلي b' },
      { nameAr: 'المعامل', nameEn: 'Modulus', formula: '|z| = √(a² + b²)', descAr: 'بُعد العدد المركب من الأصل' },
      { nameAr: 'الحجة', nameEn: 'Argument', formula: 'arg(z) = θ = arctan(b/a)', descAr: 'الزاوية التي يصنعها العدد مع المحور الحقيقي' },
      { nameAr: 'الصورة القطبية', nameEn: 'Polar Form', formula: 'z = r(cosθ + i·sinθ) = r·e^(iθ)', descAr: 'تمثيل العدد المركب بالمعامل والحجة' },
      { nameAr: 'مبرهنة دي موافر', nameEn: "De Moivre's Theorem", formula: 'zⁿ = rⁿ(cos(nθ) + i·sin(nθ))', descAr: 'رفع العدد المركب لقوة صحيحة' },
    ],
  },
];

export default function FormulasScreen({ navigation }) {
  const { isAr } = useT();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({ 0: true });
  const [favorites, setFavorites] = useState(new Set());
  const [showFav, setShowFav] = useState(false);
  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontSemi = isAr ? FONTS.headingAr : FONTS.semiEn;
  const align = isAr ? 'right' : 'left';
  const rowDir = isAr ? 'row-reverse' : 'row';

  const toggleFav = (key) => {
    setFavorites(f => {
      const n = new Set(f);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const filtered = FORMULAS.map(unit => ({
    ...unit,
    items: unit.items.filter(item =>
      !search || item.nameEn.toLowerCase().includes(search.toLowerCase()) || item.formula.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(u => u.items.length > 0);

  const displayData = showFav
    ? FORMULAS.map(u => ({ ...u, items: u.items.filter((_, i) => favorites.has(`${u.unitEn}-${i}`) )})).filter(u => u.items.length > 0)
    : filtered;

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <LanguageToggle />
        <Text style={[s.headerTitle, { fontFamily: fontBold, fontSize: 24, flex: 1, textAlign: align }]}>{isAr ? 'القوانين' : 'Formulas'}</Text>
        <TouchableOpacity style={s.bookmarkBtn} onPress={() => setShowFav(!showFav)}>
          <Ionicons name="star-outline" size={24} color={showFav ? GOLD : TEXT_TERTIARY} />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={[s.searchInput, { textAlign: align }]}
          placeholder={isAr ? 'ابحث عن القوانين...' : 'Search formulas...'}
          placeholderTextColor={TEXT_TERTIARY}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {displayData.map((unit, ui) => (
          <View key={ui} style={s.section}>
            <TouchableOpacity style={[s.sectionHeader, { flexDirection: rowDir }]} onPress={() => setExpanded(e => ({ ...e, [ui]: !e[ui] }))}>
              <Text style={[s.chevron, {fontFamily: fontSemi}]}>{expanded[ui] ? '▼' : '▶'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.unitEn, { fontFamily: fontSemi, textAlign: align, fontSize: TYPE_SCALE.h2, color: TEXT_PRIMARY }]}>{isAr ? unit.unitAr : unit.unitEn}</Text>
              </View>
            </TouchableOpacity>

            {expanded[ui] && unit.items.map((item, ii) => {
              const key = `${unit.unitEn}-${ii}`;
              const isFav = favorites.has(key);
              return (
                <View key={ii} style={s.formulaCard}>
                  <View style={[s.formulaHeader, { flexDirection: rowDir }]}>
                    <TouchableOpacity onPress={() => toggleFav(key)}>
                      <Ionicons name="star-outline" size={20} color={isFav ? GOLD : TEXT_TERTIARY} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                      <Text style={[s.formulaEn, { fontFamily: fontSemi, fontSize: TYPE_SCALE.bodySmall, color: TEXT_PRIMARY, textAlign: align }]}>{isAr ? item.nameAr : item.nameEn}</Text>
                    </View>
                  </View>
                  <View style={s.formulaBox}>
                    <Text style={[s.formulaText, {fontFamily: fontSemi}]}>{item.formula}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {displayData.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="calculator-outline" size={48} color={GOLD} />
            <Text style={[s.emptyTitle, { fontFamily: fontSemi, fontSize: 16, marginTop: 10 }]}>{isAr ? 'لا توجد نتائج' : 'No results'}</Text>
            <Text style={[s.emptyEn, {fontFamily: fontSemi}]}>{isAr ? 'لم يتم العثور على قوانين' : 'No formulas found'}</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, gap: 12 },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { textAlign: 'center' },
  bookmarkBtn: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: { backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, borderWidth: 1, borderColor: SURFACE_BORDER },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: BG },
  chevron: { color: GOLD, fontSize: 14 },
  unitEn: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall },
  formulaCard: { backgroundColor: SURFACE, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: SURFACE_BORDER, padding: 14 },
  formulaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  formulaEn: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.caption },
  formulaBox: { backgroundColor: BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: SURFACE_BORDER },
  formulaText: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, textAlign: 'center', lineHeight: 24 },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body },
  emptyEn: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginTop: 4 },
});
