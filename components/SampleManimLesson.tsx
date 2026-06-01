import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { AppTheme } from '../src/theme/themes';
import { withAlpha } from '../src/theme/colorUtils';
import { stabilizeMixedMathText } from '../src/utils/bidi';

type SampleManimLessonProps = {
  theme: AppTheme;
  isAr: boolean;
  lessonId: string;
  lessonTitle: string;
};

type SceneConfig = {
  kind: 'factor' | 'trig' | 'generic';
  kickerEn: string;
  kickerAr: string;
  leadEn: string;
  leadAr: string;
  formulaPrimary: string;
  formulaSecondary: string;
  footerEn: string;
  footerAr: string;
};

const SEGMENT_PILLS = [
  { icon: 'person-circle-outline', en: 'Coach', ar: 'المدرب' },
  { icon: 'shapes-outline', en: 'Manim', ar: 'Manim' },
  { icon: 'document-text-outline', en: 'Example', ar: 'مثال' },
  { icon: 'sparkles-outline', en: 'Recap', ar: 'خلاصة' },
] as const;

function getSceneConfig(lessonId: string, lessonTitle: string): SceneConfig {
  if (lessonId === 'u1-l1') {
    return {
      kind: 'factor',
      kickerEn: 'Lesson visual board',
      kickerAr: 'لوحة الدرس البصرية',
      leadEn: 'Visual chain for the theorem',
      leadAr: 'سلسلة بصرية للنظرية',
      formulaPrimary: 'P(x) ÷ (x - a)',
      formulaSecondary: 'P(a) = 0  =>  (x - a) factor',
      footerEn: 'Lock the substitution step first, then state the factor test clearly.',
      footerAr: 'ثبّت خطوة التعويض أولاً، ثم اكتب اختبار العامل بوضوح.',
    };
  }

  if (lessonId === 'u2-l1') {
    return {
      kind: 'trig',
      kickerEn: 'Lesson visual board',
      kickerAr: 'لوحة الدرس البصرية',
      leadEn: 'Unit-circle warm-up',
      leadAr: 'تمهيد دائرة الوحدة',
      formulaPrimary: 'sin^2(theta) + cos^2(theta) = 1',
      formulaSecondary: 'Unit circle  ->  picture before proof',
      footerEn: 'Let the moving circle explain the identity before algebra.',
      footerAr: 'لتشرح الحركة على الدائرة المتطابقة قبل البدء بالجبر.',
    };
  }

  return {
    kind: 'generic',
    kickerEn: 'Lesson visual board',
    kickerAr: 'لوحة الدرس البصرية',
    leadEn: 'Guided lesson walkthrough',
    leadAr: 'مسار بصري موجّه للدرس',
    formulaPrimary: lessonTitle,
    formulaSecondary: 'Visual idea  ->  worked example  ->  recap',
    footerEn: 'Use this lesson board to understand the idea before examples and practice.',
    footerAr: 'استخدم لوحة الدرس هذه لفهم الفكرة قبل الانتقال إلى الأمثلة والتدريب.',
  };
}

export default function SampleManimLesson({
  theme,
  isAr,
  lessonId,
  lessonTitle,
}: SampleManimLessonProps) {
  const scene = useMemo(() => getSceneConfig(lessonId, lessonTitle), [lessonId, lessonTitle]);

  const sweepAnim = useRef(new Animated.Value(-1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const sweepLoop = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 4200,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.92,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );

    sweepLoop.start();
    floatLoop.start();
    orbitLoop.start();
    pulseLoop.start();

    return () => {
      sweepLoop.stop();
      floatLoop.stop();
      orbitLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, orbitAnim, pulseAnim, sweepAnim]);

  const sweepTranslateX = sweepAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-140, 220],
  });
  const cardFloatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -4],
  });
  const cardFloatReverseY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 5],
  });
  const orbitRotate = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        s.shell,
        {
          backgroundColor: withAlpha(theme.bg, 0.86),
          borderColor: withAlpha(theme.accent, 0.2),
        },
      ]}>
      <LinearGradient
        colors={[
          withAlpha(theme.primary[0], 0.18),
          withAlpha(theme.accent, 0.08),
          withAlpha(theme.bg, 0.02),
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          s.sweep,
          {
            backgroundColor: withAlpha(theme.accent, 0.12),
            transform: [{ translateX: sweepTranslateX }, { rotate: '-18deg' }, { scale: pulseAnim }],
          },
        ]}
      />

      <View style={[s.topRow, isAr && s.rowRtl]}>
        <View
          style={[
            s.kickerPill,
            {
              backgroundColor: withAlpha(theme.surface, 0.76),
              borderColor: withAlpha(theme.accent, 0.22),
            },
            isAr && s.rowRtl,
          ]}>
          <Ionicons name="sparkles-outline" size={13} color={theme.accent} />
          <Text style={[s.kickerText, { color: theme.accent }]}>
            {isAr ? scene.kickerAr : scene.kickerEn}
          </Text>
        </View>

        <View
          style={[
            s.statusPill,
            {
              backgroundColor: withAlpha(theme.surface, 0.66),
              borderColor: withAlpha(theme.border, 0.9),
            },
            isAr && s.rowRtl,
          ]}>
          <Ionicons name="shapes-outline" size={12} color={theme.muted} />
          <Text style={[s.statusText, { color: theme.muted }]}>
            {isAr ? 'وضع بصري حي' : 'Visual lesson mode'}
          </Text>
        </View>
      </View>

      <Text style={[s.lead, { color: theme.text }, isAr && s.textRight]}>
        {isAr ? scene.leadAr : scene.leadEn}
      </Text>

      <View
        style={[
          s.stage,
          {
            backgroundColor: withAlpha(theme.bg, 0.52),
            borderColor: withAlpha(theme.accent, 0.16),
          },
        ]}>
        <View style={[s.gridLine, s.gridLineTop, { backgroundColor: withAlpha(theme.text, 0.06) }]} />
        <View style={[s.gridLine, s.gridLineBottom, { backgroundColor: withAlpha(theme.text, 0.04) }]} />
        <View style={[s.gridColumn, { backgroundColor: withAlpha(theme.text, 0.05) }]} />

        {scene.kind === 'factor' ? (
          <View style={s.factorScene}>
            <Animated.View
              style={[
                s.formulaCard,
                {
                  backgroundColor: withAlpha(theme.surface, 0.78),
                  borderColor: withAlpha(theme.accent, 0.18),
                  transform: [{ translateY: cardFloatY }],
                },
              ]}>
              <Text style={[s.formulaCardLabel, { color: theme.muted }]}>
                {isAr ? 'مدخل بصري' : 'Visual entry'}
              </Text>
              <Text style={[s.formulaCardFormula, { color: theme.text }]}>
                {scene.formulaPrimary}
              </Text>
            </Animated.View>

            <View style={[s.linkRow, isAr && s.rowRtl]}>
              <Animated.View
                style={[
                  s.linkCard,
                  {
                    backgroundColor: withAlpha(theme.surface, 0.72),
                    borderColor: withAlpha(theme.border, 0.86),
                    transform: [{ translateY: cardFloatReverseY }],
                  },
                ]}>
                <Text style={[s.linkCardText, { color: theme.text }]}>x = a</Text>
              </Animated.View>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.accent} />
              <Animated.View
                style={[
                  s.linkCard,
                  {
                    backgroundColor: withAlpha(theme.accent, 0.12),
                    borderColor: withAlpha(theme.accent, 0.18),
                    transform: [{ translateY: cardFloatY }],
                  },
                ]}>
                <Text style={[s.linkCardText, { color: theme.accent }]}>P(a)</Text>
              </Animated.View>
            </View>
          </View>
        ) : scene.kind === 'trig' ? (
          <View style={[s.trigScene, isAr && s.rowRtl]}>
            <View
              style={[
                s.circleWrap,
                {
                  backgroundColor: withAlpha(theme.surface, 0.36),
                  borderColor: withAlpha(theme.accent, 0.22),
                },
              ]}>
              <View style={[s.circle, { borderColor: withAlpha(theme.accent, 0.58) }]} />
              <View style={[s.axisX, { backgroundColor: withAlpha(theme.text, 0.18) }]} />
              <View style={[s.axisY, { backgroundColor: withAlpha(theme.text, 0.18) }]} />
              <Animated.View
                style={[
                  s.orbitWrap,
                  {
                    transform: [{ rotate: orbitRotate }],
                  },
                ]}>
                <View style={[s.orbitDot, { backgroundColor: theme.accent }]} />
              </Animated.View>
            </View>

            <Animated.View
              style={[
                s.trigFormulaCard,
                {
                  backgroundColor: withAlpha(theme.surface, 0.78),
                  borderColor: withAlpha(theme.accent, 0.18),
                  transform: [{ translateY: cardFloatY }],
                },
              ]}>
              <Text style={[s.formulaCardLabel, { color: theme.muted }]}>
                {isAr ? 'الفكرة الأساسية' : 'Core identity'}
              </Text>
              <Text style={[s.trigFormulaText, { color: theme.text }]}>
                {scene.formulaPrimary}
              </Text>
              <Text style={[s.trigSubText, { color: theme.accent }]}>
                {scene.formulaSecondary}
              </Text>
            </Animated.View>
          </View>
        ) : (
          <View style={s.genericScene}>
            <Animated.View
              style={[
                s.genericStageCard,
                {
                  backgroundColor: withAlpha(theme.surface, 0.78),
                  borderColor: withAlpha(theme.accent, 0.18),
                  transform: [{ translateY: cardFloatY }],
                },
              ]}>
              <Text style={[s.formulaCardLabel, { color: theme.muted }]}>
                {isAr ? 'عنوان الدرس' : 'Lesson title'}
              </Text>
              <Text style={[s.genericTitle, { color: theme.text }, isAr && s.textRight]}>
                {stabilizeMixedMathText(scene.formulaPrimary, isAr)}
              </Text>
              <Text style={[s.genericSub, { color: theme.accent }, isAr && s.textRight]}>
                {stabilizeMixedMathText(scene.formulaSecondary, isAr)}
              </Text>
            </Animated.View>
          </View>
        )}
      </View>

      <View style={[s.segmentRow, isAr && s.rowRtl]}>
        {SEGMENT_PILLS.map((segment) => (
          <View
            key={segment.en}
            style={[
              s.segmentPill,
              {
                backgroundColor: withAlpha(theme.surface, 0.72),
                borderColor: withAlpha(theme.border, 0.9),
              },
              isAr && s.rowRtl,
            ]}>
            <Ionicons name={segment.icon as any} size={12} color={theme.accent} />
            <Text style={[s.segmentText, { color: theme.text }]}>
              {isAr ? segment.ar : segment.en}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[s.footerText, { color: theme.muted }, isAr && s.textRight]}>
        {stabilizeMixedMathText(isAr ? scene.footerAr : scene.footerEn, isAr)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
    gap: 12,
  },
  sweep: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 120,
    height: 240,
    borderRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kickerText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Amiri_400Regular',
  },
  lead: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  textRight: {
    textAlign: 'right',
  },
  stage: {
    minHeight: 210,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 1,
  },
  gridLineTop: {
    top: 58,
  },
  gridLineBottom: {
    bottom: 54,
  },
  gridColumn: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    width: 1,
    right: '34%',
  },
  factorScene: {
    gap: 18,
  },
  formulaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  formulaCardLabel: {
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
    marginBottom: 6,
  },
  formulaCardFormula: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Amiri_700Bold',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  linkCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCardText: {
    fontSize: 20,
    fontFamily: 'Amiri_700Bold',
  },
  trigScene: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circleWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
  },
  axisX: {
    position: 'absolute',
    width: 64,
    height: 1,
  },
  axisY: {
    position: 'absolute',
    width: 1,
    height: 64,
  },
  orbitWrap: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
  },
  orbitDot: {
    marginTop: 3,
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  trigFormulaCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  trigFormulaText: {
    fontSize: 19,
    lineHeight: 28,
    fontFamily: 'Amiri_700Bold',
  },
  trigSubText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Amiri_400Regular',
  },
  genericScene: {
    justifyContent: 'center',
  },
  genericStageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  genericTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Amiri_700Bold',
  },
  genericSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
});
