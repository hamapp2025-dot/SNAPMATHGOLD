import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

type SoundEffectName = 'correct' | 'wrong' | 'complete';

type TonePreset = {
  frequencies: number[];
  durationMs: number;
  volume: number;
};

const SAMPLE_RATE = 22050;
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const TONE_PRESETS: Record<SoundEffectName, TonePreset> = {
  correct: { frequencies: [784, 1046], durationMs: 140, volume: 0.28 },
  wrong: { frequencies: [240, 180], durationMs: 180, volume: 0.24 },
  complete: { frequencies: [523, 659, 784], durationMs: 260, volume: 0.3 },
};

const loadedSounds: Partial<Record<SoundEffectName, any>> = {};
const loadedUris: Partial<Record<SoundEffectName, string>> = {};
let preloadPromise: Promise<void> | null = null;
let audioModeReady = false;
let expoAvCache: any | null | undefined;

function getExpoAV() {
  const hasNativeAv = Boolean(requireOptionalNativeModule('ExponentAV'));
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient';
  if (isExpoGo || !hasNativeAv) {
    // Expo Go may not ship with the native ExponentAV module.
    return null;
  }
  if (expoAvCache !== undefined) return expoAvCache;
  try {
    // Expo Go may not include ExponentAV; keep audio optional.
    expoAvCache = require('expo-av');
  } catch {
    expoAvCache = null;
  }
  return expoAvCache;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function writeString(target: Uint8Array, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    target[offset + i] = value.charCodeAt(i);
  }
}

function writeUint16LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
}

function writeUint32LE(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
  target[offset + 2] = (value >> 16) & 0xff;
  target[offset + 3] = (value >> 24) & 0xff;
}

function encodeBase64(bytes: Uint8Array) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (a << 16) | (b << 8) | c;
    output += BASE64_CHARS[(triplet >> 18) & 63];
    output += BASE64_CHARS[(triplet >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64_CHARS[(triplet >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? BASE64_CHARS[triplet & 63] : '=';
  }
  return output;
}

function createToneBase64(preset: TonePreset) {
  const samplesPerSegment = Math.max(1, Math.floor((SAMPLE_RATE * preset.durationMs) / 1000 / preset.frequencies.length));
  const totalSamples = samplesPerSegment * preset.frequencies.length;
  const dataSize = totalSamples * 2;
  const wav = new Uint8Array(44 + dataSize);
  const attackSamples = Math.floor(SAMPLE_RATE * 0.006);
  const releaseSamples = Math.floor(SAMPLE_RATE * 0.03);

  writeString(wav, 0, 'RIFF');
  writeUint32LE(wav, 4, 36 + dataSize);
  writeString(wav, 8, 'WAVE');
  writeString(wav, 12, 'fmt ');
  writeUint32LE(wav, 16, 16);
  writeUint16LE(wav, 20, 1);
  writeUint16LE(wav, 22, 1);
  writeUint32LE(wav, 24, SAMPLE_RATE);
  writeUint32LE(wav, 28, SAMPLE_RATE * 2);
  writeUint16LE(wav, 32, 2);
  writeUint16LE(wav, 34, 16);
  writeString(wav, 36, 'data');
  writeUint32LE(wav, 40, dataSize);

  let cursor = 44;
  for (let i = 0; i < totalSamples; i++) {
    const segment = Math.min(
      preset.frequencies.length - 1,
      Math.floor(i / samplesPerSegment),
    );
    const frequency = preset.frequencies[segment];
    const time = i / SAMPLE_RATE;

    let envelope = 1;
    if (i < attackSamples) {
      envelope = i / Math.max(1, attackSamples);
    } else if (i > totalSamples - releaseSamples) {
      envelope = (totalSamples - i) / Math.max(1, releaseSamples);
    }

    const sample = Math.sin(2 * Math.PI * frequency * time) * clamp(envelope, 0, 1) * preset.volume;
    const int16 = Math.round(clamp(sample, -1, 1) * 32767);
    const pcm = int16 < 0 ? int16 + 65536 : int16;
    wav[cursor++] = pcm & 0xff;
    wav[cursor++] = (pcm >> 8) & 0xff;
  }

  return encodeBase64(wav);
}

async function ensureAudioMode() {
  if (audioModeReady) return;
  const av = getExpoAV();
  if (!av?.Audio) return;
  await av.Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: av.InterruptionModeIOS?.MixWithOthers,
    interruptionModeAndroid: av.InterruptionModeAndroid?.DuckOthers,
  });
  audioModeReady = true;
}

async function getSoundUri(name: SoundEffectName) {
  if (loadedUris[name]) return loadedUris[name]!;

  const base64 = createToneBase64(TONE_PRESETS[name]);
  if (Platform.OS === 'web') {
    const uri = `data:audio/wav;base64,${base64}`;
    loadedUris[name] = uri;
    return uri;
  }

  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    const uri = `data:audio/wav;base64,${base64}`;
    loadedUris[name] = uri;
    return uri;
  }

  const uri = `${baseDir}sfx-${name}.wav`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  loadedUris[name] = uri;
  return uri;
}

async function preloadSoundEffects() {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const av = getExpoAV();
    if (!av?.Audio) return;
    await ensureAudioMode();

    for (const name of Object.keys(TONE_PRESETS) as SoundEffectName[]) {
      if (loadedSounds[name]) continue;
      const uri = await getSoundUri(name);
      const { sound } = await av.Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: TONE_PRESETS[name].volume },
      );
      loadedSounds[name] = sound;
    }
  })().catch((error) => {
    preloadPromise = null;
    throw error;
  });

  return preloadPromise;
}

async function playEffect(name: SoundEffectName) {
  try {
    await preloadSoundEffects();
    const sound = loadedSounds[name];
    if (!sound) return;
    await sound.replayAsync();
  } catch {
    // Sound should never block the user flow.
  }
}

export function useSoundEffects() {
  useEffect(() => {
    void preloadSoundEffects().catch(() => {
      // Expo Go may not have native audio module; keep sounds optional.
    });
  }, []);

  return {
    playCorrect: () => playEffect('correct'),
    playWrong: () => playEffect('wrong'),
    playComplete: () => playEffect('complete'),
  };
}

