import { Store } from '../game/state';
import { StarterPackSystem } from '../systems/starter-pack';
import { AudioManager } from '../audio/AudioManager';

export class StarterPackUI {
  private container: HTMLElement;
  private store: Store;
  private starterPack: StarterPackSystem;
  private audioManager: AudioManager;
  private root: HTMLDivElement | null = null;

  constructor(
    container: HTMLElement,
    store: Store,
    starterPack: StarterPackSystem,
    audioManager: AudioManager,
  ) {
    this.container = container;
    this.store = store;
    this.starterPack = starterPack;
    this.audioManager = audioManager;
  }

  show(): void {
    if (this.root) return;

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
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
    this.root.appendChild(backdrop);

    // Modal card
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

    // Title
    const title = document.createElement('div');
    title.textContent = 'STARTER PACK';
    Object.assign(title.style, {
      fontSize: '24px',
      fontWeight: '900',
      color: '#ffd700',
      textAlign: 'center',
      letterSpacing: '3px',
      textShadow: '0 0 20px rgba(255,215,0,0.5)',
      marginBottom: '24px',
    });
    card.appendChild(title);

    // Items
    const items = [
      { icon: '\uD83D\uDD28', label: 'Rage Fury Hammer', desc: 'Exclusive skin' },
      { icon: '\uD83E\uDE99', label: '5,000 Coins', desc: 'Instant boost' },
      { icon: '\u26A1', label: '24h 2X Coins', desc: 'Double everything' },
    ];

    for (const item of items) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        marginBottom: '10px',
      });

      const icon = document.createElement('div');
      icon.textContent = item.icon;
      icon.style.fontSize = '28px';
      icon.style.flexShrink = '0';

      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = item.label;
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
      });

      const desc = document.createElement('div');
      desc.textContent = item.desc;
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
      });

      info.appendChild(name);
      info.appendChild(desc);
      row.appendChild(icon);
      row.appendChild(info);
      card.appendChild(row);
    }

    // Buy button
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'CLAIM FREE';
    Object.assign(buyBtn.style, {
      display: 'block',
      width: '100%',
      marginTop: '20px',
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
    buyBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.starterPack.purchase();
      this.audioManager.playDailyReward();
      this.hide();
    });
    card.appendChild(buyBtn);

    // Dismiss
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
      this.hide();
    });
    card.appendChild(dismiss);

    this.root.appendChild(card);
    this.container.appendChild(this.root);
  }

  hide(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }
}
