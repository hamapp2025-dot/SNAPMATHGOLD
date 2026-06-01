#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ROOT_NODE_MODULES, parseArgs, run, runJson, readJson, printSection } = require('./release-utils');

const EXPO_STATE_PATH = path.join(process.env.HOME || '', '.expo', 'state.json');
const GLOBAL_EAS_BUILD_PATH = '/usr/local/lib/node_modules/eas-cli/build';
const SUBMISSION_CAPABILITY_NOTE = 'release:status can query Expo submission records directly when the local Expo CLI session is authenticated, but App Store Connect/TestFlight processing still ultimately needs Apple-side verification.';

function formatDate(value) {
  if (!value) return 'n/a';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) return 'n/a';

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

function buildExpoBuildUrl(build) {
  const owner = build?.project?.ownerAccount?.name;
  const slug = build?.project?.slug;
  if (!owner || !slug || !build?.id) return null;

  return `https://expo.dev/accounts/${owner}/projects/${slug}/builds/${build.id}`;
}

function buildExpoSubmissionUrl(submission) {
  const owner = submission?.app?.ownerAccount?.name;
  const slug = submission?.app?.slug;
  if (!owner || !slug || !submission?.id) return null;

  return `https://expo.dev/accounts/${owner}/projects/${slug}/submissions/${submission.id}`;
}

function getAscLinks() {
  const easJson = readJson('eas.json');
  const ascAppId = easJson?.submit?.production?.ios?.ascAppId;

  if (!ascAppId) {
    return {
      ascAppId: null,
      appStoreConnectUrl: null,
      testFlightUrl: null,
    };
  }

  return {
    ascAppId: String(ascAppId),
    appStoreConnectUrl: `https://appstoreconnect.apple.com/apps/${ascAppId}`,
    testFlightUrl: `https://appstoreconnect.apple.com/apps/${ascAppId}/testflight/ios`,
  };
}

function fetchBuild(flags, env) {
  if (flags.build) {
    return runJson('npx', ['eas', 'build:view', String(flags.build), '--json'], { env });
  }

  const limit = Number(flags.limit || 1);
  const builds = runJson('npx', ['eas', 'build:list', '--platform', 'ios', '--limit', String(limit), '--json', '--non-interactive'], { env });
  const latestBuild = Array.isArray(builds) ? builds[0] : builds;

  if (!latestBuild) {
    throw new Error('No iOS builds were returned by EAS.');
  }

  return latestBuild;
}

function getExpoSessionSecret() {
  if (!fs.existsSync(EXPO_STATE_PATH)) return null;

  try {
    const state = JSON.parse(fs.readFileSync(EXPO_STATE_PATH, 'utf8'));
    return state?.auth?.sessionSecret ?? null;
  } catch {
    return null;
  }
}

function fetchSubmissionContext(flags, build) {
  const sessionSecret = getExpoSessionSecret();
  if (!sessionSecret) {
    return {
      mode: 'unavailable',
      note: 'Expo CLI is not authenticated locally, so submission records cannot be queried from release:status.',
      recent: [],
      target: null,
    };
  }

  try {
    const { createGraphqlClient } = require(`${GLOBAL_EAS_BUILD_PATH}/commandUtils/context/contextUtils/createGraphqlClient.js`);
    const { SubmissionQuery } = require(`${GLOBAL_EAS_BUILD_PATH}/graphql/queries/SubmissionQuery.js`);
    const client = createGraphqlClient({ accessToken: null, sessionSecret });

    let target = null;
    if (flags.submission) {
      target = SubmissionQuery.byIdAsync
        ? null
        : null;
    }

    return { mode: 'deferred', client, SubmissionQuery, target: flags.submission ?? null };
  } catch (error) {
    return {
      mode: 'unavailable',
      note: `Unable to load EAS submission query helpers: ${error.message}`,
      recent: [],
      target: null,
    };
  }
}

async function resolveSubmissionContext(flags, build) {
  const context = fetchSubmissionContext(flags, build);
  if (context.mode === 'unavailable') return context;

  const { client, SubmissionQuery } = context;

  try {
    const recent = await SubmissionQuery.allForAppAsync(client, build.project.id, {
      limit: Number(flags['submission-limit'] || 5),
      platform: 'IOS',
    });

    let target = null;
    if (flags.submission) {
      target = await SubmissionQuery.byIdAsync(client, String(flags.submission), { useCache: false });
    }

    return {
      mode: 'queried',
      note: SUBMISSION_CAPABILITY_NOTE,
      recent,
      target,
    };
  } catch (error) {
    return {
      mode: 'unavailable',
      note: `Expo submission query failed: ${error.message}`,
      recent: [],
      target: null,
    };
  }
}

function getOpenTargets(flags, links) {
  const openTargets = [];
  const openFlag = flags.open;

  if (openFlag === true || openFlag === 'all') {
    if (links.expoBuildUrl) openTargets.push(links.expoBuildUrl);
    if (links.testFlightUrl) openTargets.push(links.testFlightUrl);
  } else if (openFlag === 'build' && links.expoBuildUrl) {
    openTargets.push(links.expoBuildUrl);
  } else if ((openFlag === 'asc' || openFlag === 'testflight') && links.testFlightUrl) {
    openTargets.push(links.testFlightUrl);
  }

  if (flags['open-build'] && links.expoBuildUrl) {
    openTargets.push(links.expoBuildUrl);
  }

  if ((flags['open-asc'] || flags['open-testflight']) && links.testFlightUrl) {
    openTargets.push(links.testFlightUrl);
  }

  return [...new Set(openTargets)];
}

function openTargets(urls) {
  for (const url of urls) {
    run('open', [url], { stdio: 'pipe' });
  }
}

function inferSubmissionState(build, submissionContext) {
  const target = submissionContext?.target;
  if (target?.status) {
    if (target.status === 'FINISHED') {
      return `Submission ${target.id} finished successfully.`;
    }
    if (target.status === 'ERRORED') {
      return `Submission ${target.id} errored${target?.error?.errorCode ? ` (${target.error.errorCode})` : ''}.`;
    }
    return `Submission ${target.id} is currently ${target.status}.`;
  }

  const status = String(build?.status || 'UNKNOWN').toUpperCase();
  const distribution = String(build?.distribution || 'UNKNOWN').toUpperCase();

  if (status !== 'FINISHED') {
    return 'Build not finished yet, so submission/TestFlight processing is not expected to be complete.';
  }

  if (distribution !== 'STORE') {
    return 'This build is not a store distribution build, so TestFlight/App Store submission is not applicable.';
  }

  return 'Build finished and is eligible for App Store submission. If auto-submit was used, the submission may already be processing or complete, but this CLI cannot confirm that directly.';
}

function buildNextStepCommand(build) {
  if (!build?.id) return null;
  if (String(build?.status || '').toUpperCase() !== 'FINISHED') return null;
  if (String(build?.distribution || '').toUpperCase() !== 'STORE') return null;

  return `npx eas submit --platform ios --id ${build.id} --profile production --non-interactive --wait`;
}

function summarizeRecentSubmissions(submissions) {
  return (submissions || []).map((submission) => ({
    id: submission.id,
    status: submission.status,
    errorCode: submission?.error?.errorCode ?? null,
    errorMessage: submission?.error?.message ?? null,
    expoSubmissionUrl: buildExpoSubmissionUrl(submission),
  }));
}

function buildStatusPayload(build, submissionContext) {
  const ascLinks = getAscLinks();
  const expoBuildUrl = buildExpoBuildUrl(build);
  const nextStepCommand = buildNextStepCommand(build);
  const targetSubmission = submissionContext?.target
    ? {
        id: submissionContext.target.id,
        status: submissionContext.target.status,
        errorCode: submissionContext.target?.error?.errorCode ?? null,
        errorMessage: submissionContext.target?.error?.message ?? null,
        expoSubmissionUrl: buildExpoSubmissionUrl(submissionContext.target),
      }
    : null;

  return {
    build,
    links: {
      expoBuildUrl,
      appStoreConnectUrl: ascLinks.appStoreConnectUrl,
      testFlightUrl: ascLinks.testFlightUrl,
      applicationArchiveUrl: build?.artifacts?.applicationArchiveUrl ?? null,
      buildLogsUrl: build?.artifacts?.xcodeBuildLogsUrl ?? build?.logFiles?.[0] ?? null,
    },
    submission: {
      cliSupport: submissionContext?.mode ?? 'fallback-required',
      note: submissionContext?.note ?? SUBMISSION_CAPABILITY_NOTE,
      inferredState: inferSubmissionState(build, submissionContext),
      nextStepCommand,
      ascAppId: ascLinks.ascAppId,
      target: targetSubmission,
      recent: summarizeRecentSubmissions(submissionContext?.recent ?? []),
    },
  };
}

function printSummary(payload) {
  const { build, links, submission } = payload;

  console.log(`Build ID: ${build.id}`);
  console.log(`Status: ${build.status}`);
  console.log(`Platform: ${build.platform}`);
  console.log(`Profile: ${build.buildProfile || 'n/a'}`);
  console.log(`Distribution: ${build.distribution || 'n/a'}`);
  console.log(`Version: ${build.appVersion || 'n/a'} (${build.appBuildVersion || 'n/a'})`);
  console.log(`Actor: ${build?.initiatingActor?.displayName || 'n/a'}`);
  console.log(`Created: ${formatDate(build.createdAt)}`);
  console.log(`Updated: ${formatDate(build.updatedAt)}`);

  if (build.completedAt) {
    console.log(`Completed: ${formatDate(build.completedAt)}`);
  }

  if (build.expirationDate) {
    console.log(`Artifact expires: ${formatDate(build.expirationDate)}`);
  }

  if (build.metrics) {
    console.log(`Queue time: ${formatDuration(build.metrics.buildQueueTime)}`);
    console.log(`Wait time: ${formatDuration(build.metrics.buildWaitTime)}`);
    console.log(`Build duration: ${formatDuration(build.metrics.buildDuration)}`);
  }

  console.log('\nQuick links:');
  if (links.expoBuildUrl) console.log(`- Expo build page: ${links.expoBuildUrl}`);
  if (links.applicationArchiveUrl) console.log(`- IPA artifact: ${links.applicationArchiveUrl}`);
  if (links.buildLogsUrl) console.log(`- Build logs: ${links.buildLogsUrl}`);
  if (links.testFlightUrl) console.log(`- TestFlight page: ${links.testFlightUrl}`);
  if (links.appStoreConnectUrl) console.log(`- App Store Connect app: ${links.appStoreConnectUrl}`);

  console.log('\nSubmission / TestFlight:');
  console.log(`- ${submission.note}`);
  console.log(`- ${submission.inferredState}`);

  if (submission.target) {
    console.log(`- Submission ID: ${submission.target.id}`);
    console.log(`- Submission status: ${submission.target.status}`);
    if (submission.target.errorCode) {
      console.log(`- Submission error: ${submission.target.errorCode}`);
    }
    if (submission.target.errorMessage) {
      console.log(`- Submission message: ${submission.target.errorMessage}`);
    }
    if (submission.target.expoSubmissionUrl) {
      console.log(`- Expo submission page: ${submission.target.expoSubmissionUrl}`);
    }
  } else if (submission.recent.length > 0) {
    console.log('- Recent iOS submissions:');
    for (const recentSubmission of submission.recent) {
      console.log(`  • ${recentSubmission.id}: ${recentSubmission.status}${recentSubmission.errorCode ? ` (${recentSubmission.errorCode})` : ''}`);
    }
  }

  if (submission.nextStepCommand) {
    console.log(`- Submit manually if needed:\n  ${submission.nextStepCommand}`);
  } else {
    console.log('- No manual submit command suggested for the current build state.');
  }

  if (links.testFlightUrl) {
    console.log(`- Verify processing, tester availability, and build visibility here:\n  ${links.testFlightUrl}`);
  }
}

async function runReleaseStatus(flags = {}) {
  if (!flags.json) {
    printSection('Release Status');
  }

  const env = { NODE_PATH: ROOT_NODE_MODULES };
  const build = fetchBuild(flags, env);
  const submissionContext = await resolveSubmissionContext(flags, build);
  const payload = buildStatusPayload(build, submissionContext);

  const urlsToOpen = getOpenTargets(flags, payload.links);
  if (urlsToOpen.length > 0) {
    openTargets(urlsToOpen);
  }

  if (flags.json) {
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  printSummary(payload);
  return payload;
}

if (require.main === module) {
  runReleaseStatus(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(`\nRelease status check failed:\n${error.message}`);
    process.exit(1);
  });
}

module.exports = { runReleaseStatus, buildStatusPayload, buildExpoBuildUrl, inferSubmissionState };
