import { AdProvider, RewardedPlacement, InterstitialPlacement } from './types';
import { ADMOB_IDS } from './config';
import { adAnalytics } from './analytics';

export class AdMobProvider implements AdProvider {
  readonly name = 'AdMobProvider';
  private admob: any = null;
  private platform: 'ios' | 'android' = 'android';
  private readyMap: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    try {
      const { AdMob } = await import('@capacitor-community/admob');
      this.admob = AdMob;

      // Detect platform
      const { Capacitor } = await import('@capacitor/core');
      this.platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';

      await AdMob.initialize({ initializeForTesting: true });
      console.log('[AdMobProvider] Initialized');
    } catch (err) {
      console.warn('[AdMobProvider] Failed to initialize:', err);
      throw err;
    }
  }

  async loadRewarded(placement: RewardedPlacement): Promise<void> {
    if (!this.admob) return;
    adAnalytics.emit('ad_requested', placement, this.name);
    try {
      const adId = ADMOB_IDS[this.platform].rewarded;
      await this.admob.prepareRewardVideoAd({ adId });
      this.readyMap.set(placement, true);
      adAnalytics.emit('ad_loaded', placement, this.name);
    } catch (err: any) {
      adAnalytics.emit('ad_load_failed', placement, this.name, err?.message);
      throw err;
    }
  }

  async showRewarded(placement: RewardedPlacement): Promise<boolean> {
    if (!this.admob) return false;
    if (!this.readyMap.get(placement)) {
      await this.loadRewarded(placement);
    }
    try {
      adAnalytics.emit('ad_shown', placement, this.name);
      const result = await this.admob.showRewardVideoAd();
      this.readyMap.set(placement, false);
      if (result) {
        adAnalytics.emit('ad_reward_earned', placement, this.name);
      }
      adAnalytics.emit('ad_dismissed', placement, this.name);
      // Pre-load next
      this.loadRewarded(placement).catch(() => {});
      return true;
    } catch (err: any) {
      adAnalytics.emit('ad_show_failed', placement, this.name, err?.message);
      this.readyMap.set(placement, false);
      return false;
    }
  }

  async loadInterstitial(placement: InterstitialPlacement): Promise<void> {
    if (!this.admob) return;
    adAnalytics.emit('ad_requested', placement, this.name);
    try {
      const adId = ADMOB_IDS[this.platform].interstitial;
      await this.admob.prepareInterstitial({ adId });
      this.readyMap.set(placement, true);
      adAnalytics.emit('ad_loaded', placement, this.name);
    } catch (err: any) {
      adAnalytics.emit('ad_load_failed', placement, this.name, err?.message);
      throw err;
    }
  }

  async showInterstitial(placement: InterstitialPlacement): Promise<boolean> {
    if (!this.admob) return false;
    if (!this.readyMap.get(placement)) {
      await this.loadInterstitial(placement);
    }
    try {
      adAnalytics.emit('ad_shown', placement, this.name);
      adAnalytics.emit('ad_impression', placement, this.name);
      await this.admob.showInterstitial();
      this.readyMap.set(placement, false);
      adAnalytics.emit('ad_dismissed', placement, this.name);
      // Pre-load next
      this.loadInterstitial(placement).catch(() => {});
      return true;
    } catch (err: any) {
      adAnalytics.emit('ad_show_failed', placement, this.name, err?.message);
      this.readyMap.set(placement, false);
      return false;
    }
  }

  isReady(placement: RewardedPlacement | InterstitialPlacement): boolean {
    return this.readyMap.get(placement) ?? false;
  }

  dispose(): void {
    this.readyMap.clear();
  }
}
