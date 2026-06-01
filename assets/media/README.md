# SnapMath Media Drop Zone

Use this folder for real founder and lesson media as the sample placeholders get replaced.

## Founder assets

Recommended file names:

- `founder/founder-portrait.jpg`
- `founder/founder-intro.mp4`
- `founder/founder-welcome.mp4`

After adding real files, wire them in `src/media/founderMedia.ts` by replacing the `null` entries in `LOCAL_FOUNDER_MEDIA`.

## Lesson assets

Recommended file names:

- `lessons/u1-l1-hero.mp4`
- `lessons/u2-l1-hero.mp4`

After adding real lesson files, wire them in `src/media/lessonMedia.ts` inside `LESSON_MEDIA_ASSET_OVERRIDES`.

If you are generating the lesson visuals with the SnapMath `Manim` scaffold, start from `manim/render_lesson.py` and export the final rendered file into this `lessons/` folder using the same naming convention.

## Video export guidance

- Vertical founder clips: `1080x1920`
- Lesson hero clips: `1080x1920` or clean `16:9` exports
- H.264 MP4
- Keep intro and recap clips short
- Keep subtitles high enough to avoid bottom controls
