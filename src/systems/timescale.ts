import { CONFIG } from '../game/config';

export class TimeScaleSystem {
  private currentScale = 1.0;
  private slowmoRemaining = 0;
  private freezeRemaining = 0;

  triggerSlowmo(): void {
    // Hit stop first (complete freeze), then slow-mo
    this.freezeRemaining = CONFIG.hitStopDuration;
    this.currentScale = 0;
  }

  /** Call with real (unscaled) dt. Returns scaled dt for game systems. */
  getDt(rawDt: number): number {
    return rawDt * this.currentScale;
  }

  /** Tick timers using real-time dt. */
  update(rawDt: number): void {
    // Hit stop: complete freeze
    if (this.freezeRemaining > 0) {
      this.freezeRemaining -= rawDt;
      if (this.freezeRemaining <= 0) {
        this.freezeRemaining = 0;
        // Transition to slow-mo
        this.currentScale = CONFIG.slowmoScale;
        this.slowmoRemaining = CONFIG.slowmoDuration;
      } else {
        this.currentScale = 0;
      }
      return;
    }

    if (this.slowmoRemaining > 0) {
      this.slowmoRemaining -= rawDt;
      if (this.slowmoRemaining <= 0) {
        this.slowmoRemaining = 0;
        this.currentScale = 1.0;
      } else {
        // Ease back toward 1.0 as slowmo expires
        const t = 1 - this.slowmoRemaining / CONFIG.slowmoDuration;
        this.currentScale = CONFIG.slowmoScale + (1.0 - CONFIG.slowmoScale) * t * t;
      }
    }
  }
}
