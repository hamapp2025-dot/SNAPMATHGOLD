import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import type { AppTheme } from '../src/theme/themes';

type VisibleRouteName = 'index' | 'practice' | 'ai-chat' | 'profile';

type TabMeta = {
  iosActive: SFSymbol;
  iosInactive: SFSymbol;
  fallbackActive: keyof typeof Ionicons.glyphMap;
  fallbackInactive: keyof typeof Ionicons.glyphMap;
  featured?: boolean;
};

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type LuxuryTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, {
    options: {
      title?: string;
      tabBarAccessibilityLabel?: string;
      tabBarTestID?: string;
    };
  }>;
  navigation: any;
  insets: {
    bottom: number;
    left?: number;
    right?: number;
  };
  theme: AppTheme;
  isAr: boolean;
};

const TAB_META: Record<VisibleRouteName, TabMeta> = {
  index: {
    iosActive: 'house.fill',
    iosInactive: 'house',
    fallbackActive: 'home',
    fallbackInactive: 'home-outline',
  },
  practice: {
    iosActive: 'square.and.pencil',
    iosInactive: 'square.and.pencil',
    fallbackActive: 'create',
    fallbackInactive: 'create-outline',
  },
  'ai-chat': {
    iosActive: 'sparkles',
    iosInactive: 'sparkles',
    fallbackActive: 'sparkles',
    fallbackInactive: 'sparkles-outline',
    featured: true,
  },
  profile: {
    iosActive: 'person.crop.circle.fill',
    iosInactive: 'person.crop.circle',
    fallbackActive: 'person',
    fallbackInactive: 'person-outline',
  },
};

const HIDDEN_PARENT_ROUTE: Partial<Record<string, VisibleRouteName>> = {
  leaderboard: 'profile',
};

function isVisibleRouteName(name: string): name is VisibleRouteName {
  return name in TAB_META;
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex.startsWith('#')) return hex;
  const raw = hex.slice(1);
  const normalized = raw.length === 3
    ? raw.split('').map((ch) => ch + ch).join('')
    : raw;
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TabGlyph({
  meta,
  focused,
  color,
  size,
}: {
  meta: TabMeta;
  focused: boolean;
  color: string;
  size: number;
}) {
  const fallbackName = focused ? meta.fallbackActive : meta.fallbackInactive;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={focused ? meta.iosActive : meta.iosInactive}
        tintColor={color}
        size={size}
        type="monochrome"
        weight={focused ? 'bold' : 'regular'}
        fallback={<Ionicons name={fallbackName} size={size} color={color} />}
      />
    );
  }

  return <Ionicons name={fallbackName} size={size} color={color} />;
}

function LuxuryTabButton({
  label,
  focused,
  meta,
  theme,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  focused: boolean;
  meta: TabMeta;
  theme: AppTheme;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}) {
  const activeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: focused ? 1 : 0,
      stiffness: 220,
      damping: 18,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [activeAnim, focused]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      speed: 28,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  const lift = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const focusScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const iconColor = focused ? theme.primaryInk : theme.muted;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.buttonPressable}>
      <Animated.View
        style={[
          styles.buttonSlot,
          {
            transform: [
              { translateY: lift },
              { scale: focusScale },
            ],
          },
        ]}>
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
          {focused ? (
            <LinearGradient colors={[...theme.primary]} style={[styles.activeBubble, { shadowColor: theme.accent }]}>
              <TabGlyph meta={meta} focused={focused} color={iconColor} size={27} />
            </LinearGradient>
          ) : (
            <View style={styles.regularBubble}>
              <TabGlyph meta={meta} focused={focused} color={iconColor} size={24} />
            </View>
          )}
        </Animated.View>

        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: focused ? theme.accent : theme.muted },
          ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function LuxuryTabBar({
  state,
  descriptors,
  navigation,
  insets,
  theme,
  isAr,
}: LuxuryTabBarProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const activeRouteName = state.routes[state.index]?.name;
  const selectedRouteName = isVisibleRouteName(activeRouteName)
    ? activeRouteName
    : HIDDEN_PARENT_ROUTE[activeRouteName];

  const visibleRoutes = state.routes.filter((route): route is TabRoute & { name: VisibleRouteName } =>
    isVisibleRouteName(route.name)
  );

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8);
  const glassBg = hexToRgba(
    theme.surface,
    Platform.OS === 'ios'
      ? theme.id === 'light'
        ? 0.88
        : 0.72
      : theme.id === 'light'
        ? 0.98
        : 0.96
  );
  const outerGlow = hexToRgba(theme.accent, theme.id === 'light' ? 0.08 : 0.18);
  const topSheen = hexToRgba('#FFFFFF', theme.id === 'light' ? 0.42 : 0.08);

  return (
    <View style={[styles.outerWrap, { paddingBottom: bottomInset }]}>
      <View style={[styles.frame, { marginHorizontal: 12 }]}>
        {/* The glass card stays clipped for blur while the button layer can float above it. */}
        <View
          style={[
            styles.glassCard,
            {
              backgroundColor: glassBg,
              borderColor: hexToRgba(theme.accent, 0.16),
              shadowColor: outerGlow,
            },
          ]}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={72}
              tint={theme.id === 'light' ? 'light' : 'dark'}
              style={StyleSheet.absoluteFillObject}
            />
          ) : null}
          <LinearGradient
            colors={[
              hexToRgba(theme.accent, 0.2),
              'transparent',
              hexToRgba(theme.text, theme.id === 'light' ? 0.03 : 0.02),
            ]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.topSheen, { backgroundColor: topSheen }]} />
        </View>

        <View style={[styles.rowOverlay, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          {visibleRoutes.map((route, orderIndex) => {
            const focused = selectedRouteName === route.name;
            const isActiveRoute = activeRouteName === route.name;
            const options = descriptors[route.key]?.options ?? {};
            const meta = TAB_META[route.name];
            const label = typeof options.title === 'string' ? options.title : route.name;

            const onPress = () => {
              Haptics.impactAsync(
                meta.featured
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Light
              ).catch(() => {});

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isActiveRoute && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              Haptics.selectionAsync().catch(() => {});
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <LuxuryTabButton
                key={`${route.key}-${orderIndex}`}
                label={label}
                focused={focused}
                meta={meta}
                theme={theme}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  frame: {
    height: 104,
    overflow: 'visible',
  },
  glassCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 86,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  topSheen: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 0,
    height: 1,
  },
  rowOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    bottom: 10,
    direction: 'ltr',
    alignItems: 'flex-end',
  },
  buttonPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonSlot: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
  },
  regularBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowOpacity: 0,
  },
  activeBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  label: {
    fontSize: 12.5,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
    opacity: 0.96,
  },
});
