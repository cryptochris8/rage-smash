import { Store } from '../game/state';
import { DailyChallenge, DailyChallengeResult, CHALLENGE_OBJECT_COUNT } from '../systems/daily';

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export class DailyUI {
  private container: HTMLElement;
  private store: Store;
  private daily: DailyChallenge;
  private root: HTMLDivElement;
  private onStart: () => void;
  private onClose: () => void;

  // Progress bar elements (thin bar at top, always mounted, hidden by default)
  private progressRoot: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressLabel: HTMLSpanElement;
  private progressScore: HTMLSpanElement;

  constructor(
    container: HTMLElement,
    store: Store,
    daily: DailyChallenge,
    onStart: () => void,
    onClose: () => void,
  ) {
    this.container = container;
    this.store = store;
    this.daily = daily;
    this.onStart = onStart;
    this.onClose = onClose;

    // --- Full-screen overlay root (for start & results screens) ---
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

    // --- Progress bar root (thin top bar, separate from overlay) ---
    this.progressRoot = document.createElement('div');
    Object.assign(this.progressRoot.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '20',
      display: 'none',
      fontFamily: FONT_FAMILY,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      pointerEvents: 'none',
      padding: `calc(8px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-right, 0px)) 8px calc(12px + env(safe-area-inset-left, 0px))`,
    });

    // Progress inner container (label + bar + score)
    const progressInner = document.createElement('div');
    Object.assign(progressInner.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    });

    this.progressLabel = document.createElement('span');
    Object.assign(this.progressLabel.style, {
      fontSize: '13px',
      fontWeight: '800',
      color: '#ffffff',
      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });

    const barTrack = document.createElement('div');
    Object.assign(barTrack.style, {
      flex: '1',
      height: '6px',
      borderRadius: '3px',
      background: 'rgba(255,255,255,0.15)',
      overflow: 'hidden',
    });

    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      height: '100%',
      width: '0%',
      borderRadius: '3px',
      background: 'linear-gradient(90deg, #22c55e, #4ade80)',
      transition: 'width 0.25s ease',
    });
    barTrack.appendChild(this.progressBar);

    this.progressScore = document.createElement('span');
    Object.assign(this.progressScore.style, {
      fontSize: '13px',
      fontWeight: '800',
      color: '#ffdd57',
      textShadow: '0 1px 4px rgba(0,0,0,0.6)',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });

    progressInner.appendChild(this.progressLabel);
    progressInner.appendChild(barTrack);
    progressInner.appendChild(this.progressScore);
    this.progressRoot.appendChild(progressInner);
    this.container.appendChild(this.progressRoot);
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------

  /** Show the pre-challenge start screen */
  show(): void {
    this.buildStartScreen();
    this.root.style.display = 'block';
    void this.root.offsetHeight; // force reflow
    this.root.style.opacity = '1';
  }

  /** Hide the full-screen overlay */
  hide(): void {
    this.root.style.opacity = '0';
    const onEnd = () => {
      this.root.style.display = 'none';
      this.root.removeEventListener('transitionend', onEnd);
    };
    this.root.addEventListener('transitionend', onEnd);
    // Also hide progress bar
    this.progressRoot.style.display = 'none';
  }

  /** Show the results screen after challenge completion */
  showResults(result: DailyChallengeResult): void {
    // Hide the progress bar
    this.progressRoot.style.display = 'none';

    this.buildResultsScreen(result);
    this.root.style.display = 'block';
    void this.root.offsetHeight;
    this.root.style.opacity = '1';
  }

  /** Update the thin progress bar during the challenge */
  updateProgress(index: number, total: number, score: number): void {
    this.progressRoot.style.display = 'block';
    this.progressLabel.textContent = `${index} / ${total}`;
    this.progressBar.style.width = `${(index / total) * 100}%`;
    this.progressScore.textContent = `\uD83E\uDE99 ${score}`;
  }

  /** Remove all DOM elements */
  dispose(): void {
    this.root.remove();
    this.progressRoot.remove();
  }

  // ---------------------------------------------------------------
  // Private — Start screen
  // ---------------------------------------------------------------

  private buildStartScreen(): void {
    this.root.innerHTML = '';

    // Backdrop
    this.root.appendChild(this.createBackdrop());

    // Scrollable wrapper
    const wrapper = this.createScrollWrapper();

    // Close button (top-right)
    const closeBtn = this.createCloseButton(() => {
      this.hideAndNotify();
    });
    wrapper.appendChild(closeBtn);

    // Centered content
    const center = document.createElement('div');
    Object.assign(center.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      textAlign: 'center',
      padding: '60px 0',
    });

    // Title
    const title = document.createElement('h1');
    title.textContent = 'DAILY CHALLENGE';
    Object.assign(title.style, {
      margin: '0 0 8px 0',
      fontSize: '30px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    });
    center.appendChild(title);

    // Subtitle — today's date
    const subtitle = document.createElement('div');
    subtitle.textContent = this.formatDateLong(new Date());
    Object.assign(subtitle.style, {
      fontSize: '16px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.55)',
      marginBottom: '20px',
    });
    center.appendChild(subtitle);

    // Description
    const desc = document.createElement('div');
    desc.textContent = `Smash ${CHALLENGE_OBJECT_COUNT} objects as fast as you can!`;
    Object.assign(desc.style, {
      fontSize: '15px',
      fontWeight: '500',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '32px',
      lineHeight: '1.4',
      maxWidth: '280px',
    });
    center.appendChild(desc);

    const todayResult = this.daily.getTodayResult();

    if (todayResult && todayResult.completed) {
      // Already completed today — show result + PLAY AGAIN
      center.appendChild(this.buildTodayResultCard(todayResult));

      const playAgainBtn = this.createPrimaryButton('PLAY AGAIN');
      playAgainBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.hideOverlayInstant();
        this.onStart();
      });
      center.appendChild(playAgainBtn);
    } else {
      // Not yet completed — show START
      const startBtn = this.createPrimaryButton('START');
      startBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.hideOverlayInstant();
        this.onStart();
      });
      center.appendChild(startBtn);
    }

    wrapper.appendChild(center);
    this.root.appendChild(wrapper);
  }

  private buildTodayResultCard(result: DailyChallengeResult): HTMLDivElement {
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '14px',
      padding: '18px 24px',
      marginBottom: '24px',
      minWidth: '220px',
    });

    const scoreRow = document.createElement('div');
    Object.assign(scoreRow.style, {
      fontSize: '14px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '6px',
    });
    scoreRow.textContent = 'TODAY\'S SCORE';
    card.appendChild(scoreRow);

    const scoreVal = document.createElement('div');
    Object.assign(scoreVal.style, {
      fontSize: '32px',
      fontWeight: '900',
      color: '#ffdd57',
      textShadow: '0 2px 8px rgba(255,221,87,0.3)',
      marginBottom: '10px',
    });
    scoreVal.textContent = result.score.toLocaleString();
    card.appendChild(scoreVal);

    const timeRow = document.createElement('div');
    Object.assign(timeRow.style, {
      fontSize: '15px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.65)',
    });
    timeRow.textContent = `Time: ${this.formatTime(result.timeMs)}`;
    card.appendChild(timeRow);

    return card;
  }

  // ---------------------------------------------------------------
  // Private — Results screen
  // ---------------------------------------------------------------

  private buildResultsScreen(result: DailyChallengeResult): void {
    this.root.innerHTML = '';

    // Backdrop
    this.root.appendChild(this.createBackdrop());

    // Scrollable wrapper
    const wrapper = this.createScrollWrapper();

    // Centered content
    const center = document.createElement('div');
    Object.assign(center.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '60px 0 40px 0',
    });

    // Title
    const title = document.createElement('h1');
    title.textContent = 'CHALLENGE COMPLETE!';
    Object.assign(title.style, {
      margin: '0 0 24px 0',
      fontSize: '26px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
    });
    center.appendChild(title);

    // Score
    const scoreLabel = document.createElement('div');
    Object.assign(scoreLabel.style, {
      fontSize: '13px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '4px',
    });
    scoreLabel.textContent = 'SCORE';
    center.appendChild(scoreLabel);

    const scoreVal = document.createElement('div');
    Object.assign(scoreVal.style, {
      fontSize: '48px',
      fontWeight: '900',
      color: '#ffdd57',
      textShadow: '0 0 20px rgba(255,221,87,0.4), 0 2px 8px rgba(0,0,0,0.5)',
      marginBottom: '8px',
    });
    scoreVal.textContent = result.score.toLocaleString();
    center.appendChild(scoreVal);

    // Time
    const timeVal = document.createElement('div');
    Object.assign(timeVal.style, {
      fontSize: '20px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '16px',
    });
    timeVal.textContent = this.formatTime(result.timeMs);
    center.appendChild(timeVal);

    // Check if new best
    const allResults = this.daily.getAllResults();
    const sortedByScore = [...allResults].sort((a, b) => b.score - a.score);
    const isNewBest = sortedByScore.length > 0 && sortedByScore[0].date === result.date && sortedByScore[0].score === result.score;

    if (isNewBest) {
      const badge = document.createElement('div');
      badge.textContent = 'NEW BEST!';
      Object.assign(badge.style, {
        display: 'inline-block',
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        color: '#ffffff',
        fontWeight: '900',
        fontSize: '14px',
        letterSpacing: '1.5px',
        padding: '8px 20px',
        borderRadius: '20px',
        marginBottom: '24px',
        textShadow: '0 1px 3px rgba(0,0,0,0.3)',
      });
      center.appendChild(badge);
    } else {
      // Spacer
      const spacer = document.createElement('div');
      spacer.style.marginBottom = '24px';
      center.appendChild(spacer);
    }

    // Top 5 best scores
    const top5 = sortedByScore.slice(0, 5);
    if (top5.length > 0) {
      const recordsHeading = document.createElement('div');
      Object.assign(recordsHeading.style, {
        fontSize: '13px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '12px',
      });
      recordsHeading.textContent = 'TOP SCORES';
      center.appendChild(recordsHeading);

      const list = document.createElement('div');
      Object.assign(list.style, {
        width: '100%',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '28px',
      });

      for (let i = 0; i < top5.length; i++) {
        const r = top5[i];
        const row = document.createElement('div');
        Object.assign(row.style, {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: r.date === result.date && r.score === result.score
            ? 'rgba(255,221,87,0.1)'
            : 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '10px 14px',
        });

        const rank = document.createElement('span');
        Object.assign(rank.style, {
          fontSize: '14px',
          fontWeight: '800',
          color: 'rgba(255,255,255,0.45)',
          width: '24px',
          textAlign: 'left',
        });
        rank.textContent = `${i + 1}.`;

        const date = document.createElement('span');
        Object.assign(date.style, {
          fontSize: '13px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.55)',
          flex: '1',
          textAlign: 'left',
          paddingLeft: '4px',
        });
        date.textContent = this.formatDateShort(r.date);

        const score = document.createElement('span');
        Object.assign(score.style, {
          fontSize: '15px',
          fontWeight: '800',
          color: '#ffdd57',
          marginRight: '12px',
        });
        score.textContent = r.score.toLocaleString();

        const time = document.createElement('span');
        Object.assign(time.style, {
          fontSize: '13px',
          fontWeight: '600',
          color: 'rgba(255,255,255,0.45)',
        });
        time.textContent = this.formatTime(r.timeMs);

        row.appendChild(rank);
        row.appendChild(date);
        row.appendChild(score);
        row.appendChild(time);
        list.appendChild(row);
      }

      center.appendChild(list);
    }

    // Close button
    const closeBtn = this.createSecondaryButton('CLOSE');
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hideAndNotify();
    });
    center.appendChild(closeBtn);

    wrapper.appendChild(center);
    this.root.appendChild(wrapper);
  }

  // ---------------------------------------------------------------
  // Private — Shared helpers
  // ---------------------------------------------------------------

  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement('div');
    Object.assign(backdrop.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(10,10,30,0.95)',
    });
    return backdrop;
  }

  private createScrollWrapper(): HTMLDivElement {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'absolute',
      inset: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      padding: `calc(16px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(40px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px))`,
    });
    return wrapper;
  }

  private createCloseButton(onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '\u2715';
    Object.assign(btn.style, {
      position: 'absolute',
      top: `calc(12px + env(safe-area-inset-top, 0px))`,
      right: `calc(12px + env(safe-area-inset-right, 0px))`,
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
      zIndex: '2',
    });
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private createPrimaryButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      background: '#22c55e',
      color: '#ffffff',
      border: 'none',
      borderRadius: '14px',
      padding: '14px 48px',
      fontSize: '18px',
      fontWeight: '900',
      letterSpacing: '2px',
      cursor: 'pointer',
      minWidth: '180px',
      minHeight: '52px',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.12s ease, transform 0.1s ease',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    });
    return btn;
  }

  private createSecondaryButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      background: 'rgba(255,255,255,0.1)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 36px',
      fontSize: '15px',
      fontWeight: '800',
      letterSpacing: '1.5px',
      cursor: 'pointer',
      minWidth: '140px',
      minHeight: '48px',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.12s ease',
    });
    return btn;
  }

  /** Hide the overlay instantly (no fade) for transitioning to gameplay */
  private hideOverlayInstant(): void {
    this.root.style.display = 'none';
    this.root.style.opacity = '0';
  }

  /** Hide with fade and call onClose */
  private hideAndNotify(): void {
    this.hide();
    this.onClose();
  }

  // ---------------------------------------------------------------
  // Private — Formatting
  // ---------------------------------------------------------------

  /** Format a Date to a nice long string like "March 16, 2026" */
  private formatDateLong(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
