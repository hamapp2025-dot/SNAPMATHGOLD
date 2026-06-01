import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GOLD, GOLD_LIGHT } from '../config/theme';

export default function AnimatedLogo({ size = 84, showParticles = false, showPulse = true }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const particles = useMemo(
    () => [...Array(6)].map(() => ({ x: Math.random() * 1.6 - 0.8, y: Math.random() * 1.6 - 0.8 })),
    []
  );

  useEffect(() => {
    if (showPulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, useNativeDriver: true })
    ).start();
  }, [scale, spin, showPulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringSize = Math.round(size * 1.15);
  const barW = Math.max(6, Math.round(size * 0.09));
  const gap = Math.round(size * 0.06);

  return (
    <View style={[s.wrap, { width: size * 2, height: size * 2 }]}>
      <Animated.View style={{ transform: [{ rotate }], position: 'absolute' }}>
        <View style={[s.ring, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]} />
      </Animated.View>

      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={[GOLD, GOLD_LIGHT]} style={[s.logo, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[s.inner, { gap }]}>
            <View style={[s.bar, { width: barW, height: size * 0.36 }]} />
            <View style={[s.bar, { width: barW, height: size * 0.5 }]} />
            <View style={[s.bar, { width: barW, height: size * 0.28 }]} />
          </View>
        </LinearGradient>
      </Animated.View>

      {showParticles
        ? particles.map((p, i) => (
            <View
              key={i}
              style={[
                s.particle,
                {
                  left: size + p.x * size * 0.6,
                  top: size + p.y * size * 0.6,
                  opacity: 0.28,
                },
              ]}
            />
          ))
        : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    borderStyle: 'dashed',
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bar: {
    backgroundColor: '#121521',
    borderRadius: 8,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
