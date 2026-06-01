# Build 33 Post-Release Backlog

This file tracks the backend-grade follow-up work that should happen after build 33 is in TestFlight.

## 1. Referral Backend

- Replace local referral counters in `app/referral.tsx` with server-tracked invites.
- Generate a unique invite code per user and attach it to shared links.
- Attribute new sign-ups to invite codes during account creation.
- Store referral counts and reward unlocks in the backend so they sync across devices.
- Add abuse protection: duplicate-device checks, self-referral blocking, and reward idempotency.

## 2. Support Pipeline

- Replace draft-only support storage in `app/support.tsx` with a real support inbox flow.
- Choose one source of truth: support email handoff, helpdesk API, or a small ticket service.
- Persist submitted messages remotely with timestamps, language, and user ID when available.
- Add a lightweight admin review path so support requests are actually visible outside the device.
- Update user-facing copy after the backend is live so "send" means "sent."

## 3. Managed AI

- Move `app/mathscan.tsx` and `app/(tabs)/ai-chat.tsx` off per-device API keys.
- Add a backend endpoint that owns the model key and applies request limits.
- Store prompt templates for Jordan curriculum style and bilingual output centrally.
- Log failures and latency so AI quality can be monitored after release.
- Decide on tiering rules before public launch: free usage limits, premium access, or both.

## Suggested Order

1. Support pipeline, so users can reach the team reliably.
2. Managed AI, so core AI features become public-ready.
3. Referral backend, once account and attribution flows are stable.
