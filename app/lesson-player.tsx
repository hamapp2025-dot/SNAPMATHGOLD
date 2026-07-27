import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import PremiumAccessScreen from '../components/PremiumAccessScreen';
import SampleManimLesson from '../components/SampleManimLesson';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { findUnitById, findLessonById, ALL_UNITS, getLocalizedFormulaLabel } from '../src/data/grade12';
import { useXP, XP_LESSON_COMPLETE, XP_PERFECT_QUIZ } from '../src/hooks/useXP';
import { useScoreHistory } from '../src/hooks/useScoreHistory';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { getMasteryLevelForLessonCompletion, setMasteryLevel } from '../src/hooks/useMastery';
import { formatMediaDuration, getLessonMediaBlueprint, getLessonMediaStatusLabel, type LessonMediaSegmentKind } from '../src/media/lessonMedia';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { canOpenUnit } from '../src/subscriptions/subscriptionAccess';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { getLocalizedQuestionOption } from '../src/utils/questionOptions';
import { withAlpha } from '../src/theme/colorUtils';

const { width: SW } = Dimensions.get('window');
const WHITE = '#FFFFFF';
const MUTED = '#B8BED6';

const STAGES = [
  { key: 'overview', labelEn: 'Overview', labelAr: 'الدرس', icon: 'book-outline' },
  { key: 'examples', labelEn: 'Examples', labelAr: 'أمثلة', icon: 'school-outline' },
  { key: 'practice', labelEn: 'Practice', labelAr: 'تمرين', icon: 'checkmark-circle-outline' },
  { key: 'master',   labelEn: 'Master',   labelAr: 'إتقان', icon: 'ribbon-outline' },
];

function getSegmentIcon(kind: LessonMediaSegmentKind) {
  switch (kind) {
    case 'avatar_intro':
      return 'person-circle-outline';
    case 'manim_core':
      return 'shapes-outline';
    case 'worked_example':
      return 'document-text-outline';
    case 'practice_push':
      return 'flash-outline';
    case 'recap':
      return 'sparkles-outline';
    default:
      return 'play-outline';
  }
}

function getMediaStatusIcon(status: 'pilot-ready' | 'scripted' | 'planned') {
  switch (status) {
    case 'pilot-ready':
      return 'rocket-outline';
    case 'scripted':
      return 'document-text-outline';
    default:
      return 'videocam-outline';
  }
}

export default function LessonPlayerScreen() {
  const { currentTier } = useSubscription();
  const params = useLocalSearchParams<{ unitId?: string; lessonId?: string }>();
  const unitId = params.unitId ?? (params.lessonId ? findLessonById(params.lessonId)?.unit.id : undefined);

  if (!canOpenUnit(currentTier, unitId)) {
    return <PremiumAccessScreen feature="grade12Path" />;
  }

  return <LessonPlayerContent />;
}

function LessonPlayerContent() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ unitId?: string; lessonId?: string; lessonTitle?: string; startAtSec?: string }>();
  const { theme } = useAppTheme();
  const { isAr, t } = useT();
  const [activeStage, setActiveStage] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const hostedVideoRef = useRef<Video | null>(null);
  const hasAppliedInitialSeekRef = useRef(false);
  const { addXP } = useXP();
  const { addEntry } = useScoreHistory();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  // Resolve lesson from params — by lessonId or by unitId (first lesson)
  const resolved = useMemo(() => {
    if (params.lessonId) return findLessonById(params.lessonId);
    const unit = findUnitById(params.unitId);
    if (unit) return { unit, lesson: unit.lessons[0] };
    return { unit: ALL_UNITS[0], lesson: ALL_UNITS[0].lessons[0] };
  }, [params.lessonId, params.unitId]);

  const unit = resolved?.unit ?? ALL_UNITS[0];
  const lesson = resolved?.lesson ?? ALL_UNITS[0].lessons[0];

  const lessonTitle = isAr ? lesson.titleAr : lesson.titleEn;
  const unitLabel = isAr ? unit.titleAr : unit.titleEn;
  const lessonMedia = useMemo(() => getLessonMediaBlueprint(lesson, unit), [lesson, unit]);
  const lessonMediaStatus = useMemo(
    () => getLessonMediaStatusLabel(lessonMedia.status, isAr),
    [isAr, lessonMedia.status],
  );
  const totalMediaDuration = useMemo(
    () => lessonMedia.segments.reduce((sum, segment) => sum + segment.durationSec, 0),
    [lessonMedia],
  );
  const activeStageLabel = isAr ? STAGES[activeStage].labelAr : STAGES[activeStage].labelEn;
  const lessonVideoSource = lessonMedia.heroVideoSource ?? (lessonMedia.heroVideoUrl ? { uri: lessonMedia.heroVideoUrl } : null);
  const lessonPosterSource = lessonMedia.posterSource ?? (lessonMedia.posterUrl ? { uri: lessonMedia.posterUrl } : undefined);
  const requestedStartSec = useMemo(() => {
    const raw = Array.isArray(params.startAtSec) ? params.startAtSec[0] : params.startAtSec;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, 295);
  }, [params.startAtSec]);
  const showSampleManimPreview = !lessonVideoSource && !lesson.videoId;
  const coachIntroCopy = isAr ? lessonMedia.coachIntroAr : lessonMedia.coachIntroEn;
  const coachCueCopy = isAr ? lessonMedia.coachCueAr : lessonMedia.coachCueEn;
  const visualStyleCopy = isAr ? lessonMedia.visualStyleAr : lessonMedia.visualStyleEn;
  const roadmapTitle = lesson.id === 'u1-l1'
    ? (isAr ? 'خريطة الحل السريع' : 'Quick Solve Map')
    : (isAr ? 'خارطة الدرس' : 'Lesson Roadmap');
  const quickNotesTitle = lesson.id === 'u1-l1'
    ? (isAr ? 'مفاتيح الدرس' : 'Lesson Keys')
    : (isAr ? 'ملاحظات سريعة' : 'Quick Notes');
  const lessonFlowTitle = lesson.id === 'u1-l1'
    ? (isAr ? 'المسار التعليمي' : 'Learning Flow')
    : (isAr ? 'تسلسل الدرس' : 'Lesson Flow');
  const overviewPills = useMemo(() => {
    if (lesson.id === 'u1-l1') {
      return [
        { icon: 'flash-outline', label: isAr ? 'عوّض بقيمة a' : 'Substitute a first' },
        { icon: 'calculator-outline', label: isAr ? 'P(a) تعطي الباقي' : 'P(a) gives remainder' },
        { icon: 'checkmark-circle-outline', label: isAr ? 'الصفر يعني عامل' : 'Zero means factor' },
      ];
    }

    return [
      { icon: 'person-circle-outline', label: isAr ? 'افتتاحية مدرب' : 'Coach Intro' },
      { icon: 'shapes-outline', label: 'Manim' },
      { icon: 'school-outline', label: isAr ? 'صياغة أردنية' : 'Jordan Style' },
    ];
  }, [isAr, lesson.id]);
  const lessonHighlights = useMemo(() => {
    if (lesson.id === 'u1-l1') {
      return [
        isAr
          ? 'إذا كان المقسوم عليه على شكل (x - a)، فابدأ دائماً بالتعويض بقيمة a.'
          : 'If the divisor looks like (x - a), always start by substituting a.',
        isAr
          ? 'قيمة P(a) لا تعطيك خطوة وسطى فقط، بل تعطيك الباقي مباشرة.'
          : 'P(a) is not just an intermediate step; it gives the remainder directly.',
        isAr
          ? 'إذا كانت P(a)=0 فالقسمة تامة، وعندها يكون (x - a) عاملاً فوراً.'
          : 'If P(a)=0, the division is exact, so (x - a) is immediately a factor.',
      ];
    }

    return lessonMedia.transcriptPreview.map((line) =>
      stabilizeMixedMathText(isAr ? line.ar : line.en, isAr),
    );
  }, [isAr, lesson.id, lessonMedia.transcriptPreview]);

  useEffect(() => {
    hasAppliedInitialSeekRef.current = false;
  }, [lesson.id, requestedStartSec]);

  const seekHostedVideoToRequestedStart = useCallback(async () => {
    if (!requestedStartSec || hasAppliedInitialSeekRef.current || !hostedVideoRef.current) return;
    hasAppliedInitialSeekRef.current = true;
    try {
      await hostedVideoRef.current.setPositionAsync(requestedStartSec * 1000);
      await hostedVideoRef.current.playAsync();
    } catch {
      hasAppliedInitialSeekRef.current = false;
      // Leave default playback behavior intact if seek fails.
    }
  }, [requestedStartSec]);

  useEffect(() => {
    if (!requestedStartSec) return;
    const timer = setTimeout(() => {
      void seekHostedVideoToRequestedStart();
    }, 250);
    return () => clearTimeout(timer);
  }, [lesson.id, requestedStartSec, seekHostedVideoToRequestedStart]);

  const handleHostedVideoLoad = useCallback(() => {
    void seekHostedVideoToRequestedStart();
  }, [seekHostedVideoToRequestedStart]);

  const bookmarked = isBookmarked(lesson.id);

  useEffect(() => {
    setVideoPlaying(false);
    setVideoError(null);
  }, [lesson.id]);

  const toggleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(lesson.id);
      return;
    }
    await addBookmark({
      id: lesson.id,
      titleEn: lesson.titleEn,
      titleAr: lesson.titleAr,
      topicEn: unit.titleEn,
      topicAr: unit.titleAr,
      attempts: 0,
    });
  };

  const toggleReveal = (i: number) => setRevealedAnswers((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const selectAnswer = (qi: number, ai: number) => setSelectedAnswers((s) => ({ ...s, [qi]: ai }));
  const openVideo = async () => {
    if (!lesson.videoId) return;
    await Linking.openURL(`https://www.youtube.com/watch?v=${lesson.videoId}`);
  };

  const score = useMemo(() => {
    let correct = 0;
    lesson.practiceQ.forEach((q, i) => { if (selectedAnswers[i] === q.correct) correct++; });
    return { correct, total: lesson.practiceQ.length };
  }, [selectedAnswers, lesson]);
  const hasPracticeQuestions = lesson.practiceQ.length > 0;
  const answeredPracticeCount = Object.keys(selectedAnswers).length;
  const allPracticeAnswered = !hasPracticeQuestions || answeredPracticeCount === lesson.practiceQ.length;
  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: '/chapter',
      params: { unitId: unit.id },
    });
  };

  const renderVideoSection = () => (
    <View style={[s.videoWrap, { borderColor: withAlpha(theme.accent, 0.3) }]}>
      <View style={[s.videoHeader, { backgroundColor: withAlpha(theme.accent, 0.08) }, isAr && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="play-circle" size={18} color={theme.accent} />
        <Text style={[s.videoHeaderText, { color: theme.accent }]}>
          {lessonVideoSource
            ? (isAr ? 'فيديو الدرس' : 'Lesson Video')
            : lesson.videoId
              ? (isAr ? 'فيديو الدرس' : 'Lesson Video')
              : (isAr ? 'لوحة الدرس البصرية' : 'Lesson Visual Board')}
        </Text>
      </View>
      {lessonVideoSource ? (
        <View style={s.videoPlayer}>
          <Video
            ref={hostedVideoRef}
            source={lessonVideoSource}
            style={s.hostedVideo}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            useNativeControls
            usePoster={!!lessonPosterSource}
            posterSource={lessonPosterSource}
            posterStyle={s.hostedVideo}
            onLoad={handleHostedVideoLoad}
          />
        </View>
      ) : lesson.videoId && !videoError ? (
        <View style={s.videoPlayer}>
          <YoutubePlayer
            height={Math.round((SW - 40) * 9 / 16)}
            width={SW - 40}
            videoId={lesson.videoId}
            play={videoPlaying}
            onChangeState={(state) => {
              if (state === 'ended') setVideoPlaying(false);
            }}
            onError={(error) => {
              setVideoPlaying(false);
              setVideoError(error);
            }}
            webViewStyle={{ opacity: 0.99 }}
          />
        </View>
      ) : (
        <View style={[s.videoFallback, { backgroundColor: theme.surface }]}>
          {showSampleManimPreview ? (
            <SampleManimLesson
              theme={theme}
              isAr={isAr}
              lessonId={lesson.id}
              lessonTitle={lessonTitle}
            />
          ) : null}
          <Ionicons
            name={showSampleManimPreview ? 'shapes-outline' : lesson.videoId ? 'videocam-off-outline' : 'film-outline'}
            size={34}
            color={theme.accent}
          />
          <Text style={[s.videoFallbackTitle, { color: theme.text }]}>
            {lesson.videoId
              ? (isAr ? 'يتعذر تشغيل الفيديو داخل التطبيق' : 'Video unavailable in app')
              : showSampleManimPreview
                ? (isAr ? 'لوحة الدرس البصرية جاهزة' : 'Lesson visual board is ready')
                : (isAr ? 'هذا الدرس جاهز للدراسة' : 'This lesson is ready to study')}
          </Text>
          <Text style={[s.videoFallbackSub, { color: MUTED }, isAr && { textAlign: 'right' }]}>
            {lesson.videoId
              ? (isAr
                ? 'افتح الفيديو في YouTube أو أكمل الدرس من الصيغ والأمثلة والتمارين أدناه.'
                : 'Open the video in YouTube or continue with the formulas, examples, and practice below.')
              : showSampleManimPreview
                ? (isAr
                  ? 'استخدم لوحة الدرس البصرية لفهم الفكرة الأساسية ثم انتقل مباشرة إلى الأمثلة والتدريب في الأسفل.'
                  : 'Use the lesson visual board to lock the main idea first, then move straight into the examples and practice below.')
                : (isAr
                  ? 'ابدأ من الصيغ والأمثلة والتمارين أدناه لتكمل الدرس بخطوات واضحة ومباشرة.'
                  : 'Start from the formulas, worked examples, and practice below to complete the lesson in a clear step-by-step flow.')}
          </Text>
          <View style={[s.videoFallbackActions, isAr && s.rowRtl]}>
            {lesson.videoId ? (
              <TouchableOpacity activeOpacity={0.85} onPress={openVideo} style={[s.videoSecondaryBtn, { borderColor: withAlpha(theme.accent, 0.35), backgroundColor: withAlpha(theme.accent, 0.08) }]}>
                <View style={[s.videoSecondaryBtnInner, isAr && s.rowRtl]}>
                  <Ionicons name="logo-youtube" size={16} color={theme.accent} />
                  <Text style={[s.videoSecondaryBtnText, { color: theme.accent }]}>{isAr ? 'فتح في YouTube' : 'Open in YouTube'}</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity activeOpacity={0.9} onPress={() => setActiveStage(1)} style={s.videoPrimaryBtn}>
              <LinearGradient colors={theme.primary} style={[s.videoPrimaryBtnGrad, isAr && s.rowRtl]}>
                <Text style={[s.videoPrimaryBtnText, { color: theme.primaryInk }]}>{isAr ? 'الانتقال إلى الأمثلة' : 'Go to Examples'}</Text>
                <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={16} color={theme.primaryInk} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      {/* ── Accent header bar ── */}
      <LinearGradient colors={theme.primary} style={s.headerBar}>
        <View style={[s.headerRow, isAr && s.headerRowRtl]}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={WHITE} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerSymbol} numberOfLines={2}>{lessonTitle}</Text>
            <Text style={s.headerSub} numberOfLines={1}>{isAr ? unit.titleAr : unit.titleEn}</Text>
          </View>
          <TouchableOpacity style={s.backBtn} onPress={toggleBookmark}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Stage pills */}
        <View style={s.stagesWrap}>
          <View style={[s.stagesRow, isAr && s.stagesRowRtl]}>
            {STAGES.map((st, i) => (
              <TouchableOpacity
                key={st.key}
                style={[s.stagePill, isAr && s.stagePillRtl, i === activeStage && s.stagePillActive]}
                onPress={() => setActiveStage(i)}
                activeOpacity={0.8}>
                <Ionicons name={st.icon as any} size={13} color={i === activeStage ? theme.primaryInk : 'rgba(255,255,255,0.72)'} style={[s.stagePillIcon, isAr && s.stagePillIconRtl]} />
                <Text numberOfLines={1} style={[s.stagePillText, i === activeStage && s.stagePillTextActive, i === activeStage && { color: theme.primaryInk }]}>
                  {isAr ? st.labelAr : st.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {activeStage === 0 ? renderVideoSection() : null}

        <View style={[s.snapshotCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.snapshotTop, isAr && s.rowRtl]}>
            <View style={[s.snapshotBadge, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.22) }, isAr && s.rowRtl]}>
              <Ionicons name="compass-outline" size={14} color={theme.accent} />
              <Text style={[s.snapshotBadgeText, { color: theme.accent }]}>{isAr ? 'خطة الدرس' : 'Lesson Plan'}</Text>
            </View>
            <Text style={[s.snapshotStage, { color: theme.accent }]}>
              {isAr ? `المرحلة ${activeStage + 1}/${STAGES.length}` : `Stage ${activeStage + 1}/${STAGES.length}`}
            </Text>
          </View>
          <Text style={[s.snapshotTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
            {activeStageLabel}
          </Text>
          <View style={[s.snapshotMetaRow, isAr && s.rowRtl]}>
            {[
              { icon: 'time-outline', label: formatMediaDuration(totalMediaDuration, isAr) },
              { icon: 'document-text-outline', label: isAr ? `${lesson.keyFormulas.length} صيغ` : `${lesson.keyFormulas.length} formulas` },
              { icon: 'help-circle-outline', label: isAr ? `${lesson.practiceQ.length} أسئلة` : `${lesson.practiceQ.length} questions` },
            ].map((item) => (
              <View key={item.label} style={[s.snapshotMetaPill, { backgroundColor: withAlpha(theme.text, 0.04), borderColor: theme.border }, isAr && s.snapshotMetaPillRtl]}>
                <Ionicons name={item.icon as any} size={14} color={theme.muted} />
                <Text style={[s.snapshotMetaText, { color: theme.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── OVERVIEW tab ── */}
        {activeStage === 0 && (
          <>
            <View style={[s.mediaBlueprintCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.22) }]}>
              <LinearGradient
                colors={[withAlpha(theme.accent, 0.16), withAlpha(theme.accent, 0.02)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.mediaBlueprintGlow}
              />
              <View style={[s.mediaBlueprintTop, isAr && s.rowRtl]}>
                <View style={[s.mediaStatusPill, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.22) }, isAr && s.rowRtl]}>
                  <Ionicons name={getMediaStatusIcon(lessonMedia.status) as any} size={14} color={theme.accent} />
                  <Text style={[s.mediaStatusText, { color: theme.accent }]}>{lessonMediaStatus}</Text>
                </View>
                <View style={[s.mediaMetaPill, { backgroundColor: withAlpha(theme.bg, 0.45), borderColor: theme.border }, isAr && s.rowRtl]}>
                  <Ionicons name="time-outline" size={13} color={theme.muted} />
                  <Text style={[s.mediaMetaText, { color: theme.muted }]}>
                    {formatMediaDuration(totalMediaDuration, isAr)}
                  </Text>
                </View>
              </View>

              <Text style={[s.mediaTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                {roadmapTitle}
              </Text>
              <Text style={[s.mediaIntro, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                {stabilizeMixedMathText(coachIntroCopy, isAr)}
              </Text>
              <Text style={[s.mediaCue, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
                {stabilizeMixedMathText(coachCueCopy, isAr)}
              </Text>

              <View style={[s.mediaPillsRow, isAr && s.rowRtl]}>
                {overviewPills.map((pill) => (
                  <View
                    key={pill.label}
                    style={[
                      s.mediaPill,
                      {
                        backgroundColor: withAlpha(theme.bg, 0.4),
                        borderColor: withAlpha(theme.border, 0.8),
                      },
                      isAr && s.rowRtl,
                    ]}>
                    <Ionicons name={pill.icon as any} size={14} color={theme.accent} />
                    <Text style={[s.mediaPillText, { color: theme.text }]}>{pill.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={[s.mediaDirection, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
                {stabilizeMixedMathText(visualStyleCopy, isAr)}
              </Text>

              {!lessonVideoSource ? (
                <View style={s.samplePreviewCard}>
                  <SampleManimLesson
                    theme={theme}
                    isAr={isAr}
                    lessonId={lesson.id}
                    lessonTitle={lessonTitle}
                  />
                </View>
              ) : null}

              <View style={[s.transcriptCard, { backgroundColor: withAlpha(theme.bg, 0.38), borderColor: theme.border }]}>
                <Text style={[s.transcriptTitle, { color: theme.accent }, isAr && { textAlign: 'right' }]}>
                  {quickNotesTitle}
                </Text>
                {lessonHighlights.map((line, index) => (
                  <View key={`${lesson.id}-highlight-${index}`} style={[s.highlightLine, isAr && s.highlightLineRtl]}>
                    <View style={[s.highlightIconWrap, { backgroundColor: withAlpha(theme.accent, 0.14) }]}>
                      <Ionicons name="checkmark" size={12} color={theme.accent} />
                    </View>
                    <Text style={[s.highlightText, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                      {line}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[s.mediaSectionTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                {lessonFlowTitle}
              </Text>
              <View style={s.mediaSegmentList}>
                {lessonMedia.segments.map((segment, index) => (
                  <View
                    key={segment.id}
                    style={[
                      s.mediaSegmentRow,
                      {
                        backgroundColor: withAlpha(theme.bg, 0.28),
                        borderColor: withAlpha(theme.accent, 0.12),
                      },
                      isAr && s.mediaSegmentRowRtl,
                    ]}>
                    <View style={[s.mediaSegmentIndex, { backgroundColor: withAlpha(theme.accent, 0.14), borderColor: withAlpha(theme.accent, 0.22) }]}>
                      <Text style={[s.mediaSegmentIndexText, { color: theme.accent }]}>{index + 1}</Text>
                    </View>
                    <View style={s.mediaSegmentBody}>
                      <View style={[s.mediaSegmentHeader, isAr && s.mediaSegmentHeaderRtl]}>
                        <View style={[s.mediaSegmentTitleWrap, isAr && s.rowRtl]}>
                          <Ionicons name={getSegmentIcon(segment.kind) as any} size={15} color={theme.accent} />
                          <Text style={[s.mediaSegmentTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
                            {isAr ? segment.titleAr : segment.titleEn}
                          </Text>
                        </View>
                        <Text style={[s.mediaSegmentDuration, { color: theme.muted }]}>
                          {formatMediaDuration(segment.durationSec, isAr)}
                        </Text>
                      </View>
                      <Text style={[s.mediaSegmentObjective, { color: theme.muted }, isAr && { textAlign: 'right' }]}>
                        {stabilizeMixedMathText(isAr ? segment.objectiveAr : segment.objectiveEn, isAr)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[s.sectionLabel, { color: theme.text }]}>{isAr ? 'الصيغ الأساسية' : 'Key Formulas'}</Text>
            <View style={s.formulasWrap}>
              {lesson.keyFormulas.map((f, i) => (
                <View key={i} style={[s.formulaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[s.formulaRow, isAr && s.formulaRowRtl]}>
                    <View style={[s.formulaNumWrap, { backgroundColor: theme.accent }]}>
                      <Text style={[s.formulaNum, { color: theme.primaryInk }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.formulaLabel, { color: MUTED, textAlign: isAr ? 'right' : 'left' }]}>
                        {getLocalizedFormulaLabel(f.label, isAr, i)}
                      </Text>
                      <Text style={[s.formulaText, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
                        {stabilizeMixedMathText(f.formula, isAr)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Lesson list for this unit */}
            <Text style={[s.sectionLabel, { color: theme.text, marginTop: 8 }]}>{isAr ? 'دروس هذه الوحدة' : 'Lessons in This Unit'}</Text>
            <View style={s.lessonList}>
              {unit.lessons.map((l, i) => (
                <TouchableOpacity
                  key={l.id}
                  style={[s.lessonRow, { backgroundColor: theme.surface, borderColor: l.id === lesson.id ? theme.accent : theme.border }, isAr && s.lessonRowRtl]}
                  activeOpacity={0.85}
                  onPress={() => router.replace({ pathname: '/lesson-player', params: { unitId: unit.id, lessonId: l.id } })}>
                  <View style={[s.lessonNum, { backgroundColor: l.id === lesson.id ? theme.accent : theme.surfaceSoft }]}>
                    <Text style={[s.lessonNumText, { color: l.id === lesson.id ? theme.primaryInk : MUTED }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.lessonRowTitle, { color: l.id === lesson.id ? theme.accent : theme.text, flex: 1, textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
                    {isAr ? l.titleAr : l.titleEn}
                  </Text>
                  {l.id === lesson.id && <Ionicons name="play-circle" size={20} color={theme.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── EXAMPLES tab ── */}
        {activeStage === 1 && (
          <>
            <Text style={[s.sectionLabel, { color: theme.text }]}>{isAr ? 'أمثلة محلولة' : 'Worked Examples'}</Text>
            <View style={s.examplesWrap}>
              {lesson.examples.map((ex, i) => (
                <View key={i} style={[s.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[s.exHeader, isAr && s.exHeaderRtl]}>
                    <View style={[s.exNum, { backgroundColor: theme.accent }]}><Text style={[s.exNumText, { color: theme.primaryInk }]}>{i + 1}</Text></View>
                    <Text
                      style={[
                        s.exQ,
                        { color: theme.text, textAlign: isAr ? 'right' : 'left' },
                        isAr ? s.textRtlFlow : s.textLtrFlow,
                      ]}>
                      {stabilizeMixedMathText(isAr ? ex.qAr : ex.qEn, isAr)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.exRevealBtn, revealedAnswers.has(i) && { borderTopColor: theme.accent }]}
                    onPress={() => toggleReveal(i)}>
                    {revealedAnswers.has(i) ? (
                      <Text style={[s.exAnswerText, { color: theme.accent }]}>
                        {stabilizeMixedMathText((isAr ? ex.answerAr : ex.answerEn) ?? ex.answer ?? '', isAr)}
                      </Text>
                    ) : (
                      <View style={[s.exRevealRow, isAr && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="eye-outline" size={16} color={MUTED} />
                        <Text style={s.exRevealLabel}>{isAr ? 'اضغط لعرض الجواب' : 'Tap to reveal answer'}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── PRACTICE tab ── */}
        {activeStage === 2 && (
          <>
            <Text style={[s.sectionLabel, { color: theme.text }]}>{isAr ? 'تمارين تفاعلية' : 'Practice Questions'}</Text>
            <View style={s.examplesWrap}>
              {lesson.practiceQ.map((q, qi) => (
                <View key={qi} style={[s.practiceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[s.exHeader, isAr && s.exHeaderRtl]}>
                    <View style={s.exNum}><Text style={s.exNumText}>{isAr ? `س${qi + 1}` : `Q${qi + 1}`}</Text></View>
                    <Text
                      style={[
                        s.exQ,
                        { color: theme.text, textAlign: isAr ? 'right' : 'left' },
                        isAr ? s.textRtlFlow : s.textLtrFlow,
                      ]}>
                      {stabilizeMixedMathText(isAr ? q.qAr : q.qEn, isAr)}
                    </Text>
                  </View>
                  <View style={s.optionsWrap}>
                    {q.options.map((opt, ai) => {
                      const selected = selectedAnswers[qi] === ai;
                      const revealed = selectedAnswers[qi] !== undefined;
                      const isCorrect = ai === q.correct;
                      const localizedOption = getLocalizedQuestionOption(opt, isAr);
                      let bg = theme.surfaceSoft;
                      let border = theme.border;
                      let textColor = theme.text;
                      if (revealed && selected && isCorrect) { bg = 'rgba(46,213,115,0.15)'; border = '#2ED573'; textColor = '#2ED573'; }
                      else if (revealed && selected && !isCorrect) { bg = 'rgba(255,59,48,0.12)'; border = '#FF3B30'; textColor = '#FF3B30'; }
                      else if (revealed && isCorrect) { bg = 'rgba(46,213,115,0.10)'; border = '#2ED573'; textColor = '#2ED573'; }
                      return (
                        <TouchableOpacity
                          key={ai}
                          style={[
                            s.optionBtn,
                            isAr && s.optionBtnRtl,
                            { backgroundColor: bg, borderColor: border },
                          ]}
                          onPress={() => selectAnswer(qi, ai)}
                          disabled={revealed}
                          activeOpacity={0.8}>
                          <Text
                            style={[
                              s.optionText,
                              { color: textColor, textAlign: isAr ? 'right' : 'left' },
                              isAr ? s.textRtlFlow : s.textLtrFlow,
                            ]}>
                            {stabilizeMixedMathText(localizedOption, isAr)}
                          </Text>
                          {revealed && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#2ED573" />}
                          {revealed && selected && !isCorrect && <Ionicons name="close-circle" size={18} color="#FF3B30" />}
                        </TouchableOpacity>
                      );
                    })}
                    {selectedAnswers[qi] !== undefined && ((isAr ? q.explanationAr : q.explanationEn) ?? null) ? (
                      <View
                        style={[
                          s.practiceExplainCard,
                          { backgroundColor: withAlpha(theme.accent, 0.08), borderColor: withAlpha(theme.accent, 0.2) },
                          isAr && s.practiceExplainCardRtl,
                        ]}>
                        <Ionicons name="bulb-outline" size={16} color={theme.accent} />
                        <Text
                          style={[
                            s.practiceExplainText,
                            { color: theme.text, textAlign: isAr ? 'right' : 'left' },
                            isAr ? s.textRtlFlow : s.textLtrFlow,
                          ]}>
                          {stabilizeMixedMathText((isAr ? q.explanationAr : q.explanationEn) ?? '', isAr)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Score pill */}
            {Object.keys(selectedAnswers).length === lesson.practiceQ.length && lesson.practiceQ.length > 0 && (
              <View style={[s.scorePill, { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.33) }]}>
                <Text style={[s.scoreText, { color: theme.accent }]}>
                  {isAr ? `نتيجتك: ${score.correct}/${score.total}` : `Score: ${score.correct}/${score.total}`}
                  {score.correct === score.total ? ' 🎉' : ''}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── MASTER tab ── */}
        {activeStage === 3 && (
          <>
            <Text style={[s.sectionLabel, { color: theme.text }]}>{isAr ? 'ملخص الدرس' : 'Lesson Summary'}</Text>
            <View style={[s.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[s.summaryTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
                {isAr ? lesson.titleAr : lesson.titleEn}
              </Text>
              {lesson.keyFormulas.map((f, i) => (
                <View key={i} style={[s.summaryRow, isAr && s.summaryRowRtl]}>
                  <View style={[s.summaryDot, { backgroundColor: theme.accent }]} />
                  <Text style={[s.summaryFormula, { color: MUTED, textAlign: isAr ? 'right' : 'left' }]}>
                      <Text style={{ color: theme.accent, fontFamily: 'Amiri_700Bold' }}>
                        {`${getLocalizedFormulaLabel(f.label, isAr, i)}: `}
                    </Text>
                    {stabilizeMixedMathText(f.formula, isAr)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[s.masteryCard, { backgroundColor: theme.surface, borderColor: withAlpha(theme.accent, 0.33) }]}>
              <Ionicons name="ribbon" size={40} color={theme.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={[s.masteryTitle, { color: theme.text }]}>{isAr ? 'جاهز للاختبار؟' : 'Ready for the test?'}</Text>
              <Text style={[s.masterySub, { color: MUTED }]}>
                {isAr ? 'أكملت جميع مراحل هذا الدرس. تحقق من تقدمك!' : 'You\'ve completed all stages. Check your progress!'}
              </Text>
              {!allPracticeAnswered ? (
                <Text style={[s.practiceRequiredNote, { color: theme.accent }]}>
                  {isAr
                    ? 'أجب عن جميع أسئلة التمرين أولاً قبل إنهاء الدرس والحصول على XP.'
                    : 'Answer all practice questions first before completing the lesson and earning XP.'}
                </Text>
              ) : null}
            </View>
          </>
        )}

        {/* ── CTA ── */}
        <TouchableOpacity
          style={s.practiceBtn}
          activeOpacity={0.9}
          onPress={async () => {
            if (completed) return;
            if (activeStage < STAGES.length - 1) {
              setActiveStage(activeStage + 1);
            } else {
              if (!allPracticeAnswered) {
                Alert.alert(
                  isAr ? 'أكمل التمارين أولاً' : 'Finish practice first',
                  isAr
                    ? 'أجب عن جميع أسئلة التمرين قبل إنهاء الدرس.'
                    : 'Please answer all practice questions before completing the lesson.',
                );
                setActiveStage(2);
                return;
              }
              // Last stage — award XP and show completion overlay
              const perfect = score.correct === score.total && score.total > 0;
              const xp = XP_LESSON_COMPLETE + (perfect ? XP_PERFECT_QUIZ : 0);
              const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 100;
              const masteryLevel = getMasteryLevelForLessonCompletion(score.correct, score.total);
              await addXP(xp);
              await setMasteryLevel(lesson.id, masteryLevel).catch(() => {});
              await addEntry({
                type: 'lesson',
                lessonId: lesson.id,
                unitId: unit.id,
                titleEn: lesson.titleEn,
                titleAr: lesson.titleAr,
                score: pct,
                correct: score.correct,
                total: score.total > 0 ? score.total : 1,
                xpEarned: xp,
              });
              setXpEarned(xp);
              setCompleted(true);
              Animated.spring(celebrateAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
            }
          }}>
          <LinearGradient colors={theme.primary} style={[s.practiceBtnGrad, isAr && s.rowRtl]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[s.practiceBtnText, { color: theme.primaryInk }]}>
              {activeStage < STAGES.length - 1
                ? (isAr ? 'التالي' : 'Next Stage')
                : !allPracticeAnswered
                  ? (isAr ? 'أكمل التمارين أولاً' : 'Finish Practice First')
                  : (isAr ? 'إنهاء الدرس' : 'Complete Lesson')}
            </Text>
            <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={20} color={theme.primaryInk} />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Skip modal */}
      {showModal && (
        <View style={s.modalBackdrop}>
          <View style={[s.modal, { backgroundColor: theme.surface }]}>
            <Ionicons name="albums-outline" size={48} color="#E6E6E6" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[s.modalTitle, { color: theme.text }, isAr && { textAlign: 'right' }]}>
              {isAr ? 'هل ننتقل إلى التدريب؟' : 'Move to practice?'}
            </Text>
            <View style={[s.modalActions, isAr && s.rowRtl]}>
              <TouchableOpacity style={s.exitBtn} onPress={() => setShowModal(false)}>
                <Text style={s.exitText}>{isAr ? 'خروج' : 'Exit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/lesson-summary',
                    params: {
                      lessonId: lesson.id,
                      unitId: unit.id,
                      lessonTitle: lesson.titleEn,
                      lessonTitleAr: lesson.titleAr,
                    },
                  })
                }
                style={{ flex: 1 }}>
                <LinearGradient colors={theme.primary} style={s.skipBtn}>
                  <Text style={[s.skipText, { color: theme.primaryInk }]}>{t('skip')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Completion celebration overlay ── */}
      {completed && (
        <View style={s.celebrateBackdrop}>
          <Animated.View style={[s.celebrateCard, {
            backgroundColor: theme.surface,
            borderColor: withAlpha(theme.accent, 0.35),
            transform: [{ scale: celebrateAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            opacity: celebrateAnim,
          }]}>
            <Text style={s.celebrateEmoji}>🎉</Text>
            <Text style={[s.celebrateTitle, { color: theme.text }]}>
              {isAr ? 'أحسنت! أتممت الدرس' : 'Lesson Complete!'}
            </Text>
            <Text style={[s.celebrateSub, { color: MUTED }]}>
              {isAr ? `حصلت على ${xpEarned} نقطة XP` : `+${xpEarned} XP earned`}
            </Text>
            <LinearGradient colors={theme.primary} style={[s.celebrateXpBadge, isAr && s.rowRtl]}>
              <Ionicons name="star" size={16} color={theme.primaryInk} />
              <Text style={[s.celebrateXpText, { color: theme.primaryInk }]}>+{xpEarned} XP</Text>
            </LinearGradient>
            <TouchableOpacity
              style={s.celebrateBtn}
              activeOpacity={0.9}
              onPress={() => router.push({
                pathname: '/lesson-summary',
                params: {
                  lessonId: lesson.id,
                  unitId: unit.id,
                  lessonTitle: lesson.titleEn,
                  lessonTitleAr: lesson.titleAr,
                  xpEarned: String(xpEarned),
                },
              })}>
              <LinearGradient colors={theme.primary} style={[s.celebrateBtnGrad, isAr && s.rowRtl]}>
                <Text style={[s.celebrateBtnText, { color: theme.primaryInk }]}>{isAr ? 'عرض الملخص' : 'View Summary'}</Text>
                <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={theme.primaryInk} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} style={{ marginTop: 10 }}>
              <Text style={[s.celebrateDismiss, { color: MUTED }]}>{isAr ? 'العودة للوحدة' : 'Back to Unit'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const PANEL_W = (SW - 20 * 2 - 10) / 2;

const s = StyleSheet.create({
  root: { flex: 1 },

  headerBar: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerRowRtl: { flexDirection: 'row-reverse' },
  backBtn: { width: 36, alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  headerSymbol: { color: WHITE, fontSize: 16, fontWeight: '700', fontFamily: 'Cairo_700Bold', textAlign: 'center', lineHeight: 22 },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 11, marginTop: 2, fontFamily: 'Amiri_400Regular', textAlign: 'center' },

  stagesWrap: { marginTop: 2 },
  stagesRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 2, paddingBottom: 4 },
  stagesRowRtl: { flexDirection: 'row-reverse' },
  stagePill: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  stagePillRtl: { flexDirection: 'row-reverse' },
  stagePillActive: { backgroundColor: 'rgba(255,255,255,0.92)' },
  stagePillIcon: { marginRight: 4 },
  stagePillIconRtl: { marginRight: 0, marginLeft: 4 },
  stagePillText: { flexShrink: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', fontFamily: 'Amiri_700Bold' },
  stagePillTextActive: { fontFamily: 'Amiri_700Bold' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  snapshotCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  snapshotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  snapshotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  snapshotBadgeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  snapshotStage: {
    fontSize: 13,
    fontFamily: 'Amiri_700Bold',
  },
  snapshotTitle: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
    marginBottom: 12,
  },
  snapshotMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  snapshotMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  snapshotMetaPillRtl: {
    flexDirection: 'row-reverse',
  },
  snapshotMetaText: {
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
  },
  sectionLabel: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 12, marginTop: 4 },

  // Formulas
  formulasWrap: { gap: 10, marginBottom: 24 },

  // Video
  mediaBlueprintCard: { position: 'relative', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20, overflow: 'hidden' },
  mediaBlueprintGlow: { ...StyleSheet.absoluteFillObject },
  mediaBlueprintTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  mediaStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  mediaStatusText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaMetaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  mediaMetaText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 8 },
  mediaIntro: { fontSize: 15, lineHeight: 24, fontFamily: 'Amiri_400Regular' },
  mediaCue: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', marginTop: 8, marginBottom: 12 },
  mediaPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  mediaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  mediaPillText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaDirection: { fontSize: 13, lineHeight: 21, fontFamily: 'Amiri_400Regular', marginBottom: 14 },
  samplePreviewCard: { marginBottom: 16 },
  samplePreviewTop: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  samplePreviewPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  samplePreviewPillText: { fontSize: 11, fontFamily: 'Amiri_700Bold' },
  samplePreviewDuration: { fontSize: 12, fontFamily: 'Amiri_700Bold' },
  samplePreviewPlayWrap: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  samplePreviewTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center' },
  samplePreviewSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', textAlign: 'center', marginTop: 6, marginBottom: 12 },
  samplePreviewChipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  samplePreviewChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  samplePreviewChipText: { fontSize: 11, fontFamily: 'Amiri_700Bold' },
  transcriptCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  transcriptTitle: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 10, letterSpacing: 0.4 },
  highlightLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  highlightLineRtl: { flexDirection: 'row-reverse' },
  highlightIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  highlightText: { flex: 1, fontSize: 13, lineHeight: 21, fontFamily: 'Amiri_400Regular' },
  mediaSectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 10 },
  mediaSegmentList: { gap: 10 },
  mediaSegmentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  mediaSegmentRowRtl: { flexDirection: 'row-reverse' },
  mediaSegmentIndex: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mediaSegmentIndexText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaSegmentBody: { flex: 1 },
  mediaSegmentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  mediaSegmentHeaderRtl: { flexDirection: 'row-reverse' },
  mediaSegmentTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  mediaSegmentTitle: { flex: 1, fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaSegmentDuration: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  mediaSegmentObjective: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  videoWrap: { marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  videoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  videoHeaderText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.3 },
  videoPlayer: { backgroundColor: '#000', borderRadius: 0, overflow: 'hidden', alignItems: 'center' },
  hostedVideo: { width: '100%', height: Math.min(620, Math.round((SW - 40) * 16 / 9)), alignSelf: 'center' },
  videoFallback: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20 },
  videoFallbackTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center', marginTop: 10 },
  videoFallbackSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', textAlign: 'center', marginTop: 8, maxWidth: 320 },
  videoFallbackActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  videoPrimaryBtn: { flex: 1, minWidth: 0 },
  videoPrimaryBtnGrad: { minHeight: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  videoPrimaryBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  videoSecondaryBtn: { flex: 1, minWidth: 0, borderRadius: 22, borderWidth: 1 },
  videoSecondaryBtnInner: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  videoSecondaryBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  formulaCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  formulaRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  formulaRowRtl: { flexDirection: 'row-reverse' },
  formulaNumWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  formulaNum: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  formulaLabel: { fontSize: 12, fontFamily: 'Amiri_400Regular', marginBottom: 3 },
  formulaText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 24 },

  // Lesson list
  lessonList: { gap: 8, marginBottom: 24 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  lessonRowRtl: { flexDirection: 'row-reverse' },
  lessonNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  lessonRowTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Amiri_700Bold' },

  // Examples
  examplesWrap: { gap: 12, marginBottom: 24 },
  exampleCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  practiceCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  exHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  exHeaderRtl: { flexDirection: 'row-reverse' },
  exNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exNumText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  exQ: { flex: 1, fontSize: 14, fontWeight: '600', fontFamily: 'Amiri_700Bold', lineHeight: 22 },
  exRevealBtn: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 12 },
  exRevealRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exRevealLabel: { color: MUTED, fontSize: 13, fontFamily: 'Amiri_400Regular' },
  exAnswerText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 0.3 },

  // Options
  optionsWrap: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  optionBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  optionBtnRtl: { flexDirection: 'row-reverse' },
  optionText: { fontSize: 14, fontFamily: 'Amiri_400Regular', flex: 1 },
  practiceExplainCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 },
  practiceExplainCardRtl: { flexDirection: 'row-reverse' },
  practiceExplainText: { flex: 1, fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },

  // Score
  scorePill: { borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 16 },
  scoreText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Summary (Master tab)
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  summaryRowRtl: { flexDirection: 'row-reverse' },
  summaryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  summaryFormula: { flex: 1, fontSize: 14, fontFamily: 'Amiri_400Regular', lineHeight: 22 },
  masteryCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 24, alignItems: 'center' },
  masteryTitle: { fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center', marginBottom: 8 },
  masterySub: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22 },
  practiceRequiredNote: { fontSize: 13, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 20, marginTop: 12 },

  // Practice CTA
  practiceBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 4 },
  practiceBtnGrad: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 28 },
  practiceBtnText: { fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,4,15,0.55)', justifyContent: 'flex-end', padding: 16, paddingBottom: 34 },
  modal: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16 },
  modalTitle: { color: WHITE, fontSize: 22, fontWeight: '700', textAlign: 'center', fontFamily: 'Amiri_700Bold', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  exitBtn: { flex: 1, height: 54, borderRadius: 27, backgroundColor: '#3B4262', alignItems: 'center', justifyContent: 'center' },
  exitText: { color: WHITE, fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  skipBtn: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: WHITE, fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Completion overlay
  celebrateBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,4,15,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  celebrateCard: { width: '100%', borderRadius: 28, borderWidth: 1, padding: 28, alignItems: 'center' },
  celebrateEmoji: { fontSize: 56, marginBottom: 12 },
  celebrateTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center', marginBottom: 6 },
  celebrateSub: { fontSize: 15, fontFamily: 'Amiri_400Regular', textAlign: 'center', marginBottom: 20 },
  celebrateXpBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 24 },
  celebrateXpText: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  celebrateBtn: { width: '100%', borderRadius: 28, overflow: 'hidden', marginBottom: 4 },
  celebrateBtnGrad: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  celebrateBtnText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  celebrateDismiss: { fontSize: 14, fontFamily: 'Amiri_400Regular', textDecorationLine: 'underline' },
  rowRtl: { flexDirection: 'row-reverse' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});
