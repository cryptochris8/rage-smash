import { Store } from '../game/state';
import { LoginRewardSystem } from '../systems/login-reward';
import { AudioManager } from '../audio/AudioManager';

export class LoginRewardUI {
  private container: HTMLElement;
  private store: Store;
  private loginSystem: LoginRewardSystem;
  private audioManager: AudioManager;
  private onDay7Reward: (() => void) | null = null;
  private root: HTMLDivElement | null = null;

  constructor(
    container: HTMLElement,
    store: Store,
    loginSystem: LoginRewardSystem,
    audioManager: AudioManager,
    onDay7Reward?: () => void,
  ) {
    this.container = container;
    this.store = store;
    this.loginSystem = loginSystem;
    this.audioManager = audioManager;
    this.onDay7Reward = onDay7Reward ?? null;
  }

  show(): void {
    if (this.root) return;

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '200',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      padding: '20px',
    });

    // Title
    const title = document.createElement('div');
    title.textContent = 'DAILY REWARDS';
    Object.assign(title.style, {
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffdd57',
      textShadow: '0 0 16px rgba(255,221,87,0.5)',
      marginBottom: '24px',
      letterSpacing: '2px',
    });
    this.root.appendChild(title);

    // Streak counter
    const streak = this.loginSystem.getStreak();
    if (streak > 0) {
      const streakText = document.createElement('div');
      streakText.textContent = `\uD83D\uDD25 ${streak} Day Streak!`;
      Object.assign(streakText.style, {
        fontSize: '16px',
        fontWeight: '700',
        color: '#ff8c00',
        textShadow: '0 0 10px rgba(255,140,0,0.5)',
        marginBottom: '16px',
      });
      this.root.appendChild(streakText);
    }

    // Grid of 7 days
    const grid = document.createElement('div');
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px',
      maxWidth: '340px',
      width: '100%',
    });

    const days = this.loginSystem.getDayRewards();
    for (const day of days) {
      const card = document.createElement('div');
      Object.assign(card.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 8px',
        borderRadius: '12px',
        minHeight: '70px',
        transition: 'transform 0.15s ease',
      });

      if (day.claimed) {
        Object.assign(card.style, {
          background: 'rgba(100,100,100,0.4)',
          border: '2px solid rgba(100,100,100,0.3)',
        });
      } else if (day.claimable) {
        Object.assign(card.style, {
          background: 'rgba(255,221,87,0.2)',
          border: '2px solid rgba(255,221,87,0.6)',
          boxShadow: '0 0 16px rgba(255,221,87,0.3)',
        });
      } else {
        Object.assign(card.style, {
          background: 'rgba(40,40,60,0.6)',
          border: '2px solid rgba(60,60,80,0.4)',
        });
      }

      // Day label
      const dayLabel = document.createElement('div');
      dayLabel.textContent = `Day ${day.dayIndex + 1}`;
      Object.assign(dayLabel.style, {
        fontSize: '11px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        marginBottom: '4px',
      });
      card.appendChild(dayLabel);

      // Amount
      const amountLabel = document.createElement('div');
      amountLabel.textContent = day.claimed ? '\u2713' : `${day.amount}`;
      Object.assign(amountLabel.style, {
        fontSize: day.claimed ? '22px' : '16px',
        fontWeight: '800',
        color: day.claimed ? '#888' : '#ffdd57',
      });
      card.appendChild(amountLabel);

      if (day.claimable) {
        const btn = document.createElement('button');
        btn.textContent = 'CLAIM';
        Object.assign(btn.style, {
          marginTop: '6px',
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: '800',
          background: '#ffdd57',
          color: '#1a1a2e',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
        });
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.claimReward(card, amountLabel, btn);
        });
        card.appendChild(btn);
      } else if (day.locked) {
        const lockIcon = document.createElement('div');
        lockIcon.textContent = '\uD83D\uDD12';
        lockIcon.style.fontSize = '14px';
        lockIcon.style.marginTop = '4px';
        card.appendChild(lockIcon);
      }

      grid.appendChild(card);
    }

    this.root.appendChild(grid);

    // Close button
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
      this.hide();
    });
    this.root.appendChild(closeBtn);

    this.container.appendChild(this.root);
  }

  private claimReward(card: HTMLDivElement, amountLabel: HTMLDivElement, btn: HTMLButtonElement): void {
    const result = this.loginSystem.claim();
    this.store.update({
      coins: this.store.state.coins + result.coins,
      dailyStreak: result.streak,
      jackpotBoostExpiresAt: this.loginSystem.getJackpotBoostExpiresAt(),
    });
    this.audioManager.playDailyReward();

    if (result.isDay7 && this.onDay7Reward) {
      this.onDay7Reward();
    }

    // Update card visual
    Object.assign(card.style, {
      background: 'rgba(100,100,100,0.4)',
      border: '2px solid rgba(100,100,100,0.3)',
      boxShadow: 'none',
    });
    amountLabel.textContent = '\u2713';
    amountLabel.style.color = '#888';
    amountLabel.style.fontSize = '22px';
    btn.remove();
  }

  hide(): void {
    if (this.root) {
      this.root.remove();
      this.root = null;
    }
  }

  isVisible(): boolean {
    return this.root !== null;
  }
}
