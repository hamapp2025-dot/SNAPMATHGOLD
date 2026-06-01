// src/screens/DailyScreen.js - TASK 16
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import { BG, SURFACE, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, GOLD, GOLD_TINT, GOLD_BTN_TEXT, FONTS, TYPE_SCALE } from '../config/theme';

const CARD_BG = SURFACE;
const ACCENT = GOLD;

const TODAY_CHALLENGE = {
  textAr: 'حلّل إلى كسور جزئية: (2x+1)/((x+1)(x+2))',
  textEn: 'Decompose into partial fractions: (2x+1)/((x+1)(x+2))',
  options: ['3/(x+1) - 1/(x+2)', '-1/(x+1) + 3/(x+2)', '1/(x+1) + 1/(x+2)', '2/(x+1) - 2/(x+2)'],
  correct: 1,
  explanationAr: 'A(x+2)+B(x+1)=2x+1. عند x=-1: A=-1. عند x=-2: B=3.',
};

export default function DailyScreen({ navigation }) {
  const { isAr } = useT();
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const fontSemi = isAr ? FONTS.headingAr : FONTS.semiEn;
  const rowDir = isAr ? 'row-reverse' : 'row';
  const align = isAr ? 'right' : 'left';

  useEffect(() => {
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    const calc = () => { const s = Math.floor((midnight - new Date()) / 1000); setTimeLeft(s > 0 ? s : 0); };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <LanguageToggle />
        <Text style={[s.headerTitle, { fontFamily: fontBold, fontSize: 22, flex: 1, textAlign: align }]}>{isAr ? 'تحدي اليوم' : 'Daily Challenge'}</Text>
        <View style={s.timer}><Text style={[s.timerTxt, {fontFamily: fontSemi}]}>{fmt(timeLeft)}</Text></View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.xpBadge}><Text style={[s.xpTxt, {fontFamily: fontSemi}]}>{isAr ? 'تحدي اليوم · +150 XP' : '+150 XP · Daily Challenge'}</Text></View>

        <View style={s.card}>
          <Text style={[s.qTitle, { fontFamily: fontSemi, textAlign: align }]}>{isAr ? TODAY_CHALLENGE.textAr : TODAY_CHALLENGE.textEn}</Text>

          {TODAY_CHALLENGE.options.map((opt, i) => {
            let bg = SURFACE, border = SURFACE_BORDER;
            if (selected !== null) {
              if (i === TODAY_CHALLENGE.correct) { bg = 'rgba(201,168,76,0.2)'; border = ACCENT; }
              else if (i === selected) { bg = GOLD_TINT; border = GOLD; }
            }
            const isGoldBg = selected !== null && i === TODAY_CHALLENGE.correct;
            return (
              <TouchableOpacity key={i} style={[s.option, { backgroundColor: bg, borderColor: border, flexDirection: rowDir }]}
                onPress={() => { if (selected === null) { setSelected(i); setTimeout(() => setDone(true), 1500); } }} disabled={selected !== null}>
                <Text style={[s.optLetter, { fontFamily: fontSemi, color: isGoldBg ? GOLD_BTN_TEXT : ACCENT }]}>{['A','B','C','D'][i]}</Text>
                <Text style={[s.optTxt, { fontFamily: fontSemi, color: isGoldBg ? GOLD_BTN_TEXT : TEXT_PRIMARY, textAlign: align }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {done && (
            <View style={[s.exp, { borderColor: selected === TODAY_CHALLENGE.correct ? ACCENT : SURFACE_BORDER }]}>
              <Text style={[s.expTitle, { fontFamily: fontSemi, textAlign: align }]}>{selected === TODAY_CHALLENGE.correct ? (isAr ? 'ممتاز! +150 XP' : 'Great! +150 XP') : (isAr ? 'إجابة غير صحيحة' : 'Incorrect')}</Text>
              <Text style={[s.expTxt, {fontFamily: fontReg, textAlign: align}]}>{isAr ? TODAY_CHALLENGE.explanationAr : 'A(x+2)+B(x+1)=2x+1. At x=-1: A=-1. At x=-2: B=3.'}</Text>
            </View>
          )}
        </View>

        <Text style={[s.resetNote, { fontFamily: fontReg }]}>{isAr ? 'يتم التحديث عند منتصف الليل' : 'Resets at midnight'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: SURFACE_BORDER },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { textAlign: 'center' },
  timer: { backgroundColor: GOLD_TINT, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: ACCENT },
  timerTxt: { color: GOLD_BTN_TEXT, fontWeight: '900', fontSize: 13, fontVariant: ['tabular-nums'] },
  xpBadge: { backgroundColor: GOLD_TINT, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, alignSelf: 'center', borderWidth: 1, borderColor: ACCENT, marginBottom: 20 },
  xpTxt: { color: GOLD_BTN_TEXT, fontWeight: '900', fontSize: 15 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: SURFACE_BORDER, padding: 18, marginBottom: 16 },
  qTitle: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.h3, marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  optLetter: { color: ACCENT, fontWeight: '900', fontSize: 16, width: 28, textAlign: 'center' },
  optTxt: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, flex: 1 },
  exp: { marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: BG },
  expTitle: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, marginBottom: 4 },
  expTxt: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginTop: 4 },
  resetNote: { color: TEXT_TERTIARY, fontSize: TYPE_SCALE.caption, textAlign: 'center' },
});
