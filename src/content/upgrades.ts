export type UpgradeCategory = 'power' | 'speed' | 'multiplier';

export interface UpgradeDef {
  id: UpgradeCategory;
  name: string;
  description: string;
  icon: string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'power', name: 'Power', description: '+12% coins per smash', icon: '\uD83D\uDCAA' },
  { id: 'speed', name: 'Speed', description: '-7% smash cooldown', icon: '\u26A1' },
  { id: 'multiplier', name: 'Combo Boost', description: '+7% faster combos', icon: '\uD83D\uDD25' },
];
