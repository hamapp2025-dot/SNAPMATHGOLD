import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useXP } from '../src/hooks/useXP';
import { withAlpha } from '../src/theme/colorUtils';

const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';
const GREEN = '#2ED573';

const INVITE_LINK = 'snapmathacademy.com';
const KEY_REFERRALS = '@snapmath_referral_count';

// Milestone tiers: [referralCount, bonusXP, labelEn, labelAr]
const MILESTONES: [number, number, string, string][] = [
  [1, 50, 'First Referral', 'أول إحالة'],
  [3, 100, '3 Friends Joined', '3 أصدقاء'],
  [5, 200, 'Star Referrer', 'نجم الإحالة'],
  [10, 500, 'Champion', 'بطل الإحالة'],
  [20, 1000, 'Legend', 'أسطورة الإحالة'],
];

function StepBubble({ num, title, sub, isAr }: { num: string; title: string; sub: string; isAr: boolean }) {
  const { theme } = useAppTheme();
  return (
    <View style={[st.stepRow, isAr && { flexDirection: 'row-reverse' }]}>
      <View style={[st.numCircle, { backgroundColor: withAlpha(theme.accent, 0.13), borderColor: withAlpha(theme.accent, 0.33) }]}>
        <Text style={[st.numText, { color: theme.accent }]}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.stepTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>{title}</Text>
        <Text style={[st.stepSub, { color: theme.muted }, isAr && { textAlign: 'right' }]}>{sub}</Text>
      </View>
    </View>
  );
}

function MilestoneTier({
  count, bonus, labelEn, labelAr, reached, isAr,
}: {
  count: number; bonus: number; labelEn: string; labelAr: string; reached: boolean; isAr: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={[st.milestoneRow, isAr && { flexDirection: 'row-reverse' }, reached && st.milestoneReached]}>
      <View style={[st.milestoneBadge, reached && { backgroundColor: withAlpha(theme.accent, 0.2), borderColor: theme.accent }]}>
        <Ionicons name={reached ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={reached ? theme.accent : theme.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.milestoneLabel, { color: theme.text }, isAr && { textAlign: 'right' }]}>
          {isAr ? labelAr : labelEn}
        </Text>
        <Text style={[st.milestoneSub, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
          {isAr ? `${count} إحالات · +${bonus} XP` : `${count} referrals · +${bonus} XP`}
        </Text>
      </View>
      {reached && (
        <View style={[st.reachedChip, { backgroundColor: withAlpha(theme.accent, 0.13), borderColor: withAlpha(theme.accent, 0.33) }]}>
          <Text style={[st.reachedText, { color: theme.accent }]}>{isAr ? 'محقق' : 'Done'}</Text>
        </View>
      )}
    </View>
  );
}

export default function ReferralScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT() as any;
  const { addXP } = useXP();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY_REFERRALS).then((v) => {
      if (v) setReferrals(parseInt(v, 10));
    });
  }, []);

  const unlockedXp = MILESTONES
    .filter(([count]) => referrals >= count)
    .reduce((sum, [, bonus]) => sum + bonus, 0);
  const nextMilestone = MILESTONES.find(([count]) => count > referrals);
  const nextCount = nextMilestone?.[0] ?? 20;
  const toNext = Math.max(0, nextCount - referrals);
  const progressPct = Math.min((referrals / nextCount) * 100, 100);

  async function handleCopy() {
    await Clipboard.setStringAsync(INVITE_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare() {
    try {
      await Share.share({
        message: t('referralShareMessage', { link: INVITE_LINK }),
        url: `https://${INVITE_LINK}`,
      });
    } catch (_) {}
  }

  async function handleSimulateReferral() {
    // Demo: press to add a referral and award XP for reaching milestones
    const newCount = referrals + 1;
    setReferrals(newCount);
    await AsyncStorage.setItem(KEY_REFERRALS, String(newCount));

    // Check if a milestone was just reached
    const milestone = MILESTONES.find(([count]) => count === newCount);
    if (milestone) {
      const [, bonus, labelEn, labelAr] = milestone;
      await addXP(bonus);
      Alert.alert(
        t('referralMilestoneTitle'),
        t('referralMilestoneBody', { label: isAr ? labelAr : labelEn, bonus })
      );
    }
  }

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, isAr && s.rowRtl]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: theme.text }]}>{t('referralTitle')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero banner */}
        <LinearGradient colors={theme.primary} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.hero}>
          <View style={s.heroIconCircle}>
            <Ionicons name="gift" size={34} color={theme.primaryInk} />
          </View>
          <Text style={[s.heroTitle, { color: theme.primaryInk }]}>{t('referralHeroTitle')}</Text>
          <Text style={[s.heroSub, { color: withAlpha(theme.primaryInk, 0.78) }]}>{t('referralHeroSub')}</Text>
        </LinearGradient>

        {/* Stats row — real data */}
        <View style={[s.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: theme.accent }]}>{referrals}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{t('referralReferred')}</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: theme.accent }]}>{unlockedXp}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>{t('referralEarned')}</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: theme.border }]} />
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: GREEN }]}>{toNext}</Text>
            <Text style={[s.statLabel, { color: theme.muted }]}>
              {t('referralToNextBonus')}
            </Text>
          </View>
        </View>

        {/* Invite link card */}
        <View style={[s.linkCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[s.linkLabel, { color: theme.muted }]}>{t('referralInviteLink')}</Text>
          <View style={[s.linkBox, { borderColor: withAlpha(theme.accent, 0.33) }]}>
            <Text style={[s.linkText, { color: theme.text }]} numberOfLines={1}>{INVITE_LINK}</Text>
            <TouchableOpacity onPress={handleCopy} style={[s.copyBtn, { borderColor: withAlpha(theme.accent, 0.33) }, copied && [s.copyBtnDone, { backgroundColor: theme.accent, borderColor: theme.accent }]]} activeOpacity={0.8}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={copied ? theme.primaryInk : theme.accent} />
              <Text style={[s.copyText, { color: theme.accent }, copied && { color: theme.primaryInk }]}>
                {copied ? t('referralCopied') : t('referralCopy')}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.88} style={s.shareWrap}>
            <LinearGradient colors={theme.primary} style={s.shareBtn}>
              <Ionicons name="share-social-outline" size={19} color={theme.primaryInk} />
              <Text style={[s.shareText, { color: theme.primaryInk }]}>{t('referralShareLink')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Progress bar to next milestone */}
        <View style={[s.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.progressHeaderRow, isAr && { flexDirection: 'row-reverse' }]}>
            <Text style={[s.progressTitle, { color: theme.text }]}>
              {t('referralProgressTo', { label: nextMilestone ? (isAr ? nextMilestone[3] : nextMilestone[2]) : t('referralLegend') })}
            </Text>
            <Text style={[s.progressPct, { color: theme.accent }]}>{referrals}/{nextCount}</Text>
          </View>
          <View style={[s.progressTrack, { backgroundColor: theme.surfaceSoft }]}>
            <LinearGradient
              colors={theme.primary}
              style={[s.progressFill, { width: `${progressPct}%` as any }]}
            />
          </View>
          <Text style={[s.progressNote, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
            {toNext === 0
              ? t('referralMilestoneReached')
              : t(toNext === 1 ? 'referralToNextSingle' : 'referralToNextCount', { count: toNext })}
          </Text>
        </View>

        {/* XP Milestones */}
        <Text style={[s.sectionTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
          {t('referralXpMilestones')}
        </Text>
        <View style={[s.milestonesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {MILESTONES.map(([count, bonus, labelEn, labelAr]) => (
            <MilestoneTier
              key={count}
              count={count}
              bonus={bonus}
              labelEn={labelEn}
              labelAr={labelAr}
              reached={referrals >= count}
              isAr={isAr}
            />
          ))}
        </View>

        {/* Demo: simulate a referral */}
        <TouchableOpacity
          style={[s.demoBtn, { borderColor: withAlpha(theme.accent, 0.27) }]}
          onPress={handleSimulateReferral}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={16} color={theme.muted} />
          <Text style={[s.demoBtnText, { color: theme.muted }]}>
            {t('referralDemo')}
          </Text>
        </TouchableOpacity>

        {/* How it works */}
        <Text style={[s.sectionTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
          {t('referralHowItWorks')}
        </Text>
        <>
          <StepBubble num="1" title={t('referralStep1Title')} sub={t('referralStep1Sub')} isAr={isAr} />
          <StepBubble num="2" title={t('referralStep2Title')} sub={t('referralStep2Sub')} isAr={isAr} />
          <StepBubble num="3" title={t('referralStep3Title')} sub={t('referralStep3Sub')} isAr={isAr} />
          <StepBubble num="4" title={t('referralStep4Title')} sub={t('referralStep4Sub')} isAr={isAr} />
        </>

        <Text style={[s.terms, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
          {t('referralTerms')}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  numCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numText: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  stepTitle: { color: WHITE, fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 2 },
  stepSub: { color: MUTED, fontSize: 13, lineHeight: 19, fontFamily: 'Amiri_400Regular' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  milestoneReached: {},
  milestoneBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  milestoneLabel: { color: MUTED, fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  milestoneSub: { color: MUTED, fontSize: 11, fontFamily: 'Amiri_400Regular', marginTop: 1 },
  reachedChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  reachedText: { fontSize: 11, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 58 : 36, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  rowRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  hero: { borderRadius: 22, padding: 22, alignItems: 'center', marginBottom: 16 },
  heroIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { color: '#1B1D30', fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  heroSub: { color: 'rgba(27,29,48,0.75)', fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20, fontFamily: 'Amiri_400Regular' },

  statsRow: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16, alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  statLabel: { fontSize: 11, marginTop: 2, fontFamily: 'Amiri_400Regular', textAlign: 'center' },
  statDivider: { width: 1, height: 36 },

  linkCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  linkLabel: { fontSize: 12, marginBottom: 10, fontFamily: 'Amiri_400Regular', letterSpacing: 0.3 },
  linkBox: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { flex: 1, fontSize: 13, fontFamily: 'Amiri_400Regular' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  copyBtnDone: {},
  copyText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  shareWrap: { marginTop: 14 },
  shareBtn: { borderRadius: 16, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { color: '#1B1D30', fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  progressCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', flex: 1 },
  progressPct: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressNote: { fontSize: 12, fontFamily: 'Amiri_400Regular' },

  milestonesCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingBottom: 4, marginBottom: 20 },

  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 10, marginBottom: 20 },
  demoBtnText: { fontSize: 13, fontFamily: 'Amiri_400Regular' },

  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 14 },
  terms: { fontSize: 12, lineHeight: 18, marginTop: 10, fontFamily: 'Amiri_400Regular' },
});
