# Release Automation

This repo now includes a first-pass iPhone/TestFlight automation flow so releases do not need to be assembled manually every time.

## Commands

### `npm run release:preflight`
Runs the local safety checks before an iOS release:

- verifies required release files exist
- checks `app.json`, `Info.plist`, and Xcode build numbers match
- checks `eas.json` has a production build profile and App Store Connect app ID
- validates `expo config`
- runs `npx tsc --noEmit`

Useful flags:

- `--allow-dirty` to continue even if git has local changes
- `--skip-typecheck` to skip TypeScript temporarily

Example:

```bash
npm run release:preflight -- --allow-dirty
```

### `npm run release:prepare-workdir`
Creates a clean temporary directory containing only the mobile app release surface.

This avoids uploading the whole repo to EAS when the repository also contains:

- screenshots
- old `.ipa` archives
- landing page files
- manim exports
- voice/media pipeline artifacts

The generated directory:

- copies the app build surface only
- writes `.release-source.json` metadata
- initializes a disposable git repo for EAS compatibility

Example:

```bash
npm run release:prepare-workdir
```

Optional:

```bash
npm run release:prepare-workdir -- --out /tmp/snapmath-ios-release
```

### `npm run release:ios`
Runs the full iOS release flow:

1. preflight
2. clean workdir creation
3. `eas build --platform ios --profile production`

Defaults:

- profile: `production`
- auto-submit: enabled
- non-interactive
- JSON output enabled
- does not wait for the full remote build unless requested

Useful flags:

- `--allow-dirty`
- `--skip-preflight`
- `--wait`
- `--no-auto-submit`
- `--profile production`
- `--what-to-test "..." ` (ignored automatically when auto-submit is enabled, because current Expo plan rejects changelog-based scheduling)
- `--message "..." `
- `--dry-run`

Examples:

```bash
npm run release:ios -- --allow-dirty
```

```bash
npm run release:ios -- --wait --what-to-test "Focus on the Unit 1 lesson to drill path."
```

```bash
npm run release:ios -- --dry-run
```

### `npm run release:status`
Shows the latest iOS EAS build, or a specific build if you provide one, with a release-operator summary:

- build/profile/distribution/version details
- queue/build timing
- Expo build, IPA, and log links
- App Store Connect / TestFlight fallback links
- a manual `eas submit` command when the build is ready for store submission

Important note:

- `release:status` uses the locally authenticated Expo CLI session to query Expo submission records directly
- App Store Connect / TestFlight processing still ultimately needs Apple-side verification
- if you know a submission ID, pass it with `--submission` to get exact Expo-side submission status and error details

Examples:

```bash
npm run release:status
```

```bash
npm run release:status -- --build 6485c79c-4285-49c2-8ef9-5440e3651917
```

```bash
npm run release:status -- --submission 25a3835f-6a57-4ebc-af76-bebe87814101
```

JSON output for wrappers or CI notes:

```bash
npm run release:status -- --json
```

```bash
npm run release:status -- --json --submission 25a3835f-6a57-4ebc-af76-bebe87814101
```

Open the most useful browser pages directly:

```bash
npm run release:status -- --open all
```

```bash
npm run release:status -- --open testflight
```

### `npm run release:simulator-smoke`
Runs a scripted iPhone simulator pass across the strongest demo route and saves screenshots plus a manifest.

By default it:

1. boots `iPhone 16e`
2. reinstalls / reopens the app with `npm run ios`
3. walks the demo route in a fixed order
4. saves screenshots and `smoke-manifest.json` to a temporary folder

Current smoke route set:

- home
- curriculum
- unit 1 path entry
- `u1-l1` lesson entry
- lesson summary
- practice handoff
- review drill handoff
- profile
- subscription
- support
- AI chat

Examples:

```bash
npm run release:simulator-smoke
```

If the app is already installed and open:

```bash
npm run release:simulator-smoke -- --no-install
```

Custom output folder:

```bash
npm run release:simulator-smoke -- --out /tmp/snapmath-smoke
```

Slow the capture down if the simulator needs more settle time:

```bash
npm run release:simulator-smoke -- --no-install --settle-ms 4000
```

## Why This Exists

This release workflow is built around a curated allowlist of mobile app files instead of trying to upload the entire repo. That keeps iOS/TestFlight builds from getting blocked by unrelated tracked artifacts.

## Current Scope

This automation currently handles:

- iOS preflight checks
- temporary release workdir generation
- EAS build submission
- build status checks with App Store Connect fallback guidance
- simulator smoke capture

## GitHub Actions

The repo now includes two workflows:

### `.github/workflows/ci.yml`
Runs automatically on push and pull request.

It currently:

- installs root dependencies
- installs `landing-page` dependencies
- runs `npm run release:preflight`
- runs `npm run check:landing`

This keeps the mobile app release surface and landing page validated together.

### `.github/workflows/ios-release.yml`
Runs manually from GitHub Actions with **Run workflow**.

It:

- installs dependencies
- requires an `EXPO_TOKEN` repository secret
- calls the same repo-level `release:ios` automation used locally

### Required secret

Add this GitHub repository secret:

- `EXPO_TOKEN`

That token must belong to the Expo account that owns the project:

- owner: `zamza`
- project: `hamza-academy`

## Good Next Steps

If you want to automate even more, the next additions should be:

1. automatic release note generation from git commits
2. true App Store Connect/TestFlight API polling after submit
3. a Cursor skill or MCP wrapper that turns the whole flow into one agent task
