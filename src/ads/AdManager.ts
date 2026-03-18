import { Store } from '../game/state';
import { UPGRADES } from '../content/upgrades';
import { getUpgradeLevel } from '../game/progression';
import { getUpgradeCost } from '../game/economy';
import { CONFIG } from '../game/config';
import { AdProvider, IAdSystem, RewardedPlacement } from './types';
import { AD_PLACEMENTS, INTERSTITIAL_GATING } from './config';
import { StubProvider } from './StubProvider';
import { adAnalytics } from './analytics';

export class AdManager implements IAdSystem {
  private store: Store;
  private provider: AdProvider;

  // Active reward state
  private rewardActive = false;
  private rewardRemainingMs = 0;
  private rewardMultiplier = 1;

  // Cooldowns per placement
  private rewardCooldowns: Map<RewardedPlacement, number> = new Map();

  // Interstitial gating
  private lastInterstitialTime = 0;
  private roundsSinceInterstitial = 0;
  private sessionStartTime = Date.now();
  private isFirstSession = false;

  // Session tracking
  private sessionCoinsEarned = 0;

  // Error state
  private lastError: string | null = null;

  constructor(store: Store) {
    this.store = store;
    this.isFirstSession = store.state.sessionCount <= 1;
    // Default to stub; init() will try native
    this.provider = new StubProvider();
  }

  async init(): Promise<void> {
    // Try native AdMob first
    let useNative = false;
    try {
      const { Capacitor } = await import('@capacitor/core');
      useNative = Capacitor.isNativePlatform();
    } catch {
      // Not in Capacitor environment
    }

    if (useNative) {
      try {
        const { AdMobProvider } = await import('./AdMobProvider');
        const nativeProvider = new AdMobProvider();
        await nativeProvider.initialize();
        this.provider = nativeProvider;
      } catch (err) {
        console.warn('[AdManager] AdMob init failed, falling back to stub:', err);
        this.provider = new StubProvider();
      }
    }

    await this.provider.initialize();

    // Pre-load boost rewarded + session-end interstitial
    this.provider.loadRewarded('boost_2x_main').catch(() => {});
    this.provider.loadInterstitial('session_end').catch(() => {});
  }

  // --- Rewarded API ---

  canShowRewarded(placement: RewardedPlacement): boolean {
    // Can't show if a reward is currently active (for boost placements)
    if (this.rewardActive && (placement === 'boost_2x_main' || placement === 'jackpot_bonus')) {
      return false;
    }
    // Check cooldown
    const cooldownRemaining = this.rewardCooldowns.get(placement) ?? 0;
    if (cooldownRemaining > 0) return false;
    return true;
  }

  async showRewarded(placement: RewardedPlacement): Promise<boolean> {
    if (!this.canShowRewarded(placement)) {
      this.lastError = 'Ad unavailable, try again soon';
      return false;
    }

    try {
      const success = await this.provider.showRewarded(placement);
      if (!success) {
        this.lastError = 'Ad unavailable, try again soon';
        return false;
      }

      // Apply reward based on placement
      const config = AD_PLACEMENTS[placement];
      if (config.durationMs > 0 && config.multiplier > 1) {
        // Timed multiplier boost (boost_2x_main, jackpot_bonus)
        this.rewardActive = true;
        this.rewardMultiplier = config.multiplier;
        this.rewardRemainingMs = config.durationMs;
        this.store.update({
          adBoostActive: true,
          adBoostRemainingMs: this.rewardRemainingMs,
        });
      }

      // Set cooldown
      if (config.cooldownMs > 0) {
        this.rewardCooldowns.set(placement, config.cooldownMs);
      }

      this.lastError = null;
      return true;
    } catch (err: any) {
      this.lastError = 'Ad unavailable, try again soon';
      adAnalytics.emit('ad_show_failed', placement, this.provider.name, err?.message);
      return false;
    }
  }

  getLastError(): string | null {
    return this.lastError;
  }

  // --- Interstitial API ---

  shouldShowInterstitial(): boolean {
    if (this.isFirstSession && INTERSTITIAL_GATING.firstSessionProtected) return false;
    const sessionElapsed = (Date.now() - this.sessionStartTime) / 1000;
    if (sessionElapsed < INTERSTITIAL_GATING.minSessionLengthSec) return false;
    const timeSinceLast = (Date.now() - this.lastInterstitialTime) / 1000;
    if (timeSinceLast < INTERSTITIAL_GATING.minSecondsBetween) return false;
    if (this.roundsSinceInterstitial < INTERSTITIAL_GATING.minRoundsSinceLast) return false;
    return true;
  }

  async showInterstitial(): Promise<boolean> {
    try {
      const success = await this.provider.showInterstitial('session_end');
      if (success) {
        this.lastInterstitialTime = Date.now();
        this.roundsSinceInterstitial = 0;
        this.provider.loadInterstitial('session_end').catch(() => {});
      }
      return success;
    } catch {
      return false;
    }
  }

  // --- Tracking ---

  onSmash(): void {
    this.roundsSinceInterstitial++;
  }

  trackCoinsEarned(amount: number): void {
    this.sessionCoinsEarned += amount;
  }

  getSessionCoinsEarned(): number {
    return this.sessionCoinsEarned;
  }

  // --- Upgrade Rescue ---

  checkUpgradeRescue(): { needed: number; upgradeName: string } | null {
    for (const upgrade of UPGRADES) {
      const level = getUpgradeLevel(this.store, upgrade.id);
      if (level >= CONFIG.upgradeMaxLevel) continue;
      const cost = getUpgradeCost(level);
      const gap = cost - this.store.state.coins;
      if (gap > 0 && gap <= cost * 0.15) {
        return { needed: gap, upgradeName: upgrade.name };
      }
    }
    return null;
  }

  // --- Cooldown Info ---

  getBoostCooldownMs(): number {
    return this.rewardCooldowns.get('boost_2x_main') ?? 0;
  }

  // --- IAdSystem compat ---

  getRewardMultiplier(): number {
    return this.rewardActive ? this.rewardMultiplier : 1;
  }

  isRewardActive(): boolean {
    return this.rewardActive;
  }

  // --- Game Loop ---

  update(rawDt: number): void {
    const dtMs = rawDt * 1000;

    // Tick reward timer
    if (this.rewardActive) {
      this.rewardRemainingMs -= dtMs;
      if (this.rewardRemainingMs <= 0) {
        this.rewardRemainingMs = 0;
        this.rewardActive = false;
        this.rewardMultiplier = 1;
        this.store.update({
          adBoostActive: false,
          adBoostRemainingMs: 0,
          adBoostCooldownMs: this.getBoostCooldownMs(),
        });
        console.log('[AdManager] Reward boost expired');
      } else {
        this.store.update({
          adBoostRemainingMs: this.rewardRemainingMs,
        });
      }
    }

    // Tick cooldowns
    for (const [placement, remaining] of this.rewardCooldowns) {
      const next = remaining - dtMs;
      if (next <= 0) {
        this.rewardCooldowns.delete(placement);
      } else {
        this.rewardCooldowns.set(placement, next);
      }
    }

    // Update cooldown state for HUD
    this.store.update({
      adBoostCooldownMs: this.getBoostCooldownMs(),
    });
  }

  dispose(): void {
    this.provider.dispose();
  }
}
