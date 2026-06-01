# SnapMath / SNAPMATHGOLD — What's Missing (Evaluation)

This document lists **exactly** what is missing or incomplete in your app, based on a full codebase audit.

---

## 1. Critical — App Won't Run / Build

### 1.1 Missing `firebaseConfig` at project root
- **Issue:** `app/auth.tsx`, `app/_layout.tsx`, `app/(tabs)/leaderboard.tsx`, and `src/hooks/useFirestoreSync.ts` import from `../firebaseConfig` or `../../firebaseConfig` (i.e. **project root**).
- **Current state:** There is **no** `firebaseConfig.js` or `firebaseConfig.ts` at the project root. Firebase is only defined in `src/config/firebase.js`.
- **Result:** Imports fail; app will not run until this is fixed.
- **Fix:** Either:
  - Add at project root a `firebaseConfig.js` (or `.ts`) that exports `auth` and `db` (e.g. re-export from `./src/config/firebase`), **or**
  - Change all those imports to use `../src/config/firebase` (or the correct relative path from each file).

### 1.2 Missing app entry route `app/index.tsx`
- **Issue:** The root layout declares `<Stack.Screen name="index" ... />`, so Expo Router expects `app/index.tsx` as the initial route.
- **Current state:** There is **no** `app/index.tsx` in the project (only `app/(tabs)/index.tsx`).
- **Result:** Initial route is undefined; app may show a blank screen, 404, or rely on framework fallback.
- **Fix:** Add `app/index.tsx` that:
  - Reads onboarding/auth state (e.g. from AsyncStorage / Firebase),
  - Redirects to `/(tabs)` if the user is signed in and onboarded,
  - Otherwise redirects to `/welcome` or `/onboarding` or `/auth` as appropriate.

---

## 2. Auth & Account

### 2.1 Forgot password not wired
- **Where:** `app/auth.tsx` (around lines 257–263).
- **Issue:** The "Forgot password?" row is a `TouchableOpacity` with **no `onPress`**.
- **Fix:** Add `onPress` that calls Firebase `sendPasswordResetEmail(auth, email)` (and handle loading/errors / success message). Optionally open a small modal or alert to confirm email and show "Check your email" after success.

### 2.2 Social login (Apple / Google / Facebook) not implemented
- **Where:** `app/welcome.tsx` — buttons "Continue with Apple", "Continue with Google", "Continue with Facebook".
- **Issue:** All three buttons use `onPress={start}`, which only navigates to `/auth`. They do **not** trigger OAuth or any social sign-in.
- **Fix:** Implement real sign-in:
  - **Apple:** `expo-apple-authentication` + Firebase `signInWithCredential` (OAuthProvider).
  - **Google:** `@react-native-google-signin/google-signin` (or Expo equivalent) + Firebase `signInWithCredential`.
  - **Facebook:** Facebook SDK + Firebase Facebook auth.
  Then navigate to `/(tabs)` or onboarding as needed after successful sign-in.

---

## 3. Support & Contact

### 3.1 Support "Send" does not send to server or email
- **Where:** `app/support.tsx` — `sendFeedback()`.
- **Issue:** Submitting the form only:
  - Appends the message to a list in AsyncStorage,
  - Shows an alert "We usually reply within one business day."
  It does **not** send an email or call any backend. Users will believe the message was sent.
- **Fix:** Either:
  - Use `Linking.openURL(mailto:...)` with subject and body (like `openEmail`) and label the button "Open in Mail" / "إفتح البريد", **or**
  - Send the message to your backend (e.g. Cloud Function, Supabase, or support API) and then show success. Optionally keep a copy in AsyncStorage for "My messages" if you add that screen.

### 3.2 Placeholder support links
- **Where:** `app/support.tsx` — WhatsApp `https://wa.me/962790000000`, and `snapmathacademy.com` URLs.
- **Issue:** These are placeholder values. If the site or number are not yours, update them so Support and FAQ point to real contact channels.

---

## 4. Subscription & Payments

### 4.1 No real in-app purchases
- **Where:** `app/subscription.tsx` — `handleSubscribe()`.
- **Issue:** Subscribe button opens the App Store / Play Store URL and sets `AsyncStorage.setItem('@snapmath_subscribed', selectedKey)`. There is **no** integration with `expo-in-app-purchases` (or RevenueCat / native IAP). Subscription state is local only and not validated.
- **Fix:** Integrate real IAP (Expo IAP or native), validate receipts on your backend, and gate premium features (MathScan, AI Chat, etc.) on that state. Optionally keep "Open in Store" as a fallback for regions where IAP is not used.

### 4.2 Restore purchases
- **Where:** Referenced in Support FAQ and likely on subscription screen.
- **Issue:** If "Restore purchases" only reads AsyncStorage, it does not actually restore from Apple/Google. It must call the same IAP "restore" API and then update app state.

---

## 5. Referral

### 5.1 No server-side referral tracking
- **Where:** `app/referral.tsx` — referral count in AsyncStorage (`KEY_REFERRALS`), share link `snapmath.app/invite/grade12`.
- **Issue:** Referral count is local only. There is no backend that:
  - Attributes a new sign-up to an invite link,
  - Awards XP or rewards when someone joins via link.
- **Fix:** Implement backend (e.g. Firestore or your API) that:
  - Stores invite codes per user and counts sign-ups by code,
  - On new user registration with `?ref=...`, increments the referrer's count and awards XP/rewards. Then sync this to the app (e.g. Firestore) so the referral screen shows real data.

---

## 6. Profile & Settings

### 6.1 Subscription renewal date is hardcoded
- **Where:** `app/(tabs)/profile.tsx` — subtitle "Renews next on 8/10/2026" / "يتجدد في 8/10/2026".
- **Issue:** Date is fixed; not driven by real subscription or IAP expiry.
- **Fix:** Once IAP is integrated, store and display the actual renewal/expiry date from the receipt or backend.

### 6.2 Push notifications not fully implemented
- **Where:** `app/settings.tsx` — uses `expo-notifications` for permission check.
- **Issue:** Notifications are only partially wired (e.g. permission flow may exist, but no token sent to backend, no scheduled "reminder" notifications, and no handling of received notifications for deep link or in-app behavior).
- **Fix:** Register for push, send token to your backend, and implement:
  - Optional reminder notifications (e.g. daily "Time to practice"),
  - Handling of notification taps (e.g. open a specific screen).

---

## 7. Content & Features

### 7.1 Lesson bookmark button does nothing
- **Where:** `app/lesson-player.tsx` — header bookmark icon (around line 76–78).
- **Issue:** The bookmark `TouchableOpacity` has **no `onPress`**. It does not add/remove the lesson from bookmarks.
- **Fix:** Add `onPress` that toggles the current lesson in your bookmarks store (e.g. `useBookmarks` or AsyncStorage) and optionally show a short "Added to bookmarks" / "Removed" feedback.

### 7.2 MathScan without OpenAI key
- **Where:** `app/mathscan.tsx`.
- **Issue:** Without `@snapmath_openai_key` in AsyncStorage, the app falls back to a fixed problem bank (PROBLEMS array). Real "point camera at any problem" requires either user-provided OpenAI key or your own backend vision API.
- **Status:** Documented and acceptable as a limitation; ensure in-app copy (e.g. Support FAQ) explains that users can add their own key for better recognition.

### 7.3 AI Chat without OpenAI key
- **Where:** `app/(tabs)/ai-chat.tsx`.
- **Issue:** Same as MathScan: without a stored OpenAI key, the app uses a local fallback. Real AI tutoring depends on key or your backend.
- **Status:** Same as 7.2 — document and optionally add a one-time prompt or settings entry to add key.

---

## 8. Config & Branding

### 8.1 App name / slug in `app.json`
- **Where:** `app.json` (and possibly `app/app.json` inside `app/`).
- **Issue:** Name/slug are "zamza2" and bundle ID "com.zamza.zamza2", which may be intentional or leftover. If the product is "SnapMath Academy", consider aligning name, slug, and bundle ID for store listing and deep links.

### 8.2 Support email and URLs
- **Where:** `app/support.tsx` — `SUPPORT_EMAIL = 'support@snapmathacademy.com'`; subscription and support use `snapmathacademy.com` URLs.
- **Issue:** If these domains/emails are not active, users cannot reach you. Confirm and update to real support email and links.

---

## 9. Optional / Polish

### 9.1 Duplicate / legacy entry (App.js)
- **Where:** Root `App.js` — uses `LoginScreen`, `OnboardingScreen`, `AppNavigator` from `src/screens` and `src/navigation`.
- **Issue:** With Expo Router, the real entry is the `app/` directory. If the project is run with Expo Router, `App.js` may be unused. If you still use it somewhere, keep it; otherwise you can remove or refactor to avoid two different auth/onboarding flows.

### 9.2 Mock data in `src/screens`
- **Where:** `src/screens/` (e.g. ParentsScreen, MistakesScreen, GroupsScreen, FormulasScreen) use `MOCK` or `MOCK_*` data.
- **Issue:** If these screens are not used by the current Expo Router app, the mocks are harmless. If they are used, replace with real data or API.

### 9.3 (tabs) layout
- **Where:** Expo Router expects `app/(tabs)/_layout.tsx` to define the bottom tab bar.
- **Issue:** In the audited tree, `app/(tabs)/_layout.tsx` was not found. If the tab bar is defined elsewhere (e.g. inside root `_layout.tsx` or another mechanism), no change needed. If tabs are missing or wrong, add or fix `app/(tabs)/_layout.tsx` with a Tabs navigator and the correct tab list (e.g. Home, AI Coach, Practice, Exams, Leaderboard, Profile).

---

## 10. Summary Checklist

| # | Item | Priority |
|---|------|----------|
| 1 | Add `firebaseConfig` at root or fix imports to `src/config/firebase` | **Critical** |
| 2 | Add `app/index.tsx` and implement auth/onboarding redirect | **Critical** |
| 3 | Wire "Forgot password?" to `sendPasswordResetEmail` | High |
| 4 | Implement Apple/Google/Facebook sign-in (or remove/hide buttons) | High |
| 5 | Support "Send" — either mailto or backend API | High |
| 6 | Implement real IAP and restore purchases | High |
| 7 | Backend referral tracking and XP for invite sign-ups | Medium |
| 8 | Lesson bookmark button `onPress` and bookmark storage | Medium |
| 9 | Push notifications: token to backend, reminders, tap handling | Medium |
| 10 | Replace hardcoded subscription date with real expiry | Low |
| 11 | Confirm app name, bundle ID, support email, and URLs | Low |

If you fix items 1 and 2 first, the app can run and navigate. Then address auth (3–4), support (5), and subscription (6) for a shippable experience.
