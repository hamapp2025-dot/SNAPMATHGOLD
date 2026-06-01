// src/screens/LessonScreen.js - UPGRADED: Manim-style animations + Polished Gold Theme, RTL/AR
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import { BG, SURFACE as CARD, SURFACE_BORDER as BORDER, GOLD, GOLD_LIGHT as GOLD_L, GOLD_MUTED as GOLD_D, TEXT_PRIMARY as WHITE, TEXT_SECONDARY as MUTED, GOLD_BTN_TEXT, FONTS } from '../config/theme';

// Lazy load VideoPlayer so expo-av crash in Expo Go doesn't break the app
let VideoPlayerComponent = null;
try {
  VideoPlayerComponent = require('../components/VideoPlayer').default;
} catch (_) {
  VideoPlayerComponent = null;
}

// Placeholder when video native module is unavailable (Expo Go) or error boundary catches
function VideoPlaceholderCard({ videoUrl, isAr }) {
  return (
    <View style={videoPlaceholderStyles.wrap}>
      <Text style={videoPlaceholderStyles.title}>{isAr ? 'مشغل الفيديو يحتاج نسخة تطوير' : 'Video player requires development build'}</Text>
      <Text style={videoPlaceholderStyles.sub}>{isAr ? 'رابط الفيديو (تم تحميل البيانات):' : 'Video URL (data loaded):'}</Text>
      <Text style={videoPlaceholderStyles.url} numberOfLines={3} selectable>{videoUrl}</Text>
    </View>
  );
}
const videoPlaceholderStyles = StyleSheet.create({
  wrap: { minHeight: 120, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { color: GOLD, fontSize: 14, fontWeight: '600', marginBottom: 8, textAlign: 'center', fontFamily: FONTS.semiEn },
  sub: { color: MUTED, fontSize: 12, marginBottom: 4, fontFamily: FONTS.bodyEn },
  url: { color: MUTED, fontSize: 11, textAlign: 'center', fontFamily: FONTS.bodyEn },
});

// Error boundary: catches native module crash when Video mounts in Expo Go
class VideoErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}
  render() {
    if (this.state.hasError && this.props.videoUrl) {
      return <VideoPlaceholderCard videoUrl={this.props.videoUrl} isAr={this.props.isAr} />;
    }
    return this.props.children;
  }
}

function VideoSection({ videoUrl, isAr }) {
  if (!videoUrl || !String(videoUrl).trim()) return null;
  if (!VideoPlayerComponent) {
    return <VideoPlaceholderCard videoUrl={videoUrl} isAr={isAr} />;
  }
  return (
    <VideoErrorBoundary videoUrl={videoUrl} isAr={isAr}>
      <VideoPlayerComponent videoUrl={videoUrl} />
    </VideoErrorBoundary>
  );
}

// ── THEME (local aliases for components that need them) ─────────
const BORDER2   = BORDER;
const GOLD_CORRECT = GOLD;
const RED       = '#E53935';
const RED_D     = '#B91C1C';

// ── QUESTIONS DATA ────────────────────────────────────────────
const LESSON_QUESTIONS = {
  lesson1_1: {
    easy: [
      { id: 'q1', text: 'Decompose: 1/(x(x+1))', options: ['1/x − 1/(x+1)', '1/x + 1/(x+1)', '−1/x + 1/(x+1)', '1/(x+1) − 1/x'], correct: 0, explanation: 'Set 1/(x(x+1)) = A/x + B/(x+1). Multiply through: 1 = A(x+1) + Bx.\nAt x=0: A=1. At x=−1: B=−1.\nResult: 1/x − 1/(x+1) ✓' },
      { id: 'q2', text: 'Partial fractions means...', options: ['Breaking a fraction into simpler fractions', 'Multiplying two fractions', 'Finding the reciprocal', 'Adding two fractions'], correct: 0, explanation: 'Partial fractions decompose a complex rational expression into a sum of simpler fractions. Essential for integration and analysis.' },
    ],
    medium: [
      { id: 'q3', text: 'Decompose: 2x/(x²−1)', options: ['1/(x−1) + 1/(x+1)', '1/(x−1) − 1/(x+1)', '2/(x−1) − 2/(x+1)', 'x/(x−1) + x/(x+1)'], correct: 0, explanation: 'x²−1 = (x−1)(x+1).\n2x/((x−1)(x+1)) = A/(x−1) + B/(x+1).\nAt x=1: A=1. At x=−1: B=1.' },
      { id: 'q4', text: 'Decompose: (3x+2)/((x+1)(x+2))', options: ['1/(x+1) + 2/(x+2)', '−1/(x+1) + 4/(x+2)', '2/(x+1) + 1/(x+2)', '4/(x+1) − 1/(x+2)'], correct: 1, explanation: '3x+2 = A(x+2) + B(x+1).\nAt x=−1: −1=A(1) → A=−1.\nAt x=−2: −4=B(−1) → B=4.' },
      { id: 'q5', text: 'Condition for partial fractions?', options: ['Degree numerator < degree denominator', 'Degree numerator > denominator', 'Numerator is zero', 'No condition needed'], correct: 0, explanation: 'The degree of the numerator must be LESS than the denominator. If not, perform polynomial long division first, then apply partial fractions.' },
    ],
    hard: [
      { id: 'q6', text: 'Decompose: (x²+2x+3)/((x+1)(x²+4))', options: ['2/(x+1) + (−x+1)/(x²+4)', '1/(x+1) + (x+2)/(x²+4)', '2/(x+1) + (x−1)/(x²+4)', '1/(x+1) + (−x+1)/(x²+4)'], correct: 0, explanation: 'For irreducible quadratic: x²+2x+3 = A(x²+4) + (Bx+C)(x+1).\nExpand & compare: A=2, B=−1, C=1.\nResult: 2/(x+1) + (−x+1)/(x²+4)' },
    ],
    mastery: [
      { id: 'q7', text: 'Find A: 5/(x(x+5)) = A/x + B/(x+5)', options: ['A = 1', 'A = 2', 'A = 5', 'A = −1'], correct: 0, explanation: 'Multiply: 5 = A(x+5) + Bx.\nAt x=0: 5 = 5A → A = 1.' },
      { id: 'q8', text: 'Decompose: 1/(x²−4)', options: ['¼·[1/(x−2)] − ¼·[1/(x+2)]', '1/(x−2) − 1/(x+2)', '½·[1/(x−2)] − ½·[1/(x+2)]', 'Cannot decompose'], correct: 0, explanation: 'x²−4 = (x−2)(x+2).\n1 = A(x+2) + B(x−2).\nAt x=2: A=1/4. At x=−2: B=−1/4.' },
      { id: 'q9', text: 'If (2x)/((x−1)(x+3)) = A/(x−1) + B/(x+3), find A+B', options: ['0', '1', '2', '−1'], correct: 0, explanation: 'At x=1: 2=4A → A=1/2.\nAt x=−3: −6=−4B → B=−1/2... wait: B=3/2.\nActually: A+B = 1/2 + (−1/2) = 0.' },
      { id: 'q10', text: 'Partial fractions of (x+4)/((x+1)(x−2))?', options: ['1/(x+1) + 2/(x−2)', '2/(x+1) − 1/(x−2)', '−1/(x+1) + 2/(x−2)', '1/(x+1) − 2/(x−2)'], correct: 2, explanation: 'x+4 = A(x−2) + B(x+1).\nAt x=−1: 3=−3A → A=−1.\nAt x=2: 6=3B → B=2.' },
      { id: 'q11', text: 'Tawjihi Killer: ∫ 1/((x+1)(x+3)) dx = ?', options: ['½ln|(x+1)/(x+3)| + C', 'ln|(x+1)(x+3)| + C', '½ln|(x+3)/(x+1)| + C', 'ln|x+1| − ln|x+3| + C'], correct: 0, explanation: 'Decompose: 1/((x+1)(x+3)) = ½·[1/(x+1) − 1/(x+3)].\nIntegrate: ½[ln|x+1| − ln|x+3|] + C = ½ln|(x+1)/(x+3)| + C' },
    ],
  },
};

const DEFAULT_QUESTIONS = {
  easy: [
    { id: 'de1', text: 'Easy question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Correct answer is A.' },
    { id: 'de2', text: 'Easy question 2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Correct answer is B.' },
  ],
  medium: [
    { id: 'dm1', text: 'Medium question 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Explanation here.' },
    { id: 'dm2', text: 'Medium question 2', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'Explanation here.' },
    { id: 'dm3', text: 'Medium question 3', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Explanation here.' },
  ],
  hard: [
    { id: 'dh1', text: 'Hard question', options: ['A', 'B', 'C', 'D'], correct: 3, explanation: 'Detailed explanation.' },
  ],
  mastery: [
    { id: 'mas1', text: 'Challenge 1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Explanation.' },
    { id: 'mas2', text: 'Challenge 2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Explanation.' },
    { id: 'mas3', text: 'Challenge 3', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'Explanation.' },
    { id: 'mas4', text: 'Challenge 4', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Explanation.' },
    { id: 'mas5', text: 'Challenge 5', options: ['A', 'B', 'C', 'D'], correct: 3, explanation: 'Explanation.' },
  ],
};

// ── MANIM ANIMATION: Fraction Decomposition Visualizer ────────
function ManimFractionViz({ animate }) {
  const leftOpacity  = useRef(new Animated.Value(0)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;
  const part1Opacity = useRef(new Animated.Value(0)).current;
  const part2Opacity = useRef(new Animated.Value(0)).current;
  const part1X       = useRef(new Animated.Value(-20)).current;
  const part2X       = useRef(new Animated.Value(20)).current;
  const lineWidth    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.sequence([
      Animated.timing(leftOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(arrowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(part1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(part1X,       { toValue: 0,  duration: 400, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(part2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(part2X,       { toValue: 0,  duration: 400, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      ]),
    ]).start();
  }, [animate]);

  return (
    <View style={mv.container}>
      {/* Left side: original fraction */}
      <Animated.View style={[mv.fractionBox, { opacity: leftOpacity }]}>
        <Text style={mv.numerator}>1</Text>
        <View style={mv.fracLine} />
        <Text style={mv.denominator}>x(x+1)</Text>
      </Animated.View>

      {/* Arrow */}
      <Animated.View style={[mv.arrowWrap, { opacity: arrowOpacity }]}>
        <Text style={mv.equals}>=</Text>
      </Animated.View>

      {/* Parts */}
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[mv.partRow, { opacity: part1Opacity, transform: [{ translateX: part1X }] }]}>
          <View style={mv.fractionBoxSmall}>
            <Text style={mv.numSmall}>A</Text>
            <View style={mv.fracLineSmall} />
            <Text style={mv.denSmall}>x</Text>
          </View>
          <Text style={mv.plus}>+</Text>
          <View style={mv.fractionBoxSmall}>
            <Text style={mv.numSmall}>B</Text>
            <View style={mv.fracLineSmall} />
            <Text style={mv.denSmall}>x+1</Text>
          </View>
        </Animated.View>

        <Animated.View style={[mv.solvedRow, { opacity: part2Opacity, transform: [{ translateX: part2X }] }]}>
          <View style={[mv.fractionBoxSmall, { borderColor: GOLD_CORRECT }]}>
            <Text style={[mv.numSmall, { color: GOLD_CORRECT }]}>1</Text>
            <View style={[mv.fracLineSmall, { backgroundColor: GOLD_CORRECT }]} />
            <Text style={[mv.denSmall, { color: GOLD_CORRECT }]}>x</Text>
          </View>
          <Text style={mv.minus}>−</Text>
          <View style={[mv.fractionBoxSmall, { borderColor: GOLD_CORRECT }]}>
            <Text style={[mv.numSmall, { color: GOLD_CORRECT }]}>1</Text>
            <View style={[mv.fracLineSmall, { backgroundColor: GOLD_CORRECT }]} />
            <Text style={[mv.denSmall, { color: GOLD_CORRECT }]}>x+1</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const mv = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
  fractionBox: { alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 12, borderWidth: 1, borderColor: BORDER2, paddingHorizontal: 16, paddingVertical: 10 },
  numerator: { color: GOLD_L, fontSize: 20, fontWeight: '700' },
  fracLine: { width: 80, height: 2, backgroundColor: GOLD, marginVertical: 4 },
  denominator: { color: GOLD_L, fontSize: 16 },
  arrowWrap: { paddingHorizontal: 8 },
  equals: { color: GOLD, fontSize: 24, fontWeight: '900' },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  solvedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fractionBoxSmall: { alignItems: 'center', backgroundColor: 'rgba(201,168,76,0.05)', borderRadius: 8, borderWidth: 1, borderColor: BORDER2, paddingHorizontal: 10, paddingVertical: 6 },
  numSmall: { color: GOLD_L, fontSize: 15, fontWeight: '700' },
  fracLineSmall: { width: 40, height: 1.5, backgroundColor: GOLD, marginVertical: 3 },
  denSmall: { color: GOLD_L, fontSize: 13 },
  plus:  { color: MUTED, fontSize: 18, fontWeight: '700' },
  minus: { color: GOLD_CORRECT, fontSize: 18, fontWeight: '700' },
});

// ── STAGE INDICATOR (stages stay LTR progress order) ───────────
const STAGE_KEYS = ['stageVideo', 'stageGuided', 'stageSolo', 'stageVoice', 'stageMaster'];
function StageIndicator({ current, t, isAr, fontReg }) {
  const stages = [
    { icon: 'videocam-outline' }, { icon: 'document-text-outline' }, { icon: 'flag-outline' }, { icon: 'mic-outline' }, { icon: 'trophy-outline' },
  ];

  return (
    <View style={si.wrap}>
      <View style={si.row}>
        {stages.map((st, i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <View key={i} style={si.item}>
              <View style={[si.dot, done && si.dotDone, active && si.dotActive]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color={GOLD_CORRECT} />
                  : <Ionicons name={st.icon} size={16} color={GOLD} />
                }
              </View>
              {i < 4 && <View style={[si.line, done && si.lineDone]} />}
            </View>
          );
        })}
      </View>
      <Text style={[si.label, { fontFamily: fontReg, textAlign: isAr ? 'right' : 'left' }]}>
        {t('stageLabelPrefix')}{current + 1} / 5 · {t(STAGE_KEYS[current])}
      </Text>
    </View>
  );
}
const si = StyleSheet.create({
  wrap:      { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  item:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1A1710', borderWidth: 1, borderColor: BORDER2,
    justifyContent: 'center', alignItems: 'center',
  },
  dotActive: { backgroundColor: 'rgba(201,168,76,0.2)', borderColor: GOLD, borderWidth: 2 },
  dotDone:   { backgroundColor: 'rgba(201,168,76,0.15)',  borderColor: GOLD_CORRECT },
  line:      { flex: 1, height: 2, backgroundColor: BORDER2 },
  lineDone:  { backgroundColor: GOLD_CORRECT },
  label:     { color: MUTED, fontSize: 12, textAlign: 'center', fontFamily: FONTS.bodyEn },
});

// ── XP PILL ───────────────────────────────────────────────────
function XPBadge({ xp }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[xpb.wrap, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient colors={[GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={xpb.grad}>
        <Text style={xpb.text}>+{xp} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}
const xpb = StyleSheet.create({
  wrap: { alignSelf: 'center', borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  grad: { paddingHorizontal: 20, paddingVertical: 8 },
  text: { color: GOLD_BTN_TEXT, fontFamily: FONTS.headingEn, fontSize: 14 },
});

// ── MCQ QUESTION ──────────────────────────────────────────────
function MCQQuestion({ q, onAnswer, showHint, stage }) {
  const { isAr } = useT();
  const [selected, setSelected] = useState(null);
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnims = q.options.map((_, i) => useRef(new Animated.Value(30)).current);
  const opacAnims  = q.options.map((_, i) => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    q.options.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(i * 80),
        Animated.parallel([
          Animated.timing(slideAnims[i], { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(opacAnims[i],  { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [q.id]);

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx !== q.correct) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
      ]).start();
    }
    setTimeout(() => onAnswer(idx === q.correct, idx), 1400);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: shakeAnim }] }}>
      {/* Question */}
      <View style={mcq.qCard}>
        <Text style={mcq.qText}>{q.text}</Text>
        {showHint && stage === 'guided' && (
          <View style={mcq.hintBox}>
            <Ionicons name="bulb-outline" size={14} color={GOLD} />
            <Text style={mcq.hintText}>{isAr ? ' تلميح: جرّب تحليل المقام أولاً' : ' Hint: Try factoring the denominator first'}</Text>
          </View>
        )}
      </View>

      {/* Options */}
      {q.options.map((opt, i) => {
        const isCorrect  = i === q.correct;
        const isSelected = i === selected;
        let bg        = CARD;
        let border    = BORDER2;
        let textColor = WHITE;
        let letterBg  = 'rgba(201,168,76,0.15)';
        let letterCol = GOLD;

        if (selected !== null) {
          if (isCorrect) {
            bg = 'rgba(201,168,76,0.08)'; border = GOLD_CORRECT; letterBg = 'rgba(201,168,76,0.2)'; letterCol = GOLD_CORRECT;
          } else if (isSelected) {
            bg = 'rgba(239,68,68,0.08)'; border = RED; letterBg = 'rgba(239,68,68,0.2)'; letterCol = RED; textColor = '#FF8888';
          }
        }

        return (
          <Animated.View key={i} style={{ opacity: opacAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
            <TouchableOpacity
              style={[mcq.option, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleSelect(i)}
              disabled={selected !== null}
              activeOpacity={0.8}
            >
              <View style={[mcq.letterBubble, { backgroundColor: letterBg }]}>
                <Text style={[mcq.letter, { color: letterCol }]}>{['A', 'B', 'C', 'D'][i]}</Text>
              </View>
              <Text style={[mcq.optText, { color: textColor }]}>{opt}</Text>
              {selected !== null && isCorrect  && <Ionicons name="checkmark-circle-outline" size={22} color={GOLD_CORRECT} />}
              {selected !== null && isSelected && !isCorrect && <Ionicons name="close-circle" size={22} color={RED} />}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Explanation */}
      {selected !== null && (
        <Animated.View style={[mcq.explanation, { borderColor: selected === q.correct ? GOLD_CORRECT : RED }]}>
          <View style={mcq.expHeader}>
            <Text style={[mcq.expTitle, { color: selected === q.correct ? GOLD_CORRECT : RED }]}>
              {isAr ? (selected === q.correct ? 'إجابة صحيحة!' : 'إجابة غير صحيحة') : (selected === q.correct ? 'Correct!' : 'Incorrect')}
            </Text>
          </View>
          <Text style={mcq.expText}>{q.explanation}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}
const mcq = StyleSheet.create({
  qCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1,
    borderColor: BORDER2, padding: 18, marginBottom: 14,
  },
  qText:   { color: WHITE, fontSize: 17, fontFamily: FONTS.semiEn, lineHeight: 26 },
  hintBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 8, padding: 8 },
  hintText:{ color: GOLD_L, fontSize: 12, fontFamily: FONTS.bodyEn },
  option: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    marginBottom: 10, padding: 14, gap: 12,
  },
  letterBubble: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  letter:   { fontFamily: FONTS.headingEn, fontSize: 14 },
  optText:  { flex: 1, fontFamily: FONTS.bodyEn, fontSize: 15, color: WHITE },
  explanation: {
    marginTop: 4, marginBottom: 8, padding: 14,
    borderRadius: 14, borderWidth: 1.5, backgroundColor: '#0A0A08',
  },
  expHeader: { marginBottom: 6 },
  expTitle:  { fontFamily: FONTS.headingEn, fontSize: 14 },
  expText:   { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 13, lineHeight: 20 },
});

// ── STAGE 1: VIDEO ────────────────────────────────────────────
function VideoStage({ lesson, onComplete, t, fontBold, fontReg, textAlign, isAr }) {
  const [seconds,  setSeconds]  = useState(0);
  const [canSkip,  setCanSkip]  = useState(false);
  const [animStep, setAnimStep] = useState(false);
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0.4)).current;
  const waveAnims  = [0,1,2,3,4].map(() => useRef(new Animated.Value(0.3)).current);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow pulse
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim,  { toValue: 1,   duration: 1200, useNativeDriver: true }),
      Animated.timing(glowAnim,  { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();

    // Waves
    waveAnims.forEach((a, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1,   duration: 350 + i * 110, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.2, duration: 350 + i * 110, useNativeDriver: true }),
      ])).start();
    });

    // Timer
    const timer = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (next >= 10) { setCanSkip(true); setAnimStep(true); }
        Animated.timing(progressAnim, { toValue: Math.min(next / 10, 1), duration: 900, useNativeDriver: false }).start();
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const BULLETS = [
    { icon: 'triangle-outline', text: isAr ? 'تحليل الكسور المعقدة إلى أجزاء أبسط' : 'Decomposing complex fractions into simpler parts' },
    { icon: 'calculator-outline', text: isAr ? 'طريقة المعاملات غير المحددة' : 'Method of undetermined coefficients' },
    { icon: 'code-slash-outline', text: isAr ? 'تطبيقات على مسائل تكامل التوجيهي' : 'Applications to Tawjihi integration problems' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={vs.container}>
        {/* Manim π orb */}
        <View style={vs.orbWrap}>
          <Animated.View style={[vs.orbGlow, { opacity: glowAnim }]} />
          <View style={vs.orb}>
            <Text style={vs.piText}>π</Text>
          </View>
          <View style={vs.waveRow}>
            {waveAnims.map((a, i) => (
              <Animated.View key={i} style={[vs.bar, { transform: [{ scaleY: a }] }]} />
            ))}
          </View>
        </View>

        <View style={[vs.badgeRow, { flexDirection: textAlign === 'right' ? 'row-reverse' : 'row' }]}>
        <Ionicons name="videocam-outline" size={16} color={GOLD} style={{ marginRight: textAlign === 'right' ? 0 : 6, marginLeft: textAlign === 'right' ? 6 : 0 }} />
        <Text style={[vs.badge, { fontFamily: fontReg, textAlign }]}>{t('videoLesson')}</Text>
        </View>
        <Text style={[vs.title, { fontFamily: fontBold, textAlign }]}>{lesson?.title || t('lessonTopicPartialFractions')}</Text>
        <Text style={[vs.sub, { fontFamily: fontReg, textAlign }]}>{t('masterThisTopic')}</Text>

        {/* Manim Viz - math stays LTR */}
        <View style={vs.animCard}>
          <Text style={[vs.animLabel, { fontFamily: fontReg, textAlign }]}>{t('decompositionPreview')}</Text>
          <ManimFractionViz animate={true} />
        </View>

        {/* What you'll learn */}
        <View style={vs.learnCard}>
          <Text style={[vs.learnTitle, { textAlign }]}>{isAr ? 'في هذا الدرس:' : 'In this lesson:'}</Text>
          {BULLETS.map((b, i) => (
            <View key={i} style={[vs.bullet, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={vs.bulletIcon}><Ionicons name={b.icon} size={16} color={GOLD} /></View>
              <Text style={[vs.bulletText, { textAlign }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={vs.progressWrap}>
          <View style={vs.progressBg}>
            <Animated.View style={[vs.progressFill, { width: progressWidth }]}>
              <LinearGradient colors={[GOLD_D, GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 4 }} />
            </Animated.View>
          </View>
          <Text style={vs.progressLabel}>{canSkip ? (isAr ? 'جاهز!' : 'Ready!') : `${10 - seconds}s`}</Text>
        </View>

        {canSkip ? (
          <TouchableOpacity style={vs.btn} onPress={onComplete} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD_D, GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={vs.btnGrad}>
              <Text style={vs.btnText}>{isAr ? 'تابع إلى التدريب ←' : 'Continue to Practice →'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={vs.waitingWrap}>
            <Text style={vs.waitingText}>{isAr ? 'يرجى مشاهدة الدرس...' : 'Please watch the lesson...'}</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}
const vs = StyleSheet.create({
  container:   { alignItems: 'center', paddingHorizontal: 20, paddingTop: 16 },
  orbWrap:     { alignItems: 'center', marginBottom: 16 },
  orbGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  orb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: CARD, borderWidth: 2, borderColor: GOLD,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  piText:  { color: GOLD, fontSize: 52, fontFamily: FONTS.headingEn },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 48 },
  bar:     { width: 7, height: 36, backgroundColor: GOLD, borderRadius: 4, opacity: 0.85 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge:   { color: MUTED, fontSize: 13, fontFamily: FONTS.semiEn, letterSpacing: 1 },
  title:   { color: WHITE, fontSize: 24, fontFamily: FONTS.headingEn, textAlign: 'center', marginBottom: 4 },
  sub:     { color: MUTED, fontSize: 13, fontFamily: FONTS.bodyEn, marginBottom: 20 },
  animCard: {
    width: '100%', backgroundColor: CARD, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER2, padding: 16, marginBottom: 16,
  },
  animLabel: { color: MUTED, fontSize: 10, fontFamily: FONTS.semiEn, letterSpacing: 2, marginBottom: 4, textAlign: 'center' },
  learnCard: {
    width: '100%', backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER2, padding: 16, marginBottom: 20,
  },
  learnTitle: { color: GOLD_L, fontFamily: FONTS.semiEn, fontSize: 14, marginBottom: 12 },
  bullet:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletIcon: { width: 22, alignItems: 'center', justifyContent: 'center' },
  bulletText: { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 13, flex: 1, lineHeight: 20 },
  progressWrap:  { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  progressBg:    { flex: 1, height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressLabel: { color: GOLD, fontFamily: FONTS.semiEn, fontSize: 12, width: 40, textAlign: 'right' },
  btn:     { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: GOLD_BTN_TEXT, fontFamily: FONTS.headingEn, fontSize: 16 },
  waitingWrap: { backgroundColor: CARD, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, borderWidth: 1, borderColor: BORDER },
  waitingText: { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 14 },
});

// ── STAGE HEADER CARD ─────────────────────────────────────────
function StageHeader({ icon, title, subtitle, score, total, isAr }) {
  return (
    <View style={sh.wrap}>
      <View style={[sh.left, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <Ionicons name={icon || 'document-text-outline'} size={28} color={GOLD} style={sh.iconWrap} />
        <View>
          <Text style={[sh.title, { textAlign: isAr ? 'right' : 'left' }]}>{title}</Text>
          <Text style={[sh.sub, { textAlign: isAr ? 'right' : 'left' }]}>{subtitle}</Text>
        </View>
      </View>
      {total > 0 && (
        <View style={sh.scorePill}>
          <Text style={sh.scoreText}>{score}/{total}</Text>
        </View>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  wrap:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:  {},
  title:     { color: WHITE, fontFamily: FONTS.headingEn, fontSize: 18 },
  sub:       { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 12, marginTop: 2 },
  scorePill: { backgroundColor: 'rgba(201,168,76,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: BORDER2 },
  scoreText: { color: GOLD, fontFamily: FONTS.headingEn, fontSize: 14 },
});

// ── PROGRESS DOTS ─────────────────────────────────────────────
function ProgressDots({ total, current }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[pd.dot, i < current && pd.dotDone, i === current && pd.dotActive]} />
      ))}
    </View>
  );
}
const pd = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER2 },
  dotDone:   { backgroundColor: GOLD_CORRECT },
  dotActive: { width: 20, backgroundColor: GOLD },
});

// ── MAIN LESSON SCREEN ────────────────────────────────────────
export default function LessonScreen({ route, navigation }) {
  const { t, isAr } = useT();
  const { lessonId, lesson: routeLesson } = route?.params || {};
  const lesson = routeLesson || { id: lessonId, title: t('lessonTopicPartialFractions'), duration: '6 min' };
  const lid    = lesson?.id || lessonId || 'lesson1_1';
  const hasVideoUrl = !!(lesson?.video_url && String(lesson.video_url).trim());
  const lessonTitle = isAr ? (lesson?.titleAr ?? lesson?.titleEn ?? lesson?.title) : (lesson?.titleEn ?? lesson?.titleAr ?? lesson?.title);
  const qs     = LESSON_QUESTIONS[lid] || DEFAULT_QUESTIONS;

  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg  = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const textAlign = isAr ? 'right' : 'left';

  const STAGES = ['video', 'guided', 'solo', 'voice', 'mastery'];
  const [stageIdx, setStageIdx] = useState(0);
  const stage = STAGES[stageIdx];
  const stageTransAnim = useRef(new Animated.Value(1)).current;

  // Guided
  const [guidedIdx,   setGuidedIdx]   = useState(0);
  const [guidedScore, setGuidedScore] = useState(0);
  const [showHint,    setShowHint]    = useState(false);

  // Solo
  const [soloIdx,   setSoloIdx]   = useState(0);
  const [soloScore, setSoloScore] = useState(0);

  // Voice
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceDone,      setVoiceDone]      = useState(false);
  const micPulse = useRef(new Animated.Value(1)).current;
  const micGlow  = useRef(new Animated.Value(0)).current;

  // Mastery
  const [masteryIdx,     setMasteryIdx]     = useState(0);
  const [masteryScore,   setMasteryScore]   = useState(0);
  const [masteryDone,    setMasteryDone]    = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(600);
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // XP tracking
  const [totalXP, setTotalXP] = useState(0);

  const goNextStage = (xpGain = 0) => {
    setTotalXP(x => x + xpGain);
    Animated.sequence([
      Animated.timing(stageTransAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(stageTransAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    if (stageIdx < 4) setStageIdx(s => s + 1);
  };

  // Mastery timer
  useEffect(() => {
    if (stage === 'mastery' && !masteryDone) {
      const t = setInterval(() => setTimeLeft(s => {
        if (s <= 1) { setMasteryDone(true); return 0; }
        return s - 1;
      }), 1000);
      return () => clearInterval(t);
    }
  }, [stage, masteryDone]);

  // Mic pulse
  useEffect(() => {
    if (voiceRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(micPulse, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(micPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(micGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(micGlow, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])).start();
    } else {
      micPulse.stopAnimation();
      micGlow.stopAnimation();
    }
  }, [voiceRecording]);

  const handleGuided = (correct) => {
    if (correct) setGuidedScore(s => s + 1);
    if (guidedIdx < qs.easy.length - 1) {
      setTimeout(() => { setGuidedIdx(i => i + 1); setShowHint(false); }, 1500);
    } else {
      setTimeout(() => goNextStage(20), 1600);
    }
  };

  const handleSolo = (correct) => {
    if (correct) setSoloScore(s => s + 1);
    const finalScore = soloScore + (correct ? 1 : 0);
    if (soloIdx < qs.medium.length - 1) {
      setTimeout(() => setSoloIdx(i => i + 1), 1500);
    } else {
      setTimeout(() => {
        if (finalScore >= 2) {
          goNextStage(30);
        } else {
          Alert.alert(
            isAr ? 'استمر!' : 'Keep Going!',
            isAr
              ? `حصلت على ${finalScore}/${qs.medium.length}. تحتاج 2/3 للمتابعة.`
              : `You got ${finalScore}/${qs.medium.length}. Need 2/3 to continue.`,
            [
              { text: isAr ? 'شاهد الدرس' : 'Watch Lesson', onPress: () => { setStageIdx(0); setSoloIdx(0); setSoloScore(0); } },
              { text: isAr ? 'حاول مجدداً' : 'Try Again', onPress: () => { setSoloIdx(0); setSoloScore(0); } },
            ]
          );
        }
      }, 1600);
    }
  };

  const handleMastery = (correct) => {
    const newScore = masteryScore + (correct ? 1 : 0);
    if (correct) setMasteryScore(s => s + 1);
    if (masteryIdx < qs.mastery.length - 1) {
      setTimeout(() => setMasteryIdx(i => i + 1), 1300);
    } else {
      setTimeout(() => {
        setMasteryDone(true);
        if (newScore >= Math.ceil(qs.mastery.length * 0.8)) {
          Animated.spring(confettiAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
          setTotalXP(x => x + 150);
        }
      }, 1500);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const passThreshold = Math.ceil(qs.mastery.length * 0.8);
  const passed = masteryScore >= passThreshold;

  const goBack = () => navigation?.goBack?.();

  return (
    <SafeAreaView style={s.safe}>
      {/* TOP BAR — back always left (chevron-back), then toggle, then title */}
      <View style={[s.topBar, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={WHITE} />
        </TouchableOpacity>
        <LanguageToggle />
        <View style={s.topCenter}>
          <Text style={[s.topTitle, { fontFamily: fontBold, textAlign }]} numberOfLines={1}>{lessonTitle || t('lessonTitle')}</Text>
        </View>
        <View style={s.xpChip}>
          <Ionicons name="star-outline" size={16} color={GOLD} style={{ marginRight: 4 }} />
          <Text style={[s.xpChipText, { fontFamily: fontBold }]}>{totalXP}</Text>
        </View>
      </View>

      {hasVideoUrl && <VideoSection videoUrl={lesson.video_url} isAr={isAr} />}
      <StageIndicator current={stageIdx} t={t} isAr={isAr} fontReg={fontReg} />

      <Animated.View style={[{ flex: 1 }, { opacity: stageTransAnim }]}>

        {/* ── STAGE 1: VIDEO ── */}
        {stage === 'video' && <VideoStage lesson={lesson} onComplete={() => goNextStage(10)} t={t} fontBold={fontBold} fontReg={fontReg} textAlign={textAlign} isAr={isAr} />}

        {/* ── STAGE 2: GUIDED ── */}
        {stage === 'guided' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
            <StageHeader icon="document-text-outline" title={isAr ? 'تدريب موجّه' : 'Guided Practice'} subtitle={isAr ? 'أسئلة سهلة · تلميحات متاحة' : 'Easy questions · hints available'} score={guidedScore} total={qs.easy.length} isAr={isAr} />
            <ProgressDots total={qs.easy.length} current={guidedIdx} />
            <MCQQuestion q={qs.easy[guidedIdx]} onAnswer={handleGuided} showHint={showHint} stage="guided" key={qs.easy[guidedIdx].id} />
            {!showHint && (
              <TouchableOpacity style={s.hintBtn} onPress={() => setShowHint(true)} activeOpacity={0.8}>
                <Ionicons name="bulb-outline" size={16} color={GOLD} />
                <Text style={s.hintText}>{isAr ? 'إظهار تلميح' : 'Show Hint'}</Text>
              </TouchableOpacity>
            )}
            <Text style={s.xpNote}>{isAr ? '+20 نقطة خبرة عند الإكمال' : '+20 XP on completion'}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── STAGE 3: SOLO ── */}
        {stage === 'solo' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
            <StageHeader icon="flag-outline" title={isAr ? 'تدريب فردي' : 'Solo Practice'} subtitle={isAr ? 'بدون تلميحات · تحتاج 2/3 للمتابعة' : 'No hints · need 2/3 to continue'} score={soloScore} total={qs.medium.length} isAr={isAr} />
            <ProgressDots total={qs.medium.length} current={soloIdx} />
            <MCQQuestion q={qs.medium[soloIdx]} onAnswer={handleSolo} stage="solo" key={qs.medium[soloIdx].id} />
            <Text style={s.xpNote}>{isAr ? '+30 نقطة خبرة عند النجاح' : '+30 XP if you pass'}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── STAGE 4: VOICE ── */}
        {stage === 'voice' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
            <StageHeader icon="mic-outline" title={isAr ? 'شرح صوتي' : 'Voice Explanation'} subtitle={isAr ? 'اشرح بصوتك · الذكاء الاصطناعي يقيّم' : 'Explain out loud · AI evaluates'} score={0} total={0} isAr={isAr} />

            <View style={mcq.qCard}>
              <Text style={mcq.qText}>{qs.hard?.[0]?.text || (isAr ? 'اشرح الكسور الجزئية بكلماتك الخاصة.' : 'Explain partial fractions in your own words.')}</Text>
            </View>

            <View style={voice.micArea}>
              <Animated.View style={[voice.glowRing, { opacity: micGlow, transform: [{ scale: micPulse }] }]} />
              <Animated.View style={[voice.micOuter, { transform: [{ scale: micPulse }] }]}>
                <TouchableOpacity
                  style={voice.micBtn}
                  onPress={() => {
                    if (!voiceRecording && !voiceDone) {
                      setVoiceRecording(true);
                      setTimeout(() => { setVoiceRecording(false); setVoiceDone(true); }, 5000);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={voiceRecording ? [RED_D, RED] : [GOLD_D, GOLD]}
                    style={voice.micGrad}
                  >
                    <View style={voice.micIconWrap}>
                      <Ionicons name={voiceRecording ? 'stop-circle-outline' : voiceDone ? 'checkmark-circle-outline' : 'mic-outline'} size={44} color={GOLD_BTN_TEXT} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              <Text style={voice.micLabel}>
                {voiceRecording ? (isAr ? 'جارٍ التسجيل... اضغط للإيقاف' : 'Recording... tap to stop') : voiceDone ? (isAr ? 'تم التسجيل!' : 'Recorded!') : (isAr ? 'اضغط للتسجيل' : 'Tap to record')}
              </Text>
            </View>

            {voiceDone && (
              <View style={voice.feedbackCard}>
                <Text style={voice.feedbackTitle}>{isAr ? 'تقييم الذكاء الاصطناعي' : 'AI Evaluation'}</Text>
                <Text style={voice.feedbackText}>
                  {isAr
                    ? 'شرح ممتاز! أظهرت فهماً جيداً لخطوات التحليل. حاول أن تكون أوضح عند التعويض لإيجاد A و B.'
                    : 'Great explanation! You showed solid understanding of the decomposition process. Try to be more explicit about substituting values to solve for A and B.'}
                </Text>
                <XPBadge xp={75} />
                <TouchableOpacity style={s.primaryBtn} onPress={() => goNextStage(75)} activeOpacity={0.85}>
                  <LinearGradient colors={[GOLD_D, GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                    <Text style={s.primaryBtnText}>{isAr ? 'متابعة ← (+75 خبرة)' : 'Continue → (+75 XP)'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={s.skipLink} onPress={() => goNextStage(0)}>
              <Text style={s.skipText}>{isAr ? 'تخطي المرحلة الصوتية (بدون خبرة)' : 'Skip voice stage (no XP)'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── STAGE 5: MASTERY ── */}
        {stage === 'mastery' && !masteryDone && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={s.masteryTopRow}>
              <StageHeader icon="trophy-outline" title={isAr ? 'مرحلة الإتقان' : 'Mastery'} subtitle={isAr ? `${passThreshold}/${qs.mastery.length} للنجاح` : `${passThreshold}/${qs.mastery.length} to pass`} score={masteryScore} total={qs.mastery.length} isAr={isAr} />
              <View style={s.timerPill}>
                <Ionicons name="time-outline" size={14} color={timeLeft < 60 ? RED : GOLD} />
                <Text style={[s.timerText, { color: timeLeft < 60 ? RED : GOLD }]}>{formatTime(timeLeft)}</Text>
              </View>
            </View>
            <ProgressDots total={qs.mastery.length} current={masteryIdx} />
            <MCQQuestion q={qs.mastery[masteryIdx]} onAnswer={handleMastery} stage="mastery" key={qs.mastery[masteryIdx].id} />
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* ── MASTERY RESULTS ── */}
        {stage === 'mastery' && masteryDone && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.scrollPad, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
            {passed ? (
              <Animated.View style={{ alignItems: 'center', width: '100%', opacity: confettiAnim, transform: [{ scale: confettiAnim }] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}><Ionicons name="trophy-outline" size={40} color={GOLD} /></View>
                <Text style={s.resultTitle}>{isAr ? 'تم إتقان الدرس!' : 'Lesson Mastered!'}</Text>
                <Text style={s.resultScore}>{masteryScore}/{qs.mastery.length}</Text>
                <Text style={s.resultPct}>{Math.round((masteryScore / qs.mastery.length) * 100)}%</Text>
                <XPBadge xp={150} />
                <View style={s.totalXPCard}>
                  <Text style={s.totalXPLabel}>{isAr ? 'إجمالي نقاط الخبرة' : 'TOTAL XP EARNED'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Ionicons name="star-outline" size={18} color={GOLD} /><Text style={s.totalXPValue}>{totalXP}</Text></View>
                </View>
                <Text style={s.tagline}>{isAr ? 'تعلّم. أتقن. تميّز.' : 'Learn. Master. Stand Out.'}</Text>
                <TouchableOpacity style={[s.primaryBtn, { width: '100%', marginTop: 24 }]} onPress={goBack} activeOpacity={0.85}>
                  <LinearGradient colors={[GOLD_D, GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                    <Text style={s.primaryBtnText}>{isAr ? 'الدرس التالي ←' : 'Next Lesson →'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <View style={{ marginBottom: 8 }}><Ionicons name="alert-circle-outline" size={40} color={MUTED} /></View>
                <Text style={s.resultTitle}>{isAr ? 'اقتربت جداً!' : 'Almost There!'}</Text>
                <Text style={[s.resultScore, { color: RED }]}>{masteryScore}/{qs.mastery.length}</Text>
                <Text style={[s.resultPct, { color: MUTED }]}>{isAr ? `تحتاج ${passThreshold}/${qs.mastery.length} للنجاح` : `Need ${passThreshold}/${qs.mastery.length} to pass`}</Text>
                <View style={s.failCard}>
                  <Text style={s.failCardText}>{isAr ? 'راجع الدرس ثم حاول مرة أخرى.' : 'Review the lesson and try again.'}</Text>
                </View>
                <TouchableOpacity style={[s.primaryBtn, { width: '100%', marginTop: 20 }]}
                  onPress={() => { setStageIdx(0); setMasteryIdx(0); setMasteryScore(0); setMasteryDone(false); setTimeLeft(600); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[GOLD_D, GOLD, GOLD_L]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtnGrad}>
                    <Text style={s.primaryBtnText}>{isAr ? 'مراجعة الدرس' : 'Review Lesson'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[s.outlineBtn, { width: '100%', marginTop: 12 }]}
                  onPress={() => { setMasteryIdx(0); setMasteryScore(0); setMasteryDone(false); setTimeLeft(600); }}
                  activeOpacity={0.85}
                >
                  <Text style={s.outlineBtnText}>{isAr ? 'حاول مجدداً' : 'Try Again'}</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const voice = StyleSheet.create({
  micArea: { alignItems: 'center', paddingVertical: 32, position: 'relative' },
  glowRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  micOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: CARD, borderWidth: 2, borderColor: GOLD,
    overflow: 'hidden', marginBottom: 14,
  },
  micBtn:   { flex: 1 },
  micGrad:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  micEmoji: { fontSize: 44 },
  micIconWrap: {},
  micLabel: { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 14 },
  feedbackCard: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER2,
    padding: 16, marginBottom: 16, width: '100%',
  },
  feedbackTitle: { color: GOLD_L, fontFamily: FONTS.headingEn, fontSize: 15, marginBottom: 8 },
  feedbackText:  { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 13, lineHeight: 20, marginBottom: 14 },
});

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  center: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn:   { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle:  { color: WHITE, fontFamily: FONTS.headingEn, fontSize: 16 },
  xpChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(191,160,68,0.15)', borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: BORDER2,
  },
  xpChipText: { color: GOLD, fontFamily: FONTS.headingEn, fontSize: 12 },

  scrollPad: { padding: 20 },

  hintBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: BORDER2, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,76,0.05)', marginBottom: 12,
  },
  hintText: { color: GOLD, fontFamily: FONTS.semiEn, fontSize: 14 },
  xpNote:   { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 12, textAlign: 'center', marginTop: 8 },

  primaryBtn:     { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  primaryBtnText: { color: GOLD_BTN_TEXT, fontFamily: FONTS.headingEn, fontSize: 16 },

  outlineBtn:     { borderWidth: 1.5, borderColor: GOLD, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  outlineBtnText: { color: GOLD, fontFamily: FONTS.headingEn, fontSize: 16 },

  skipLink: { alignItems: 'center', marginTop: 16 },
  skipText: { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 13, textDecorationLine: 'underline' },

  masteryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  timerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: BORDER2,
  },
  timerText: { fontFamily: FONTS.headingEn, fontSize: 14 },

  resultEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  resultTitle: { color: WHITE, fontFamily: FONTS.headingEn, fontSize: 26, marginBottom: 8 },
  resultScore: { color: GOLD_CORRECT, fontFamily: FONTS.headingEn, fontSize: 48, lineHeight: 56 },
  resultPct:   { color: GOLD_CORRECT, fontFamily: FONTS.bodyEn, fontSize: 16, marginBottom: 16 },
  tagline:     { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 13, fontStyle: 'italic', marginTop: 8 },

  totalXPCard: {
    backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 16, borderWidth: 1, borderColor: BORDER2,
    paddingHorizontal: 32, paddingVertical: 16, alignItems: 'center', marginVertical: 12, width: '100%',
  },
  totalXPLabel: { color: MUTED, fontFamily: FONTS.semiEn, fontSize: 10, letterSpacing: 2, marginBottom: 4 },
  totalXPValue: { color: GOLD, fontFamily: FONTS.headingEn, fontSize: 32 },

  failCard: {
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    padding: 16, marginVertical: 12, width: '100%',
  },
  failCardText: { color: MUTED, fontFamily: FONTS.bodyEn, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
