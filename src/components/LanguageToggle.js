import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useT } from '../config/LanguageContext';
import { useAppTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/colorUtils';

const ENGLISH_FONT_FAMILY = Platform.select({
  ios: 'AvenirNext-DemiBold',
  android: 'sans-serif-medium',
  default: undefined,
});

export default function LanguageToggle() {
  const { lang, setLang, t, isAr } = useT();
  const { theme } = useAppTheme();
  const options = [
    {
      key: 'en',
      label: t('langEn'),
      accessibilityLabel: isAr ? 'اللغة الإنجليزية' : 'English',
    },
    {
      key: 'ar',
      label: t('langAr'),
      accessibilityLabel: isAr ? 'اللغة العربية' : 'Arabic',
    },
  ];

  return (
    <View
      style={[
        s.wrap,
        {
          backgroundColor: withAlpha(theme.surface, theme.id === 'light' ? 0.92 : 0.9),
          borderColor: withAlpha(theme.accent, theme.id === 'light' ? 0.18 : 0.28),
          shadowColor: theme.logoShadow,
        },
      ]}>
      {options.map((option) => {
        const selected = lang === option.key;

        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityState={{ selected }}
            style={[
              s.btn,
              selected && { backgroundColor: theme.accent },
            ]}
            onPress={() => setLang(option.key)}>
            <Text
              numberOfLines={1}
              style={[
                s.label,
                option.key === 'en' ? s.labelEn : s.labelAr,
                { color: selected ? theme.primaryInk : theme.text },
                selected && s.labelActive,
              ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    direction: 'ltr',
    borderWidth: 1,
    borderRadius: 18,
    padding: 3,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  btn: {
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 74,
  },
  label: {
    fontSize: 12,
    fontFamily: ENGLISH_FONT_FAMILY,
    letterSpacing: 0.2,
  },
  labelEn: {
    fontFamily: ENGLISH_FONT_FAMILY,
    letterSpacing: 0.2,
  },
  labelAr: {
    fontFamily: ENGLISH_FONT_FAMILY,
    letterSpacing: 0.2,
  },
  labelActive: {
    transform: [{ scale: 1.02 }],
  },
});
