import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { withAlpha } from '../src/theme/colorUtils';

type Props = {
  isReachable: boolean | null;
  errorMessage?: string | null;
};

export function NetworkStatus({ isReachable, errorMessage }: Props) {
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const slideY = useRef(new Animated.Value(-80)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const isOffline = isReachable === false;

  // Slide in when offline
  useEffect(() => {
    if (isOffline && !dismissed) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }).start();
      // Pulse the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      Animated.timing(slideY, { toValue: -80, duration: 250, useNativeDriver: true }).start();
    }
  }, [isOffline, dismissed]);

  // Auto-dismiss when reconnected
  useEffect(() => {
    if (isReachable === true) {
      setDismissed(false);
      setRetrying(false);
    }
  }, [isReachable]);

  if (!isOffline || dismissed) return null;

  const isFirebaseError = (errorMessage ?? '').toLowerCase().includes('firebase') || (errorMessage ?? '').toLowerCase().includes('firestore');
  const bg = isFirebaseError
    ? withAlpha(theme.accent, theme.id === 'light' ? 0.96 : 0.92)
    : withAlpha(theme.danger, theme.id === 'light' ? 0.94 : 0.92);
  const borderColor = isFirebaseError ? theme.primary[1] : theme.danger;

  return (
    <Animated.View style={[s.banner, isAr && s.bannerRtl, { backgroundColor: bg, borderBottomColor: borderColor, transform: [{ translateY: slideY }] }]}>
      {/* Left icon */}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Ionicons name={isFirebaseError ? 'cloud-offline-outline' : 'wifi-outline'} size={20} color="#FFF" />
      </Animated.View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={[s.title, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]}>
          {isFirebaseError ? t('networkServerTitle') : t('networkOfflineTitle')}
        </Text>
        <Text style={[s.sub, isAr ? s.textRtlFlow : s.textLtrFlow, isAr && s.textRtl]} numberOfLines={1}>
          {isFirebaseError
            ? t('networkServerBody')
            : t('networkOfflineBody')}
        </Text>
      </View>

      {/* Retry / Dismiss */}
      <View style={[s.actions, isAr && s.actionsRtl]}>
        {retrying ? (
          <View style={s.retryingDot}>
            <Ionicons name="sync-outline" size={16} color="#FFF" />
          </View>
        ) : (
          <TouchableOpacity onPress={() => setRetrying(true)} style={s.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.actionText, { color: '#FFF' }]}>{t('networkRetry')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setDismissed(true)} style={s.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.76)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1.5,
    zIndex: 9999,
  },
  bannerRtl: {
    flexDirection: 'row-reverse',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
  },
  sub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'Amiri_400Regular',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionsRtl: {
    flexDirection: 'row-reverse',
  },
  actionBtn: {
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
  },
  retryingDot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textRtl: {
    textAlign: 'right',
  },
  textRtlFlow: {
    writingDirection: 'rtl',
  },
  textLtrFlow: {
    writingDirection: 'ltr',
  },
});
