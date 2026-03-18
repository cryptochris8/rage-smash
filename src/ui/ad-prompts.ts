import { Store } from '../game/state';
import { AdManager } from '../ads/AdManager';
import { AudioManager } from '../audio/AudioManager';

export class AdPrompts {
  private container: HTMLElement;
  private store: Store;
  private adManager: AdManager;
  private audioManager: AudioManager;

  constructor(
    container: HTMLElement,
    store: Store,
    adManager: AdManager,
    audioManager: AudioManager,
  ) {
    this.container = container;
    this.store = store;
    this.adManager = adManager;
    this.audioManager = audioManager;
  }

  /** Session-end bonus: "Watch for +X coins?" */
  showSessionEndBonus(sessionCoins: number): void {
    const bonus = Math.floor(sessionCoins * 0.25);
    if (bonus <= 0) return;

    const root = this.createModalRoot();
    const card = this.createCard();

    // Title
    card.appendChild(this.createTitle('BONUS COINS'));

    // Description
    const desc = document.createElement('div');
    desc.textContent = `Watch a short video for +${bonus.toLocaleString()} coins?`;
    Object.assign(desc.style, {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginBottom: '20px',
      lineHeight: '1.4',
    });
    card.appendChild(desc);

    // Watch button
    const watchBtn = this.createActionButton('WATCH');
    watchBtn.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      this.removeModal(root);
      const success = await this.adManager.showRewarded('session_end_bonus');
      if (success) {
        this.store.update({ coins: this.store.state.coins + bonus });
        this.audioManager.playDailyReward();
      } else {
        this.showAdUnavailable();
      }
    });
    card.appendChild(watchBtn);

    // Dismiss
    card.appendChild(this.createDismissButton(root));

    root.appendChild(card);
    this.container.appendChild(root);
  }

  /** Upgrade rescue: "Need X more for Y. Watch for a bonus?" */
  showUpgradeRescue(needed: number, upgradeName: string): void {
    const root = this.createModalRoot();
    const card = this.createCard();

    // Title
    card.appendChild(this.createTitle('ALMOST THERE'));

    // Description
    const desc = document.createElement('div');
    desc.textContent = `Need ${needed.toLocaleString()} more for ${upgradeName}. Watch for a bonus?`;
    Object.assign(desc.style, {
      fontSize: '15px',
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginBottom: '20px',
      lineHeight: '1.4',
    });
    card.appendChild(desc);

    // Watch button
    const watchBtn = this.createActionButton('WATCH');
    watchBtn.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      this.removeModal(root);
      const success = await this.adManager.showRewarded('upgrade_rescue');
      if (success) {
        this.store.update({ coins: this.store.state.coins + needed });
        this.audioManager.playDailyReward();
      } else {
        this.showAdUnavailable();
      }
    });
    card.appendChild(watchBtn);

    // Dismiss
    card.appendChild(this.createDismissButton(root));

    root.appendChild(card);
    this.container.appendChild(root);
  }

  /** Red toast: "Ad unavailable, try again soon" */
  showAdUnavailable(): void {
    const el = document.createElement('div');
    el.textContent = 'Ad unavailable, try again soon';
    Object.assign(el.style, {
      position: 'absolute',
      left: '50%',
      bottom: '20%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      background: 'rgba(239,68,68,0.9)',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: '700',
      borderRadius: '10px',
      pointerEvents: 'none',
      zIndex: '400',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      opacity: '0',
      transition: 'opacity 0.15s ease',
      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    });

    this.container.appendChild(el);

    const duration = 2000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      if (t < 0.1) {
        el.style.opacity = String(t / 0.1);
        el.style.transform = `translateX(-50%) translateY(${-20 + 20 * (t / 0.1)}px)`;
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

  // --- Helpers ---

  private createModalRoot(): HTMLDivElement {
    const root = document.createElement('div');
    Object.assign(root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '250',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    // Backdrop
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(0,0,0,0.85)',
    });
    root.appendChild(backdrop);

    return root;
  }

  private createCard(): HTMLDivElement {
    const card = document.createElement('div');
    Object.assign(card.style, {
      position: 'relative',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      borderRadius: '20px',
      padding: '28px 24px',
      maxWidth: '320px',
      width: '85%',
      border: '2px solid rgba(255,215,0,0.4)',
      boxShadow: '0 0 40px rgba(255,215,0,0.15), 0 8px 32px rgba(0,0,0,0.6)',
    });
    return card;
  }

  private createTitle(text: string): HTMLDivElement {
    const title = document.createElement('div');
    title.textContent = text;
    Object.assign(title.style, {
      fontSize: '24px',
      fontWeight: '900',
      color: '#ffd700',
      textAlign: 'center',
      letterSpacing: '3px',
      textShadow: '0 0 20px rgba(255,215,0,0.5)',
      marginBottom: '16px',
    });
    return title;
  }

  private createActionButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      display: 'block',
      width: '100%',
      padding: '14px',
      fontSize: '18px',
      fontWeight: '900',
      letterSpacing: '1px',
      color: '#ffffff',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      border: 'none',
      borderRadius: '14px',
      cursor: 'pointer',
      minHeight: '52px',
      WebkitTapHighlightColor: 'transparent',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
    });
    return btn;
  }

  private createDismissButton(root: HTMLDivElement): HTMLButtonElement {
    const dismiss = document.createElement('button');
    dismiss.textContent = 'No Thanks';
    Object.assign(dismiss.style, {
      display: 'block',
      width: '100%',
      marginTop: '10px',
      padding: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.4)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
    });
    dismiss.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.removeModal(root);
    });
    return dismiss;
  }

  private removeModal(root: HTMLDivElement): void {
    root.remove();
  }
}
