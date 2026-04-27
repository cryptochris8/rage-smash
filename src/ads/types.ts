export type RewardedPlacement =
  | 'boost_2x_main'
  | 'session_end_bonus'
  | 'upgrade_rescue'
  | 'jackpot_bonus'
  | 'daily_bonus_optional';

export type InterstitialPlacement = 'session_end';

export interface RewardConfig {
  placement: RewardedPlacement;
  multiplier: number;
  durationMs: number;
  cooldownMs: number;
  /** If > 0, grants flat coins instead of multiplier */
  coinBonus: number;
}

export interface InterstitialGating {
  minSecondsBetween: number;
  minRoundsSinceLast: number;
  firstSessionProtected: boolean;
  minSessionLengthSec: number;
  /** Minimum gap between ANY two ad surfaces (rewarded + interstitial),
   *  in milliseconds. Layered on top of per-placement cooldowns to
   *  prevent back-to-back ad sequences (e.g., overcharge interstitial
   *  immediately followed by session-end-bonus rewarded prompt). */
  minGlobalGapMs: number;
}

export type AdEventType =
  | 'ad_requested'
  | 'ad_loaded'
  | 'ad_load_failed'
  | 'ad_shown'
  | 'ad_show_failed'
  | 'ad_reward_earned'
  | 'ad_dismissed'
  | 'ad_impression';

export interface AdEvent {
  type: AdEventType;
  placement: string;
  provider: string;
  error?: string;
  timestamp: number;
}

export interface AdProvider {
  readonly name: string;
  initialize(): Promise<void>;
  loadRewarded(placement: RewardedPlacement): Promise<void>;
  showRewarded(placement: RewardedPlacement): Promise<boolean>;
  loadInterstitial(placement: InterstitialPlacement): Promise<void>;
  showInterstitial(placement: InterstitialPlacement): Promise<boolean>;
  isReady(placement: RewardedPlacement | InterstitialPlacement): boolean;
  dispose(): void;
}

/** Backward-compatible interface consumed by SmashSystem */
export interface IAdSystem {
  getRewardMultiplier(): number;
  isRewardActive(): boolean;
}
