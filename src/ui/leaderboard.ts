import { Store } from '../game/state';
import { DailyChallenge } from '../systems/daily';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export class LeaderboardUI {
  private container: HTMLElement;
  private store: Store;
  private daily: DailyChallenge;
  private root: HTMLDivElement;
  private visible = false;

  constructor(container: HTMLElement, store: Store, daily: DailyChallenge) {
    this.container = container;
    this.store = store;
    this.daily = daily;

    // --- Root overlay ---
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '100',
      display: 'none',
      opacity: '0',
      transition: 'opacity 0.25s ease',
      fontFamily: FONT_FAMILY,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });
    this.container.appendChild(this.root);
  }

  show(): void {
    this.visible = true;
    this.rebuild();
    this.root.style.display = 'block';
    void this.root.offsetHeight; // force reflow
    this.root.style.opacity = '1';
  }

  hide(): void {
    this.visible = false;
    this.root.style.opacity = '0';
    const onEnd = () => {
      if (!this.visible) {
        this.root.style.display = 'none';
      }
      this.root.removeEventListener('transitionend', onEnd);
    };
    this.root.addEventListener('transitionend', onEnd);
  }

  dispose(): void {
    this.root.remove();
  }

  // ---------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------

  private rebuild(): void {
    this.root.innerHTML = '';

    // Backdrop
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(10,10,30,0.95)',
    });
    this.root.appendChild(backdrop);

    // Scrollable wrapper
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'absolute',
      inset: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      padding: `calc(16px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(40px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px))`,
    });

    // --- Header ---
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '28px',
    });

    const title = document.createElement('h1');
    title.textContent = 'STATS & RECORDS';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
      textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    Object.assign(closeBtn.style, {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.15s ease',
    });
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    wrapper.appendChild(header);

    // --- Stats Section ---
    wrapper.appendChild(this.createSectionHeading('Player Stats'));

    const statsGrid = document.createElement('div');
    Object.assign(statsGrid.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '32px',
    });

    const { totalSmashes, coins, bestCombo } = this.store.state;

    statsGrid.appendChild(this.createStatRow('Total Smashes', totalSmashes.toLocaleString()));
    statsGrid.appendChild(this.createStatRow('Total Coins Earned', coins.toLocaleString()));
    statsGrid.appendChild(this.createStatRow('Best Combo', `x${bestCombo}`));

    wrapper.appendChild(statsGrid);

    // --- Daily Challenge Records ---
    wrapper.appendChild(this.createSectionHeading('Daily Challenge Records'));

    const allResults = this.daily.getAllResults();
    const sortedByScore = [...allResults].sort((a, b) => b.score - a.score);
    const top10 = sortedByScore.slice(0, 10);

    if (top10.length === 0) {
      const empty = document.createElement('div');
      Object.assign(empty.style, {
        fontSize: '14px',
        fontWeight: '500',
        color: 'rgba(255,255,255,0.4)',
        padding: '20px 0',
        textAlign: 'center',
      });
      empty.textContent = 'No daily challenges completed yet';
      wrapper.appendChild(empty);
    } else {
      // Table header
      const tableHeader = document.createElement('div');
      Object.assign(tableHeader.style, {
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px 8px 14px',
        gap: '8px',
      });

      const hRank = this.createTableHeaderCell('#', '28px', 'left');
      const hDate = this.createTableHeaderCell('Date', '1', 'left');
      const hScore = this.createTableHeaderCell('Score', 'auto', 'right');
      const hTime = this.createTableHeaderCell('Time', '60px', 'right');

      tableHeader.appendChild(hRank);
      tableHeader.appendChild(hDate);
      tableHeader.appendChild(hScore);
      tableHeader.appendChild(hTime);
      wrapper.appendChild(tableHeader);

      // Rows
      const list = document.createElement('div');
      Object.assign(list.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      });

      for (let i = 0; i < top10.length; i++) {
        const r = top10[i];
        const row = document.createElement('div');
        Object.assign(row.style, {
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '10px 14px',
          gap: '8px',
        });

        const rank = document.createElement('span');
        Object.assign(rank.style, {
          fontSize: '14px',
          fontWeight: '800',
          color: 'rgba(255,255,255,0.45)',
          width: '28px',
          textAlign: 'left',
          flexShrink: '0',
        });
        rank.textContent = `${i + 1}.`;

        const date = document.createElement('span');
        Object.assign(date.style, {
          fontSize: '13px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.55)',
          flex: '1',
          textAlign: 'left',
        });
        date.textContent = this.formatDateShort(r.date);

        const score = document.createElement('span');
        Object.assign(score.style, {
          fontSize: '15px',
          fontWeight: '800',
          color: '#ffdd57',
          textAlign: 'right',
          flexShrink: '0',
        });
        score.textContent = r.score.toLocaleString();

        const time = document.createElement('span');
        Object.assign(time.style, {
          fontSize: '13px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.45)',
          width: '60px',
          textAlign: 'right',
          flexShrink: '0',
        });
        time.textContent = this.formatTime(r.timeMs);

        row.appendChild(rank);
        row.appendChild(date);
        row.appendChild(score);
        row.appendChild(time);
        list.appendChild(row);
      }

      wrapper.appendChild(list);
    }

    this.root.appendChild(wrapper);
  }

  private createSectionHeading(text: string): HTMLDivElement {
    const heading = document.createElement('div');
    heading.textContent = text;
    Object.assign(heading.style, {
      fontSize: '13px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '12px',
    });
    return heading;
  }

  private createStatRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '12px 14px',
    });

    const labelEl = document.createElement('span');
    Object.assign(labelEl.style, {
      fontSize: '14px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.65)',
    });
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    Object.assign(valueEl.style, {
      fontSize: '16px',
      fontWeight: '800',
      color: '#ffffff',
    });
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }

  private createTableHeaderCell(text: string, width: string, align: string): HTMLSpanElement {
    const cell = document.createElement('span');
    Object.assign(cell.style, {
      fontSize: '11px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      textAlign: align,
      flexShrink: width === '1' ? '1' : '0',
    });
    if (width === '1') {
      cell.style.flex = '1';
    } else if (width !== 'auto') {
      cell.style.width = width;
    }
    cell.textContent = text;
    return cell;
  }

  /** Format an ISO date string "2026-03-16" to short form "Mar 16" */
  private formatDateShort(isoDate: string): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const parts = isoDate.split('-');
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${months[monthIndex]} ${day}`;
  }

  /** Format milliseconds to "XX.Xs" */
  private formatTime(ms: number): string {
    const seconds = ms / 1000;
    return `${seconds.toFixed(1)}s`;
  }
}
