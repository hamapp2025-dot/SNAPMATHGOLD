#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');
const { PROJECT_ROOT, printSection, run } = require('./release-utils');

function triggerDeployHook(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { method: 'POST' }, (response) => {
      response.resume();
      if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
        resolve(response.statusCode);
        return;
      }
      reject(new Error(`Deploy hook failed with status ${response.statusCode ?? 'unknown'}`));
    });
    request.on('error', reject);
    request.end();
  });
}

async function deployLanding() {
  printSection('Deploy Landing Page');

  run('npm', ['run', 'website:build'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });

  const outDir = path.join(PROJECT_ROOT, 'landing-page', 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error(`Expected static export at ${outDir}`);
  }

  const hook =
    process.env.RENDER_LANDING_DEPLOY_HOOK_URL?.trim() ||
    process.env.RENDER_DEPLOY_HOOK_URL?.trim() ||
    '';

  if (hook) {
    console.log('Triggering Render deploy hook...');
    const status = await triggerDeployHook(hook);
    console.log(`Deploy hook accepted (${status}).`);
    console.log('Site: https://snapmathacademy.com');
    return;
  }

  console.log('\nLanding page build is ready at landing-page/out');
  console.log('Render Blueprint service: snapmath-landing (static, publishPath=out)');
  console.log('Sync blueprint: https://dashboard.render.com/blueprints');
  console.log('Optional: set RENDER_LANDING_DEPLOY_HOOK_URL to auto-trigger deploys from this script.');
}

if (require.main === module) {
  deployLanding().catch((error) => {
    console.error(`\nLanding deploy failed:\n${error.message}`);
    process.exit(1);
  });
}

module.exports = { deployLanding };
