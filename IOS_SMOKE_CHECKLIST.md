# iOS Smoke Checklist

Run this checklist after routing, auth, localization, or state-management changes.

## Startup
- Launch the app in Expo Go on iOS.
- Confirm the initial route is intentional:
  - First-time user -> `welcome` or `auth`
  - Signed-in returning user -> `/(tabs)`
  - Incomplete onboarding -> `onboarding`
- Confirm no red screen, blank screen, or stuck loading state appears.

## Auth And Session
- Sign in with an existing account and verify the app lands in the main tabs.
- Create a new account and verify onboarding completes before entering the app.
- Continue as guest and verify onboarding still works.
- Log out from `settings` and verify Firebase session, local progress, and reminders are cleared for the next user.

## Core Navigation
- Open and verify each reachable route:
  - `/(tabs)`
  - `/practice`
  - `/curriculum`
  - `/chapter`
  - `/lesson-player`
  - `/practice-session`
  - `/exam`
  - `/sound-library`
  - `/sound-detail`
  - `/bookmarks`
  - `/progress`
  - `/settings`
  - `/subscription`
  - `/referral`
  - `/support`
  - `/leaderboard`
  - `/mathscan`

## Persistence
- Complete a lesson or practice session and verify XP updates immediately.
- Add a bookmark and verify it appears in `bookmarks`.
- Reopen the app and verify XP, score history, bookmarks, and mastery are still present.
- If signed in, verify cloud-backed data returns after relaunch.

## Bilingual QA
- Switch the app language to Arabic and back to English.
- Confirm high-traffic screens read naturally in both languages:
  - `welcome`
  - `auth`
  - `onboarding`
  - `/(tabs)`
  - `/practice`
  - `/curriculum`
  - `/sound-library`
  - `/settings`
  - `/referral`
- Check chevrons, icon placement, text alignment, and mixed Arabic/Latin names for RTL/LTR issues.

## Permissions
- Open `mathscan` and confirm the camera permission flow is clear.
- Open `settings` and verify reminder toggles and reminder time still work without crashing.
