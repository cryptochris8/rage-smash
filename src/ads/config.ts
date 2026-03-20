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

// ⚠️  Replace these with your real AdMob ad unit IDs from https://admob.google.com
const PRODUCTION_IDS = {
  ios: {
    rewarded: 'ca-app-pub-XXXXX/XXXXX',       // TODO: replace before release
    interstitial: 'ca-app-pub-XXXXX/XXXXX',    // TODO: replace before release
  },
  android: {
    rewarded: 'ca-app-pub-XXXXX/XXXXX',        // TODO: replace before release
    interstitial: 'ca-app-pub-XXXXX/XXXXX',    // TODO: replace before release
  },
};

/** Set to true for production builds. Controls which ad unit IDs are used
 *  and whether AdMob initializes in testing mode. */
export const AD_PRODUCTION = false; // TODO: flip to true before release

export const ADMOB_IDS = AD_PRODUCTION ? PRODUCTION_IDS : TEST_IDS;
