import { CONFIG } from '../game/config';

export class Overlays {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Creates a floating "+N" text that animates upward and fades out. */
  showCoinPopup(amount: number): void {
    const el = document.createElement('div');
    el.textContent = `+${amount}`;
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '40%',
      transform: 'translateX(-50%) scale(0.8)',
      fontSize: '28px',
      fontWeight: '800',
      color: '#ffdd57',
      textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(255,221,87,0.4)',
      pointerEvents: 'none',
      zIndex: '50',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      willChange: 'transform, opacity',
    });

    this.container.appendChild(el);

    const duration = 1000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      // Scale pulse: 0.8 → 1.3 in first 15%, then settle to 1.0, then drift+fade
      let scale: number;
      if (t < 0.15) {
        const tPulse = t / 0.15;
        scale = 0.8 + 0.5 * tPulse; // 0.8 → 1.3
      } else if (t < 0.3) {
        const tSettle = (t - 0.15) / 0.15;
        scale = 1.3 - 0.3 * tSettle; // 1.3 → 1.0
      } else {
        scale = 1.0 + 0.3 * ((t - 0.3) / 0.7); // gentle grow
      }

      const ease = 1 - Math.pow(1 - t, 3);
      const yOffset = -60 * ease;
      const opacity = t < 0.3 ? 1 : 1 - ((t - 0.3) / 0.7);

      el.style.transform = `translateX(-50%) translateY(${yOffset}px) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Briefly flashes "xN" large text in center with scale-up and fade. */
  showCombo(combo: number): void {
    if (combo <= 1) return;

    const el = document.createElement('div');
    el.textContent = `x${combo}`;
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      fontSize: '48px',
      fontWeight: '900',
      color: '#ffffff',
      textShadow:
        '0 0 20px rgba(255,255,255,0.7), 0 0 40px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
      zIndex: '50',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
    });

    this.container.appendChild(el);

    const duration = 500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      let scale: number;
      let opacity: number;

      if (t < 0.3) {
        const tIn = t / 0.3;
        const ease = 1 - Math.pow(1 - tIn, 2);
        scale = 0.5 + 0.7 * ease;
        opacity = ease;
      } else {
        const tOut = (t - 0.3) / 0.7;
        const ease = tOut * tOut;
        scale = 1.2 + 0.15 * ease;
        opacity = 1 - ease;
      }

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Combo label at thresholds: SMASH!, NICE!, CLEAN HIT!, etc. */
  showComboLabel(streak: number): void {
    // Find highest matching threshold
    const labels = CONFIG.comboLabels;
    let label: string | null = null;
    for (let i = labels.length - 1; i >= 0; i--) {
      if (streak >= labels[i].threshold) {
        label = labels[i].text;
        break;
      }
    }
    if (!label) return;

    // Color tier based on streak
    let color: string;
    if (streak >= 10) color = '#ff6633';
    else if (streak >= 5) color = '#ffaa00';
    else if (streak >= 3) color = '#ffdd57';
    else color = '#ffffff';

    const el = document.createElement('div');
    el.textContent = label;
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '58%',
      transform: 'translate(-50%, -50%) scale(0.3)',
      fontSize: `${CONFIG.comboLabelFontSize}px`,
      fontWeight: '900',
      color,
      textShadow: '0 0 16px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
      zIndex: '50',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
      letterSpacing: '2px',
    });

    this.container.appendChild(el);

    const duration = CONFIG.comboLabelDuration;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      let scale: number;
      let opacity: number;

      if (t < 0.2) {
        const tIn = t / 0.2;
        const ease = 1 - Math.pow(1 - tIn, 3);
        scale = 0.3 + (CONFIG.comboLabelScaleMax - 0.3) * ease;
        opacity = ease;
      } else {
        const tOut = (t - 0.2) / 0.8;
        scale = CONFIG.comboLabelScaleMax;
        opacity = 1 - tOut * tOut;
      }

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Full-screen white flash on impact, fades out quickly. */
  showImpactFlash(color?: string): void {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'absolute',
      inset: '0',
      background: color ?? 'white',
      opacity: String(CONFIG.impactFlashOpacity),
      pointerEvents: 'none',
      zIndex: '45',
    });

    this.container.appendChild(el);

    const duration = CONFIG.impactFlashDuration;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      el.style.opacity = String(CONFIG.impactFlashOpacity * (1 - t * t));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Applies a quick CSS transform shake with configurable intensity and duration. */
  screenShake(container: HTMLElement, intensity?: number, duration?: number): void {
    const dur = duration ?? CONFIG.screenShakeDuration;
    const int = intensity ?? CONFIG.screenShakeIntensity;
    const start = performance.now();
    const originalTransform = container.style.transform || '';

    const shake = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / dur, 1);

      if (t < 1) {
        const dampen = 1 - t;
        const dx = (Math.random() * 2 - 1) * int * dampen;
        const dy = (Math.random() * 2 - 1) * int * dampen;
        container.style.transform = `${originalTransform} translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(shake);
      } else {
        container.style.transform = originalTransform;
      }
    };

    requestAnimationFrame(shake);
  }

  /** Red "OVERCHARGED!" text on fail */
  showOvercharge(): void {
    const el = document.createElement('div');
    el.textContent = 'OVERCHARGED!';
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '45%',
      transform: 'translate(-50%, -50%) scale(1.2)',
      fontSize: '32px',
      fontWeight: '900',
      color: '#ef4444',
      textShadow: '0 0 20px rgba(239,68,68,0.7), 0 2px 8px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
      zIndex: '50',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '1',
      willChange: 'transform, opacity',
      letterSpacing: '2px',
    });

    this.container.appendChild(el);

    const duration = 800;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      const scale = 1.2 - 0.2 * t;
      const opacity = 1 - t * t;

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Gold "JACKPOT! x7" label with scale-in + glow + fade */
  showJackpotLabel(multiplier: number): void {
    const el = document.createElement('div');
    el.textContent = `JACKPOT! x${multiplier}`;
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '35%',
      transform: 'translate(-50%, -50%) scale(0.3)',
      fontSize: '42px',
      fontWeight: '900',
      color: '#ffd700',
      textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.6)',
      pointerEvents: 'none',
      zIndex: '60',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
      letterSpacing: '3px',
    });

    this.container.appendChild(el);

    const duration = CONFIG.jackpotLabelDuration;
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

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Gold celebration when a player unlocks a room, hammer, or pack */
  showUnlockCelebration(itemName: string): void {
    this.showImpactFlash('#ffd700');

    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '40%',
      transform: 'translate(-50%, -50%) scale(0.3)',
      textAlign: 'center',
      pointerEvents: 'none',
      zIndex: '60',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
    });

    const nameText = document.createElement('div');
    nameText.textContent = itemName;
    Object.assign(nameText.style, {
      fontSize: '36px',
      fontWeight: '900',
      color: '#ffd700',
      textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.6)',
      letterSpacing: '2px',
      marginBottom: '4px',
    });
    el.appendChild(nameText);

    const subText = document.createElement('div');
    subText.textContent = 'UNLOCKED!';
    Object.assign(subText.style, {
      fontSize: '20px',
      fontWeight: '800',
      color: '#ffffff',
      textShadow: '0 0 16px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.5)',
      letterSpacing: '3px',
    });
    el.appendChild(subText);

    this.container.appendChild(el);

    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      let scale: number;
      let opacity: number;

      if (t < 0.15) {
        // Scale in: 0.3 → 1.3
        const tIn = t / 0.15;
        const ease = 1 - Math.pow(1 - tIn, 3);
        scale = 0.3 + 1.0 * ease;
        opacity = ease;
      } else if (t < 0.3) {
        // Settle: 1.3 → 1.0
        const tSettle = (t - 0.15) / 0.15;
        scale = 1.3 - 0.3 * tSettle;
        opacity = 1;
      } else if (t < 0.7) {
        // Hold
        scale = 1.0;
        opacity = 1;
      } else {
        // Fade out
        const tOut = (t - 0.7) / 0.3;
        scale = 1.0;
        opacity = 1 - tOut * tOut;
      }

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Flash "NEW BEST!" when beating best combo */
  showNewBest(): void {
    const el = document.createElement('div');
    el.textContent = 'NEW BEST!';
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '28%',
      transform: 'translate(-50%, -50%) scale(0.3)',
      fontSize: '28px',
      fontWeight: '900',
      color: '#00ff88',
      textShadow: '0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.4), 0 2px 8px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
      zIndex: '55',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
      letterSpacing: '3px',
    });

    this.container.appendChild(el);

    const duration = 900;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      let scale: number;
      let opacity: number;

      if (t < 0.15) {
        const tIn = t / 0.15;
        const ease = 1 - Math.pow(1 - tIn, 3);
        scale = 0.3 + 1.0 * ease;
        opacity = ease;
      } else if (t < 0.4) {
        const tSettle = (t - 0.15) / 0.25;
        scale = 1.3 - 0.3 * tSettle;
        opacity = 1;
      } else {
        const tOut = (t - 0.4) / 0.6;
        scale = 1.0;
        opacity = 1 - tOut * tOut;
      }

      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.opacity = String(Math.max(0, opacity));

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Toast: "Great hit! Double your coins?" — tappable, auto-dismiss 2s */
  showBoostSuggestion(onAccept: () => void): void {
    const el = document.createElement('div');
    el.textContent = 'Great hit! Double your coins?';
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      top: '8%',
      transform: 'translateX(-50%) translateY(-20px)',
      fontSize: '14px',
      fontWeight: '700',
      color: '#ffffff',
      background: 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))',
      padding: '10px 20px',
      borderRadius: '12px',
      pointerEvents: 'auto',
      zIndex: '55',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    });

    let dismissed = false;
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (dismissed) return;
      dismissed = true;
      el.remove();
      onAccept();
    });

    this.container.appendChild(el);

    const duration = 2000;
    const start = performance.now();

    const animate = (now: number) => {
      if (dismissed) return;
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      if (t < 0.1) {
        const tIn = t / 0.1;
        el.style.opacity = String(tIn);
        el.style.transform = `translateX(-50%) translateY(${-20 + 20 * tIn}px)`;
      } else if (t < 0.85) {
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0px)';
      } else {
        const tOut = (t - 0.85) / 0.15;
        el.style.opacity = String(1 - tOut);
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        el.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  /** Fake ad loading modal */
  showAdLoading(onComplete: () => void): void {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '300',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    const spinner = document.createElement('div');
    spinner.textContent = '\u23F3'; // hourglass
    Object.assign(spinner.style, {
      fontSize: '40px',
      marginBottom: '16px',
      animation: 'spin 1s linear infinite',
    });

    // Inject spin keyframe if needed
    if (!document.getElementById('smash-loop-spin-style')) {
      const style = document.createElement('style');
      style.id = 'smash-loop-spin-style';
      style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    const text = document.createElement('div');
    text.textContent = 'Loading reward...';
    Object.assign(text.style, {
      fontSize: '18px',
      color: '#ffffff',
      fontWeight: '700',
    });

    overlay.appendChild(spinner);
    overlay.appendChild(text);

    // Close button appears after 1s
    setTimeout(() => {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '\u2715';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '0',
        right: '0',
        margin: 'calc(14px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 0 0',
        minWidth: '44px',
        minHeight: '44px',
        fontSize: '24px',
        background: 'rgba(0,0,0,0.4)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
      });
      closeBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        overlay.remove();
      });
      overlay.appendChild(closeBtn);
    }, 1000);

    this.container.appendChild(overlay);

    // Auto-complete after 1.5s
    setTimeout(() => {
      overlay.remove();
      onComplete();
    }, 1500);
  }
}
