import type { GoalProgress } from '../systems/session-goals';
import type { ChallengeProgress } from '../systems/retention-challenges';
import type { FeaturedEvent } from '../systems/events';
import type { Store } from '../game/state';
import { ROOMS } from '../content/rooms';
import { HAMMER_SKINS } from '../content/skins';
import { PACKS } from '../content/packs';

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
};

export class GoalsPanel {
  private container: HTMLElement;
  private store: Store | null = null;
  private root: HTMLDivElement;
  private goalsList: HTMLDivElement;
  private challengesList: HTMLDivElement;
  private eventBanner: HTMLDivElement;
  private unlocksList: HTMLDivElement;
  private expanded: boolean = false;
  private pill: HTMLDivElement;
  private panel: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private onClaimGoal: ((id: string) => void) | null = null;
  private onClaimChallenge: ((id: string) => void) | null = null;

  // Track latest data for re-renders
  private lastGoals: GoalProgress[] = [];
  private lastChallenges: ChallengeProgress[] = [];
  private lastEvent: FeaturedEvent | null = null;

  constructor(
    container: HTMLElement,
    store: Store,
    onClaimGoal?: (id: string) => void,
    onClaimChallenge?: (id: string) => void,
  ) {
    this.container = container;
    this.store = store;
    this.onClaimGoal = onClaimGoal ?? null;
    this.onClaimChallenge = onClaimChallenge ?? null;

    // --- Root wrapper (always present) ---
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '15',
      pointerEvents: 'none',
      fontFamily: FONT_STACK,
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    // --- Collapsed pill / chip ---
    this.pill = document.createElement('div');
    Object.assign(this.pill.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      margin: `0 0 calc(72px + env(safe-area-inset-bottom, 0px)) calc(14px + env(safe-area-inset-left, 0px))`,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '20px',
      padding: '8px 14px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      transition: 'transform 0.15s ease, background 0.15s ease',
      minHeight: '44px',
      boxSizing: 'border-box',
    });
    this.pill.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.expand();
    });
    this.root.appendChild(this.pill);

    // Pill icon
    const pillIcon = document.createElement('span');
    pillIcon.textContent = '\u2605'; // star
    Object.assign(pillIcon.style, {
      fontSize: '14px',
      color: '#ffd700',
    });
    this.pill.appendChild(pillIcon);

    // Pill text (will be updated)
    const pillText = document.createElement('span');
    pillText.setAttribute('data-role', 'pill-text');
    Object.assign(pillText.style, {
      fontSize: '12px',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '0.5px',
    });
    pillText.textContent = 'Goals 0/0';
    this.pill.appendChild(pillText);

    // --- Backdrop for expanded state ---
    this.backdrop = document.createElement('div');
    Object.assign(this.backdrop.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(0,0,0,0.4)',
      display: 'none',
      pointerEvents: 'auto',
    });
    this.backdrop.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.collapse();
    });
    this.root.appendChild(this.backdrop);

    // --- Expanded panel ---
    this.panel = document.createElement('div');
    Object.assign(this.panel.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      margin: `0 0 calc(72px + env(safe-area-inset-bottom, 0px)) calc(14px + env(safe-area-inset-left, 0px))`,
      maxWidth: '280px',
      width: '280px',
      background: 'rgba(0,0,0,0.85)',
      borderRadius: '14px',
      padding: '0',
      display: 'none',
      pointerEvents: 'auto',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.08)',
      transform: 'translateY(10px) scale(0.95)',
      opacity: '0',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
      maxHeight: 'calc(100vh - 160px)',
      overflowY: 'auto',
    });
    this.root.appendChild(this.panel);

    // --- Panel header with close ---
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px 8px 14px',
    });

    const headerTitle = document.createElement('div');
    headerTitle.textContent = 'GOALS & CHALLENGES';
    Object.assign(headerTitle.style, {
      fontSize: '11px',
      fontWeight: '800',
      color: 'rgba(255,255,255,0.5)',
      letterSpacing: '1.5px',
    });
    header.appendChild(headerTitle);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    Object.assign(closeBtn.style, {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.4)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      pointerEvents: 'auto',
      minWidth: '44px',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      margin: '-8px -8px -4px 0',
      WebkitTapHighlightColor: 'transparent',
    });
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.collapse();
    });
    header.appendChild(closeBtn);
    this.panel.appendChild(header);

    // --- Event banner ---
    this.eventBanner = document.createElement('div');
    Object.assign(this.eventBanner.style, {
      display: 'none',
      padding: '8px 14px',
      margin: '0 10px 8px 10px',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
      border: '1px solid rgba(139,92,246,0.3)',
    });
    this.panel.appendChild(this.eventBanner);

    // --- Next unlocks section ---
    const unlocksHeader = this.createSectionHeader('NEXT UNLOCKS');
    this.panel.appendChild(unlocksHeader);

    this.unlocksList = document.createElement('div');
    Object.assign(this.unlocksList.style, {
      padding: '0 10px 4px 10px',
    });
    this.panel.appendChild(this.unlocksList);

    // --- Session goals section ---
    const goalsSection = this.createSectionHeader('SESSION GOALS');
    this.panel.appendChild(goalsSection);

    this.goalsList = document.createElement('div');
    Object.assign(this.goalsList.style, {
      padding: '0 10px 4px 10px',
    });
    this.panel.appendChild(this.goalsList);

    // --- Daily challenges section ---
    const challengesSection = this.createSectionHeader('DAILY CHALLENGES');
    this.panel.appendChild(challengesSection);

    this.challengesList = document.createElement('div');
    Object.assign(this.challengesList.style, {
      padding: '0 10px 10px 10px',
    });
    this.panel.appendChild(this.challengesList);

    // Mount
    this.container.appendChild(this.root);
  }

  private createSectionHeader(text: string): HTMLDivElement {
    const section = document.createElement('div');
    Object.assign(section.style, {
      padding: '6px 14px 4px 14px',
      fontSize: '10px',
      fontWeight: '800',
      color: 'rgba(255,255,255,0.35)',
      letterSpacing: '1.5px',
    });
    section.textContent = text;
    return section;
  }

  /** Update all panel content with latest data. */
  update(
    goals: GoalProgress[],
    challenges: ChallengeProgress[],
    event: FeaturedEvent,
  ): void {
    this.lastGoals = goals;
    this.lastChallenges = challenges;
    this.lastEvent = event;

    // --- Update pill text ---
    const completed = goals.filter((g) => g.completed || g.claimed).length;
    const pillText = this.pill.querySelector(
      '[data-role="pill-text"]',
    ) as HTMLSpanElement;
    if (pillText) {
      pillText.textContent = `Goals ${completed}/${goals.length}`;
    }

    // Add a subtle glow if there are claimable items
    const hasClaimable =
      goals.some((g) => g.completed && !g.claimed) ||
      challenges.some((c) => c.completed && !c.claimed);
    if (hasClaimable) {
      this.pill.style.boxShadow = '0 0 12px rgba(255,215,0,0.4)';
      this.pill.style.border = '1px solid rgba(255,215,0,0.3)';
    } else {
      this.pill.style.boxShadow = 'none';
      this.pill.style.border = '1px solid transparent';
    }

    // --- Update event banner ---
    if (event) {
      this.eventBanner.style.display = 'block';
      this.eventBanner.innerHTML = '';

      const evtName = document.createElement('div');
      evtName.textContent = event.name;
      Object.assign(evtName.style, {
        fontSize: '13px',
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: '2px',
      });
      this.eventBanner.appendChild(evtName);

      const evtDesc = document.createElement('div');
      evtDesc.textContent = event.description;
      Object.assign(evtDesc.style, {
        fontSize: '11px',
        fontWeight: '500',
        color: 'rgba(255,255,255,0.7)',
      });
      this.eventBanner.appendChild(evtDesc);
    } else {
      this.eventBanner.style.display = 'none';
    }

    // --- Render unlock progress ---
    this.unlocksList.innerHTML = '';
    const nextUnlocks = this.getNextUnlocks();
    for (const item of nextUnlocks) {
      this.unlocksList.appendChild(this.createUnlockRow(item));
    }
    if (nextUnlocks.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'All items unlocked!';
      Object.assign(empty.style, {
        fontSize: '11px',
        color: 'rgba(255,215,0,0.4)',
        padding: '8px 4px',
        textAlign: 'center',
      });
      this.unlocksList.appendChild(empty);
    }

    // --- Render goals ---
    this.goalsList.innerHTML = '';
    for (const goal of goals) {
      this.goalsList.appendChild(this.createGoalRow(goal));
    }
    if (goals.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No active goals';
      Object.assign(empty.style, {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        padding: '8px 4px',
        textAlign: 'center',
      });
      this.goalsList.appendChild(empty);
    }

    // --- Render challenges ---
    this.challengesList.innerHTML = '';
    for (const challenge of challenges) {
      this.challengesList.appendChild(this.createChallengeRow(challenge));
    }
    if (challenges.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No active challenges';
      Object.assign(empty.style, {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        padding: '8px 4px',
        textAlign: 'center',
      });
      this.challengesList.appendChild(empty);
    }
  }

  private createGoalRow(goal: GoalProgress): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      marginBottom: '4px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.04)',
      minHeight: '36px',
      boxSizing: 'border-box',
    });

    // Left: label + progress bar
    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.minWidth = '0';

    const label = document.createElement('div');
    label.textContent = goal.label;
    Object.assign(label.style, {
      fontSize: '11px',
      fontWeight: '600',
      color: goal.claimed ? 'rgba(255,255,255,0.35)' : '#ffffff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '3px',
    });
    info.appendChild(label);

    // Progress bar
    const barContainer = document.createElement('div');
    Object.assign(barContainer.style, {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
    });

    const barFill = document.createElement('div');
    const progress = Math.min(goal.current / goal.target, 1);
    Object.assign(barFill.style, {
      width: `${progress * 100}%`,
      height: '100%',
      borderRadius: '2px',
      background: goal.completed ? '#22c55e' : '#6366f1',
      transition: 'width 0.3s ease',
    });
    barContainer.appendChild(barFill);
    info.appendChild(barContainer);

    row.appendChild(info);

    // Progress text
    const progressText = document.createElement('div');
    progressText.textContent = `${Math.min(goal.current, goal.target)}/${goal.target}`;
    Object.assign(progressText.style, {
      fontSize: '10px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.4)',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });
    row.appendChild(progressText);

    // Right: reward or claim button
    if (goal.claimed) {
      const check = document.createElement('div');
      check.textContent = '\u2713';
      Object.assign(check.style, {
        fontSize: '14px',
        color: '#22c55e',
        fontWeight: '800',
        flexShrink: '0',
        width: '36px',
        textAlign: 'center',
      });
      row.appendChild(check);
    } else if (goal.completed) {
      const claimBtn = document.createElement('button');
      claimBtn.textContent = 'CLAIM';
      Object.assign(claimBtn.style, {
        fontSize: '10px',
        fontWeight: '800',
        color: '#ffffff',
        background: '#22c55e',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 10px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        flexShrink: '0',
        minWidth: '44px',
        minHeight: '28px',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
      });
      claimBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (this.onClaimGoal) this.onClaimGoal(goal.id);
      });
      row.appendChild(claimBtn);
    } else {
      const reward = document.createElement('div');
      reward.textContent = `\uD83E\uDE99${goal.reward}`;
      Object.assign(reward.style, {
        fontSize: '11px',
        fontWeight: '700',
        color: '#ffd700',
        flexShrink: '0',
        whiteSpace: 'nowrap',
      });
      row.appendChild(reward);
    }

    return row;
  }

  private createChallengeRow(challenge: ChallengeProgress): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      marginBottom: '4px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.04)',
      minHeight: '36px',
      boxSizing: 'border-box',
    });

    // Difficulty badge
    const badge = document.createElement('div');
    const diffColor = DIFFICULTY_COLORS[challenge.difficulty] ?? '#6366f1';
    badge.textContent = challenge.difficulty.charAt(0).toUpperCase();
    Object.assign(badge.style, {
      fontSize: '9px',
      fontWeight: '900',
      color: diffColor,
      background: `${diffColor}22`,
      border: `1px solid ${diffColor}44`,
      borderRadius: '4px',
      padding: '2px 5px',
      flexShrink: '0',
      lineHeight: '1.2',
      textTransform: 'uppercase',
    });
    row.appendChild(badge);

    // Label + progress bar
    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.minWidth = '0';

    const label = document.createElement('div');
    label.textContent = challenge.label;
    Object.assign(label.style, {
      fontSize: '11px',
      fontWeight: '600',
      color: challenge.claimed ? 'rgba(255,255,255,0.35)' : '#ffffff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '3px',
    });
    info.appendChild(label);

    const barContainer = document.createElement('div');
    Object.assign(barContainer.style, {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
    });

    const barFill = document.createElement('div');
    const progress = Math.min(challenge.current / challenge.target, 1);
    Object.assign(barFill.style, {
      width: `${progress * 100}%`,
      height: '100%',
      borderRadius: '2px',
      background: challenge.completed ? '#22c55e' : diffColor,
      transition: 'width 0.3s ease',
    });
    barContainer.appendChild(barFill);
    info.appendChild(barContainer);

    row.appendChild(info);

    // Progress count
    const progressText = document.createElement('div');
    progressText.textContent = `${Math.min(challenge.current, challenge.target)}/${challenge.target}`;
    Object.assign(progressText.style, {
      fontSize: '10px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.4)',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });
    row.appendChild(progressText);

    // Right: claim/reward/check
    if (challenge.claimed) {
      const check = document.createElement('div');
      check.textContent = '\u2713';
      Object.assign(check.style, {
        fontSize: '14px',
        color: '#22c55e',
        fontWeight: '800',
        flexShrink: '0',
        width: '36px',
        textAlign: 'center',
      });
      row.appendChild(check);
    } else if (challenge.completed) {
      const claimBtn = document.createElement('button');
      claimBtn.textContent = 'CLAIM';
      Object.assign(claimBtn.style, {
        fontSize: '10px',
        fontWeight: '800',
        color: '#ffffff',
        background: '#22c55e',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 10px',
        cursor: 'pointer',
        pointerEvents: 'auto',
        flexShrink: '0',
        minWidth: '44px',
        minHeight: '28px',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
      });
      claimBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (this.onClaimChallenge) this.onClaimChallenge(challenge.id);
      });
      row.appendChild(claimBtn);
    } else {
      const reward = document.createElement('div');
      reward.textContent = `\uD83E\uDE99${challenge.reward}`;
      Object.assign(reward.style, {
        fontSize: '11px',
        fontWeight: '700',
        color: '#ffd700',
        flexShrink: '0',
        whiteSpace: 'nowrap',
      });
      row.appendChild(reward);
    }

    return row;
  }

  private getNextUnlocks(): { name: string; cost: number; progress: number }[] {
    if (!this.store) return [];
    const { coins, unlockedRooms, unlockedHammers, unlockedPacks } = this.store.state;
    const items: { name: string; cost: number; progress: number }[] = [];

    for (const room of ROOMS) {
      if (room.cost > 0 && !unlockedRooms.includes(room.id)) {
        items.push({ name: room.name, cost: room.cost, progress: Math.min(coins / room.cost, 1) });
      }
    }
    for (const skin of HAMMER_SKINS) {
      if (skin.cost > 0 && !skin.exclusive && !unlockedHammers.includes(skin.id)) {
        items.push({ name: skin.name, cost: skin.cost, progress: Math.min(coins / skin.cost, 1) });
      }
    }
    for (const pack of PACKS) {
      if (pack.cost > 0 && !unlockedPacks.includes(pack.id)) {
        items.push({ name: pack.name, cost: pack.cost, progress: Math.min(coins / pack.cost, 1) });
      }
    }

    // Sort by progress ratio descending (closest to unlock first), take top 2
    items.sort((a, b) => b.progress - a.progress);
    return items.slice(0, 2);
  }

  private createUnlockRow(item: { name: string; cost: number; progress: number }): HTMLDivElement {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      marginBottom: '4px',
      borderRadius: '8px',
      background: 'rgba(255,215,0,0.06)',
      border: '1px solid rgba(255,215,0,0.1)',
      minHeight: '36px',
      boxSizing: 'border-box',
    });

    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.minWidth = '0';

    const label = document.createElement('div');
    label.textContent = item.name;
    Object.assign(label.style, {
      fontSize: '11px',
      fontWeight: '700',
      color: '#ffd700',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '3px',
    });
    info.appendChild(label);

    const barContainer = document.createElement('div');
    Object.assign(barContainer.style, {
      width: '100%',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255,215,0,0.15)',
      overflow: 'hidden',
    });

    const barFill = document.createElement('div');
    Object.assign(barFill.style, {
      width: `${item.progress * 100}%`,
      height: '100%',
      borderRadius: '2px',
      background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
      transition: 'width 0.3s ease',
    });
    barContainer.appendChild(barFill);
    info.appendChild(barContainer);
    row.appendChild(info);

    const coinText = document.createElement('div');
    const currentCoins = this.store ? this.store.state.coins : 0;
    coinText.textContent = `\uD83E\uDE99${Math.min(currentCoins, item.cost)}/${item.cost}`;
    Object.assign(coinText.style, {
      fontSize: '10px',
      fontWeight: '700',
      color: 'rgba(255,215,0,0.7)',
      whiteSpace: 'nowrap',
      flexShrink: '0',
    });
    row.appendChild(coinText);

    return row;
  }

  private expand(): void {
    if (this.expanded) return;
    this.expanded = true;

    this.pill.style.display = 'none';
    this.backdrop.style.display = 'block';
    this.panel.style.display = 'block';

    // Trigger reflow before animating
    void this.panel.offsetHeight;

    this.panel.style.transform = 'translateY(0) scale(1)';
    this.panel.style.opacity = '1';
  }

  private collapse(): void {
    if (!this.expanded) return;
    this.expanded = false;

    this.panel.style.transform = 'translateY(10px) scale(0.95)';
    this.panel.style.opacity = '0';
    this.backdrop.style.display = 'none';

    setTimeout(() => {
      if (!this.expanded) {
        this.panel.style.display = 'none';
        this.pill.style.display = 'flex';
      }
    }, 200);
  }

  /** Show a brief toast notification when a goal completes. */
  showGoalComplete(label: string): void {
    const toast = document.createElement('div');
    toast.textContent = `Goal Complete: ${label}`;
    Object.assign(toast.style, {
      position: 'absolute',
      bottom: '0',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      marginBottom: `calc(130px + env(safe-area-inset-bottom, 0px))`,
      fontSize: '13px',
      fontWeight: '700',
      color: '#ffd700',
      background: 'rgba(0,0,0,0.8)',
      border: '1px solid rgba(255,215,0,0.3)',
      borderRadius: '10px',
      padding: '10px 18px',
      pointerEvents: 'none',
      zIndex: '16',
      fontFamily: FONT_STACK,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      whiteSpace: 'nowrap',
      textShadow: '0 0 8px rgba(255,215,0,0.4)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      opacity: '0',
      willChange: 'transform, opacity',
    });

    this.container.appendChild(toast);

    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);

      if (t < 0.12) {
        // Slide in
        const tIn = t / 0.12;
        const ease = 1 - Math.pow(1 - tIn, 3);
        toast.style.opacity = String(ease);
        toast.style.transform = `translateX(-50%) translateY(${20 - 20 * ease}px)`;
      } else if (t < 0.8) {
        // Hold
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      } else {
        // Fade out
        const tOut = (t - 0.8) / 0.2;
        toast.style.opacity = String(1 - tOut);
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        toast.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  dispose(): void {
    this.root.remove();
  }
}
