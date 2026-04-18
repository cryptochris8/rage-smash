import { CONFIG } from './config';

export type ComboTier = (typeof CONFIG.comboTiers)[number];

/** Returns the highest tier whose threshold is <= streak. */
export function getComboTier(streak: number): ComboTier {
  const tiers = CONFIG.comboTiers;
  let match = tiers[0];
  for (let i = 0; i < tiers.length; i++) {
    if (streak >= tiers[i].threshold) match = tiers[i];
  }
  return match;
}

/**
 * Progress (0..1) from the current tier's threshold toward the next tier's threshold.
 * Returns 1 when the player is already at the top tier.
 */
export function getTierProgress(streak: number): number {
  const tiers = CONFIG.comboTiers;
  let currentIdx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (streak >= tiers[i].threshold) currentIdx = i;
  }
  if (currentIdx >= tiers.length - 1) return 1;
  const cur = tiers[currentIdx].threshold;
  const next = tiers[currentIdx + 1].threshold;
  if (next <= cur) return 1;
  return Math.min(1, Math.max(0, (streak - cur) / (next - cur)));
}

/** The next tier above the current streak, or null if at the top. */
export function getNextTier(streak: number): ComboTier | null {
  const tiers = CONFIG.comboTiers;
  for (let i = 0; i < tiers.length; i++) {
    if (streak < tiers[i].threshold) return tiers[i];
  }
  return null;
}
