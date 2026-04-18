import type { GameState } from '../game/state';
import { OBJECTS } from '../content/objects';
import { PACKS } from '../content/packs';
import { ROOMS } from '../content/rooms';
import { HAMMER_SKINS } from '../content/skins';

export type AchievementCategory =
  | 'smashes'
  | 'combo'
  | 'perfect'
  | 'streak'
  | 'collection';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  /** Coin reward delivered once on unlock. */
  reward: number;
  /** Reads the current metric value from state. */
  metric: (state: GameState) => number;
  /** Threshold the metric must reach to unlock. */
  threshold: number;
}

// Tallies for the "unlock everything" milestones. `everyday` + default room/hammer
// count toward the total since the player starts with them.
const TOTAL_PACKS = PACKS.length;
const TOTAL_ROOMS = ROOMS.length;
const TOTAL_HAMMERS = HAMMER_SKINS.length;
const TOTAL_OBJECTS = OBJECTS.length;

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Smashes (lifetime) ---
  { id: 'smashes-100',   category: 'smashes', name: 'Warming Up',    description: 'Smash 100 objects',    icon: '\uD83D\uDD28', reward: 250,  metric: (s) => s.totalSmashes,       threshold: 100 },
  { id: 'smashes-1000',  category: 'smashes', name: 'Destroyer',     description: 'Smash 1,000 objects',  icon: '\uD83D\uDCA5', reward: 1500, metric: (s) => s.totalSmashes,       threshold: 1000 },
  { id: 'smashes-10000', category: 'smashes', name: 'Demolition',    description: 'Smash 10,000 objects', icon: '\u2622\uFE0F', reward: 10000, metric: (s) => s.totalSmashes,      threshold: 10000 },

  // --- Combo ---
  { id: 'combo-10',  category: 'combo', name: 'On Fire',     description: 'Reach a 10-combo',  icon: '\uD83D\uDD25',     reward: 500,  metric: (s) => s.bestCombo, threshold: 10 },
  { id: 'combo-25',  category: 'combo', name: 'Unstoppable', description: 'Reach a 25-combo',  icon: '\u26A1',           reward: 1500, metric: (s) => s.bestCombo, threshold: 25 },
  { id: 'combo-50',  category: 'combo', name: 'Legendary',   description: 'Reach a 50-combo',  icon: '\uD83D\uDC51',     reward: 4000, metric: (s) => s.bestCombo, threshold: 50 },
  { id: 'combo-100', category: 'combo', name: 'Mythic',      description: 'Reach a 100-combo', icon: '\uD83C\uDF1F',     reward: 12000, metric: (s) => s.bestCombo, threshold: 100 },

  // --- Perfect hits ---
  { id: 'perfect-100', category: 'perfect', name: 'Sharpshooter', description: 'Land 100 perfect hits', icon: '\uD83C\uDFAF', reward: 1000, metric: (s) => s.totalPerfectHits, threshold: 100 },
  { id: 'perfect-500', category: 'perfect', name: 'Flawless',     description: 'Land 500 perfect hits', icon: '\uD83D\uDC8E', reward: 5000, metric: (s) => s.totalPerfectHits, threshold: 500 },

  // --- Daily login streaks ---
  { id: 'streak-7',  category: 'streak', name: 'Regular',    description: 'Log in 7 days in a row',  icon: '\uD83D\uDCC5', reward: 1000, metric: (s) => s.dailyStreak, threshold: 7 },
  { id: 'streak-30', category: 'streak', name: 'Dedicated',  description: 'Log in 30 days in a row', icon: '\uD83D\uDCC6', reward: 5000, metric: (s) => s.dailyStreak, threshold: 30 },
  { id: 'streak-90', category: 'streak', name: 'Unshakable', description: 'Log in 90 days in a row', icon: '\uD83C\uDFC6', reward: 20000, metric: (s) => s.dailyStreak, threshold: 90 },

  // --- Collection ---
  { id: 'collection-10',  category: 'collection', name: 'Curious',    description: 'Discover 10 objects', icon: '\uD83D\uDD0D',  reward: 300,  metric: (s) => s.seenObjects.length, threshold: 10 },
  { id: 'collection-25',  category: 'collection', name: 'Explorer',   description: 'Discover 25 objects', icon: '\uD83D\uDDFA\uFE0F', reward: 1500, metric: (s) => s.seenObjects.length, threshold: 25 },
  { id: 'collection-all', category: 'collection', name: 'Completionist', description: `Discover all ${TOTAL_OBJECTS} objects`, icon: '\uD83C\uDFAF', reward: 7500, metric: (s) => s.seenObjects.length, threshold: TOTAL_OBJECTS },
  { id: 'packs-all',      category: 'collection', name: 'Collector',  description: 'Unlock every pack',   icon: '\uD83C\uDF81', reward: 5000, metric: (s) => s.unlockedPacks.length,   threshold: TOTAL_PACKS },
  { id: 'rooms-all',      category: 'collection', name: 'Interior Designer', description: 'Unlock every room', icon: '\uD83C\uDFDB\uFE0F', reward: 5000, metric: (s) => s.unlockedRooms.length, threshold: TOTAL_ROOMS },
  { id: 'hammers-all',    category: 'collection', name: 'Armory',     description: 'Own every hammer',    icon: '\u2692\uFE0F', reward: 5000, metric: (s) => s.unlockedHammers.length, threshold: TOTAL_HAMMERS },
];

/**
 * Returns ids of achievements newly unlocked in this check (still not in state.unlockedAchievements).
 * Caller is responsible for applying the resulting state delta (add ids, award coins).
 */
export function checkAchievements(state: GameState): string[] {
  const already = new Set(state.unlockedAchievements);
  const newly: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (already.has(ach.id)) continue;
    if (ach.metric(state) >= ach.threshold) newly.push(ach.id);
  }
  return newly;
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'smashes',    label: 'SMASHES' },
  { id: 'combo',      label: 'COMBOS' },
  { id: 'perfect',    label: 'PERFECT HITS' },
  { id: 'streak',     label: 'LOGIN STREAKS' },
  { id: 'collection', label: 'COLLECTION' },
];
