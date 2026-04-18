import { Store } from '../game/state';

const SAVE_KEY = 'rage-smash-save';
const OLD_SAVE_KEY = 'smash-loop-save';

interface SaveData {
  coins: number;
  bestCombo: number;
  unlockedPacks: string[];
  unlockedHammers: string[];
  selectedHammer: string;
  muted: boolean;
  totalSmashes: number;
  starterPackPurchased: boolean;
  starterPackBoostExpiresAt: number;
  sessionCount: number;
  unlockedRooms: string[];
  selectedRoom: string;
  powerLevel: number;
  speedLevel: number;
  multiplierLevel: number;
  totalPerfectHits: number;
  dailyStreak: number;
  jackpotBoostExpiresAt: number;
  adsRemoved: boolean;
  seenObjects: string[];
}

export class SaveSystem {
  private store: Store;
  private unsubscribe: (() => void) | null = null;

  constructor(store: Store) {
    this.store = store;
  }

  load(): void {
    try {
      let raw = localStorage.getItem(SAVE_KEY);
      // Migrate from old key
      if (!raw) {
        raw = localStorage.getItem(OLD_SAVE_KEY);
        if (raw) {
          localStorage.setItem(SAVE_KEY, raw);
          localStorage.removeItem(OLD_SAVE_KEY);
        }
      }
      if (!raw) return;

      const data: Partial<SaveData> = JSON.parse(raw);

      // Build update object with only defined values to avoid overwriting defaults
      const updates: Partial<SaveData> = {};
      if (typeof data.coins === 'number') updates.coins = data.coins;
      if (typeof data.bestCombo === 'number') updates.bestCombo = data.bestCombo;
      if (Array.isArray(data.unlockedPacks)) updates.unlockedPacks = data.unlockedPacks;
      if (Array.isArray(data.unlockedHammers)) updates.unlockedHammers = data.unlockedHammers;
      if (typeof data.selectedHammer === 'string') updates.selectedHammer = data.selectedHammer;
      if (typeof data.muted === 'boolean') updates.muted = data.muted;
      if (typeof data.totalSmashes === 'number') updates.totalSmashes = data.totalSmashes;
      if (typeof data.starterPackPurchased === 'boolean') updates.starterPackPurchased = data.starterPackPurchased;
      if (typeof data.starterPackBoostExpiresAt === 'number') updates.starterPackBoostExpiresAt = data.starterPackBoostExpiresAt;
      if (typeof data.sessionCount === 'number') updates.sessionCount = data.sessionCount;
      if (Array.isArray(data.unlockedRooms)) updates.unlockedRooms = data.unlockedRooms;
      if (typeof data.selectedRoom === 'string') updates.selectedRoom = data.selectedRoom;
      if (typeof data.powerLevel === 'number') updates.powerLevel = data.powerLevel;
      if (typeof data.speedLevel === 'number') updates.speedLevel = data.speedLevel;
      if (typeof data.multiplierLevel === 'number') updates.multiplierLevel = data.multiplierLevel;
      if (typeof data.totalPerfectHits === 'number') updates.totalPerfectHits = data.totalPerfectHits;
      if (typeof data.dailyStreak === 'number') updates.dailyStreak = data.dailyStreak;
      if (typeof data.jackpotBoostExpiresAt === 'number') updates.jackpotBoostExpiresAt = data.jackpotBoostExpiresAt;
      if (typeof data.adsRemoved === 'boolean') updates.adsRemoved = data.adsRemoved;
      if (Array.isArray(data.seenObjects)) updates.seenObjects = data.seenObjects;

      if (Object.keys(updates).length > 0) {
        this.store.update(updates);
      }
    } catch {
      // Corrupt or missing data — silently ignore and use defaults
    }
  }

  save(): void {
    try {
      const state = this.store.state;
      const data: SaveData = {
        coins: state.coins,
        bestCombo: state.bestCombo,
        unlockedPacks: state.unlockedPacks,
        unlockedHammers: state.unlockedHammers,
        selectedHammer: state.selectedHammer,
        muted: state.muted,
        totalSmashes: state.totalSmashes,
        starterPackPurchased: state.starterPackPurchased,
        starterPackBoostExpiresAt: state.starterPackBoostExpiresAt,
        sessionCount: state.sessionCount,
        unlockedRooms: state.unlockedRooms,
        selectedRoom: state.selectedRoom,
        powerLevel: state.powerLevel,
        speedLevel: state.speedLevel,
        multiplierLevel: state.multiplierLevel,
        totalPerfectHits: state.totalPerfectHits,
        dailyStreak: state.dailyStreak,
        jackpotBoostExpiresAt: state.jackpotBoostExpiresAt,
        adsRemoved: state.adsRemoved,
        seenObjects: state.seenObjects,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  autoSave(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.store.subscribe(() => {
      this.save();
    });
  }

  /** Stop auto-saving (used before reset to prevent re-saving cleared data) */
  stopAutoSave(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
