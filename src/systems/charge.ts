import { CONFIG } from '../game/config';
import { Store } from '../game/state';

export type ChargeOutcome = 'low' | 'optimal' | 'danger' | 'graze' | 'fail';

export interface ChargeResult {
  success: boolean;
  level: number;
  multiplier: number;
  outcome: ChargeOutcome;
}

export class ChargeSystem {
  private store: Store;
  private charging = false;
  private level = 0;

  constructor(store: Store) {
    this.store = store;
  }

  startCharge(): void {
    this.charging = true;
    this.level = 0;
    this.store.update({ isCharging: true, chargeLevel: 0 });
  }

  update(dt: number): void {
    if (!this.charging) return;
    // Allow fill to overshoot 1.0 into the graze band so the player feels the
    // late-release forgiveness window. Hard cap at chargeBarMaxFill prevents
    // unbounded values during very long holds.
    this.level = Math.min(this.level + CONFIG.chargeRate * dt, CONFIG.chargeBarMaxFill);
    this.store.update({ chargeLevel: this.level });
  }

  releaseCharge(): ChargeResult {
    this.charging = false;
    const level = this.level;
    this.level = 0;
    this.store.update({ isCharging: false, chargeLevel: 0 });

    // Beyond fail threshold → hard miss (streak reset, combo-save eligible).
    if (level >= CONFIG.chargeFailThreshold) {
      return { success: false, level, multiplier: 0, outcome: 'fail' };
    }

    // Graze zone (1.0 .. chargeFailThreshold): streak survives but reward
    // reduced and combo doesn't tick up. Caller treats this as a soft miss.
    if (level >= CONFIG.chargeOverchargeThreshold) {
      return {
        success: true,
        level,
        multiplier: CONFIG.chargeMultiplierGraze,
        outcome: 'graze',
      };
    }

    if (level < CONFIG.chargeOptimalMin) {
      // Below optimal zone: low multiplier
      return { success: true, level, multiplier: CONFIG.chargeMultiplierLow, outcome: 'low' };
    }
    if (level <= CONFIG.chargeOptimalMax) {
      // Optimal zone: scale from 1.0 to optimal max
      const t = (level - CONFIG.chargeOptimalMin) / (CONFIG.chargeOptimalMax - CONFIG.chargeOptimalMin);
      const multiplier = 1.0 + t * (CONFIG.chargeMultiplierOptimalMax - 1.0);
      return { success: true, level, multiplier, outcome: 'optimal' };
    }
    // Danger zone (chargeOptimalMax..chargeOverchargeThreshold)
    return { success: true, level, multiplier: CONFIG.chargeMultiplierDanger, outcome: 'danger' };
  }

  cancelCharge(): void {
    this.charging = false;
    this.level = 0;
    this.store.update({ isCharging: false, chargeLevel: 0 });
  }

  isActive(): boolean {
    return this.charging;
  }
}
