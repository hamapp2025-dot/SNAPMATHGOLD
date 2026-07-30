# SnapMath Gold — Full Handoff Document

**Last updated:** July 26, 2026  
**Purpose:** Single shareable file for dev, marketing, and curriculum teams.  
**Product:** SnapMath Academy — premium Grade 12 Tawjihi math app for Jordan.

---

## 1. Executive summary

SnapMath Academy is a mobile learning app for **Jordan Grade 12 Tawjihi mathematics**. It combines:

- **Short coached sessions** (BoldVoice-style pacing: hook → visual → example → practice → recap)
- **3Blue1Brown-style Manim animations** with Arabic voiceover and subtitles
- **Exam-focused MCQ practice** aligned to the official Tawjihi book
- **Premium subscription tiers** (Bronze / Silver / Gold)

**Current launch status:**

| Area | Status |
|------|--------|
| iOS app (EAS build 60) | **Built successfully** — IPA ready |
| TestFlight | **Blocked** — Apple Developer agreement must be signed in App Store Connect |
| Landing website | **Live** on Render (cosmic blue theme) |
| Custom domain | **Not live** — DNS not pointed yet |
| RevenueCat billing | **Not wired** — app runs in preview Gold mode |
| Curriculum | **24 lessons shipped**, ~29 MCQs — needs expansion to 300+ |

**Website (live):** https://snapmath-academy-landing.onrender.com  
**App Store Connect:** https://appstoreconnect.apple.com/apps/6760658506  
**TestFlight:** https://appstoreconnect.apple.com/apps/6760658506/testflight/ios

---

## 2. Product vision

**North star:** BoldVoice for Tawjihi math — short, high-quality sessions that feel like a personal coach, not a lecture.

**Target user:** Grade 12 students in Jordan preparing for Tawjihi math exams.

**Session design (8–12 minutes total):**

| Segment | Duration | Purpose |
|---------|----------|---------|
| A. Coach hook | 8–18s | State goal + why it matters for Tawjihi |
| B. Manim core | 35–70s | One key idea, visual, no lecture drift |
| C. Worked example | 25–45s | Jordan book notation, step-by-step |
| D. Practice push | 10–20s | “Try 3 questions now” |
| E. Recap | 8–15s | Exam tip + what to review tomorrow |

**Quality reference lesson:** `u1-l1` (Remainder & Factor Theorems)

---

## 3. App features (shipped)

### Core learning
- **Curriculum tab** — 7 units, 24 lessons with hero videos
- **Lesson player** — video + key formulas + worked examples
- **Practice sessions** — MCQs per lesson
- **Exam simulator** — timed exam-style practice
- **Progress tracking** — XP, streaks, lesson completion
- **Bookmarks & review** — save and revisit questions

### Engagement
- **Leaderboard** — Firebase-backed rankings
- **Daily practice reminders** — push notifications
- **Referral flow** — invite friends
- **Parent tab** — progress visibility for parents

### Premium / AI
- **Subscription tiers** — Bronze / Silver / Gold (RevenueCat-ready)
- **AI chat** — managed proxy at `https://snapmath-ai-proxy.onrender.com`
- **Math scan** — camera-based problem scanning
- **Textbook viewer** — PDF support

### Auth & profile
- Firebase Auth (email, Google; Apple Sign-In temporarily disabled for build 60)
- Bilingual UI (Arabic / English)
- Profile, settings, support screens

---

## 4. Curriculum map (Grade 12)

**Source file:** `src/data/grade12.ts`  
**Video assets:** `assets/media/lessons/{lesson-id}-hero-subtitled-voiced.mp4`

| Unit | Title | Lessons |
|------|-------|---------|
| u1 | Functions & Algebraic Expressions | u1-l1, u1-l2 |
| u2 | Trig Identities & Equations | u2-l1, u2-l2, u2-l3 |
| u3 | Differentiation & Applications | u3-l1 … u3-l5 |
| u4 | Complex Numbers | u4-l1, u4-l2, u4-l3 |
| u5 | Integration | u5-l1 … u5-l6 |
| u6 | Vectors | u6-l1, u6-l2, u6-l3 |
| u7 | Statistics & Probability | u7-l1, u7-l2 |

**Total:** 7 units · 24 lessons · ~29 MCQs (needs 300+)

**Flagship units for premium video upgrades:** Functions (u1), Trig (u2), Differentiation (u3), Integration (u5)

---

## 5. Tech stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo 54, React Native 0.81, Expo Router |
| iOS | Xcode 26, bundle `com.hamzaacademy.app` |
| Auth | Firebase (`hamza-academy-9d832`) |
| Database | Supabase (optional; daily limits, content metadata) |
| Billing | RevenueCat (not yet wired to EAS) |
| AI proxy | Node.js on Render |
| Landing | Next.js static export on Render |
| Media pipeline | Python (Manim), FFmpeg, voiceover scripts |
| Build / release | EAS (`@zamza/hamza-academy`) |

**Key config files:**
- `app.json` / `app.config.js` — Expo config, RevenueCat, Supabase, AI URL
- `eas.json` — build profiles, ASC app ID `6760658506`
- `firebaseConfig.ts` — Firebase client
- `src/data/grade12.ts` — all lesson content

---

## 6. Infrastructure

### Render services

| Service | URL / ID | Purpose |
|---------|----------|---------|
| Landing page | https://snapmath-academy-landing.onrender.com | Marketing site, waitlist, legal |
| AI proxy | https://snapmath-ai-proxy.onrender.com | Managed AI chat backend |
| Landing service ID | `srv-d72jb96uk2gs73fvdueg` | Render dashboard reference |

**Landing deploy branch:** `backup-before-327-rollback-20260519-205118`  
**Landing root dir:** `landing-page`  
**Build command:** static export + `serve out`

### Firebase
- **Project:** `hamza-academy-9d832`
- **Auth domain:** `hamza-academy-9d832.firebaseapp.com`
- Used for: auth, leaderboard (Firestore)

### Custom domain (pending)

Point DNS for `snapmathacademy.com`:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `216.24.57.1` |
| CNAME | `www` | `snapmath-academy-landing.onrender.com` |

Domains are verified on Render but not resolving until DNS is updated.

---

## 7. iOS release status

### Latest build: **60 — SUCCESS**

| Field | Value |
|-------|-------|
| Build ID | `1a49f2db-d1b9-4629-9389-b8a4bf323036` |
| Version | 1.0.0 (60) |
| Status | FINISHED |
| Message | Build 60: TestFlight without Apple Sign-In entitlement |
| Expo build page | https://expo.dev/accounts/zamza/projects/hamza-academy/builds/1a49f2db-d1b9-4629-9389-b8a4bf323036 |

### TestFlight blocker

Latest submission failed with:

```
SUBMISSION_SERVICE_IOS_MISSING_REQUIRED_AGREEMENT
```

**Action required (account owner):**
1. Log into https://appstoreconnect.apple.com
2. Accept any pending **Paid Applications Agreement** or updated terms
3. Re-submit build 60:

```bash
npx eas submit --platform ios --id 1a49f2db-d1b9-4629-9389-b8a4bf323036 --profile production --non-interactive --wait
```

### Apple Sign-In (temporary)

Build 59 failed because the provisioning profile did not support Sign in with Apple. Build 60 removed the entitlement from `ios/SnapMathAcademy/SnapMathAcademy.entitlements` to unblock TestFlight.

**To restore Apple Sign-In:**
1. Enable “Sign in with Apple” capability for `com.hamzaacademy.app` in Apple Developer
2. Regenerate provisioning profile
3. Restore entitlement in `ios/SnapMathAcademy/SnapMathAcademy.entitlements`
4. Cut build 61

---

## 8. Billing (RevenueCat)

**Status:** Preview Gold mode — all premium features unlocked without purchase until RevenueCat key is set.

### Product IDs (App Store Connect)

| Tier | Product ID |
|------|------------|
| Bronze | `snapmath_bronze_monthly` |
| Silver | `snapmath_silver_monthly` |
| Gold | `snapmath_gold_monthly` |

### Setup steps

1. Create three auto-renewable subscriptions in App Store Connect (IDs above)
2. Connect iOS app in RevenueCat dashboard
3. Create entitlement `premium`, offering `default`
4. Wire EAS secret:

```bash
npm run billing:setup -- appl_your_key_here
```

5. Rebuild:

```bash
npm run release:ios -- --no-wait --message "Build 61: RevenueCat wired"
```

Full details: `REVENUECAT_SETUP.md`

---

## 9. Release commands

```bash
# Pre-release checks
npm run release:preflight

# Full iOS release (preflight → workdir → EAS build → auto-submit)
npm run release:ios -- --no-wait --message "Your release note"

# Check latest build / TestFlight status
npm run release:status

# Landing page lint + build
npm run check:landing

# Deploy landing (via Render git push on landing branch)
npm run deploy:landing
```

Full automation docs: `RELEASE_AUTOMATION.md`

---

## 10. Content production pipeline

### Lesson template
Use `docs/CURRICULUM_LESSON_TEMPLATE.md` for every new lesson.

### Where content goes

| Asset | Location |
|-------|----------|
| Lesson metadata, MCQs, formulas | `src/data/grade12.ts` |
| Hero video | `assets/media/lessons/{id}-hero-subtitled-voiced.mp4` |
| Manim source | `manim/` |
| Voiceover pipeline | `scripts/voiceover-pipeline.js` |
| Full media pipeline | `npm run lessons:pipeline` |

### Content team deliverables (first 90 days)

1. Full audit: unit-by-unit gaps vs official Jordan book
2. Expand MCQ bank from ~29 to **300+**
3. Upgrade **5 gold-standard lessons** to `u1-l1` quality bar
4. Review exam simulator timing, difficulty, wording
5. Weekly sign-off on new lessons before in-app ship

### Hiring
Job post (EN + AR): `docs/JOB_POST_HEAD_OF_CURRICULUM.md`  
Apply: **hello@snapmathacademy.com** — subject `Curriculum Lead — [Name]`

---

## 11. Marketing handoff

### Brand
- **Name:** SnapMath Academy
- **Theme:** Cosmic blue (`#070b14` background, `#5b8cff` accent) — updated from gold/brown
- **Tone:** Premium, exam-focused, coach-like (not lecture)

### Live assets
- Landing page: https://snapmath-academy-landing.onrender.com
- Privacy: `/privacy/`
- Terms: `/terms/`
- Waitlist form on homepage

### Messaging pillars
1. **Tawjihi-first** — built for Jordan Grade 12, official book alignment
2. **Short sessions** — 8–12 min, fits after school
3. **Visual math** — Manim animations, not static slides
4. **Exam practice** — MCQs with Jordan-style distractors
5. **Arabic-native** — MSA + student-friendly tone

### Pre-launch checklist (marketing)
- [ ] Point DNS for snapmathacademy.com
- [ ] TestFlight public link (after Apple agreement signed)
- [ ] App Store listing copy (AR + EN)
- [ ] Screenshots (6.7" iPhone)
- [ ] Social proof / founder story video
- [ ] Waitlist → launch email sequence

---

## 12. Dev handoff — repo structure

```
SNAPMATHGOLD/
├── app/                    # Expo Router screens
├── src/
│   ├── data/grade12.ts     # Curriculum (lessons, MCQs)
│   ├── subscriptions/      # RevenueCat context
│   ├── theme/              # App theming
│   └── config/             # Firebase, Supabase, language
├── assets/media/lessons/   # Hero videos (24 files)
├── landing-page/           # Next.js marketing site
├── services/ai-proxy/      # Render AI backend
├── manim/                  # Animation source
├── scripts/                # Release, billing, media pipelines
├── docs/                   # Handoff docs (this file + templates)
├── ios/                    # Native iOS project
├── app.json                # Expo config
├── eas.json                # EAS build config
└── RELEASE_AUTOMATION.md   # Release runbook
```

### Git
- **Branch:** `backup-push-clean` (tracks `origin/backup-before-327-rollback-20260519-205118`)
- **Recent commits:**
  - `ac88bea` — Build 60: remove Apple Sign-In entitlement
  - `751c0bb` — Curriculum handoff docs + build 59
  - `91db2ff` — Fix EAS upload gaps + build 58
  - `717c4ed` — Landing cosmic blue theme

---

## 13. Launch blockers (priority order)

| # | Blocker | Owner | Action |
|---|---------|-------|--------|
| 1 | Apple agreement unsigned | Account owner | Accept in App Store Connect, re-submit build 60 |
| 2 | DNS not pointed | Domain admin | A + CNAME records (see §6) |
| 3 | RevenueCat not wired | Dev | `npm run billing:setup`, rebuild |
| 4 | MCQ bank too small (~29) | Curriculum lead | Expand to 300+ using template |
| 5 | Apple Sign-In disabled | Dev | Re-enable capability + entitlement in build 61+ |

---

## 14. Contacts & accounts

| System | Account / ID |
|--------|--------------|
| Expo / EAS | `@zamza` / project `hamza-academy` |
| App Store Connect | App ID `6760658506` |
| Firebase | `hamza-academy-9d832` |
| Render | Landing + AI proxy services |
| Email | hello@snapmathacademy.com |

---

## 15. Related documents

| File | Purpose |
|------|---------|
| `docs/CURRICULUM_LESSON_TEMPLATE.md` | BoldVoice-style lesson authoring template |
| `docs/JOB_POST_HEAD_OF_CURRICULUM.md` | Bilingual job post for Jordan curriculum lead |
| `docs/SUPABASE_SQL_LOAD_ORDER.md` | Supabase schema load order |
| `REVENUECAT_SETUP.md` | Billing setup runbook |
| `RELEASE_AUTOMATION.md` | iOS release automation |
| `landing-page/README.md` | Landing page dev notes |

---

## 16. Quick start for new team members

### Developer
```bash
git clone <repo>
npm install
cp .env.example .env   # fill Firebase, Supabase, RevenueCat as needed
npm start              # Expo dev server
npm run release:status # check latest iOS build
```

### Curriculum lead
1. Read `docs/CURRICULUM_LESSON_TEMPLATE.md`
2. Review `u1-l1` in app as quality bar
3. Audit `src/data/grade12.ts` against official Jordan book
4. Submit sample MCQ set to hello@snapmathacademy.com

### Marketing
1. Review live site: https://snapmath-academy-landing.onrender.com
2. Use messaging pillars in §11
3. Wait for TestFlight link after Apple agreement is signed

---

*End of handoff document. Share this file as-is with dev, marketing, and curriculum teams.*
