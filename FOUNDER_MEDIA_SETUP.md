# Founder Media Setup

This app is already wired to show founder media in the onboarding and profile flow. To make it launch-ready, either fill the following `app.json` fields with hosted assets or add local files through `src/media/founderMedia.ts`:

## Required fields

- `expo.extra.founderImageUrl`
- `expo.extra.founderName`
- `expo.extra.founderTitleEn`
- `expo.extra.founderTitleAr`
- `expo.extra.founderMessageEn`
- `expo.extra.founderMessageAr`

## Video fields

- `expo.extra.introVideoUrl`
- `expo.extra.welcomeVideoUrl`

If `welcomeVideoUrl` is empty, the welcome screen now falls back to `introVideoUrl`, so one strong founder intro clip is enough to start.

## Local bundled option

- Add the files under `assets/media/founder/`
- Update `LOCAL_FOUNDER_MEDIA` in `src/media/founderMedia.ts`
- This keeps the screens wired even if you later switch from local files to hosted URLs

## Where each asset appears

- `app/intro.tsx`
  - Uses `introVideoUrl`
- `app/welcome.tsx`
  - Uses `welcomeVideoUrl`
  - Falls back to `introVideoUrl`
  - Shows founder image/name/message
- `app/(tabs)/profile.tsx`
  - Shows founder image/name/message

## Recommended asset specs

- Founder image:
  - Square crop
  - At least `1200x1200`
  - Clean portrait with face centered
- Intro video:
  - Vertical `1080x1920`
  - `6` to `15` seconds
  - Clear opening line and strong first frame
  - No tiny subtitles near the bottom safe area
- Welcome video:
  - Same format as intro video
  - Optional if the intro clip already works well

## Recommended launch order

1. Add the founder image URL first so the profile and welcome founder card feel real.
2. Add one intro video URL and review both intro and welcome flows.
3. Only add a separate `welcomeVideoUrl` if you want a different clip after the intro.

## Suggested founder copy tone

- English:
  - Short, confident, warm
  - Focus on Jordanian students, clear steps, exam confidence
- Arabic:
  - Direct and natural Jordanian-friendly Modern Standard Arabic
  - Avoid long promotional paragraphs

## Quick verification after adding assets

1. Launch the app fresh and confirm the intro video plays.
2. Confirm the welcome screen shows the same clip if `welcomeVideoUrl` is still empty.
3. Open the profile tab and confirm the founder image loads cleanly.
4. Check both English and Arabic for line wrapping and readability.
