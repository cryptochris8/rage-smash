import { Store } from '../game/state';
import { CONFIG } from '../game/config';

export class HUD {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement;
  private coinDisplay: HTMLSpanElement;
  private coinContainer: HTMLDivElement;
  private comboDisplay: HTMLDivElement;
  private muteBtn: HTMLButtonElement;
  private shopBtn: HTMLButtonElement;
  private boostBtn: HTMLButtonElement;
  private boostCountdown: HTMLDivElement;
  private streakBadge: HTMLDivElement;
  private giftBtn: HTMLButtonElement | null = null;
  private giftDot: HTMLDivElement | null = null;
  private unsubscribe: () => void;
  private displayedCoins: number;
  private coinAnimFrom: number = 0;
  private coinAnimTo: number;
  private coinAnimStart: number = 0;
  private coinAnimId: number = 0;

  constructor(
    container: HTMLElement,
    store: Store,
    onShopToggle: () => void,
    onMuteToggle: () => void,
    onDailyToggle?: () => void,
    onGiftToggle?: () => void,
    onBoostToggle?: () => void,
    onSettingsToggle?: () => void,
  ) {
    this.container = container;
    this.store = store;
    this.displayedCoins = store.state.coins;
    this.coinAnimTo = store.state.coins;

    // --- Root overlay ---
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '10',
      pointerEvents: 'none',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    // --- Top-left: Coin counter ---
    const coinContainer = document.createElement('div') as HTMLDivElement;
    this.coinContainer = coinContainer;
    Object.assign(coinContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      padding: `calc(12px + env(safe-area-inset-top, 0px)) 0 0 calc(12px + env(safe-area-inset-left, 0px))`,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'text-shadow 0.3s ease',
    });

    const coinIcon = document.createElement('span');
    coinIcon.textContent = '\uD83E\uDE99';
    coinIcon.style.fontSize = '26px';

    this.coinDisplay = document.createElement('span');
    Object.assign(this.coinDisplay.style, {
      fontSize: '24px',
      fontWeight: '800',
      color: '#ffffff',
      textShadow: '0 2px 6px rgba(0,0,0,0.6)',
      letterSpacing: '0.5px',
    });

    coinContainer.appendChild(coinIcon);
    coinContainer.appendChild(this.coinDisplay);
    this.root.appendChild(coinContainer);

    // --- Top-right: Combo display ---
    this.comboDisplay = document.createElement('div');
    Object.assign(this.comboDisplay.style, {
      position: 'absolute',
      top: '0',
      right: '0',
      padding: `calc(14px + env(safe-area-inset-top, 0px)) calc(14px + env(safe-area-inset-right, 0px)) 0 0`,
      fontSize: '22px',
      fontWeight: '800',
      color: '#ffdd57',
      textShadow: '0 0 8px rgba(255,221,87,0.5), 0 2px 6px rgba(0,0,0,0.6)',
      transition: 'transform 0.15s ease-out, opacity 0.2s ease',
      opacity: '0',
    });
    this.root.appendChild(this.comboDisplay);

    // --- Bottom-left: Mute button ---
    this.muteBtn = document.createElement('button');
    this.muteBtn.textContent = '\uD83D\uDD0A';
    Object.assign(this.muteBtn.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      margin: `0 0 calc(14px + env(safe-area-inset-bottom, 0px)) calc(14px + env(safe-area-inset-left, 0px))`,
      minWidth: '48px',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      background: 'rgba(0,0,0,0.4)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 16px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      transition: 'background 0.15s ease',
    });
    this.muteBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onMuteToggle();
    });
    this.root.appendChild(this.muteBtn);

    // --- Bottom-left: Settings gear (next to mute) ---
    if (onSettingsToggle) {
      const settingsBtn = document.createElement('button');
      settingsBtn.textContent = '\u2699\uFE0F';
      Object.assign(settingsBtn.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        margin: `0 0 calc(14px + env(safe-area-inset-bottom, 0px)) calc(70px + env(safe-area-inset-left, 0px))`,
        minWidth: '48px',
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        background: 'rgba(0,0,0,0.4)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 16px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease',
      });
      settingsBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onSettingsToggle();
      });
      this.root.appendChild(settingsBtn);
    }

    // --- Bottom-right: Gift button (login rewards) ---
    if (onGiftToggle) {
      const giftBtn = document.createElement('button');
      this.giftBtn = giftBtn;
      giftBtn.textContent = '\uD83C\uDF81';
      Object.assign(giftBtn.style, {
        position: 'absolute',
        bottom: '0',
        right: '0',
        margin: `0 calc(200px + env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) 0`,
        minWidth: '48px',
        minHeight: '48px',
        fontSize: '20px',
        background: 'rgba(99,102,241,0.6)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        padding: '10px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease',
      });
      giftBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onGiftToggle();
      });

      // Notification dot
      const dot = document.createElement('div');
      this.giftDot = dot;
      Object.assign(dot.style, {
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: '#ef4444',
        border: '2px solid rgba(0,0,0,0.3)',
        display: 'none',
      });
      giftBtn.style.position = 'absolute'; // ensure positioning context
      giftBtn.appendChild(dot);

      this.root.appendChild(giftBtn);
    }

    // --- Bottom-right: Daily button ---
    if (onDailyToggle) {
      const dailyBtn = document.createElement('button');
      dailyBtn.textContent = 'DAILY';
      Object.assign(dailyBtn.style, {
        position: 'absolute',
        bottom: '0',
        right: '0',
        margin: `0 calc(110px + env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) 0`,
        minWidth: '72px',
        minHeight: '48px',
        fontSize: '14px',
        fontWeight: '800',
        letterSpacing: '1px',
        background: 'rgba(99,102,241,0.6)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        transition: 'background 0.15s ease',
      });
      dailyBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onDailyToggle();
      });
      this.root.appendChild(dailyBtn);
    }

    // --- Bottom-right: Shop button ---
    this.shopBtn = document.createElement('button');
    this.shopBtn.textContent = 'SHOP';
    Object.assign(this.shopBtn.style, {
      position: 'absolute',
      bottom: '0',
      right: '0',
      margin: `0 calc(14px + env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) 0`,
      minWidth: '80px',
      minHeight: '48px',
      fontSize: '16px',
      fontWeight: '800',
      letterSpacing: '1px',
      background: 'rgba(0,0,0,0.4)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      padding: '10px 20px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
      transition: 'background 0.15s ease',
    });
    this.shopBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onShopToggle();
    });
    this.root.appendChild(this.shopBtn);

    // --- 2X Boost button ---
    this.boostBtn = document.createElement('button');
    this.boostBtn.textContent = '2X';
    Object.assign(this.boostBtn.style, {
      position: 'absolute',
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: `calc(14px + env(safe-area-inset-top, 0px))`,
      minWidth: '60px',
      minHeight: '36px',
      fontSize: '14px',
      fontWeight: '900',
      letterSpacing: '1px',
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: '#ffffff',
      border: '2px solid rgba(255,255,255,0.3)',
      borderRadius: '10px',
      padding: '6px 14px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      textShadow: '0 1px 4px rgba(0,0,0,0.4)',
      transition: 'background 0.15s ease, opacity 0.2s ease',
    });
    if (onBoostToggle) {
      this.boostBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        onBoostToggle();
      });
    }
    this.root.appendChild(this.boostBtn);

    // Countdown display (replaces button when active)
    this.boostCountdown = document.createElement('div');
    Object.assign(this.boostCountdown.style, {
      position: 'absolute',
      top: '0',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: `calc(14px + env(safe-area-inset-top, 0px))`,
      fontSize: '14px',
      fontWeight: '900',
      color: '#22c55e',
      textShadow: '0 0 12px rgba(34,197,94,0.5), 0 1px 4px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
      display: 'none',
      letterSpacing: '1px',
    });
    this.root.appendChild(this.boostCountdown);

    // --- Streak badge (below combo area, top-right) ---
    this.streakBadge = document.createElement('div');
    Object.assign(this.streakBadge.style, {
      position: 'absolute',
      top: '0',
      right: '0',
      marginTop: `calc(42px + env(safe-area-inset-top, 0px))`,
      marginRight: `calc(14px + env(safe-area-inset-right, 0px))`,
      fontSize: '13px',
      fontWeight: '800',
      color: '#ff8c00',
      textShadow: '0 0 8px rgba(255,140,0,0.5), 0 1px 4px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
      display: 'none',
    });
    this.root.appendChild(this.streakBadge);

    // Mount
    this.container.appendChild(this.root);

    // Initial render + subscribe
    this.update();
    this.unsubscribe = this.store.subscribe(() => this.update());
  }

  /** Pulse the combo display on increase */
  pulseCombo(): void {
    this.comboDisplay.style.transform = 'scale(1.3)';
    this.comboDisplay.style.textShadow = '0 0 16px rgba(255,221,87,0.8), 0 0 32px rgba(255,221,87,0.4), 0 2px 6px rgba(0,0,0,0.6)';
    setTimeout(() => {
      this.comboDisplay.style.transform = 'scale(1)';
      this.comboDisplay.style.textShadow = '0 0 8px rgba(255,221,87,0.5), 0 2px 6px rgba(0,0,0,0.6)';
    }, 200);
  }

  /** Show/hide gift notification dot */
  setGiftNotification(show: boolean): void {
    if (this.giftDot) {
      this.giftDot.style.display = show ? 'block' : 'none';
    }
  }

  update(): void {
    const { coins, combo, muted, adBoostActive, adBoostRemainingMs, adBoostCooldownMs, starterPackBoostExpiresAt, dailyStreak } = this.store.state;

    // Streak badge
    if (dailyStreak > 0) {
      this.streakBadge.textContent = `\uD83D\uDD25 ${dailyStreak}`;
      this.streakBadge.style.display = 'block';
    } else {
      this.streakBadge.style.display = 'none';
    }

    // Coins (animated roll-up)
    if (coins !== this.coinAnimTo) {
      this.startCoinAnimation(coins);
    }

    // Check starter pack boost
    const starterBoostActive = starterPackBoostExpiresAt > Date.now();
    const anyBoostActive = adBoostActive || starterBoostActive;

    // Coin glow when any boost active
    if (anyBoostActive) {
      this.coinContainer.style.textShadow = '0 0 12px rgba(34,197,94,0.6)';
    } else {
      this.coinContainer.style.textShadow = '';
    }

    // Combo
    if (combo > 1) {
      this.comboDisplay.textContent = `x${combo}`;
      this.comboDisplay.style.opacity = '1';
    } else {
      this.comboDisplay.style.opacity = '0';
      this.comboDisplay.style.transform = 'scale(0.8)';
    }

    // Mute icon
    this.muteBtn.textContent = muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';

    // 2X boost button / countdown
    if (adBoostActive) {
      this.boostBtn.style.display = 'none';
      this.boostCountdown.style.display = 'block';
      const secs = Math.ceil(adBoostRemainingMs / 1000);
      this.boostCountdown.textContent = `2X 0:${secs < 10 ? '0' : ''}${secs}`;
    } else if (starterBoostActive) {
      this.boostBtn.style.display = 'none';
      this.boostCountdown.style.display = 'block';
      const remainMs = starterPackBoostExpiresAt - Date.now();
      const hours = Math.floor(remainMs / 3600000);
      const mins = Math.ceil((remainMs % 3600000) / 60000);
      this.boostCountdown.textContent = `2X ${hours}h${mins}m`;
    } else if (adBoostCooldownMs > 0) {
      // Cooldown state — dim button, show countdown
      this.boostBtn.style.display = 'block';
      this.boostBtn.style.opacity = '0.4';
      this.boostBtn.style.pointerEvents = 'auto';
      const cdSecs = Math.ceil(adBoostCooldownMs / 1000);
      this.boostBtn.textContent = `${cdSecs}s`;
      this.boostCountdown.style.display = 'none';
    } else {
      this.boostBtn.style.display = 'block';
      this.boostBtn.style.opacity = '1';
      this.boostBtn.textContent = '2X';
      this.boostCountdown.style.display = 'none';
    }
  }

  private startCoinAnimation(target: number): void {
    if (this.coinAnimId) cancelAnimationFrame(this.coinAnimId);

    this.coinAnimFrom = this.displayedCoins;
    this.coinAnimTo = target;
    this.coinAnimStart = performance.now();

    const animate = (now: number) => {
      const elapsed = now - this.coinAnimStart;
      const t = Math.min(elapsed / CONFIG.coinCounterDuration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      this.displayedCoins = Math.round(
        this.coinAnimFrom + (this.coinAnimTo - this.coinAnimFrom) * eased,
      );
      this.coinDisplay.textContent = this.displayedCoins.toLocaleString();

      if (t < 1) {
        this.coinAnimId = requestAnimationFrame(animate);
      } else {
        this.coinAnimId = 0;
      }
    };

    this.coinAnimId = requestAnimationFrame(animate);
  }

  dispose(): void {
    this.unsubscribe();
    this.root.remove();
  }
}
