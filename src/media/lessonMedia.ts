import type { Grade12Lesson, Grade12Unit } from '../data/grade12';
import { LESSON_MEDIA_ASSET_OVERRIDES } from './lessonMediaOverrides.generated';

export type LessonMediaStatus = 'pilot-ready' | 'scripted' | 'planned';
export type LessonMediaSegmentKind =
  | 'avatar_intro'
  | 'manim_core'
  | 'worked_example'
  | 'practice_push'
  | 'recap';

export type LessonMediaSegment = {
  id: string;
  kind: LessonMediaSegmentKind;
  durationSec: number;
  titleEn: string;
  titleAr: string;
  objectiveEn: string;
  objectiveAr: string;
};

export type LessonTranscriptLine = {
  speaker: 'coach' | 'guide';
  en: string;
  ar: string;
  emphasis?: boolean;
};

export type LessonVideoSource = number | { uri: string };

export type LessonMediaBlueprint = {
  lessonId: string;
  status: LessonMediaStatus;
  coachIntroEn: string;
  coachIntroAr: string;
  coachCueEn: string;
  coachCueAr: string;
  heroVideoSource?: LessonVideoSource;
  heroVideoUrl?: string;
  posterSource?: LessonVideoSource;
  posterUrl?: string;
  visualStyleEn: string;
  visualStyleAr: string;
  transcriptPreview: LessonTranscriptLine[];
  segments: LessonMediaSegment[];
  productionNotesEn: string[];
  productionNotesAr: string[];
};

type LessonMediaTemplate = Omit<LessonMediaBlueprint, 'lessonId'>;

const DEFAULT_DURATIONS = {
  avatarIntro: 14,
  manimCore: 48,
  workedExample: 36,
  practicePush: 18,
  recap: 12,
} as const;

type LessonMediaAssetOverride = Pick<
  LessonMediaBlueprint,
  'heroVideoSource' | 'heroVideoUrl' | 'posterSource' | 'posterUrl'
>;

const LESSON_MEDIA_ASSET_OVERRIDES_MAP: Record<string, LessonMediaAssetOverride> =
  LESSON_MEDIA_ASSET_OVERRIDES as Record<string, LessonMediaAssetOverride>;

function getLessonMediaAssetOverride(lessonId: string): LessonMediaAssetOverride {
  return LESSON_MEDIA_ASSET_OVERRIDES_MAP[lessonId] ?? {};
}

function resolveLessonMediaStatus(
  lessonId: string,
  blueprint: LessonMediaTemplate,
): LessonMediaStatus {
  if (blueprint.status === 'pilot-ready') return 'pilot-ready';
  if (getLessonMediaAssetOverride(lessonId).heroVideoSource || getLessonMediaAssetOverride(lessonId).heroVideoUrl) {
    return blueprint.status === 'planned' ? 'scripted' : blueprint.status;
  }
  return blueprint.status;
}

const CUSTOM_BLUEPRINTS: Record<string, LessonMediaTemplate> = {
  'u1-l1': {
    status: 'pilot-ready',
    coachIntroEn:
      'Start with one smart move: if the divisor looks like (x - a), substitute a first. From the same result, the learner can read the remainder and test the factor immediately.',
    coachIntroAr:
      'ابدأ بحركة ذكية واحدة: إذا كان المقسوم عليه على شكل (x - a)، عوّض بقيمة a أولاً. من نفس الناتج يعرف الطالب الباقي، ويقرر مباشرة هل المقسوم عليه عامل أم لا.',
    coachCueEn:
      'Keep the student focused on three exam moves: substitute, read the remainder, then judge the factor statement immediately.',
    coachCueAr:
      'خلّي تركيز الطالب على ثلاث حركات امتحانية: عوّض، اقرأ الباقي، ثم احكم فوراً هل هو عامل أم لا.',
    visualStyleEn:
      'Premium portrait lesson, Arabic-led delivery, gold accents, and a clean exam-first flow from rule to example to quick checks.',
    visualStyleAr:
      'درس رأسي فاخر، وشرح عربي واضح، ولمسات ذهبية، ومسار امتحاني نظيف يبدأ بالقاعدة ثم المثال ثم التحقق السريع.',
    transcriptPreview: [
      {
        speaker: 'coach',
        en: 'Open with the book rule in plain language: when we divide P(x) by (x - a), the quickest shortcut is to evaluate P(a).',
        ar: 'ابدأ القاعدة بلغة سهلة وقريبة من الطالب: لما نقسم P(x) على (x - a)، أسرع طريق إنك تحسب P(a).',
        emphasis: true,
      },
      {
        speaker: 'guide',
        en: 'Then slow the lesson down enough to show the substitution, the remainder result, and the factor test step by step.',
        ar: 'بعدها هدي الإيقاع شوي وورّجيهم التعويض، ونتيجة الباقي، واختبار العامل خطوة خطوة.',
      },
      {
        speaker: 'coach',
        en: 'Close with a Jordan-style worked example, two quick checks, and a short exam recap that stays on screen long enough to review.',
        ar: 'اختم بمثال قريب من أسئلة الأردن، وبعده سؤالين سريعين، وبالآخر خلاصة امتحانية تضل على الشاشة شوي عشان الطالب يراجعها.',
      },
    ],
    segments: [
      {
        id: 'hook',
        kind: 'avatar_intro',
        durationSec: 30,
        titleEn: 'Coach Intro',
        titleAr: 'مقدمة المدرب',
        objectiveEn: 'A 30-second founder clip sets the lesson goal, the exam mindset, and the two rules the student is about to master.',
        objectiveAr: 'مقطع افتتاحي لمدة 30 ثانية يحدد هدف الدرس وعقلية الامتحان والقاعدتين اللتين سيتقنهما الطالب.',
      },
      {
        id: 'core',
        kind: 'manim_core',
        durationSec: 180,
        titleEn: 'Animated Core Proof',
        titleAr: 'البرهان المتحرك الأساسي',
        objectiveEn: 'Use a long-form Manim walkthrough to derive P(a) = remainder and explain why the shortcut works instead of asking students to memorize it.',
        objectiveAr: 'استخدم شرحاً متحركاً ممتداً لاشتقاق أن P(a) تمثل الباقي وبيان سبب عمل القاعدة بدلاً من مطالبة الطالب بالحفظ فقط.',
      },
      {
        id: 'example',
        kind: 'worked_example',
        durationSec: 60,
        titleEn: 'Jordan Worked Example',
        titleAr: 'مثال أردني محلول',
        objectiveEn: 'Solve the factor theorem example line by line using the same notation and pacing the student sees in the Jordanian book.',
        objectiveAr: 'حل مثال نظرية العامل خطوة بخطوة بنفس الرموز والإيقاع الذي يراه الطالب في الكتاب الأردني.',
      },
      {
        id: 'practice',
        kind: 'practice_push',
        durationSec: 20,
        titleEn: 'Quick Checks',
        titleAr: 'أسئلة التحقق السريعة',
        objectiveEn: 'Pause on two quick checks so the learner can answer before the correct option is highlighted.',
        objectiveAr: 'توقّف عند سؤالين سريعين حتى يجيب الطالب قبل إبراز الخيار الصحيح.',
      },
      {
        id: 'recap',
        kind: 'recap',
        durationSec: 10,
        titleEn: 'Exam Recap',
        titleAr: 'الخلاصة الامتحانية',
        objectiveEn: 'Finish with the three exam moves: substitute first, read the remainder, then test the factor statement immediately.',
        objectiveAr: 'اختم بثلاث خطوات امتحانية: عوّض أولاً، اقرأ الباقي، ثم اختبر عبارة العامل مباشرة.',
      },
    ],
    productionNotesEn: [
      'Use the downloaded HeyGen clip as the opening and extend it to a clean 30-second intro before the animated lesson begins.',
      'Keep the middle of the lesson fully animated and subtitle-led so one shared video works across both app languages for launch.',
      'Hold the final recap long enough that the stitched lesson can land close to a five-minute total runtime.',
    ],
    productionNotesAr: [
      'استعمل مقطع HeyGen الذي تم تنزيله كمقدمة وافرده حتى يصل إلى 30 ثانية نظيفة قبل بدء الدرس المتحرك.',
      'لتبقَ الفقرة الوسطى معتمدة على الحركة والترجمة البصرية حتى يعمل فيديو واحد مشترك مع اللغتين عند الإطلاق.',
      'اترك الخلاصة الأخيرة ظاهرة مدة كافية حتى يصل طول الدرس المركّب إلى نحو خمس دقائق.',
    ],
  },
  'u2-l1': {
    status: 'scripted',
    coachIntroEn:
      'This lesson should feel like a premium trig identity warm-up: quick avatar framing, then animated unit-circle geometry and neat algebra layers.',
    coachIntroAr:
      'يُفترض أن يبدو هذا الدرس كتمهيد فخم لمتطابقات المثلثات: تقديم سريع من المدرب ثم هندسة متحركة على دائرة الوحدة مع جبر منظم.',
    coachCueEn:
      'Keep the coach present at the start, then let the visual proof do the teaching.',
    coachCueAr:
      'يظهر المدرب في البداية فقط، ثم يترك البرهان البصري يشرح الفكرة.',
    visualStyleEn:
      'Use smooth unit-circle motion, gold highlights for equalities, and textbook pacing with one identity per beat.',
    visualStyleAr:
      'حركة سلسة على دائرة الوحدة مع إبراز ذهبي للعلاقات وتدرج قريب من الكتاب بحيث تُشرح متطابقة واحدة في كل لقطة.',
    transcriptPreview: [
      {
        speaker: 'coach',
        en: 'Do not memorize blindly. See why sin²θ + cos²θ = 1 lives inside the unit circle.',
        ar: 'لا تحفظ بشكل أعمى. انظر لماذا تظهر sin²θ + cos²θ = 1 داخل دائرة الوحدة نفسها.',
        emphasis: true,
      },
      {
        speaker: 'guide',
        en: 'Once the picture is clear, the identity becomes faster to recall in every proof.',
        ar: 'وعندما تتضح الصورة، تصبح المتطابقة أسرع في الاستدعاء داخل كل برهان.',
      },
    ],
    segments: [
      {
        id: 'hook',
        kind: 'avatar_intro',
        durationSec: 14,
        titleEn: 'Coach Warm-up',
        titleAr: 'تمهيد المدرب',
        objectiveEn: 'Set the idea of identity as a picture, not a chant to memorize.',
        objectiveAr: 'تقديم الفكرة على أنها صورة بصرية وليست عبارة للحفظ فقط.',
      },
      {
        id: 'core',
        kind: 'manim_core',
        durationSec: 52,
        titleEn: 'Unit Circle Visual',
        titleAr: 'تصور دائرة الوحدة',
        objectiveEn: 'Map the Pythagorean identity directly onto the circle and triangle view.',
        objectiveAr: 'ربط المتطابقة الفيثاغورية مباشرة بدائرة الوحدة وتمثيل المثلث داخلها.',
      },
      {
        id: 'example',
        kind: 'worked_example',
        durationSec: 34,
        titleEn: 'Identity in Action',
        titleAr: 'تطبيق على المتطابقة',
        objectiveEn: 'Use the identity in one quick simplification that mirrors the Jordan workbook style.',
        objectiveAr: 'استخدام المتطابقة في تبسيط سريع يشبه أسلوب كتاب التمارين الأردني.',
      },
      {
        id: 'recap',
        kind: 'recap',
        durationSec: 12,
        titleEn: 'Recall Cue',
        titleAr: 'إشارة التذكر',
        objectiveEn: 'End with a short memory cue and immediate practice handoff.',
        objectiveAr: 'ختام بإشارة تذكر قصيرة ثم انتقال مباشر إلى التدريب.',
      },
    ],
    productionNotesEn: [
      'Let the moving geometry carry the explanation instead of too much talking head time.',
      'Keep the equations large and centered with Arabic support copy around them.',
    ],
    productionNotesAr: [
      'دَع الهندسة المتحركة تحمل الشرح بدلاً من الإطالة في ظهور الوجه.',
      'اجعل المعادلات كبيرة ومتمركزة مع نص عربي داعم حولها.',
    ],
  },
};

function buildDefaultSegments(lesson: Grade12Lesson): LessonMediaSegment[] {
  return [
    {
      id: 'hook',
      kind: 'avatar_intro',
      durationSec: DEFAULT_DURATIONS.avatarIntro,
      titleEn: 'Coach Intro',
      titleAr: 'مقدمة المدرب',
      objectiveEn: `Open ${lesson.titleEn} with a short founder/avatar welcome and a clear objective.`,
      objectiveAr: `ابدأ درس ${lesson.titleAr} بترحيب قصير من المدرب مع هدف واضح للطالب.`,
    },
    {
      id: 'core',
      kind: 'manim_core',
      durationSec: DEFAULT_DURATIONS.manimCore,
      titleEn: 'Animated Core Idea',
      titleAr: 'الفكرة الأساسية المتحركة',
      objectiveEn: 'Use Manim-style animation to make the key rule visually obvious before practice.',
      objectiveAr: 'استخدم رسوماً متحركة بأسلوب Manim حتى تبدو القاعدة الأساسية واضحة بصرياً قبل التدريب.',
    },
    {
      id: 'example',
      kind: 'worked_example',
      durationSec: DEFAULT_DURATIONS.workedExample,
      titleEn: 'Worked Example',
      titleAr: 'مثال محلول',
      objectiveEn: `Solve one model example and connect it to ${lesson.keyFormulas[0]?.formula ?? lesson.titleEn}.`,
      objectiveAr: `حل مثال نموذجي واحد واربطه بـ ${lesson.keyFormulas[0]?.formula ?? lesson.titleAr}.`,
    },
    {
      id: 'practice',
      kind: 'practice_push',
      durationSec: DEFAULT_DURATIONS.practicePush,
      titleEn: 'Practice Handoff',
      titleAr: 'الانتقال إلى التدريب',
      objectiveEn: `Guide the learner into ${lesson.practiceQ.length} quick check ${lesson.practiceQ.length === 1 ? 'question' : 'questions'}.`,
      objectiveAr: `وجّه الطالب إلى ${lesson.practiceQ.length} ${lesson.practiceQ.length === 1 ? 'سؤال تحقق سريع' : 'أسئلة تحقق سريعة'}.`,
    },
    {
      id: 'recap',
      kind: 'recap',
      durationSec: DEFAULT_DURATIONS.recap,
      titleEn: 'Exam Recap',
      titleAr: 'خلاصة امتحانية',
      objectiveEn: 'Finish with one exam-focused reminder and the next-step prompt.',
      objectiveAr: 'اختم بتذكير امتحاني واحد ثم توجيه واضح للخطوة التالية.',
    },
  ];
}

function buildDefaultTranscript(lesson: Grade12Lesson, unit: Grade12Unit): LessonTranscriptLine[] {
  const firstFormula = lesson.keyFormulas[0]?.formula ?? lesson.titleEn;
  return [
    {
      speaker: 'coach',
      en: `Welcome to ${lesson.titleEn}. In this unit, we want the rule to feel visual before it feels memorized.`,
      ar: `مرحباً بك في درس ${lesson.titleAr}. في هذه الوحدة نريد أن تبدو القاعدة بصرية أولاً قبل أن تصبح مجرد حفظ.`,
      emphasis: true,
    },
    {
      speaker: 'guide',
      en: `We will connect the lesson to ${firstFormula} and keep the wording close to the Jordanian book style.`,
      ar: `سنربط الدرس بـ ${firstFormula} مع المحافظة على صياغة قريبة من أسلوب الكتاب الأردني.`,
    },
    {
      speaker: 'coach',
      en: `Then we close with a short recap and move straight into ${lesson.practiceQ.length} practice checks from ${unit.titleEn}.`,
      ar: `ثم نختم بخلاصة قصيرة وننتقل مباشرة إلى ${lesson.practiceQ.length} أسئلة تدريب من ${unit.titleAr}.`,
    },
  ];
}

function buildDefaultBlueprint(lesson: Grade12Lesson, unit: Grade12Unit): LessonMediaBlueprint {
  return {
    lessonId: lesson.id,
    status: 'planned',
    coachIntroEn:
      'This lesson opens with a short coach setup, then moves into the core idea, one worked example, and a short exam-style recap.',
    coachIntroAr:
      'يبدأ هذا الدرس بتهيئة قصيرة من المدرب، ثم ينتقل إلى الفكرة الأساسية، ثم مثال محلول، ثم خلاصة قصيرة بأسلوب قريب من الامتحان.',
    coachCueEn:
      'Keep the lesson short, premium, and exam-focused so it feels closer to BoldVoice than to a long lecture.',
    coachCueAr:
      'ليكن الدرس قصيراً وفاخراً وموجهاً للامتحان حتى يقترب من روح BoldVoice أكثر من كونه محاضرة طويلة.',
    visualStyleEn:
      'Founder intro, original Manim visuals, Jordan-first math notation, and premium pacing.',
    visualStyleAr:
      'افتتاحية من المدرب، ورسوم أصلية بـ Manim، ورموز رياضية مناسبة للأردن، وإيقاع عرض فاخر.',
    transcriptPreview: buildDefaultTranscript(lesson, unit),
    segments: buildDefaultSegments(lesson),
    productionNotesEn: [
      'Use your avatar clip only where warmth or motivation matters.',
      'Put the main math explanation into animated visuals, not a talking head.',
      'Keep subtitles short and mobile-safe.',
    ],
    productionNotesAr: [
      'يستخدم مقطع المدرب فقط في المواضع التي تحتاج دفئاً أو تحفيزاً.',
      'يكون الشرح الرياضي الأساسي داخل الرسوم المتحركة لا في الحديث المباشر فقط.',
      'تكون الترجمة قصيرة ومناسبة لشاشة الهاتف.',
    ],
  };
}

export function getLessonMediaBlueprint(
  lesson: Grade12Lesson,
  unit: Grade12Unit,
): LessonMediaBlueprint {
  const custom = CUSTOM_BLUEPRINTS[lesson.id];
  const assetOverride = getLessonMediaAssetOverride(lesson.id);

  if (custom) {
    return {
      lessonId: lesson.id,
      ...custom,
      status: resolveLessonMediaStatus(lesson.id, custom),
      ...assetOverride,
    };
  }

  const defaultBlueprint = buildDefaultBlueprint(lesson, unit);
  return {
    ...defaultBlueprint,
    status: resolveLessonMediaStatus(lesson.id, defaultBlueprint),
    ...assetOverride,
  };
}

export function getLessonMediaStatusLabel(
  status: LessonMediaStatus,
  isAr: boolean,
): string {
  if (status === 'pilot-ready') {
    return isAr ? 'الدرس التفاعلي جاهز' : 'Interactive lesson ready';
  }
  if (status === 'scripted') {
    return isAr ? 'المسار الموجّه جاهز' : 'Guided lesson ready';
  }
  return isAr ? 'لوحة الدرس جاهزة' : 'Lesson board ready';
}

export function formatMediaDuration(totalSeconds: number, isAr: boolean): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (isAr) {
    return `${minutes} د ${seconds} ث`;
  }

  return `${minutes}m ${seconds}s`;
}
