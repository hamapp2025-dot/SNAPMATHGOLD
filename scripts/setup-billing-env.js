#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const apiKey = (process.argv[2] || process.env.REVENUECAT_IOS_API_KEY || '').trim();

if (!apiKey) {
  console.error('Usage: npm run billing:setup -- appl_xxxxxxxxxxxxxxxx');
  console.error('Or set REVENUECAT_IOS_API_KEY in the environment first.');
  process.exit(1);
}

if (!apiKey.startsWith('appl_')) {
  console.error('Expected a RevenueCat iOS public SDK key starting with appl_.');
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Creating production EAS env var REVENUECAT_IOS_API_KEY...');
run('npx', [
  'eas',
  'env:create',
  '--name',
  'REVENUECAT_IOS_API_KEY',
  '--value',
  apiKey,
  '--environment',
  'production',
  '--visibility',
  'secret',
  '--force',
  '--non-interactive',
]);

console.log('\nBilling env ready. Next: npm run release:ios -- --no-wait');
