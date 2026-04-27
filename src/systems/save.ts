import { Store } from '../game/state';
import { parseAndMigrate, wrapEnvelope } from './save-migrations';

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
  loginDay7BoostExpiresAt: number;
  adsRemoved: boolean;
  seenObjects: string[];
  unlockedAchievements: string[];
  pressUpgrades: { power: number; speed: number; fragments: number };
}

const SAVE_DEBOUNCE_MS = 200;

export class SaveSystem {
  private store: Store;
  private unsubscribe: (() => void) | null = null;
  private pendingSave: number | null = null;

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

      const migrated = parseAndMigrate(raw);
      if (!migrated) return; // unparseable — keep defaults

      const data: Partial<SaveData> = migrated;

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
      if (typeof data.loginDay7BoostExpiresAt === 'number') updates.loginDay7BoostExpiresAt = data.loginDay7BoostExpiresAt;
      if (typeof data.adsRemoved === 'boolean') updates.adsRemoved = data.adsRemoved;
      if (Array.isArray(data.seenObjects)) updates.seenObjects = data.seenObjects;
      if (Array.isArray(data.unlockedAchievements)) updates.unlockedAchievements = data.unlockedAchievements;
      if (data.pressUpgrades && typeof data.pressUpgrades === 'object') {
        const pu = data.pressUpgrades as Partial<{ power: number; speed: number; fragments: number }>;
        updates.pressUpgrades = {
          power: typeof pu.power === 'number' ? pu.power : 0,
          speed: typeof pu.speed === 'number' ? pu.speed : 0,
          fragments: typeof pu.fragments === 'number' ? pu.fragments : 0,
        };
      }

      if (Object.keys(updates).length > 0) {
        this.store.update(updates);
      }
    } catch (err) {
      // Surface unexpected load failures so they show up in TestFlight logs
      // instead of silently resetting a player's progress.
      console.warn('[save] load failed, using defaults:', err);
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
        loginDay7BoostExpiresAt: state.loginDay7BoostExpiresAt,
        adsRemoved: state.adsRemoved,
        seenObjects: state.seenObjects,
        unlockedAchievements: state.unlockedAchievements,
        pressUpgrades: state.pressUpgrades,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(wrapEnvelope(data)));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  autoSave(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.store.subscribe(() => {
      this.scheduleSave();
    });
    // Flush any pending save before the tab backgrounds / app closes so we
    // don't lose a smash-in-progress if iOS freezes the page.
    document.addEventListener('visibilitychange', this.flushOnHide);
    window.addEventListener('pagehide', this.flushOnHide);
  }

  /** Stop auto-saving (used before reset to prevent re-saving cleared data) */
  stopAutoSave(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.pendingSave !== null) {
      clearTimeout(this.pendingSave);
      this.pendingSave = null;
    }
    document.removeEventListener('visibilitychange', this.flushOnHide);
    window.removeEventListener('pagehide', this.flushOnHide);
  }

  private flushOnHide = (): void => {
    if (this.pendingSave !== null) {
      clearTimeout(this.pendingSave);
      this.pendingSave = null;
      this.save();
    }
  };

  /**
   * Coalesce rapid-fire store updates into one localStorage.setItem per
   * SAVE_DEBOUNCE_MS. During a high-combo run a single smash can trigger
   * 3-5 store updates; without this, we'd hit localStorage 10+ times/sec
   * on iOS — a known cause of main-thread stalls.
   */
  private scheduleSave(): void {
    if (this.pendingSave !== null) return;
    this.pendingSave = window.setTimeout(() => {
      this.pendingSave = null;
      this.save();
    }, SAVE_DEBOUNCE_MS);
  }
}
