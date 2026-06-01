#!/usr/bin/env node

const path = require('path');
const {
  PROJECT_ROOT,
  ROOT_NODE_MODULES,
  REQUIRED_RELEASE_PATHS,
  fileExists,
  readJson,
  readText,
  run,
  parseArgs,
  printSection,
} = require('./release-utils');

function parseInfoPlistBuildNumber() {
  const infoPlist = readText('ios/SnapMathAcademy/Info.plist');
  const match = infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);
  return match ? match[1] : null;
}

function parseXcodeBuildNumber() {
  const pbxproj = readText('ios/SnapMathAcademy.xcodeproj/project.pbxproj');
  const match = pbxproj.match(/CURRENT_PROJECT_VERSION = ([^;]+);/);
  return match ? match[1].trim() : null;
}

function assertRequiredPaths() {
  const missing = REQUIRED_RELEASE_PATHS.filter((relativePath) => !fileExists(relativePath));
  if (missing.length > 0) {
    throw new Error(`Missing required release files:\n- ${missing.join('\n- ')}`);
  }
}

function checkGitState({ allowDirty }) {
  const status = run('git', ['status', '--short'], { allowFailure: true });
  if (status.status !== 0) {
    console.warn('Warning: unable to inspect git status. Continuing without git cleanliness check.');
    return;
  }

  const dirtyOutput = status.stdout.trim();
  if (dirtyOutput && !allowDirty) {
    throw new Error(
      'Git working tree is dirty. Commit or stash changes first, or rerun with --allow-dirty if that is intentional.'
    );
  }

  if (dirtyOutput && allowDirty) {
    console.warn('Warning: continuing with a dirty working tree because --allow-dirty was provided.');
  }
}

function checkConfigConsistency() {
  const appJson = readJson('app.json');
  const easJson = readJson('eas.json');

  const buildNumber = appJson?.expo?.ios?.buildNumber;
  const projectId = appJson?.expo?.extra?.eas?.projectId;
  const ascAppId = easJson?.submit?.production?.ios?.ascAppId;
  const hasProductionProfile = !!easJson?.build?.production;

  if (!buildNumber || !/^\d+$/.test(String(buildNumber))) {
    throw new Error('app.json must define a numeric expo.ios.buildNumber.');
  }

  if (!projectId) {
    throw new Error('app.json must define expo.extra.eas.projectId.');
  }

  if (!hasProductionProfile) {
    throw new Error('eas.json must define build.production.');
  }

  if (!ascAppId) {
    throw new Error('eas.json must define submit.production.ios.ascAppId.');
  }

  const plistBuildNumber = parseInfoPlistBuildNumber();
  const xcodeBuildNumber = parseXcodeBuildNumber();

  if (plistBuildNumber !== String(buildNumber)) {
    throw new Error(`Info.plist CFBundleVersion (${plistBuildNumber}) does not match app.json buildNumber (${buildNumber}).`);
  }

  if (xcodeBuildNumber !== String(buildNumber)) {
    throw new Error(`Xcode CURRENT_PROJECT_VERSION (${xcodeBuildNumber}) does not match app.json buildNumber (${buildNumber}).`);
  }

  const extra = appJson?.expo?.extra ?? {};
  const hasRevenueCatKeys = Boolean(extra.revenueCatIosApiKey && extra.revenueCatEntitlementId && extra.revenueCatOfferingId);
  const hasGoogleKeys = Boolean(extra.googleIosClientId && extra.googleWebClientId);

  if (!hasRevenueCatKeys && !extra.subscriptionPreviewTier) {
    throw new Error('RevenueCat is not configured, so app.json must keep extra.subscriptionPreviewTier for honest preview access.');
  }

  if (!hasRevenueCatKeys) {
    console.warn('Warning: RevenueCat keys are still blank; release flow will rely on preview access messaging.');
  }

  if (!hasGoogleKeys) {
    console.warn('Warning: Google sign-in keys are blank; release flow will rely on softened auth surfaces.');
  }
}

function runExpoConfigCheck() {
  run('npx', ['expo', 'config', '--json'], {
    env: { NODE_PATH: ROOT_NODE_MODULES },
    stdio: 'pipe',
  });
}

function runTypecheck() {
  run('npx', ['tsc', '--noEmit'], {
    env: { NODE_PATH: ROOT_NODE_MODULES },
    stdio: 'inherit',
  });
}

function runPreflight(flags = {}) {
  printSection('Release Preflight');
  console.log(`Project root: ${PROJECT_ROOT}`);

  assertRequiredPaths();
  checkGitState({ allowDirty: Boolean(flags['allow-dirty']) });
  checkConfigConsistency();
  runExpoConfigCheck();

  if (!flags['skip-typecheck']) {
    runTypecheck();
  } else {
    console.log('Skipping TypeScript check because --skip-typecheck was provided.');
  }

  console.log('\nRelease preflight passed.');
}

if (require.main === module) {
  try {
    runPreflight(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(`\nRelease preflight failed:\n${error.message}`);
    process.exit(1);
  }
}

module.exports = { runPreflight };
