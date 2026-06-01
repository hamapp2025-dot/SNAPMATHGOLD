import React, { useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';

const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';

// ─── Animated star ────────────────────────────────────────────────────────────
function Star({ filled, onPress }: { filled: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={press} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={filled ? 'star' : 'star-outline'} size={44} color={filled ? theme.accent : '#AEB4CB'} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Related topic card ───────────────────────────────────────────────────────
function HelpCard({
  color,
  titleEn,
  titleAr,
  wordsEn,
  wordsAr,
  isAr,
}: {
  color: string;
  titleEn: string;
  titleAr: string;
  wordsEn: string[];
  wordsAr: string[];
  isAr: boolean;
}) {
  return (
    <View style={[s.helpCard, { backgroundColor: color }]}>
      <Text style={[s.helpTitle, isAr && { textAlign: 'right' }]}>{isAr ? titleAr : titleEn}</Text>
      {(isAr ? wordsAr : wordsEn).map((w) => (
        <Text key={w} style={[s.helpWord, isAr && { textAlign: 'right' }]}>
          {w}
        </Text>
      ))}
      <View style={s.playCircle}>
        <Ionicons name="play" size={18} color="#222844" />
      </View>
    </View>
  );
}

type HelpTopic = {
  color: string;
  titleEn: string;
  titleAr: string;
  wordsEn: string[];
  wordsAr: string[];
};

const DEFAULT_HELP_TOPICS: HelpTopic[] = [
  {
    color: '#0A7AFF',
    titleEn: 'Core Skills',
    titleAr: 'مهارات أساسية',
    wordsEn: ['Key idea', 'Worked example'],
    wordsAr: ['الفكرة الأساسية', 'مثال محلول'],
  },
  {
    color: '#4F6DFF',
    titleEn: 'Extra Practice',
    titleAr: 'تدريب إضافي',
    wordsEn: ['Short review', 'Practice again'],
    wordsAr: ['مراجعة سريعة', 'أعد التمرين'],
  },
];

const HELP_TOPICS_BY_UNIT: Record<string, HelpTopic[]> = {
  u1: [
    {
      color: '#0A7AFF',
      titleEn: 'Functions',
      titleAr: 'الدوال',
      wordsEn: ['Remainder theorem', 'Factor theorem'],
      wordsAr: ['نظرية الباقي', 'نظرية العامل'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Algebra Skills',
      titleAr: 'مهارات الجبر',
      wordsEn: ['Partial fractions', 'Rational expressions'],
      wordsAr: ['الكسور الجزئية', 'التعابير النسبية'],
    },
  ],
  u2: [
    {
      color: '#0A7AFF',
      titleEn: 'Trig Identities',
      titleAr: 'المتطابقات المثلثية',
      wordsEn: ['Double angle', 'Sum formulas'],
      wordsAr: ['ضعف الزاوية', 'صيغ المجموع'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Trig Equations',
      titleAr: 'المعادلات المثلثية',
      wordsEn: ['Reference angles', 'General solutions'],
      wordsAr: ['الزوايا المرجعية', 'الحلول العامة'],
    },
  ],
  u3: [
    {
      color: '#0A7AFF',
      titleEn: 'Differentiation Rules',
      titleAr: 'قواعد التفاضل',
      wordsEn: ['Product rule', 'Quotient rule'],
      wordsAr: ['قاعدة الضرب', 'قاعدة القسمة'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Advanced Derivatives',
      titleAr: 'تفاضل متقدم',
      wordsEn: ['Chain rule', 'Implicit differentiation'],
      wordsAr: ['قاعدة السلسلة', 'التفاضل الضمني'],
    },
  ],
  u4: [
    {
      color: '#0A7AFF',
      titleEn: 'Complex Numbers',
      titleAr: 'الأعداد المركبة',
      wordsEn: ['Modulus', 'Conjugate'],
      wordsAr: ['المعيار', 'المرافق'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Argand Geometry',
      titleAr: 'الهندسة على مستوى أرجاند',
      wordsEn: ['Circle', 'Line'],
      wordsAr: ['الدائرة', 'المستقيم'],
    },
  ],
  u5: [
    {
      color: '#0A7AFF',
      titleEn: 'Integration Basics',
      titleAr: 'أساسيات التكامل',
      wordsEn: ['Substitution', 'Integration by parts'],
      wordsAr: ['التعويض', 'التكامل بالتجزئة'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Applications',
      titleAr: 'تطبيقات التكامل',
      wordsEn: ['Area under curve', 'Volume of revolution'],
      wordsAr: ['المساحة تحت المنحنى', 'حجم الدوران'],
    },
  ],
  u6: [
    {
      color: '#0A7AFF',
      titleEn: 'Vector Basics',
      titleAr: 'أساسيات المتجهات',
      wordsEn: ['Magnitude', 'Unit vector'],
      wordsAr: ['المقدار', 'متجه الوحدة'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Vector Applications',
      titleAr: 'تطبيقات المتجهات',
      wordsEn: ['Dot product', 'Angle between vectors'],
      wordsAr: ['الجداء النقطي', 'الزاوية بين المتجهات'],
    },
  ],
  u7: [
    {
      color: '#0A7AFF',
      titleEn: 'Probability',
      titleAr: 'الاحتمالات',
      wordsEn: ['Binomial distribution', 'Geometric distribution'],
      wordsAr: ['توزيع ذي الحدين', 'التوزيع الهندسي'],
    },
    {
      color: '#4F6DFF',
      titleEn: 'Statistics',
      titleAr: 'الإحصاء',
      wordsEn: ['Normal distribution', 'Z-score'],
      wordsAr: ['التوزيع الطبيعي', 'درجة Z'],
    },
  ],
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LessonFeedbackScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr, t } = useT();
  const params = useLocalSearchParams<{ lessonId?: string; lessonTitle?: string; lessonTitleAr?: string; unitId?: string }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const lessonName = isAr ? (params.lessonTitleAr ?? params.lessonTitle) : (params.lessonTitle ?? params.lessonTitleAr);
  const helpTopics = HELP_TOPICS_BY_UNIT[params.unitId ?? ''] ?? DEFAULT_HELP_TOPICS;

  // Animated checkmark on submit
  const checkScale = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    const entry = {
      lessonId: params.lessonId ?? null,
      unitId: params.unitId ?? null,
      lessonTitle: params.lessonTitle ?? 'Unknown',
      lessonTitleAr: params.lessonTitleAr ?? params.lessonTitle ?? 'غير معروف',
      rating,
      comment,
      date: new Date().toISOString(),
    };

    try {
      const existing = await AsyncStorage.getItem('@snapmath_feedback');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(entry);
      await AsyncStorage.setItem('@snapmath_feedback', JSON.stringify(list.slice(0, 50)));
    } catch (_) {}

    setSubmitted(true);
    Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 16 }).start(() => {
      setTimeout(() => router.replace('/(tabs)'), 900);
    });
  };

  // ── Submitted overlay ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Animated.View style={[s.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <LinearGradient colors={theme.primary} style={s.checkGrad}>
            <Ionicons name="checkmark" size={48} color={theme.primaryInk} />
          </LinearGradient>
        </Animated.View>
        <Text style={[s.thanksTitle, { color: theme.text }]}>
          {isAr ? 'شكراً لك!' : 'Thanks for your feedback!'}
        </Text>
        <Text style={[s.thanksSub, { color: theme.muted }]}>
          {isAr ? 'يساعدنا تقييمك على التحسين المستمر.' : 'Your rating helps us improve every lesson.'}
        </Text>
      </View>
    );
  }

  const ratingLabel =
    rating === 0
      ? ''
      : rating === 1
      ? isAr ? 'ضعيف جداً' : 'Very Poor'
      : rating === 2
      ? isAr ? 'ضعيف' : 'Poor'
      : rating === 3
      ? isAr ? 'جيد' : 'Good'
      : rating === 4
      ? isAr ? 'جيد جداً' : 'Very Good'
      : isAr ? 'ممتاز!' : 'Excellent!';

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <TouchableOpacity onPress={() => router.back()} style={[s.backRow, isAr && s.rowRtl]}>
        <Ionicons name={isAr ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.muted} />
        <Text style={[s.backText, { color: theme.muted }]}>{isAr ? 'رجوع' : 'Back'}</Text>
      </TouchableOpacity>

      {/* Star Rating */}
      <View style={s.ratingSection}>
        <Text style={[s.title, { color: theme.text }, isAr && s.textRtl]}>
          {isAr ? 'ما مدى فائدة هذا الدرس؟' : 'How helpful was this lesson?'}
        </Text>
        {lessonName ? (
          <Text style={[s.lessonName, { color: theme.accent }, isAr && s.textRtl]} numberOfLines={1}>
            {lessonName}
          </Text>
        ) : null}

        <View style={[s.starRow, isAr && { flexDirection: 'row-reverse' }]}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} filled={i <= rating} onPress={() => setRating(i)} />
          ))}
        </View>

        {ratingLabel ? (
          <Text style={[s.ratingLabel, { color: theme.accent }]}>{ratingLabel}</Text>
        ) : (
          <Text style={[s.ratingLabel, { color: theme.muted }]}>
            {isAr ? 'اضغط على نجمة للتقييم' : 'Tap a star to rate'}
          </Text>
        )}
      </View>

      {/* Written feedback */}
      <Text style={[s.title, { color: theme.text, marginBottom: 10 }, isAr && s.textRtl]}>
        {isAr ? 'تعليقاتك (اختياري)' : 'Your comments (optional)'}
      </Text>
      <TextInput
        multiline
        value={comment}
        onChangeText={setComment}
        placeholder={isAr ? 'أخبرنا برأيك...' : 'Let us know what you thought…'}
        placeholderTextColor={theme.muted}
        style={[
          s.feedbackInput,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          isAr && { textAlign: 'right' },
        ]}
      />

      {/* Submit CTA */}
      <TouchableOpacity onPress={handleSubmit} activeOpacity={0.9} style={s.ctaWrap} disabled={rating === 0}>
        <LinearGradient colors={theme.primary} style={[s.cta, rating === 0 && s.ctaDisabled]}>
          <Text style={[s.ctaText, { color: theme.primaryInk }]}>{isAr ? 'إرسال التقييم' : 'Submit Rating'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={s.skipBtn}>
        <Text style={[s.skipText, { color: theme.muted }]}>{t('skip')}</Text>
      </TouchableOpacity>

      {/* Related topics */}
      <Text style={[s.title, { color: theme.text, marginTop: 28 }, isAr && s.textRtl]}>
        {isAr ? 'مساعدة إضافية في هذه المواضيع' : 'More Help on These Topics'}
      </Text>
      <View style={[s.helpRow, isAr && { flexDirection: 'row-reverse' }]}>
        {helpTopics.map((topic) => (
          <HelpCard
            key={`${topic.titleEn}-${topic.titleAr}`}
            color={topic.color}
            titleEn={topic.titleEn}
            titleAr={topic.titleAr}
            wordsEn={topic.wordsEn}
            wordsAr={topic.wordsAr}
            isAr={isAr}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 50 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  rowRtl: { flexDirection: 'row-reverse' },
  backText: { fontSize: 14, fontFamily: 'Amiri_400Regular' },

  ratingSection: { alignItems: 'center', marginBottom: 30 },
  title: { color: WHITE, fontSize: 18, fontWeight: '700', marginBottom: 12, fontFamily: 'Amiri_700Bold' },
  lessonName: { fontSize: 13, fontFamily: 'Amiri_400Regular', marginTop: -6, marginBottom: 18 },
  textRtl: { textAlign: 'right', width: '100%' },

  starRow: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  ratingLabel: { fontSize: 14, fontFamily: 'Amiri_700Bold', marginTop: 4, height: 20 },

  feedbackInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    padding: 14,
    textAlignVertical: 'top',
    marginBottom: 18,
    fontFamily: 'Amiri_400Regular',
  },

  ctaWrap: { borderRadius: 27, overflow: 'hidden', marginBottom: 12 },
  cta: { height: 54, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: WHITE, fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  skipBtn: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  skipText: { fontSize: 14, fontFamily: 'Amiri_400Regular' },

  helpRow: { flexDirection: 'row', gap: 10, marginBottom: 22, marginTop: 4 },
  helpCard: { flex: 1, borderRadius: 16, padding: 12, minHeight: 165 },
  helpTitle: { color: WHITE, fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  helpWord: { color: WHITE, fontSize: 13, marginTop: 6, textDecorationLine: 'underline', fontFamily: 'Amiri_400Regular' },
  playCircle: {
    marginTop: 10, width: 38, height: 38, borderRadius: 19,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end',
  },

  // Submitted state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 24 },
  checkGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thanksTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 10, textAlign: 'center' },
  thanksSub: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22 },
});
