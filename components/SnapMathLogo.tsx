import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PREMIUM_GOLD,
  PREMIUM_GOLD_DEEP,
  premiumGoldTint,
} from '../src/theme/premiumGold';
import { useOptionalAppTheme } from '../src/theme/ThemeContext';
import { withAlpha } from '../src/theme/colorUtils';

type Props = {
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
};

export default function SnapMathLogo({ size = 84, showLabel = true, animate = false }: Props) {
  const themeCtx = useOptionalAppTheme();
  const theme = themeCtx?.theme;
  const ring      = Math.round(size * 0.07);
  const integralSize = Math.round(size * 0.52);
  const snapSize  = Math.round(size * 0.17);
  const outerGradient = theme ? [theme.logoGradient[0], theme.logoGradient[1]] : ['#DEC06D', '#B8952A'];
  const glowColor = theme?.accent ?? PREMIUM_GOLD;
  const shellShadow = theme?.logoShadow ?? PREMIUM_GOLD_DEEP;
  const glyphColor = theme?.logoGlyph ?? '#FFFFFF';
  const microGlyph = theme ? withAlpha(theme.logoGlyph, theme.id === 'light' ? 0.9 : 0.75) : 'rgba(255,255,255,0.75)';
  const labelMainColor = theme?.accent ?? PREMIUM_GOLD;
  const labelSubColor = theme ? withAlpha(theme.accent, theme.id === 'light' ? 0.62 : 0.55) : premiumGoldTint(0.55);
  const innerBackground = theme
    ? withAlpha(theme.id === 'light' ? '#0A346A' : theme.bg, theme.id === 'light' ? 0.2 : 0.28)
    : 'rgba(10,8,2,0.28)';
  const innerBorder = theme ? withAlpha(theme.logoGlyph, theme.id === 'light' ? 0.26 : 0.32) : 'rgba(255,255,255,0.32)';

  // Pulse / entrance animation
  const scaleAnim = useRef(new Animated.Value(animate ? 0.7 : 1)).current;
  const opacAnim  = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const glowAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14 }),
        Animated.timing(opacAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
    // Persistent gentle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.12, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, [animate]);

  return (
    <Animated.View style={[st.wrap, { opacity: opacAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          st.glowRing,
          {
            width: size + 28,
            height: size + 28,
            borderRadius: (size + 28) / 2,
            shadowColor: glowColor,
            transform: [{ scale: glowAnim }],
          },
        ]}
      />

      <LinearGradient
        colors={outerGradient as [string, string]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[st.outer, { width: size, height: size, borderRadius: size / 2, shadowColor: shellShadow }]}>
        {/* Inner frosted ring */}
        <View
          style={[
            st.inner,
            {
              width: size - ring * 2,
              height: size - ring * 2,
              borderRadius: (size - ring * 2) / 2,
              backgroundColor: innerBackground,
              borderColor: innerBorder,
            },
          ]}>
          {/* ∫ symbol */}
          <Text
            style={[st.integral, { fontSize: integralSize, lineHeight: integralSize * 1.1, color: glyphColor }]}
            allowFontScaling={false}>
            ∫
          </Text>
          {/* SM micro label */}
          <Text
            style={[st.smLabel, { fontSize: snapSize, letterSpacing: snapSize * 0.15, color: microGlyph }]}
            allowFontScaling={false}>
            SM
          </Text>
        </View>
      </LinearGradient>

      {showLabel ? (
        <View style={st.labelWrap}>
          <Text style={[st.labelMain, { color: labelMainColor }]} allowFontScaling={false}>SnapMath</Text>
          <Text style={[st.labelSub, { color: labelSubColor }]}  allowFontScaling={false}>ACADEMY</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

// Keep legacy export alias so PlaceholderLogo imports still work
export { SnapMathLogo as PlaceholderLogoCompat };

const st = StyleSheet.create({
  wrap: { alignItems: 'center' },

  glowRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },

  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },

  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  integral: {
    fontWeight: '300',
    textAlign: 'center',
    includeFontPadding: false,
    marginBottom: -4,
  },

  smLabel: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: 2,
  },

  labelWrap: { alignItems: 'center', marginTop: 14 },
  labelMain: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: 'Amiri_700Bold',
  },
  labelSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 2,
  },
});
