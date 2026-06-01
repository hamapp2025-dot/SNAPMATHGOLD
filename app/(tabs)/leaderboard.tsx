import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useXP } from '../../src/hooks/useXP';
import { useScoreHistory } from '../../src/hooks/useScoreHistory';
import { withAlpha } from '../../src/theme/colorUtils';
const { width: SW } = Dimensions.get('window');

function getWeekStart(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();
  const diff = out.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(out.getFullYear(), out.getMonth(), diff);
}

function getNextMonday(d: Date): Date {
  const start = getWeekStart(d);
  start.setDate(start.getDate() + 7);
  return start;
}

function isInThisWeek(isoDate: string): boolean {
  const d = new Date(isoDate);
  const weekStart = getWeekStart(new Date());
  const nextStart = getNextMonday(new Date());
  return d >= weekStart && d < nextStart;
}

// Avatar palette — assigned by hash of uid so the same user always gets the same colour
const PALETTE = ['#0A7AFF', '#2E8BFF', '#4F6DFF', '#6B8CFF', '#2CC5FF', '#4BC4B5', '#3D9CFF', '#7A88FF'];
function colorForUid(uid: string) {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

type Player = {
  uid: string;
  name: string;
  xp: number;
  streak: number;
  avatar: string;
};

const PODIUM_HEIGHTS = [160, 200, 130] as const;

function PodiumBar({ entry, height }: { entry: Player; height: number }) {
  const riseAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useAppTheme();
  useEffect(() => {
    Animated.spring(riseAnim, { toValue: height, useNativeDriver: false, friction: 7 }).start();
  }, [height]);

  return (
    <View style={pd.col}>
      <View style={[pd.avatarWrap, { backgroundColor: entry.avatar + '30', borderColor: entry.avatar }]}>
        <Text style={pd.avatarInitial}>{entry.name[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={[pd.name, { color: theme.text }]} numberOfLines={1}>{entry.name}</Text>
      <Text style={[pd.xp, { color: theme.muted }]}>{(entry.xp / 1000).toFixed(1)}k</Text>
      <Animated.View style={[pd.bar, { height: riseAnim, backgroundColor: entry.avatar }]} />
    </View>
  );
}

const pd = StyleSheet.create({
  col: { alignItems: 'center', justifyContent: 'flex-end', width: SW * 0.28 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  avatarInitial: { color: '#FFF', fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  name: { color: '#FFF', fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  xp: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 6, fontFamily: 'Amiri_400Regular' },
  bar: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10 },
});

function RankRow({
  entry,
  rank,
  isMe,
  isAr,
  weekly,
  totalCount,
}: {
  entry: Player;
  rank: number;
  isMe: boolean;
  isAr: boolean;
  weekly: boolean;
  totalCount: number;
}) {
  const { theme } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, delay: rank * 45 }).start();
  }, [rank]);

  const promote = weekly && rank <= 5;
  const relegate = weekly && rank > totalCount - 3;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={isMe ? [withAlpha(theme.accent, 0.25), withAlpha(theme.accent, 0.08)] : ['transparent', 'transparent']}
        style={[s.rankRow, { borderBottomColor: theme.border }, isAr && s.rankRowRtl, isMe && s.rankRowMe]}
      >
        <View style={s.rankNumWrap}>
          <Text style={[s.rankNum, { color: isMe ? theme.accent : theme.accent }]}>#{rank}</Text>
          {promote && <Text style={s.promoteIcon}>⬆️</Text>}
          {relegate && <Text style={s.relegateIcon}>⬇️</Text>}
        </View>
        <View style={[s.rowAvatar, { backgroundColor: entry.avatar + '30', borderColor: isMe ? theme.accent : entry.avatar }]}>
          <Text style={[s.rowAvatarText, { color: entry.avatar }]}>{entry.name[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowName, { color: theme.text }, isAr && { textAlign: 'right' }]}>{entry.name}</Text>
          {!weekly && entry.streak > 0 && (
            <View style={[s.streakRow, isAr && { flexDirection: 'row-reverse' }]}> 
              <Ionicons name="flame" size={11} color="#FF6B3D" />
              <Text style={s.streakTxt}>{entry.streak}</Text>
            </View>
          )}
        </View>
        <Text style={[s.rowXP, { color: isMe ? theme.accent : theme.muted }, isAr && s.rowXPRtl]}>{entry.xp.toLocaleString('en-US')} XP</Text>
        {isMe && (
          <View style={[s.meBadge, { backgroundColor: theme.accent }, isAr && s.meBadgeRtl]}>
            <Text style={[s.meBadgeText, { color: theme.primaryInk }]}>{isAr ? 'أنت' : 'YOU'}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const MOCK_WEEKLY_NAMES = ['Layla', 'Omar', 'Noor', 'Youssef', 'Hala', 'Kareem', 'Sara', 'Tariq', 'Lina', 'Adam'];

export default function LeaderboardScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { totalXP, streak } = useXP();
  const { history } = useScoreHistory();

  const [tab, setTab] = useState<'all' | 'weekly'>('all');
  const [myUid, setMyUid] = useState('');
  const [myName, setMyName] = useState('');
  const [avatarColor, setAvatarColor] = useState(theme.accent);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weeklyXP = useMemo(() => {
    return history.filter((e) => isInThisWeek(e.date)).reduce((sum, e) => sum + e.xpEarned, 0);
  }, [history]);

  const daysToMonday = useMemo(() => {
    const nextMonday = getNextMonday(new Date(nowTs));
    const ms = nextMonday.getTime() - nowTs;
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [nowTs]);

  useEffect(() => {
    AsyncStorage.multiGet(['@snapmath_name', '@snapmath_avatar_color', '@snapmath_uid']).then((vals) => {
      const name = vals[0][1] ?? '';
      const color = vals[1][1];
      const uid = vals[2][1] ?? 'local';
      if (name) setMyName(name);
      if (color) setAvatarColor(color);
      setMyUid(uid);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('totalXP', 'desc'), limit(30));
        const snap = await getDocs(q);
        const fetched: Player[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          fetched.push({
            uid: doc.id,
            name: d.name ?? d.displayName ?? 'Student',
            xp: d.totalXP ?? 0,
            streak: d.streak ?? 0,
            avatar: colorForUid(doc.id),
          });
        });
        if (!cancelled) setPlayers(fetched);
      } catch {
        // keep fallback local ranking
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = myName || (isAr ? 'أنت' : 'You');

  const meEntry: Player = {
    uid: myUid || 'local',
    name: displayName,
    xp: tab === 'weekly' ? weeklyXP : totalXP,
    streak,
    avatar: avatarColor,
  };

  const merged: Player[] = useMemo(() => {
    if (tab === 'weekly') {
      const seed = getWeekStart(new Date(nowTs)).getTime();
      const mockWeekly = MOCK_WEEKLY_NAMES.map((name, i) => ({
        uid: `mock-${i}`,
        name,
        xp: 80 + ((seed + i * 7919) % 220) + i * 25,
        streak: 0,
        avatar: colorForUid(name),
      }));
      return [...mockWeekly, meEntry].sort((a, b) => b.xp - a.xp);
    }
    const withoutMe = players.filter((p) => p.uid !== myUid && p.name !== displayName);
    return [...withoutMe, meEntry].sort((a, b) => b.xp - a.xp);
  }, [tab, nowTs, players, meEntry, myUid, displayName]);

  const top3 = merged.slice(0, 3);
  const rest = merged.slice(3);
  const myRank = merged.findIndex((p) => p.uid === myUid || p.name === displayName) + 1;
  const totalCount = merged.length;

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={[s.headerRow, isAr && s.headerRowRtl]}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/profile')}
          activeOpacity={0.82}
          style={[s.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text style={[s.title, { color: theme.text }]}>{isAr ? 'لوحة المتصدرين' : 'Leaderboard'}</Text>
        </View>
        <View style={s.headerSide} />
      </View>

      <View style={[s.tabRow, isAr && s.tabRowRtl]}>
        <TouchableOpacity
          style={[s.tabBtn, { backgroundColor: tab === 'all' ? withAlpha(theme.accent, 0.13) : theme.surface, borderColor: tab === 'all' ? theme.accent : theme.border }]}
          onPress={() => setTab('all')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, { color: tab === 'all' ? theme.accent : theme.muted }]}>{isAr ? 'كل الوقت' : 'All Time'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, { backgroundColor: tab === 'weekly' ? withAlpha(theme.accent, 0.13) : theme.surface, borderColor: tab === 'weekly' ? theme.accent : theme.border }]}
          onPress={() => setTab('weekly')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, { color: tab === 'weekly' ? theme.accent : theme.muted }]}>{isAr ? 'الدوري الأسبوعي' : 'Weekly League'}</Text>
        </TouchableOpacity>
      </View>

      {tab === 'weekly' && (
        <View style={[s.leagueBanner, isAr && s.leagueBannerRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="trophy" size={18} color={theme.accent} />
          <Text style={[s.leagueBannerText, isAr && s.leagueBannerTextRtl, { color: theme.muted }]}>
            {isAr ? `ينتهي الدوري خلال ${daysToMonday} يوم` : `League ends in ${daysToMonday} days`}
          </Text>
        </View>
      )}

      {loading && tab === 'all' ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[s.loadingText, { color: theme.muted }]}>{isAr ? 'جارٍ التحميل…' : 'Loading rankings…'}</Text>
        </View>
      ) : (
        <>
          <Animated.View style={[s.podiumWrap, { opacity: fadeAnim }]}> 
            <LinearGradient colors={[withAlpha(theme.accent, 0.08), 'transparent']} style={s.podiumGlow} />
            <View style={s.podiumBars}>
              {podiumOrder.map((entry, i) => (entry ? <PodiumBar key={entry.uid} entry={entry} height={PODIUM_HEIGHTS[i]} /> : null))}
            </View>
            <View style={[s.podiumBase, { backgroundColor: withAlpha(theme.accent, 0.15) }]} />
          </Animated.View>

          <View style={[s.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {rest.map((entry, i) => (
              <RankRow
                key={entry.uid}
                entry={entry}
                rank={i + 4}
                isMe={entry.uid === myUid || entry.name === displayName}
                isAr={isAr}
                weekly={tab === 'weekly'}
                totalCount={totalCount}
              />
            ))}
            {rest.length === 0 && (
              <Text style={[s.emptyText, { color: theme.muted }]}>
                {isAr ? 'لا يوجد مستخدمون آخرون بعد' : 'No other players yet — invite friends!'}
              </Text>
            )}
          </View>
        </>
      )}

      <View style={[s.myStats, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <LinearGradient
          colors={[withAlpha(theme.accent, 0.18), 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
        <Text style={[s.myStatsTitle, { color: theme.text }]}>{isAr ? 'إحصائياتك' : 'Your Stats'}</Text>
        <View style={[s.myStatsRow, isAr && { flexDirection: 'row-reverse' }]}>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: theme.accent }]}>{(tab === 'weekly' ? weeklyXP : totalXP).toLocaleString('en-US')}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{tab === 'weekly' ? (isAr ? 'XP هذا الأسبوع' : 'Weekly XP') : 'XP'}</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: theme.accent }]}>#{myRank || '—'}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{isAr ? 'مرتبة' : 'Rank'}</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <View style={s.statBox}>
            <Text style={[s.statNum, streak > 0 && { color: '#FF6B3D' }]}>{streak} 🔥</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{isAr ? 'سلسلة' : 'Streak'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerRowRtl: { flexDirection: 'row-reverse' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSide: { width: 40, height: 40 },
  headerTitleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 34, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabRowRtl: { flexDirection: 'row-reverse' },
  tabBtn: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  leagueBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  leagueBannerText: { fontSize: 13, fontFamily: 'Amiri_400Regular' },
  leagueBannerRtl: { flexDirection: 'row-reverse' },
  leagueBannerTextRtl: { textAlign: 'right' },

  rankNumWrap: { width: 40 },
  promoteIcon: { fontSize: 10, marginTop: 1 },
  relegateIcon: { fontSize: 10, marginTop: 1 },

  loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: 'Amiri_400Regular' },

  podiumWrap: { marginBottom: 24, overflow: 'hidden', borderRadius: 20 },
  podiumGlow: { ...StyleSheet.absoluteFillObject },
  podiumBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingTop: 24, paddingHorizontal: 12 },
  podiumBase: { height: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },

  listCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rankRowRtl: { flexDirection: 'row-reverse' },
  rankRowMe: { borderWidth: 0 },
  rankNum: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  rowName: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  streakTxt: { color: '#FF6B3D', fontSize: 11, fontFamily: 'Amiri_400Regular' },
  rowXP: { color: '#B8BED6', fontSize: 13, fontWeight: '600', fontFamily: 'Amiri_700Bold' },
  rowXPRtl: { textAlign: 'left' },
  meBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginLeft: 6 },
  meBadgeRtl: { marginLeft: 0, marginRight: 6 },
  meBadgeText: { color: '#1B1D30', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  emptyText: { textAlign: 'center', padding: 24, fontSize: 14, fontFamily: 'Amiri_400Regular' },

  myStats: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  myStatsTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 },
  myStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 11, marginTop: 3, fontFamily: 'Amiri_400Regular', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 40 },
});
