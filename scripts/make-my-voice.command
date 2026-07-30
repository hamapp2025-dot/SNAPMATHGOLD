#!/bin/bash
# Double-click this file to generate your ElevenLabs voice clips for u2-l1.
# Requires: your key + voice id filled into the project .env file.
cd "$(dirname "$0")/.." || exit 1

echo "──────────────────────────────────────────────"
echo "  Generating your ElevenLabs voice for u2-l1"
echo "──────────────────────────────────────────────"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install it, then double-click again."
  read -r -p "Press Return to close."
  exit 1
fi

node scripts/voice-lesson.mjs --generate-only --timings tools/lesson_timings/u2-l1.json
STATUS=$?

echo ""
if [ $STATUS -eq 0 ]; then
  echo "✓ Your voice clips are ready in voiceover_audio/u2-l1/"
  echo "  Now tell Claude: \"voice clips ready\" — it will sync them into the video."
else
  echo "Something went wrong. Make sure your ELEVENLABS_API_KEY and"
  echo "ELEVENLABS_VOICE_ID are filled into the .env file, then try again."
fi
echo ""
read -r -p "Press Return to close."
