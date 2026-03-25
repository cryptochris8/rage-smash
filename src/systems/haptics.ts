import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticsSystem {
  private enabled = localStorage.getItem('rage-smash-haptics') !== 'off';
  private chargeBuzzTimer = 0;

  /** Tiered impact: scales with charge power (0-1) */
  async impact(power?: number): Promise<void> {
    if (!this.enabled) return;
    try {
      let style = ImpactStyle.Heavy;
      if (power !== undefined) {
        if (power < 0.3) style = ImpactStyle.Light;
        else if (power < 0.7) style = ImpactStyle.Medium;
      }
      await Haptics.impact({ style });
    } catch {
      // Web fallback — no haptics available
    }
  }

  // Light tap feedback for UI buttons
  async tap(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Web fallback
    }
  }

  /** Error buzz on overcharge fail */
  async notifyError(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      // Web fallback
    }
  }

  /** Success double-tap on combo milestone */
  async notifySuccess(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      // Web fallback
    }
  }

  /**
   * Call each frame while charging. Produces periodic light pulses
   * that increase in frequency as charge fills (ticking time bomb feel).
   */
  updateChargeBuzz(dt: number, chargeLevel: number): void {
    if (!this.enabled || chargeLevel <= 0) {
      this.chargeBuzzTimer = 0;
      return;
    }

    // Interval shrinks from 300ms at low charge to 80ms near overcharge
    const interval = 0.3 - chargeLevel * 0.22;
    this.chargeBuzzTimer += dt;

    if (this.chargeBuzzTimer >= interval) {
      this.chargeBuzzTimer = 0;
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  }

  resetChargeBuzz(): void {
    this.chargeBuzzTimer = 0;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
