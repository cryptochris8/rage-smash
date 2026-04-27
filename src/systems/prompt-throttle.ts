/**
 * Unified cooldown for monetization-adjacent prompts.
 *
 * Different from the AdManager global throttle (which gates ad SHOWS): this
 * throttles the *prompts* that lead to ads or IAP. Without it, a player
 * who finishes a session can see in rapid succession:
 *   - smart-boost ("watch for 2x?")
 *   - starter-pack auto-show
 *   - session-end-bonus ("watch for +X coins?")
 *   - daily-double ("watch to double?")
 *
 * That feels spammy regardless of whether the underlying ads ever fire.
 *
 * Usage:
 *   if (promptThrottle.canShow('smartBoost')) {
 *     promptThrottle.markShown('smartBoost');
 *     overlays.showBoostSuggestion(...);
 *   }
 */

export type PromptKind =
  | 'starterPack'
  | 'smartBoost'
  | 'sessionEndBonus'
  | 'upgradeRescue'
  | 'dailyDouble'
  | 'jackpotDouble';

const DEFAULT_GAP_MS = 45_000;

class PromptThrottle {
  private lastShown = 0;

  /** Returns true if a prompt of any kind hasn't fired in the last
   *  `minGapMs` (default 45s). Kind is currently informational — the
   *  throttle is global since players experience all of these as "the
   *  game is asking me to do something." Pass per-kind gaps if a future
   *  surface needs different pacing. */
  canShow(_kind: PromptKind, minGapMs: number = DEFAULT_GAP_MS): boolean {
    if (this.lastShown === 0) return true;
    return Date.now() - this.lastShown >= minGapMs;
  }

  /** Stamp the throttle. Call right before / after surfacing the prompt. */
  markShown(_kind: PromptKind): void {
    this.lastShown = Date.now();
  }

  /** Manually reset (e.g., on session change or testing). */
  reset(): void {
    this.lastShown = 0;
  }

  /** Inspect for debug overlay. */
  msUntilNext(minGapMs: number = DEFAULT_GAP_MS): number {
    if (this.lastShown === 0) return 0;
    return Math.max(0, minGapMs - (Date.now() - this.lastShown));
  }
}

export const promptThrottle = new PromptThrottle();
