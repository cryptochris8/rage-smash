const ANALYTICS_KEY = 'rage-smash-analytics';

interface AnalyticsData {
  firstPlayDate: string;
  totalSessions: number;
  totalSmashes: number;
  totalCoinsEarned: number;
  totalAdsWatched: number;
  longestCombo: number;
  longestStreak: number;
  sessionLengths: number[];    // last 30 session durations in seconds
  retentionDays: string[];     // unique play dates (YYYY-MM-DD), last 90
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class GameAnalytics {
  private data: AnalyticsData;
  private sessionStart: number;
  /** Set to true after endSession() runs so back-to-back fires (e.g.
   *  visibilitychange-hidden + pagehide both firing) don't double-count. */
  private sessionEnded: boolean = false;

  constructor() {
    this.sessionStart = Date.now();
    this.data = this.load();
    this.recordSessionStart();
  }

  private load(): AnalyticsData {
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
      firstPlayDate: today(),
      totalSessions: 0,
      totalSmashes: 0,
      totalCoinsEarned: 0,
      totalAdsWatched: 0,
      longestCombo: 0,
      longestStreak: 0,
      sessionLengths: [],
      retentionDays: [],
    };
  }

  private save(): void {
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.data));
    } catch { /* ignore */ }
  }

  private recordSessionStart(): void {
    this.data.totalSessions++;
    const d = today();
    if (!this.data.retentionDays.includes(d)) {
      this.data.retentionDays.push(d);
      if (this.data.retentionDays.length > 90) {
        this.data.retentionDays = this.data.retentionDays.slice(-90);
      }
    }
    this.save();
  }

  recordSmash(): void {
    this.data.totalSmashes++;
  }

  recordCoins(amount: number): void {
    this.data.totalCoinsEarned += amount;
  }

  recordAdWatched(): void {
    this.data.totalAdsWatched++;
    this.save();
  }

  recordCombo(combo: number): void {
    if (combo > this.data.longestCombo) {
      this.data.longestCombo = combo;
    }
  }

  recordStreak(streak: number): void {
    if (streak > this.data.longestStreak) {
      this.data.longestStreak = streak;
    }
  }

  /** Record the current session's duration. Idempotent — multiple calls
   *  in a row (e.g. from both visibilitychange and pagehide on iOS) only
   *  count once. Use startNewSession() on resume to begin a fresh window. */
  endSession(): void {
    if (this.sessionEnded) return;
    this.sessionEnded = true;
    const duration = Math.round((Date.now() - this.sessionStart) / 1000);
    this.data.sessionLengths.push(duration);
    if (this.data.sessionLengths.length > 30) {
      this.data.sessionLengths = this.data.sessionLengths.slice(-30);
    }
    this.save();
  }

  /** Start a fresh session window. Called on resume from background so a
   *  6-hour background -> visible doesn't report a 6-hour session length. */
  startNewSession(): void {
    if (!this.sessionEnded) return; // session is already active, no-op
    this.sessionStart = Date.now();
    this.sessionEnded = false;
    this.recordSessionStart();
  }

  getStats(): {
    totalSessions: number;
    totalSmashes: number;
    totalCoinsEarned: number;
    totalAdsWatched: number;
    longestCombo: number;
    longestStreak: number;
    daysPlayed: number;
    avgSessionSec: number;
  } {
    const lengths = this.data.sessionLengths;
    const avg = lengths.length > 0
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;
    return {
      totalSessions: this.data.totalSessions,
      totalSmashes: this.data.totalSmashes,
      totalCoinsEarned: this.data.totalCoinsEarned,
      totalAdsWatched: this.data.totalAdsWatched,
      longestCombo: this.data.longestCombo,
      longestStreak: this.data.longestStreak,
      daysPlayed: this.data.retentionDays.length,
      avgSessionSec: avg,
    };
  }
}
