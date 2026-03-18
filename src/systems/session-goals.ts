export type ChallengeType = 'smash_count' | 'perfect_hit_count' | 'coin_earn_total' | 'multiplier_reach' | 'jackpot_trigger_count';

export interface GoalProgress {
  id: string;
  type: ChallengeType;
  target: number;
  current: number;
  reward: number;
  label: string;
  completed: boolean;
  claimed: boolean;
}

const GOAL_POOL = [
  { type: 'smash_count' as ChallengeType, target: 10, reward: 150, label: 'Smash 10 objects' },
  { type: 'smash_count' as ChallengeType, target: 20, reward: 300, label: 'Smash 20 objects' },
  { type: 'perfect_hit_count' as ChallengeType, target: 2, reward: 200, label: 'Land 2 perfect hits' },
  { type: 'perfect_hit_count' as ChallengeType, target: 5, reward: 500, label: 'Land 5 perfect hits' },
  { type: 'coin_earn_total' as ChallengeType, target: 500, reward: 250, label: 'Earn 500 coins' },
  { type: 'coin_earn_total' as ChallengeType, target: 1000, reward: 500, label: 'Earn 1,000 coins' },
  { type: 'multiplier_reach' as ChallengeType, target: 3, reward: 100, label: 'Reach x3 combo' },
  { type: 'multiplier_reach' as ChallengeType, target: 5, reward: 300, label: 'Reach x5 combo' },
  { type: 'jackpot_trigger_count' as ChallengeType, target: 1, reward: 500, label: 'Trigger a jackpot' },
];

export class SessionGoalSystem {
  private goals: GoalProgress[] = [];
  private sessionSmashes = 0;
  private sessionCoins = 0;
  private sessionPerfectHits = 0;
  private sessionJackpots = 0;
  private sessionMaxCombo = 0;

  constructor() {
    this.pickGoals();
  }

  private pickGoals(): void {
    // Shuffle and pick 3
    const shuffled = [...GOAL_POOL].sort(() => Math.random() - 0.5);
    this.goals = shuffled.slice(0, 3).map((g, i) => ({
      ...g,
      id: `goal-${i}`,
      current: 0,
      completed: false,
      claimed: false,
    }));
  }

  getGoals(): GoalProgress[] {
    return this.goals;
  }

  /** Called on each smash. Returns any newly completed goals. */
  recordSmash(coinsEarned: number, combo: number, isPerfect: boolean, isJackpot: boolean): GoalProgress[] {
    this.sessionSmashes++;
    this.sessionCoins += coinsEarned;
    if (isPerfect) this.sessionPerfectHits++;
    if (isJackpot) this.sessionJackpots++;
    this.sessionMaxCombo = Math.max(this.sessionMaxCombo, combo);

    const newlyCompleted: GoalProgress[] = [];

    for (const goal of this.goals) {
      if (goal.completed) continue;

      switch (goal.type) {
        case 'smash_count': goal.current = this.sessionSmashes; break;
        case 'coin_earn_total': goal.current = this.sessionCoins; break;
        case 'perfect_hit_count': goal.current = this.sessionPerfectHits; break;
        case 'jackpot_trigger_count': goal.current = this.sessionJackpots; break;
        case 'multiplier_reach': goal.current = this.sessionMaxCombo; break;
      }

      if (goal.current >= goal.target && !goal.completed) {
        goal.completed = true;
        newlyCompleted.push(goal);
      }
    }

    return newlyCompleted;
  }

  /** Claim reward coins for a completed goal. Returns coin amount or 0. */
  claimReward(goalId: string): number {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal || !goal.completed || goal.claimed) return 0;
    goal.claimed = true;
    return goal.reward;
  }

  /** Reset for new session */
  reset(): void {
    this.sessionSmashes = 0;
    this.sessionCoins = 0;
    this.sessionPerfectHits = 0;
    this.sessionJackpots = 0;
    this.sessionMaxCombo = 0;
    this.pickGoals();
  }
}
