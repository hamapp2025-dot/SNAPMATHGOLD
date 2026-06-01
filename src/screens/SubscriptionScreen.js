// src/screens/SubscriptionScreen.js - theme, LanguageContext, RTL
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import {
  BG,
  SURFACE,
  SURFACE_BORDER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  GOLD,
  GOLD_BUTTON_GRADIENT,
  GOLD_BTN_TEXT,
  GOLD_TINT,
  FONTS,
  TYPE_SCALE,
} from '../config/theme';

// Renders price with amount in white and " / month" or " / year" in muted
function PriceText({ price }) {
  const match = price.match(/^(.+?)(\s*\/\s*month|\s*\/\s*year)?$/);
  const amount = match ? match[1].trim() : price;
  const suffix = match && match[2] ? match[2] : '';
  return (
    <Text style={[s.billingPriceWrap, { fontFamily: FONTS.bodyEn }]}>
      <Text style={s.billingPriceAmount}>{amount}</Text>
      {suffix ? <Text style={s.billingPriceSuffix}>{suffix}</Text> : null}
    </Text>
  );
}

function getPlans(t) {
  return [
    {
      id: 'standard',
      nameKey: 'planStandard',
      features: [
        { key: 'featureAccessLessons', included: true },
        { key: 'featureUnlimitedAI', included: false },
      ],
      billing: [
        { id: 'monthly', labelKey: 'billingMonthly', priceKey: 'price29Month', save: null },
        { id: 'annual', labelKey: 'billingAnnual', priceKey: 'price199Year', saveKey: 'save50' },
      ],
    },
    {
      id: 'tawjihi',
      nameKey: 'planTawjihi',
      features: [{ key: 'featureAllFeatures', included: true }],
      billing: [{ id: 'onetime', labelKey: 'billingOnetime', priceKey: 'price79', save: null }],
    },
  ];
}

export default function SubscriptionScreen({ navigation }) {
  const { t, isAr } = useT();
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [selectedBilling, setSelectedBilling] = useState({ standard: 'annual', tawjihi: 'onetime' });
  const [hasCurrentPlan] = useState(false);

  const rowDir = isAr ? 'row-reverse' : 'row';
  const textAlign = isAr ? 'right' : 'left';
  const PLANS = getPlans(t);

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={[s.header, { flexDirection: rowDir }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <LanguageToggle />
          <Text style={[s.headerTitle, { fontFamily: FONTS.headingEn, textAlign, flex: 1 }]}>{t('subTitle')}</Text>
          <View style={s.headerRight} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {hasCurrentPlan && (
            <View style={s.currentCard}>
              <Text style={[s.currentLabel, { fontFamily: FONTS.semiEn }]}>{t('currentPlan')}</Text>
              <Text style={[s.currentPlanName, { fontFamily: FONTS.headingEn }]}>{t('standardPlan')}</Text>
              <Text style={[s.currentRenewal, { fontFamily: FONTS.bodyEn, fontVariant: ['tabular-nums'] }]}>{t('renewsDate')}</Text>
              <TouchableOpacity style={[s.cancelBtn, isAr && { left: 20, right: undefined }]}>
                <Text style={[s.cancelBtnText, { fontFamily: FONTS.semiEn }]}>{t('cancelLabel')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[s.sectionTitle, { fontFamily: FONTS.headingEn, textAlign }]}>{t('changeYourPlan')}</Text>

          {PLANS.map((plan) => (
            <View key={plan.id} style={s.planCard}>
              <Text style={[s.planName, { fontFamily: FONTS.headingEn, textAlign }]}>{t(plan.nameKey)}</Text>

              {plan.features.map((f, i) => (
                <View key={i} style={[s.featureRow, { flexDirection: rowDir }]}>
                  {f.included ? (
                    <Ionicons name="checkmark" size={16} color={GOLD} />
                  ) : (
                    <Ionicons name="close" size={16} color={TEXT_TERTIARY} />
                  )}
                  <Text style={[s.featureText, { fontFamily: FONTS.bodyEn }, !f.included && s.featureExcluded, { textAlign }]}>
                    {t(f.key)}
                  </Text>
                </View>
              ))}

              <View style={s.billingWrap}>
                {plan.billing.map((b) => {
                  const key = `${plan.id}-${b.id}`;
                  const isSelected = selectedPlan === plan.id && selectedBilling[plan.id] === b.id;
                  const priceStr = t(b.priceKey);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.billingRow, isSelected && s.billingRowSelected, { flexDirection: rowDir }]}
                      onPress={() => { setSelectedPlan(plan.id); setSelectedBilling((prev) => ({ ...prev, [plan.id]: b.id })); }}
                      activeOpacity={0.8}
                    >
                      {b.saveKey ? (
                        <View style={[s.saveBadge, isAr && { left: undefined, right: 12 }]}>
                          <Text style={[s.saveBadgeText, { fontFamily: FONTS.headingEn }]}>{t(b.saveKey)}</Text>
                        </View>
                      ) : null}
                      <Text style={[s.billingLabel, { fontFamily: FONTS.semiEn, flex: 1, textAlign }]}>{t(b.labelKey)}</Text>
                      <PriceText price={priceStr} />
                      {isSelected ? (
                        <View style={s.checkFilled}>
                          <Ionicons name="checkmark" size={14} color={GOLD_BTN_TEXT} />
                        </View>
                      ) : (
                        <View style={s.checkEmpty} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <TouchableOpacity style={s.changeBtn}>
            <LinearGradient colors={GOLD_BUTTON_GRADIENT.colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.changeBtnGradient}>
              <Text style={[s.changeBtnText, { fontFamily: FONTS.headingEn }]}>{t('changeSubscription')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[s.legal, { fontFamily: FONTS.bodyEn, textAlign: 'center' }]}>
            {t('restorePurchases')} · {t('terms')} · {t('privacy')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: BG,
    gap: 12,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 8 },
  headerTitle: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, fontWeight: '700' },
  headerRight: { width: 44, alignItems: 'center', justifyContent: 'center', padding: 8 },

  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  currentCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  currentLabel: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },
  currentPlanName: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.h2, fontWeight: '700' },
  currentRenewal: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.bodySmall, marginTop: 4 },
  cancelBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  cancelBtnText: { color: TEXT_PRIMARY, fontSize: 14 },

  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: TYPE_SCALE.h1,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },

  planCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
  },
  planName: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.h2, marginBottom: 12, fontWeight: '700' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureText: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.body },
  featureExcluded: { color: TEXT_TERTIARY },
  billingWrap: { marginTop: 16 },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TEXT_TERTIARY,
    marginBottom: 8,
    position: 'relative',
  },
  billingRowSelected: {
    borderColor: GOLD,
    backgroundColor: GOLD_TINT,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: { color: GOLD_BTN_TEXT, fontSize: 11, letterSpacing: 0.5, fontWeight: '700' },
  billingLabel: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body },
  billingPriceWrap: { fontSize: TYPE_SCALE.body },
  billingPriceAmount: { color: TEXT_PRIMARY },
  billingPriceSuffix: { color: TEXT_SECONDARY },
  checkFilled: {
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TEXT_TERTIARY,
  },

  changeBtn: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 16,
  },
  changeBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBtnText: { color: GOLD_BTN_TEXT, fontSize: TYPE_SCALE.body, fontWeight: '700' },
  legal: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    textAlign: 'center',
  },
});
