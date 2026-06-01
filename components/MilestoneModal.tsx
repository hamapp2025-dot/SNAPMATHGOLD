/**
 * MilestoneModal — animated congratulations pop-up for level-ups and streak milestones.
 * Uses a simple "burst" of emoji confetti + a scale-in card animation.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#C9A84C';
const GOLD_DARK = '#8A6B20';

const CONFETTI = ['*', '*', '*', '*', '*', '*', '*', '*'];

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
};

export default function MilestoneModal({ visible, title, subtitle, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const confettiAnims = useRef(
    CONFETTI.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      confettiAnims.forEach((a, i) => {
        const dx = (Math.random() - 0.5) * 200;
        const dy = -(60 + Math.random() * 180);
        const delay = i * 50;
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(a.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.spring(a.translateX, { toValue: dx, useNativeDriver: true, friction: 5 }),
            Animated.spring(a.translateY, { toValue: dy, useNativeDriver: true, friction: 5 }),
            Animated.timing(a.rotate, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
          Animated.timing(a.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnims.forEach((a) => {
        a.opacity.setValue(0);
        a.translateY.setValue(0);
        a.translateX.setValue(0);
        a.rotate.setValue(0);
      });
    }
  }, [visible, confettiAnims, opacityAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={s.backdropTouch} activeOpacity={1} onPress={onClose} />

        {confettiAnims.map((a, i) => (
          <Animated.Text
            key={i}
            style={[
              s.confettiPiece,
              {
                opacity: a.opacity,
                transform: [
                  { translateX: a.translateX },
                  { translateY: a.translateY },
                  {
                    rotate: a.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${(Math.random() - 0.5) * 360}deg`],
                    }),
                  },
                ],
              },
            ]}>
            {CONFETTI[i]}
          </Animated.Text>
        ))}

        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={[GOLD, GOLD_DARK]} style={s.cardGrad}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <View style={s.iconCircle}>
              <Ionicons name="trophy" size={38} color="#1B1D30" />
            </View>

            <Text style={s.titleText}>{title}</Text>
            <Text style={s.subtitleText}>{subtitle}</Text>

            <TouchableOpacity style={s.ctaBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={s.ctaText}>Keep it up!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropTouch: { ...StyleSheet.absoluteFillObject },
  confettiPiece: {
    position: 'absolute',
    fontSize: 26,
    top: '50%',
    left: '50%',
  },
  card: {
    width: 300,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
  },
  cardGrad: { padding: 28, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 14, right: 14, padding: 4 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 20,
  },
  ctaBtn: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
