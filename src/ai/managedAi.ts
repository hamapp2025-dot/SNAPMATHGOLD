import { auth } from '../../firebaseConfig';
import { runtimeConfig } from '../config/runtimeConfig';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type VisionStep = {
  label: string;
  body: string;
};

export type ManagedVisionSolveResult = {
  question: string;
  questionAr: string;
  steps: VisionStep[];
  stepsAr: VisionStep[];
};

const MANAGED_AI_TIMEOUT_MS = 18000;
const MANAGED_AI_MAX_ATTEMPTS = 2;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function buildManagedAiUrl(path: string): string | null {
  const baseUrl = runtimeConfig.managedAiEnabled ? runtimeConfig.managedAiBaseUrl : null;
  if (!baseUrl) return null;

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function buildManagedAiHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Continue without an auth token if Firebase auth is not ready.
  }

  return headers;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postManagedAiJson(url: string, body: Record<string, unknown>) {
  for (let attempt = 1; attempt <= MANAGED_AI_MAX_ATTEMPTS; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), MANAGED_AI_TIMEOUT_MS)
      : null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: await buildManagedAiHeaders(),
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      if (response.ok) {
        return await response.json();
      }

      if (attempt >= MANAGED_AI_MAX_ATTEMPTS || !RETRYABLE_STATUS_CODES.has(response.status)) {
        return null;
      }
    } catch {
      if (attempt >= MANAGED_AI_MAX_ATTEMPTS) {
        return null;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    await wait(550 * attempt);
  }

  return null;
}

function isVisionStep(value: unknown): value is VisionStep {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { label?: unknown }).label === 'string' &&
    typeof (value as { body?: unknown }).body === 'string'
  );
}

export function hasManagedAiBackend(): boolean {
  return !!buildManagedAiUrl(runtimeConfig.managedAiChatPath);
}

export async function requestManagedAiChat(params: {
  messages: ChatMessage[];
  isAr: boolean;
  systemPrompt: string;
  contextPrompt?: string | null;
}): Promise<string | null> {
  const url = buildManagedAiUrl(runtimeConfig.managedAiChatPath);
  if (!url) return null;

  const data = await postManagedAiJson(url, {
    messages: params.messages,
    systemPrompt: params.systemPrompt,
    contextPrompt: params.contextPrompt ?? null,
    locale: params.isAr ? 'ar' : 'en',
    client: 'snapmathacademy-mobile',
  });

  if (!data) {
    return null;
  }

  if (typeof data?.reply === 'string' && data.reply.trim()) {
    return data.reply.trim();
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  return null;
}

export async function requestManagedVisionSolve(params: {
  base64Image: string;
  isAr: boolean;
  systemPrompt: string;
}): Promise<ManagedVisionSolveResult | null> {
  const url = buildManagedAiUrl(runtimeConfig.managedAiVisionPath);
  if (!url) return null;

  const data = await postManagedAiJson(url, {
    imageBase64: params.base64Image,
    systemPrompt: params.systemPrompt,
    locale: params.isAr ? 'ar' : 'en',
    client: 'snapmathacademy-mobile',
  });

  if (
    typeof data?.question === 'string' &&
    typeof data?.questionAr === 'string' &&
    Array.isArray(data?.steps) &&
    Array.isArray(data?.stepsAr) &&
    data.steps.every(isVisionStep) &&
    data.stepsAr.every(isVisionStep)
  ) {
    return {
      question: data.question,
      questionAr: data.questionAr,
      steps: data.steps,
      stepsAr: data.stepsAr,
    };
  }

  return null;
}
