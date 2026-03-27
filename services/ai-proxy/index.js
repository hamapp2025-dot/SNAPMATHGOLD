const crypto = require('node:crypto');
const express = require('express');
const admin = require('firebase-admin');

const PORT = readNumberEnv('PORT', 3001);
const OPENAI_API_KEY = readString(process.env.OPENAI_API_KEY);
const OPENAI_CHAT_MODEL = readString(process.env.OPENAI_CHAT_MODEL, 'gpt-4o-mini');
const OPENAI_VISION_MODEL = readString(process.env.OPENAI_VISION_MODEL, OPENAI_CHAT_MODEL);
const CHAT_MAX_TOKENS = readNumberEnv('AI_CHAT_MAX_TOKENS', 500);
const VISION_MAX_TOKENS = readNumberEnv('AI_VISION_MAX_TOKENS', 800);
const RATE_LIMIT_WINDOW_MS = readNumberEnv('AI_RATE_LIMIT_WINDOW_MS', 60_000);
const RATE_LIMIT_MAX_REQUESTS = readNumberEnv('AI_RATE_LIMIT_MAX_REQUESTS', 12);
const MAX_MESSAGES = readNumberEnv('AI_MAX_MESSAGES', 20);
const MAX_IMAGE_BASE64_LENGTH = readNumberEnv('AI_MAX_IMAGE_BASE64_LENGTH', 6_000_000);
const ALLOW_ANONYMOUS_AI = readBooleanEnv('ALLOW_ANONYMOUS_AI', false);
const WAITLIST_ALLOWED_ROLES = new Set(['student', 'parent', 'teacher']);
const WAITLIST_ALLOWED_INTERESTS = new Set([
  'early-access',
  'monthly-plan',
  'semester-plan',
  'annual-plan',
]);
const WAITLIST_ADMIN_ARCHIVE_REASON_PRESETS = [
  { value: 'cleanup', label: 'Cleanup' },
  { value: 'test signup', label: 'Test signup' },
  { value: 'duplicate signup', label: 'Duplicate signup' },
  { value: 'invalid contact details', label: 'Invalid contact details' },
  { value: 'already handled offline', label: 'Already handled offline' },
  { value: 'outside target audience', label: 'Outside target audience' },
];
const WAITLIST_ADMIN_BULK_MAX_CONTACTS = 100;
const WAITLIST_ADMIN_QUERY_BATCH_LIMIT = 250;
const WAITLIST_ALLOWED_ORIGINS = new Set([
  'https://snapmathacademy.com',
  'https://www.snapmathacademy.com',
  'https://snapmath-academy-landing.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);
const WAITLIST_ADMIN_TOKEN = readString(process.env.WAITLIST_ADMIN_TOKEN);
const WAITLIST_EMAIL_PROVIDER = readString(process.env.WAITLIST_EMAIL_PROVIDER, 'resend').toLowerCase();
const WAITLIST_RESEND_API_KEY = readString(process.env.WAITLIST_RESEND_API_KEY);
const WAITLIST_CONFIRMATION_FROM_EMAIL = readString(process.env.WAITLIST_CONFIRMATION_FROM_EMAIL);
const WAITLIST_CONFIRMATION_REPLY_TO = readString(process.env.WAITLIST_CONFIRMATION_REPLY_TO);
const WAITLIST_CONFIRMATION_BASE_URL = readString(
  process.env.WAITLIST_CONFIRMATION_BASE_URL,
  'https://snapmathacademy.com',
);

const rateLimitBuckets = new Map();
const app = express();

app.set('trust proxy', true);
app.use(express.json({ limit: '12mb' }));

const DEFAULT_VISION_SYSTEM_PROMPT = `You are SnapMath Academy Vision, a Grade 12 Tawjihi math solver for Jordan.
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

function readString(value, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeSingleLine(value, maxLength = 200) {
  return readString(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeLongText(value, maxLength = 1200) {
  return readString(value).replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function readNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readBooleanEnv(name, fallback) {
  const value = readString(process.env[name]).toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function normalizePrivateKey(value) {
  return readString(value).replace(/\\n/g, '\n');
}

function readQueryString(value, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim();
  return fallback;
}

function readBoundedInteger(value, fallback, min, max) {
  const parsed = Number(readQueryString(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildWaitlistDocumentId(email) {
  return Buffer.from(email, 'utf8').toString('base64url');
}

function safeTokenCompare(left, right) {
  if (!left || !right) return false;

  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;

  try {
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

function readFirebaseServiceAccount() {
  const rawJson = readString(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (
        parsed &&
        typeof parsed === 'object' &&
        readString(parsed.project_id) &&
        readString(parsed.client_email) &&
        readString(parsed.private_key)
      ) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch (error) {
      console.error('[ai-proxy] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error);
    }
  }

  const projectId = readString(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = readString(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

function ensureFirebaseApp() {
  if (admin.apps.length > 0) return true;

  try {
    const serviceAccount = readFirebaseServiceAccount();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return true;
    }

    if (readString(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      return true;
    }
  } catch (error) {
    console.error('[ai-proxy] Firebase Admin init failed:', error);
  }

  return false;
}

function getRequesterId(req) {
  return req.aiUser?.uid || req.ip || 'unknown';
}

function setWaitlistCorsHeaders(req, res) {
  const origin = readString(req.headers.origin);
  const allowedOrigin = WAITLIST_ALLOWED_ORIGINS.has(origin) ? origin : '';

  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.set('Access-Control-Max-Age', '86400');

  if (allowedOrigin) {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
  }

  return { origin, allowedOrigin };
}

function parseWaitlistSubmission(body) {
  const name = normalizeSingleLine(body?.name, 120);
  const email = normalizeSingleLine(body?.email, 160).toLowerCase();
  const phone = normalizeSingleLine(body?.phone, 60);
  const role = normalizeSingleLine(body?.role, 40).toLowerCase();
  const interest = normalizeSingleLine(body?.interest, 40).toLowerCase();
  const notes = normalizeLongText(body?.notes, 1200);
  const locale = normalizeSingleLine(body?.locale, 8).toLowerCase() === 'ar' ? 'ar' : 'en';
  const website = normalizeSingleLine(body?.website, 120);

  if (website) {
    return { ok: true, honeypot: true };
  }

  if (name.length < 2) {
    return { ok: false, status: 400, error: 'invalid_name' };
  }

  if (!isValidEmail(email)) {
    return { ok: false, status: 400, error: 'invalid_email' };
  }

  if (!WAITLIST_ALLOWED_ROLES.has(role)) {
    return { ok: false, status: 400, error: 'invalid_role' };
  }

  if (!WAITLIST_ALLOWED_INTERESTS.has(interest)) {
    return { ok: false, status: 400, error: 'invalid_interest' };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      role,
      interest,
      notes,
      locale,
    },
  };
}

function escapeHtml(value) {
  return readString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getWaitlistInterestLabel(interest, locale) {
  const labels = {
    'early-access': { en: 'Early access', ar: 'الوصول المبكر' },
    'monthly-plan': { en: 'Monthly plan', ar: 'الاشتراك الشهري' },
    'semester-plan': { en: 'Semester plan', ar: 'الاشتراك الفصلي' },
    'annual-plan': { en: 'Annual plan', ar: 'الاشتراك السنوي' },
  };

  const label = labels[interest];
  if (!label) return locale === 'ar' ? 'سناب ماث' : 'SnapMath';
  return locale === 'ar' ? label.ar : label.en;
}

function getWaitlistRoleLabel(role, locale) {
  const labels = {
    student: { en: 'Student', ar: 'طالب / طالبة' },
    parent: { en: 'Parent', ar: 'ولي أمر' },
    teacher: { en: 'Teacher', ar: 'معلم / معلمة' },
  };

  const label = labels[role];
  if (!label) return locale === 'ar' ? 'مهتم' : 'Interested visitor';
  return locale === 'ar' ? label.ar : label.en;
}

function buildWaitlistConfirmationEmail(submission) {
  const locale = submission.locale === 'ar' ? 'ar' : 'en';
  const name = escapeHtml(submission.name || (locale === 'ar' ? 'صديق سناب ماث' : 'SnapMath learner'));
  const interestLabel = escapeHtml(getWaitlistInterestLabel(submission.interest, locale));
  const roleLabel = escapeHtml(getWaitlistRoleLabel(submission.role, locale));
  const pricingUrl = `${WAITLIST_CONFIRMATION_BASE_URL}#pricing`;
  const communityUrl = `${WAITLIST_CONFIRMATION_BASE_URL}#community`;

  if (locale === 'ar') {
    return {
      subject: 'تم تسجيلك في قائمة انتظار سناب ماث',
      html: `
        <div style="background:#0a0a0a;padding:32px 20px;font-family:Arial,sans-serif;color:#f7f4e8;">
          <div style="max-width:620px;margin:0 auto;border:1px solid rgba(191,160,68,0.28);border-radius:24px;background:#101010;padding:32px;">
            <p style="margin:0 0 12px;color:#f5e7a6;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;">SnapMath Academy</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.35;color:#ffffff;">أهلاً ${name}، تم تأكيد انضمامك إلى قائمة الانتظار.</h1>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.9;color:rgba(255,255,255,0.78);">
              سجّلنا اهتمامك بـ <strong style="color:#f5e7a6;">${interestLabel}</strong> كـ <strong style="color:#f5e7a6;">${roleLabel}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.9;color:rgba(255,255,255,0.72);">
              سنرسل لك تحديثات الإطلاق، تفاصيل الباقات، وروابط الوصول الأولى بمجرد فتح الدفعة الأولى من سناب ماث.
            </p>
            <div style="margin:0 0 24px;padding:18px 20px;border-radius:18px;background:rgba(191,160,68,0.08);border:1px solid rgba(191,160,68,0.24);">
              <p style="margin:0 0 8px;font-size:14px;color:#f5e7a6;">ما الذي سيصلك؟</p>
              <p style="margin:0;font-size:15px;line-height:1.8;color:rgba(255,255,255,0.76);">موعد فتح الدفعة الأولى، ما الذي يتضمنه كل اشتراك، وروابط التجربة أو الوصول المبكر عندما تصبح جاهزة.</p>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 24px;">
              <a href="${pricingUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;background:#bfa044;color:#000000;font-weight:700;text-decoration:none;">شاهد الباقات</a>
              <a href="${communityUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);color:#ffffff;text-decoration:none;">تابع تحديثات الإطلاق</a>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.5);">
              إذا احتجت أي شيء، يمكنك الرد على هذا البريد أو مراسلتنا على ${escapeHtml(
                WAITLIST_CONFIRMATION_REPLY_TO || 'hello@snapmathacademy.com',
              )}.
            </p>
          </div>
        </div>
      `,
      text:
        `أهلاً ${submission.name}, تم تسجيلك في قائمة انتظار سناب ماث.\n\n` +
        `سجلنا اهتمامك بـ ${getWaitlistInterestLabel(submission.interest, locale)} كـ ${getWaitlistRoleLabel(
          submission.role,
          locale,
        )}.\n` +
        `سنرسل لك تحديثات الإطلاق وتفاصيل الاشتراك وروابط الوصول الأولى عندما تصبح جاهزة.\n\n` +
        `الباقات: ${pricingUrl}\n` +
        `التحديثات: ${communityUrl}\n\n` +
        `للتواصل: ${WAITLIST_CONFIRMATION_REPLY_TO || 'hello@snapmathacademy.com'}`,
    };
  }

  return {
    subject: "You're on the SnapMath waitlist",
    html: `
      <div style="background:#0a0a0a;padding:32px 20px;font-family:Arial,sans-serif;color:#f7f4e8;">
        <div style="max-width:620px;margin:0 auto;border:1px solid rgba(191,160,68,0.28);border-radius:24px;background:#101010;padding:32px;">
          <p style="margin:0 0 12px;color:#f5e7a6;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;">SnapMath Academy</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.35;color:#ffffff;">Hi ${name}, your waitlist spot is confirmed.</h1>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.85;color:rgba(255,255,255,0.78);">
            We saved your interest in <strong style="color:#f5e7a6;">${interestLabel}</strong> as a <strong style="color:#f5e7a6;">${roleLabel}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.85;color:rgba(255,255,255,0.72);">
            We’ll email you launch timing, plan details, and early-access links as soon as the first SnapMath cohort opens.
          </p>
          <div style="margin:0 0 24px;padding:18px 20px;border-radius:18px;background:rgba(191,160,68,0.08);border:1px solid rgba(191,160,68,0.24);">
            <p style="margin:0 0 8px;font-size:14px;color:#f5e7a6;">What you can expect next</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:rgba(255,255,255,0.76);">First-cohort timing, pricing and plan coverage, and the first access links when they are ready.</p>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 24px;">
            <a href="${pricingUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;background:#bfa044;color:#000000;font-weight:700;text-decoration:none;">View plans</a>
            <a href="${communityUrl}" style="display:inline-block;padding:14px 20px;border-radius:999px;border:1px solid rgba(255,255,255,0.18);color:#ffffff;text-decoration:none;">Follow launch updates</a>
          </div>
          <p style="margin:0;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.5);">
            Need anything sooner? Reply to this message or email ${escapeHtml(
              WAITLIST_CONFIRMATION_REPLY_TO || 'hello@snapmathacademy.com',
            )}.
          </p>
        </div>
      </div>
    `,
    text:
      `Hi ${submission.name}, your SnapMath waitlist spot is confirmed.\n\n` +
      `We saved your interest in ${getWaitlistInterestLabel(submission.interest, locale)} as a ${getWaitlistRoleLabel(
        submission.role,
        locale,
      )}.\n` +
      `We’ll email you launch timing, plan details, and early-access links as soon as they’re ready.\n\n` +
      `Plans: ${pricingUrl}\n` +
      `Launch updates: ${communityUrl}\n\n` +
      `Reply: ${WAITLIST_CONFIRMATION_REPLY_TO || 'hello@snapmathacademy.com'}`,
  };
}

function getWaitlistEmailConfig() {
  if (WAITLIST_EMAIL_PROVIDER !== 'resend') return null;
  if (!WAITLIST_RESEND_API_KEY || !WAITLIST_CONFIRMATION_FROM_EMAIL) return null;

  return {
    provider: 'resend',
    apiKey: WAITLIST_RESEND_API_KEY,
    fromEmail: WAITLIST_CONFIRMATION_FROM_EMAIL,
    replyTo: WAITLIST_CONFIRMATION_REPLY_TO || undefined,
  };
}

function isWaitlistEmailReady() {
  return !!getWaitlistEmailConfig();
}

async function sendWaitlistConfirmationEmail(submission) {
  const emailConfig = getWaitlistEmailConfig();
  if (!emailConfig) {
    return { status: 'skipped', provider: WAITLIST_EMAIL_PROVIDER || null };
  }

  const email = buildWaitlistConfirmationEmail(submission);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${emailConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailConfig.fromEmail,
      to: [submission.email],
      reply_to: emailConfig.replyTo,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const rawText = await response.text();
  let data = null;

  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      readString(data?.message) || readString(data?.error) || rawText.slice(0, 300) || 'email_send_failed';
    throw new Error(message);
  }

  return {
    status: 'sent',
    provider: emailConfig.provider,
    providerMessageId: readString(data?.id) || null,
  };
}

async function recordWaitlistConfirmationResult(contactId, result) {
  const payload = {
    confirmationEmailStatus: result.status,
    confirmationEmailProvider: result.provider || null,
    lastConfirmationAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (result.status === 'sent') {
    payload.confirmationEmailSentAt = admin.firestore.FieldValue.serverTimestamp();
    payload.confirmationEmailMessageId = result.providerMessageId || null;
    payload.lastConfirmationError = admin.firestore.FieldValue.delete();
  } else if (result.status === 'failed') {
    payload.lastConfirmationError = readString(result.error, 'email_send_failed').slice(0, 300);
  }

  await admin.firestore().collection('landing_waitlist_contacts').doc(contactId).set(payload, { merge: true });
}

function timestampToISOString(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  const raw = new Date(value);
  return Number.isNaN(raw.getTime()) ? null : raw.toISOString();
}

function serializeWaitlistContact(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    email: readString(data.emailLower || data.email),
    name: readString(data.name),
    phone: readString(data.phone) || null,
    role: readString(data.role) || null,
    interest: readString(data.interest) || null,
    locale: readString(data.locale) || null,
    status: readString(data.status) || null,
    archivedAt: timestampToISOString(data.archivedAt),
    archivedReason: readString(data.archivedReason) || null,
    source: readString(data.source) || null,
    sourceOrigin: readString(data.sourceOrigin) || null,
    notes: readString(data.notes),
    submissionCount:
      typeof data.submissionCount === 'number' && Number.isFinite(data.submissionCount)
        ? data.submissionCount
        : 0,
    confirmationEmailStatus: readString(data.confirmationEmailStatus) || null,
    confirmationEmailProvider: readString(data.confirmationEmailProvider) || null,
    confirmationEmailMessageId: readString(data.confirmationEmailMessageId) || null,
    confirmationEmailSentAt: timestampToISOString(data.confirmationEmailSentAt),
    firstSubmittedAt: timestampToISOString(data.firstSubmittedAt),
    lastSubmittedAt: timestampToISOString(data.lastSubmittedAt),
    lastConfirmationAttemptAt: timestampToISOString(data.lastConfirmationAttemptAt),
    lastConfirmationError: readString(data.lastConfirmationError) || null,
    lastIp: readString(data.lastIp) || null,
    lastUserAgent: readString(data.lastUserAgent) || null,
  };
}

function matchesWaitlistFilters(contact, filters) {
  if (filters.role && contact.role !== filters.role) return false;
  if (filters.interest && contact.interest !== filters.interest) return false;
  if (filters.status && contact.status !== filters.status) return false;

  if (filters.search) {
    const haystack = [contact.email, contact.name, contact.phone, contact.notes].join(' ').toLowerCase();
    if (!haystack.includes(filters.search)) return false;
  }

  return true;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildWaitlistCsv(contacts) {
  const headers = [
    'id',
    'email',
    'name',
    'phone',
    'role',
    'interest',
    'locale',
    'status',
    'archivedAt',
    'archivedReason',
    'source',
    'sourceOrigin',
    'submissionCount',
    'confirmationEmailStatus',
    'confirmationEmailProvider',
    'confirmationEmailSentAt',
    'firstSubmittedAt',
    'lastSubmittedAt',
    'lastConfirmationAttemptAt',
    'lastConfirmationError',
    'lastIp',
    'lastUserAgent',
    'notes',
  ];

  const lines = contacts.map((contact) => headers.map((header) => csvEscape(contact[header])).join(','));
  return [headers.join(','), ...lines].join('\n');
}

function readWaitlistAdminToken(req) {
  const authorization = readString(req.headers.authorization);
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  const headerToken = readString(req.headers['x-waitlist-admin-token']);
  if (headerToken) return headerToken;

  return readQueryString(req.query.token);
}

function authenticateWaitlistAdmin(req, res, next) {
  if (!WAITLIST_ADMIN_TOKEN) {
    return res.status(503).json({ error: 'waitlist_admin_not_configured' });
  }

  const providedToken = readWaitlistAdminToken(req);
  if (!safeTokenCompare(providedToken, WAITLIST_ADMIN_TOKEN)) {
    return res.status(401).json({ error: 'invalid_admin_token' });
  }

  return next();
}

async function loadWaitlistContactsForAdmin(req) {
  const limit = readBoundedInteger(req.query.limit, 100, 1, 1000);
  const cursor = normalizeSingleLine(req.query.cursor, 200);
  const filters = {
    role: readQueryString(req.query.role).toLowerCase(),
    interest: readQueryString(req.query.interest).toLowerCase(),
    status: readQueryString(req.query.status).toLowerCase(),
    search: readQueryString(req.query.search).toLowerCase(),
  };
  const contactsRef = admin.firestore().collection('landing_waitlist_contacts');
  const matchedContacts = [];
  let query = contactsRef.orderBy('lastSubmittedAt', 'desc');
  let lastBatchDoc = null;

  if (cursor) {
    const cursorSnapshot = await contactsRef.doc(cursor).get();
    if (!cursorSnapshot.exists) {
      const error = new Error(`invalid waitlist admin cursor: ${cursor}`);
      error.code = 'invalid_waitlist_admin_cursor';
      throw error;
    }
    query = query.startAfter(cursorSnapshot);
  }

  while (matchedContacts.length < limit + 1) {
    const snapshot = await query.limit(WAITLIST_ADMIN_QUERY_BATCH_LIMIT).get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      lastBatchDoc = doc;
      const contact = serializeWaitlistContact(doc);
      if (!matchesWaitlistFilters(contact, filters)) continue;

      matchedContacts.push(contact);
      if (matchedContacts.length >= limit + 1) break;
    }

    if (matchedContacts.length >= limit + 1 || snapshot.docs.length < WAITLIST_ADMIN_QUERY_BATCH_LIMIT) {
      break;
    }

    query = contactsRef.orderBy('lastSubmittedAt', 'desc').startAfter(lastBatchDoc);
  }

  const contacts = matchedContacts.slice(0, limit);
  return {
    contacts,
    filters,
    limit,
    cursor: cursor || null,
    hasNextPage: matchedContacts.length > limit,
    nextCursor: matchedContacts.length > limit && contacts.length > 0 ? contacts[contacts.length - 1].id : null,
  };
}

async function readWaitlistTotalCount() {
  try {
    const aggregate = await admin.firestore().collection('landing_waitlist_contacts').count().get();
    return Number(aggregate.data().count || 0);
  } catch {
    return null;
  }
}

function parseWaitlistAdminContactAction(body) {
  const rawAction = normalizeSingleLine(body?.action, 20).toLowerCase();
  const action = rawAction === 'unarchive' ? 'restore' : rawAction;
  const email = normalizeSingleLine(body?.email, 160).toLowerCase();
  const contactId = normalizeSingleLine(body?.contactId, 160);
  const reason = normalizeLongText(body?.reason, 300);
  const confirm = normalizeSingleLine(body?.confirm, 20).toLowerCase();
  const deleteEvents = typeof body?.deleteEvents === 'boolean' ? body.deleteEvents : true;

  if (action !== 'archive' && action !== 'delete' && action !== 'restore') {
    return { ok: false, status: 400, error: 'invalid_admin_action' };
  }

  if (!contactId && !email) {
    return { ok: false, status: 400, error: 'missing_contact_reference' };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, status: 400, error: 'invalid_email' };
  }

  if (action === 'delete' && confirm !== 'delete') {
    return { ok: false, status: 400, error: 'delete_confirmation_required' };
  }

  return {
    ok: true,
    data: {
      action,
      email,
      contactId: contactId || buildWaitlistDocumentId(email),
      reason,
      deleteEvents,
    },
  };
}

function parseWaitlistAdminBulkAction(body) {
  const rawAction = normalizeSingleLine(body?.action, 20).toLowerCase();
  const action = rawAction === 'unarchive' ? 'restore' : rawAction;
  const reason = normalizeLongText(body?.reason, 300);
  const confirm = normalizeSingleLine(body?.confirm, 20).toLowerCase();
  const deleteEvents = typeof body?.deleteEvents === 'boolean' ? body.deleteEvents : true;
  const rawContactIds = Array.isArray(body?.contactIds) ? body.contactIds : [];
  const contactIds = Array.from(
    new Set(
      rawContactIds
        .map((value) => normalizeSingleLine(value, 160))
        .filter(Boolean),
    ),
  );

  if (action !== 'archive' && action !== 'delete' && action !== 'restore') {
    return { ok: false, status: 400, error: 'invalid_admin_action' };
  }

  if (contactIds.length === 0) {
    return { ok: false, status: 400, error: 'missing_contact_references' };
  }

  if (contactIds.length > WAITLIST_ADMIN_BULK_MAX_CONTACTS) {
    return { ok: false, status: 400, error: 'too_many_contact_references' };
  }

  if (action === 'delete' && confirm !== 'delete') {
    return { ok: false, status: 400, error: 'delete_confirmation_required' };
  }

  return {
    ok: true,
    data: {
      action,
      contactIds,
      reason,
      deleteEvents,
    },
  };
}

function createWaitlistContactNotFoundError(contactId) {
  const error = new Error(`waitlist contact not found: ${contactId}`);
  error.code = 'waitlist_contact_not_found';
  return error;
}

async function loadWaitlistContactForAdminAction(actionInput) {
  const contactRef = admin.firestore().collection('landing_waitlist_contacts').doc(actionInput.contactId);
  const contactSnapshot = await contactRef.get();

  if (!contactSnapshot.exists) {
    throw createWaitlistContactNotFoundError(actionInput.contactId);
  }

  return {
    contactRef,
    contactSnapshot,
  };
}

async function archiveWaitlistContact(actionInput) {
  const { contactRef, contactSnapshot } = await loadWaitlistContactForAdminAction(actionInput);
  const previousContact = serializeWaitlistContact(contactSnapshot);
  const payload = {
    status: 'archived',
    archivedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (actionInput.reason) {
    payload.archivedReason = actionInput.reason;
  }

  await contactRef.set(payload, { merge: true });

  return {
    contactId: contactRef.id,
    previousContact,
    contact: serializeWaitlistContact(await contactRef.get()),
  };
}

async function restoreWaitlistContact(actionInput) {
  const { contactRef, contactSnapshot } = await loadWaitlistContactForAdminAction(actionInput);
  const previousContact = serializeWaitlistContact(contactSnapshot);
  const payload = {
    status: 'new',
    archivedAt: admin.firestore.FieldValue.delete(),
    archivedReason: admin.firestore.FieldValue.delete(),
  };

  await contactRef.set(payload, { merge: true });

  return {
    contactId: contactRef.id,
    previousContact,
    contact: serializeWaitlistContact(await contactRef.get()),
  };
}

async function deleteWaitlistEventsForContact(contactId) {
  const eventsRef = admin.firestore().collection('landing_waitlist_events');
  let deletedEventCount = 0;

  while (true) {
    const snapshot = await eventsRef.where('contactId', '==', contactId).limit(400).get();
    if (snapshot.empty) return deletedEventCount;

    const batch = admin.firestore().batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deletedEventCount += snapshot.docs.length;

    if (snapshot.docs.length < 400) {
      return deletedEventCount;
    }
  }
}

async function deleteWaitlistContact(actionInput) {
  const { contactRef, contactSnapshot } = await loadWaitlistContactForAdminAction(actionInput);
  const previousContact = serializeWaitlistContact(contactSnapshot);
  let deletedEventCount = 0;

  if (actionInput.deleteEvents) {
    deletedEventCount = await deleteWaitlistEventsForContact(contactRef.id);
  }

  await contactRef.delete();

  return {
    contactId: contactRef.id,
    previousContact,
    deletedEventCount,
  };
}

async function runWaitlistAdminAction(actionInput) {
  if (actionInput.action === 'archive') {
    const result = await archiveWaitlistContact(actionInput);
    return {
      action: 'archive',
      contactId: result.contactId,
      previousContact: result.previousContact,
      contact: result.contact,
    };
  }

  if (actionInput.action === 'restore') {
    const result = await restoreWaitlistContact(actionInput);
    return {
      action: 'restore',
      contactId: result.contactId,
      previousContact: result.previousContact,
      contact: result.contact,
    };
  }

  const result = await deleteWaitlistContact(actionInput);
  return {
    action: 'delete',
    contactId: result.contactId,
    previousContact: result.previousContact,
    deletedEventCount: result.deletedEventCount,
  };
}

async function runWaitlistAdminBulkAction(actionInput) {
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let deletedEventCount = 0;

  for (const contactId of actionInput.contactIds) {
    try {
      const result = await runWaitlistAdminAction({
        action: actionInput.action,
        contactId,
        reason: actionInput.reason,
        deleteEvents: actionInput.deleteEvents,
      });

      successCount += 1;
      deletedEventCount += Number(result.deletedEventCount || 0);
      results.push({
        ok: true,
        action: result.action,
        contactId: result.contactId,
        email: result.contact?.email || result.previousContact?.email || null,
        deletedEventCount: Number(result.deletedEventCount || 0),
      });
    } catch (error) {
      failureCount += 1;
      results.push({
        ok: false,
        action: actionInput.action,
        contactId,
        error: error?.code === 'waitlist_contact_not_found' ? error.code : 'waitlist_admin_mutation_failed',
      });
    }
  }

  return {
    action: actionInput.action,
    requestedCount: actionInput.contactIds.length,
    successCount,
    failureCount,
    deletedEventCount,
    results,
  };
}

function buildWaitlistAdminUiHtml() {
  const roleOptionsJson = JSON.stringify(Array.from(WAITLIST_ALLOWED_ROLES));
  const interestOptionsJson = JSON.stringify(Array.from(WAITLIST_ALLOWED_INTERESTS));
  const archiveReasonPresetsJson = JSON.stringify(WAITLIST_ADMIN_ARCHIVE_REASON_PRESETS);

  return String.raw`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SnapMath Waitlist Admin</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07070a;
        --panel: rgba(16, 16, 18, 0.94);
        --panel-border: rgba(191, 160, 68, 0.22);
        --panel-muted: rgba(255, 255, 255, 0.06);
        --text: #f5f3ea;
        --muted: rgba(245, 243, 234, 0.66);
        --accent: #bfa044;
        --danger: #ef6a5b;
        --success: #66c27c;
        --warning: #f5c35b;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(191, 160, 68, 0.12), transparent 28%),
          linear-gradient(180deg, #09090c 0%, #060608 100%);
        color: var(--text);
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a {
        color: inherit;
      }

      .shell {
        width: min(1480px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 48px;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: clamp(28px, 3vw, 40px);
        line-height: 1.08;
      }

      .hero p {
        margin: 0;
        max-width: 720px;
        color: var(--muted);
        line-height: 1.6;
      }

      .hero-note {
        min-width: 240px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(191, 160, 68, 0.1);
        border: 1px solid rgba(191, 160, 68, 0.18);
        color: #f2e3a8;
        font-size: 13px;
        line-height: 1.5;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.22);
      }

      .stack {
        display: grid;
        gap: 18px;
      }

      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: end;
      }

      .toolbar-actions,
      .filter-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .field {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      .field span {
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .field input,
      .field select {
        width: 100%;
        min-height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        padding: 0 14px;
        font-size: 14px;
      }

      .field input:focus,
      .field select:focus {
        outline: 2px solid rgba(191, 160, 68, 0.52);
        outline-offset: 1px;
        border-color: rgba(191, 160, 68, 0.5);
      }

      .field.token {
        flex: 1 1 340px;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: minmax(260px, 2fr) repeat(4, minmax(140px, 1fr));
        gap: 14px;
      }

      .hint {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 13px;
      }

      button {
        min-height: 42px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.07);
        color: var(--text);
        padding: 0 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.12);
      }

      button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .primary-button {
        background: linear-gradient(135deg, rgba(191, 160, 68, 0.94), rgba(166, 134, 44, 0.94));
        color: #090909;
      }

      .secondary-button {
        background: rgba(191, 160, 68, 0.12);
        border-color: rgba(191, 160, 68, 0.18);
      }

      .ghost-button {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.12);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .stat {
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .stat .label {
        display: block;
        margin-bottom: 10px;
        color: var(--muted);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .stat strong {
        font-size: 24px;
        line-height: 1;
      }

      .message {
        display: none;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid transparent;
        font-size: 14px;
        line-height: 1.5;
      }

      .message.visible {
        display: block;
      }

      .message.success {
        background: rgba(102, 194, 124, 0.11);
        border-color: rgba(102, 194, 124, 0.26);
        color: #d7f0dd;
      }

      .message.error {
        background: rgba(239, 106, 91, 0.12);
        border-color: rgba(239, 106, 91, 0.28);
        color: #ffd9d2;
      }

      .message.warning {
        background: rgba(245, 195, 91, 0.12);
        border-color: rgba(245, 195, 91, 0.24);
        color: #f7e4b2;
      }

      .results-bar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
      }

      .results-meta {
        color: var(--muted);
        font-size: 13px;
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pagination-controls button {
        min-height: 36px;
        padding: 0 14px;
      }

      .page-summary {
        min-width: 78px;
        text-align: center;
        color: var(--muted);
        font-size: 13px;
      }

      .bulk-panel {
        padding: 18px 20px;
      }

      .bulk-panel-content {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .bulk-count {
        display: block;
        font-size: 16px;
        font-weight: 700;
      }

      .bulk-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: end;
        gap: 10px;
      }

      .bulk-reason-field {
        min-width: 220px;
      }

      .danger-button {
        border-color: rgba(239, 106, 91, 0.22);
        background: rgba(239, 106, 91, 0.12);
        color: #ffd9d2;
      }

      .table-shell {
        overflow: hidden;
        padding: 0;
      }

      .table-wrap {
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1180px;
      }

      th,
      td {
        padding: 16px 18px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      th {
        position: sticky;
        top: 0;
        background: rgba(7, 7, 10, 0.96);
        color: rgba(245, 243, 234, 0.74);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        z-index: 1;
      }

      tbody tr:hover {
        background: rgba(255, 255, 255, 0.028);
      }

      .lead-name {
        font-weight: 700;
        margin-bottom: 6px;
      }

      .selection-cell {
        width: 56px;
        text-align: center;
      }

      .selection-checkbox {
        width: 18px;
        height: 18px;
        accent-color: var(--accent);
        cursor: pointer;
      }

      .lead-secondary,
      .meta-line {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .meta-line + .meta-line {
        margin-top: 4px;
      }

      .notes {
        max-width: 300px;
        white-space: pre-wrap;
        line-height: 1.52;
        font-size: 13px;
      }

      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        border-radius: 999px;
        padding: 0 10px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.05);
      }

      .badge.status-new {
        color: #f3e39f;
        background: rgba(191, 160, 68, 0.16);
        border-color: rgba(191, 160, 68, 0.24);
      }

      .badge.status-archived {
        color: #e7d8b3;
        background: rgba(255, 255, 255, 0.07);
      }

      .badge.email-sent {
        color: #d2f1d9;
        background: rgba(102, 194, 124, 0.14);
        border-color: rgba(102, 194, 124, 0.24);
      }

      .badge.email-failed {
        color: #ffd9d2;
        background: rgba(239, 106, 91, 0.14);
        border-color: rgba(239, 106, 91, 0.26);
      }

      .badge.email-skipped,
      .badge.email-already-sent {
        color: #f7e4b2;
        background: rgba(245, 195, 91, 0.12);
        border-color: rgba(245, 195, 91, 0.22);
      }

      .row-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 190px;
      }

      .row-actions button {
        width: 100%;
      }

      .action-field {
        display: grid;
        gap: 6px;
      }

      .action-field span {
        color: var(--muted);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .action-field select {
        width: 100%;
        min-height: 36px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        padding: 0 10px;
        font-size: 13px;
      }

      .row-actions .danger {
        border-color: rgba(239, 106, 91, 0.22);
        background: rgba(239, 106, 91, 0.12);
        color: #ffd9d2;
      }

      .empty-state {
        text-align: center;
        color: var(--muted);
        padding: 48px 24px;
      }

      .empty-state strong {
        display: block;
        margin-bottom: 8px;
        color: var(--text);
      }

      @media (max-width: 1180px) {
        .filters-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .stats {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .shell {
          width: min(100vw - 20px, 1480px);
          padding: 20px 0 32px;
        }

        .hero {
          flex-direction: column;
        }

        .filters-grid,
        .stats {
          grid-template-columns: 1fr;
        }

        .toolbar {
          flex-direction: column;
          align-items: stretch;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div>
          <h1>SnapMath Waitlist Admin</h1>
          <p>
            Search, export, archive, restore, or delete waitlist leads without touching Firestore directly.
            This UI uses the same protected admin endpoints as the JSON API and keeps the token in
            session storage for the current browser tab only.
          </p>
        </div>
        <div class="hero-note">
          Internal tool only.
          <br />
          No token is appended to the URL.
        </div>
      </section>

      <div class="stack">
        <section class="panel">
          <div class="toolbar">
            <label class="field token">
              <span>Admin Token</span>
              <input
                id="token-input"
                type="password"
                autocomplete="off"
                spellcheck="false"
                placeholder="Paste WAITLIST_ADMIN_TOKEN"
              />
            </label>
            <div class="toolbar-actions">
              <button id="load-button" class="primary-button" type="button">Load Contacts</button>
              <button id="export-json-button" class="secondary-button" type="button">Export JSON</button>
              <button id="export-csv-button" class="secondary-button" type="button">Export CSV</button>
              <button id="forget-token-button" class="ghost-button" type="button">Forget Token</button>
            </div>
          </div>
          <p class="hint">The token is stored in <code>sessionStorage</code> for this browser tab only.</p>
        </section>

        <form id="filters-form" class="panel">
          <div class="filters-grid">
            <label class="field">
              <span>Search</span>
              <input id="search-input" type="search" placeholder="Email, name, phone, or notes" />
            </label>
            <label class="field">
              <span>Role</span>
              <select id="role-filter"></select>
            </label>
            <label class="field">
              <span>Interest</span>
              <select id="interest-filter"></select>
            </label>
            <label class="field">
              <span>Status</span>
              <select id="status-filter"></select>
            </label>
            <label class="field">
              <span>Limit</span>
              <input id="limit-input" type="number" min="1" max="1000" value="100" />
            </label>
          </div>
          <div class="filter-actions">
            <button class="primary-button" type="submit">Refresh Results</button>
            <button id="reset-filters-button" class="ghost-button" type="button">Reset Filters</button>
          </div>
        </form>

        <section class="stats">
          <div class="stat">
            <span class="label">Total Contacts</span>
            <strong id="total-contacts">-</strong>
          </div>
          <div class="stat">
            <span class="label">Returned</span>
            <strong id="returned-contacts">-</strong>
          </div>
          <div class="stat">
            <span class="label">Email Pipeline</span>
            <strong id="email-ready">-</strong>
          </div>
          <div class="stat">
            <span class="label">Current Search</span>
            <strong id="search-summary">All</strong>
          </div>
        </section>

        <div id="message" class="message" role="status" aria-live="polite"></div>
        <div class="results-bar">
          <div id="results-meta" class="results-meta">Enter an admin token, then load contacts.</div>
          <div class="pagination-controls">
            <button id="previous-page-button" class="ghost-button" type="button">Previous</button>
            <span id="page-summary" class="page-summary">Page 1</span>
            <button id="next-page-button" class="ghost-button" type="button">Next</button>
          </div>
        </div>

        <section class="panel bulk-panel">
          <div class="bulk-panel-content">
            <div>
              <strong id="selected-count" class="bulk-count">0 leads selected</strong>
              <p class="hint">Selections stay active while you move between pages in this browser tab.</p>
            </div>
            <div class="bulk-actions">
              <button id="select-page-button" class="ghost-button" type="button">Select Page</button>
              <button id="clear-selection-button" class="ghost-button" type="button">Clear Selection</button>
              <label class="field bulk-reason-field">
                <span>Bulk Archive Reason</span>
                <select id="bulk-archive-reason"></select>
              </label>
              <button id="bulk-archive-button" class="secondary-button" type="button">Archive Selected</button>
              <button id="bulk-restore-button" class="ghost-button" type="button">Restore Selected</button>
              <button id="bulk-delete-button" class="danger-button" type="button">Delete Selected</button>
            </div>
          </div>
        </section>

        <section class="panel table-shell">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="selection-cell">Select</th>
                  <th>Lead</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="contacts-body">
                <tr>
                  <td colspan="7" class="empty-state">
                    <strong>No data loaded yet.</strong>
                    Paste the admin token and click <em>Load Contacts</em>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>

    <script>
      const ROLE_OPTIONS = ${roleOptionsJson};
      const INTEREST_OPTIONS = ${interestOptionsJson};
      const ARCHIVE_REASON_PRESETS = ${archiveReasonPresetsJson};
      const STATUS_OPTIONS = ["", "new", "archived"];
      const CUSTOM_ARCHIVE_REASON_VALUE = "__custom__";
      const ROLE_LABELS = {
        student: "Student",
        parent: "Parent",
        teacher: "Teacher",
      };
      const INTEREST_LABELS = {
        "early-access": "Early access",
        "monthly-plan": "Monthly plan",
        "semester-plan": "Semester plan",
        "annual-plan": "Annual plan",
      };
      const EMAIL_STATUS_LABELS = {
        sent: "Email sent",
        failed: "Email failed",
        skipped: "Email skipped",
        "already-sent": "Already sent",
      };
      const TOKEN_STORAGE_KEY = "snapmath_waitlist_admin_token";

      const elements = {
        tokenInput: document.getElementById("token-input"),
        searchInput: document.getElementById("search-input"),
        limitInput: document.getElementById("limit-input"),
        roleFilter: document.getElementById("role-filter"),
        interestFilter: document.getElementById("interest-filter"),
        statusFilter: document.getElementById("status-filter"),
        loadButton: document.getElementById("load-button"),
        exportJsonButton: document.getElementById("export-json-button"),
        exportCsvButton: document.getElementById("export-csv-button"),
        forgetTokenButton: document.getElementById("forget-token-button"),
        resetFiltersButton: document.getElementById("reset-filters-button"),
        filtersForm: document.getElementById("filters-form"),
        message: document.getElementById("message"),
        resultsMeta: document.getElementById("results-meta"),
        previousPageButton: document.getElementById("previous-page-button"),
        nextPageButton: document.getElementById("next-page-button"),
        pageSummary: document.getElementById("page-summary"),
        selectedCount: document.getElementById("selected-count"),
        selectPageButton: document.getElementById("select-page-button"),
        clearSelectionButton: document.getElementById("clear-selection-button"),
        bulkArchiveReasonSelect: document.getElementById("bulk-archive-reason"),
        bulkArchiveButton: document.getElementById("bulk-archive-button"),
        bulkRestoreButton: document.getElementById("bulk-restore-button"),
        bulkDeleteButton: document.getElementById("bulk-delete-button"),
        contactsBody: document.getElementById("contacts-body"),
        totalContacts: document.getElementById("total-contacts"),
        returnedContacts: document.getElementById("returned-contacts"),
        emailReady: document.getElementById("email-ready"),
        searchSummary: document.getElementById("search-summary"),
      };

      const state = {
        loading: false,
        currentCursor: "",
        previousCursors: [],
        nextCursor: null,
        currentPageContacts: [],
        selectedContacts: new Map(),
      };

      function escapeHtml(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function setMessage(kind, text) {
        elements.message.className = "message visible " + kind;
        elements.message.textContent = text;
      }

      function clearMessage() {
        elements.message.className = "message";
        elements.message.textContent = "";
      }

      function resetPaging() {
        state.currentCursor = "";
        state.previousCursors = [];
        state.nextCursor = null;
      }

      function clearSelectedContacts() {
        state.selectedContacts.clear();
      }

      function getCurrentPageNumber() {
        return state.previousCursors.length + 1;
      }

      function syncPaginationControls() {
        elements.previousPageButton.disabled = state.loading || state.previousCursors.length === 0;
        elements.nextPageButton.disabled = state.loading || !state.nextCursor;
        elements.pageSummary.textContent = "Page " + getCurrentPageNumber();
      }

      function areAllCurrentPageContactsSelected() {
        return (
          state.currentPageContacts.length > 0 &&
          state.currentPageContacts.every(function (contact) {
            return state.selectedContacts.has(contact.id);
          })
        );
      }

      function syncBulkControls() {
        const selectedCount = state.selectedContacts.size;
        elements.selectedCount.textContent =
          formatNumber(selectedCount) + (selectedCount === 1 ? " lead selected" : " leads selected");
        elements.selectPageButton.disabled = state.loading || state.currentPageContacts.length === 0;
        elements.selectPageButton.textContent = areAllCurrentPageContactsSelected() ? "Unselect Page" : "Select Page";
        elements.clearSelectionButton.disabled = state.loading || selectedCount === 0;
        elements.bulkArchiveReasonSelect.disabled = state.loading || selectedCount === 0;
        elements.bulkArchiveButton.disabled = state.loading || selectedCount === 0;
        elements.bulkRestoreButton.disabled = state.loading || selectedCount === 0;
        elements.bulkDeleteButton.disabled = state.loading || selectedCount === 0;
      }

      function setLoading(loading) {
        state.loading = loading;
        elements.loadButton.disabled = loading;
        elements.exportJsonButton.disabled = loading;
        elements.exportCsvButton.disabled = loading;
        elements.resetFiltersButton.disabled = loading;
        elements.forgetTokenButton.disabled = loading;
        elements.loadButton.textContent = loading ? "Loading..." : "Load Contacts";
        Array.from(document.querySelectorAll("[data-contact-action], [data-contact-select]")).forEach(function (element) {
          element.disabled = loading;
        });
        syncPaginationControls();
        syncBulkControls();
      }

      function readToken() {
        return elements.tokenInput.value.trim();
      }

      function saveTokenToSession() {
        const token = readToken();
        if (!token) {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          return;
        }
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      }

      function loadTokenFromSession() {
        elements.tokenInput.value = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
      }

      function clearTokenFromSession() {
        elements.tokenInput.value = "";
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }

      function buildQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.keys(params).forEach(function (key) {
          const value = params[key];
          if (value == null || value === "") return;
          searchParams.set(key, String(value));
        });
        return searchParams.toString();
      }

      function readFilters() {
        return {
          limit: Math.min(1000, Math.max(1, Number(elements.limitInput.value) || 100)),
          search: elements.searchInput.value.trim(),
          role: elements.roleFilter.value,
          interest: elements.interestFilter.value,
          status: elements.statusFilter.value,
        };
      }

      function resetFilters() {
        elements.searchInput.value = "";
        elements.limitInput.value = "100";
        elements.roleFilter.value = "";
        elements.interestFilter.value = "";
        elements.statusFilter.value = "";
      }

      function populateSelect(select, values, labels) {
        select.innerHTML = "";
        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All";
        select.appendChild(allOption);

        values.forEach(function (value) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = labels[value] || value;
          select.appendChild(option);
        });
      }

      function formatDate(value) {
        if (!value) return "—";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "—";
        return parsed.toLocaleString();
      }

      function formatNumber(value) {
        if (value == null || Number.isNaN(Number(value))) return "—";
        return Number(value).toLocaleString();
      }

      async function apiFetchJson(path, options) {
        const token = readToken();
        if (!token) {
          throw new Error("Enter the admin token first.");
        }

        const headers = new Headers((options && options.headers) || {});
        headers.set("Authorization", "Bearer " + token);
        if (options && options.body && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }

        const response = await fetch(path, Object.assign({}, options || {}, {
          headers: headers,
          cache: "no-store",
        }));

        const payload = await response.json().catch(function () {
          return null;
        });

        if (!response.ok) {
          const error = new Error((payload && payload.error) || response.statusText || "Request failed");
          error.status = response.status;
          error.payload = payload;
          throw error;
        }

        return payload;
      }

      function getSearchSummary(filters) {
        const parts = [];
        if (filters.search) parts.push("search");
        if (filters.role) parts.push(ROLE_LABELS[filters.role] || filters.role);
        if (filters.interest) parts.push(INTEREST_LABELS[filters.interest] || filters.interest);
        if (filters.status) parts.push(filters.status);
        if (!parts.length) return "All";
        return parts.join(" · ");
      }

      function renderSummary(data) {
        const filters = data.filters || {};
        elements.totalContacts.textContent = formatNumber(data.totalContacts);
        elements.returnedContacts.textContent = formatNumber(data.returnedContacts);
        elements.emailReady.textContent = data.waitlistEmailReady ? "Ready" : "Not ready";
        elements.searchSummary.textContent = getSearchSummary(filters);
        elements.resultsMeta.textContent =
          "Showing " +
          formatNumber(data.returnedContacts) +
          " contacts on page " +
          formatNumber(getCurrentPageNumber()) +
          ". Total waitlist size: " +
          formatNumber(data.totalContacts) +
          ".";
      }

      function renderPagination(data) {
        const pagination = data.pagination || {};
        state.nextCursor = pagination.hasNextPage ? (pagination.nextCursor || null) : null;
        syncPaginationControls();
      }

      function buildBadge(label, className) {
        return '<span class="badge ' + className + '">' + escapeHtml(label) + "</span>";
      }

      function buildArchiveReasonOptionsHtml() {
        const options = ARCHIVE_REASON_PRESETS.map(function (item) {
          return (
            '<option value="' +
            escapeHtml(item.value) +
            '">' +
            escapeHtml(item.label) +
            "</option>"
          );
        });
        options.push(
          '<option value="' +
            CUSTOM_ARCHIVE_REASON_VALUE +
            '">Custom reason...</option>'
        );
        return options.join("");
      }

      function populateArchiveReasonSelect(select) {
        select.innerHTML = buildArchiveReasonOptionsHtml();
        if (ARCHIVE_REASON_PRESETS.length > 0) {
          select.value = ARCHIVE_REASON_PRESETS[0].value;
        }
      }

      function readArchiveReasonFromSelect(select, promptTitle) {
        const selectedValue = select ? String(select.value || "").trim() : "";

        if (selectedValue === CUSTOM_ARCHIVE_REASON_VALUE) {
          const customReason = window.prompt(promptTitle, ARCHIVE_REASON_PRESETS[0]?.value || "cleanup");
          if (customReason === null) {
            return { cancelled: true, reason: "" };
          }

          return {
            cancelled: false,
            reason: customReason.trim(),
          };
        }

        return {
          cancelled: false,
          reason: selectedValue,
        };
      }

      function renderStatusBadges(contact) {
        const badges = [];
        const statusClass = contact.status === "archived" ? "status-archived" : "status-new";
        badges.push(buildBadge(contact.status || "unknown", statusClass));

        if (contact.confirmationEmailStatus) {
          const emailClass = "email-" + String(contact.confirmationEmailStatus).replace(/[^a-z-]/g, "");
          badges.push(buildBadge(
            EMAIL_STATUS_LABELS[contact.confirmationEmailStatus] || contact.confirmationEmailStatus,
            emailClass
          ));
        }

        return '<div class="badge-row">' + badges.join("") + "</div>";
      }

      function renderRow(contact) {
        const details = [
          ROLE_LABELS[contact.role] || contact.role || "—",
          INTEREST_LABELS[contact.interest] || contact.interest || "—",
          contact.locale || "—",
        ];

        const activity = [];
        activity.push('<div class="meta-line"><strong>Last:</strong> ' + escapeHtml(formatDate(contact.lastSubmittedAt)) + "</div>");
        activity.push('<div class="meta-line"><strong>First:</strong> ' + escapeHtml(formatDate(contact.firstSubmittedAt)) + "</div>");
        if (contact.archivedAt) {
          activity.push('<div class="meta-line"><strong>Archived:</strong> ' + escapeHtml(formatDate(contact.archivedAt)) + "</div>");
        }
        activity.push('<div class="meta-line"><strong>Submissions:</strong> ' + escapeHtml(formatNumber(contact.submissionCount)) + "</div>");

        const actionButtons = [];
        if (contact.status !== "archived") {
          actionButtons.push(
            '<label class="action-field">' +
              "<span>Archive reason</span>" +
              '<select data-archive-reason>' +
                buildArchiveReasonOptionsHtml() +
              "</select>" +
            "</label>"
          );
          actionButtons.push(
            '<button type="button" data-contact-action="archive" data-contact-id="' +
              escapeHtml(contact.id) +
              '" data-contact-email="' +
              escapeHtml(contact.email || "") +
              '">Archive</button>'
          );
        } else {
          actionButtons.push(
            '<button type="button" class="ghost-button" data-contact-action="restore" data-contact-id="' +
              escapeHtml(contact.id) +
              '" data-contact-email="' +
              escapeHtml(contact.email || "") +
              '">Restore</button>'
          );
        }
        actionButtons.push(
          '<button type="button" class="danger" data-contact-action="delete" data-contact-id="' +
            escapeHtml(contact.id) +
            '" data-contact-email="' +
            escapeHtml(contact.email || "") +
            '">Delete</button>'
        );

        return (
          "<tr>" +
            '<td class="selection-cell">' +
              '<input type="checkbox" class="selection-checkbox" data-contact-select="' +
                escapeHtml(contact.id) +
                '"' +
                (state.selectedContacts.has(contact.id) ? " checked" : "") +
              " />" +
            "</td>" +
            "<td>" +
              '<div class="lead-name">' + escapeHtml(contact.name || "Unnamed lead") + "</div>" +
              '<div class="lead-secondary">' + escapeHtml(contact.email || "—") + "</div>" +
              (contact.phone ? '<div class="lead-secondary">' + escapeHtml(contact.phone) + "</div>" : "") +
            "</td>" +
            "<td>" +
              '<div class="meta-line"><strong>Role:</strong> ' + escapeHtml(details[0]) + "</div>" +
              '<div class="meta-line"><strong>Interest:</strong> ' + escapeHtml(details[1]) + "</div>" +
              '<div class="meta-line"><strong>Locale:</strong> ' + escapeHtml(details[2]) + "</div>" +
              '<div class="meta-line"><strong>Source:</strong> ' + escapeHtml(contact.source || "—") + "</div>" +
            "</td>" +
            "<td>" +
              renderStatusBadges(contact) +
              (contact.archivedReason
                ? '<div class="meta-line" style="margin-top:10px"><strong>Reason:</strong> ' + escapeHtml(contact.archivedReason) + "</div>"
                : "") +
              (contact.lastConfirmationError
                ? '<div class="meta-line" style="margin-top:10px"><strong>Email error:</strong> ' + escapeHtml(contact.lastConfirmationError) + "</div>"
                : "") +
            "</td>" +
            "<td>" + activity.join("") + "</td>" +
            "<td><div class=\"notes\">" + escapeHtml(contact.notes || "—") + "</div></td>" +
            '<td><div class="row-actions">' + actionButtons.join("") + "</div></td>" +
          "</tr>"
        );
      }

      function renderContacts(contacts) {
        if (!Array.isArray(contacts) || contacts.length === 0) {
          elements.contactsBody.innerHTML =
            '<tr><td colspan="7" class="empty-state"><strong>No contacts matched these filters.</strong>Try a broader search or increase the limit.</td></tr>';
          syncBulkControls();
          return;
        }

        elements.contactsBody.innerHTML = contacts.map(renderRow).join("");
        Array.from(elements.contactsBody.querySelectorAll("[data-contact-select]")).forEach(function (checkbox) {
          checkbox.addEventListener("change", function () {
            const contactId = checkbox.getAttribute("data-contact-select");
            const contact = state.currentPageContacts.find(function (item) {
              return item.id === contactId;
            });

            if (!contact) return;

            if (checkbox.checked) {
              state.selectedContacts.set(contact.id, {
                id: contact.id,
                email: contact.email || null,
                name: contact.name || null,
              });
            } else {
              state.selectedContacts.delete(contact.id);
            }

            syncBulkControls();
          });
        });
        Array.from(elements.contactsBody.querySelectorAll("[data-contact-action]")).forEach(function (button) {
          button.addEventListener("click", function () {
            handleContactAction(button);
          });
        });
        syncBulkControls();
      }

      async function loadContacts(options) {
        const config = Object.assign({ silent: false, resetPaging: false }, options || {});
        clearMessage();
        saveTokenToSession();

        if (config.resetPaging) {
          resetPaging();
          clearSelectedContacts();
        }

        setLoading(true);

        try {
          const filters = readFilters();
          const query = buildQueryString(
            Object.assign({}, filters, state.currentCursor ? { cursor: state.currentCursor } : {})
          );
          const data = await apiFetchJson("/waitlist/admin" + (query ? "?" + query : ""));
          state.currentPageContacts = Array.isArray(data.contacts) ? data.contacts : [];
          renderSummary(data);
          renderPagination(data);
          renderContacts(state.currentPageContacts);
          if (!config.silent) {
            setMessage("success", "Loaded " + formatNumber(data.returnedContacts) + " waitlist contacts.");
          }
          return true;
        } catch (error) {
          state.nextCursor = null;
          syncPaginationControls();
          setMessage("error", error.message || "Could not load waitlist contacts.");
          return false;
        } finally {
          setLoading(false);
        }
      }

      async function goToNextPage() {
        if (!state.nextCursor || state.loading) return;

        const previousCursor = state.currentCursor;
        state.previousCursors.push(previousCursor);
        state.currentCursor = state.nextCursor;
        syncPaginationControls();

        const ok = await loadContacts({ silent: true });
        if (!ok) {
          state.currentCursor = previousCursor;
          state.previousCursors.pop();
          syncPaginationControls();
        }
      }

      async function goToPreviousPage() {
        if (state.previousCursors.length === 0 || state.loading) return;

        const previousCursors = state.previousCursors.slice();
        const previousCursor = state.currentCursor;
        state.currentCursor = state.previousCursors.pop() || "";
        syncPaginationControls();

        const ok = await loadContacts({ silent: true });
        if (!ok) {
          state.previousCursors = previousCursors;
          state.currentCursor = previousCursor;
          syncPaginationControls();
        }
      }

      function toggleCurrentPageSelection() {
        const shouldSelect = !areAllCurrentPageContactsSelected();

        state.currentPageContacts.forEach(function (contact) {
          if (shouldSelect) {
            state.selectedContacts.set(contact.id, {
              id: contact.id,
              email: contact.email || null,
              name: contact.name || null,
            });
          } else {
            state.selectedContacts.delete(contact.id);
          }
        });

        renderContacts(state.currentPageContacts);
      }

      async function exportContacts(format) {
        clearMessage();
        saveTokenToSession();
        setLoading(true);

        try {
          const token = readToken();
          if (!token) {
            throw new Error("Enter the admin token first.");
          }

          const filters = readFilters();
          const query = buildQueryString(Object.assign({ format: format }, filters));
          const response = await fetch("/waitlist/export?" + query, {
            headers: {
              Authorization: "Bearer " + token,
            },
            cache: "no-store",
          });

          if (!response.ok) {
            const payload = await response.json().catch(function () {
              return null;
            });
            throw new Error((payload && payload.error) || "Export failed.");
          }

          const blob = await response.blob();
          const disposition = response.headers.get("Content-Disposition") || "";
          const match = disposition.match(/filename="([^"]+)"/);
          const filename = match ? match[1] : "snapmath-waitlist." + (format === "csv" ? "csv" : "json");
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          URL.revokeObjectURL(url);
          setMessage("success", "Downloaded " + filename + ".");
        } catch (error) {
          setMessage("error", error.message || "Could not export waitlist contacts.");
        } finally {
          setLoading(false);
        }
      }

      async function handleBulkAction(action) {
        const selectedContacts = Array.from(state.selectedContacts.values());
        if (selectedContacts.length === 0) return;

        let payload = {
          action: action,
          contactIds: selectedContacts.map(function (contact) {
            return contact.id;
          }),
        };

        if (action === "archive") {
          const reasonResult = readArchiveReasonFromSelect(
            elements.bulkArchiveReasonSelect,
            "Bulk archive reason"
          );
          if (reasonResult.cancelled) return;
          payload.reason = reasonResult.reason;
        }

        if (action === "restore") {
          const confirmed = window.confirm(
            "Restore " + formatNumber(selectedContacts.length) + " selected contacts back to the active waitlist?"
          );
          if (!confirmed) return;
        }

        if (action === "delete") {
          const confirmed = window.confirm(
            "Delete " +
              formatNumber(selectedContacts.length) +
              " selected contacts and their waitlist event history?"
          );
          if (!confirmed) return;
          payload.confirm = "delete";
        }

        clearMessage();
        setLoading(true);

        try {
          const data = await apiFetchJson("/waitlist/admin/bulk", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          (data.results || []).forEach(function (result) {
            if (result && result.ok && result.contactId) {
              state.selectedContacts.delete(result.contactId);
            }
          });

          const messageKind =
            data.failureCount > 0
              ? (Number(data.successCount || 0) > 0 ? "warning" : "error")
              : "success";

          let messageText = "";
          if (action === "archive") {
            messageText = "Archived " + formatNumber(data.successCount || 0) + " selected contacts.";
          } else if (action === "restore") {
            messageText = "Restored " + formatNumber(data.successCount || 0) + " selected contacts.";
          } else {
            messageText =
              "Deleted " +
              formatNumber(data.successCount || 0) +
              " selected contacts and removed " +
              formatNumber(data.deletedEventCount || 0) +
              " linked event records.";
          }

          if (data.failureCount > 0) {
            messageText += " " + formatNumber(data.failureCount) + " failed.";
          }

          await loadContacts({ silent: true });
          setMessage(messageKind, messageText);
        } catch (error) {
          setMessage("error", error.message || "Could not update the selected contacts.");
        } finally {
          setLoading(false);
        }
      }

      async function handleContactAction(button) {
        const action = button.getAttribute("data-contact-action");
        const contactId = button.getAttribute("data-contact-id");
        const email = button.getAttribute("data-contact-email") || "";
        const actionContainer = button.closest(".row-actions");

        if (!action || !contactId) return;

        let payload = {
          action: action,
          contactId: contactId,
          email: email,
        };

        if (action === "archive") {
          const reasonSelect = actionContainer ? actionContainer.querySelector("[data-archive-reason]") : null;
          const reasonResult = readArchiveReasonFromSelect(reasonSelect, "Archive reason");
          if (reasonResult.cancelled) return;
          payload.reason = reasonResult.reason;
        }

        if (action === "restore") {
          const confirmed = window.confirm(
            "Restore " + (email || "this contact") + " back to the active waitlist?"
          );
          if (!confirmed) return;
        }

        if (action === "delete") {
          const confirmed = window.confirm(
            "Delete " + (email || "this contact") + " and its waitlist event history?"
          );
          if (!confirmed) return;
          payload.confirm = "delete";
        }

        clearMessage();
        setLoading(true);

        try {
          const data = await apiFetchJson("/waitlist/admin/contact", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          state.selectedContacts.delete(contactId);

          let successMessage = "";
          if (action === "archive") {
            successMessage = "Archived " + (email || contactId) + ".";
          } else if (action === "restore") {
            successMessage = "Restored " + (email || contactId) + ".";
          } else {
            successMessage =
              "Deleted " +
              (email || contactId) +
              " and removed " +
              formatNumber(data.deletedEventCount || 0) +
              " linked event records.";
          }

          await loadContacts({ silent: true });
          setMessage("success", successMessage);
        } catch (error) {
          setMessage("error", error.message || "Could not update the contact.");
        } finally {
          setLoading(false);
        }
      }

      function initializeUi() {
        populateSelect(elements.roleFilter, ROLE_OPTIONS, ROLE_LABELS);
        populateSelect(elements.interestFilter, INTEREST_OPTIONS, INTEREST_LABELS);
        populateSelect(elements.statusFilter, STATUS_OPTIONS.filter(Boolean), {
          new: "New",
          archived: "Archived",
        });
        populateArchiveReasonSelect(elements.bulkArchiveReasonSelect);

        loadTokenFromSession();
        resetPaging();
        clearSelectedContacts();
        syncPaginationControls();
        syncBulkControls();

        elements.filtersForm.addEventListener("submit", function (event) {
          event.preventDefault();
          loadContacts({ resetPaging: true });
        });

        elements.loadButton.addEventListener("click", function () {
          loadContacts({ resetPaging: true });
        });

        elements.exportJsonButton.addEventListener("click", function () {
          exportContacts("json");
        });

        elements.exportCsvButton.addEventListener("click", function () {
          exportContacts("csv");
        });

        elements.forgetTokenButton.addEventListener("click", function () {
          clearTokenFromSession();
          resetPaging();
          clearSelectedContacts();
          state.currentPageContacts = [];
          elements.totalContacts.textContent = "-";
          elements.returnedContacts.textContent = "-";
          elements.emailReady.textContent = "-";
          elements.searchSummary.textContent = "All";
          elements.resultsMeta.textContent = "Token cleared. Paste it again to load contacts.";
          syncPaginationControls();
          syncBulkControls();
          elements.contactsBody.innerHTML =
            '<tr><td colspan="7" class="empty-state"><strong>Token removed.</strong>Paste it again to load contacts.</td></tr>';
          clearMessage();
        });

        elements.resetFiltersButton.addEventListener("click", function () {
          resetFilters();
          resetPaging();
          clearSelectedContacts();
          syncPaginationControls();
          syncBulkControls();
        });

        elements.tokenInput.addEventListener("change", saveTokenToSession);
        elements.previousPageButton.addEventListener("click", function () {
          goToPreviousPage();
        });
        elements.nextPageButton.addEventListener("click", function () {
          goToNextPage();
        });
        elements.selectPageButton.addEventListener("click", function () {
          toggleCurrentPageSelection();
        });
        elements.clearSelectionButton.addEventListener("click", function () {
          clearSelectedContacts();
          renderContacts(state.currentPageContacts);
        });
        elements.bulkArchiveButton.addEventListener("click", function () {
          handleBulkAction("archive");
        });
        elements.bulkRestoreButton.addEventListener("click", function () {
          handleBulkAction("restore");
        });
        elements.bulkDeleteButton.addEventListener("click", function () {
          handleBulkAction("delete");
        });

        if (readToken()) {
          loadContacts({ silent: true, resetPaging: true });
        }
      }

      initializeUi();
    </script>
  </body>
</html>`;
}

async function storeWaitlistLead(req, submission) {
  const db = admin.firestore();
  const submittedAt = admin.firestore.FieldValue.serverTimestamp();
  const emailLower = submission.email;
  const contactId = buildWaitlistDocumentId(emailLower);
  const userAgent = normalizeSingleLine(req.headers['user-agent'], 300) || null;
  const sourceOrigin = readString(req.headers.origin) || null;
  const contactsRef = db.collection('landing_waitlist_contacts').doc(contactId);
  const eventsRef = db.collection('landing_waitlist_events').doc();
  const existingContact = await contactsRef.get();
  const existingData = existingContact.exists ? existingContact.data() || {} : {};

  const contactPayload = {
    email: emailLower,
    emailLower,
    name: submission.name,
    phone: submission.phone || null,
    role: submission.role,
    interest: submission.interest,
    notes: submission.notes || '',
    locale: submission.locale,
    source: 'landing-page',
    sourceOrigin,
    lastIp: req.ip || null,
    lastUserAgent: userAgent,
    lastSubmittedAt: submittedAt,
    submissionCount: admin.firestore.FieldValue.increment(1),
    status: existingContact.exists ? readString(existingContact.get('status'), 'new') : 'new',
  };

  if (!existingContact.exists) {
    contactPayload.firstSubmittedAt = submittedAt;
  }

  const batch = db.batch();
  batch.set(contactsRef, contactPayload, { merge: true });
  batch.set(eventsRef, {
    contactId,
    email: emailLower,
    name: submission.name,
    phone: submission.phone || null,
    role: submission.role,
    interest: submission.interest,
    notes: submission.notes || '',
    locale: submission.locale,
    source: 'landing-page',
    sourceOrigin,
    ip: req.ip || null,
    userAgent,
    submittedAt,
  });
  await batch.commit();

  return {
    duplicate: existingContact.exists,
    contactId,
    existingData,
  };
}

async function authenticateRequest(req, res, next) {
  if (ALLOW_ANONYMOUS_AI) {
    req.aiUser = { uid: `anon:${req.ip || 'unknown'}` };
    return next();
  }

  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_auth_not_configured' });
  }

  const authHeader = readString(req.headers.authorization);
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_auth_token' });
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return res.status(401).json({ error: 'missing_auth_token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.aiUser = {
      uid: decoded.uid,
      email: decoded.email || null,
    };
    return next();
  } catch (error) {
    console.error('[ai-proxy] Firebase token verification failed:', error);
    return res.status(401).json({ error: 'invalid_auth_token' });
  }
}

function applyRateLimit(req, res, next) {
  const bucketKey = `${req.path}:${getRequesterId(req)}`;
  const now = Date.now();
  const recentRequests = (rateLimitBuckets.get(bucketKey) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      retryAfterMs: RATE_LIMIT_WINDOW_MS,
    });
  }

  recentRequests.push(now);
  rateLimitBuckets.set(bucketKey, recentRequests);
  return next();
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const role = readString(item.role).toLowerCase();
      return {
        role:
          role === 'assistant' || role === 'system' || role === 'user'
            ? role
            : 'user',
        content: readString(item.content).slice(0, 4000),
      };
    })
    .filter((item) => item.content.length > 0)
    .slice(-MAX_MESSAGES);
}

function buildChatMessages(body) {
  const systemPrompt = readString(body?.systemPrompt).slice(0, 6000);
  const contextPrompt = readString(body?.contextPrompt).slice(0, 2000);
  const messages = sanitizeMessages(body?.messages);
  const finalMessages = [];

  if (systemPrompt) {
    finalMessages.push({ role: 'system', content: systemPrompt });
  }
  if (contextPrompt) {
    finalMessages.push({ role: 'system', content: contextPrompt });
  }

  finalMessages.push(...messages);
  return finalMessages;
}

function normalizeVisionSteps(rawSteps, locale) {
  if (!Array.isArray(rawSteps)) return [];

  return rawSteps
    .map((item, index) => {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (!trimmed) return null;

        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0 && colonIdx < 60) {
          return {
            label: trimmed.slice(0, colonIdx).trim(),
            body: trimmed.slice(colonIdx + 1).trim().slice(0, 3000),
          };
        }

        return {
          label: locale === 'ar' ? `الخطوة ${index + 1}` : `Step ${index + 1}`,
          body: trimmed.slice(0, 3000),
        };
      }

      if (!item || typeof item !== 'object') return null;

      return {
        label:
          readString(item.label) ||
          (locale === 'ar' ? `الخطوة ${index + 1}` : `Step ${index + 1}`),
        body: readString(item.body).slice(0, 3000),
      };
    })
    .filter(Boolean)
    .filter((item) => item.label.length > 0 || item.body.length > 0);
}

function parseVisionResponse(data) {
  const rawContent = readString(data?.choices?.[0]?.message?.content);
  if (!rawContent) return null;

  try {
    const parsed = JSON.parse(rawContent);
    const steps = normalizeVisionSteps(parsed.steps, 'en');
    const stepsAr = normalizeVisionSteps(parsed.stepsAr, 'ar');

    if (!steps.length && !stepsAr.length) {
      return null;
    }

    const question = readString(parsed.question, readString(parsed.questionAr, 'Scanned Problem'));
    const questionAr = readString(parsed.questionAr, question || 'المسألة الممسوحة');

    return {
      question: question || 'Scanned Problem',
      questionAr: questionAr || 'المسألة الممسوحة',
      steps: steps.length > 0 ? steps : stepsAr,
      stepsAr: stepsAr.length > 0 ? stepsAr : steps,
    };
  } catch (error) {
    console.error('[ai-proxy] Could not parse vision JSON:', error);
    return null;
  }
}

async function callOpenAI(payload) {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      status: 500,
      body: { error: 'openai_not_configured' },
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data = null;

    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (!response.ok) {
      console.error('[ai-proxy] OpenAI error:', response.status, rawText.slice(0, 400));
      return {
        ok: false,
        status: 502,
        body: { error: 'openai_error' },
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    console.error('[ai-proxy] OpenAI request failed:', error);
    return {
      ok: false,
      status: 502,
      body: { error: 'openai_request_failed' },
    };
  }
}

app.get('/health', (_req, res) => {
  const firebaseReady = ensureFirebaseApp();

  res.json({
    ok: true,
    service: 'snapmath-ai-proxy',
    hasOpenAiKey: !!OPENAI_API_KEY,
    allowAnonymousAi: ALLOW_ANONYMOUS_AI,
    firebaseAuthReady: ALLOW_ANONYMOUS_AI || firebaseReady,
    waitlistReady: firebaseReady,
    waitlistAdminReady: !!WAITLIST_ADMIN_TOKEN,
    waitlistEmailReady: isWaitlistEmailReady(),
    waitlistEmailProvider: isWaitlistEmailReady() ? WAITLIST_EMAIL_PROVIDER : null,
    chatModel: OPENAI_CHAT_MODEL,
    visionModel: OPENAI_VISION_MODEL,
  });
});

app.options('/waitlist', (req, res) => {
  const { origin, allowedOrigin } = setWaitlistCorsHeaders(req, res);

  if (origin && !allowedOrigin) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  return res.status(204).end();
});

app.post('/waitlist', applyRateLimit, async (req, res) => {
  const { origin, allowedOrigin } = setWaitlistCorsHeaders(req, res);
  res.set('Cache-Control', 'no-store');

  if (origin && !allowedOrigin) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  const parsed = parseWaitlistSubmission(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error });
  }

  if (parsed.honeypot) {
    return res.json({ ok: true, duplicate: false, confirmationEmail: 'skipped' });
  }

  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  try {
    const result = await storeWaitlistLead(req, parsed.data);
    const priorEmailStatus = readString(result.existingData?.confirmationEmailStatus);
    let confirmationEmail = priorEmailStatus === 'sent' ? 'already-sent' : 'skipped';

    if (confirmationEmail !== 'already-sent' && isWaitlistEmailReady()) {
      try {
        const emailResult = await sendWaitlistConfirmationEmail(parsed.data);
        confirmationEmail = emailResult.status;
        if (emailResult.status !== 'skipped') {
          await recordWaitlistConfirmationResult(result.contactId, emailResult);
        }
      } catch (error) {
        confirmationEmail = 'failed';
        await recordWaitlistConfirmationResult(result.contactId, {
          status: 'failed',
          provider: WAITLIST_EMAIL_PROVIDER || null,
          error: error instanceof Error ? error.message : 'email_send_failed',
        });
        console.error('[ai-proxy] Waitlist confirmation email failed:', error);
      }
    }

    console.info(`[ai-proxy] waitlist stored for ${parsed.data.email}`);
    return res.json({ ok: true, duplicate: result.duplicate, confirmationEmail });
  } catch (error) {
    console.error('[ai-proxy] Waitlist submit failed:', error);
    return res.status(500).json({ error: 'waitlist_store_failed' });
  }
});

app.get('/waitlist/admin/ui', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; connect-src 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  );

  if (!WAITLIST_ADMIN_TOKEN) {
    return res.status(503).type('html').send('<h1>Waitlist admin is not configured.</h1>');
  }

  return res.type('html').send(buildWaitlistAdminUiHtml());
});

app.get('/waitlist/admin', authenticateWaitlistAdmin, async (req, res) => {
  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  try {
    const [{ contacts, filters, limit, cursor, nextCursor, hasNextPage }, totalContacts] = await Promise.all([
      loadWaitlistContactsForAdmin(req),
      readWaitlistTotalCount(),
    ]);
    const counts = {
      roles: {},
      interests: {},
      statuses: {},
    };

    for (const contact of contacts) {
      const roleKey = contact.role || 'unknown';
      const interestKey = contact.interest || 'unknown';
      const statusKey = contact.status || 'unknown';
      counts.roles[roleKey] = (counts.roles[roleKey] || 0) + 1;
      counts.interests[interestKey] = (counts.interests[interestKey] || 0) + 1;
      counts.statuses[statusKey] = (counts.statuses[statusKey] || 0) + 1;
    }

    return res.json({
      ok: true,
      totalContacts,
      returnedContacts: contacts.length,
      limit,
      filters,
      waitlistEmailReady: isWaitlistEmailReady(),
      contacts,
      counts,
      archiveReasonPresets: WAITLIST_ADMIN_ARCHIVE_REASON_PRESETS,
      pagination: {
        cursor,
        nextCursor,
        hasNextPage,
      },
      exportFormats: ['json', 'csv'],
      contactActions: ['archive', 'restore', 'delete'],
      bulkContactActions: ['archive', 'restore', 'delete'],
    });
  } catch (error) {
    if (error?.code === 'invalid_waitlist_admin_cursor') {
      return res.status(400).json({ error: error.code });
    }

    console.error('[ai-proxy] Waitlist admin read failed:', error);
    return res.status(500).json({ error: 'waitlist_admin_read_failed' });
  }
});

app.post('/waitlist/admin/contact', authenticateWaitlistAdmin, async (req, res) => {
  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  const parsed = parseWaitlistAdminContactAction(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error });
  }

  try {
    const result = await runWaitlistAdminAction(parsed.data);

    if (result.action === 'archive' || result.action === 'restore') {
      return res.json({
        ok: true,
        action: result.action,
        contactId: result.contactId,
        previousContact: result.previousContact,
        contact: result.contact,
      });
    }

    return res.json({
      ok: true,
      action: 'delete',
      contactId: result.contactId,
      previousContact: result.previousContact,
      deletedEventCount: result.deletedEventCount,
    });
  } catch (error) {
    if (error?.code === 'waitlist_contact_not_found') {
      return res.status(404).json({ error: error.code });
    }

    console.error('[ai-proxy] Waitlist admin mutation failed:', error);
    return res.status(500).json({ error: 'waitlist_admin_mutation_failed' });
  }
});

app.post('/waitlist/admin/bulk', authenticateWaitlistAdmin, async (req, res) => {
  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  const parsed = parseWaitlistAdminBulkAction(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error });
  }

  try {
    const result = await runWaitlistAdminBulkAction(parsed.data);
    return res.json({
      ok: true,
      action: result.action,
      requestedCount: result.requestedCount,
      successCount: result.successCount,
      failureCount: result.failureCount,
      deletedEventCount: result.deletedEventCount,
      results: result.results,
    });
  } catch (error) {
    console.error('[ai-proxy] Waitlist admin bulk mutation failed:', error);
    return res.status(500).json({ error: 'waitlist_admin_bulk_mutation_failed' });
  }
});

app.get('/waitlist/export', authenticateWaitlistAdmin, async (req, res) => {
  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  try {
    const format = readQueryString(req.query.format, 'json').toLowerCase();
    const { contacts, filters, limit } = await loadWaitlistContactsForAdmin(req);

    if (format === 'csv') {
      const stamp = new Date().toISOString().slice(0, 10);
      res.set('Content-Type', 'text/csv; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="snapmath-waitlist-${stamp}.csv"`);
      return res.send(buildWaitlistCsv(contacts));
    }

    return res.json({
      ok: true,
      format: 'json',
      returnedContacts: contacts.length,
      limit,
      filters,
      contacts,
    });
  } catch (error) {
    console.error('[ai-proxy] Waitlist export failed:', error);
    return res.status(500).json({ error: 'waitlist_export_failed' });
  }
});

app.post('/ai/chat', authenticateRequest, applyRateLimit, async (req, res) => {
  const messages = buildChatMessages(req.body);
  if (!messages.some((message) => message.role === 'user')) {
    return res.status(400).json({ error: 'missing_user_message' });
  }

  const result = await callOpenAI({
    model: OPENAI_CHAT_MODEL,
    messages,
    max_tokens: CHAT_MAX_TOKENS,
    temperature: 0.4,
  });

  if (!result.ok) {
    return res.status(result.status).json(result.body);
  }

  const reply = readString(result.data?.choices?.[0]?.message?.content);
  if (!reply) {
    return res.status(502).json({ error: 'empty_ai_reply' });
  }

  console.info(`[ai-proxy] chat served for ${getRequesterId(req)}`);
  return res.json({ reply });
});

app.post('/ai/vision', authenticateRequest, applyRateLimit, async (req, res) => {
  const imageBase64 = readString(req.body?.imageBase64).replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    '',
  );
  const locale = readString(req.body?.locale).toLowerCase() === 'ar' ? 'ar' : 'en';
  const systemPrompt = readString(req.body?.systemPrompt, DEFAULT_VISION_SYSTEM_PROMPT).slice(
    0,
    6000,
  );

  if (!imageBase64) {
    return res.status(400).json({ error: 'missing_image_base64' });
  }

  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    return res.status(413).json({ error: 'image_too_large' });
  }

  const result = await callOpenAI({
    model: OPENAI_VISION_MODEL,
    max_tokens: VISION_MAX_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text:
              locale === 'ar'
                ? 'استخرج السؤال ثم أعد JSON فقط. اكتب خطوات عربية واضحة بصيغة الكتاب الأردني، مع جواب نهائي واضح.'
                : 'Extract the question and return JSON only. Use clear Jordan-style textbook steps and a final answer.',
          },
        ],
      },
    ],
  });

  if (!result.ok) {
    return res.status(result.status).json(result.body);
  }

  const parsed = parseVisionResponse(result.data);
  if (!parsed) {
    return res.status(502).json({ error: 'invalid_vision_response' });
  }

  console.info(`[ai-proxy] vision served for ${getRequesterId(req)}`);
  return res.json(parsed);
});

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'request_too_large' });
  }

  console.error('[ai-proxy] Unhandled error:', error);
  return res.status(500).json({ error: 'internal_server_error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ai-proxy] Listening on 0.0.0.0:${PORT}`);
});

module.exports = app;
