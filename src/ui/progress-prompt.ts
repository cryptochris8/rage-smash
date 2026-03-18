const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export class ProgressPrompt {
  private container: HTMLElement;
  private activeEl: HTMLDivElement | null = null;
  private animId: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /** Show a near-miss prompt with 1-2 context-aware messages. Auto-dismiss after 3s. */
  show(messages: string[]): void {
    // Remove any existing prompt immediately
    if (this.activeEl) {
      if (this.animId) cancelAnimationFrame(this.animId);
      this.activeEl.remove();
      this.activeEl = null;
      this.animId = 0;
    }

    if (messages.length === 0) return;

    const card = document.createElement('div');
    this.activeEl = card;
    Object.assign(card.style, {
      position: 'absolute',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%) translateY(10px)',
      marginBottom: `calc(80px + env(safe-area-inset-bottom, 0px))`,
      maxWidth: '300px',
      width: 'max-content',
      background: 'rgba(0,0,0,0.75)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '12px 18px',
      pointerEvents: 'none',
      zIndex: '55',
      fontFamily: FONT_STACK,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      willChange: 'transform, opacity',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    });

    for (let i = 0; i < messages.length; i++) {
      const line = document.createElement('div');
      line.textContent = messages[i];
      Object.assign(line.style, {
        fontSize: '13px',
        fontWeight: '600',
        color: '#ffffff',
        lineHeight: '1.4',
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
      });

      // Add spacing between lines
      if (i > 0) {
        line.style.marginTop = '6px';
        line.style.color = 'rgba(255,255,255,0.7)';
      }

      card.appendChild(line);
    }

    this.container.appendChild(card);

    const duration = 3000;
    const fadeIn = 200;
    const fadeOut = 300;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      if (elapsed < fadeIn) {
        // Fade in + slide up
        const tIn = elapsed / fadeIn;
        const ease = 1 - Math.pow(1 - tIn, 3);
        card.style.opacity = String(ease);
        card.style.transform = `translateX(-50%) translateY(${10 - 10 * ease}px)`;
      } else if (elapsed < duration - fadeOut) {
        // Hold steady
        card.style.opacity = '1';
        card.style.transform = 'translateX(-50%) translateY(0)';
      } else {
        // Fade out
        const tOut = (elapsed - (duration - fadeOut)) / fadeOut;
        const ease = tOut * tOut;
        card.style.opacity = String(Math.max(0, 1 - ease));
        card.style.transform = `translateX(-50%) translateY(${-4 * ease}px)`;
      }

      if (t < 1) {
        this.animId = requestAnimationFrame(animate);
      } else {
        card.remove();
        if (this.activeEl === card) {
          this.activeEl = null;
          this.animId = 0;
        }
      }
    };

    this.animId = requestAnimationFrame(animate);
  }

  dispose(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.activeEl) {
      this.activeEl.remove();
      this.activeEl = null;
    }
    this.animId = 0;
  }
}
