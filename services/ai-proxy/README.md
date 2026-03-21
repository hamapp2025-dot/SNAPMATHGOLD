# SnapMath AI Proxy

Small Express service that turns `AI Chat` and `MathScan` into managed backend features for `SnapMath Academy`.

## What it does

- Exposes `POST /ai/chat`
- Exposes `POST /ai/vision`
- Verifies Firebase ID tokens by default
- Applies a simple in-memory rate limit
- Keeps the OpenAI API key on the server instead of on student devices

## Required environment variables

- `OPENAI_API_KEY`

Use one Firebase auth option:

- `FIREBASE_SERVICE_ACCOUNT_JSON`

or all three:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Optional environment variables

- `PORT=3001`
- `OPENAI_CHAT_MODEL=gpt-4o-mini`
- `OPENAI_VISION_MODEL=gpt-4o-mini`
- `AI_CHAT_MAX_TOKENS=500`
- `AI_VISION_MAX_TOKENS=800`
- `AI_RATE_LIMIT_WINDOW_MS=60000`
- `AI_RATE_LIMIT_MAX_REQUESTS=12`
- `AI_MAX_MESSAGES=20`
- `AI_MAX_IMAGE_BASE64_LENGTH=6000000`
- `ALLOW_ANONYMOUS_AI=false`

`ALLOW_ANONYMOUS_AI=true` is only for temporary testing. Keep it `false` in production.

## Local run

```bash
cd services/ai-proxy
npm install
OPENAI_API_KEY=your_key_here \
FIREBASE_PROJECT_ID=your_project_id \
FIREBASE_CLIENT_EMAIL=your_client_email \
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
npm start
```

The health endpoint is:

```bash
curl http://localhost:3001/health
```

## Render deployment

This repo now includes a root `render.yaml` Blueprint that deploys this service from:

- `services/ai-proxy`

Before deploying, fill the secret env vars in Render:

- `OPENAI_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

or:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Connect the mobile app

In the Expo app config, set:

- `managedAiBaseUrl`
- `managedAiChatPath`
- `managedAiVisionPath`

Example:

```json
{
  "managedAiBaseUrl": "https://your-service.example.com",
  "managedAiChatPath": "/ai/chat",
  "managedAiVisionPath": "/ai/vision"
}
```

Once `managedAiBaseUrl` is set, the app will try the managed backend first for:

- `app/(tabs)/ai-chat.tsx`
- `app/mathscan.tsx`

If the backend is unavailable, the app still falls back to the current local logic.
