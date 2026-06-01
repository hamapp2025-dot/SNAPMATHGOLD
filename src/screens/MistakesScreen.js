// src/screens/MistakesScreen.js - BoldVoice style
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import { BG, SURFACE, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, GOLD, GOLD_TINT, GOLD_BTN_TEXT, FONTS, TYPE_SCALE } from '../config/theme';

const CARD_BG = SURFACE;
const ACCENT = GOLD;

const MOCK_MISTAKES = [
  { id: '1', unitEn: 'Algebra', unitAr: 'الجبر', qEn: 'Decompose (3x+2)/((x+1)(x+2))', qAr: 'حلّل: (3x+2)/((x+1)(x+2))', wrongEn: 'A=2, B=1', wrongAr: 'A=2, B=1', correctEn: 'A=-1, B=4', correctAr: 'A=-1, B=4', expEn: 'At x=-1: A=-1. At x=-2: B=4.', expAr: 'عند x=-1 يكون A=-1، وعند x=-2 يكون B=4.', date: '2026-03-03' },
  { id: '2', unitEn: 'Trigonometry', unitAr: 'المثلثات', qEn: 'Find sin(2x) if sinx=0.6?', qAr: 'أوجد sin(2x) إذا كان sinx=0.6؟', wrongEn: '0.96', wrongAr: '0.96', correctEn: '0.96 (cos rule needed)', correctAr: '0.96 (باستخدام علاقة cos)', expEn: 'sin(2x)=2sinx·cosx. cosx=0.8, so sin(2x)=2(0.6)(0.8)=0.96.', expAr: 'sin(2x)=2sinx·cosx، وبما أن cosx=0.8 إذن sin(2x)=2(0.6)(0.8)=0.96.', date: '2026-03-02' },
];

export default function MistakesScreen({ navigation }) {
  const { isAr } = useT();
  const [filter, setFilter] = useState('all');
  const [mistakes] = useState(MOCK_MISTAKES);
  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const fontSemi = isAr ? FONTS.headingAr : FONTS.semiEn;
  const rowDir = isAr ? 'row-reverse' : 'row';
  const align = isAr ? 'right' : 'left';

  const units = ['all', 'Algebra', 'Trigonometry', 'Calculus', 'Complex Numbers'];
  const unitArMap = { all: 'الكل', Algebra: 'الجبر', Trigonometry: 'المثلثات', Calculus: 'التفاضل', 'Complex Numbers': 'الأعداد المركبة' };
  const filtered = filter === 'all' ? mistakes : mistakes.filter(m => m.unitEn === filter);

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <LanguageToggle />
        <Text style={[s.headerTitle, { fontFamily: fontBold, flex: 1, textAlign: align }]}>{isAr ? 'أخطائي' : 'My Mistakes'}</Text>
        <View style={s.countWrap}>
          <Text style={[s.count, { fontFamily: fontBold }]}>{mistakes.length}</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={s.filterRow}>
            {units.map(u => (
              <TouchableOpacity key={u} style={[s.filterBtn, filter === u && s.filterActive]} onPress={() => setFilter(u)}>
                <Text style={[s.filterText, { fontFamily: fontSemi, color: filter === u ? GOLD_BTN_TEXT : ACCENT }]}>{isAr ? unitArMap[u] : (u === 'all' ? 'All' : u)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.unitBadge}><Text style={[s.unitBadgeText, { fontFamily: fontSemi }]}>{isAr ? item.unitAr : item.unitEn}</Text></View>
            <Text style={[s.qEn, { fontFamily: fontSemi, textAlign: align }]}>{isAr ? item.qAr : item.qEn}</Text>
            <View style={[s.answerRow, { flexDirection: rowDir }]}>
              <View style={[s.ansBox, { borderColor: SURFACE_BORDER }]}>
                <Text style={[s.ansLabel, { fontFamily: fontReg }]}>{isAr ? 'خاطئ ✗' : 'Wrong ✗'}</Text>
                <Text style={[s.ansWrong, { fontFamily: fontSemi }]}>{isAr ? item.wrongAr : item.wrongEn}</Text>
              </View>
              <View style={[s.ansBox, { borderColor: ACCENT }]}>
                <Text style={[s.ansLabel, { fontFamily: fontReg }]}>{isAr ? 'صحيح ✓' : 'Correct ✓'}</Text>
                <Text style={[s.ansCorrect, { fontFamily: fontSemi }]}>{isAr ? item.correctAr : item.correctEn}</Text>
              </View>
            </View>
            <Text style={[s.exp, { fontFamily: fontReg, textAlign: align }]}>{isAr ? item.expAr : item.expEn}</Text>
            <TouchableOpacity style={s.retryBtn}><Text style={[s.retryTxt, { fontFamily: fontSemi }]}>{isAr ? 'تدرّب مرة أخرى' : 'Practice Again'}</Text></TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Ionicons name="sparkles-outline" size={52} color={GOLD} />
            <Text style={[s.emptyTitle, { fontFamily: fontBold }]}>{isAr ? 'لا توجد أخطاء مسجلة!' : 'No mistakes recorded!'}</Text>
            <Text style={[s.emptyEn, { fontFamily: fontReg, textAlign: align }]}>{isAr ? 'استمر في التدريب لتتبع نقاط الضعف.' : 'Keep practicing to track your weak areas.'}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={<View style={{ height: 30 }} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: SURFACE_BORDER },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: TEXT_PRIMARY, textAlign: 'center', fontSize: TYPE_SCALE.h2 },
  countWrap: {},
  count: { color: ACCENT, fontWeight: '900', fontSize: TYPE_SCALE.h2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  filterBtn: { borderWidth: 1, borderColor: ACCENT, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  filterActive: { backgroundColor: GOLD_TINT },
  filterText: { fontSize: 11 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: SURFACE_BORDER, padding: 16, marginBottom: 12 },
  unitBadge: { backgroundColor: GOLD_TINT, borderWidth: 1, borderColor: SURFACE_BORDER, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-end', marginBottom: 8 },
  unitBadgeText: { color: ACCENT, fontSize: 11 },
  qEn: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, marginBottom: 12 },
  answerRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  ansBox: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10 },
  ansLabel: { color: TEXT_TERTIARY, fontSize: 10, marginBottom: 4 },
  ansWrong: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall },
  ansCorrect: { color: ACCENT, fontSize: 14 },
  exp: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginBottom: 12 },
  retryBtn: { backgroundColor: ACCENT, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  retryTxt: { color: GOLD_BTN_TEXT, fontSize: TYPE_SCALE.bodySmall },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.h3, marginTop: 10 },
  emptyEn: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginTop: 4 },
});
