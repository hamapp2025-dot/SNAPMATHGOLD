import React, { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PremiumAccessScreen from '../../components/PremiumAccessScreen';
import { EXAM_BLUEPRINTS, type ExamBlueprint } from '../../src/data/exams';
import { useSubscription } from '../../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../../src/subscriptions/subscriptionAccess';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useScoreHistory } from '../../src/hooks/useScoreHistory';
import { withAlpha } from '../../src/theme/colorUtils';

const DIFF_COLOR = { easy: '#30D158', medium: '#FF9F0A', hard: '#FF453A' };
const DIFF_LABEL = { easy: { en: 'Easy', ar: 'سهل' }, medium: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } };

function DiffBadge({ diff, isAr }: { diff: ExamBlueprint['difficulty']; isAr: boolean }) {
  return (
    <View style={[db.badge, isAr && db.badgeRtl, { backgroundColor: DIFF_COLOR[diff] + '22', borderColor: DIFF_COLOR[diff] + '55' }]}>
      <View style={[db.dot, { backgroundColor: DIFF_COLOR[diff] }]} />
      <Text style={[db.text, { color: DIFF_COLOR[diff] }]}>{isAr ? DIFF_LABEL[diff].ar : DIFF_LABEL[diff].en}</Text>
    </View>
  );
}
const db = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRtl: { flexDirection: 'row-reverse' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});

function ExamCard({ exam, isAr, onPress }: { exam: ExamBlueprint; isAr: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useAppTheme();
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  const featuredMetaColor = withAlpha(theme.primaryInk, 0.76);
  const featuredChipBg = withAlpha(theme.primaryInk, 0.18);

  if (exam.featured) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <LinearGradient colors={theme.primary} style={fe.card}>
            <View style={[fe.topRow, isAr && { flexDirection: 'row-reverse' }]}>
              <View style={[fe.iconWrap, { backgroundColor: featuredChipBg }]}>
                <Ionicons name={exam.icon as any} size={22} color={theme.primaryInk} />
              </View>
              <View style={[fe.featBadge, { backgroundColor: featuredChipBg }]}>
                <Text style={[fe.featText, { color: theme.primaryInk }]}>{isAr ? 'مميز' : 'FEATURED'}</Text>
              </View>
            </View>
            <Text style={[fe.title, { color: theme.primaryInk }, isAr && { textAlign: 'right' }]}>{isAr ? exam.titleAr : exam.titleEn}</Text>
            <Text style={[fe.desc, { color: featuredMetaColor }, isAr && { textAlign: 'right' }]}>{isAr ? exam.descAr : exam.descEn}</Text>
            <View style={[fe.metaRow, isAr && { flexDirection: 'row-reverse' }]}>
              <View style={[fe.metaItem, isAr && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="help-circle-outline" size={14} color={featuredMetaColor} />
                <Text style={[fe.metaText, { color: featuredMetaColor }]}>{exam.questions} {isAr ? 'سؤال' : 'questions'}</Text>
              </View>
              <View style={[fe.metaItem, isAr && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="timer-outline" size={14} color={featuredMetaColor} />
                <Text style={[fe.metaText, { color: featuredMetaColor }]}>{exam.minutes} {isAr ? 'دقيقة' : 'min'}</Text>
              </View>
            </View>
            <View style={[fe.startBtn, { backgroundColor: featuredChipBg }, isAr && fe.startBtnRtl]}>
              <Text style={[fe.startText, { color: theme.primaryInk }]}>{isAr ? 'ابدأ الاختبار' : 'Start Exam'}</Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={16} color={theme.primaryInk} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[ec.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}>
        <View style={[ec.topRow, isAr && { flexDirection: 'row-reverse' }]}>
          <View style={[ec.iconCircle, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
            <Ionicons name={exam.icon as any} size={18} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ec.title, { color: theme.text }, isAr && { textAlign: 'right' }]} numberOfLines={2}>{isAr ? exam.titleAr : exam.titleEn}</Text>
            <Text style={[ec.desc, { color: theme.muted }, isAr && { textAlign: 'right' }]} numberOfLines={2}>{isAr ? exam.descAr : exam.descEn}</Text>
          </View>
        </View>
        <View style={[ec.bottomRow, isAr && { flexDirection: 'row-reverse' }]}>
          <DiffBadge diff={exam.difficulty} isAr={isAr} />
          <View style={{ flex: 1 }} />
          <View style={[ec.meta, isAr && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="help-circle-outline" size={12} color={theme.muted} />
            <Text style={[ec.metaText, { color: theme.muted }]}>{exam.questions}</Text>
          </View>
          <View style={[ec.meta, isAr && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="timer-outline" size={12} color={theme.muted} />
            <Text style={[ec.metaText, { color: theme.muted }]}>{exam.minutes}m</Text>
          </View>
          <View style={[ec.arrowWrap, isAr && ec.arrowWrapRtl]}>
            <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.accent} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const fe = StyleSheet.create({
  card: { borderRadius: 22, padding: 20, marginBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  featBadge: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  featText: { color: '#1B1D30', fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: 'Amiri_700Bold' },
  title: { color: '#1B1D30', fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 6 },
  desc: { color: 'rgba(27,29,48,0.75)', fontSize: 13, fontFamily: 'Amiri_400Regular', lineHeight: 20, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: 'rgba(27,29,48,0.7)', fontSize: 13, fontFamily: 'Amiri_400Regular' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 14, paddingVertical: 12, gap: 8 },
  startBtnRtl: { flexDirection: 'row-reverse' },
  startText: { color: '#1B1D30', fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});

const ec = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#353D63', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 3 },
  desc: { fontSize: 13, fontFamily: 'Amiri_400Regular', lineHeight: 18 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: '#8B95BC', fontSize: 12, fontFamily: 'Amiri_400Regular' },
  arrowWrap: { marginLeft: 4 },
  arrowWrapRtl: { marginLeft: 0, marginRight: 4 },
});

export default function ExamsScreen() {
  const { currentTier } = useSubscription();

  if (!canAccessFeature(currentTier, 'grade12Path')) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return <ExamsContent />;
}

function ExamsContent() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { examHistory, bestScore } = useScoreHistory();
  const recentScore = examHistory.length > 0 ? examHistory[0].score : null;
  const availableExams = EXAM_BLUEPRINTS.filter((exam) => exam.questions > 0);

  return (
    <ScrollView style={[s.container, { backgroundColor: theme.bg }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.headerRow, isAr && { flexDirection: 'row-reverse' }]}>
        <View style={isAr ? s.headerTextWrapRtl : undefined}>
          <Text style={[s.title, isAr && s.textRtl, { color: theme.text }]}>{isAr ? 'الاختبارات' : 'Exams'}</Text>
          <Text style={[s.sub, isAr && s.textRtl, { color: theme.muted }]}>
            {isAr ? 'اختبارات مبنية على بنك أسئلة الصف 12 الحالي' : 'Simulators built from the live Grade 12 question bank'}
          </Text>
        </View>
        {recentScore !== null && (
          <View style={[s.lastScore, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.lastScoreLabel, { color: theme.muted }]}>{isAr ? 'آخر نتيجة' : 'Last Score'}</Text>
            <Text style={[s.lastScoreNum, { color: theme.accent }]}>{recentScore}%</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={[s.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && { flexDirection: 'row-reverse' }]}>
        {[
          { icon: 'trophy-outline', val: String(examHistory.length), label: isAr ? 'مكتملة' : 'Completed' },
          { icon: 'layers-outline', val: String(availableExams.length), label: isAr ? 'متاحة الآن' : 'Available' },
          { icon: 'star-outline', val: examHistory.length > 0 ? `${bestScore}%` : '—', label: isAr ? 'أفضل نتيجة' : 'Best Score' },
        ].map((st) => (
          <View key={st.label} style={s.statItem}>
            <Ionicons name={st.icon as any} size={18} color={theme.accent} />
            <Text style={[s.statVal, { color: theme.text }]}>{st.val}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Exam list */}
      {availableExams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          isAr={isAr}
          onPress={() => router.push({ pathname: '/exam', params: { examId: exam.id } })}
        />
      ))}

      {/* Tip card */}
      <View style={[s.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.tipRow, isAr && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="bulb-outline" size={20} color={theme.accent} />
          <Text style={[s.tipTitle, { color: theme.text }]}>{isAr ? 'نصيحة للامتحان' : 'Exam Tip'}</Text>
        </View>
        <Text style={[s.tipBody, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
          {isAr
            ? 'ابدأ بالجولات القصيرة أولاً، ثم انتقل للمحاكاة المختلطة. هذه الصفحة تعرض فقط عدد الأسئلة المتوفرة فعلاً في البنك الحالي.'
            : 'Start with short drills first, then move to mixed simulators. This page now shows only the question counts that actually exist in the current bank.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  headerTextWrapRtl: { alignItems: 'flex-end' },
  title: { fontSize: 34, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sub: { fontSize: 14, marginTop: 3, fontFamily: 'Amiri_400Regular' },
  lastScore: { borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', minWidth: 70 },
  lastScoreLabel: { fontSize: 10, fontFamily: 'Amiri_400Regular', letterSpacing: 0.5 },
  lastScoreNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Amiri_400Regular', textAlign: 'center' },
  tipCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  tipBody: { fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 22 },
  textRtl: { textAlign: 'right' },
});
