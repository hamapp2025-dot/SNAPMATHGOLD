/**
 * MathScan — point the camera at any math problem and get instant step-by-step solutions.
 *
 * Flow:
 *   Camera  ──snap──►  Processing (animated scan)  ──done──►  Solution steps
 *
 * If an OpenAI key is stored (@snapmath_openai_key), the captured image is
 * sent to GPT-4o Vision for real OCR + step-by-step solution.
 * Otherwise falls back to the built-in Grade-12 problem bank.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { hasManagedAiBackend, requestManagedVisionSolve } from '../src/ai/managedAi';
import { useXP, XP_CORRECT_ANSWER } from '../src/hooks/useXP';
import { useSubscription } from '../src/subscriptions/SubscriptionContext';
import { canAccessFeature } from '../src/subscriptions/subscriptionAccess';
import MilestoneModal from '../components/MilestoneModal';
import ApiKeyPromptModal from '../components/ApiKeyPromptModal';
import PremiumAccessScreen from '../components/PremiumAccessScreen';
import { stabilizeMixedMathText } from '../src/utils/bidi';
import { formatMathDisplayText } from '../src/utils/mathText';
import { withAlpha } from '../src/theme/colorUtils';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#0A7AFF';
const GOLD_DARK = '#2590FF';
const FRAME_SIZE = SW * 0.78;
const OPENAI_KEY_STORAGE = '@snapmath_openai_key';
const MANAGED_AI_ENABLED = hasManagedAiBackend();

// ─── Grade-12 problem bank ────────────────────────────────────────────────────
type Step = { label: string; body: string };
type Problem = {
  id: string;
  question: string;
  questionAr: string;
  steps: Step[];
  stepsAr: Step[];
  xp: number;
};

const PROBLEMS: Problem[] = [
  {
    id: 'limit1',
    question: 'Find: lim (x→2) (x² − 4) / (x − 2)',
    questionAr: 'أوجد النهاية: lim (x→2) (x² − 4) / (x − 2)',
    xp: 10,
    steps: [
      { label: 'Factor the numerator', body: 'x² − 4 = (x − 2)(x + 2)' },
      { label: 'Cancel common factor', body: '[(x−2)(x+2)] / (x−2) = x + 2 &emsp;(x ≠ 2)' },
      { label: 'Substitute x = 2', body: 'lim = 2 + 2 = 4' },
      { label: 'Answer', body: '📦  lim (x→2) (x²−4)/(x−2)  =  4' },
    ],
    stepsAr: [
      { label: 'تحليل البسط', body: 'x² − 4 = (x − 2)(x + 2)' },
      { label: 'إلغاء العامل المشترك', body: '[(x−2)(x+2)] / (x−2) = x + 2' },
      { label: 'تعويض x = 2', body: 'النهاية = 2 + 2 = 4' },
      { label: 'الجواب', body: '📦  النهاية = 4' },
    ],
  },
  {
    id: 'deriv1',
    question: "Differentiate: f(x) = 3x⁴ − 5x² + 7",
    questionAr: "اشتق: f(x) = 3x⁴ − 5x² + 7",
    xp: 10,
    steps: [
      { label: 'Power rule: d/dx [xⁿ] = n·xⁿ⁻¹', body: '' },
      { label: 'Differentiate each term', body: "d/dx(3x⁴) = 12x³ \nd/dx(−5x²) = −10x \nd/dx(7) = 0" },
      { label: 'Combine', body: "f '(x) = 12x³ − 10x" },
      { label: 'Answer', body: "📦  f '(x) = 12x³ − 10x" },
    ],
    stepsAr: [
      { label: 'قاعدة القوة: d/dx [xⁿ] = n·xⁿ⁻¹', body: '' },
      { label: 'اشتقاق كل حد', body: "d/dx(3x⁴) = 12x³ \nd/dx(−5x²) = −10x \nd/dx(7) = 0" },
      { label: 'الدمج', body: "f '(x) = 12x³ − 10x" },
      { label: 'الجواب', body: "📦  f '(x) = 12x³ − 10x" },
    ],
  },
  {
    id: 'integral1',
    question: "Integrate: ∫ (4x³ + 2x) dx",
    questionAr: "احسب: ∫ (4x³ + 2x) dx",
    xp: 10,
    steps: [
      { label: 'Power rule for integration: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C', body: '' },
      { label: 'Integrate each term', body: "∫4x³ dx = x⁴ \n∫2x dx = x²" },
      { label: 'Combine + constant', body: "∫(4x³+2x) dx = x⁴ + x² + C" },
      { label: 'Answer', body: "📦  x⁴ + x² + C" },
    ],
    stepsAr: [
      { label: 'قاعدة القوة للتكامل: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C', body: '' },
      { label: 'تكامل كل حد', body: "∫4x³ dx = x⁴ \n∫2x dx = x²" },
      { label: 'الدمج + الثابت', body: "∫(4x³+2x) dx = x⁴ + x² + C" },
      { label: 'الجواب', body: "📦  x⁴ + x² + C" },
    ],
  },
  {
    id: 'trig1',
    question: "Solve for x: sin(x) = √3/2,  0 ≤ x ≤ 2π",
    questionAr: "حل المعادلة: sin(x) = √3/2,  0 ≤ x ≤ 2π",
    xp: 10,
    steps: [
      { label: 'Recall reference angle', body: 'sin(π/3) = √3/2  →  reference angle = π/3' },
      { label: 'Sine is positive in Q1 and Q2', body: 'x = π/3   or   x = π − π/3 = 2π/3' },
      { label: 'Answer', body: '📦  x = π/3  or  x = 2π/3' },
    ],
    stepsAr: [
      { label: 'الزاوية المرجعية', body: 'sin(π/3) = √3/2  →  الزاوية المرجعية = π/3' },
      { label: 'الجيب موجب في الربعين الأول والثاني', body: 'x = π/3   أو   x = 2π/3' },
      { label: 'الجواب', body: '📦  x = π/3  أو  x = 2π/3' },
    ],
  },
  {
    id: 'vector1',
    question: 'Find a·b if a = (1, 2, 3) and b = (2, -1, 4)',
    questionAr: 'أوجد a·b إذا كان a = (1, 2, 3) و b = (2, -1, 4)',
    xp: 10,
    steps: [
      { label: 'Use the dot product formula', body: 'a·b = a1b1 + a2b2 + a3b3' },
      { label: 'Substitute the coordinates', body: 'a·b = (1)(2) + (2)(-1) + (3)(4)' },
      { label: 'Simplify', body: 'a·b = 2 - 2 + 12 = 12' },
      { label: 'Answer', body: '📦  a·b = 12' },
    ],
    stepsAr: [
      { label: 'استخدم صيغة الجداء النقطي', body: 'a·b = a1b1 + a2b2 + a3b3' },
      { label: 'عوّض الإحداثيات', body: 'a·b = (1)(2) + (2)(-1) + (3)(4)' },
      { label: 'بسّط', body: 'a·b = 2 - 2 + 12 = 12' },
      { label: 'الجواب', body: '📦  a·b = 12' },
    ],
  },
  {
    id: 'complex1',
    question: "Simplify: (3 + 4i)(2 − i)",
    questionAr: "بسّط: (3 + 4i)(2 − i)",
    xp: 10,
    steps: [
      { label: 'FOIL expansion', body: '= 6 − 3i + 8i − 4i²' },
      { label: 'Recall i² = −1', body: '= 6 − 3i + 8i − 4(−1) = 6 + 4 + 5i' },
      { label: 'Answer', body: '📦  10 + 5i' },
    ],
    stepsAr: [
      { label: 'التوسيع', body: '= 6 − 3i + 8i − 4i²' },
      { label: 'i² = −1', body: '= 6 − 3i + 8i + 4 = 10 + 5i' },
      { label: 'الجواب', body: '📦  10 + 5i' },
    ],
  },
];

let _scanIndex = 0; // round-robin through problems (fallback)

type VisionSolveResult = {
  question: string;
  questionAr: string;
  steps: Step[];
  stepsAr: Step[];
};

function normalizeStepArray(raw: unknown, isAr: boolean): Step[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is { label?: unknown; body?: unknown } => typeof item === 'object' && item !== null)
    .map((item, index) => ({
      label:
        typeof item.label === 'string' && item.label.trim().length > 0
          ? item.label.trim()
          : isAr
            ? `الخطوة ${index + 1}`
            : `Step ${index + 1}`,
      body: typeof item.body === 'string' ? item.body.trim() : '',
    }))
    .filter((item) => item.label.length > 0 || item.body.length > 0);
}

function parseLegacyVisionText(raw: string, isAr: boolean): VisionSolveResult {
  const lines = raw.split('\n').filter((line) => line.trim());
  const steps: Step[] = [];
  let question = '';

  for (const line of lines) {
    const trimmed = line.replace(/^\d+[\.\)]\s*/, '').replace(/^\*+/, '').trim();
    if (!trimmed) continue;
    if (!question && (trimmed.includes('=') || trimmed.includes('∫') || trimmed.includes('lim') || trimmed.length < 120)) {
      question = trimmed;
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      steps.push({ label: trimmed.slice(0, colonIdx).trim(), body: trimmed.slice(colonIdx + 1).trim() });
    } else if (steps.length === 0) {
      steps.push({ label: isAr ? 'التحليل' : 'Analysis', body: trimmed });
    } else {
      steps[steps.length - 1].body += `\n${trimmed}`;
    }
  }

  if (steps.length === 0) {
    steps.push({ label: isAr ? 'الحل' : 'Solution', body: raw.slice(0, 400) });
  }

  const last = steps[steps.length - 1];
  if (last && !last.label.includes(isAr ? 'الجواب' : 'Answer')) {
    last.label = isAr ? '📦 الجواب النهائي' : '📦 Final Answer';
  }

  return {
    question: question || 'Scanned Problem',
    questionAr: question || 'المسألة الممسوحة',
    steps,
    stepsAr: steps,
  };
}

// ─── OpenAI Vision solver ─────────────────────────────────────────────────────
async function solveWithAI(
  base64Image: string,
  isAr: boolean,
): Promise<VisionSolveResult | null> {
  const systemPrompt = `You are SnapMath Academy Vision, a Grade 12 Tawjihi math solver for Jordan.
Return STRICT JSON only with this exact shape:
{
  "question": "English question",
  "questionAr": "Arabic question",
  "steps": [{"label":"...", "body":"..."}],
  "stepsAr": [{"label":"...", "body":"..."}]
}

Rules:
- Extract the problem accurately from the image.
- Follow Jordanian textbook style: identify the idea, show short numbered steps, and end with a clear final answer.
- Keep each step concise and useful.
- Preserve mathematical notation exactly.
- If the text is unclear, say so in the first step instead of inventing data.`;

  const managedResult = await requestManagedVisionSolve({
    base64Image,
    isAr,
    systemPrompt,
  });
  if (managedResult) {
    return managedResult;
  }

  if (MANAGED_AI_ENABLED) {
    return null;
  }

  try {
    const apiKey = await AsyncStorage.getItem(OPENAI_KEY_STORAGE);
    if (!apiKey || !apiKey.startsWith('sk-')) return null;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' },
              },
              {
                type: 'text',
                text: isAr
                  ? 'استخرج السؤال ثم أعد JSON فقط. اكتب خطوات عربية واضحة بصيغة الكتاب الأردني، مع جواب نهائي واضح.'
                  : 'Extract the question and return JSON only. Use clear Jordan-style textbook steps and a final answer.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const json = await response.json();
    const raw: string = json.choices?.[0]?.message?.content ?? '';
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Partial<VisionSolveResult>;
      const steps = normalizeStepArray(parsed.steps, false);
      const stepsAr = normalizeStepArray(parsed.stepsAr, true);

      if (steps.length > 0 || stepsAr.length > 0) {
        return {
          question:
            typeof parsed.question === 'string' && parsed.question.trim().length > 0
              ? parsed.question.trim()
              : 'Scanned Problem',
          questionAr:
            typeof parsed.questionAr === 'string' && parsed.questionAr.trim().length > 0
              ? parsed.questionAr.trim()
              : 'المسألة الممسوحة',
          steps: steps.length > 0 ? steps : stepsAr,
          stepsAr: stepsAr.length > 0 ? stepsAr : steps,
        };
      }
    } catch {
      // Fall back to plain-text parsing below.
    }

    return parseLegacyVisionText(raw, isAr);
  } catch {
    return null;
  }
}

// ─── Scan frame overlay component ────────────────────────────────────────────
function ScanFrame({ scanAnim }: { scanAnim: Animated.Value }) {
  const corner = 22;
  const cw = 3;
  return (
    <View style={sf.frameWrap} pointerEvents="none">
      {/* corner brackets */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <View key={i} style={[sf.corner, pos]}>
          <View style={[sf.cH, { borderTopWidth: i < 2 ? cw : 0, borderBottomWidth: i >= 2 ? cw : 0, borderLeftWidth: i % 2 === 0 ? cw : 0, borderRightWidth: i % 2 === 1 ? cw : 0, width: corner, height: corner }]} />
        </View>
      ))}
      {/* sweep line */}
      <Animated.View
        style={[
          sf.sweepLine,
          {
            opacity: scanAnim.interpolate({ inputRange: [0, 0.05, 0.95, 1], outputRange: [0, 1, 1, 0] }),
            top: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_SIZE - 2] }),
          },
        ]}
      />
    </View>
  );
}

const sf = StyleSheet.create({
  frameWrap: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 22, height: 22 },
  cH: { borderColor: GOLD },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, index, total, theme, isAr }: { step: Step; index: number; total: number; theme: any; isAr: boolean }) {
  const isAnswer = index === total - 1;
  return (
    <View style={[sc.card, isAr && sc.cardRtl, { backgroundColor: isAnswer ? GOLD : theme.surface, borderColor: isAnswer ? GOLD : theme.border }]}>
      <View style={[sc.numBadge, { backgroundColor: isAnswer ? withAlpha(theme.primaryInk, 0.18) : GOLD }]}>
        <Text style={sc.numText}>{isAnswer ? '✓' : index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {step.label ? (
          <Text
            style={[
              sc.label,
              { color: isAnswer ? theme.primaryInk : theme.text },
              isAr ? sc.textRtlFlow : sc.textLtrFlow,
              isAr && sc.textRtl,
            ]}>
            {stabilizeMixedMathText(formatMathDisplayText(step.label), isAr)}
          </Text>
        ) : null}
        {step.body ? (
          <Text
            style={[
              sc.body,
              { color: isAnswer ? withAlpha(theme.primaryInk, 0.82) : theme.muted },
              isAr ? sc.textRtlFlow : sc.textLtrFlow,
              isAr && sc.textRtl,
            ]}>
            {stabilizeMixedMathText(formatMathDisplayText(step.body), isAr)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardRtl: { flexDirection: 'row-reverse' },
  numBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 3 },
  body: { fontSize: 13, fontFamily: 'Amiri_400Regular', lineHeight: 20 },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
type Phase = 'camera' | 'processing' | 'result';

// AI-generated result shape (compatible with Problem for display)
type AIResult = {
  id: string;
  question: string;
  questionAr: string;
  steps: Step[];
  stepsAr: Step[];
  xp: number;
  fromAI: boolean;
};

export default function MathScanScreen() {
  const { currentTier } = useSubscription();

  if (!canAccessFeature(currentTier, 'mathscan')) {
    return <PremiumAccessScreen feature="mathscan" />;
  }

  return <MathScanContent />;
}

function MathScanContent() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { addXP, streak } = useXP();
  const [permission, requestPermission] = useCameraPermissions();

  const [phase, setPhase] = useState<Phase>('camera');
  const [problem, setProblem] = useState<Problem | AIResult | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [aiMode, setAiMode] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const scanMode = MANAGED_AI_ENABLED ? 'managed' : aiMode ? 'device' : 'guided';
  const scanModeTint = scanMode === 'guided' ? '#D8DEEE' : GOLD;
  const scanModeIcon =
    scanMode === 'managed'
      ? 'sparkles'
      : scanMode === 'device'
        ? 'key-outline'
        : 'library-outline';
  const scanModeLabel =
    scanMode === 'managed'
      ? (isAr ? 'الذكاء المتصل' : 'Managed AI')
      : scanMode === 'device'
        ? (isAr ? 'مفتاح هذا الجهاز' : 'Device key AI')
        : (isAr ? 'أمثلة موجّهة' : 'Guided examples');
  const scanModeDetail =
    scanMode === 'managed'
      ? (isAr ? 'سيحاول MathScan قراءة الصورة مباشرة وإرجاع خطوات حية بأسلوب الصف 12.' : 'MathScan will try to read the photo directly and return live Grade 12 steps.')
      : scanMode === 'device'
        ? (isAr ? 'يستخدم المفتاح المحفوظ على هذا الجهاز لقراءة السؤال من الصورة وحله.' : 'Uses the key saved on this device to read the photo and solve it.')
        : (isAr ? 'إذا تعذر الحل الحي فستحصل على مثال موجّه قريب من نوع المسألة.' : 'If live solving is unavailable, you will get a guided example close to the same problem type.');
  const scanTips = isAr
    ? ['اجعل السؤال كاملاً داخل الإطار', 'تأكد من وضوح الضوء والأرقام', 'التقط صفحة واحدة فقط لنتيجة أدق']
    : ['Keep the full question inside the frame', 'Use clear light and sharp numbers', 'Capture one page only for better accuracy'];

  useEffect(() => {
    // Check if user has stored an OpenAI key
    if (MANAGED_AI_ENABLED) {
      setAiMode(true);
      return;
    }
    AsyncStorage.getItem(OPENAI_KEY_STORAGE).then((k) => setAiMode(!!k && k.startsWith('sk-')));
  }, []);

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
      setAiMode(false);
      setShowApiKeyModal(false);
      setApiKeyError(null);
      Alert.alert(
        isAr ? 'تمت الإزالة' : 'Key removed',
        isAr ? 'تمت إزالة المفتاح من هذا الجهاز.' : 'The key was removed from this device.',
      );
      return;
    }

    if (!normalizedKey.startsWith('sk-')) {
      setApiKeyError(isAr ? 'يجب أن يبدأ المفتاح بـ sk-' : 'Key must start with sk-');
      return;
    }

    await AsyncStorage.setItem(OPENAI_KEY_STORAGE, normalizedKey);
    setAiMode(true);
    setShowApiKeyModal(false);
    setApiKeyError(null);
    Alert.alert(
      isAr ? '✅ تم' : '✅ Saved',
      isAr ? 'سيتم حل المسائل بالذكاء الاصطناعي.' : 'AI solving enabled.',
    );
  }, [apiKeyInput, isAr]);

  const apiKeyModal = (
    <ApiKeyPromptModal
      visible={showApiKeyModal}
      title={isAr ? 'مفتاح OpenAI' : 'OpenAI API Key'}
      subtitle={
        isAr
          ? 'أدخل مفتاح sk- لتفعيل الحل الذكي للمسائل المصورة داخل MathScan.'
          : 'Enter your sk- key to enable real AI solving for scanned math problems.'
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
  );

  // Scan sweep animation (loops during processing, also plays in camera mode)
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startSweep = useCallback(() => {
    scanAnim.setValue(0);
    scanLoop.current = Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false }),
    );
    scanLoop.current.start();
  }, []);

  const stopSweep = useCallback(() => {
    scanLoop.current?.stop();
    scanAnim.setValue(0);
  }, []);

  useEffect(() => {
    if (phase === 'camera') startSweep();
    else stopSweep();
    return stopSweep;
  }, [phase]);

  // Processing animation
  const processAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (phase !== 'processing') return;
    Animated.loop(
      Animated.timing(processAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [phase]);

  const snap = useCallback(async () => {
    setPhase('processing');

    let resolvedProblem: Problem | AIResult;

    try {
      // Try real camera capture → AI
      if (cameraRef.current && aiMode) {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
        const base64 = photo?.base64 ?? '';
        if (base64) {
          const aiResult = await solveWithAI(base64, isAr);
          if (aiResult) {
            resolvedProblem = {
              id: `ai-${Date.now()}`,
              question: aiResult.question,
              questionAr: aiResult.questionAr,
              steps: aiResult.steps,
              stepsAr: aiResult.stepsAr,
              xp: 15,
              fromAI: true,
            };
            setProblem(resolvedProblem);
            const { leveledUp, newStreak } = await addXP(15);
            setXpEarned(15);
            if (leveledUp) setMilestone(isAr ? '🎉 ارتقيت مستوى!' : '🎉 Level Up!');
            else if (newStreak && (streak + 1) % 7 === 0)
              setMilestone(isAr ? `🔥 ${streak + 1} أيام متتالية!` : `🔥 ${streak + 1}-day streak!`);
            setPhase('result');
            return;
          }
        }
      }
    } catch (_) {}

    if (MANAGED_AI_ENABLED) {
      Alert.alert(
        isAr ? 'تعذر تحليل الصورة' : 'Could not solve this photo',
        isAr
          ? 'لم نتمكن من قراءة السؤال من الصورة الآن. جرّب صورة أوضح أو حاول مرة أخرى بعد لحظة.'
          : 'We could not read this problem from the photo right now. Try a clearer image or retry in a moment.',
      );
      setPhase('camera');
      return;
    }

    // Fallback: pick from built-in problem bank
    const p = PROBLEMS[_scanIndex % PROBLEMS.length];
    _scanIndex += 1;
    setProblem(p);

    setTimeout(async () => {
      const { leveledUp, newStreak } = await addXP(p.xp);
      setXpEarned(p.xp);
      if (leveledUp) setMilestone(isAr ? '🎉 ارتقيت مستوى!' : '🎉 Level Up!');
      else if (newStreak && (streak + 1) % 7 === 0)
        setMilestone(isAr ? `🔥 ${streak + 1} أيام متتالية!` : `🔥 ${streak + 1}-day streak!`);
      setPhase('result');
    }, 2200);
  }, [addXP, isAr, streak, aiMode]);

  // ── Permission gate ──────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <>
        <View style={[s.center, { backgroundColor: theme.bg }]}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
        {apiKeyModal}
      </>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <View style={[s.center, { backgroundColor: theme.bg }]}>
          <Ionicons name="camera-outline" size={56} color={GOLD} style={{ marginBottom: 20 }} />
          <Text style={[s.permTitle, { color: theme.text }]}>
            {isAr ? 'يحتاج MathScan إذن الكاميرا' : 'MathScan needs Camera Access'}
          </Text>
          <Text style={[s.permSub, { color: theme.muted }]}>
            {isAr ? 'صوّر مسألتك الرياضية للحصول على إرشاد خطوة بخطوة' : 'Point your camera at any math problem for step-by-step guidance'}
          </Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD_DARK]} style={s.permBtnGrad}>
              <Text style={s.permBtnText}>{isAr ? 'منح الإذن' : 'Grant Permission'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
            <Text style={{ color: theme.muted, fontFamily: 'Amiri_400Regular', fontSize: 14 }}>
              {isAr ? 'رجوع' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
        {apiKeyModal}
      </>
    );
  }

  // ── Processing phase ─────────────────────────────────────────────────────────
  if (phase === 'processing') {
    const spin = processAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
      <>
        <View style={[s.center, { backgroundColor: theme.bg }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="scan-outline" size={72} color={GOLD} />
          </Animated.View>
          <Text style={[s.processingText, { color: theme.text }]}>{isAr ? 'جارٍ تحليل المسألة...' : 'Analysing your problem…'}</Text>
          <Text style={[s.processingSubText, { color: theme.muted }]}>
            {aiMode
              ? (isAr ? 'يتم حل الخطوات بالذكاء الاصطناعي' : 'AI is solving step by step')
              : (isAr ? 'يتم تجهيز مثال موجّه قريب من نوع المسألة' : 'Preparing a guided example close to this problem type')}
          </Text>
        </View>
        {apiKeyModal}
      </>
    );
  }

  // ── Result phase ─────────────────────────────────────────────────────────────
  if (phase === 'result' && problem) {
    const steps = isAr ? problem.stepsAr : problem.steps;
    const solvedWithLiveAi = 'fromAI' in problem && problem.fromAI;
    const scannedQuestionLabel = isAr ? 'السؤال الممسوح' : 'Scanned Question';
    const solutionStepsLabel = isAr ? 'خطوات الحل' : 'SOLUTION STEPS';
    const xpEarnedLabel = `+${xpEarned} XP`;
    const resultSourceLabel = solvedWithLiveAi
      ? (scanMode === 'managed'
          ? (isAr ? 'تم الحل عبر الذكاء المتصل' : 'Solved with Managed AI')
          : (isAr ? 'تم الحل عبر مفتاح هذا الجهاز' : 'Solved with device key AI'))
      : (isAr ? 'مثال موجّه من داخل التطبيق' : 'Guided in-app example');
    return (
      <>
        <View style={[s.container, { backgroundColor: theme.bg }]}>
          {/* Header */}
          <LinearGradient colors={[GOLD, GOLD_DARK]} style={[s.resultHeader, isAr && s.rowRtl]}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
              <Ionicons name={isAr ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={[
                s.resultHeaderTitle,
                { color: '#FFFFFF' },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && s.textRtl,
              ]}>
              {stabilizeMixedMathText(isAr ? 'الحل خطوة بخطوة' : 'Step-by-Step Solution', isAr)}
            </Text>
            <View style={[s.xpEarnedBadge, isAr && s.rowRtl]}>
              <Ionicons name="star" size={13} color="#FFFFFF" />
              <Text style={[s.xpEarnedText, isAr ? s.textRtlFlow : s.textLtrFlow]}>
                {stabilizeMixedMathText(xpEarnedLabel, isAr)}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>
            <View
              style={[
                s.resultSourcePill,
                {
                  backgroundColor: withAlpha(solvedWithLiveAi ? GOLD : theme.text, solvedWithLiveAi ? 0.12 : 0.08),
                  borderColor: solvedWithLiveAi ? withAlpha(GOLD, 0.22) : theme.border,
                },
                isAr && s.rowRtl,
              ]}>
              <Ionicons
                name={solvedWithLiveAi ? 'sparkles-outline' : 'library-outline'}
                size={15}
                color={solvedWithLiveAi ? GOLD : theme.muted}
              />
              <Text
                style={[
                  s.resultSourceText,
                  { color: solvedWithLiveAi ? GOLD : theme.muted },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {stabilizeMixedMathText(resultSourceLabel, isAr)}
              </Text>
            </View>

            {!solvedWithLiveAi ? (
              <View
                style={[
                  s.resultModeCallout,
                  {
                    backgroundColor: withAlpha(theme.accent, 0.08),
                    borderColor: withAlpha(theme.accent, 0.2),
                  },
                  isAr && s.rowRtl,
                ]}>
                <Ionicons name="library-outline" size={16} color={theme.accent} />
                <Text
                  style={[
                    s.resultModeText,
                    { color: theme.text },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                  ]}>
                  {stabilizeMixedMathText(
                    isAr
                      ? 'هذه النتيجة من مكتبة أمثلة موجّهة داخل التطبيق حتى يكتمل التعرف الحي على الصورة.'
                      : 'This result came from the built-in guided example library while live image solving is not fully active.',
                    isAr,
                  )}
                </Text>
              </View>
            ) : null}

            {/* Question card */}
            <View style={[s.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[s.qIconRow, isAr && s.rowRtl]}>
                <View style={s.qIcon}><Ionicons name="help" size={16} color="#FFFFFF" /></View>
                <Text
                  style={[
                    s.qLabel,
                    { color: theme.muted },
                    isAr ? s.textRtlFlow : s.textLtrFlow,
                    isAr && s.textRtl,
                    isAr && s.sectionLabelRtl,
                  ]}>
                  {stabilizeMixedMathText(scannedQuestionLabel, isAr)}
                </Text>
              </View>
              <Text
                style={[
                  s.questionText,
                  { color: theme.text },
                  isAr ? s.textRtlFlow : s.textLtrFlow,
                  isAr && s.textRtl,
                ]}>
                {stabilizeMixedMathText(formatMathDisplayText(isAr ? problem.questionAr : problem.question), isAr)}
              </Text>
            </View>

            {/* Steps */}
            <Text
              style={[
                s.stepsHeader,
                { color: theme.muted },
                isAr ? s.textRtlFlow : s.textLtrFlow,
                isAr && s.textRtl,
                isAr && s.sectionLabelRtl,
              ]}>
              {stabilizeMixedMathText(solutionStepsLabel, isAr)}
            </Text>
            {steps.map((step, i) => (
              <StepCard key={i} step={step} index={i} total={steps.length} theme={theme} isAr={isAr} />
            ))}

            {/* Action buttons */}
            <View style={[s.actionRow, isAr && s.rowRtl]}>
              <TouchableOpacity
                style={[s.actionBtn, isAr && s.rowRtl, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => { setPhase('camera'); setProblem(null); }}
                activeOpacity={0.85}>
                <Ionicons name="camera-outline" size={18} color={theme.accent} />
                <Text style={[s.actionBtnText, { color: theme.text }]}>{isAr ? 'مسح جديد' : 'New Scan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionBtnPrimary}
                onPress={() => router.push('/practice-session')}
                activeOpacity={0.85}>
                <LinearGradient colors={[GOLD, GOLD_DARK]} style={[s.actionBtnGrad, isAr && s.rowRtl]}>
                  <Ionicons name="barbell-outline" size={18} color="#FFFFFF" />
                  <Text style={s.actionBtnPrimaryText}>{isAr ? 'تدرب الآن' : 'Practice Now'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <MilestoneModal
            visible={!!milestone}
            title={milestone ? `${milestone.split('!')[0]}!` : ''}
            subtitle={isAr ? 'أحسنت! استمر في التقدم.' : 'Excellent! Keep the momentum going.'}
            onClose={() => setMilestone(null)}
          />
        </View>
        {apiKeyModal}
      </>
    );
  }

  // ── Camera phase ─────────────────────────────────────────────────────────────
  return (
    <>
      <View style={s.container}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />

        {/* Dark vignette overlay with hole in center */}
        <View style={s.vignetteTop} />
        <View style={s.vignetteRow}>
          <View style={s.vignetteSide} />
          <ScanFrame scanAnim={scanAnim} />
          <View style={s.vignetteSide} />
        </View>
        <View style={s.vignetteBottom} />

        {/* Top bar */}
        <View style={[s.topBar, isAr && s.rowRtl]}>
          <TouchableOpacity onPress={() => router.back()} style={s.topBarBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>{isAr ? 'ماسح الرياضيات' : 'MathScan'}</Text>
          <View style={[s.topBarActions, isAr && s.rowRtl]}>
            {!MANAGED_AI_ENABLED ? (
              <TouchableOpacity
                onPress={() => void openApiKeyModal()}
                style={[s.topBarBtn, aiMode && { borderWidth: 1.5, borderColor: GOLD }]}
                activeOpacity={0.8}>
                <Ionicons name="key-outline" size={20} color={aiMode ? GOLD : '#FFF'} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
              style={s.topBarBtn}
              activeOpacity={0.8}>
              <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color={flash === 'on' ? GOLD : '#FFF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI mode badge */}
        <View
          style={[
            s.aiBadge,
            isAr && s.rowRtl,
            {
              backgroundColor: withAlpha(scanModeTint, scanMode === 'guided' ? 0.12 : 0.18),
              borderColor: withAlpha(scanModeTint, 0.28),
            },
          ]}>
          <Ionicons name={scanModeIcon as any} size={12} color={scanModeTint} />
          <Text style={[s.aiBadgeText, { color: scanModeTint }]}>{scanModeLabel}</Text>
        </View>

        {/* Hint label */}
        <View style={s.hintWrap}>
          <Text style={s.hintText}>
            {isAr ? 'ضع المسألة داخل الإطار واضغط التقاط' : 'Frame your problem & tap Snap'}
          </Text>
        </View>

        <View style={[s.scanInfoCard, { borderColor: withAlpha(scanModeTint, 0.24), backgroundColor: withAlpha('#081021', 0.76) }]}>
          <View style={[s.scanInfoTopRow, isAr && s.rowRtl]}>
            <View style={[s.scanInfoModePill, { backgroundColor: withAlpha(scanModeTint, 0.14), borderColor: withAlpha(scanModeTint, 0.24) }]}>
              <Ionicons name={scanModeIcon as any} size={14} color={scanModeTint} />
              <Text style={[s.scanInfoModeText, { color: scanModeTint }]}>{scanModeLabel}</Text>
            </View>
            {!MANAGED_AI_ENABLED ? (
              <TouchableOpacity onPress={() => void openApiKeyModal()} activeOpacity={0.82} style={[s.scanInfoLink, { borderColor: withAlpha('#FFFFFF', 0.18) }]}>
                <Text style={s.scanInfoLinkText}>{aiMode ? (isAr ? 'تحديث المفتاح' : 'Update Key') : (isAr ? 'إضافة مفتاح' : 'Add Key')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={[s.scanInfoBody, isAr && s.textRtl]}>{scanModeDetail}</Text>
          <View style={[s.scanTipRow, isAr && s.rowRtl]}>
            {scanTips.map((tip) => (
              <View key={tip} style={[s.scanTipPill, { borderColor: withAlpha('#FFFFFF', 0.12), backgroundColor: withAlpha('#FFFFFF', 0.04) }]}>
                <Text style={[s.scanTipText, isAr && s.textRtl]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Snap button */}
        <View style={s.snapWrap}>
          <TouchableOpacity style={s.snapOuter} onPress={snap} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD_DARK]} style={s.snapInner}>
              <Ionicons name="scan" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.snapLabel}>{isAr ? 'التقاط' : 'Snap'}</Text>
        </View>
      </View>
      {apiKeyModal}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const VIGNETTE = 'rgba(6,8,24,0.82)';
const VSIDE = (SW - FRAME_SIZE) / 2;
const VTOP = (SH - FRAME_SIZE) / 2 - 60;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06081A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },

  // Vignette
  vignetteTop: { position: 'absolute', top: 0, left: 0, right: 0, height: VTOP, backgroundColor: VIGNETTE },
  vignetteRow: { position: 'absolute', top: VTOP, left: 0, right: 0, height: FRAME_SIZE, flexDirection: 'row' },
  vignetteSide: { width: VSIDE, backgroundColor: VIGNETTE },
  vignetteBottom: { position: 'absolute', top: VTOP + FRAME_SIZE, left: 0, right: 0, bottom: 0, backgroundColor: VIGNETTE },

  // Top bar
  topBar: { position: 'absolute', top: 56, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  topBarActions: { flexDirection: 'row', gap: 8 },
  topBarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', letterSpacing: 1 },

  // Hint
  hintWrap: { position: 'absolute', top: VTOP - 50, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center' },
  scanInfoCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 150,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  scanInfoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  scanInfoModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scanInfoModeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  scanInfoLink: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scanInfoLinkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  scanInfoBody: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
    marginBottom: 10,
  },
  scanTipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scanTipPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  scanTipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontFamily: 'Amiri_400Regular',
  },

  // Snap button
  snapWrap: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  snapOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: GOLD, padding: 4, marginBottom: 8 },
  snapInner: { flex: 1, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  snapLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Amiri_400Regular' },

  // Processing
  processingText: { color: '#FFF', fontSize: 20, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginTop: 24, textAlign: 'center' },
  processingSubText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Amiri_400Regular', marginTop: 8 },

  // AI badge
  aiBadge: {
    position: 'absolute',
    top: VTOP + FRAME_SIZE + 14,
    alignSelf: 'center',
    left: 0, right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  aiBadgeText: { color: GOLD, fontSize: 12, fontFamily: 'Amiri_700Bold', letterSpacing: 0.5 },

  // Permission
  permTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Amiri_700Bold', textAlign: 'center', marginBottom: 10 },
  permSub: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn: { borderRadius: 14, overflow: 'hidden' },
  permBtnGrad: { paddingHorizontal: 32, paddingVertical: 14 },
  permBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  // Result header
  resultHeader: { paddingTop: Platform.OS === 'ios' ? 58 : 32, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  resultHeaderTitle: { flex: 1, color: '#FFFFFF', fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  xpEarnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  xpEarnedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontFamily: 'Amiri_700Bold' },

  resultScroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 },
  resultSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  resultSourceText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  resultModeCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  resultModeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Amiri_400Regular',
  },

  // Question card
  questionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 18 },
  qIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  qIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  qLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  questionText: { fontSize: 17, fontWeight: '700', fontFamily: 'Amiri_700Bold', lineHeight: 26 },

  stepsHeader: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  actionBtnPrimary: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  actionBtnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
  rowRtl: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },
  textRtlFlow: { writingDirection: 'rtl' },
  textLtrFlow: { writingDirection: 'ltr' },
  sectionLabelRtl: { letterSpacing: 0, textTransform: 'none' },
});
