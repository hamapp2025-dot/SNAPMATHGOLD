# Lesson Media Pipeline

This document defines the first production-ready media system for `SnapMath Academy`.

## Goal

Make each flagship lesson feel closer to a premium coached experience:

- Short founder or coach opening
- Original `Manim` explanation for the core math
- One clean worked example
- Short recap
- Immediate handoff into practice

The system is designed for Jordan Grade 12 first, then expansion across later grades and markets.

## Reference Clips

The two recent local screen recordings are useful as `product direction`, not as shipping lesson assets:

- `ScreenRecording_03-06-2026 02-13-45_1.MP4`
- `ScreenRecording_03-05-2026 00-35-06_1.MP4`

They show a strong `BoldVoice-style journey` feeling:

- dark premium canvas
- short coach moments
- visible progression
- clear next action

Use that as inspiration for pacing and layout only.

## Shipping Asset Types

Each pilot lesson should support these media slots:

- `founder or coach intro`
- `hero video`
- `poster`
- `transcript preview`
- `captions`
- `lesson segments`
- `recap`

These are now modeled in `src/media/lessonMedia.ts`.

## Recommended Lesson Structure

1. `Avatar intro`
   - `8-18s`
   - coach states the goal in simple language
2. `Manim core`
   - `35-70s`
   - show the math visually, not just verbally
3. `Worked example`
   - `25-45s`
   - match Jordanian book notation and pacing
4. `Practice push`
   - `10-20s`
   - encourage one immediate checkpoint
5. `Recap`
   - `8-15s`
   - exam-focused reminder

## Founder Video Rules

- Use the founder clip mainly for:
  - intro
  - motivation
  - recap
- Do not keep the talking head on screen during the full explanation.
- Let `Manim` carry the actual math teaching.

## Subtitle Rules

- Keep lines short.
- Avoid bottom-safe-area collisions.
- Prefer one key idea per subtitle beat.
- Maintain Arabic readability while leaving math symbols in familiar textbook form.

## Pilot Rollout

Start with one world-class lesson:

- `u1-l1`
  - `Remainder & Factor Theorems`

Then expand to:

- `u2-l1`
  - `Trig Identities (1)`

Only after the pilot feels excellent should the same structure spread across the rest of Grade 12.

## Upload Order

1. Final founder photo
2. One strong founder intro video
3. One pilot lesson avatar intro
4. One pilot `Manim` explanation
5. Captions and transcript polish
6. Lesson-by-lesson scale-out

## App Integration

The lesson player now supports:

- media status labels
- coach intro copy
- transcript preview
- premium lesson flow segments
- hosted video slot fallback
- local hero video overrides in `src/media/lessonMedia.ts`

That means the product can be improved immediately even before every final video is exported.

## Manim Production Scaffold

A reusable SnapMath `Manim` scaffold now lives in `manim/`.

It includes:

- shared SnapMath theme helpers
- a base lesson scene
- a render CLI
- pilot scene files for `u1-l1` and `u2-l1`

Use it like this:

1. Render a lesson preview with `python manim/render_lesson.py --lesson u1-l1 --quality preview`
2. Render the final export with `python manim/render_lesson.py --lesson u1-l1 --quality production`
3. Copy the final MP4 into `assets/media/lessons/u1-l1-hero.mp4`
4. Connect that file in `src/media/lessonMedia.ts`

This keeps the premium lesson pipeline aligned with the app's media registry instead of relying on temporary samples forever.
