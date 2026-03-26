import { AdProvider, RewardedPlacement, InterstitialPlacement } from './types';
import { adAnalytics } from './analytics';

export class StubProvider implements AdProvider {
  readonly name = 'StubProvider';
  private readyMap: Map<string, boolean> = new Map();

  async initialize(): Promise<void> {
    console.log('[StubProvider] Initialized (web/dev fallback)');
  }

  async loadRewarded(_placement: RewardedPlacement): Promise<void> {
    // No-op on web — ads not available
  }

  async showRewarded(_placement: RewardedPlacement): Promise<boolean> {
    // No real ads on web — always fail so prompts don't mislead players
    return false;
  }

  async loadInterstitial(_placement: InterstitialPlacement): Promise<void> {
    // No-op on web
  }

  async showInterstitial(_placement: InterstitialPlacement): Promise<boolean> {
    // No real ads on web
    return false;
  }

  isReady(_placement: RewardedPlacement | InterstitialPlacement): boolean {
    return false;
  }

  dispose(): void {
    this.readyMap.clear();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
