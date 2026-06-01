import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';
import { useScoreHistory, type ScoreEntry } from '../../src/hooks/useScoreHistory';
import { hasManagedAiBackend, requestManagedAiChat } from '../../src/ai/managedAi';
import { useSubscription } from '../../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../../src/subscriptions/subscriptionAccess';
import { withAlpha } from '../../src/theme/colorUtils';
import { getThemeSemantics } from '../../src/theme/themeSemantics';
import { stabilizeMixedMathText } from '../../src/utils/bidi';
import { formatMathDisplayText, hasMathText } from '../../src/utils/mathText';
import ApiKeyPromptModal from '../../components/ApiKeyPromptModal';
import PremiumAccessScreen from '../../components/PremiumAccessScreen';

const { width: SW } = Dimensions.get('window');

// ─── OpenAI configuration ─────────────────────────────────────────────────────
// Set your key in AsyncStorage with key '@snapmath_openai_key' or hardcode below.
// For demo/TestFlight builds we fall back to a smart local response engine.
const OPENAI_KEY_STORAGE = '@snapmath_openai_key';
const MANAGED_AI_ENABLED = hasManagedAiBackend();

const GRADE12_SYSTEM_PROMPT = `You are SnapMath AI, a Grade 12 Tawjihi mathematics tutor for Jordan.

Coverage:
- Unit 1: Functions and algebraic expressions
- Unit 2: Trigonometric identities and equations
- Unit 3: Differentiation and applications
- Unit 4: Complex numbers
- Unit 5: Integration and applications
- Unit 6: Vectors
- Unit 7: Statistics and probability

Teaching style:
- Follow Jordanian textbook wording and step order.
- If the user gives a problem, organise the reply with: idea, numbered steps, final answer.
- If the user asks for a concept, give a short explanation plus one mini-example.
- Keep notation clean: (a/b), x^2, ∫, sin, cos, tan.
- If the user writes Arabic, answer in Arabic.
- Never claim content exists if it was not provided.
- Never invent formulas, theorems, or exam rules.`;

type AiSourceMode = 'managed' | 'device' | 'guided';

function getAiSourceStatus(mode: AiSourceMode, isAr: boolean) {
  if (mode === 'managed') {
    return isAr ? '● الذكاء المتصل فعّال' : '● Managed AI connected';
  }

  if (mode === 'device') {
    return isAr ? '● مفتاح هذا الجهاز فعّال' : '● Device AI key active';
  }

  return isAr ? '● وضع توجيه ذكي' : '● Guided Jordan mode';
}

function buildFocusPrompt(contextLabel: string | null, isAr: boolean) {
  if (!contextLabel) return null;

  return isAr
    ? `ركز في هذه المحادثة على: ${contextLabel}. اربط الشرح قدر الإمكان بهذا السياق وبأسلوب التوجيهي الأردني.`
    : `Focus this conversation on: ${contextLabel}. Keep the explanation tied to that context and use Jordanian Tawjihi-style steps.`;
}

function buildJordanStyleReply(
  isAr: boolean,
  idea: string,
  steps: string[],
  finalAnswer?: string,
  examTip?: string,
) {
  const lines = isAr
    ? [
        `الفكرة: ${idea}`,
        'الخطوات:',
        ...steps.map((step, index) => `${index + 1}) ${step}`),
        finalAnswer ? `الجواب النهائي: ${finalAnswer}` : null,
        examTip ? `ملاحظة سريعة: ${examTip}` : null,
      ]
    : [
        `Idea: ${idea}`,
        'Steps:',
        ...steps.map((step, index) => `${index + 1}) ${step}`),
        finalAnswer ? `Final Answer: ${finalAnswer}` : null,
        examTip ? `Exam Tip: ${examTip}` : null,
      ];

  return lines.filter(Boolean).join('\n');
}

async function getAIResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  isAr: boolean,
  contextLabel: string | null,
): Promise<string> {
  const focusPrompt = buildFocusPrompt(contextLabel, isAr);
  if (MANAGED_AI_ENABLED) {
    const managedReply = await requestManagedAiChat({
      messages,
      isAr,
      systemPrompt: GRADE12_SYSTEM_PROMPT,
      contextPrompt: focusPrompt,
    });
    if (managedReply) {
      return managedReply;
    }

    return isAr
      ? 'تعذر الوصول إلى المدرب الذكي حالياً. حاول مرة أخرى بعد لحظة، أو أعد صياغة السؤال بصورة أوضح.'
      : 'I could not reach the live AI tutor right now. Please try again in a moment, or resend the question more clearly.';
  }

  // Try to get OpenAI key
  let apiKey: string | null = null;
  try {
    apiKey = await AsyncStorage.getItem(OPENAI_KEY_STORAGE);
  } catch {}

  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: GRADE12_SYSTEM_PROMPT },
            ...(focusPrompt ? [{ role: 'system', content: focusPrompt }] : []),
            ...messages,
          ],
          max_tokens: 400,
          temperature: 0.5,
        }),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {}
  }

  // ── Smart local fallback engine ─────────────────────────────────────────────
  const userMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? '';

  // Pattern-match to give sensible subject-specific responses
  if (userMsg.includes('remainder') || userMsg.includes('باقي') || userMsg.includes('factor theorem') || userMsg.includes('عامل')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'استخدم قيمة f(a) لتحديد الباقي أو التحقق من العامل.' : 'Use f(a) to get the remainder or test whether a factor exists.',
      isAr
        ? [
            'في نظرية الباقي: باقي قسمة f(x) على (x - a) يساوي f(a).',
            'في نظرية العامل: إذا كانت f(a) = 0 فإن (x - a) عامل.',
            'مثال سريع: للتحقق من (x - 2) في f(x) = x^3 - 4x + 4 نحسب f(2) = 4.',
          ]
        : [
            'Remainder Theorem: the remainder of f(x) ÷ (x - a) is f(a).',
            'Factor Theorem: if f(a) = 0, then (x - a) is a factor.',
            'Quick check: for f(x) = x^3 - 4x + 4, f(2) = 4, so (x - 2) is not a factor.',
          ],
      isAr ? '(x - 2) ليس عاملاً لأن f(2) ≠ 0.' : '(x - 2) is not a factor because f(2) ≠ 0.',
      isAr ? 'في التوجيهي اكتب قيمة f(a) بوضوح قبل الحكم.' : 'In Tawjihi solutions, show f(a) clearly before stating the conclusion.',
    );
  }
  if (userMsg.includes('partial fraction') || userMsg.includes('كسور جزئية')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'ابدأ بكتابة الصورة العامة حسب عوامل المقام.' : 'Start by writing the general form that matches the denominator factors.',
      isAr
        ? [
            'إذا كان المقام (x - 1)(x + 2) نكتب: (3x+1)/((x-1)(x+2)) = A/(x-1) + B/(x+2).',
            'لإيجاد A اضرب في (x - 1)(x + 2) ثم عوض x = 1.',
            'لإيجاد B اضرب ثم عوض x = -2.',
          ]
        : [
            'For denominator (x - 1)(x + 2), write A/(x - 1) + B/(x + 2).',
            'To find A, clear denominators and substitute x = 1.',
            'To find B, clear denominators and substitute x = -2.',
          ],
      undefined,
      isAr ? 'انتبه دائماً لشكل العوامل: خطية، مكررة، أو تربيعية.' : 'Always match the setup to the factor type: linear, repeated, or quadratic.',
    );
  }
  if (userMsg.includes('trig') || userMsg.includes('sin') || userMsg.includes('cos') || userMsg.includes('مثلث')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'ابدأ بالمتطابقات الأساسية ثم حوّل التعبير إلى صورة أبسط.' : 'Start from the core identities, then rewrite the expression into a simpler form.',
      isAr
        ? [
            'sin^2θ + cos^2θ = 1 هي القاعدة الأساسية.',
            'sin(2θ) = 2sinθcosθ و cos(2θ) = cos^2θ - sin^2θ.',
            'إذا ظهر tanθ ففكر أحياناً في كتابته على صورة sinθ / cosθ.',
          ]
        : [
            'sin^2θ + cos^2θ = 1 is the main identity.',
            'sin(2θ) = 2sinθcosθ and cos(2θ) = cos^2θ - sin^2θ.',
            'If tanθ appears, it may help to rewrite it as sinθ / cosθ.',
          ],
      undefined,
      isAr ? 'في البرهان اجعل الطرف الأصعب هو الذي تعمل عليه أولاً.' : 'In proofs, work on the more complicated side first.',
    );
  }
  if (userMsg.includes('differentiat') || userMsg.includes('derivative') || userMsg.includes('تفاضل') || userMsg.includes('مشتق')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'حدد نوع الدالة أولاً قبل اختيار قاعدة الاشتقاق.' : 'Identify the function form first, then choose the differentiation rule.',
      isAr
        ? [
            'قاعدة القوة: d/dx[x^n] = nx^(n-1).',
            'قاعدة السلسلة: اشتق الخارج ثم اضرب في مشتقة الداخل.',
            'قاعدة الضرب: (uv)’ = u’v + uv’، وقاعدة القسمة: (u/v)’ = (u’v - uv’) / v^2.',
          ]
        : [
            'Power rule: d/dx[x^n] = nx^(n-1).',
            'Chain rule: differentiate the outer function, then multiply by the derivative of the inner one.',
            'Product rule: (uv)’ = u’v + uv’, and quotient rule: (u/v)’ = (u’v - uv’) / v^2.',
          ],
      undefined,
      isAr ? 'بعد الاشتقاق بسّط الناتج قبل كتابة الجواب النهائي.' : 'After differentiating, simplify before writing the final answer.',
    );
  }
  if (userMsg.includes('integrat') || userMsg.includes('تكامل') || userMsg.includes('∫')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'ميّز بين التكامل المباشر والتعويض والتجزئة قبل البدء.' : 'Decide whether the integral is direct, substitution, or integration by parts before you start.',
      isAr
        ? [
            'التكامل المباشر: ∫x^n dx = x^(n+1)/(n+1) + C.',
            'إذا ظهر g’(x) مع دالة مركبة ففكر في التعويض u = g(x).',
            'للتكامل بالتجزئة استخدم ∫u dv = uv - ∫v du.',
          ]
        : [
            'Direct rule: ∫x^n dx = x^(n+1)/(n+1) + C.',
            'If you see g’(x) with a composite expression, consider substitution u = g(x).',
            'For integration by parts, use ∫u dv = uv - ∫v du.',
          ],
      undefined,
      isAr ? 'لا تنس الثابت C في التكامل غير المحدد.' : 'Do not forget the constant C in an indefinite integral.',
    );
  }
  if (userMsg.includes('complex') || userMsg.includes('مركب') || userMsg.includes('argand')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'انتقل بين الصورة الجبرية والقطبية حسب نوع السؤال.' : 'Switch between algebraic and polar form depending on the question type.',
      isAr
        ? [
            'z = a + bi حيث i^2 = -1.',
            'المعامل |z| = √(a^2 + b^2) والزاوية θ تحدد اتجاه العدد المركب.',
            'في الأسس والجذور استخدم مبرهنة دو موافر: z^n = r^n(cos nθ + i sin nθ).',
          ]
        : [
            'z = a + bi where i^2 = -1.',
            'The modulus is |z| = √(a^2 + b^2), and the argument θ gives the direction.',
            'For powers and roots, use De Moivre: z^n = r^n(cos nθ + i sin nθ).',
          ],
    );
  }
  if (userMsg.includes('vector') || userMsg.includes('متجه')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'ارسم الوضع الهندسي أولاً ثم اكتب العلاقات المتجهة.' : 'Sketch the geometry first, then write the vector relations.',
      isAr
        ? [
            'الجداء النقطي: a·b = a1b1 + a2b2 + a3b3 = |a||b|cosθ.',
            'معادلة المستقيم: r = a + λb.',
            'معادلة المستوى تعتمد على متجه عمودي n، وغالباً تكتب على صورة r·n = a·n.',
          ]
        : [
            'Dot product: a·b = a1b1 + a2b2 + a3b3 = |a||b|cosθ.',
            'Line equation: r = a + λb.',
            'A plane uses a normal vector n and is often written as r·n = a·n.',
          ],
    );
  }
  if (userMsg.includes('statistic') || userMsg.includes('probabilit') || userMsg.includes('إحصاء') || userMsg.includes('احتمال') || userMsg.includes('binomial') || userMsg.includes('normal')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'حدد نوع التوزيع أولاً من المعطيات ثم اكتب معلماته بوضوح.' : 'Identify the distribution first from the data, then state its parameters clearly.',
      isAr
        ? [
            'في ذو الحدين: X ~ B(n, p) و P(X = r) = C(n,r) p^r (1-p)^(n-r).',
            'في الطبيعي: X ~ N(μ, σ^2) ثم نحوّل إلى Z = (X - μ) / σ.',
            'بعد التحويل إلى Z نرجع إلى الجدول ونكتب القيمة المطلوبة بدقة.',
          ]
        : [
            'For binomial: X ~ B(n, p) and P(X = r) = C(n,r) p^r (1-p)^(n-r).',
            'For normal: X ~ N(μ, σ^2), then standardise with Z = (X - μ) / σ.',
            'After finding Z, use the table carefully and report the required probability.',
          ],
    );
  }
  if (userMsg.includes('exam') || userMsg.includes('امتحان') || userMsg.includes('توجيهي') || userMsg.includes('tawjihi')) {
    return buildJordanStyleReply(
      isAr,
      isAr ? 'ارفع درجتك بإدارة الوقت وحسن ترتيب الأسئلة.' : 'Raise your score with time management and better question ordering.',
      isAr
        ? [
            'ابدأ بالأسئلة الأسرع لحصد علامات مؤكدة أولاً.',
            'إذا تعطلت في سؤال طويل، ضع علامة عليه وانتقل ثم عد إليه لاحقاً.',
            'راجع الأسئلة ذات الأفكار المتكررة مثل الباقي والعامل، المتطابقات، والتكاملات الأساسية.',
          ]
        : [
            'Start with the quickest mark-winning questions first.',
            'If a long question slows you down, flag it and return later.',
            'Review repeated high-yield ideas such as remainder/factor, identities, and standard integrals.',
          ],
      undefined,
      isAr ? 'في المراجعة النهائية افحص الإشارات والسوالب قبل التسليم.' : 'In your final review, check signs and negatives before submitting.',
    );
  }

  // Generic helpful response
  const genericEn = [
    "Idea: Start by identifying the lesson and the exact form of the expression.\nSteps:\n1) Write the given data clearly.\n2) Decide which rule or theorem matches the form.\n3) Solve step by step and simplify.\nExam Tip: Send me the exact question and I'll format it the Tawjihi way.",
    "Idea: Most Grade 12 errors come from choosing the wrong method too early.\nSteps:\n1) Spot the topic first.\n2) Write the governing rule.\n3) Apply it carefully.\nExam Tip: If you want, I can turn this into a fully worked example.",
  ];
  const genericAr = [
    'الفكرة: ابدأ بتحديد الدرس وشكل التعبير بدقة.\nالخطوات:\n1) اكتب المعطيات بوضوح.\n2) حدّد القاعدة أو النظرية المناسبة.\n3) حل خطوة بخطوة ثم بسّط.\nملاحظة سريعة: أرسل لي السؤال نفسه وسأرتبه لك بأسلوب التوجيهي.',
    'الفكرة: كثير من أخطاء الصف 12 تأتي من اختيار الطريقة قبل فهم شكل السؤال.\nالخطوات:\n1) حدد الموضوع أولاً.\n2) اكتب القانون الحاكم.\n3) طبّق بهدوء وتحقق من النتيجة.\nملاحظة سريعة: أستطيع تحويل هذا إلى مثال محلول كامل إذا أردت.',
  ];
  const pool = isAr ? genericAr : genericEn;
  return pool[Math.floor(Math.random() * pool.length)];
}

type CoachPath = {
  key: 'foundation' | 'exam-boost' | 'fix-mistakes';
  eyebrowEn: string;
  eyebrowAr: string;
  titleEn: string;
  titleAr: string;
  subEn: string;
  subAr: string;
  icon: string;
  bulletsEn: string[];
  bulletsAr: string[];
  introEn: string;
  introAr: string;
};

const COACH_PATHS: CoachPath[] = [
  {
    key: 'foundation',
    eyebrowEn: 'Build your base',
    eyebrowAr: 'ثبّت الأساس',
    titleEn: 'Foundation Path',
    titleAr: 'مسار التأسيس',
    subEn: 'Lock in the highest-yield algebra, trig, and calculus basics first.',
    subAr: 'ثبّت أساسيات الجبر والمثلثات والتفاضل الأكثر ظهوراً أولاً.',
    icon: 'school-outline',
    bulletsEn: ['Remainder & factor', 'Trig identities', 'Differentiation basics'],
    bulletsAr: ['الباقي والعامل', 'المتطابقات', 'بداية التفاضل'],
    introEn:
      "We'll start with the strongest foundations: factoring, trig identities, and differentiation basics. Ask for a quick drill, a worked example, or a concept recap.",
    introAr:
      'سنبدأ بأقوى الأساسيات: التحليل، والمتطابقات المثلثية، وبداية التفاضل. اطلب تدريباً سريعاً أو مثالاً محلولاً أو مراجعة للفكرة.',
  },
  {
    key: 'exam-boost',
    eyebrowEn: 'Score faster',
    eyebrowAr: 'ارفع الدرجة أسرع',
    titleEn: 'Exam Boost',
    titleAr: 'مسار رفع الدرجة',
    subEn: 'Train for speed, question selection, and sharp Tawjihi exam strategy.',
    subAr: 'تدرّب على السرعة واختيار السؤال واستراتيجية التوجيهي بذكاء.',
    icon: 'flash-outline',
    bulletsEn: ['Timed plan', 'High-yield review', 'Exam tactics'],
    bulletsAr: ['خطة زمنية', 'مراجعة عالية العائد', 'تكتيك الامتحان'],
    introEn:
      "Let's switch into exam mode. I can coach you through timed solving, high-yield revision, and how to manage tougher Tawjihi questions with better pacing.",
    introAr:
      'لننتقل إلى وضع الامتحان. أستطيع تدريبك على الحل الزمني، والمراجعة عالية العائد، وكيفية إدارة أسئلة التوجيهي الصعبة بسرعة أكبر.',
  },
  {
    key: 'fix-mistakes',
    eyebrowEn: 'Recover weak spots',
    eyebrowAr: 'صلّح نقاط الضعف',
    titleEn: 'Fix My Mistakes',
    titleAr: 'مسار إصلاح الأخطاء',
    subEn: 'Review weak areas, common slips, and the exact steps that cost marks.',
    subAr: 'راجع نقاط الضعف والأخطاء الشائعة والخطوات التي تكلّفك علامات.',
    icon: 'refresh-circle-outline',
    bulletsEn: ['Common errors', 'Step checking', 'Targeted practice'],
    bulletsAr: ['أخطاء شائعة', 'فحص الخطوات', 'تدريب موجه'],
    introEn:
      "We'll focus on the mistakes that usually cost marks. Send me a recent question, or ask for a targeted review of a weak area and I'll coach the exact steps.",
    introAr:
      'سنركز على الأخطاء التي تضيّع العلامات غالباً. أرسل سؤالاً أخطأت فيه مؤخراً، أو اطلب مراجعة موجهة لنقطة ضعف وسأشرح لك الخطوات بدقة.',
  },
];

const QUICK_CHATS = [
  {
    titleEn: 'Surprise me',
    titleAr: 'فاجئني',
    icon: 'sparkles-outline',
    introEn: 'Give me a short mixed Grade 12 challenge and coach me through it step by step.',
    introAr: 'أعطني تحدياً قصيراً من رياضيات الصف 12 ووجّهني فيه خطوة بخطوة.',
  },
  {
    titleEn: 'My own topic',
    titleAr: 'موضوعي الخاص',
    icon: 'create-outline',
    introEn: 'Tell me the exact lesson, formula, or question you want help with, and I will focus only on that.',
    introAr: 'اكتب الدرس أو القانون أو السؤال الذي تريد المساعدة فيه، وسأركز عليه مباشرة.',
  },
];

const TOPIC_CARDS = [
  { titleEn: 'Functions', titleAr: 'الدوال', icon: 'git-branch-outline' },
  { titleEn: 'Trigonometry', titleAr: 'المثلثات', icon: 'sync-outline' },
  { titleEn: 'Differentiation', titleAr: 'التفاضل', icon: 'trending-up-outline' },
  { titleEn: 'Integration', titleAr: 'التكامل', icon: 'pulse-outline' },
  { titleEn: 'Vectors', titleAr: 'المتجهات', icon: 'navigate-outline' },
  { titleEn: 'Statistics', titleAr: 'الإحصاء', icon: 'bar-chart-outline' },
];

function buildDefaultGreeting(isAr: boolean, userName: string) {
  return isAr
    ? `مرحباً${userName ? ' ' + userName : ''}! أنا مدرسك الذكي للرياضيات. اختر مساراً أو موضوعاً، وسأساعدك خطوة بخطوة في منهج الصف 12.`
    : `Hello${userName ? ' ' + userName : ''}! I'm your AI math coach. Choose a path or topic, and I'll guide you step by step through the Grade 12 curriculum.`;
}

function buildTopicIntro(titleEn: string, titleAr: string, isAr: boolean) {
  return isAr
    ? `لنركز على ${titleAr}. أستطيع شرح الفكرة الأساسية، حل مثال كامل، أو إعداد تدريب سريع لك.`
    : `Let's focus on ${titleEn}. I can explain the core idea, solve a full example, or set up a quick drill for you.`;
}

function pickRecommendedPath(history: ScoreEntry[]): CoachPath {
  const latest = history[0];

  if (!latest) return COACH_PATHS[0];
  if (latest.score < 70) return COACH_PATHS[2];
  if (latest.type === 'exam' || history.some((entry) => entry.type === 'exam')) return COACH_PATHS[1];

  return COACH_PATHS[0];
}

function buildRecommendationNote(pathKey: CoachPath['key'], isAr: boolean, hasHistory: boolean) {
  if (!hasHistory) {
    return isAr
      ? 'ابدأ بهذا المسار لتقوية أهم أفكار الصف 12 قبل الانتقال للأسئلة الأصعب.'
      : 'Start here to strengthen the highest-yield Grade 12 ideas before moving to tougher questions.';
  }

  if (pathKey === 'fix-mistakes') {
    return isAr
      ? 'نتائجك الأخيرة تشير إلى أن مراجعة الأخطاء الآن ستعطيك أسرع تحسن.'
      : 'Your recent results suggest targeted error review will give you the fastest improvement.';
  }

  if (pathKey === 'exam-boost') {
    return isAr
      ? 'نشاطك الأخير يظهر أنك جاهز لرفع السرعة والدقة واستراتيجية الامتحان.'
      : 'Your recent activity suggests you are ready to sharpen speed, accuracy, and exam strategy.';
  }

  return isAr
    ? 'هذا أفضل مسار للحفاظ على أساس قوي قبل التوسع في الأسئلة الأعلى صعوبة.'
    : 'This is the best path to keep your foundations strong before expanding into harder questions.';
}

function formatChatMessageForDisplay(text: string, isAr: boolean) {
  const normalizedText = hasMathText(text) ? formatMathDisplayText(text) : text;
  return stabilizeMixedMathText(normalizedText, isAr);
}

function formatRecentActivitySubtitle(item: ScoreEntry, isAr: boolean) {
  const dateText = new Date(item.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  return isAr
    ? `${dateText} · ${item.correct}/${item.total} صحيحة`
    : `${dateText} · ${item.correct}/${item.total} correct`;
}

export default function AIChatScreen() {
  const { currentTier } = useSubscription();

  if (!canAccessFeature(currentTier, 'aiChat')) {
    return <PremiumAccessScreen feature="aiChat" />;
  }

  return <AIChatContent />;
}

function AIChatContent() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT() as any;
  const ui = useMemo(() => getThemeSemantics(theme), [theme]);
  const [mode, setMode] = useState<'path' | 'topic'>('path');
  const [showHistory, setShowHistory] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeContextLabel, setActiveContextLabel] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const { history: scoreHistory } = useScoreHistory();
  const defaultGreeting = useMemo(() => buildDefaultGreeting(isAr, userName), [isAr, userName]);

  useEffect(() => {
    AsyncStorage.getItem('@snapmath_name').then((v) => { if (v) setUserName(v); });
  }, []);

  type Msg = { id: string; text: string; from: 'user' | 'ai' };
  const [messages, setMessages] = useState<Msg[]>([
    { id: '0', text: defaultGreeting, from: 'ai' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiSourceMode, setAiSourceMode] = useState<AiSourceMode>(MANAGED_AI_ENABLED ? 'managed' : 'guided');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const inputAnim = useRef(new Animated.Value(1)).current;
  const recommendedPath = useMemo(() => pickRecommendedPath(scoreHistory), [scoreHistory]);
  const recommendationNote = useMemo(
    () => buildRecommendationNote(recommendedPath.key, isAr, scoreHistory.length > 0),
    [recommendedPath.key, isAr, scoreHistory.length]
  );

  useEffect(() => {
    if (!activeChat) {
      setMessages([{ id: '0', text: defaultGreeting, from: 'ai' }]);
      setInputText('');
      setIsTyping(false);
      setActiveContextLabel(null);
    }
  }, [activeChat, defaultGreeting]);

  useEffect(() => {
    let cancelled = false;

    if (MANAGED_AI_ENABLED) {
      setAiSourceMode('managed');
      return;
    }

    AsyncStorage.getItem(OPENAI_KEY_STORAGE)
      .then((value) => {
        if (cancelled) return;
        setAiSourceMode(value?.trim().startsWith('sk-') ? 'device' : 'guided');
      })
      .catch(() => {
        if (!cancelled) {
          setAiSourceMode('guided');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openChat = useCallback((title: string, introText?: string, contextLabel?: string) => {
    setActiveChat(title);
    setActiveContextLabel(contextLabel ?? title);
    setShowHistory(false);
    setInputText('');
    setIsTyping(false);
    setMessages([{ id: `intro-${Date.now()}`, text: introText ?? defaultGreeting, from: 'ai' }]);
    requestAnimationFrame(() => chatScrollRef.current?.scrollToEnd({ animated: false }));
  }, [defaultGreeting]);

  const handlePathPress = useCallback((path: CoachPath) => {
    openChat(
      isAr ? path.titleAr : path.titleEn,
      isAr ? path.introAr : path.introEn,
      isAr ? `${path.titleAr}: ${path.bulletsAr.join('، ')}` : `${path.titleEn}: ${path.bulletsEn.join(', ')}`,
    );
  }, [isAr, openChat]);

  const handleTopicPress = useCallback((titleEn: string, titleAr: string) => {
    openChat(isAr ? titleAr : titleEn, buildTopicIntro(titleEn, titleAr, isAr), isAr ? titleAr : titleEn);
  }, [isAr, openChat]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isTyping) return;
    const userMsg: Msg = { id: Date.now().toString(), text: inputText.trim(), from: 'user' };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);
    Animated.sequence([
      Animated.timing(inputAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(inputAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // Build message history for AI (last 8 turns)
    const historyForAI = newMessages.slice(-8).map((m) => ({
      role: m.from === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    }));

    try {
      const reply = await getAIResponse(historyForAI, isAr, activeContextLabel);
      setMessages((m) => [...m, { id: Date.now().toString() + 'ai', text: reply, from: 'ai' }]);
    } catch {
      const errMsg = isAr ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.';
      setMessages((m) => [...m, { id: Date.now().toString() + 'ai', text: errMsg, from: 'ai' }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [activeContextLabel, inputText, isTyping, messages, isAr]);

  const openApiKeyModal = useCallback(async () => {
    const currentKey = (await AsyncStorage.getItem(OPENAI_KEY_STORAGE)) ?? '';
    setApiKeyInput(currentKey);
    setApiKeyError(null);
    setShowApiKeyModal(true);
  }, []);

  const saveApiKey = useCallback(async () => {
    const normalizedKey = apiKeyInput.trim();

    if (!normalizedKey) {
      await AsyncStorage.removeItem(OPENAI_KEY_STORAGE);
      setAiSourceMode('guided');
      setShowApiKeyModal(false);
      setApiKeyError(null);
      Alert.alert(
        isAr ? 'تمت الإزالة' : 'Key removed',
        isAr ? 'تمت إزالة المفتاح من هذا الجهاز.' : 'The key was removed from this device.',
      );
      return;
    }

    if (!normalizedKey.startsWith('sk-')) {
      setApiKeyError(isAr ? 'يجب أن يبدأ المفتاح بـ sk-' : 'The key must start with sk-');
      return;
    }

    await AsyncStorage.setItem(OPENAI_KEY_STORAGE, normalizedKey);
    setAiSourceMode('device');
    setShowApiKeyModal(false);
    setApiKeyError(null);
    Alert.alert(
      isAr ? 'تم!' : 'Done!',
      isAr ? 'سيتم استخدام OpenAI على هذا الجهاز الآن.' : 'OpenAI will now be used on this device.',
    );
  }, [apiKeyInput, isAr]);

  const handleAttachPress = useCallback(() => {
    Alert.alert(
      isAr ? 'استخدم MathScan للصور' : 'Use MathScan for photos',
      isAr
        ? 'رفع الصور داخل المحادثة ليس مفعلاً بعد. افتح MathScan للحصول على شرح خطوة بخطوة من صورة المسألة.'
        : 'Photo uploads are not enabled in chat yet. Open MathScan for step-by-step help from a problem image.',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'افتح MathScan' : 'Open MathScan',
          onPress: () => router.push('/mathscan'),
        },
      ],
    );
  }, [isAr, router]);

  // ── Active chat view ──────────────────────────────────────────────────────
  if (activeChat) {
    return (
      <>
        <KeyboardAvoidingView
          style={[s.container, { backgroundColor: theme.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}>
          {/* Header */}
          <LinearGradient colors={theme.primary} style={[ch.header, isAr && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity onPress={() => setActiveChat(null)} style={[ch.backBtn, { backgroundColor: ui.glass }]}>
              <Ionicons name={isAr ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.primaryInk} />
            </TouchableOpacity>
            <View style={[ch.headerAvatar, { backgroundColor: ui.glassStrong }]}>
              <Text style={ch.headerAvatarText}>∫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  ch.headerTitle,
                  { color: theme.primaryInk },
                  isAr ? ch.textRtlFlow : ch.textLtrFlow,
                  isAr && ch.textRtl,
                ]}
                numberOfLines={1}>
                {formatChatMessageForDisplay(activeChat, isAr)}
              </Text>
              <Text
                style={[
                  ch.headerSub,
                  { color: withAlpha(theme.primaryInk, 0.74) },
                  isAr ? ch.textRtlFlow : ch.textLtrFlow,
                  isAr && ch.textRtl,
                ]}>
                {formatChatMessageForDisplay(getAiSourceStatus(aiSourceMode, isAr), isAr)}
              </Text>
            </View>
            {!MANAGED_AI_ENABLED ? (
              <TouchableOpacity style={[ch.moreBtn, { backgroundColor: ui.glass }]} onPress={() => void openApiKeyModal()}>
                <Ionicons name="key-outline" size={20} color={theme.primaryInk} />
              </TouchableOpacity>
            ) : null}
          </LinearGradient>

          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            contentContainerStyle={ch.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.map((msg) => {
              const isMathMessage = hasMathText(msg.text);
              const displayText = formatChatMessageForDisplay(msg.text, isAr);
              return (
                <View key={msg.id} style={[ch.msgRow, msg.from === 'user' ? ch.msgRowUser : ch.msgRowAi]}>
                  {msg.from === 'ai' && (
                    <View style={[ch.aiAvatar, { backgroundColor: theme.accent }]}><Text style={[ch.aiAvatarText, { color: theme.primaryInk }]}>∫</Text></View>
                  )}
                  <View
                    style={[
                      ch.bubble,
                      msg.from === 'user'
                        ? [ch.bubbleUser, { backgroundColor: theme.accent }]
                        : [ch.bubbleAi, { backgroundColor: theme.surface, borderColor: theme.border }],
                    ]}>
                    <Text
                      style={[
                        ch.bubbleText,
                        { color: msg.from === 'user' ? theme.primaryInk : theme.text },
                        isAr ? ch.textRtlFlow : ch.textLtrFlow,
                        isAr && ch.textRtl,
                        isMathMessage && ch.mathText,
                      ]}>
                      {displayText}
                    </Text>
                  </View>
                </View>
              );
            })}
            {isTyping && (
              <View style={[ch.msgRow, ch.msgRowAi]}>
                <View style={[ch.aiAvatar, { backgroundColor: theme.accent }]}><Text style={[ch.aiAvatarText, { color: theme.primaryInk }]}>∫</Text></View>
                <View style={[ch.bubble, ch.bubbleAi, { backgroundColor: theme.surface, borderColor: theme.border }, ch.typingBubble]}>
                  <Text style={{ color: theme.muted, fontSize: 20, letterSpacing: 5 }}>···</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={[ch.inputBar, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && ch.inputBarRtl]}>
            <TouchableOpacity style={ch.attachBtn} onPress={handleAttachPress} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={24} color={theme.muted} />
            </TouchableOpacity>
            <TextInput
              style={[
                ch.input,
                { color: theme.text },
                isAr ? ch.textRtlFlow : ch.textLtrFlow,
                isAr && ch.textRtl,
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isAr ? 'اكتب سؤالك...' : 'Ask your question…'}
              placeholderTextColor={theme.muted}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
            />
            <Animated.View style={{ transform: [{ scale: inputAnim }] }}>
              <TouchableOpacity
                style={[ch.sendBtn, !inputText.trim() && { opacity: 0.35 }]}
                onPress={sendMessage}
                disabled={!inputText.trim()}>
                <LinearGradient colors={theme.primary} style={ch.sendGrad}>
                  <Ionicons name={isAr ? 'arrow-back' : 'send'} size={16} color={theme.primaryInk} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        <ApiKeyPromptModal
          visible={showApiKeyModal}
          title={isAr ? 'مفتاح OpenAI' : 'OpenAI API Key'}
          subtitle={
            isAr
              ? 'أدخل مفتاح sk- لتفعيل ردود GPT-4o-mini داخل المدرب الذكي.'
              : 'Enter your sk- key to enable GPT-4o-mini responses in the AI coach.'
          }
          placeholder="sk-..."
          value={apiKeyInput}
          onChangeText={(value) => {
            setApiKeyInput(value);
            if (apiKeyError) setApiKeyError(null);
          }}
          onClose={() => {
            setShowApiKeyModal(false);
            setApiKeyError(null);
          }}
          onSave={() => void saveApiKey()}
          isAr={isAr}
          error={apiKeyError}
          hint={
            isAr
              ? 'اترك الحقل فارغاً لإزالة المفتاح من هذا الجهاز.'
              : 'Leave the field empty to remove the key from this device.'
          }
          saveLabel={isAr ? 'حفظ المفتاح' : 'Save Key'}
          cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        />
      </>
    );
  }

  // ── Main AI Chat browse view ──────────────────────────────────────────────
  return (
    <>
      {/* Accent header matching BoldVoice style */}
      <LinearGradient colors={theme.primary} style={[s.pageHeader, isAr && { flexDirection: 'row-reverse' }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              s.pageHeaderTitle,
              { color: theme.primaryInk },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {formatChatMessageForDisplay(isAr ? 'المدرب الذكي' : 'AI Coach', isAr)}
          </Text>
          <Text
            style={[
              s.pageHeaderSub,
              { color: withAlpha(theme.primaryInk, 0.7) },
              isAr ? s.textRtlFlow : s.textLtrFlow,
              isAr && s.textRtl,
            ]}>
            {formatChatMessageForDisplay(
              isAr ? 'اختر مساراً أو موضوعاً وابدأ التعلم بوضوح' : 'Choose a path or topic and start with clarity',
              isAr,
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.historyBtn, { backgroundColor: ui.glass }]}
          onPress={() => setShowHistory((v) => !v)}>
          <Ionicons name="time-outline" size={22} color={theme.primaryInk} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={[s.container, { backgroundColor: theme.bg }]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>

        {/* Segment control */}
        <View style={[s.segRow, isAr && s.segRowRtl]}>
          {(['path', 'topic'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.segBtn, mode === m && s.segBtnActive, { backgroundColor: mode === m ? theme.accent : theme.surface }]}
              onPress={() => setMode(m)}
              activeOpacity={0.85}>
              <Ionicons
                name={m === 'path' ? 'sparkles-outline' : 'grid-outline'}
                size={15}
                color={mode === m ? theme.primaryInk : theme.muted}
                style={{ marginRight: isAr ? 0 : 6, marginLeft: isAr ? 6 : 0 }}
              />
              <Text style={[s.segText, { color: mode === m ? theme.primaryInk : theme.muted }, mode === m && s.segTextActive]}>
                {m === 'path' ? (isAr ? 'المسارات' : 'Paths') : (isAr ? 'المواضيع' : 'Topics')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'topic' ? (
          <>
            {/* Quick-start cards */}
            <Text style={[s.sectionTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'بداية سريعة' : 'Quick Start'}
            </Text>
            <View style={[s.quickRow, isAr && s.quickRowRtl]}>
              {QUICK_CHATS.map((c) => (
                <TouchableOpacity
                  key={c.titleEn}
                  style={s.quickCard}
                  activeOpacity={0.9}
                  onPress={() => openChat(isAr ? c.titleAr : c.titleEn, isAr ? c.introAr : c.introEn)}>
                  <LinearGradient
                    colors={theme.primary}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
                  />
                  <Ionicons name={c.icon as any} size={24} color={theme.primaryInk} style={{ marginBottom: 8 }} />
                  <Text style={[s.quickCardTitle, { color: theme.primaryInk, textAlign: isAr ? 'right' : 'left' }]}>
                    {isAr ? c.titleAr : c.titleEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Topic grid */}
            <Text style={[s.sectionTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'مواضيع الرياضيات' : 'Math Topics'}
            </Text>
            <View style={s.topicGrid}>
              {TOPIC_CARDS.map((c) => (
                <TouchableOpacity
                  key={c.titleEn}
                  style={[s.topicCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.85}
                  onPress={() => handleTopicPress(c.titleEn, c.titleAr)}>
                  <View style={[s.topicIconWrap, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
                    <Ionicons name={c.icon as any} size={20} color={theme.accent} />
                  </View>
                  <Text style={[s.topicTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
                    {isAr ? c.titleAr : c.titleEn}
                  </Text>
                  <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={theme.muted} style={{ alignSelf: 'flex-end' }} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <LinearGradient colors={theme.primary} style={s.heroCard}>
              <View style={[s.heroTopRow, isAr && s.rowReverse]}>
                <View style={[s.heroBadge, { backgroundColor: ui.glass }]}>
                  <Ionicons name="sparkles" size={13} color={theme.primaryInk} />
                  <Text style={[s.heroBadgeText, { color: theme.primaryInk }]}>{isAr ? 'موصى به اليوم' : 'Recommended Today'}</Text>
                </View>
                <Text style={[s.heroMetaText, { color: withAlpha(theme.primaryInk, 0.72) }, isAr && { textAlign: 'right' }]}>
                  {scoreHistory.length > 0
                    ? isAr ? 'استناداً إلى نشاطك الأخير' : 'Based on recent activity'
                    : isAr ? 'أفضل بداية مع المدرب' : 'Best place to start'}
                </Text>
              </View>

              <Text style={[s.heroTitle, { color: theme.primaryInk }, isAr && { textAlign: 'right' }]}>{isAr ? recommendedPath.titleAr : recommendedPath.titleEn}</Text>
              <Text style={[s.heroSub, { color: withAlpha(theme.primaryInk, 0.82) }, isAr && { textAlign: 'right' }]}>{recommendationNote}</Text>

              <View style={s.heroTagRow}>
                {(isAr ? recommendedPath.bulletsAr : recommendedPath.bulletsEn).map((bullet) => (
                  <View key={`${recommendedPath.key}-${bullet}`} style={[s.heroTag, { backgroundColor: withAlpha(theme.primaryInk, 0.18) }]}>
                    <Text style={[s.heroTagText, { color: theme.primaryInk }]}>{bullet}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  s.heroAction,
                  {
                    backgroundColor: ui.inverseSoft,
                    borderColor: theme.id === 'light' ? withAlpha(theme.primary[1], 0.16) : 'transparent',
                  },
                  isAr && s.rowReverse,
                  isAr && { alignSelf: 'flex-end' },
                ]}
                activeOpacity={0.9}
                onPress={() => handlePathPress(recommendedPath)}>
                <Text style={[s.heroActionText, { color: theme.id === 'light' ? theme.primary[1] : theme.primaryInk }]}>
                  {isAr ? 'ابدأ هذا المسار' : 'Start this path'}
                </Text>
                <Ionicons
                  name={isAr ? 'arrow-back' : 'arrow-forward'}
                  size={16}
                  color={theme.id === 'light' ? theme.primary[1] : theme.primaryInk}
                />
              </TouchableOpacity>
            </LinearGradient>

            <Text style={[s.sectionTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'مسارات المدرب' : 'Coach Paths'}
            </Text>
            <Text style={[s.sectionCaption, { color: theme.muted, textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'اختر أسلوب المذاكرة الذي يناسب هدفك الآن.' : 'Choose the study style that matches your goal right now.'}
            </Text>

            <View style={s.pathList}>
              {COACH_PATHS.map((path) => {
                const isRecommended = path.key === recommendedPath.key;
                const bullets = isAr ? path.bulletsAr : path.bulletsEn;

                return (
                  <TouchableOpacity
                    key={path.key}
                    style={[
                      s.pathCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: isRecommended ? withAlpha(theme.accent, 0.24) : theme.border,
                      },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handlePathPress(path)}>
                    <View style={[s.pathTopRow, isAr && s.rowReverse]}>
                      <View style={[s.pathIconWrap, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
                        <Ionicons name={path.icon as any} size={22} color={theme.accent} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[s.pathEyebrow, { color: theme.accent, textAlign: isAr ? 'right' : 'left' }]}>
                          {isAr ? path.eyebrowAr : path.eyebrowEn}
                        </Text>
                        <Text style={[s.pathTitle, { color: theme.text, textAlign: isAr ? 'right' : 'left' }]}>
                          {isAr ? path.titleAr : path.titleEn}
                        </Text>
                        <Text style={[s.pathSub, { color: theme.muted, textAlign: isAr ? 'right' : 'left' }]}>
                          {isAr ? path.subAr : path.subEn}
                        </Text>
                      </View>
                    </View>

                    <View style={s.pathTagRow}>
                      {bullets.map((bullet) => (
                        <View key={`${path.key}-${bullet}`} style={[s.pathTag, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
                          <Text style={[s.pathTagText, { color: theme.text }]}>{bullet}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[s.pathFooter, isAr && s.rowReverse]}>
                      <Text style={[s.pathHintText, { color: theme.muted }]}>
                        {isRecommended ? (isAr ? 'الأفضل لك الآن' : 'Best for you now') : (isAr ? '3 نقاط تركيز' : '3 focus areas')}
                      </Text>
                      <View style={[s.pathCta, isAr && s.rowReverse]}>
                        <Text style={[s.pathCtaText, { color: theme.accent }]}>{isAr ? 'ابدأ' : 'Start'}</Text>
                        <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={14} color={theme.accent} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* History bottom sheet */}
      {showHistory && (
        <View style={[s.sheetBackdrop, { backgroundColor: ui.scrim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowHistory(false)} activeOpacity={1} />
          <View style={[s.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[s.sheetBar, isAr && { flexDirection: 'row-reverse' }]}>
              <Text
                style={[
                  s.sheetTitle,
                  { color: theme.text },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {formatChatMessageForDisplay(isAr ? 'آخر الدروس والاختبارات' : 'Recent Activity', isAr)}
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={20} color={theme.muted} />
              </TouchableOpacity>
            </View>
            {scoreHistory.length === 0 ? (
              <View style={s.sheetEmpty}>
                <Ionicons name="book-outline" size={28} color={theme.muted} style={{ marginBottom: 8 }} />
                <Text
                  style={[
                    s.sheetEmptyText,
                    { color: theme.muted },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {formatChatMessageForDisplay(
                    isAr ? 'لا توجد نشاطات بعد. أكمل درساً أو اختباراً لترى نتائجك هنا.' : 'No activity yet. Complete a lesson or exam to see your results here.',
                    isAr,
                  )}
                </Text>
              </View>
            ) : (
              scoreHistory.slice(0, 5).map((item) => {
                const scoreColor = item.score >= 75 ? ui.success : item.score >= 50 ? theme.accent : theme.danger;
                const iconName: any = item.type === 'exam' ? 'school-outline' : 'book-outline';
                const activitySubtitle = formatRecentActivitySubtitle(item, isAr);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.sheetItem, { backgroundColor: theme.bg, borderColor: theme.border }, isAr && s.sheetItemRtl]}
                    onPress={() => {
                      openChat(
                        isAr ? item.titleAr : item.titleEn,
                        undefined,
                        isAr
                          ? `نتيجة سابقة: ${item.titleAr} - ${item.score}%`
                          : `Recent result: ${item.titleEn} - ${item.score}%`,
                      );
                    }}
                    activeOpacity={0.88}>
                    <LinearGradient colors={theme.primary} style={s.sheetIcon}>
                      <Ionicons name={iconName} size={22} color={theme.primaryInk} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.sheetItemTitle,
                          { color: theme.text },
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && s.textRtl,
                        ]}
                        numberOfLines={1}>
                        {formatChatMessageForDisplay(isAr ? item.titleAr : item.titleEn, isAr)}
                      </Text>
                      <Text
                        style={[
                          s.sheetItemSub,
                          { color: theme.muted },
                          isAr ? s.textRtlFlow : s.textLtrFlow,
                          isAr && s.textRtl,
                        ]}>
                        {formatChatMessageForDisplay(activitySubtitle, isAr)}
                      </Text>
                    </View>
                    <View style={[s.scoreBadge, { borderColor: scoreColor }]}>
                      <Text style={[s.scoreText, { color: scoreColor }]}>{item.score}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, direction: 'ltr' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  // ── Page header (gold accent bar) ──
  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },  pageHeaderTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  pageHeaderSub: { fontSize: 13, fontFamily: 'Amiri_400Regular', marginTop: 2 },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Segment ──
  segRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  segRowRtl: { flexDirection: 'row-reverse' },
  segBtn: {
    flex: 1, height: 44, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  segBtnActive: {},
  segText: { fontSize: 14, fontWeight: '600', fontFamily: 'Amiri_700Bold' },
  segTextActive: { fontFamily: 'Amiri_700Bold' },

  // ── Section titles ──
  sectionTitle: { fontSize: 19, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 12, marginTop: 4 },
  sectionCaption: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular', marginBottom: 14, marginTop: -4 },

  rowReverse: { flexDirection: 'row-reverse' },

  // ── Hero card ──
  heroCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  heroMetaText: { fontSize: 12, fontFamily: 'Amiri_400Regular', flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 8 },
  heroSub: { fontSize: 14, lineHeight: 21, fontFamily: 'Amiri_400Regular', marginBottom: 14 },
  heroTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  heroTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(27,29,48,0.10)' },
  heroTagText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  heroAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  heroActionText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // ── Quick start ──
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickRowRtl: { flexDirection: 'row-reverse' },
  quickCard: {
    flex: 1, height: 110, borderRadius: 16, overflow: 'hidden',
    padding: 14, justifyContent: 'flex-end',
  },
  quickCardTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // ── Topic grid ──
  topicGrid: { gap: 10, marginBottom: 24 },
  topicCard: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  topicIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { flex: 1, fontSize: 15, fontWeight: '600', fontFamily: 'Amiri_700Bold' },

  // ── Path cards ──
  pathList: { gap: 12, marginBottom: 24 },
  pathCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pathTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  pathIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pathEyebrow: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 4 },
  pathTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 4 },
  pathSub: { fontSize: 13, lineHeight: 20, fontFamily: 'Amiri_400Regular' },
  pathTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pathTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  pathTagText: { fontSize: 12, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  pathFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pathHintText: { fontSize: 12, fontFamily: 'Amiri_400Regular', flex: 1 },
  pathCta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pathCtaText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // ── History sheet ──
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 16, paddingBottom: 44, gap: 12 },
  sheetBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sheetItem: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetItemRtl: { flexDirection: 'row-reverse' },
  sheetIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sheetItemTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sheetItemSub: { fontSize: 12, marginTop: 2, fontFamily: 'Amiri_400Regular' },
  scoreBadge: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  sheetEmpty: { padding: 20, alignItems: 'center' },
  sheetEmptyText: { fontSize: 13, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 20 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});

// ── Chat styles ───────────────────────────────────────────────────────────────
const ch = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Amiri_400Regular', marginTop: 1 },
  moreBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  msgList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgRowAi: {},
  aiAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiAvatarText: { fontSize: 14, fontWeight: '700' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: SW * 0.74 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAi: { borderBottomLeftRadius: 4, borderWidth: 1 },
  typingBubble: { minWidth: 70, alignItems: 'center' },
  bubbleText: { fontSize: 15, fontFamily: 'Amiri_400Regular', lineHeight: 22 },
  mathText: { fontFamily: 'Amiri_700Bold', lineHeight: 24, letterSpacing: 0.15 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
  },
  inputBarRtl: { flexDirection: 'row-reverse' },
  attachBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Amiri_400Regular',
    maxHeight: 100,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  sendBtn: { borderRadius: 20, overflow: 'hidden' },
  sendGrad: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
