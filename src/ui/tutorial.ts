const TUTORIAL_KEY = 'rage-smash-tutorial-done';

export class Tutorial {
  private overlay: HTMLDivElement;
  private dismissed = false;

  constructor(container: HTMLElement, onDismiss: () => void) {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '500',
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      transition: 'opacity 0.4s ease',
    });

    // Hand icon with bounce animation
    const hand = document.createElement('div');
    hand.textContent = '\u261D\uFE0F';
    Object.assign(hand.style, {
      fontSize: '72px',
      animation: 'tutorialBounce 1s ease-in-out infinite',
      marginBottom: '24px',
    });

    const title = document.createElement('div');
    title.textContent = 'TAP TO SMASH!';
    Object.assign(title.style, {
      fontSize: '32px',
      fontWeight: '900',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
      letterSpacing: '2px',
      marginBottom: '12px',
    });

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Smash objects to earn coins';
    Object.assign(subtitle.style, {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '32px',
    });

    const tips = document.createElement('div');
    Object.assign(tips.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
    });
    const tipItems = [
      'Chain smashes for combo multipliers',
      'Visit the SHOP to unlock objects & upgrades',
      'Every 10 smashes triggers a PRESS BONUS',
      'Rotate to landscape for a better view',
    ];
    for (const tip of tipItems) {
      const t = document.createElement('div');
      t.textContent = tip;
      Object.assign(t.style, {
        fontSize: '14px',
        color: 'rgba(255,255,255,0.5)',
      });
      tips.appendChild(t);
    }

    const tapHint = document.createElement('div');
    tapHint.textContent = 'Tap anywhere to start';
    Object.assign(tapHint.style, {
      fontSize: '14px',
      color: 'rgba(255,255,255,0.4)',
      marginTop: '40px',
      animation: 'tutorialPulse 2s ease-in-out infinite',
    });

    // Inject keyframe animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes tutorialBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
      @keyframes tutorialPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
    `;
    this.overlay.appendChild(style);
    this.overlay.appendChild(hand);
    this.overlay.appendChild(title);
    this.overlay.appendChild(subtitle);
    this.overlay.appendChild(tips);
    this.overlay.appendChild(tapHint);

    this.overlay.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.dismissed) return;
      this.dismissed = true;
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay.remove();
        onDismiss();
      }, 400);
      Tutorial.markDone();
    });

    container.appendChild(this.overlay);
  }

  static shouldShow(): boolean {
    return !localStorage.getItem(TUTORIAL_KEY);
  }

  static markDone(): void {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch { /* ignore */ }
  }
}
