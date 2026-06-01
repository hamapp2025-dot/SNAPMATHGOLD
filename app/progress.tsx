import React, { useMemo } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useScoreHistory, ScoreEntry } from '../src/hooks/useScoreHistory';
import { useXP } from '../src/hooks/useXP';
import { ALL_UNITS } from '../src/data/grade12';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { withAlpha } from '../src/theme/colorUtils';
import { buildCompletedLessonIdSet, countCompletedLessonsInUnit } from '../src/utils/lessonProgress';

const MUTED = '#B8BED6';
const GREEN = '#2ED573';
const RED = '#FF3B30';

function scoreColor(n: number, accent: string) {
  if (n >= 80) return GREEN;
  if (n >= 60) return accent;
  return RED;
}

function gradeLabel(n: number) {
  if (n >= 90) return 'A';
  if (n >= 75) return 'B';
  if (n >= 60) return 'C';
  if (n >= 50) return 'D';
  return 'F';
}

function formatDate(iso: string, isAr: boolean) {
  const d = new Date(iso);
  return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
}

function formatEntryMeta(entry: ScoreEntry, isAr: boolean) {
  const date = formatDate(entry.date, isAr);
  return isAr
    ? `${entry.correct}/${entry.total} صحيحة · ${date} · +${entry.xpEarned} XP`
    : `${entry.correct}/${entry.total} correct · ${date} · +${entry.xpEarned} XP`;
}

function ScoreRow({ entry, isAr, theme }: { entry: ScoreEntry; isAr: boolean; theme: any }) {
  const pct = entry.score;
  return (
    <View style={[r.row, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && r.rowRtl]}>
      <View style={[r.typeIcon, { backgroundColor: pct >= 75 ? 'rgba(46,213,115,0.15)' : withAlpha(theme.accent, 0.12) }]}>
        <Ionicons
          name={entry.type === 'exam' ? 'school-outline' : entry.type === 'lesson' ? 'book-outline' : 'checkmark-circle-outline'}
          size={18}
          color={pct >= 75 ? GREEN : theme.accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            r.title,
            { color: theme.text },
            isAr ? r.textRtlFlow : r.textLtrFlow,
            isAr && r.textRtl,
          ]}
          numberOfLines={1}>
          {stabilizeMixedMathText(isAr ? entry.titleAr : entry.titleEn, isAr)}
        </Text>
        <Text
          style={[
            r.sub,
            { color: theme.muted },
            isAr ? r.textRtlFlow : r.textLtrFlow,
            isAr && r.textRtl,
          ]}>
          {stabilizeMixedMathText(formatEntryMeta(entry, isAr), isAr)}
        </Text>
      </View>
      <View style={[r.grade, { backgroundColor: withAlpha(scoreColor(pct, theme.accent), 0.13), borderColor: withAlpha(scoreColor(pct, theme.accent), 0.33) }]}>
        <Text style={[r.gradeText, { color: scoreColor(pct, theme.accent) }]}>{gradeLabel(pct)}</Text>
      </View>
    </View>
  );
}

const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8 },
  rowRtl: { flexDirection: 'row-reverse' },
  typeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  sub: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  grade: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});

export default function ProgressScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { history, bestScore, avgScore, examHistory, lessonHistory, clearHistory } = useScoreHistory();
  const { totalXP, level, xpProgress } = useXP();

  const handleClearHistory = () => {
    Alert.alert(
      isAr ? 'مسح سجل التقدم؟' : 'Clear progress history?',
      isAr
        ? 'سيتم حذف نتائج الاختبارات وإكمال الدروس المحفوظة على هذا الجهاز. لا يمكن التراجع عن هذا الإجراء.'
        : 'This removes saved exam results and lesson completions on this device. This action cannot be undone.',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'مسح' : 'Clear',
          style: 'destructive',
          onPress: () => void clearHistory(),
        },
      ],
    );
  };

  // Unit completion data — based on lessons that appear in history
  const unitProgress = useMemo(() => {
    const completedLessonIds = buildCompletedLessonIdSet(history);
    return ALL_UNITS.map((u) => {
      const done = countCompletedLessonsInUnit(completedLessonIds, u);
      return {
        id: u.id,
        titleEn: u.titleEn.replace(/^Unit \d+ · /, ''),
        titleAr: u.titleAr.replace(/^الوحدة \d+ · /, ''),
        done,
        total: u.lessons.length,
        pct: u.lessons.length ? Math.round((done / u.lessons.length) * 100) : 0,
      };
    });
  }, [history]);
  const xpProgressPct = Math.round(xpProgress * 100);
  const bannerStats = [
    { icon: 'star', val: `${totalXP} XP`, label: isAr ? 'مجموع النقاط' : 'Total XP' },
    { icon: 'ribbon', val: isAr ? String(level) : `Lv ${level}`, label: isAr ? 'المستوى' : 'Level' },
    { icon: 'trophy', val: `${bestScore}%`, label: isAr ? 'أفضل نتيجة' : 'Best Score' },
    { icon: 'analytics', val: `${avgScore}%`, label: isAr ? 'المتوسط' : 'Avg Score' },
  ];
  const xpProgressLabel = isAr ? `${xpProgressPct}% نحو المستوى التالي` : `${xpProgressPct}% to next level`;

  return (
    <ScrollView style={[s.root, { backgroundColor: theme.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.header, isAr && s.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.iconBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>{isAr ? 'تقدمي' : 'My Progress'}</Text>
        <TouchableOpacity onPress={handleClearHistory} style={[s.iconBtn, { backgroundColor: theme.surface }]} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={theme.muted} />
        </TouchableOpacity>
      </View>

      {/* Top stats banner */}
      <LinearGradient colors={theme.primary} style={s.banner}>
        <View style={[s.bannerGrid, isAr && s.bannerGridRtl]}>
          {bannerStats.map((st) => (
            <View key={st.label} style={s.bannerStat}>
              <Ionicons name={st.icon as any} size={18} color={theme.primaryInk} />
              <Text
                style={[
                  s.bannerVal,
                  { color: theme.primaryInk },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                ]}>
                {stabilizeMixedMathText(st.val, isAr)}
              </Text>
              <Text
                style={[
                  s.bannerLabel,
                  { color: withAlpha(theme.primaryInk, 0.7) },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                ]}>
                {stabilizeMixedMathText(st.label, isAr)}
              </Text>
            </View>
          ))}
        </View>
        {/* XP progress bar */}
        <View style={[s.xpTrack, { backgroundColor: withAlpha(theme.primaryInk, 0.18) }]}>
          <View style={[s.xpFill, { width: `${xpProgressPct}%`, backgroundColor: withAlpha(theme.primaryInk, 0.88) }]} />
        </View>
        <Text
          style={[
            s.xpLabel,
            { color: withAlpha(theme.primaryInk, 0.74) },
            isAr ? s.textRtlFlow : s.textLtrFlow,
          ]}>
          {stabilizeMixedMathText(xpProgressLabel, isAr)}
        </Text>
      </LinearGradient>

      {/* Unit completion */}
      <Text style={[s.sectionTitle, { color: theme.muted }, isAr && s.sectionTitleRtl]}>{isAr ? 'إتمام الوحدات' : 'UNIT COMPLETION'}</Text>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {unitProgress.map((u, i) => (
          <View key={u.id} style={[s.unitRow, isAr && s.unitRowRtl, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Text
              style={[
                s.unitName,
                { color: theme.text, flex: 1 },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && s.textRtl,
              ]}
              numberOfLines={1}>
              {stabilizeMixedMathText(isAr ? u.titleAr : u.titleEn, isAr)}
            </Text>
            <View style={s.unitBarWrap}>
              <View style={[s.unitBarTrack, { backgroundColor: theme.surfaceSoft }]}>
                <View style={[s.unitBarFill, { width: `${u.pct}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text
                style={[
                  s.unitPct,
                  { color: u.pct > 0 ? theme.accent : theme.muted },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                ]}>
                {stabilizeMixedMathText(`${u.pct}%`, isAr)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Score history */}
      <Text style={[s.sectionTitle, { color: theme.muted }, isAr && s.sectionTitleRtl]}>{isAr ? 'سجل الاختبارات' : 'SCORE HISTORY'}</Text>
      {history.length === 0 ? (
        <View style={[s.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="document-outline" size={36} color={theme.muted} style={{ marginBottom: 8 }} />
          <Text
            style={[
              s.emptyText,
              { color: theme.muted },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {stabilizeMixedMathText(
              isAr ? 'لا توجد نتائج بعد. أكمل درساً أو اختباراً!' : 'No results yet. Complete a lesson or exam!',
              isAr,
            )}
          </Text>
        </View>
      ) : (
        <>
          {history.map((entry) => (
            <ScoreRow key={entry.id} entry={entry} isAr={isAr} theme={theme} />
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 14,
  },
  headerRtl: { flexDirection: 'row-reverse' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  banner: { borderRadius: 22, padding: 18, marginBottom: 20 },
  bannerGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  bannerGridRtl: { flexDirection: 'row-reverse' },
  bannerStat: { alignItems: 'center', gap: 3 },
  bannerVal: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  bannerLabel: { fontSize: 11, fontFamily: 'Amiri_400Regular' },
  xpTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)', overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: 6, borderRadius: 3, backgroundColor: 'rgba(27,29,48,0.5)' },
  xpLabel: { color: 'rgba(27,29,48,0.65)', fontSize: 12, fontFamily: 'Amiri_400Regular', textAlign: 'center' },

  sectionTitle: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },
  sectionTitleRtl: { textAlign: 'right', letterSpacing: 0 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  unitRowRtl: { flexDirection: 'row-reverse' },
  unitName: { fontSize: 13, fontFamily: 'Amiri_400Regular' },
  unitBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  unitBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  unitBarFill: { height: 6, borderRadius: 3 },
  unitPct: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', width: 32, textAlign: 'right' },

  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
