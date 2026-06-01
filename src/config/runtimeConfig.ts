import Constants from 'expo-constants';

type ExtraConfig = {
  introVideoUrl?: unknown;
  welcomeVideoUrl?: unknown;
  textbookPdfUrl?: unknown;
  managedAiEnabled?: unknown;
  managedAiBaseUrl?: unknown;
  managedAiChatPath?: unknown;
  managedAiVisionPath?: unknown;
  founderName?: unknown;
  founderTitleEn?: unknown;
  founderTitleAr?: unknown;
  founderMessageEn?: unknown;
  founderMessageAr?: unknown;
  founderImageUrl?: unknown;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readOptionalUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
}

export const runtimeConfig = {
  introVideoUrl: readOptionalUrl(extra.introVideoUrl),
  welcomeVideoUrl: readOptionalUrl(extra.welcomeVideoUrl),
  textbookPdfUrl: readOptionalUrl(extra.textbookPdfUrl),
  managedAiEnabled: readBoolean(extra.managedAiEnabled, false),
  managedAiBaseUrl: readOptionalUrl(extra.managedAiBaseUrl),
  managedAiChatPath: readString(extra.managedAiChatPath, '/ai/chat'),
  managedAiVisionPath: readString(extra.managedAiVisionPath, '/ai/vision'),
  founderName: readString(extra.founderName, 'Hamza Alfasatleh'),
  founderTitleEn: readString(extra.founderTitleEn, 'Founder & Tawjihi Math Mentor'),
  founderTitleAr: readString(extra.founderTitleAr, 'المؤسس ومرشد رياضيات التوجيهي'),
  founderMessageEn: readString(
    extra.founderMessageEn,
    'I built SnapMath Academy to give Jordanian students clear steps, strong practice, and real exam confidence every day.',
  ),
  founderMessageAr: readString(
    extra.founderMessageAr,
    'بنيت SnapMath Academy ليحصل طلاب الأردن على شرح واضح، وتدريب قوي، وثقة حقيقية في الامتحان كل يوم.',
  ),
  founderImageUrl: readOptionalUrl(extra.founderImageUrl),
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SM';
}
