import { Store } from '../game/state';

export class PressHUD {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement;
  private label: HTMLDivElement;
  private gauge: HTMLDivElement;
  private gaugeFill: HTMLDivElement;
  private unsubscribe: () => void;
  private labelTimeout: number | null = null;

  constructor(container: HTMLElement, store: Store) {
    this.container = container;
    this.store = store;

    // Root wrapper
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '55',
      display: 'none',
    });

    // "PRESS BONUS!" announcement label
    this.label = document.createElement('div');
    this.label.textContent = 'PRESS BONUS!';
    Object.assign(this.label.style, {
      position: 'absolute',
      left: '50%',
      top: '25%',
      transform: 'translate(-50%, -50%) scale(0.3)',
      fontSize: '38px',
      fontWeight: '900',
      color: '#ff8844',
      textShadow: '0 0 24px rgba(255,136,68,0.8), 0 0 48px rgba(255,136,68,0.4), 0 4px 12px rgba(0,0,0,0.6)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      letterSpacing: '3px',
      opacity: '0',
      willChange: 'transform, opacity',
    });
    this.root.appendChild(this.label);

    // Pressure gauge (vertical bar, left side)
    this.gauge = document.createElement('div');
    Object.assign(this.gauge.style, {
      position: 'absolute',
      left: '16px',
      bottom: '25%',
      width: '12px',
      height: '120px',
      background: 'rgba(0,0,0,0.6)',
      borderRadius: '6px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.2)',
    });

    this.gaugeFill = document.createElement('div');
    Object.assign(this.gaugeFill.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '0%',
      borderRadius: '6px',
      transition: 'height 0.05s linear',
    });
    this.gauge.appendChild(this.gaugeFill);
    this.root.appendChild(this.gauge);

    this.container.appendChild(this.root);

    this.unsubscribe = this.store.subscribe(() => this.update());
  }

  show(): void {
    this.root.style.display = 'block';
    this.animateLabel();
  }

  hide(): void {
    this.root.style.display = 'none';
    if (this.labelTimeout !== null) {
      clearTimeout(this.labelTimeout);
      this.labelTimeout = null;
    }
  }

  private animateLabel(): void {
    // Scale-in + glow + fade animation for the "PRESS BONUS!" label
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      let scale: number;
      let opacity: number;

      if (t < 0.15) {
        const tIn = t / 0.15;
        const ease = 1 - Math.pow(1 - tIn, 3);
        scale = 0.3 + 1.2 * ease;
        opacity = ease;
      } else if (t < 0.3) {
        const tSettle = (t - 0.15) / 0.15;
        scale = 1.5 - 0.3 * tSettle;
        opacity = 1;
      } else {
        const tOut = (t - 0.3) / 0.7;
        scale = 1.2;
        opacity = 1 - tOut * tOut;
      }

      this.label.style.transform = `translate(-50%, -50%) scale(${scale})`;
      this.label.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private update(): void {
    const { pressActive, pressProgress } = this.store.state;

    if (!pressActive) return;

    // Update gauge fill
    const pct = Math.min(pressProgress * 100, 100);
    this.gaugeFill.style.height = `${pct}%`;

    // Color based on progress
    let color: string;
    if (pressProgress < 0.5) {
      color = '#4ade80'; // green
    } else if (pressProgress < 0.8) {
      color = '#eab308'; // yellow
    } else {
      color = '#ef4444'; // red
    }
    this.gaugeFill.style.background = color;
  }

  dispose(): void {
    this.unsubscribe();
    this.hide();
    this.root.remove();
  }
}
