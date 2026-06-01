#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const {
  PROJECT_ROOT,
  parseArgs,
  printSection,
  run,
} = require('./release-utils');

const DEFAULT_DEVICE = 'iPhone 16e';
const APP_BUNDLE_ID = 'com.hamzaacademy.app';
const APP_SCHEME = 'hamzaacademy';
const METRO_PORT = 8081;
const METRO_STATUS_URL = `http://127.0.0.1:${METRO_PORT}/status`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLocalIp() {
  const en0 = run('sh', ['-lc', 'ipconfig getifaddr en0 || true'], { stdio: 'pipe' }).stdout.trim();
  if (en0) return en0;
  const en1 = run('sh', ['-lc', 'ipconfig getifaddr en1 || true'], { stdio: 'pipe' }).stdout.trim();
  if (en1) return en1;
  return '127.0.0.1';
}

function isMetroRunning() {
  return new Promise((resolve) => {
    const request = http.get(METRO_STATUS_URL, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(1500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function waitForMetro(maxAttempts = 60) {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (await isMetroRunning()) {
        resolve(true);
        return;
      }
      await sleep(1000);
    }
    reject(new Error(`Metro did not become ready at ${METRO_STATUS_URL}`));
  });
}

function metroEnv() {
  const env = { ...process.env };
  delete env.CI;
  return env;
}

function startMetro({ clearCache = true } = {}) {
  const args = ['expo', 'start', '--dev-client', '--port', String(METRO_PORT)];
  if (clearCache) {
    args.push('--clear');
  }

  const child = spawn('npx', args, {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: 'ignore',
    env: metroEnv(),
  });
  child.unref();
  return child.pid;
}

function ensureSimulatorBooted(deviceName) {
  run('open', ['-a', 'Simulator'], { stdio: 'pipe' });
  run('sh', ['-lc', `xcrun simctl boot ${JSON.stringify(deviceName)} >/dev/null 2>&1 || true`], {
    stdio: 'pipe',
  });
  run('xcrun', ['simctl', 'bootstatus', deviceName, '-b'], { stdio: 'inherit' });
}

function getInstalledAppPath(deviceName) {
  const result = run('xcrun', ['simctl', 'get_app_container', deviceName, APP_BUNDLE_ID], {
    stdio: 'pipe',
    allowFailure: true,
  });
  return result.status === 0 ? result.stdout.trim() || null : null;
}

function buildDevClientUrl(host, deviceName) {
  const metroHost = deviceName ? '127.0.0.1' : host;
  const bundleUrl = encodeURIComponent(`http://${metroHost}:${METRO_PORT}`);
  return `${APP_SCHEME}://expo-development-client/?url=${bundleUrl}`;
}

async function runSimulatorDev(flags = {}) {
  const deviceName = String(flags.device || DEFAULT_DEVICE);
  const host = getLocalIp();

  printSection('Simulator Dev');
  console.log(`Device: ${deviceName}`);
  console.log(`Metro: http://${host}:${METRO_PORT}`);

  ensureSimulatorBooted(deviceName);

  const installed = getInstalledAppPath(deviceName);
  if (!installed && flags.build !== false) {
    console.log('Dev build not found on simulator. Running native install (first time can take several minutes)...');
    run('npx', ['expo', 'run:ios', '--device', deviceName], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
  } else if (!installed) {
    throw new Error(
      `App is not installed on ${deviceName}. Re-run without --no-build or run: npm run ios`,
    );
  }

  const metroAlreadyRunning = await isMetroRunning();
  if (!metroAlreadyRunning) {
    console.log('Starting Metro bundler...');
    startMetro({ clearCache: true });
    await waitForMetro();
    console.log('Metro is ready.');
  } else {
    console.log('Restarting Metro with cleared cache...');
    run('sh', ['-lc', `lsof -ti tcp:${METRO_PORT} | xargs kill -9 2>/dev/null || true`], {
      stdio: 'pipe',
    });
    await sleep(1000);
    startMetro({ clearCache: true });
    await waitForMetro();
    console.log('Metro is ready.');
  }

  const devClientUrl = buildDevClientUrl(host, deviceName);
  run('xcrun', ['simctl', 'openurl', deviceName, devClientUrl], { stdio: 'pipe' });
  await sleep(2500);
  run('xcrun', ['simctl', 'launch', deviceName, APP_BUNDLE_ID], {
    stdio: 'pipe',
    allowFailure: true,
  });

  console.log(`\nSimulator ready.\nDev URL: ${devClientUrl}`);
  console.log('If the red screen persists, press Cmd+R in the simulator to reload.');
}

if (require.main === module) {
  runSimulatorDev(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(`\nSimulator dev failed:\n${error.message}`);
    process.exit(1);
  });
}

module.exports = { runSimulatorDev, buildDevClientUrl, getLocalIp, isMetroRunning, waitForMetro };
