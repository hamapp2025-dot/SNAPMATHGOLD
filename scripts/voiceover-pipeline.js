#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');

const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');
const ffmpegStatic = require('ffmpeg-static');
const { createClient } = require('@supabase/supabase-js');

const execAsync = util.promisify(exec);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PREFERRED_VIDEOS_DIR = path.join(PROJECT_ROOT, 'manim_videos');
const FALLBACK_VIDEOS_DIR = path.join(PROJECT_ROOT, 'manim', 'exports', 'videos');
const VOICEOVER_SCRIPTS_DIR = path.join(PROJECT_ROOT, 'voiceover_scripts');
const FINAL_VIDEOS_DIR = path.join(PROJECT_ROOT, 'final_videos');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');

dotenv.config({ path: ENV_PATH });

const FFMPEG_BINARY =
  process.env.FFMPEG_PATH ||
  ffmpegStatic ||
  (process.platform === 'darwin' && fs.existsSync('/opt/homebrew/bin/ffmpeg')
    ? '/opt/homebrew/bin/ffmpeg'
    : 'ffmpeg');

const REQUIRED_ENV_VARS = [
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
];

function escapeShellArg(value) {
  return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
}

function ensureProjectRoot() {
  if (path.basename(PROJECT_ROOT) !== 'SNAPMATHGOLD') {
    throw new Error(`This script must run inside ~/Downloads/SNAPMATHGOLD. Current root: ${PROJECT_ROOT}`);
  }
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`[missing] ${dirPath}`);
    return [];
  }

  const entries = fs.readdirSync(dirPath).sort();
  console.log(`\nListing ${dirPath}`);
  if (entries.length === 0) {
    console.log('  (empty)');
  } else {
    for (const entry of entries) {
      console.log(`  - ${entry}`);
    }
  }
  return entries;
}

function walkForMp4Files(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkForMp4Files(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp4')) {
      results.push(entryPath);
    }
  }
  return results;
}

function isRenderedLessonVideo(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  return (
    normalized.endsWith('.mp4') &&
    !normalized.includes('/partial_movie_files/') &&
    !normalized.includes('/final_videos/')
  );
}

function resolveVideoFiles() {
  listDirectory(PREFERRED_VIDEOS_DIR);
  const preferredVideos = walkForMp4Files(PREFERRED_VIDEOS_DIR).filter(isRenderedLessonVideo);
  if (preferredVideos.length > 0) {
    return preferredVideos.sort();
  }

  listDirectory(FALLBACK_VIDEOS_DIR);
  const fallbackVideos = walkForMp4Files(FALLBACK_VIDEOS_DIR).filter(isRenderedLessonVideo);
  if (fallbackVideos.length > 0) {
    return fallbackVideos.sort();
  }

  throw new Error('No rendered Manim .mp4 files were found in manim_videos/ or manim/exports/videos/.');
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readVoiceoverScript(videoPath) {
  const baseName = path.basename(videoPath, path.extname(videoPath));
  const scriptPath = path.join(VOICEOVER_SCRIPTS_DIR, `${baseName}.txt`);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Missing companion voiceover script: ${scriptPath}`);
  }

  const text = fs.readFileSync(scriptPath, 'utf8').trim();
  if (!text) {
    throw new Error(`Voiceover script is empty: ${scriptPath}`);
  }

  return { scriptPath, text };
}

async function generateArabicVoiceover(videoPath, text) {
  const voiceId = requireEnv('ELEVENLABS_VOICE_ID');
  const apiKey = requireEnv('ELEVENLABS_API_KEY');
  const audioPath = path.join(path.dirname(videoPath), `${path.basename(videoPath, '.mp4')}.mp3`);

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      timeout: 120000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  );

  fs.writeFileSync(audioPath, Buffer.from(response.data));
  return audioPath;
}

async function mergeVideoAndAudio(videoPath, audioPath) {
  ensureDirectory(FINAL_VIDEOS_DIR);

  const outputPath = path.join(FINAL_VIDEOS_DIR, path.basename(videoPath));
  const command = [
    escapeShellArg(FFMPEG_BINARY),
    '-y',
    '-i',
    escapeShellArg(videoPath),
    '-i',
    escapeShellArg(audioPath),
    '-c:v copy',
    '-c:a aac',
    '-shortest',
    escapeShellArg(outputPath),
  ].join(' ');

  await execAsync(command, {
    cwd: PROJECT_ROOT,
    maxBuffer: 1024 * 1024 * 20,
  });

  return outputPath;
}

async function uploadToCloudflareStream(filePath) {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = requireEnv('CLOUDFLARE_API_TOKEN');
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), path.basename(filePath));

  const response = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...form.getHeaders(),
    },
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!response.data || response.data.success !== true || !response.data.result?.uid) {
    throw new Error(`Cloudflare upload failed for ${filePath}: ${JSON.stringify(response.data)}`);
  }

  const uid = response.data.result.uid;
  const playbackUrl =
    response.data.result.preview ||
    response.data.result.playback?.hls ||
    `https://watch.videodelivery.net/${uid}`;

  return { uid, playbackUrl };
}

function inferLessonId(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  const match = baseName.match(/u(\d+)[-_]l(\d+)/);
  if (!match) {
    return baseName;
  }

  return `u${match[1]}-l${match[2]}`;
}

function printHelp() {
  console.log(`
SnapMath voiceover pipeline

Usage:
  npm run pipeline

What it does:
  1. Finds rendered Manim .mp4 files.
  2. Reads matching Arabic scripts from voiceover_scripts/.
  3. Generates Arabic voiceover with ElevenLabs.
  4. Merges video + audio with FFmpeg.
  5. Uploads the merged file to Cloudflare Stream.
  6. Updates lessons.video_url in Supabase.
`);
}

async function updateSupabaseVideoUrl(lessonId, playbackUrl) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_KEY');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('lessons')
    .update({ video_url: playbackUrl })
    .eq('id', lessonId)
    .select('id, video_url');

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function main() {
  ensureProjectRoot();
  ensureDirectory(VOICEOVER_SCRIPTS_DIR);
  ensureDirectory(FINAL_VIDEOS_DIR);

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp();
    return;
  }

  for (const name of REQUIRED_ENV_VARS) {
    requireEnv(name);
  }

  const videoFiles = resolveVideoFiles();
  console.log(`\nFound ${videoFiles.length} rendered video(s) to process.\n`);

  const summary = [];

  for (const videoPath of videoFiles) {
    const lessonId = inferLessonId(videoPath);
    const { scriptPath, text } = readVoiceoverScript(videoPath);

    console.log(`Processing lesson ${lessonId}`);
    console.log(`  video: ${videoPath}`);
    console.log(`  script: ${scriptPath}`);

    const audioPath = await generateArabicVoiceover(videoPath, text);
    console.log(`  audio: ${audioPath}`);

    const mergedPath = await mergeVideoAndAudio(videoPath, audioPath);
    console.log(`  merged: ${mergedPath}`);

    const { uid, playbackUrl } = await uploadToCloudflareStream(mergedPath);
    console.log(`  cloudflare uid: ${uid}`);
    console.log(`  playback url: ${playbackUrl}`);

    const updatedRows = await updateSupabaseVideoUrl(lessonId, playbackUrl);
    console.log(`  supabase rows updated: ${updatedRows.length}`);

    summary.push({
      lessonId,
      mergedPath,
      uid,
      playbackUrl,
    });
  }

  console.log('\nPipeline complete.\n');
  console.table(summary);
}

main().catch((error) => {
  console.error('\nPipeline failed.');
  console.error(error);
  process.exitCode = 1;
});
