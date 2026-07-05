#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ROOT_NODE_MODULES = path.join(PROJECT_ROOT, 'node_modules');

const RELEASE_DIRECTORIES = [
  'app',
  'assets',
  'components',
  'ios',
  'src',
];

const RELEASE_FILES = [
  '.easignore',
  '.gitignore',
  'app.config.js',
  'app.json',
  'eas.json',
  'expo-env.d.ts',
  'firebaseConfig.js',
  'metro.config.js',
  'package-lock.json',
  'package.json',
  'tsconfig.json',
];

const REQUIRED_RELEASE_PATHS = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/(tabs)/curriculum.tsx',
  'app/lesson-summary.tsx',
  'app/practice-session.tsx',
  'app/subscription.tsx',
  'assets/media/founder/founder-intro-v3.mp4',
  'assets/media/lessons/u1-l1-hero-subtitled-voiced.mp4',
  'assets/media/lessons/u1-l1-poster.jpg',
  'ios/SnapMathAcademy/Info.plist',
  'src/media/founderMedia.ts',
  'src/media/lessonMedia.ts',
];

function resolveProjectPath(relativePath) {
  return path.join(PROJECT_ROOT, relativePath);
}

function fileExists(relativePath) {
  return fs.existsSync(resolveProjectPath(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(resolveProjectPath(relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(resolveProjectPath(relativePath), 'utf8');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? PROJECT_ROOT,
    env: { ...process.env, ...(options.env ?? {}) },
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
  });

  if (options.allowFailure) {
    return result;
  }

  if (result.status !== 0) {
    const rendered = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(rendered || `${command} ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
  }

  return result;
}

function stripAnsi(text) {
  return String(text ?? '').replace(/\u001B\[[0-9;]*m/g, '');
}

function extractJsonPayload(text) {
  const cleanText = stripAnsi(text).trim();
  const objectStart = cleanText.indexOf('{');
  const arrayStart = cleanText.indexOf('[');
  const startCandidates = [objectStart, arrayStart].filter((index) => index >= 0);

  if (startCandidates.length === 0) {
    throw new Error(`Unable to find JSON payload in command output:\n${cleanText || '(empty output)'}`);
  }

  const startIndex = Math.min(...startCandidates);
  const openChar = cleanText[startIndex];
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = startIndex; index < cleanText.length; index += 1) {
    const char = cleanText[index];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return cleanText.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error(`Unable to extract a complete JSON payload from command output:\n${cleanText}`);
}

function runJson(command, args, options = {}) {
  const result = run(command, args, {
    ...options,
    stdio: 'pipe',
  });

  const mixedOutput = [result.stdout, result.stderr].filter(Boolean).join('\n');
  return JSON.parse(extractJsonPayload(mixedOutput));
}

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    if (key.startsWith('no-')) {
      flags[key.slice(3)] = false;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      index += 1;
      continue;
    }

    flags[key] = true;
  }
  return flags;
}

function createTempReleaseDir(prefix = 'snapmath-release') {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

function copyIntoReleaseDir(targetDir) {
  for (const relativePath of RELEASE_DIRECTORIES) {
    const sourcePath = resolveProjectPath(relativePath);
    if (!fs.existsSync(sourcePath)) continue;
    fs.cpSync(sourcePath, path.join(targetDir, relativePath), { recursive: true });
  }

  for (const relativePath of RELEASE_FILES) {
    const sourcePath = resolveProjectPath(relativePath);
    if (!fs.existsSync(sourcePath)) continue;
    fs.cpSync(sourcePath, path.join(targetDir, relativePath));
  }
}

function printSection(title) {
  console.log(`\n== ${title} ==`);
}

module.exports = {
  PROJECT_ROOT,
  ROOT_NODE_MODULES,
  RELEASE_DIRECTORIES,
  RELEASE_FILES,
  REQUIRED_RELEASE_PATHS,
  resolveProjectPath,
  fileExists,
  readJson,
  readText,
  run,
  runJson,
  parseArgs,
  createTempReleaseDir,
  copyIntoReleaseDir,
  printSection,
  stripAnsi,
  extractJsonPayload,
};
