import { CONFIG } from '../game/config';

const STORAGE_KEY = 'rage-smash-login';
const OLD_STORAGE_KEY = 'smash-loop-login';

interface LoginState {
  lastClaimTimestamp: number;
  /** Local-time date of the last claim, formatted YYYY-MM-DD. Authoritative
   *  for streak/grace/reset logic so DST shifts and clock-rollback can't
   *  silently consume a player's streak. lastClaimTimestamp remains for
   *  display + clock-rollback detection. */
  lastClaimDateKey: string;
  currentDayIndex: number;
  totalDaysClaimed: number;
  consecutiveStreak: number;
  /** 1-hour 2× coin boost granted on day-7 claim. Renamed from the
   *  misleading `jackpotBoostExpiresAt` — it's a login reward, not a
   *  jackpot. Read by smash.ts and press.ts. */
  loginDay7BoostExpiresAt: number;
}

export interface DayReward {
  amount: number;
  claimed: boolean;
  claimable: boolean;
  locked: boolean;
  dayIndex: number;
}

/** Local-timezone YYYY-MM-DD for the supplied timestamp (defaults to now). */
function dateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole-calendar-day diff: days(today) - days(other). Negative if `other` is in the future. */
function dayDiff(today: string, other: string): number {
  if (!other) return Infinity;
  const [ty, tm, td] = today.split('-').map(Number);
  const [oy, om, od] = other.split('-').map(Number);
  // Use UTC midpoint of each day to avoid DST 23/25-hour edge cases.
  const a = Date.UTC(ty, tm - 1, td);
  const b = Date.UTC(oy, om - 1, od);
  return Math.round((a - b) / 86_400_000);
}

export class LoginRewardSystem {
  private state: LoginState;

  constructor() {
    this.state = this.load();
    this.checkStreakReset();
  }

  private load(): LoginState {
    const defaults: LoginState = {
      lastClaimTimestamp: 0,
      lastClaimDateKey: '',
      currentDayIndex: 0,
      totalDaysClaimed: 0,
      consecutiveStreak: 0,
      loginDay7BoostExpiresAt: 0,
    };
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // Migrate from old key
      if (!raw) {
        raw = localStorage.getItem(OLD_STORAGE_KEY);
        if (raw) {
          localStorage.setItem(STORAGE_KEY, raw);
          localStorage.removeItem(OLD_STORAGE_KEY);
        }
      }
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Partial<LoginState> & { jackpotBoostExpiresAt?: number };
      const merged: LoginState = { ...defaults, ...parsed };
      // Backfill lastClaimDateKey for players who claimed before this fix shipped.
      if (!merged.lastClaimDateKey && merged.lastClaimTimestamp > 0) {
        merged.lastClaimDateKey = dateKey(merged.lastClaimTimestamp);
      }
      // Migrate legacy field name. The 1-hour day-7 boost was previously
      // stored as `jackpotBoostExpiresAt` — rename in place so existing
      // boosts don't expire prematurely.
      if (parsed.jackpotBoostExpiresAt !== undefined && !merged.loginDay7BoostExpiresAt) {
        merged.loginDay7BoostExpiresAt = parsed.jackpotBoostExpiresAt;
      }
      return merged;
    } catch {
      return defaults;
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  /** Detect device clock running backwards (player set system clock back).
   *  60s tolerance for normal NTP sync wobble. When detected we treat as
   *  "no time has passed" — don't allow re-claim, don't reset the streak. */
  private isClockRollback(): boolean {
    if (this.state.lastClaimTimestamp === 0) return false;
    return Date.now() < this.state.lastClaimTimestamp - 60_000;
  }

  canClaim(): boolean {
    if (this.state.lastClaimTimestamp === 0) return true;
    if (this.isClockRollback()) return false;
    // Claimable if today's local date differs from the last claim's date.
    return this.state.lastClaimDateKey !== dateKey();
  }

  claim(): { coins: number; dayIndex: number; isDay7: boolean; streak: number; isComeback: boolean } {
    const dayIndex = this.state.currentDayIndex;
    const baseCoins = CONFIG.loginRewards[dayIndex];

    // Comeback: player missed exactly one calendar day (last claim was 2
    // days ago by date) but returned before the streak hard-resets.
    const today = dateKey();
    const daysSince = this.state.lastClaimDateKey ? dayDiff(today, this.state.lastClaimDateKey) : 0;
    const isComeback = daysSince === 2;
    const coins = isComeback ? Math.round(baseCoins * 1.2) : baseCoins;

    this.state.lastClaimTimestamp = Date.now();
    this.state.lastClaimDateKey = today;
    this.state.totalDaysClaimed++;
    this.state.consecutiveStreak++;
    this.state.currentDayIndex = (dayIndex + 1) % CONFIG.loginRewards.length;

    const isDay7 = dayIndex === 6;
    if (isDay7) {
      this.state.loginDay7BoostExpiresAt = Date.now() + 3600000; // 1 hour
    }

    this.save();

    return { coins, dayIndex, isDay7, streak: this.state.consecutiveStreak, isComeback };
  }

  getDayRewards(): DayReward[] {
    const canClaim = this.canClaim();
    return CONFIG.loginRewards.map((amount, i) => {
      const isPast = i < this.state.currentDayIndex;
      const isCurrent = i === this.state.currentDayIndex;
      return {
        amount,
        claimed: isPast,
        claimable: isCurrent && canClaim,
        locked: !isPast && !isCurrent,
        dayIndex: i,
      };
    });
  }

  getCurrentDayIndex(): number {
    return this.state.currentDayIndex;
  }

  getStreak(): number {
    return this.state.consecutiveStreak;
  }

  getLoginDay7BoostExpiresAt(): number {
    return this.state.loginDay7BoostExpiresAt;
  }

  /**
   * True if the player missed exactly one calendar day but can still claim
   * without losing their streak. Used by UI to surface a comeback badge
   * before claiming.
   */
  isInGracePeriod(): boolean {
    if (this.state.lastClaimTimestamp === 0) return false;
    if (this.isClockRollback()) return false;
    return dayDiff(dateKey(), this.state.lastClaimDateKey) === 2;
  }

  private checkStreakReset(): void {
    if (this.state.lastClaimTimestamp === 0) return;
    if (this.isClockRollback()) return; // don't punish a clock-rollback
    const daysSince = dayDiff(dateKey(), this.state.lastClaimDateKey);
    // 2+ missed calendar days → streak resets. Single missed day = grace
    // period (handled in claim() with comeback bonus).
    if (daysSince >= 3) {
      this.state.consecutiveStreak = 0;
      this.state.currentDayIndex = 0;
      this.save();
    }
  }
}
