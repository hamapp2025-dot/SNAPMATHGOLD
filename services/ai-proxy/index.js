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
const WAITLIST_ALLOWED_ORIGINS = new Set([
  'https://snapmathacademy.com',
  'https://www.snapmathacademy.com',
  'https://snapmath-academy-landing.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildWaitlistDocumentId(email) {
  return Buffer.from(email, 'utf8').toString('base64url');
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

  return { duplicate: existingContact.exists };
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
    return res.json({ ok: true, duplicate: false });
  }

  if (!ensureFirebaseApp()) {
    return res.status(500).json({ error: 'firebase_waitlist_not_configured' });
  }

  try {
    const result = await storeWaitlistLead(req, parsed.data);
    console.info(`[ai-proxy] waitlist stored for ${parsed.data.email}`);
    return res.json({ ok: true, duplicate: result.duplicate });
  } catch (error) {
    console.error('[ai-proxy] Waitlist submit failed:', error);
    return res.status(500).json({ error: 'waitlist_store_failed' });
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
