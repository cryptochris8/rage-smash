import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class HapticsSystem {
  private enabled = true;

  // Impact feedback on smash
  async impact(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
