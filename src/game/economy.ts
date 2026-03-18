import type { Rarity } from './state';
import { CONFIG } from './config';

/**
 * Calculate coins earned for smashing an object.
 * Applies randomization, combo bonuses, streak bonus, power upgrade, charge, and ad multipliers.
 */
export function calculateCoins(
  rarity: Rarity,
  streak: number,
  chargeMultiplier: number = 1,
  adMultiplier: number = 1,
  powerLevel: number = 0,
): { coins: number; multiplier: number } {
  // 1. Base coins from rarity
  let base = CONFIG.baseCoins[rarity];

  // 2. Apply ±20% randomization
  base = base * (1 + (Math.random() * 2 - 1) * CONFIG.coinRandomRange);

  // 3. Combo percentage bonus (find highest matching threshold)
  let comboBonus = 0;
  for (const entry of CONFIG.comboBonuses) {
    if (streak >= entry.threshold) {
      comboBonus = entry.bonus;
    }
  }
  base = base * (1 + comboBonus);

  // 4. Streak bonus: if streak > 0, apply flat streak multiplier
  if (streak > 0) {
    base = base * (1 + CONFIG.streakBonus);
  }

  // 5. Power upgrade bonus
  base = base * (1 + powerLevel * CONFIG.upgradePowerBonus);

  // 6. Charge multiplier
  base = base * chargeMultiplier;

  // 7. Ad multiplier
  base = base * adMultiplier;

  // 8. Round result
  const coins = Math.round(base);
  const multiplier = 1 + comboBonus;

  return { coins, multiplier };
}

/**
 * Calculate the cost to unlock the Nth item (0-indexed).
 * Cost scales exponentially so later unlocks feel progressively harder.
 */
export function getUnlockCost(index: number): number {
  return Math.floor(
    CONFIG.unlockCostBase * Math.pow(CONFIG.unlockCostExponent, index),
  );
}

/**
 * Calculate the cost for the next upgrade level.
 * Cost scales exponentially: baseCost * exponent^level
 */
export function getUpgradeCost(level: number): number {
  return Math.floor(CONFIG.upgradeBaseCost * Math.pow(CONFIG.upgradeCostExponent, level));
}
