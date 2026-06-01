import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SunburstHeader() {
  return (
    <View pointerEvents="none" style={s.wrap}>
      <LinearGradient
        colors={['rgba(240,40,143,0.28)', 'rgba(245,154,59,0.14)', 'rgba(11,13,34,0)']}
        locations={[0, 0.55, 1]}
        style={s.glow}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  glow: {
    flex: 1,
  },
});
