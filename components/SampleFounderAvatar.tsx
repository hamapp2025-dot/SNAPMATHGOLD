import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { AppTheme } from '../src/theme/themes';
import { withAlpha } from '../src/theme/colorUtils';

type SampleFounderAvatarProps = {
  theme: AppTheme;
  initials: string;
  size?: number;
};

export default function SampleFounderAvatar({
  theme,
  initials,
  size = 54,
}: SampleFounderAvatarProps) {
  const cameraBadgeSize = Math.max(16, Math.round(size * 0.34));
  const cameraIconSize = Math.max(10, Math.round(size * 0.18));
  const accentDotSize = Math.max(8, Math.round(size * 0.15));

  return (
    <LinearGradient
      colors={[
        withAlpha(theme.primary[0], 0.3),
        withAlpha(theme.accent, 0.18),
        withAlpha(theme.primary[1], 0.24),
      ]}
      style={[
        s.shell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: withAlpha(theme.accent, 0.28),
        },
      ]}>
      <View
        style={[
          s.glow,
          {
            borderRadius: size / 2,
            backgroundColor: withAlpha(theme.accent, 0.18),
          },
        ]}
      />

      <View
        style={[
          s.cameraBadge,
          {
            width: cameraBadgeSize,
            height: cameraBadgeSize,
            borderRadius: cameraBadgeSize / 2,
            backgroundColor: withAlpha(theme.bg, 0.74),
            borderColor: withAlpha(theme.accent, 0.24),
          },
        ]}>
        <Ionicons name="sparkles-outline" size={cameraIconSize} color={theme.accent} />
      </View>

      <Text
        style={[
          s.initials,
          {
            color: theme.primaryInk,
            fontSize: Math.max(16, Math.round(size * 0.34)),
            lineHeight: Math.max(20, Math.round(size * 0.4)),
          },
        ]}>
        {initials}
      </Text>

      <View
        style={[
          s.accentDot,
          {
            width: accentDotSize,
            height: accentDotSize,
            borderRadius: accentDotSize / 2,
            backgroundColor: theme.accent,
          },
        ]}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    margin: 5,
  },
  cameraBadge: {
    position: 'absolute',
    top: 5,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    fontFamily: 'Amiri_700Bold',
    letterSpacing: 0.4,
  },
  accentDot: {
    position: 'absolute',
    bottom: 7,
    left: 8,
    opacity: 0.92,
  },
});
