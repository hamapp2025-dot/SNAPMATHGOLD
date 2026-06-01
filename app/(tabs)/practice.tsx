import React, { useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PremiumAccessScreen from '../../components/PremiumAccessScreen';
import { useSubscription } from '../../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../../src/subscriptions/subscriptionAccess';
import type { AppTheme } from '../../src/theme/themes';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useBookmarks } from '../../src/hooks/useBookmarks';
import { withAlpha } from '../../src/theme/colorUtils';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function MenuRow({
  icon,
  colors,
  title,
  subtitle,
  onPress,
  isAr,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  title: string;
  subtitle: string;
  onPress?: () => void;
  isAr?: boolean;
  theme: AppTheme;
}) {
  const textBlock = (
    <View style={[s.menuTextWrap, isAr && s.menuTextWrapRtl]}>
      <Text style={[s.menuTitle, { color: theme.text }, isAr && s.textRtl]}>{title}</Text>
      <Text style={[s.menuSub, { color: theme.muted }, isAr && s.textRtl]}>{subtitle}</Text>
    </View>
  );

  const iconBlock = (
    <LinearGradient colors={colors} style={[s.menuIconWrap, isAr ? s.menuIconWrapRtl : s.menuIconWrapLtr]}>
      <Ionicons name={icon} size={20} color={theme.primaryInk} />
    </LinearGradient>
  );

  const chevronBlock = (
    <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={theme.muted} />
  );

  return (
    <TouchableOpacity style={[s.menuRow, { backgroundColor: theme.surface, borderColor: theme.border }]} activeOpacity={0.85} onPress={onPress}>
      {isAr ? (
        <>
          {chevronBlock}
          {textBlock}
          {iconBlock}
        </>
      ) : (
        <>
          {iconBlock}
          {textBlock}
          {chevronBlock}
        </>
      )}
    </TouchableOpacity>
  );
}

export default function PracticeScreen() {
  const { currentTier } = useSubscription();

  if (!canAccessFeature(currentTier, 'grade12Path')) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return <PracticeContent />;
}

function PracticeContent() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const { bookmarks } = useBookmarks();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lightTintOpacity = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0.16],
    extrapolate: 'clamp',
  });

  return (
    <View style={[s.container, s.layoutLtr, { backgroundColor: theme.bg }]}>
      {theme.id === 'light' ? (
        <Animated.View pointerEvents="none" style={[s.lightTintOverlay, { opacity: lightTintOpacity }]}>
          <LinearGradient
            colors={[withAlpha(theme.primary[0], 0.22), withAlpha(theme.accent, 0.14), 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      ) : null}
      <AnimatedScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}>
        <Text style={[s.title, isAr && s.textRtl, { color: theme.text }]}>{t('practiceTitle')}</Text>

        {/* Daily Challenge card */}
        <TouchableOpacity
          style={[s.challengeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          activeOpacity={0.88}
          onPress={() => router.push('/practice-session')}>
          <View style={[s.challengeBadgeSlot, isAr && s.challengeBadgeSlotRtl]}>
            <LinearGradient colors={theme.primary} style={s.challengeBadge}>
              {isAr ? (
                <>
                  <Text style={[s.challengeBadgeText, { color: theme.primaryInk }]}>{t('practiceDailyChallengeLabel')}</Text>
                  <Ionicons name="flash" size={16} color={theme.primaryInk} />
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={16} color={theme.primaryInk} />
                  <Text style={[s.challengeBadgeText, { color: theme.primaryInk }]}>{t('practiceDailyChallengeLabel')}</Text>
                </>
              )}
            </LinearGradient>
          </View>
          <Text style={[s.challengeQ, { color: theme.text }, isAr && s.textRtl]}>
            {t('practiceDailyPrompt')}
          </Text>
          <Text style={[s.challengeExpr, { color: theme.accent }]}>
            {'(3x + 1) / ((x−1)(x+2))'}
          </Text>
          <View style={[s.challengeFooter, isAr && s.challengeFooterRtl]}>
            {isAr ? (
              <>
                <View style={[s.challengeStartBtn, { backgroundColor: theme.accent }]}>
                  <Text style={[s.challengeStartText, { color: theme.primaryInk }]}>{t('practiceStartBtn')}</Text>
                  <Ionicons name="arrow-back" size={13} color={theme.primaryInk} />
                </View>
                <View style={[s.challengeMeta, s.challengeMetaRtl]}>
                  <Text style={[s.challengeMetaText, { color: theme.muted }]}>{t('practiceResetsSoon')}</Text>
                  <Ionicons name="time-outline" size={13} color={theme.muted} />
                </View>
              </>
            ) : (
              <>
                <View style={s.challengeMeta}>
                  <Ionicons name="time-outline" size={13} color={theme.muted} />
                  <Text style={[s.challengeMetaText, { color: theme.muted }]}>{t('practiceResetsSoon')}</Text>
                </View>
                <View style={[s.challengeStartBtn, { backgroundColor: theme.accent }]}>
                  <Text style={[s.challengeStartText, { color: theme.primaryInk }]}>{t('practiceStartBtn')}</Text>
                  <Ionicons name="arrow-forward" size={13} color={theme.primaryInk} />
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        <MenuRow icon="create-outline" colors={theme.primary} title={t('practiceQuickSolveTitle')} subtitle={t('practiceQuickSolveSub')} isAr={isAr} theme={theme} onPress={() => router.push('/practice-session')} />
        <MenuRow
          icon="book-outline"
          colors={theme.primary}
          title={t('practiceMathLibraryTitle')}
          subtitle={t('practiceMathLibrarySub')}
          isAr={isAr}
          theme={theme}
          onPress={() => router.push('/sound-library')}
        />
        <MenuRow
          icon="document-text-outline"
          colors={theme.primary}
          title={t('practiceExamSimTitle')}
          subtitle={t('practiceExamSimSub')}
          isAr={isAr}
          theme={theme}
          onPress={() => router.push('/(tabs)/exams')}
        />
        <MenuRow
          icon="bookmark-outline"
          colors={theme.primary}
          title={t('practiceBookmarksTitle')}
          subtitle={bookmarks.length > 0
            ? t('practiceBookmarksSaved', { count: bookmarks.length })
            : t('practiceBookmarksEmpty')
          }
          isAr={isAr}
          theme={theme}
          onPress={() => router.push('/bookmarks')}
        />

        <View style={{ height: 170 }} />
      </AnimatedScrollView>

      {/* MathScan floating pill */}
      <View style={s.scanPill}>
        <TouchableOpacity onPress={() => router.push('/mathscan')} activeOpacity={0.88}>
          <LinearGradient colors={theme.primary} style={s.scanGrad}>
            {isAr ? (
              <>
                <Text style={[s.scanText, { color: theme.primaryInk }]}>{t('practiceScanPill')}</Text>
                <Ionicons name="scan-outline" size={18} color={theme.primaryInk} style={{ marginLeft: 8 }} />
              </>
            ) : (
              <>
                <Ionicons name="scan-outline" size={18} color={theme.primaryInk} style={{ marginRight: 8 }} />
                <Text style={[s.scanText, { color: theme.primaryInk }]}>{t('practiceScanPill')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  layoutLtr: { direction: 'ltr' },
  lightTintOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 230, zIndex: 0 },
  scroll: { paddingHorizontal: 20, paddingTop: 56 },
  title: { fontSize: 24, marginTop: 8, marginBottom: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', width: '100%' },
  practiceTextCard: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardHeaderRtl: { flexDirection: 'row-reverse' },
  topIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  topIconWrapLtr: { marginRight: 10 },
  topIconWrapRtl: { marginLeft: 10 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700' , fontFamily: 'Amiri_700Bold' },
  inputMock: { backgroundColor: '#202744', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  inputPlaceholder: { color: '#949CB4', fontSize: 14, fontFamily: 'Amiri_400Regular' },
  inputBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, alignItems: 'center' },
  inputBottomRtl: { flexDirection: 'row-reverse' },
  counter: { color: '#8F95AD', fontSize: 12, fontFamily: 'Amiri_400Regular' },
  keyboardBtn: { width: 34, height: 28, borderRadius: 10, backgroundColor: '#2A3257', alignItems: 'center', justifyContent: 'center' },
  menuRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 10 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  menuIconWrapLtr: { marginRight: 12 },
  menuIconWrapRtl: { marginLeft: 12 },
  menuTextWrap: { flex: 1 },
  menuTextWrapRtl: { alignItems: 'flex-end' },
  menuTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 , fontFamily: 'Amiri_700Bold' },
  menuSub: { fontSize: 13, fontFamily: 'Amiri_400Regular', width: '100%' },
  textRtl: { textAlign: 'right' },
  scanPill: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  scanGrad: { borderRadius: 24, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  scanText: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Daily Challenge card
  challengeCard: { borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 14, overflow: 'hidden' },
  challengeBadgeSlot: { width: '100%', alignItems: 'flex-start', marginBottom: 14 },
  challengeBadgeSlotRtl: { alignItems: 'flex-end' },
  challengeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  challengeBadgeText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.5 },
  challengeQ: { fontSize: 15, fontFamily: 'Amiri_400Regular', marginBottom: 8, lineHeight: 22 },
  challengeExpr: { fontSize: 20, fontFamily: 'Amiri_700Bold', fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  challengeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  challengeFooterRtl: { flexDirection: 'row-reverse' },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  challengeMetaRtl: { flexDirection: 'row' },
  challengeMetaText: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  challengeStartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  challengeStartText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
