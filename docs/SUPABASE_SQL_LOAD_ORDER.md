# PDF Phase 4.4 — Supabase SQL load order

Run these in the **Frankfurt** Supabase SQL editor (`qmydrszroizkxliwrxtq`) in order:

1. **Core schema** — users/profile extensions, chapters, lessons, curriculum tables
2. **Questions** — the 81-question bank + indexes
3. **Subscriptions & study** — entitlements, daily_question_usage, progress tables
4. **Seed data** — curriculum rows, lesson metadata, Cloudflare Stream IDs

After each step, verify in Table Editor:

- `chapters` and `lessons` are populated
- `questions` count ≈ 81
- `daily_question_usage` exists (for free-tier daily limits)

App reads curriculum locally today via `src/data/grade12.ts`; Supabase tables unlock server-side progress, waitlist CRM sync, and daily limits once `.env` keys are set.

Required env for the app (copy `.env.example` → `.env`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://qmydrszroizkxliwrxtq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=<from RevenueCat>
```

Optional for Cloudflare lesson playback:

```bash
EXPO_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE=<customer subdomain hash>
```
