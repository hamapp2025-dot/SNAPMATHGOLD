// src/screens/ParentsScreen.js - Premium analytics dashboard (Bloomberg meets education)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import LanguageToggle from '../components/LanguageToggle';
import CardBackground from '../components/CardBackground';
import SunburstHeader from '../components/SunburstHeader';
import { useT } from '../config/LanguageContext';
import {
  BG,
  SURFACE as CARD,
  SURFACE_BORDER as BORDER,
  TEXT_PRIMARY as WHITE,
  TEXT_SECONDARY as MUTED,
  GOLD,
  GOLD_DIM,
  GOLD_BUTTON_GRADIENT,
  GOLD_BTN_TEXT,
  FONTS,
  SECTION_LABEL_STYLE,
  SCREEN_PADDING_H,
  CARD_BORDER_RADIUS,
  BUTTON_PILL_RADIUS,
  TYPE_SCALE,
} from '../config/theme';

const RING_SIZE = 120;
const RING_STROKE = 4;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

const WEEK_DAYS = [
  { day: 'Sun', mins: 0 },
  { day: 'Mon', mins: 45 },
  { day: 'Tue', mins: 60 },
  { day: 'Wed', mins: 30 },
  { day: 'Thu', mins: 60 },
  { day: 'Fri', mins: 25 },
  { day: 'Sat', mins: 60 },
];

const MOCK = {
  examReadiness: 73,
  studyHours: 12,
  questionsAnswered: 156,
  accuracy: 83,
  strengths: [
    { name: 'Partial Fractions', mastery: 94 },
    { name: 'Chain Rule', mastery: 88 },
  ],
  weaknesses: [
    { name: 'Trig Identities', mastery: 62 },
  ],
};

function ExamReadinessRing({ value, fontBold, fontReg, t, textAlign }) {
  const dash = (value / 100) * RING_CIRCUMFERENCE;
  const gap = RING_CIRCUMFERENCE - dash;
  return (
    <View style={s.heroWrap}>
      <View style={s.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE} style={s.ringSvg}>
          <Circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_R}
            stroke={GOLD_DIM}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_R}
            stroke={GOLD}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
          />
        </Svg>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={s.ringCenter}>
            <Text style={[s.heroNumber, { fontFamily: fontBold }]}>{value}%</Text>
          </View>
        </View>
      </View>
      <Text style={[s.heroLabel, { fontFamily: fontReg, textAlign }]}>{t('examReadiness').toUpperCase()}</Text>
    </View>
  );
}

export default function ParentsScreen() {
  const { t, isAr } = useT();

  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontHeadline = isAr ? FONTS.headingAr : FONTS.headlineEn;
  const fontReg = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const fontSection = FONTS.sectionLabel;
  const rowDir = isAr ? 'row-reverse' : 'row';
  const textAlign = isAr ? 'right' : 'left';

  const maxMins = Math.max(...WEEK_DAYS.map((d) => d.mins), 1);
  const totalMins = WEEK_DAYS.reduce((acc, d) => acc + d.mins, 0);
  const totalHrs = (totalMins / 60).toFixed(1);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <SunburstHeader />
      <View style={[s.header, { flexDirection: rowDir }]}>
        <LanguageToggle />
        <Text style={[s.headerTitle, { fontFamily: fontHeadline, textAlign }]}>{t('performanceReport')}</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* 1. EXAM READINESS — hero ring */}
        <ExamReadinessRing
          value={MOCK.examReadiness}
          fontBold={fontBold}
          fontReg={fontReg}
          t={t}
          textAlign={textAlign}
        />

        {/* 2. STATS ROW — 3 cards */}
        <View style={[s.statsRow, { flexDirection: rowDir }]}>
          <CardBackground style={s.statCard} contentStyle={s.statCardContent}>
            <Text style={[s.statNumber, { fontFamily: fontBold }]}>{MOCK.studyHours}</Text>
            <Text style={[s.statLabel, { fontFamily: fontReg }]}>{t('studyHoursThisWeek').toUpperCase()}</Text>
          </CardBackground>
          <CardBackground style={s.statCard} contentStyle={s.statCardContent}>
            <Text style={[s.statNumber, { fontFamily: fontBold }]}>{MOCK.questionsAnswered}</Text>
            <Text style={[s.statLabel, { fontFamily: fontReg }]}>{t('questionsAnswered').toUpperCase()}</Text>
          </CardBackground>
          <CardBackground style={s.statCard} contentStyle={s.statCardContent}>
            <Text style={[s.statNumber, { fontFamily: fontBold }]}>{MOCK.accuracy}%</Text>
            <Text style={[s.statLabel, { fontFamily: fontReg }]}>{t('accuracyPct').toUpperCase()}</Text>
          </CardBackground>
        </View>

        {/* 3. WEEKLY CHART */}
        <View style={[s.chartSectionHeader, { flexDirection: rowDir }]}>
          <Text style={[SECTION_LABEL_STYLE, s.sectionLabel, { fontFamily: fontSection, textAlign }]}>
            {t('weeklyStudyTime').toUpperCase()}
          </Text>
          <Text style={[s.chartTotal, { fontFamily: fontReg }]}>{totalHrs} {t('totalHours')}</Text>
        </View>
        <CardBackground style={s.card} contentStyle={s.chartCardContent}>
          <View style={[s.chartRow, { flexDirection: rowDir }]}>
            {WEEK_DAYS.map((d, i) => (
              <View key={i} style={s.chartCol}>
                <View style={s.chartBarBg}>
                  <View
                    style={[
                      s.chartBarFill,
                      { height: `${(d.mins / maxMins) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={[s.chartDay, { fontFamily: fontReg }]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </CardBackground>

        {/* 4. STRENGTHS — green left border */}
        <Text style={[SECTION_LABEL_STYLE, s.sectionLabel, { fontFamily: fontSection, textAlign }]}>
          {t('strengths').toUpperCase()}
        </Text>
        {MOCK.strengths.map((item, i) => (
          <View
            key={i}
            style={[
              s.topicCard,
              isAr ? s.strengthCardRtl : s.strengthCard,
              { flexDirection: rowDir },
            ]}
          >
            <Text style={[s.topicName, { fontFamily: fontReg, textAlign }]}>{item.name}</Text>
            <Text style={[s.topicMastery, { fontFamily: fontBold }]}>{item.mastery}%</Text>
          </View>
        ))}

        {/* 5. WEAKNESSES — red left border */}
        <Text style={[SECTION_LABEL_STYLE, s.sectionLabel, { fontFamily: fontSection, textAlign }]}>
          {t('weaknesses').toUpperCase()}
        </Text>
        {MOCK.weaknesses.map((item, i) => (
          <View
            key={i}
            style={[
              s.topicCard,
              isAr ? s.weaknessCardRtl : s.weaknessCard,
              { flexDirection: rowDir },
            ]}
          >
            <Text style={[s.topicName, { fontFamily: fontReg, textAlign }]}>{item.name}</Text>
            <Text style={[s.topicMastery, { fontFamily: fontBold }]}>{item.mastery}%</Text>
          </View>
        ))}

        {/* 6. BOTTOM BUTTONS */}
        <TouchableOpacity style={s.shareBtn} activeOpacity={0.85}>
          <Text style={[s.shareBtnText, { fontFamily: fontBold }]}>{t('shareReport')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.detailBtnWrap} activeOpacity={0.85}>
          <LinearGradient
            colors={GOLD_BUTTON_GRADIENT.colors}
            start={GOLD_BUTTON_GRADIENT.start}
            end={GOLD_BUTTON_GRADIENT.end}
            style={s.detailBtn}
          >
            <Text style={[s.detailBtnText, { fontFamily: fontBold }]}>{t('detailedReport')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: SCREEN_PADDING_H,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: TYPE_SCALE.h2, color: WHITE, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SCREEN_PADDING_H, paddingBottom: 100 },

  heroWrap: { alignItems: 'center', marginBottom: 24 },
  ringWrap: { width: RING_SIZE, height: RING_SIZE },
  ringSvg: { position: 'absolute' },
  ringCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNumber: { fontSize: 36, color: WHITE, fontVariant: ['tabular-nums'] },
  heroLabel: {
    marginTop: 10,
    fontSize: 10,
    letterSpacing: 4,
    color: GOLD,
  },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: CARD_BORDER_RADIUS },
  statCardContent: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 24, color: WHITE, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 10, color: MUTED, letterSpacing: 1.4, marginTop: 6, textAlign: 'center' },

  sectionLabel: { marginBottom: 12, marginTop: 24 },
  chartSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  chartTotal: { fontSize: 12, color: MUTED },
  card: { marginBottom: 14, borderRadius: CARD_BORDER_RADIUS },
  chartCardContent: { padding: 20 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBarBg: {
    width: 20,
    height: 80,
    backgroundColor: GOLD_DIM,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: 20,
    backgroundColor: GOLD,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDay: { fontSize: 10, color: MUTED, marginTop: 6 },

  topicCard: {
    backgroundColor: CARD,
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  strengthCard: { borderLeftWidth: 2, borderLeftColor: 'rgba(76,175,80,0.4)' },
  strengthCardRtl: { borderRightWidth: 2, borderRightColor: 'rgba(76,175,80,0.4)' },
  weaknessCard: { borderLeftWidth: 2, borderLeftColor: 'rgba(229,57,53,0.4)' },
  weaknessCardRtl: { borderRightWidth: 2, borderRightColor: 'rgba(229,57,53,0.4)' },
  topicName: { fontSize: 15, color: WHITE, flex: 1 },
  topicMastery: { fontSize: TYPE_SCALE.bodySmall, color: WHITE, fontVariant: ['tabular-nums'] },

  shareBtn: {
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: BUTTON_PILL_RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  shareBtnText: { fontSize: TYPE_SCALE.body, color: GOLD },
  detailBtnWrap: { marginTop: 12, borderRadius: BUTTON_PILL_RADIUS, overflow: 'hidden' },
  detailBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: BUTTON_PILL_RADIUS,
  },
  detailBtnText: { fontSize: TYPE_SCALE.body, color: GOLD_BTN_TEXT },
});
