import { Store } from '../game/state';
import { CONFIG } from '../game/config';

export class SmartBoostSystem {
  private store: Store;
  private lastPromptTime: number = 0;

  constructor(store: Store) {
    this.store = store;
  }

  /** Check if we should prompt for a 2x boost. Returns true if triggered. */
  checkTrigger(coinsEarned: number): boolean {
    // Don't prompt if boost already active
    if (this.store.state.adBoostActive) return false;

    // Cooldown
    if (Date.now() - this.lastPromptTime < CONFIG.smartBoostCooldownMs) return false;

    const bigSmash = coinsEarned >= CONFIG.smartBoostBigSmashThreshold;
    const lowCoins = this.store.state.coins < CONFIG.smartBoostLowCoinThreshold;

    if (bigSmash || lowCoins) {
      this.lastPromptTime = Date.now();
      return true;
    }

    return false;
  }
}
