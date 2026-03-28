import { Store } from '../game/state';
import { GameAnalytics } from '../systems/analytics';

export class SettingsUI {
  private container: HTMLElement;
  private store: Store;
  private analytics: GameAnalytics;
  private overlay: HTMLDivElement | null = null;
  private onHapticsToggle: (enabled: boolean) => void;
  private onRemoveAds: () => Promise<boolean>;
  private onRestore: () => Promise<string[]>;

  constructor(
    container: HTMLElement,
    store: Store,
    analytics: GameAnalytics,
    onHapticsToggle: (enabled: boolean) => void,
    onRemoveAds?: () => Promise<boolean>,
    onRestore?: () => Promise<string[]>,
  ) {
    this.container = container;
    this.store = store;
    this.analytics = analytics;
    this.onHapticsToggle = onHapticsToggle;
    this.onRemoveAds = onRemoveAds ?? (async () => false);
    this.onRestore = onRestore ?? (async () => []);
  }

  show(): void {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '200',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      overflowY: 'auto',
      padding: `calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px))`,
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      width: '100%',
      maxWidth: '360px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    });

    const title = document.createElement('div');
    title.textContent = 'SETTINGS';
    Object.assign(title.style, {
      fontSize: '22px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    Object.assign(closeBtn.style, {
      fontSize: '24px',
      background: 'none',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '8px',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
    });
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.overlay.appendChild(header);

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      width: '100%',
      maxWidth: '360px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    });

    // Sound toggle
    const hapticsEnabled = localStorage.getItem('rage-smash-haptics') !== 'off';
    panel.appendChild(this.createToggle('Sound', !this.store.state.muted, (on) => {
      this.store.update({ muted: !on });
    }));

    // Haptics toggle
    panel.appendChild(this.createToggle('Haptics', hapticsEnabled, (on) => {
      localStorage.setItem('rage-smash-haptics', on ? 'on' : 'off');
      this.onHapticsToggle(on);
    }));

    // Remove Ads + Restore (only show on native where ads exist)
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    panel.appendChild(this.createDivider());
    if (!this.store.state.adsRemoved && isNative) {
      const removeAdsBtn = document.createElement('button');
      removeAdsBtn.textContent = 'Remove Ads — $2.99';
      Object.assign(removeAdsBtn.style, {
        width: '100%',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
        color: '#a78bfa',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '10px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
      });
      removeAdsBtn.addEventListener('pointerdown', async (e) => {
        e.stopPropagation();
        removeAdsBtn.textContent = 'Processing...';
        removeAdsBtn.style.pointerEvents = 'none';
        const success = await this.onRemoveAds();
        if (success) {
          removeAdsBtn.textContent = 'Ads Removed';
          removeAdsBtn.style.opacity = '0.5';
        } else {
          removeAdsBtn.textContent = 'Remove Ads — $2.99';
          removeAdsBtn.style.pointerEvents = 'auto';
        }
      });
      panel.appendChild(removeAdsBtn);
    } else {
      const removedLabel = document.createElement('div');
      removedLabel.textContent = 'Ads Removed';
      Object.assign(removedLabel.style, {
        width: '100%',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '700',
        color: 'rgba(139,92,246,0.5)',
        textAlign: 'center',
      });
      panel.appendChild(removedLabel);
    }

    // Restore Purchases button (native only)
    if (!isNative) { /* skip on web */ } else {
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'Restore Purchases';
    Object.assign(restoreBtn.style, {
      width: '100%',
      padding: '12px',
      fontSize: '14px',
      fontWeight: '600',
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.5)',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      marginTop: '8px',
    });
    restoreBtn.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      restoreBtn.textContent = 'Restoring...';
      restoreBtn.style.pointerEvents = 'none';
      const restored = await this.onRestore();
      if (restored.length > 0) {
        restoreBtn.textContent = `Restored: ${restored.join(', ')}`;
      } else {
        restoreBtn.textContent = 'No purchases to restore';
      }
      setTimeout(() => {
        restoreBtn.textContent = 'Restore Purchases';
        restoreBtn.style.pointerEvents = 'auto';
      }, 2000);
    });
    panel.appendChild(restoreBtn);
    } // end isNative

    // Divider
    panel.appendChild(this.createDivider());

    // Stats section
    const stats = this.analytics.getStats();
    panel.appendChild(this.createLabel('STATS'));
    panel.appendChild(this.createStatRow('Sessions', stats.totalSessions.toLocaleString()));
    panel.appendChild(this.createStatRow('Total Smashes', stats.totalSmashes.toLocaleString()));
    panel.appendChild(this.createStatRow('Coins Earned', stats.totalCoinsEarned.toLocaleString()));
    panel.appendChild(this.createStatRow('Best Combo', stats.longestCombo.toLocaleString()));
    panel.appendChild(this.createStatRow('Days Played', stats.daysPlayed.toLocaleString()));
    panel.appendChild(this.createStatRow('Avg Session', `${Math.round(stats.avgSessionSec / 60)}m ${stats.avgSessionSec % 60}s`));

    // Divider
    panel.appendChild(this.createDivider());

    // Links
    panel.appendChild(this.createLabel('ABOUT'));
    panel.appendChild(this.createLink('Privacy Policy', 'privacy.html'));

    // Divider
    panel.appendChild(this.createDivider());

    // Reset progress
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Progress';
    Object.assign(resetBtn.style, {
      width: '100%',
      padding: '14px',
      fontSize: '15px',
      fontWeight: '700',
      background: 'rgba(239,68,68,0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '10px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      marginTop: '8px',
    });
    resetBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.confirmReset();
    });
    panel.appendChild(resetBtn);

    // Version
    const version = document.createElement('div');
    version.textContent = 'Rage Smash v1.1';
    Object.assign(version.style, {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.3)',
      textAlign: 'center',
      marginTop: '16px',
    });
    panel.appendChild(version);

    this.overlay.appendChild(panel);

    // Block taps from reaching the game
    this.overlay.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.container.appendChild(this.overlay);
  }

  hide(): void {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
  }

  isOpen(): boolean {
    return this.overlay !== null;
  }

  private createToggle(label: string, initial: boolean, onChange: (on: boolean) => void): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '14px 16px',
    });

    const lbl = document.createElement('div');
    lbl.textContent = label;
    Object.assign(lbl.style, { fontSize: '15px', color: '#ffffff', fontWeight: '600' });

    const toggle = document.createElement('button');
    let state = initial;
    const updateToggle = () => {
      toggle.textContent = state ? 'ON' : 'OFF';
      Object.assign(toggle.style, {
        background: state ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
        color: state ? '#22c55e' : '#888',
      });
    };
    Object.assign(toggle.style, {
      fontSize: '13px',
      fontWeight: '800',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 14px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      letterSpacing: '1px',
    });
    updateToggle();
    toggle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      state = !state;
      updateToggle();
      onChange(state);
    });

    row.appendChild(lbl);
    row.appendChild(toggle);
    return row;
  }

  private createStatRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 16px',
    });

    const lbl = document.createElement('div');
    lbl.textContent = label;
    Object.assign(lbl.style, { fontSize: '14px', color: 'rgba(255,255,255,0.6)' });

    const val = document.createElement('div');
    val.textContent = value;
    Object.assign(val.style, { fontSize: '14px', color: '#ffffff', fontWeight: '600' });

    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  private createLabel(text: string): HTMLDivElement {
    const lbl = document.createElement('div');
    lbl.textContent = text;
    Object.assign(lbl.style, {
      fontSize: '12px',
      fontWeight: '800',
      color: 'rgba(255,255,255,0.4)',
      letterSpacing: '2px',
      padding: '4px 16px 0',
    });
    return lbl;
  }

  private createDivider(): HTMLDivElement {
    const div = document.createElement('div');
    Object.assign(div.style, {
      height: '1px',
      background: 'rgba(255,255,255,0.08)',
      margin: '8px 0',
    });
    return div;
  }

  private createLink(text: string, href: string): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '14px 16px',
      cursor: 'pointer',
      pointerEvents: 'auto',
    });

    const lbl = document.createElement('div');
    lbl.textContent = text;
    Object.assign(lbl.style, {
      fontSize: '15px',
      color: '#6ea8fe',
      fontWeight: '600',
    });

    row.appendChild(lbl);
    row.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      window.open(href, '_blank');
    });
    return row;
  }

  private confirmReset(): void {
    const confirm = document.createElement('div');
    Object.assign(confirm.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '300',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      gap: '16px',
    });

    const msg = document.createElement('div');
    msg.textContent = 'Reset all progress? This cannot be undone.';
    Object.assign(msg.style, {
      fontSize: '16px',
      color: '#ffffff',
      textAlign: 'center',
      maxWidth: '280px',
    });

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '12px' });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    Object.assign(cancelBtn.style, {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '700',
      background: 'rgba(255,255,255,0.1)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      pointerEvents: 'auto',
    });
    cancelBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      confirm.remove();
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Reset';
    Object.assign(confirmBtn.style, {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: '700',
      background: 'rgba(239,68,68,0.3)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: '10px',
      cursor: 'pointer',
      pointerEvents: 'auto',
    });
    confirmBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      localStorage.removeItem('rage-smash-save');
      localStorage.removeItem('rage-smash-analytics');
      localStorage.removeItem('rage-smash-tutorial-done');
      window.location.reload();
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    confirm.appendChild(msg);
    confirm.appendChild(btnRow);
    confirm.addEventListener('pointerdown', (e) => e.stopPropagation());
    document.body.appendChild(confirm);
  }
}
