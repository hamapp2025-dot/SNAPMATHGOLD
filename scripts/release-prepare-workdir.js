#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  PROJECT_ROOT,
  copyIntoReleaseDir,
  createTempReleaseDir,
  parseArgs,
  run,
  printSection,
} = require('./release-utils');

function writeReleaseMetadata(targetDir) {
  const head = run('git', ['rev-parse', 'HEAD'], { allowFailure: true });
  const status = run('git', ['status', '--short'], { allowFailure: true });

  const metadata = {
    sourceRoot: PROJECT_ROOT,
    head: head.status === 0 ? head.stdout.trim() : null,
    dirty: status.status === 0 ? status.stdout.trim().length > 0 : null,
    preparedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(targetDir, '.release-source.json'),
    JSON.stringify(metadata, null, 2) + '\n',
    'utf8'
  );
}

function initializeDisposableGitRepo(targetDir) {
  run('git', ['init'], { cwd: targetDir, stdio: 'pipe' });
  run('git', ['add', '.'], { cwd: targetDir, stdio: 'pipe' });
}

function prepareReleaseWorkdir(flags = {}) {
  const outputDir = flags.out ? path.resolve(flags.out) : createTempReleaseDir('snapmath-ios-release');

  fs.mkdirSync(outputDir, { recursive: true });
  copyIntoReleaseDir(outputDir);
  writeReleaseMetadata(outputDir);

  if (flags.git !== false) {
    initializeDisposableGitRepo(outputDir);
  }

  return outputDir;
}

if (require.main === module) {
  try {
    const flags = parseArgs(process.argv.slice(2));
    printSection('Prepare Release Workdir');
    const workdir = prepareReleaseWorkdir(flags);
    console.log(`Prepared clean iOS release workdir at:\n${workdir}`);
  } catch (error) {
    console.error(`\nFailed to prepare release workdir:\n${error.message}`);
    process.exit(1);
  }
}

module.exports = { prepareReleaseWorkdir };
