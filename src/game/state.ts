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
  jackpotBoostExpiresAt: number;
  // Press bonus
  pressActive: boolean;
  pressProgress: number;
  smashesSincePress: number;
  // IAP
  adsRemoved: boolean;
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
    jackpotBoostExpiresAt: 0,
    pressActive: false,
    pressProgress: 0,
    smashesSincePress: 0,
    adsRemoved: false,
  };
}

type Listener = () => void;

export class Store {
  state: GameState;
  private listeners: Set<Listener> = new Set();
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

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.isNotifying = true;
    this.listeners.forEach(fn => fn());
    this.isNotifying = false;
  }
}
