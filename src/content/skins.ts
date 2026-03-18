import type { HammerSkin } from '../game/state';

export const HAMMER_SKINS: HammerSkin[] = [
  { id: 'default', name: 'Classic', color: 0x888888, cost: 0 },
  { id: 'golden', name: 'Golden', color: 0xffd700, cost: 600 },
  { id: 'neon', name: 'Neon', color: 0x00ff88, cost: 200 },
  { id: 'ruby', name: 'Ruby', color: 0xff2244, cost: 400 },
  { id: 'rage-fury', name: 'Rage Fury', color: 0xff4400, cost: 0, exclusive: true },
];
