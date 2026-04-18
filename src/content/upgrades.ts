export type UpgradeCategory = 'power' | 'speed' | 'multiplier';
export type PressUpgradeCategory = 'pressPower' | 'pressSpeed' | 'pressFragments';

export interface UpgradeDef {
  id: UpgradeCategory;
  name: string;
  description: string;
  icon: string;
}

export interface PressUpgradeDef {
  id: PressUpgradeCategory;
  name: string;
  description: string;
  icon: string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'power', name: 'Power', description: '+12% coins per smash', icon: '\uD83D\uDCAA' },
  { id: 'speed', name: 'Speed', description: '-7% smash cooldown', icon: '\u26A1' },
  { id: 'multiplier', name: 'Combo Boost', description: '+7% faster combos', icon: '\uD83D\uDD25' },
];

export const PRESS_UPGRADES: PressUpgradeDef[] = [
  { id: 'pressPower',     name: 'Press Power',     description: '+25% press coins',      icon: '\uD83C\uDFED' },
  { id: 'pressSpeed',     name: 'Press Speed',     description: '-15% press cycle time', icon: '\u23E9' },
  { id: 'pressFragments', name: 'Press Fragments', description: '+20% crushed fragments', icon: '\uD83D\uDCA5' },
];
