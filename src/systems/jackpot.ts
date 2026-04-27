import { CONFIG } from '../game/config';

export interface JackpotResult {
  triggered: boolean;
  multiplier: number;
}

/**
 * Per-smash jackpot RNG. Intentionally does NOT write to
 * `state.loginDay7BoostExpiresAt` — that field is exclusively granted by
 * the day-7 login reward and read here (and in press.ts/smash.ts) only as
 * a multiplier on the jackpot roll's chance. Keeping the writer scoped to
 * one place avoids ambiguity about who controls the boost lifetime.
 */
export class JackpotSystem {
  roll(chanceMultiplier = 1): JackpotResult {
    if (Math.random() < CONFIG.jackpotChance * chanceMultiplier) {
      const range = CONFIG.jackpotMultiplierMax - CONFIG.jackpotMultiplierMin;
      const multiplier = CONFIG.jackpotMultiplierMin + Math.floor(Math.random() * (range + 1));
      return { triggered: true, multiplier };
    }
    return { triggered: false, multiplier: 1 };
  }
}
