# SnapMath Manim Pipeline

This folder is the reusable `Manim` production scaffold for original SnapMath lesson videos.

It is designed to help us move from:

- sample placeholder animations
- ad-hoc one-off exports

to a repeatable workflow for:

- Jordan Grade 12 lesson visuals
- premium dark SnapMath styling
- reusable scene helpers
- consistent output naming that matches the app media registry

## Current pilot lessons

The scaffold is wired for the first two pilot lessons already defined in the app:

- `u1-l1` -> `Remainder & Factor Theorems`
- `u2-l1` -> `Trig Identities (1)`

## Folder layout

```text
manim/
  README.md
  manim.cfg
  render_lesson.py
  snapmath_manim/
    __init__.py
    base_scene.py
    registry.py
    theme.py
  scenes/
    grade12/
      u1_l1_remainder_factor.py
      u2_l1_trig_identities.py
```

## Local setup

Recommended on macOS:

```bash
brew install ffmpeg cairo pango
python3 -m venv .venv
source .venv/bin/activate
pip install manim
```

Notes:

- `MathTex` scenes also need a LaTeX distribution such as `MacTeX` or `TinyTeX`.
- Arabic text is styled around the `Amiri` font. If that font is missing, install it or change the font constants in `snapmath_manim/theme.py`.

## Render commands

List the lesson targets:

```bash
python render_lesson.py --list
```

Preview render for quick iteration:

```bash
python render_lesson.py --lesson u1-l1 --quality preview
```

Production render:

```bash
python render_lesson.py --lesson u2-l1 --quality production
```

Open the export automatically after render:

```bash
python render_lesson.py --lesson u1-l1 --quality preview --open
```

## Output workflow

The render script outputs into `manim/exports/`.

After a final export looks correct:

1. Rename or copy the final MP4 into `assets/media/lessons/`.
2. Use the naming convention already expected by the app, for example:
   - `assets/media/lessons/u1-l1-hero.mp4`
   - `assets/media/lessons/u2-l1-hero.mp4`
3. Wire the file in `src/media/lessonMedia.ts` inside `LESSON_MEDIA_ASSET_OVERRIDES`.

## Scene structure

Each lesson scene should follow the same production rhythm:

1. Visual hook
2. Core Manim explanation
3. One Jordan-style worked example
4. Short recap or exam cue

The shared base scene handles:

- dark premium canvas
- title stack
- lesson ID chip
- footer note area
- consistent color system

## Next expansion

When we add the next lessons, reuse this pattern:

1. Create a new scene file in `scenes/grade12/`
2. Register it in `snapmath_manim/registry.py`
3. Render a preview with `render_lesson.py`
4. Export the final MP4 into `assets/media/lessons/`
5. Connect it in `src/media/lessonMedia.ts`
