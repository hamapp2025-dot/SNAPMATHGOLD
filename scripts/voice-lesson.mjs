#!/usr/bin/env node
/**
 * voice-lesson.mjs — add your ElevenLabs cloned voice to a rebuilt SnapMath lesson,
 * perfectly synced to the burned-in subtitles.
 *
 * It reads the subtitle "beats" (Arabic text + the exact timestamp each caption
 * appears) that the Manim scene emits, generates one voice clip per beat in your
 * cloned voice, and muxes each clip at its timestamp onto the silent lesson video.
 *
 * You run this on your Mac (it needs internet + your ElevenLabs key). Nothing here
 * ever sees your key except at runtime from your own .env.
 *
 * .env (in project root) must contain:
 *   ELEVENLABS_API_KEY=sk_...
 *   ELEVENLABS_VOICE_ID=<your cloned Arabic voice id>
 *
 * Usage:
 *   node scripts/voice-lesson.mjs \
 *     --timings tools/lesson_timings/u2-l1.json \
 *     --video   assets/media/lessons/u2-l1-hero-subtitled.mp4 \
 *     --out     assets/media/lessons/u2-l1-hero-subtitled-voiced.mp4
 *
 *   Flags:
 *     --regen        re-synthesize audio even if a cached clip exists
 *     --merge-only   skip ElevenLabs, just re-mux existing cached clips (no network)
 *     --model <id>   ElevenLabs model (default eleven_multilingual_v2)
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// ---- tiny arg parser -------------------------------------------------------
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function loadDotEnv(root) {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed: ${r.stderr || r.stdout || r.status}`);
  }
  return r.stdout;
}

function ffprobeDuration(file) {
  const out = run('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nk=1:nw=1', file,
  ]);
  return parseFloat(out.trim());
}

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

async function synthBeat({ apiKey, voiceId, model, text, outFile }) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'accept': 'audio/mpeg',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.0, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outFile, buf);
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  loadDotEnv(root);

  const timingsPath = args.timings;
  const videoPath = args.video;
  const outPath = args.out;
  const model = typeof args.model === 'string' ? args.model : 'eleven_multilingual_v2';
  const mergeOnly = Boolean(args['merge-only']);
  const generateOnly = Boolean(args['generate-only']);
  const regen = Boolean(args.regen);

  if (!timingsPath) {
    console.error('Missing --timings. See header of this file for usage.');
    process.exit(1);
  }
  if (!generateOnly && (!videoPath || !outPath)) {
    console.error('Missing --video / --out (not needed with --generate-only).');
    process.exit(1);
  }

  const timings = JSON.parse(fs.readFileSync(timingsPath, 'utf8'));
  const beats = timings.beats || [];
  const lessonId = timings.lesson_id || path.basename(timingsPath, '.json');
  if (!beats.length) throw new Error(`No beats in ${timingsPath}`);

  const audioDir = path.join(root, 'voiceover_audio', lessonId);
  fs.mkdirSync(audioDir, { recursive: true });

  // 1) synthesize each beat (unless merge-only)
  if (!mergeOnly) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) {
      throw new Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env (or use --merge-only).');
    }
    for (const beat of beats) {
      const clip = path.join(audioDir, `beat_${String(beat.i).padStart(2, '0')}.mp3`);
      if (fs.existsSync(clip) && !regen) {
        console.log(`· cached  beat ${beat.i}`);
        continue;
      }
      process.stdout.write(`· voicing beat ${beat.i} … `);
      await synthBeat({ apiKey, voiceId, model, text: beat.ar, outFile: clip });
      console.log('done');
    }
  }

  if (generateOnly) {
    console.log(`\n✓ Generated ${beats.length} voice clips in voiceover_audio/${lessonId}/`);
    console.log('Tell Claude it is done — it will sync them onto the lesson video.');
    return;
  }

  // 2) build the ffmpeg filtergraph: place each clip at its beat.start timestamp
  const inputs = ['-i', videoPath];
  const filters = [];
  const mixLabels = [];
  let idx = 1; // input 0 is the video
  for (const beat of beats) {
    const clip = path.join(audioDir, `beat_${String(beat.i).padStart(2, '0')}.mp3`);
    if (!fs.existsSync(clip)) {
      console.warn(`! missing clip for beat ${beat.i}, skipping`);
      continue;
    }
    const ms = Math.max(0, Math.round(beat.start * 1000));
    inputs.push('-i', clip);
    filters.push(`[${idx}:a]adelay=${ms}:all=1[a${idx}]`);
    mixLabels.push(`[a${idx}]`);
    idx += 1;
  }
  if (!mixLabels.length) throw new Error('No audio clips available to merge.');

  const videoDur = ffprobeDuration(videoPath);
  filters.push(
    `${mixLabels.join('')}amix=inputs=${mixLabels.length}:normalize=0:dropout_transition=0,` +
    `apad,atrim=0:${videoDur.toFixed(3)},aresample=async=1[aout]`,
  );

  const ffArgs = [
    '-y', ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
    outPath,
  ];

  console.log(`\nMuxing ${mixLabels.length} voice clips onto ${path.basename(videoPath)} …`);
  run(FFMPEG, ffArgs);
  console.log(`✓ wrote ${outPath}`);
}

main().catch((err) => {
  console.error(`\nvoice-lesson failed: ${err.message}`);
  process.exit(1);
});
