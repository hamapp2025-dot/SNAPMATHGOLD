// src/screens/LeaderboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { GOLD, BG, SURFACE as CARD, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, FONTS, TYPE_SCALE, arabicHeading } from '../config/theme';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';

export default function LeaderboardScreen() {
  const { isAr } = useT();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('all');

  const loadData = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setUsers([
        { id: '1', name: 'Hamza', xp: 3200, streak: 12, grade: '12' },
        { id: '2', name: 'Hamza Alfasatla', xp: 100, streak: 1, grade: '12' },
      ]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={GOLD} /></View>;

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={GOLD} />}>
        <View style={[s.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <LanguageToggle />
          <View style={[s.headerTitleWrap, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
            <Text style={[arabicHeading, s.headerAr]}>لوحة المتصدرين</Text>
            <Text style={[s.headerEn, { fontFamily: FONTS.bodyEn }]}>{isAr ? 'لوحة الترتيب' : 'Leaderboard'}</Text>
          </View>
        </View>

        <View style={s.tabRow}>
          {[{ key: 'week', ar: 'هذا الأسبوع', en: 'This Week' }, { key: 'all', ar: 'الكل', en: 'All Time' }, { key: 'grade', ar: 'صفي', en: 'My Grade' }].map(t => (
            <TouchableOpacity key={t.key} style={[s.tabBtn, tab === t.key && s.tabBtnActive]} onPress={() => setTab(t.key)}>
              <Text style={[arabicHeading, { fontSize: TYPE_SCALE.bodySmall, color: tab === t.key ? BG : GOLD }]}>{isAr ? t.ar : t.en}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.card}>
          <Text style={[s.top3Label, { fontFamily: FONTS.headingEn, textAlign: isAr ? 'right' : 'left' }]}>{isAr ? 'أفضل 3' : 'Top 3'}</Text>
          <View style={s.podiumRow}>
            {top3.map((u, i) => (
              <View key={u.id} style={s.podiumItem}>
                <Text style={s.medal}>{['🥇', '🥈', '🥉'][i]}</Text>
                <Text style={[s.podiumName, { fontFamily: FONTS.semiEn }]}>{u.name}</Text>
                <Text style={[s.podiumXP, { fontFamily: FONTS.semiEn }]}>{u.xp} XP</Text>
              </View>
            ))}
          </View>
        </View>

        {rest.map((u, i) => (
          <View key={u.id} style={[s.rankRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Text style={[s.rankNum, { fontFamily: FONTS.semiEn }]}>{i + 4}</Text>
            <View style={s.avatar}><Text style={s.avatarTxt}>{u.name?.[0] || '?'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={[s.rankName, { fontFamily: FONTS.semiEn, textAlign: isAr ? 'right' : 'left' }]}>{u.name}</Text>
              <Text style={[s.rankXP, { fontFamily: FONTS.bodyEn, textAlign: isAr ? 'right' : 'left' }]}>{u.xp} XP</Text>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Ionicons name="flame-outline" size={14} color={GOLD} /><Text style={[s.rankStreak, { fontFamily: FONTS.bodyEn }]}>{u.streak || 0}</Text></View>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, backgroundColor: BG },
  center: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 12 },
  headerTitleWrap: { flex: 1, alignItems: 'flex-end' },
  headerAr: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.h1 },
  headerEn: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginTop: 4 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: GOLD, alignItems: 'center' },
  tabBtnActive: { backgroundColor: GOLD },
  card: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: SURFACE_BORDER, padding: 18, marginHorizontal: 16, marginBottom: 14 },
  top3Label: { color: TEXT_PRIMARY, fontWeight: '900', fontSize: TYPE_SCALE.body, marginBottom: 16 },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around' },
  podiumItem: { alignItems: 'center' },
  medal: { fontSize: 36, marginBottom: 8 },
  podiumName: { color: TEXT_PRIMARY, fontWeight: '700', fontSize: TYPE_SCALE.bodySmall },
  podiumXP: { color: GOLD, fontWeight: '700', fontSize: TYPE_SCALE.caption, marginTop: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: CARD, gap: 12 },
  rankNum: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.body, fontWeight: '700', width: 28 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD, borderWidth: 1, borderColor: GOLD, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: GOLD, fontWeight: '900', fontSize: TYPE_SCALE.body },
  rankName: { color: TEXT_PRIMARY, fontWeight: '700', fontSize: TYPE_SCALE.body },
  rankXP: { color: GOLD, fontSize: TYPE_SCALE.caption, marginTop: 2 },
  rankStreak: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall },
});
