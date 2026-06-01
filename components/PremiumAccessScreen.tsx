import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import {
  getFeatureGateContent,
  getFeatureGateHighlights,
  getFeatureShortLabel,
  getTierLabel,
  getTierRequirementLabel,
  type SubscriptionFeatureKey,
} from '../src/subscriptions/subscriptionAccess';
import { withAlpha } from '../src/theme/colorUtils';

type PremiumAccessScreenProps = {
  feature: SubscriptionFeatureKey;
};

export default function PremiumAccessScreen({ feature }: PremiumAccessScreenProps) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { currentTier } = useSubscription();
  const { requiredTier, icon, title, body } = getFeatureGateContent(feature, isAr);
  const currentPlanLabel = getTierLabel(currentTier, isAr);
  const requiredPlanLabel = getTierRequirementLabel(requiredTier, isAr);
  const featureLabel = getFeatureShortLabel(feature, isAr);
  const highlights = getFeatureGateHighlights(feature, isAr);

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={[withAlpha(theme.primary[0], 0.16), withAlpha(theme.primary[1], 0.08), 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />

      <View
        style={[
          s.card,
          {
            backgroundColor: withAlpha(theme.surface, theme.id === 'light' ? 0.96 : 0.92),
            borderColor: withAlpha(theme.accent, 0.18),
            shadowColor: theme.logoShadow,
          },
        ]}>
        <LinearGradient
          colors={[withAlpha(theme.accent, 0.18), withAlpha(theme.primary[1], 0.08)]}
          style={s.iconShell}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={32} color={theme.accent} />
        </LinearGradient>

        <View style={[s.badgeRow, isAr && s.rowRtl]}>
          <View style={[s.badge, { backgroundColor: withAlpha(theme.primary[0], 0.12), borderColor: withAlpha(theme.primary[0], 0.18) }]}>
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={theme.primary[0]} />
            <Text style={[s.badgeText, { color: theme.primary[0] }]}>{featureLabel}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.2) }]}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.accent} />
            <Text style={[s.badgeText, { color: theme.accent }]}>
              {requiredPlanLabel}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: withAlpha(theme.text, 0.06), borderColor: theme.border }]}>
            <Text style={[s.badgeText, { color: theme.muted }]}>
              {isAr ? `خطتك الحالية: ${currentPlanLabel}` : `Current plan: ${currentPlanLabel}`}
            </Text>
          </View>
        </View>

        <Text style={[s.title, { color: theme.text }, isAr && s.textRtl]}>{title}</Text>
        <Text style={[s.body, { color: theme.muted }, isAr && s.textRtl]}>{body}</Text>

        <View style={[s.highlightCard, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
          <Text style={[s.highlightTitle, { color: theme.text }, isAr && s.textRtl]}>
            {isAr ? `ماذا ستحصل عند الترقية إلى ${getTierLabel(requiredTier, isAr)}؟` : `What unlocks with ${getTierLabel(requiredTier, isAr)}?`}
          </Text>
          {highlights.map((item) => (
            <View key={item} style={[s.highlightRow, isAr && s.rowRtl]}>
              <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
              <Text style={[s.highlightText, { color: theme.muted }, isAr && s.textRtl]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={s.actionStack}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: '/subscription',
                params: { recommendedTier: requiredTier, focusFeature: feature },
              })
            }>
            <LinearGradient colors={theme.primary} style={s.primaryButton}>
              <Text style={[s.primaryButtonText, { color: theme.primaryInk }]}>
                {isAr ? `عرض خطة ${getTierLabel(requiredTier, isAr)}` : `View ${getTierLabel(requiredTier, isAr)}`}
              </Text>
              <Ionicons
                name={isAr ? 'arrow-back' : 'arrow-forward'}
                size={16}
                color={theme.primaryInk}
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            style={[s.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}
            onPress={() => router.replace('/(tabs)')}>
            <Text style={[s.secondaryButtonText, { color: theme.text }]}>
              {isAr ? 'العودة إلى الرئيسية' : 'Back to Home'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  iconShell: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Amiri_700Bold',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Amiri_400Regular',
    marginBottom: 22,
  },
  highlightCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  highlightTitle: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
    marginBottom: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
  textRtl: {
    textAlign: 'right',
  },
  actionStack: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
});
