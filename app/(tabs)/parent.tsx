import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useXP } from '../../src/hooks/useXP';
import { useScoreHistory } from '../../src/hooks/useScoreHistory';
import { withAlpha } from '../../src/theme/colorUtils';
const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';
const GREEN = '#2ED573';

function gradeLabel(n: number) {
  if (n >= 90) return 'A';
  if (n >= 75) return 'B';
  if (n >= 60) return 'C';
  if (n >= 50) return 'D';
  return 'F';
}

function gradeColor(n: number, accent: string) {
  if (n >= 75) return GREEN;
  if (n >= 60) return accent;
  return '#FF3B30';
}

export default function ParentScreen() {
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { totalXP, streak, level } = useXP();
  const { history, avgScore, bestScore, examHistory } = useScoreHistory();

  const [userName, setUserName] = useState('');
  const [userGrade, setUserGrade] = useState('g12');

  useEffect(() => {
    AsyncStorage.multiGet(['@snapmath_name', '@snapmath_grade']).then((vals) => {
      const name = vals[0][1];
      const grade = vals[1][1];
      if (name) setUserName(name);
      if (grade) setUserGrade(grade);
    });
  }, []);

  const gradeName = userGrade === 'g10'
    ? (isAr ? 'الصف العاشر' : 'Grade 10')
    : userGrade === 'g11'
    ? (isAr ? 'الصف الحادي عشر' : 'Grade 11')
    : (isAr ? 'الصف الثاني عشر — توجيهي' : 'Grade 12 — Tawjihi');

  const recentActivities = history.slice(0, 5);

  const handleShare = async () => {
    const msg = isAr
      ? `تقرير تقدم ${userName || 'الطالب'} في سناب ماث:\n• المستوى: ${level}\n• نقاط XP: ${totalXP}\n• أفضل نتيجة: ${bestScore}%\n• متوسط الدرجات: ${avgScore}%\n• سلسلة: ${streak} أيام`
      : `${userName || 'Student'}'s SnapMath Progress Report:\n• Level: ${level}\n• XP: ${totalXP}\n• Best Score: ${bestScore}%\n• Avg Score: ${avgScore}%\n• Streak: ${streak} days`;
    await Share.share({ message: msg });
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[s.headerRow, isAr && s.headerRowRtl]}>
        <View>
          <Text style={[s.title, { color: theme.text }]}>
            {isAr ? 'لوحة أولياء الأمور' : 'Parent Dashboard'}
          </Text>
          <Text style={[s.sub, { color: theme.muted }]}>
            {isAr ? 'نظرة حقيقية على تقدم طفلك' : "Real view of your child's progress"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleShare}
          style={[s.shareBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {/* Student snapshot banner */}
      <LinearGradient colors={theme.primary} style={s.snapshotBanner}>
        <View style={[s.snapshotRow, isAr && s.snapshotRowRtl]}>
          <View style={s.snapshotAvatar}>
            <Text style={[s.snapshotAvatarText, { color: theme.primaryInk }]}>
              {userName ? userName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.snapshotName, { color: theme.primaryInk }, isAr && { textAlign: 'right' }]}>
              {userName || (isAr ? 'الطالب' : 'Student')}
            </Text>
            <Text style={[s.snapshotGrade, { color: withAlpha(theme.primaryInk, 0.7) }, isAr && { textAlign: 'right' }]}>
              {gradeName}
            </Text>
          </View>
          <View style={s.levelBadge}>
            <Text style={[s.levelNum, { color: theme.primaryInk }]}>{level}</Text>
            <Text style={[s.levelLbl, { color: withAlpha(theme.primaryInk, 0.65) }]}>{isAr ? 'مستوى' : 'LV'}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stats row — real data */}
      <View style={[s.statsRow, isAr && s.statsRowRtl]}>
        {[
          { icon: 'flame', val: String(streak), label: isAr ? 'سلسلة' : 'Streak', color: streak > 0 ? '#FF6B3D' : theme.muted },
          { icon: 'analytics-outline', val: history.length > 0 ? `${avgScore}%` : '—', label: isAr ? 'المتوسط' : 'Avg Score', color: theme.accent },
          { icon: 'star', val: String(totalXP), label: 'XP', color: theme.accent },
          { icon: 'trophy-outline', val: examHistory.length > 0 ? `${bestScore}%` : '—', label: isAr ? 'الأفضل' : 'Best', color: GREEN },
        ].map((st) => (
          <View key={st.label} style={[s.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name={st.icon as any} size={18} color={st.color} />
            <Text style={[s.statValue, { color: theme.text }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Activity — real data */}
      <Text style={[s.sectionTitle, { color: theme.muted }]}>
        {isAr ? 'آخر النشاطات' : 'RECENT ACTIVITY'}
      </Text>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {recentActivities.length === 0 ? (
          <View style={s.emptyWrap}>
            <Ionicons name="clipboard-outline" size={32} color={theme.muted} style={{ marginBottom: 8 }} />
            <Text style={[s.emptyText, { color: theme.muted }]}>
              {isAr ? 'لا توجد نشاطات بعد. شجّع طفلك على إكمال درس!' : 'No activity yet. Encourage your child to complete a lesson!'}
            </Text>
          </View>
        ) : (
          recentActivities.map((item, i) => {
            const pct = item.score;
            const grade = gradeLabel(pct);
            return (
              <View
                key={item.id}
                style={[
                  s.activityRow,
                  isAr && s.activityRowRtl,
                  i > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <View style={[s.activityIconWrap, { backgroundColor: withAlpha(gradeColor(pct, theme.accent), 0.13) }]}>
                  <Ionicons
                    name={item.type === 'exam' ? 'school-outline' : 'book-outline'}
                    size={16}
                    color={gradeColor(pct, theme.accent)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.activityTitle, { color: theme.text }, isAr && { textAlign: 'right' }]} numberOfLines={1}>
                    {isAr ? item.titleAr : item.titleEn}
                  </Text>
                  <Text style={[s.activityMeta, { color: theme.muted }]}>
                    {item.correct}/{item.total} · +{item.xpEarned} XP
                  </Text>
                </View>
                <View style={[s.gradeChip, { backgroundColor: withAlpha(gradeColor(pct, theme.accent), 0.13), borderColor: withAlpha(gradeColor(pct, theme.accent), 0.33) }]}>
                  <Text style={[s.gradeText, { color: gradeColor(pct, theme.accent) }]}>{grade}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Exam history summary */}
      {examHistory.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { color: theme.muted }]}>
            {isAr ? 'نتائج الاختبارات' : 'EXAM RESULTS'}
          </Text>
          <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {examHistory.slice(0, 3).map((item, i) => (
              <View
                key={item.id}
                style={[
                  s.examRow,
                  isAr && s.examRowRtl,
                  i > 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                ]}
              >
                <View style={[s.examScore, { backgroundColor: gradeColor(item.score, theme.accent) }]}>
                  <Text style={s.examScoreText}>{gradeLabel(item.score)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.examTitle, { color: theme.text }, isAr && { textAlign: 'right' }]} numberOfLines={1}>
                    {isAr ? item.titleAr : item.titleEn}
                  </Text>
                  <Text style={[s.examMeta, { color: theme.muted }]}>{item.score}% · {item.correct}/{item.total}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Encouragement tip for parent */}
      <View style={[s.tipCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.27) }]}>
        <Ionicons name="heart-outline" size={20} color={theme.accent} style={{ marginBottom: 6 }} />
        <Text style={[s.tipText, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
          {isAr
            ? 'شجّع طفلك على التعلم 15 دقيقة يومياً. الثبات أهم من الجلسات الطويلة!'
            : 'Encourage your child to study 15 min daily. Consistency beats long cramming sessions!'}
        </Text>
      </View>

      {/* Share CTA */}
      <TouchableOpacity activeOpacity={0.9} onPress={handleShare}>
        <LinearGradient colors={theme.primary} style={s.cta}>
          <Ionicons name="share-outline" size={18} color={theme.primaryInk} />
          <Text style={[s.ctaText, { color: theme.primaryInk }]}>{isAr ? 'مشاركة تقرير التقدم' : 'Share Progress Report'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  headerRowRtl: { flexDirection: 'row-reverse' },
  title: { fontSize: 32, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sub: { fontSize: 13, fontFamily: 'Amiri_400Regular', marginTop: 3 },
  shareBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  snapshotBanner: { borderRadius: 20, padding: 18, marginBottom: 16 },
  snapshotRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  snapshotRowRtl: { flexDirection: 'row-reverse' },
  snapshotAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  snapshotAvatarText: { color: '#1B1D30', fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  snapshotName: { color: '#1B1D30', fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  snapshotGrade: { color: 'rgba(27,29,48,0.7)', fontSize: 13, fontFamily: 'Amiri_400Regular', marginTop: 2 },
  levelBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
  levelNum: { color: '#1B1D30', fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  levelLbl: { color: 'rgba(27,29,48,0.65)', fontSize: 10, fontFamily: 'Amiri_400Regular' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statsRowRtl: { flexDirection: 'row-reverse' },
  stat: { flex: 1, borderRadius: 14, borderWidth: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Amiri_400Regular', letterSpacing: 0.3 },

  sectionTitle: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.7, marginBottom: 10 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },

  emptyWrap: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22 },

  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  activityRowRtl: { flexDirection: 'row-reverse' },
  activityIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  activityMeta: { fontSize: 11, fontFamily: 'Amiri_400Regular' },
  gradeChip: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  examRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  examRowRtl: { flexDirection: 'row-reverse' },
  examScore: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  examScoreText: { color: WHITE, fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  examTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  examMeta: { fontSize: 11, fontFamily: 'Amiri_400Regular' },

  tipCard: { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 20 },
  tipText: { fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 22, textAlign: 'center' },

  cta: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: '#1B1D30', fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
