export const CONFIG = {
  // Economy
  baseCoins: {
    common: 10,
    uncommon: 15,
    rare: 25,
  } as Record<string, number>,
  comboStep: 5,
  comboMultiplierIncrement: 0.2,
  unlockCostBase: 100,
  unlockCostExponent: 2.2,

  // Gameplay
  smashDuration: 0.3,
  fragmentCount: 6,
  fragmentLifetime: 1.5,
  fragmentSpread: 3,
  fragmentGravity: -9.8,
  spawnDelay: 0.3,
  spawnAnimDuration: 0.2,

  // Rendering
  maxFragments: 30,
  cameraFov: 65,
  cameraPosition: [0, 3.5, 5.5] as [number, number, number],
  cameraLookAt: [0, 1.2, 0] as [number, number, number],
  pedestalPosition: [0, 0, 0] as [number, number, number],
  objectSpawnY: 1.5,

  // Colors
  bgColor: 0x111118,
  pedestalColor: 0x555566,
  ambientLightColor: 0xeeeeff,
  ambientLightIntensity: 0.4,
  directionalLightColor: 0xfff8ee,
  directionalLightIntensity: 1.0,
  directionalLightPosition: [3, 6, 4] as [number, number, number],

  // Particles
  particleCount: 12,
  particleSize: 0.08,
  particleLifetime: 0.8,
  particleSpread: 4,

  // Hammer
  hammerRestAngle: -0.8,
  hammerSmashAngle: 0.5,
  hammerLength: 1.2,
  hammerHeadSize: 0.3,

  // --- Phase 1: Impact Juice ---
  screenShakeIntensity: 3,
  screenShakeDuration: 100,
  slowmoDuration: 0.12,
  slowmoScale: 0.15,
  coinBurstCount: 8,

  // --- Juice: Hit Stop (freeze frame on impact) ---
  hitStopDuration: 0.05,

  // --- Juice: Impact Flash ---
  impactFlashDuration: 80,
  impactFlashOpacity: 0.35,

  // --- Juice: Camera Zoom Punch ---
  zoomPunchFov: 5,
  zoomPunchDuration: 200,

  // --- Juice: Animated Coin Counter ---
  coinCounterDuration: 400,

  // --- Juice: Streak Heat (lighting shift) ---
  streakHeatThresholds: [3, 5, 10, 20] as number[],
  streakHeatColors: {
    ambient: [0xeeeeff, 0xffeecc, 0xffcc88, 0xff8844, 0xff4422] as number[],
    directional: [0xfff8ee, 0xffeeaa, 0xffbb66, 0xff8833, 0xff5511] as number[],
  },

  // --- Juice: Confetti Burst ---
  confettiCount: 40,
  confettiColors: [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xff8800, 0xffffff] as number[],
  confettiComboThresholds: [5, 10, 20] as number[],

  // Particle themes: count multiplier, size multiplier, transparency
  particleThemes: {
    default:    { countMul: 1.0, sizeMul: 1.0, alpha: 1.0 },
    glass:      { countMul: 1.5, sizeMul: 0.7, alpha: 0.6 },
    metal:      { countMul: 0.8, sizeMul: 1.2, alpha: 1.0 },
    organic:    { countMul: 1.3, sizeMul: 1.1, alpha: 0.9 },
    electronic: { countMul: 1.2, sizeMul: 0.8, alpha: 0.8 },
  } as Record<string, { countMul: number; sizeMul: number; alpha: number }>,

  // --- Phase 2: Combo Labels ---
  comboLabels: [
    { threshold: 1,  text: 'SMASH!' },
    { threshold: 2,  text: 'NICE!' },
    { threshold: 3,  text: 'CLEAN HIT!' },
    { threshold: 5,  text: 'x5 COMBO!' },
    { threshold: 10, text: 'DOMINATING!' },
    { threshold: 20, text: 'UNSTOPPABLE!' },
  ] as { threshold: number; text: string }[],
  comboLabelDuration: 600,
  comboLabelFontSize: 36,
  comboLabelScaleMax: 1.4,

  // --- Phase 3: Charge Bar ---
  chargeEnabled: true,
  chargeRate: 1.8,
  chargeOptimalMin: 0.3,
  chargeOptimalMax: 0.7,
  chargeDangerMax: 0.9,
  chargeOverchargeThreshold: 1.0,
  chargeMultiplierLow: 0.5,
  chargeMultiplierOptimalMax: 2.0,
  chargeMultiplierDanger: 2.0,

  // --- Phase 4: Daily Login Rewards ---
  loginRewards: [100, 500, 2000, 5000, 5000, 5000, 10000],
  loginRewardCooldownMs: 86400000,

  // --- Phase 5: Ads ---
  adRewardDuration: 30,

  // --- Starter Pack ---
  starterPackCoins: 5000,
  starterPackBoostDurationMs: 86400000,
  starterPackShowAfterSessions: 3,
  starterPackHammerId: 'rage-fury',

  // --- Jackpot ---
  jackpotChance: 0.075,
  jackpotMultiplierMin: 5,
  jackpotMultiplierMax: 10,
  jackpotLabelDuration: 1200,
  jackpotParticleCount: 30,
  jackpotParticleColor: 0xffd700,

  // --- Smart Boost ---
  smartBoostBigSmashThreshold: 30,
  smartBoostLowCoinThreshold: 50,
  smartBoostCooldownMs: 60000,

  // --- Upgrades ---
  upgradeBaseCost: 100,
  upgradeCostExponent: 2.2,
  upgradeMaxLevel: 6,
  upgradePowerBonus: 0.12,    // +12% coin gain per level
  upgradeSpeedBonus: 0.07,    // -7% cooldown per level
  upgradeMultiplierBonus: 0.07, // +7% faster combo per level

  // --- Coin Randomization ---
  coinRandomRange: 0.2,  // ±20% randomization on base coins

  // --- Combo Percentage Bonuses ---
  comboBonuses: [
    { threshold: 2, bonus: 0.10 },
    { threshold: 3, bonus: 0.20 },
    { threshold: 5, bonus: 0.40 },
    { threshold: 10, bonus: 0.75 },
  ] as { threshold: number; bonus: number }[],

  // --- Streak Bonus ---
  streakBonus: 0.20, // +20% for maintaining streak

  // --- Starting Coins ---
  startingCoins: 500,
} as const;
