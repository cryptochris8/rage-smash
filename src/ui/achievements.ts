import { Store } from '../game/state';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  type AchievementDef,
} from '../systems/achievements';

export class AchievementsUI {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement | null = null;

  constructor(container: HTMLElement, store: Store) {
    this.container = container;
    this.store = store;
  }

  show(): void {
    if (this.root) return;

    const state = this.store.state;
    const unlocked = new Set(state.unlockedAchievements);
    const totalUnlocked = unlocked.size;
    const total = ACHIEVEMENTS.length;
    const percent = total === 0 ? 0 : Math.round((totalUnlocked / total) * 100);

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '220',
      background: 'rgba(0,0,0,0.88)',
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
      maxWidth: '420px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    });

    const title = document.createElement('div');
    title.textContent = 'ACHIEVEMENTS';
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
    this.root.appendChild(header);

    // Progress summary
    const progress = document.createElement('div');
    progress.textContent = `${totalUnlocked} / ${total} unlocked \u2022 ${percent}%`;
    Object.assign(progress.style, {
      width: '100%',
      maxWidth: '420px',
      fontSize: '13px',
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '700',
      letterSpacing: '1px',
      marginBottom: '8px',
    });
    this.root.appendChild(progress);

    const barBg = document.createElement('div');
    Object.assign(barBg.style, {
      width: '100%',
      maxWidth: '420px',
      height: '6px',
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '999px',
      overflow: 'hidden',
      marginBottom: '20px',
    });
    const barFill = document.createElement('div');
    Object.assign(barFill.style, {
      width: `${percent}%`,
      height: '100%',
      background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
      borderRadius: '999px',
    });
    barBg.appendChild(barFill);
    this.root.appendChild(barBg);

    // Grouped list
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      width: '100%',
      maxWidth: '420px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    });

    for (const cat of ACHIEVEMENT_CATEGORIES) {
      const inCat = ACHIEVEMENTS.filter((a) => a.category === cat.id);
      if (inCat.length === 0) continue;

      const heading = document.createElement('div');
      heading.textContent = cat.label;
      Object.assign(heading.style, {
        fontSize: '13px',
        fontWeight: '800',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: '2px',
        marginBottom: '8px',
      });

      const section = document.createElement('div');
      section.appendChild(heading);

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

      for (const ach of inCat) {
        const metric = ach.metric(state);
        const done = unlocked.has(ach.id);
        list.appendChild(this.createRow(ach, metric, done));
      }

      section.appendChild(list);
      panel.appendChild(section);
    }

    this.root.appendChild(panel);

    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.container.appendChild(this.root);
  }

  hide(): void {
    if (!this.root) return;
    this.root.remove();
    this.root = null;
  }

  isOpen(): boolean {
    return this.root !== null;
  }

  private createRow(ach: AchievementDef, metric: number, done: boolean): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: done ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
      border: done ? '1px solid rgba(255,215,0,0.45)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '12px',
    });

    // Icon tile
    const icon = document.createElement('div');
    icon.textContent = ach.icon;
    Object.assign(icon.style, {
      fontSize: '26px',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      background: done ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)',
      filter: done ? 'none' : 'grayscale(1) opacity(0.5)',
      flexShrink: '0',
    });

    const body = document.createElement('div');
    Object.assign(body.style, { flex: '1', minWidth: '0' });

    const topRow = document.createElement('div');
    Object.assign(topRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' });

    const name = document.createElement('div');
    name.textContent = ach.name;
    Object.assign(name.style, {
      fontSize: '15px',
      fontWeight: '800',
      color: done ? '#ffd700' : '#ffffff',
      letterSpacing: '0.5px',
    });

    const reward = document.createElement('div');
    reward.textContent = done ? '\u2713 CLAIMED' : `+${ach.reward.toLocaleString()}`;
    Object.assign(reward.style, {
      fontSize: '11px',
      fontWeight: '800',
      color: done ? '#22c55e' : '#ffdd57',
      letterSpacing: '1px',
      flexShrink: '0',
    });

    topRow.appendChild(name);
    topRow.appendChild(reward);

    const desc = document.createElement('div');
    desc.textContent = ach.description;
    Object.assign(desc.style, {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.55)',
      marginTop: '3px',
    });

    body.appendChild(topRow);
    body.appendChild(desc);

    // Progress bar for locked achievements
    if (!done) {
      const clamped = Math.min(metric, ach.threshold);
      const pct = ach.threshold === 0 ? 0 : Math.round((clamped / ach.threshold) * 100);
      const barWrap = document.createElement('div');
      Object.assign(barWrap.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '6px',
      });

      const pbg = document.createElement('div');
      Object.assign(pbg.style, {
        flex: '1',
        height: '4px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '999px',
        overflow: 'hidden',
      });
      const pfill = document.createElement('div');
      Object.assign(pfill.style, {
        width: `${pct}%`,
        height: '100%',
        background: 'rgba(255,221,87,0.6)',
      });
      pbg.appendChild(pfill);

      const pLabel = document.createElement('div');
      pLabel.textContent = `${clamped.toLocaleString()} / ${ach.threshold.toLocaleString()}`;
      Object.assign(pLabel.style, {
        fontSize: '10px',
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '700',
        letterSpacing: '0.5px',
      });

      barWrap.appendChild(pbg);
      barWrap.appendChild(pLabel);
      body.appendChild(barWrap);
    }

    row.appendChild(icon);
    row.appendChild(body);
    return row;
  }
}
