import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SURFACE, SURFACE_BORDER } from '../config/theme';

export default function CardBackground({ style, contentStyle, children }) {
  return (
    <View style={[s.card, style]}>
      <View style={[s.inner, contentStyle]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    borderRadius: 18,
  },
  inner: {},
});
