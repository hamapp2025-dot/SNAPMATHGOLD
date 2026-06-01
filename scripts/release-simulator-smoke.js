#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  PROJECT_ROOT,
  parseArgs,
  run,
  createTempReleaseDir,
  printSection,
} = require('./release-utils');
const {
  buildDevClientUrl,
  getLocalIp,
  isMetroRunning,
  waitForMetro,
} = require('./simulator-dev');

const DEFAULT_DEVICE = 'iPhone 16e';
const APP_BUNDLE_ID = 'com.hamzaacademy.app';
const APP_SCHEME = 'hamzaacademy';

const ROUTE_PRESETS = [
  {
    key: 'home',
    label: 'Home',
    url: `${APP_SCHEME}://`,
    screenshot: '01-home.png',
    settleMs: 3200,
  },
  {
    key: 'curriculum',
    label: 'Curriculum',
    url: `${APP_SCHEME}://curriculum`,
    screenshot: '02-curriculum.png',
  },
  {
    key: 'u1-path-entry',
    label: 'Unit 1 path entry',
    url: `${APP_SCHEME}://chapter?unitId=u1`,
    screenshot: '03-unit-1-path-entry.png',
  },
  {
    key: 'u1-l1-lesson',
    label: 'Unit 1 lesson',
    url: `${APP_SCHEME}://lesson-player?unitId=u1&lessonId=u1-l1`,
    screenshot: '04-u1-l1-lesson.png',
    settleMs: 3600,
  },
  {
    key: 'lesson-summary',
    label: 'Lesson summary',
    url: `${APP_SCHEME}://lesson-summary?lessonId=u1-l1&unitId=u1&xpEarned=50`,
    screenshot: '05-lesson-summary.png',
  },
  {
    key: 'practice-session',
    label: 'Practice handoff',
    url: `${APP_SCHEME}://practice-session?unitId=u1`,
    screenshot: '06-practice-session.png',
  },
  {
    key: 'review-drill',
    label: 'Review drill handoff',
    url: `${APP_SCHEME}://exam?examId=wb1-drill`,
    screenshot: '07-review-drill.png',
  },
  {
    key: 'profile',
    label: 'Profile',
    url: `${APP_SCHEME}://profile`,
    screenshot: '08-profile.png',
  },
  {
    key: 'subscription',
    label: 'Subscription',
    url: `${APP_SCHEME}://subscription`,
    screenshot: '09-subscription.png',
  },
  {
    key: 'support',
    label: 'Support',
    url: `${APP_SCHEME}://support`,
    screenshot: '10-support.png',
  },
  {
    key: 'ai-chat',
    label: 'AI chat',
    url: `${APP_SCHEME}://ai-chat`,
    screenshot: '11-ai-chat.png',
  },
];

const DEFAULT_SETTLE_MS = 2500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getInstalledAppPath(deviceName) {
  const result = run('xcrun', ['simctl', 'get_app_container', deviceName, APP_BUNDLE_ID], {
    stdio: 'pipe',
    allowFailure: true,
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

function ensureSimulatorBooted(deviceName) {
  run('open', ['-a', 'Simulator'], { stdio: 'pipe' });
  run('sh', ['-lc', `xcrun simctl boot ${JSON.stringify(deviceName)} >/dev/null 2>&1 || true`], {
    stdio: 'pipe',
  });
  run('xcrun', ['simctl', 'bootstatus', deviceName, '-b'], { stdio: 'inherit' });
}

async function launchInstalledApp(deviceName) {
  const installedAppPath = getInstalledAppPath(deviceName);

  if (!installedAppPath) {
    throw new Error(
      `App is not installed on ${deviceName}. Run without --no-install once so the simulator build is installed first.`
    );
  }

  await ensureMetroReady();

  const host = getLocalIp();
  run('xcrun', ['simctl', 'openurl', deviceName, buildDevClientUrl(host, deviceName)], {
    stdio: 'pipe',
  });
  await sleep(2500);
  run('xcrun', ['simctl', 'launch', deviceName, APP_BUNDLE_ID], {
    stdio: 'pipe',
    allowFailure: true,
  });
  await sleep(2000);
}

async function ensureMetroReady() {
  if (await isMetroRunning()) {
    console.log('Reusing existing Metro server.');
    return;
  }

  console.log('Starting Metro bundler for simulator smoke...');
  const { spawn } = require('child_process');
  const child = spawn('npx', ['expo', 'start', '--dev-client', '--port', '8081'], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: 'ignore',
    env: (() => {
      const env = { ...process.env };
      delete env.CI;
      return env;
    })(),
  });
  child.unref();
  await waitForMetro();
  console.log('Metro is ready.');
}

async function reinstallApp(deviceName) {
  run('npm', ['run', 'ios'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  await ensureMetroReady();

  const host = getLocalIp();
  run('xcrun', ['simctl', 'openurl', deviceName, buildDevClientUrl(host, deviceName)], {
    stdio: 'pipe',
  });
  await sleep(3000);
}

function writeManifest(outputDir, deviceName, routes) {
  const manifestPath = path.join(outputDir, 'smoke-manifest.json');
  const manifest = {
    generatedAt: new Date().toISOString(),
    routeSet: 'release-demo',
    deviceName,
    bundleId: APP_BUNDLE_ID,
    routes: routes.map((route) => ({
      key: route.key,
      label: route.label,
      url: route.url,
      screenshot: route.screenshot,
    })),
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function captureRoutes(deviceName, outputDir, routes, flags) {
  const settleMsOverride = flags['settle-ms'] ? Number(flags['settle-ms']) : null;

  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index];
    const settleMs = settleMsOverride || route.settleMs || DEFAULT_SETTLE_MS;

    console.log(`[${index + 1}/${routes.length}] ${route.label}`);
    run('xcrun', ['simctl', 'openurl', deviceName, route.url], { stdio: 'pipe' });
    await sleep(settleMs);
    run('xcrun', ['simctl', 'io', deviceName, 'screenshot', path.join(outputDir, route.screenshot)], {
      stdio: 'pipe',
    });
    console.log(`Captured ${route.key} -> ${path.join(outputDir, route.screenshot)}`);
  }
}

async function runSimulatorSmoke(flags = {}) {
  const deviceName = String(flags.device || DEFAULT_DEVICE);
  const outputDir = flags.out
    ? path.resolve(String(flags.out))
    : createTempReleaseDir('snapmath-simulator-smoke');

  fs.mkdirSync(outputDir, { recursive: true });

  printSection('Release Simulator Smoke');
  console.log(`Device: ${deviceName}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Route set: release-demo (${ROUTE_PRESETS.length} checkpoints)`);

  ensureSimulatorBooted(deviceName);

  if (flags.install !== false) {
    await reinstallApp(deviceName);
    await sleep(2000);
  } else {
    console.log('Skipping reinstall because --no-install was provided.');
    await launchInstalledApp(deviceName);
  }

  const manifestPath = writeManifest(outputDir, deviceName, ROUTE_PRESETS);
  await captureRoutes(deviceName, outputDir, ROUTE_PRESETS, flags);

  console.log(`\nSimulator smoke capture complete.\nManifest: ${manifestPath}`);
  return { deviceName, outputDir, manifestPath, routeCount: ROUTE_PRESETS.length };
}

if (require.main === module) {
  runSimulatorSmoke(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(`\nSimulator smoke failed:\n${error.message}`);
    process.exit(1);
  });
}

module.exports = { runSimulatorSmoke, ROUTE_PRESETS };
