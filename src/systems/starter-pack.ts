import { Store } from '../game/state';
import { CONFIG } from '../game/config';

export class StarterPackSystem {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  /** Increment session count on game start */
  recordSession(): void {
    this.store.update({
      sessionCount: this.store.state.sessionCount + 1,
    });
  }

  /** Should we show the starter pack modal? */
  shouldShow(): boolean {
    return (
      !this.store.state.starterPackPurchased &&
      this.store.state.sessionCount >= CONFIG.starterPackShowAfterSessions
    );
  }

  /** Stub IAP: grants 5000 coins + Rage Fury skin + 24h 2x boost */
  purchase(): void {
    const state = this.store.state;
    const hammerId = CONFIG.starterPackHammerId;

    const unlockedHammers = state.unlockedHammers.includes(hammerId)
      ? state.unlockedHammers
      : [...state.unlockedHammers, hammerId];

    this.store.update({
      starterPackPurchased: true,
      coins: state.coins + CONFIG.starterPackCoins,
      unlockedHammers,
      selectedHammer: hammerId,
      starterPackBoostExpiresAt: Date.now() + CONFIG.starterPackBoostDurationMs,
    });
  }

  /** Is the 24h starter pack boost currently active? */
  isBoostActive(): boolean {
    return this.store.state.starterPackBoostExpiresAt > Date.now();
  }

  /** Get boost multiplier (2 if active, 1 if not) */
  getBoostMultiplier(): number {
    return this.isBoostActive() ? 2 : 1;
  }
}
