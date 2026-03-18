import { CONFIG } from '../game/config';

export interface JackpotResult {
  triggered: boolean;
  multiplier: number;
}

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
