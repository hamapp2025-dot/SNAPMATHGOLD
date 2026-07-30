# Adding your ElevenLabs voice to a rebuilt lesson

The rebuilt lessons ship **silent with burned-in Arabic + English subtitles**. To add
your cloned Arabic voice — perfectly synced to those subtitles — run one command on
your Mac (it needs internet + your ElevenLabs key, which the cloud sandbox can't reach).

## One-time setup

In the project root `.env`, make sure you have:

```
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=<your cloned Arabic voice id>
```

(Your key stays on your machine — it's read only at runtime from your own `.env`.)

## Voice a lesson (example: u2-l1)

```bash
cd ~/Downloads/SNAPMATHGOLD

node scripts/voice-lesson.mjs \
  --timings tools/lesson_timings/u2-l1.json \
  --video   assets/media/lessons/u2-l1-hero-subtitled.mp4 \
  --out     assets/media/lessons/u2-l1-hero-subtitled-voiced.mp4
```

What it does:

1. Reads the subtitle **beats** (the Arabic line for each caption + the exact second it
   appears on screen) from the timings file the animation emits.
2. Calls ElevenLabs once per beat in your cloned voice, caching each clip under
   `voiceover_audio/u2-l1/` (so re-runs are free).
3. Places each clip at its subtitle's timestamp and muxes them onto the silent video,
   writing the final voiced MP4 to `--out`.

The `--out` path above is exactly the file the app loads, so once it finishes the app
plays the voiced version — no code change needed.

### Useful flags

- `--merge-only` — skip ElevenLabs and just re-mux the already-cached clips (no internet
  needed; you can even tweak a clip by hand and re-merge).
- `--regen` — re-synthesize every beat even if a cached clip exists (use after editing
  the narration).
- `--model <id>` — ElevenLabs model, default `eleven_multilingual_v2`.

### Editing the narration

Each beat's Arabic text lives in the timings JSON (`beats[].ar`) and, for easy reading,
in `voiceover_scripts/u2-l1.txt`. Edit the Arabic in the timings JSON, then run with
`--regen` to re-voice. The subtitle *timing* is fixed by the animation, so keep each
line roughly the same length so the voice still fits its window; if a line grows a lot,
re-render the lesson so the on-screen hold expands to match.
