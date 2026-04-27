import { Store } from '../game/state';
import { CONFIG } from '../game/config';

export class ChargeBar {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement;
  private fill: HTMLDivElement;
  private unsubscribe: () => void;

  constructor(container: HTMLElement, store: Store) {
    this.container = container;
    this.store = store;

    // Root bar container
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '200px',
      height: '16px',
      background: 'rgba(0,0,0,0.6)',
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: '40',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease',
      border: '1px solid rgba(255,255,255,0.2)',
    });

    // Fill bar
    this.fill = document.createElement('div');
    Object.assign(this.fill.style, {
      width: '0%',
      height: '100%',
      borderRadius: '8px',
      transition: 'width 0.03s linear',
    });
    this.root.appendChild(this.fill);

    // Zone markers — relative to the bar's actual range (chargeBarMaxFill).
    const range = CONFIG.chargeBarMaxFill;
    const markerPositions = [CONFIG.chargeOptimalMin, CONFIG.chargeOptimalMax, CONFIG.chargeDangerMax];
    for (const pos of markerPositions) {
      const marker = document.createElement('div');
      Object.assign(marker.style, {
        position: 'absolute',
        left: `${(pos / range) * 100}%`,
        top: '0',
        width: '2px',
        height: '100%',
        background: 'rgba(255,255,255,0.5)',
        pointerEvents: 'none',
      });
      this.root.appendChild(marker);
    }

    // Scorch band — graze zone (1.0 .. chargeFailThreshold). Visual cue that
    // releasing here is forgiven but reward is reduced.
    const scorchStart = CONFIG.chargeOverchargeThreshold / range;
    const scorchEnd = CONFIG.chargeFailThreshold / range;
    const scorch = document.createElement('div');
    Object.assign(scorch.style, {
      position: 'absolute',
      left: `${scorchStart * 100}%`,
      top: '0',
      width: `${(scorchEnd - scorchStart) * 100}%`,
      height: '100%',
      background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.55) 0 4px, rgba(239,68,68,0.25) 4px 8px)',
      pointerEvents: 'none',
    });
    this.root.appendChild(scorch);

    this.container.appendChild(this.root);

    this.unsubscribe = this.store.subscribe(() => this.update());
  }

  private update(): void {
    const { isCharging, chargeLevel } = this.store.state;

    this.root.style.opacity = isCharging ? '1' : '0';

    if (!isCharging) return;

    // Bar represents 0..chargeBarMaxFill, so a chargeLevel of 1.0 fills to
    // ~87% and the graze band fills the remainder.
    const range = CONFIG.chargeBarMaxFill;
    const pct = Math.min((chargeLevel / range) * 100, 100);
    this.fill.style.width = `${pct}%`;

    // Color based on zone
    let color: string;
    if (chargeLevel < CONFIG.chargeOptimalMin) {
      color = '#4ade80'; // green – below optimal
    } else if (chargeLevel <= CONFIG.chargeOptimalMax) {
      color = '#22c55e'; // bright green – optimal
    } else if (chargeLevel <= CONFIG.chargeDangerMax) {
      color = '#eab308'; // yellow – danger
    } else if (chargeLevel < CONFIG.chargeOverchargeThreshold) {
      color = '#f97316'; // orange – pre-overcharge
    } else {
      color = '#ef4444'; // red – graze / overcharge
    }
    this.fill.style.background = color;
  }

  dispose(): void {
    this.unsubscribe();
    this.root.remove();
  }
}
