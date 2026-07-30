# SnapMath — Unit 1 Render Kit (3Blue1Brown style)

This is the **durable source** for Unit 1's snap clips. The rendered `.mp4`s can
always be regenerated from these files, so this kit is the thing worth keeping.

## What's inside

- `snapmath_manim/threeblue.py` — the shared engine: black canvas, color-as-meaning
  palette, Arabic caption helper, timing capture. **One knob matters:** `AR_FONT`.
- `scenes/` — one file per clip (15 clips: 9 in Lesson 1, 6 in Lesson 2).
- `render_all.sh` — renders every clip to `out/` at portrait 1080×1920, 30 fps.
- `requirements.txt` — `manim==0.20.1`.

## The one font change for the brand look

These clips render with **Noto Sans Arabic** as a stand-in. For the real SnapMath
brand look, install Cairo and change a single line in `snapmath_manim/threeblue.py`:

```python
AR_FONT = 'Cairo'   # was 'Noto Sans Arabic'
```

Then re-render. Nothing else changes.

## Render on the Mac

```bash
# system deps (Homebrew): cairo pango + a TeX distribution (MacTeX) for LaTeX math
brew install cairo pango
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
bash render_all.sh          # full quality → out/
bash render_all.sh preview  # fast 540x960 draft
```

## The 15 Unit 1 clips

Lesson 1 — Polynomial division, remainder & factor theorems, zeros:
1.1 long division · 1.2 synthetic division · 1.3 remainder theorem ·
1.4 (ax−b) remainder · 1.5 factor theorem · 1.6 full factoring ·
1.7 zeros & graph · 1.8 rational zeros · 1.9 solving equations

Lesson 2 — Partial fractions:
2.1 the idea (telescoping) · 2.2 distinct linear · 2.3 repeated factor ·
2.4 quadratic factor · 2.5 cover-up method · 2.6 improper fractions

## Rules baked into the engine (do not break)

- **Captions are PURE Arabic.** No inline Latin letters or math variables in an
  Arabic `Text`, or bidi reordering scrambles the line. Spell numbers as words.
- **Never put Arabic inside LaTeX `\text{}`** — it crashes the LaTeX compile.
- Math (variables, equations) stays in `MathTex`; explanation stays in `cap()`.

## Voice pass

Each clip writes a `*.timings.json` alongside its video (caption text + start
time + duration) so the ElevenLabs voice pass can align one calm narration track
per clip. Run silent-with-subtitles first, add voice second.
