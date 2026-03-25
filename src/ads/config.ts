import { RewardConfig, RewardedPlacement, InterstitialGating } from './types';

export const AD_PLACEMENTS: Record<RewardedPlacement, RewardConfig> = {
  boost_2x_main: {
    placement: 'boost_2x_main',
    multiplier: 2,
    durationMs: 30_000,
    cooldownMs: 15_000,
    coinBonus: 0,
  },
  session_end_bonus: {
    placement: 'session_end_bonus',
    multiplier: 1,
    durationMs: 0,
    cooldownMs: 0,
    coinBonus: 0, // computed dynamically: 25% of session earnings
  },
  upgrade_rescue: {
    placement: 'upgrade_rescue',
    multiplier: 1,
    durationMs: 0,
    cooldownMs: 0,
    coinBonus: 0, // computed dynamically: gap to next upgrade
  },
  jackpot_bonus: {
    placement: 'jackpot_bonus',
    multiplier: 2,
    durationMs: 30_000,
    cooldownMs: 15_000,
    coinBonus: 0,
  },
  daily_bonus_optional: {
    placement: 'daily_bonus_optional',
    multiplier: 2,
    durationMs: 0,
    cooldownMs: 0,
    coinBonus: 0,
  },
};

export const INTERSTITIAL_GATING: InterstitialGating = {
  minSecondsBetween: 180,
  minRoundsSinceLast: 3,
  firstSessionProtected: true,
  minSessionLengthSec: 60,
};

const TEST_IDS = {
  ios: {
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
  },
  android: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
};

/** Production ad unit IDs — set via environment variables or replace inline.
 *  Create ad units at https://admob.google.com → Apps → Ad units.
 *
 *  Environment variables (in .env.production):
 *    VITE_ADMOB_IOS_REWARDED=ca-app-pub-XXXX/XXXX
 *    VITE_ADMOB_IOS_INTERSTITIAL=ca-app-pub-XXXX/XXXX
 *    VITE_ADMOB_ANDROID_REWARDED=ca-app-pub-XXXX/XXXX
 *    VITE_ADMOB_ANDROID_INTERSTITIAL=ca-app-pub-XXXX/XXXX
 *    VITE_ADMOB_APP_ID_IOS=ca-app-pub-XXXX~XXXX
 *    VITE_ADMOB_APP_ID_ANDROID=ca-app-pub-XXXX~XXXX
 */
const PRODUCTION_IDS = {
  ios: {
    rewarded: import.meta.env.VITE_ADMOB_IOS_REWARDED ?? 'ca-app-pub-XXXXX/XXXXX',
    interstitial: import.meta.env.VITE_ADMOB_IOS_INTERSTITIAL ?? 'ca-app-pub-XXXXX/XXXXX',
  },
  android: {
    rewarded: import.meta.env.VITE_ADMOB_ANDROID_REWARDED ?? 'ca-app-pub-XXXXX/XXXXX',
    interstitial: import.meta.env.VITE_ADMOB_ANDROID_INTERSTITIAL ?? 'ca-app-pub-XXXXX/XXXXX',
  },
};

/** true when running `vite build` (production mode). Controls which ad unit
 *  IDs are used and whether AdMob initializes in testing mode. */
export const AD_PRODUCTION = import.meta.env.PROD;

export const ADMOB_IDS = AD_PRODUCTION ? PRODUCTION_IDS : TEST_IDS;

export const ADMOB_APP_IDS = {
  ios: import.meta.env.VITE_ADMOB_APP_ID_IOS ?? 'ca-app-pub-XXXXX~XXXXX',
  android: import.meta.env.VITE_ADMOB_APP_ID_ANDROID ?? 'ca-app-pub-XXXXX~XXXXX',
};

function hasPlaceholder(id: string): boolean {
  return id.includes('XXXXX');
}

export function validateAdIds(platform: 'ios' | 'android'): void {
  if (!AD_PRODUCTION) return;
  const ids = ADMOB_IDS[platform];
  const appId = ADMOB_APP_IDS[platform];
  const warnings: string[] = [];
  if (hasPlaceholder(ids.rewarded)) warnings.push(`${platform} rewarded ad ID`);
  if (hasPlaceholder(ids.interstitial)) warnings.push(`${platform} interstitial ad ID`);
  if (hasPlaceholder(appId)) warnings.push(`${platform} AdMob app ID`);
  if (warnings.length > 0) {
    console.error(
      `[AdMob] PRODUCTION BUILD with placeholder IDs! Replace: ${warnings.join(', ')}. ` +
      `Set VITE_ADMOB_* env vars in .env.production or update src/ads/config.ts.`
    );
  }
}
