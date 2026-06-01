import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SEMESTER_1_UNITS, SEMESTER_2_UNITS } from '../src/data/grade12';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';

const { width: SW } = Dimensions.get('window');
const WHITE = '#FFFFFF';

// Symbol abbreviation shown large on the card (like "i·EE", "θ", "z·s" etc in BoldVoice)
const UNIT_SYMBOL: Record<string, string> = {
  u1: 'f(x)',
  u2: 'sin θ',
  u3: "f'(x)",
  u4: 'z',
  u5: '∫',
  u6: 'v⃗',
  u7: 'P(x)',
};

// Card colors — vivid, distinct per unit (not all-gold)
const CARD_COLORS = [
  '#0A7AFF',
  '#2E8BFF',
  '#4F6DFF',
  '#2CC5FF',
  '#5B8FF9',
  '#4BC4B5',
  '#7A88FF',
];

type Cell = {
  id: string;
  title: string;
  titleAr: string;
  symbol: string;
  ex1: string;
  ex1Ar: string;
  ex2: string;
  color: string;
};

export default function SoundLibraryScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const [tab, setTab] = useState<'sem1' | 'sem2'>('sem1');

  const semester1Cells = useMemo<Cell[]>(
    () =>
      SEMESTER_1_UNITS.map((u, i) => {
        const topicEn = u.titleEn.replace(/^Unit \d+ · /, '');
        return {
          id: u.id,
          title: topicEn,
          titleAr: u.titleAr.replace(/^الوحدة \d+ · /, ''),
          symbol: UNIT_SYMBOL[u.id] ?? topicEn.slice(0, 3),
          ex1: u.lessons[0]?.titleEn ?? '',
          ex1Ar: u.lessons[0]?.titleAr ?? '',
          ex2: u.lessons[1]?.titleEn ?? '',
          color: CARD_COLORS[i % CARD_COLORS.length],
        };
      }),
    []
  );

  const semester2Cells = useMemo<Cell[]>(
    () =>
      SEMESTER_2_UNITS.map((u, i) => {
        const topicEn = u.titleEn.replace(/^Unit \d+ · /, '');
        return {
          id: u.id,
          title: topicEn,
          titleAr: u.titleAr.replace(/^الوحدة \d+ · /, ''),
          symbol: UNIT_SYMBOL[u.id] ?? topicEn.slice(0, 3),
          ex1: u.lessons[0]?.titleEn ?? '',
          ex1Ar: u.lessons[0]?.titleAr ?? '',
          ex2: u.lessons[1]?.titleEn ?? '',
          color: CARD_COLORS[(SEMESTER_1_UNITS.length + i) % CARD_COLORS.length],
        };
      }),
    []
  );

  const displayCells = tab === 'sem1' ? semester1Cells : semester2Cells;

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[s.header, isAr && s.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>{t('soundLibraryTitle')}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tab row */}
      <View style={[s.tabRow, { borderBottomColor: theme.border }]}>
        {(['sem1', 'sem2'] as const).map((tabKey) => (
          <TouchableOpacity key={tabKey} style={[s.tabBtn, tab === tabKey && s.tabBtnActive, tab === tabKey && { borderBottomColor: theme.accent }]} onPress={() => setTab(tabKey)} activeOpacity={0.85}>
            <Text style={[s.tabText, { color: theme.muted }, tab === tabKey && s.tabTextActive, tab === tabKey && { color: theme.accent }]}>
              {tabKey === 'sem1' ? t('semester1') : t('semester2')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Section heading */}
        <Text style={[s.sectionTitle, { color: theme.text }]}>
          {tab === 'sem1' ? t('soundLibrarySemester1Topics') : t('soundLibrarySemester2Topics')}
        </Text>
        <Text style={[s.sectionSub, { color: theme.muted }]}>
          {t('soundLibraryTopicCount', { count: displayCells.length })}
        </Text>

        {/* 2-column card grid */}
        <View style={s.grid}>
          {displayCells.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.card, { backgroundColor: c.color }]}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/sound-detail', params: { unitId: c.id } })}>
              {/* Dark-to-transparent gradient overlay at bottom for text legibility */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
              />
              {/* Unit number badge top-left */}
              <View style={s.unitNumBadge}>
                <Text style={s.unitNumText}>{c.id.replace('u', '')}</Text>
              </View>
              {/* Decorative info marker */}
              <View style={s.infoDot}>
                <Ionicons name="information-circle" size={18} color="rgba(255,255,255,0.7)" />
              </View>

              {/* Big math symbol */}
              <Text style={[s.cardSymbol, isAr && s.textRtl]}>{c.symbol}</Text>

              {/* Title and example lessons */}
              <Text style={[s.cardTitle, isAr && s.textRtl]} numberOfLines={2}>{isAr ? c.titleAr : c.title}</Text>
              <Text style={[s.cardEx, isAr && s.textRtl]} numberOfLines={2}>{isAr ? c.ex1Ar : c.ex1}</Text>

              {/* Play button */}
              <View style={[s.playWrap, isAr && s.playWrapRtl]}>
                <View style={s.playBtn}>
                  <Ionicons name="play" size={16} color="#182036" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CARD_W = (SW - 20 * 2 - 12) / 2; // 2 columns, 12px gap

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  headerRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Amiri_700Bold' },

  // Tabs — exactly like BoldVoice: underline style, full width split
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 0 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabBtnActive: {},
  tabText: { fontSize: 16, fontWeight: '500', fontFamily: 'Amiri_700Bold' },
  tabTextActive: { fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 50 },
  sectionTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  sectionSub: { fontSize: 13, marginBottom: 16, fontFamily: 'Amiri_400Regular' },

  // Card grid — 2 columns
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_W,
    minHeight: 200,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },

  infoDot: { position: 'absolute', top: 10, right: 10 },
  textRtl: { textAlign: 'right' },

  unitNumBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitNumText: { color: WHITE, fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Big math symbol (like "i·EE" in BoldVoice)
  cardSymbol: {
    color: WHITE,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    marginTop: 36,
    marginBottom: 6,
    letterSpacing: 0.5,
    opacity: 0.9,
  },

  cardTitle: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    marginBottom: 4,
    lineHeight: 20,
  },

  // Example lesson names with underline decoration
  cardEx: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
    textDecorationLine: 'underline',
    marginBottom: 2,
    lineHeight: 17,
  },

  // Play button at bottom-right
  playWrap: { marginTop: 'auto', alignItems: 'flex-end' },
  playWrapRtl: { alignItems: 'flex-start' },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEEF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
