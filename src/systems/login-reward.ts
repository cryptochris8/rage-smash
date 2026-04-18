import { CONFIG } from '../game/config';

const STORAGE_KEY = 'rage-smash-login';
const OLD_STORAGE_KEY = 'smash-loop-login';

interface LoginState {
  lastClaimTimestamp: number;
  currentDayIndex: number;
  totalDaysClaimed: number;
  consecutiveStreak: number;
  jackpotBoostExpiresAt: number;
}

export interface DayReward {
  amount: number;
  claimed: boolean;
  claimable: boolean;
  locked: boolean;
  dayIndex: number;
}

export class LoginRewardSystem {
  private state: LoginState;

  constructor() {
    this.state = this.load();
    this.checkStreakReset();
  }

  private load(): LoginState {
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
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { lastClaimTimestamp: 0, currentDayIndex: 0, totalDaysClaimed: 0, consecutiveStreak: 0, jackpotBoostExpiresAt: 0 };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  canClaim(): boolean {
    if (this.state.lastClaimTimestamp === 0) return true;
    return Date.now() - this.state.lastClaimTimestamp >= CONFIG.loginRewardCooldownMs;
  }

  claim(): { coins: number; dayIndex: number; isDay7: boolean; streak: number; isComeback: boolean } {
    const dayIndex = this.state.currentDayIndex;
    const baseCoins = CONFIG.loginRewards[dayIndex];

    // Comeback: player missed a day (elapsed > 24h cooldown + 24h grace = 48h)
    // but returned before the 72h hard-reset window.
    const elapsed = this.state.lastClaimTimestamp === 0 ? 0 : Date.now() - this.state.lastClaimTimestamp;
    const isComeback = elapsed > 48 * 60 * 60 * 1000;
    const coins = isComeback ? Math.round(baseCoins * 1.2) : baseCoins;

    this.state.lastClaimTimestamp = Date.now();
    this.state.totalDaysClaimed++;
    this.state.consecutiveStreak++;
    this.state.currentDayIndex = (dayIndex + 1) % CONFIG.loginRewards.length;

    const isDay7 = dayIndex === 6;
    if (isDay7) {
      this.state.jackpotBoostExpiresAt = Date.now() + 3600000; // 1 hour
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

  getJackpotBoostExpiresAt(): number {
    return this.state.jackpotBoostExpiresAt;
  }

  /**
   * True if the player missed a single day but can still claim without losing their streak.
   * Used by UI to surface a comeback badge before claiming.
   */
  isInGracePeriod(): boolean {
    if (this.state.lastClaimTimestamp === 0) return false;
    const elapsed = Date.now() - this.state.lastClaimTimestamp;
    return elapsed > 48 * 60 * 60 * 1000 && elapsed <= 72 * 60 * 60 * 1000;
  }

  private checkStreakReset(): void {
    if (this.state.lastClaimTimestamp === 0) return;
    const elapsed = Date.now() - this.state.lastClaimTimestamp;
    // Grace period: one missed day (48-72h) keeps the streak alive with a comeback bonus.
    // Only a second consecutive miss (>72h) resets.
    if (elapsed > 72 * 60 * 60 * 1000) {
      this.state.consecutiveStreak = 0;
      this.state.currentDayIndex = 0;
      this.save();
    }
  }
}
