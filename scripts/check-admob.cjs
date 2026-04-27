#!/usr/bin/env node
/**
 * Verify AdMob credentials are not placeholders before a release.
 *
 * Exits non-zero if any of the following are placeholders (contain 'XXXXX'):
 *   - .env.production VITE_ADMOB_* values for the requested platform
 *   - android/app/src/main/AndroidManifest.xml meta-data app ID (if not
 *     using the ${admobAppId} placeholder substitution path)
 *
 * Usage:
 *   node scripts/check-admob.cjs            # check both ios and android
 *   node scripts/check-admob.cjs ios        # check ios only
 *   node scripts/check-admob.cjs android    # check android only
 *
 * This is intended for CI before a release build (Codemagic / Play Store
 * upload steps), NOT for every npm run build — local dev without real
 * Android credentials would fail otherwise. The Gradle release build has
 * its own hard-fail for Android via android/app/build.gradle.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(REPO_ROOT, '.env.production');
const ANDROID_MANIFEST = path.join(REPO_ROOT, 'android/app/src/main/AndroidManifest.xml');

const PLATFORM_ARG = process.argv[2];
const platforms = PLATFORM_ARG ? [PLATFORM_ARG] : ['ios', 'android'];

const PLATFORM_KEYS = {
  ios: ['VITE_ADMOB_APP_ID_IOS', 'VITE_ADMOB_IOS_REWARDED', 'VITE_ADMOB_IOS_INTERSTITIAL'],
  android: ['VITE_ADMOB_APP_ID_ANDROID', 'VITE_ADMOB_ANDROID_REWARDED', 'VITE_ADMOB_ANDROID_INTERSTITIAL'],
};

function hasPlaceholder(s) {
  return typeof s === 'string' && s.includes('XXXXX');
}

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2];
  }
  return out;
}

const failures = [];
const env = parseEnv(ENV_FILE);

for (const platform of platforms) {
  const keys = PLATFORM_KEYS[platform];
  if (!keys) {
    console.error(`Unknown platform: ${platform}`);
    process.exit(2);
  }
  for (const key of keys) {
    const fromEnvVar = process.env[key];
    const fromEnvFile = env[key];
    const value = fromEnvVar || fromEnvFile;
    if (!value || hasPlaceholder(value)) {
      failures.push(`${platform}: ${key} is missing or contains XXXXX placeholder`);
    }
  }
}

if (platforms.includes('android')) {
  if (fs.existsSync(ANDROID_MANIFEST)) {
    const manifest = fs.readFileSync(ANDROID_MANIFEST, 'utf8');
    const appIdMatch = manifest.match(/com\.google\.android\.gms\.ads\.APPLICATION_ID[\s\S]*?android:value="([^"]+)"/);
    if (appIdMatch) {
      const v = appIdMatch[1];
      if (v.includes('XXXXX')) {
        failures.push(`android: AndroidManifest.xml has hardcoded placeholder app ID (${v})`);
      }
      // Note: ${admobAppId} placeholder is fine — Gradle substitutes it at build time
      // and has its own placeholder check in android/app/build.gradle release block.
    }
  }
}

if (failures.length > 0) {
  console.error('\n[check-admob] ❌ Placeholder credentials detected:\n');
  for (const f of failures) console.error('  - ' + f);
  console.error(
    '\nFix: set the missing VITE_ADMOB_* values in .env.production OR pass them ' +
    'as environment variables in your CI step. For Android, also set the Gradle ' +
    'property ADMOB_APP_ID_ANDROID (or env var of the same name).\n'
  );
  process.exit(1);
}

console.log(`[check-admob] ✅ ${platforms.join(', ')} credentials look real (no XXXXX placeholders).`);
