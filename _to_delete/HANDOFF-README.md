# SnapMath Academy — Source Handoff

Packaged 26 July 2026 from `SNAPMATHGOLD`, branch `backup-push-clean`, iOS build number 60.

## What this is
The complete tracked source tree of the SnapMath Academy app (Expo / React Native,
TypeScript), plus the Next.js landing page, the AI proxy service, the Manim animation
pipeline, and project docs.

## What was deliberately left out
| Excluded | Why |
|---|---|
| `node_modules/`, `landing-page/node_modules/` | Reinstall with `npm install` |
| `.expo/`, `.expo-go-sdk52/`, `dist/`, `landing-page/.next/`, `landing-page/out/` | Build output |
| `*.ipa` (TestFlight builds 22–43) | ~1.2 GB of compiled binaries, not source |
| `.git/` | History not included — see "Better than a zip" below |
| All video and audio (`.mp4`, `.mov`, `.m4a`, `.wav`, `.mp3`) | 580 MB of lesson and founder footage. Ask Hamzeh for these separately; the code references them by path under `assets/media/` and `media/`. |
| `.env`, keys, certificates | Never were in the repo. `.env.example` shows the shape. |

Everything else tracked by git is here: 607 files, all source, config, fonts, icons,
SVGs and static images.

## Getting it running
```bash
npm install
cp .env.example .env        # fill in the values Hamzeh gives you
npx expo start
```
The landing page and AI proxy are separate installs:
```bash
cd landing-page && npm install && npm run dev
cd services/ai-proxy && npm install
```

## Two things to know before you start
1. **The video assets are missing by design.** Any screen that plays a lesson or the
   founder intro will fail until you get the media pack. Request it separately.
2. **`src/config/firebase.js` contains a live Firebase Web API key.** That is normal —
   Firebase web keys are public identifiers, not secrets. Access is controlled by
   Firestore Security Rules and App Check, not by hiding the key. Do not treat it as a
   credential, and do not commit any *server* key or service-account JSON alongside it.

## Better than a zip
This project already lives at `github.com/hamapp2025-dot/SNAPMATHGOLD`. Adding the team
as collaborators there is better than passing this archive around — they get history,
branches, code review, and a way to send work back. A zip is a one-way copy that starts
drifting the moment someone edits it.
