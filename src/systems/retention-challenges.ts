import type { ChallengeType } from './session-goals';

export interface ChallengeProgress {
  id: string;
  type: ChallengeType | 'ad_boost_use_count' | 'upgrade_purchase_count';
  target: number;
  current: number;
  reward: number;
  label: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  claimed: boolean;
}

interface DailyTotals {
  smashes: number;
  coins: number;
  perfectHits: number;
  jackpots: number;
  adWatches: number;
  upgrades: number;
}

interface DailyChallengeData {
  date: string;
  challenges: ChallengeProgress[];
  totals: DailyTotals;
}

const SAVE_KEY = 'rage-smash-daily-challenges';

const CHALLENGE_POOL = {
  easy: [
    { type: 'smash_count', target: 25, reward: 500, label: 'Smash 25 objects' },
    { type: 'coin_earn_total', target: 1000, reward: 400, label: 'Earn 1,000 coins' },
    { type: 'ad_boost_use_count', target: 1, reward: 300, label: 'Use 2X boost once' },
  ],
  medium: [
    { type: 'perfect_hit_count', target: 5, reward: 750, label: 'Get 5 perfect hits' },
    { type: 'coin_earn_total', target: 2500, reward: 1000, label: 'Earn 2,500 coins' },
    { type: 'smash_count', target: 50, reward: 800, label: 'Smash 50 objects' },
  ],
  hard: [
    { type: 'jackpot_trigger_count', target: 1, reward: 1000, label: 'Trigger a jackpot' },
    { type: 'upgrade_purchase_count', target: 1, reward: 750, label: 'Buy an upgrade' },
    { type: 'coin_earn_total', target: 5000, reward: 1500, label: 'Earn 5,000 coins' },
  ],
} as Record<string, { type: string; target: number; reward: number; label: string }[]>;

export class RetentionChallengeSystem {
  private challenges: ChallengeProgress[] = [];
  private totals: DailyTotals = { smashes: 0, coins: 0, perfectHits: 0, jackpots: 0, adWatches: 0, upgrades: 0 };
  private date: string;

  constructor() {
    this.date = new Date().toISOString().slice(0, 10);
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data: DailyChallengeData = JSON.parse(raw);
        if (data.date === this.date) {
          this.challenges = data.challenges;
          this.totals = data.totals;
          return;
        }
      }
    } catch {
      // Corrupted data, generate fresh
    }
    this.generate();
  }

  private generate(): void {
    this.totals = { smashes: 0, coins: 0, perfectHits: 0, jackpots: 0, adWatches: 0, upgrades: 0 };
    this.challenges = [];

    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    for (const diff of difficulties) {
      const pool = CHALLENGE_POOL[diff];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.challenges.push({
        id: `daily-${diff}`,
        type: pick.type as ChallengeProgress['type'],
        target: pick.target,
        current: 0,
        reward: pick.reward,
        label: pick.label,
        difficulty: diff,
        completed: false,
        claimed: false,
      });
    }

    this.save();
  }

  private save(): void {
    const data: DailyChallengeData = {
      date: this.date,
      challenges: this.challenges,
      totals: this.totals,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  private checkCompleted(): ChallengeProgress[] {
    const newlyCompleted: ChallengeProgress[] = [];

    for (const ch of this.challenges) {
      if (ch.completed) continue;

      switch (ch.type) {
        case 'smash_count': ch.current = this.totals.smashes; break;
        case 'coin_earn_total': ch.current = this.totals.coins; break;
        case 'perfect_hit_count': ch.current = this.totals.perfectHits; break;
        case 'jackpot_trigger_count': ch.current = this.totals.jackpots; break;
        case 'ad_boost_use_count': ch.current = this.totals.adWatches; break;
        case 'upgrade_purchase_count': ch.current = this.totals.upgrades; break;
        case 'multiplier_reach': break; // Not used in daily challenges currently
      }

      if (ch.current >= ch.target) {
        ch.completed = true;
        newlyCompleted.push(ch);
      }
    }

    if (newlyCompleted.length > 0) {
      this.save();
    }

    return newlyCompleted;
  }

  getChallenges(): ChallengeProgress[] {
    return this.challenges;
  }

  /** Record a smash with associated stats. Returns newly completed challenges. */
  recordSmash(coinsEarned: number, _combo: number, isPerfect: boolean, isJackpot: boolean): ChallengeProgress[] {
    this.totals.smashes++;
    this.totals.coins += coinsEarned;
    if (isPerfect) this.totals.perfectHits++;
    if (isJackpot) this.totals.jackpots++;
    this.save();
    return this.checkCompleted();
  }

  /** Record an ad watch. Returns newly completed challenges. */
  recordAdWatch(): ChallengeProgress[] {
    this.totals.adWatches++;
    this.save();
    return this.checkCompleted();
  }

  /** Record an upgrade purchase. Returns newly completed challenges. */
  recordUpgrade(): ChallengeProgress[] {
    this.totals.upgrades++;
    this.save();
    return this.checkCompleted();
  }

  /** Claim reward coins for a completed challenge. Returns coin amount or 0. */
  claimReward(id: string): number {
    const ch = this.challenges.find(c => c.id === id);
    if (!ch || !ch.completed || ch.claimed) return 0;
    ch.claimed = true;
    this.save();
    return ch.reward;
  }
}
