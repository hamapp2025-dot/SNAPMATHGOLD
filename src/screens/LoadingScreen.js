// src/screens/LoadingScreen.js - Splash/loading while fonts + data load
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedLogo from '../components/AnimatedLogo';
import { supabase } from '../config/supabase';
import { useT } from '../config/LanguageContext';
import { BG, TEXT_PRIMARY, TEXT_SECONDARY, FONTS, TYPE_SCALE } from '../config/theme';

const MIN_DISPLAY_MS = 2000;

export default function LoadingScreen({ onFinish }) {
  const { isAr } = useT();
  const [dataReady, setDataReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDataReady(true);
      return;
    }

    supabase
      .from('chapters')
      .select('id')
      .limit(1)
      .then(() => setDataReady(true))
      .catch(() => setDataReady(true));
  }, []);

  useEffect(() => {
    if (!dataReady || !minElapsed) return;
    onFinish?.();
  }, [dataReady, minElapsed, onFinish]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(subOpacity, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.safe}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.container}>
          <AnimatedLogo size={100} showParticles={true} showPulse={true} />
          <Animated.Text style={[s.appName, { opacity: textOpacity }]}>
            {isAr ? 'سناب ماث أكاديمي' : 'SnapMath Academy'}
          </Animated.Text>
          <Animated.Text style={[s.tagline, { opacity: subOpacity }]}>
            {isAr ? 'رحلة الصف الثاني عشر' : 'Grade 12 learning journey'}
          </Animated.Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: FONTS.headingEn,
    fontSize: TYPE_SCALE.h2,
    color: TEXT_PRIMARY,
    marginTop: 24,
  },
  tagline: {
    fontFamily: FONTS.bodyEn,
    fontSize: TYPE_SCALE.bodySmall,
    color: TEXT_SECONDARY,
    marginTop: 8,
  },
});
