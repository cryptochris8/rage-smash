export type Rarity = 'common' | 'uncommon' | 'rare';
export type GeometryType = 'box' | 'cylinder' | 'sphere' | 'cone' | 'torus';
export type ParticleTheme = 'default' | 'glass' | 'metal' | 'organic' | 'electronic';
export type ObjectCategory = 'glass' | 'ceramic' | 'tech' | 'luxury' | 'food' | 'soft';
export type BreakType = 'shatter' | 'crackBurst' | 'juicySplit' | 'chunkBreak' | 'softBurst' | 'premiumBurst';
export type WeightClass = 'light' | 'medium' | 'heavy' | 'premiumHeavy';

export interface SmashableObjectDef {
  id: string;
  name: string;
  pack: string;
  rarity: Rarity;
  color: number;
  geometry: GeometryType;
  scale: [number, number, number];
  particleTheme?: ParticleTheme;
  category?: ObjectCategory;
  breakType?: BreakType;
  weightClass?: WeightClass;
  /** Relative spawn weight — higher = more frequent. Defaults to 1. */
  spawnWeight?: number;
}

export interface HammerSkin {
  id: string;
  name: string;
  color: number;
  cost: number;
  exclusive?: boolean;
  /** Path to GLB model. If omitted, uses procedural geometry with color tint. */
  model?: string;
  /** If true, flip model 180° on X (for models where head is at top natively). */
  modelFlip?: boolean;
  /** Y rotation override in radians to aim the striking face. Defaults to -PI/2. */
  modelRotationY?: number;
}

export interface RoomDef {
  id: string;
  name: string;
  skybox: string;
  cost: number;
  // Optional lighting profile — falls back to CONFIG defaults when omitted.
  ambientColor?: number;
  ambientIntensity?: number;
  directionalColor?: number;
  directionalIntensity?: number;
  directionalPosition?: [number, number, number];
}

export interface Pack {
  id: string;
  name: string;
  cost: number;
  description: string;
}

export interface GameState {
  coins: number;
  combo: number;
  streak: number;
  bestCombo: number;
  currentObjectId: string | null;
  isSmashing: boolean;
  canTap: boolean;
  unlockedPacks: string[];
  unlockedHammers: string[];
  selectedHammer: string;
  muted: boolean;
  shopOpen: boolean;
  totalSmashes: number;
  // Phase 3: Charge
  isCharging: boolean;
  chargeLevel: number;
  // Phase 5: Ad boost
  adBoostActive: boolean;
  adBoostRemainingMs: number;
  adBoostCooldownMs: number;
  // Monetization
  starterPackPurchased: boolean;
  starterPackBoostExpiresAt: number;
  sessionCount: number;
  unlockedRooms: string[];
  selectedRoom: string;
  jackpotActive: boolean;
  jackpotMultiplier: number;
  // Upgrades
  powerLevel: number;
  speedLevel: number;
  multiplierLevel: number;
  // Retention tracking
  totalPerfectHits: number;
  dailyStreak: number;
  /** Granted only by claiming the day-7 login reward (1 hour, 2× coin
   *  multiplier applied in smash.ts and press.ts). NOT written by
   *  JackpotSystem — that's a separate per-smash roll. */
  loginDay7BoostExpiresAt: number;
  // Press bonus
  pressActive: boolean;
  pressProgress: number;
  smashesSincePress: number;
  // IAP
  adsRemoved: boolean;
  // Collection: object ids the player has smashed at least once
  seenObjects: string[];
  // Achievements: ids of milestones the player has unlocked
  unlockedAchievements: string[];
  // Press upgrades: level 0..upgradeMaxLevel for each track
  pressUpgrades: { power: number; speed: number; fragments: number };
}

export function createInitialState(): GameState {
  return {
    coins: 500,
    combo: 1,
    streak: 0,
    bestCombo: 0,
    currentObjectId: null,
    isSmashing: false,
    canTap: true,
    unlockedPacks: ['everyday'],
    unlockedHammers: ['default'],
    selectedHammer: 'default',
    muted: false,
    shopOpen: false,
    totalSmashes: 0,
    isCharging: false,
    chargeLevel: 0,
    adBoostActive: false,
    adBoostRemainingMs: 0,
    adBoostCooldownMs: 0,
    starterPackPurchased: false,
    starterPackBoostExpiresAt: 0,
    sessionCount: 0,
    unlockedRooms: ['default'],
    selectedRoom: 'default',
    jackpotActive: false,
    jackpotMultiplier: 1,
    powerLevel: 0,
    speedLevel: 0,
    multiplierLevel: 0,
    totalPerfectHits: 0,
    dailyStreak: 0,
    loginDay7BoostExpiresAt: 0,
    pressActive: false,
    pressProgress: 0,
    smashesSincePress: 0,
    adsRemoved: false,
    seenObjects: [],
    unlockedAchievements: [],
    pressUpgrades: { power: 0, speed: 0, fragments: 0 },
  };
}

type Listener = () => void;

export class Store {
  state: GameState;
  private listeners: Set<Listener> = new Set();
  private listenerLabels: WeakMap<Listener, string> = new WeakMap();
  private isNotifying: boolean = false;

  constructor(initial: GameState) {
    this.state = initial;
  }

  update(partial: Partial<GameState>) {
    Object.assign(this.state, partial);
    if (this.isNotifying) {
      return; // State is updated, but skip recursive notification
    }
    this.notify();
  }

  subscribe(fn: Listener, label?: string): () => void {
    this.listeners.add(fn);
    if (label) this.listenerLabels.set(fn, label);
    return () => this.listeners.delete(fn);
  }

  /** Number of currently-registered subscribers. Used by a dev-mode probe
   *  to surface listener leaks across long sessions. */
  getListenerCount(): number {
    return this.listeners.size;
  }

  private notify() {
    this.isNotifying = true;
    // Snapshot the listener set so an unsubscribe inside a listener doesn't skip siblings.
    const snapshot = Array.from(this.listeners);
    for (const fn of snapshot) {
      try {
        fn();
      } catch (err) {
        // One throwing subscriber must not silence the rest.
        const label = this.listenerLabels.get(fn) ?? 'anonymous';
        console.warn(`[store] subscriber "${label}" threw:`, err);
      }
    }
    this.isNotifying = false;
  }
}
