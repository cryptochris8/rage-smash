import { CONFIG } from '../game/config';
import { Store } from '../game/state';

export interface ChargeResult {
  success: boolean;
  level: number;
  multiplier: number;
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
    this.level = Math.min(this.level + CONFIG.chargeRate * dt, 1.0);
    this.store.update({ chargeLevel: this.level });
  }

  releaseCharge(): ChargeResult {
    this.charging = false;
    const level = this.level;
    this.level = 0;
    this.store.update({ isCharging: false, chargeLevel: 0 });

    // Over threshold → fail
    if (level >= CONFIG.chargeOverchargeThreshold) {
      return { success: false, level, multiplier: 0 };
    }

    let multiplier: number;
    if (level < CONFIG.chargeOptimalMin) {
      // Below optimal zone: low multiplier
      multiplier = CONFIG.chargeMultiplierLow;
    } else if (level <= CONFIG.chargeOptimalMax) {
      // Optimal zone: scale from 1.0 to optimal max
      const t = (level - CONFIG.chargeOptimalMin) / (CONFIG.chargeOptimalMax - CONFIG.chargeOptimalMin);
      multiplier = 1.0 + t * (CONFIG.chargeMultiplierOptimalMax - 1.0);
    } else {
      // Danger zone: high risk, high reward
      multiplier = CONFIG.chargeMultiplierDanger;
    }

    return { success: true, level, multiplier };
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
