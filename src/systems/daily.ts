import { SmashableObjectDef } from '../game/state';
import { OBJECTS } from '../content/objects';

const DAILY_SAVE_KEY = 'smash-loop-daily';
const CHALLENGE_LENGTH = 20;

export interface DailyChallengeResult {
  date: string;       // ISO date "2026-03-16"
  score: number;      // total coins earned
  smashes: number;    // should always be CHALLENGE_LENGTH
  timeMs: number;     // how long it took in ms
  completed: boolean;
}

export interface DailyState {
  active: boolean;
  currentIndex: number;
  sequence: SmashableObjectDef[];
  score: number;
  startTime: number;
}

export class DailyChallenge {
  private state: DailyState | null = null;

  // Get today's date as ISO string "YYYY-MM-DD"
  getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // Check if today's challenge has already been completed
  isCompletedToday(): boolean {
    const result = this.getTodayResult();
    return result !== null && result.completed;
  }

  // Get the saved result for today (or null)
  getTodayResult(): DailyChallengeResult | null {
    try {
      const raw = localStorage.getItem(DAILY_SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as { results: DailyChallengeResult[] };
      return data.results.find(r => r.date === this.getTodayKey()) ?? null;
    } catch {
      return null;
    }
  }

  // Get all saved results (for leaderboard)
  getAllResults(): DailyChallengeResult[] {
    try {
      const raw = localStorage.getItem(DAILY_SAVE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw) as { results: DailyChallengeResult[] };
      return Array.isArray(data.results) ? data.results : [];
    } catch {
      return [];
    }
  }

  // Start today's challenge
  start(): DailyState {
    const sequence = this.generateSequence(this.getTodayKey());
    this.state = {
      active: true,
      currentIndex: 0,
      sequence,
      score: 0,
      startTime: Date.now(),
    };
    return this.state;
  }

  // Get the current challenge state
  getState(): DailyState | null {
    return this.state;
  }

  // Get the next object in the sequence
  getNextObject(): SmashableObjectDef | null {
    if (!this.state || this.state.currentIndex >= this.state.sequence.length) return null;
    return this.state.sequence[this.state.currentIndex];
  }

  // Record a smash (called after each smash during challenge)
  recordSmash(coinsEarned: number): { done: boolean; result?: DailyChallengeResult } {
    if (!this.state) return { done: false };

    this.state.score += coinsEarned;
    this.state.currentIndex++;

    if (this.state.currentIndex >= CHALLENGE_LENGTH) {
      // Challenge complete
      const result: DailyChallengeResult = {
        date: this.getTodayKey(),
        score: this.state.score,
        smashes: CHALLENGE_LENGTH,
        timeMs: Date.now() - this.state.startTime,
        completed: true,
      };
      this.saveResult(result);
      this.state.active = false;
      return { done: true, result };
    }

    return { done: false };
  }

  // End the challenge early (if player quits)
  abort(): void {
    this.state = null;
  }

  // Generate a deterministic sequence of objects for a given date seed
  private generateSequence(dateKey: string): SmashableObjectDef[] {
    // Simple seeded RNG using the date string
    let seed = 0;
    for (let i = 0; i < dateKey.length; i++) {
      seed = ((seed << 5) - seed + dateKey.charCodeAt(i)) | 0;
    }

    const seededRandom = (): number => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };

    // Use ALL objects (not just unlocked) for daily challenges
    const allObjects = [...OBJECTS];
    const sequence: SmashableObjectDef[] = [];

    for (let i = 0; i < CHALLENGE_LENGTH; i++) {
      const index = Math.floor(seededRandom() * allObjects.length);
      sequence.push(allObjects[index]);
    }

    return sequence;
  }

  // Save result to localStorage
  private saveResult(result: DailyChallengeResult): void {
    try {
      const all = this.getAllResults();
      // Replace if same date exists, otherwise add
      const existing = all.findIndex(r => r.date === result.date);
      if (existing >= 0) {
        // Keep the better score
        if (result.score > all[existing].score) {
          all[existing] = result;
        }
      } else {
        all.push(result);
      }
      // Keep last 30 days only
      const sorted = all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
      localStorage.setItem(DAILY_SAVE_KEY, JSON.stringify({ results: sorted }));
    } catch {
      // Storage unavailable
    }
  }
}

export const CHALLENGE_OBJECT_COUNT = CHALLENGE_LENGTH;
