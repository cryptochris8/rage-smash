/** Centralized audio tuning values */
export const AUDIO_CONFIG = {
  // --- Layer timing (ms offsets from smash event) ---
  impactDelay: 0,
  breakDelay: 30,
  coinDelay: 80,
  comboDelay: 110,

  // --- Pitch randomization ranges [min, max] ---
  pitchRange: {
    impact:  [0.96, 1.04] as [number, number],
    impactCharged: [0.92, 1.0] as [number, number],
    break:   [0.95, 1.05] as [number, number],
    coin:    [0.98, 1.08] as [number, number],
    combo:   [0.97, 1.06] as [number, number],
    comboCinematic: [0.95, 1.02] as [number, number],
    rareBoom: [0.9, 1.0] as [number, number],
    ui:      [0.98, 1.02] as [number, number],
    charge:  [0.98, 1.02] as [number, number],
    fail:    [0.95, 1.05] as [number, number],
  },

  // --- Volume scaling by power level ---
  // power 0-1, maps to volume multiplier
  volumeByPower: {
    impact: { base: 0.4, scale: 0.5 },  // 0.4 at weak → 0.9 at perfect
    break:  { base: 0.3, scale: 0.5 },
    coin:   { base: 0.3, scale: 0.3 },
  },

  // --- Combo-based coin pitch boost ---
  // Raises coin pitch slightly at higher combos
  coinComboPitchBoost: 0.02,  // per combo level above 1
  coinComboPitchMax: 0.12,    // max total pitch boost

  // --- Combo reinforcement thresholds ---
  comboThresholds: [2, 3, 5, 10, 20],

  // --- Max simultaneous sounds (prevent audio chaos) ---
  maxSimultaneous: 6,

  // --- Charged impact threshold (power 0-1, above this plays bass-hit) ---
  chargedImpactThreshold: 0.5,
  chargedImpactVolume: 0.6,

  // --- Rare boom (layered under break for rare objects) ---
  rareBoomVolume: 0.5,
  rareBoomDelay: 15,  // ms after impact

  // --- Cinematic combo (replaces procedural at thresholds) ---
  cinematicComboVolume: 0.5,

  // --- Music ---
  musicVolume: 0.18,  // Background music sits well below SFX

  // --- Default volumes ---
  masterVolume: 0.7,
  uiVolume: 0.4,
  comboVolume: 0.35,
  chargeVolume: 0.15,
  failVolume: 0.5,
  rewardVolume: 0.5,
  boostVolume: 0.4,
};
