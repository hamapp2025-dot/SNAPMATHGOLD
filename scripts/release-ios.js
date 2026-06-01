#!/usr/bin/env node

const { ROOT_NODE_MODULES, parseArgs, printSection, run } = require('./release-utils');
const { runPreflight } = require('./release-preflight');
const { prepareReleaseWorkdir } = require('./release-prepare-workdir');

function buildEasArgs(flags) {
  const args = ['eas', 'build', '--platform', 'ios', '--profile', String(flags.profile || 'production'), '--json', '--non-interactive'];
  const autoSubmitEnabled = flags['auto-submit'] !== false;

  if (flags.wait === false) {
    args.push('--no-wait');
  }

  if (autoSubmitEnabled) {
    args.push('--auto-submit');
  }

  if (flags['what-to-test'] && !autoSubmitEnabled) {
    args.push('--what-to-test', String(flags['what-to-test']));
  }

  if (flags.message) {
    args.push('--message', String(flags.message));
  }

  return args;
}

function runRelease(flags = {}) {
  printSection('Release iOS');

  if (!flags['skip-preflight']) {
    runPreflight(flags);
  } else {
    console.log('Skipping preflight because --skip-preflight was provided.');
  }

  const workdir = prepareReleaseWorkdir(flags);
  console.log(`Prepared EAS upload workdir:\n${workdir}`);

  if (flags['what-to-test'] && flags['auto-submit'] !== false) {
    console.log(
      'Ignoring --what-to-test for auto-submit because this Expo plan rejects changelog-based scheduling. Add tester notes later in App Store Connect if needed.'
    );
  }

  const easArgs = buildEasArgs(flags);
  const env = { NODE_PATH: ROOT_NODE_MODULES };

  if (flags['dry-run']) {
    console.log('\nDry run only. EAS build command:');
    console.log(`npx ${easArgs.join(' ')}`);
    return { workdir, command: ['npx', ...easArgs] };
  }

  run('npx', easArgs, {
    cwd: workdir,
    env,
    stdio: 'inherit',
  });

  console.log(`\nEAS build triggered from:\n${workdir}`);
  return { workdir };
}

if (require.main === module) {
  try {
    runRelease(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(`\nRelease iOS failed:\n${error.message}`);
    process.exit(1);
  }
}

module.exports = { runRelease };
