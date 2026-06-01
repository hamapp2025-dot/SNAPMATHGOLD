#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, printSection, run, parseArgs } = require('./release-utils');

function writeCatalog() {
  run(
    'node',
    [
      '--input-type=module',
      '-e',
      `import { ALL_UNITS } from './src/data/grade12.ts';
import fs from 'fs';
const catalog = [];
for (const unit of ALL_UNITS) {
  for (const lesson of unit.lessons) {
    catalog.push({
      id: lesson.id,
      titleEn: lesson.titleEn,
      titleAr: lesson.titleAr,
      formula: lesson.keyFormulas[0]?.formula ?? lesson.titleEn,
      taglineEn: lesson.examples[0]?.answerEn ?? lesson.examples[0]?.answer ?? 'Jordan Grade 12 • Worked example • Practice',
      chips: ['Idea', 'Example', 'Practice'],
      videoId: lesson.videoId ?? null,
    });
  }
}
fs.writeFileSync('tools/lesson_hero_catalog.json', JSON.stringify(catalog, null, 2));
console.log('catalog lessons', catalog.length);`,
    ],
    { cwd: PROJECT_ROOT, stdio: 'inherit' },
  );
}

function countHeroAssets() {
  const dir = path.join(PROJECT_ROOT, 'assets/media/lessons');
  return fs.readdirSync(dir).filter((name) => name.endsWith('-hero.mp4')).length;
}

async function runLessonsPipeline(flags = {}) {
  printSection('Lessons Pipeline');

  writeCatalog();
  console.log('Updated tools/lesson_hero_catalog.json');

  if (flags['skip-heroes'] !== true) {
    run('python3', ['tools/generate_launch_media.py'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  } else {
    console.log('Skipping hero generation because --skip-heroes was provided.');
  }

  run('node', ['scripts/generate-lesson-media-overrides.js'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  const heroCount = countHeroAssets();
  console.log(`\nLessons pipeline complete. Hero MP4 files: ${heroCount}`);
}

if (require.main === module) {
  runLessonsPipeline(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(`\nLessons pipeline failed:\n${error.message}`);
    process.exit(1);
  });
}

module.exports = { runLessonsPipeline };
