import { setPerfTier, type PerfTier } from './motion-prefs';

/**
 * Adaptive performance monitor.
 *
 * Samples a rolling window of per-frame `rawDt` and pushes a tier
 * (`high` | `medium` | `low`) into motion-prefs so older / slower devices
 * automatically reduce particle density and disable shake/zoom punch.
 *
 * Hysteresis (sustained 2s in the new tier) prevents rapid thrash near a
 * boundary. The first 2s after construction stays pinned to `high` so the
 * title-screen warmup period doesn't cause a premature downgrade before
 * assets settle.
 *
 * The user's accessibility prefs in motion-prefs.ts remain authoritative —
 * if the user switched Screen Shake OFF, this monitor cannot turn it back
 * on. It can only further reduce visual density.
 */
export class PerfMonitor {
  private window: number[] = [];
  private windowMax = 60;
  private currentTier: PerfTier = 'high';
  private candidateTier: PerfTier = 'high';
  private candidateAccumSec = 0;
  private warmupRemainingSec = 2.0;
  private evalAccumSec = 0;

  /** Re-evaluate tier every this many seconds. Cheap, but no point doing
   *  it every frame. */
  private readonly evalIntervalSec = 0.5;

  /** Tier must be sustained this long before transition (hysteresis). */
  private readonly transitionHoldSec = 2.0;

  /** FPS thresholds with hysteresis margins so a borderline 55fps device
   *  doesn't oscillate between high and medium every frame. */
  private readonly highEnter = 55;     // upgrade to high when avgFps >= 55
  private readonly highExit = 50;      // downgrade from high when avgFps < 50
  private readonly mediumEnter = 40;   // upgrade to medium when avgFps >= 40
  private readonly mediumExit = 35;    // downgrade from medium when avgFps < 35

  constructor() {
    setPerfTier('high');
  }

  /** Call once per frame with the raw (unscaled) frame delta in seconds. */
  tick(rawDt: number): void {
    if (rawDt <= 0) return;

    if (this.warmupRemainingSec > 0) {
      this.warmupRemainingSec -= rawDt;
      // Still seed the window so the first eval has data.
      this.pushSample(rawDt);
      return;
    }

    this.pushSample(rawDt);

    this.evalAccumSec += rawDt;
    if (this.evalAccumSec < this.evalIntervalSec) return;
    this.evalAccumSec = 0;

    const avgFps = this.computeAvgFps();
    const proposed = this.classify(avgFps);

    if (proposed === this.currentTier) {
      // Stable. Reset any in-flight transition candidate.
      this.candidateTier = this.currentTier;
      this.candidateAccumSec = 0;
      return;
    }

    if (proposed !== this.candidateTier) {
      // New candidate observed — start the hold timer over.
      this.candidateTier = proposed;
      this.candidateAccumSec = 0;
      return;
    }

    this.candidateAccumSec += this.evalIntervalSec;
    if (this.candidateAccumSec >= this.transitionHoldSec) {
      this.currentTier = proposed;
      this.candidateAccumSec = 0;
      setPerfTier(proposed);
      console.log(`[perf-monitor] tier -> ${proposed} (avgFps=${avgFps.toFixed(1)})`);
    }
  }

  /** Manually force a tier (debug overlay / tests). */
  forceTier(tier: PerfTier): void {
    this.currentTier = tier;
    this.candidateTier = tier;
    this.candidateAccumSec = 0;
    setPerfTier(tier);
  }

  getTier(): PerfTier {
    return this.currentTier;
  }

  private pushSample(rawDt: number): void {
    this.window.push(rawDt);
    if (this.window.length > this.windowMax) {
      this.window.shift();
    }
  }

  private computeAvgFps(): number {
    if (this.window.length === 0) return 60;
    let sum = 0;
    for (const dt of this.window) sum += dt;
    return this.window.length / sum;
  }

  /** Classify with hysteresis: which tier is "valid" given current tier. */
  private classify(avgFps: number): PerfTier {
    if (this.currentTier === 'high') {
      if (avgFps < this.highExit) {
        return avgFps < this.mediumExit ? 'low' : 'medium';
      }
      return 'high';
    }
    if (this.currentTier === 'medium') {
      if (avgFps >= this.highEnter) return 'high';
      if (avgFps < this.mediumExit) return 'low';
      return 'medium';
    }
    // currentTier === 'low'
    if (avgFps >= this.highEnter) return 'high';
    if (avgFps >= this.mediumEnter) return 'medium';
    return 'low';
  }
}
