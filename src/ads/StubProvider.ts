import { AdProvider, RewardedPlacement, InterstitialPlacement } from './types';
import { adAnalytics } from './analytics';

export class StubProvider implements AdProvider {
  readonly name = 'StubProvider';
  private readyMap: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    console.log('[StubProvider] Initialized (web/dev fallback)');
  }

  async loadRewarded(placement: RewardedPlacement): Promise<void> {
    adAnalytics.emit('ad_requested', placement, this.name);
    await this.delay(300);
    this.readyMap.set(placement, true);
    adAnalytics.emit('ad_loaded', placement, this.name);
  }

  async showRewarded(placement: RewardedPlacement): Promise<boolean> {
    if (!this.readyMap.get(placement)) {
      await this.loadRewarded(placement);
    }
    adAnalytics.emit('ad_shown', placement, this.name);
    this.readyMap.set(placement, false);
    await this.delay(1500);
    adAnalytics.emit('ad_reward_earned', placement, this.name);
    adAnalytics.emit('ad_dismissed', placement, this.name);
    // Pre-load next
    this.loadRewarded(placement);
    return true;
  }

  async loadInterstitial(placement: InterstitialPlacement): Promise<void> {
    adAnalytics.emit('ad_requested', placement, this.name);
    await this.delay(300);
    this.readyMap.set(placement, true);
    adAnalytics.emit('ad_loaded', placement, this.name);
  }

  async showInterstitial(placement: InterstitialPlacement): Promise<boolean> {
    if (!this.readyMap.get(placement)) {
      await this.loadInterstitial(placement);
    }
    adAnalytics.emit('ad_shown', placement, this.name);
    adAnalytics.emit('ad_impression', placement, this.name);
    this.readyMap.set(placement, false);
    await this.delay(1500);
    adAnalytics.emit('ad_dismissed', placement, this.name);
    // Pre-load next
    this.loadInterstitial(placement);
    return true;
  }

  isReady(placement: RewardedPlacement | InterstitialPlacement): boolean {
    return this.readyMap.get(placement) ?? false;
  }

  dispose(): void {
    this.readyMap.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
