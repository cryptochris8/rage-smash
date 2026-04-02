import type { HammerSkin } from '../game/state';

export const HAMMER_SKINS: HammerSkin[] = [
  { id: 'default', name: 'Fire Hammer', color: 0x888888, cost: 0, model: '/models/hammer_fire_01.glb', modelFlip: true },
  { id: 'classic', name: 'Classic', color: 0x888888, cost: 200, model: '/models/hammer_classic_01.glb' },
  { id: 'golden', name: 'War Hammer', color: 0xffd700, cost: 600, model: '/models/hammer_golden_01.glb', modelFlip: true, modelRotationY: Math.PI },
  { id: 'neon', name: 'Neon', color: 0x00ff88, cost: 200, model: '/models/hammer_neon_01.glb', modelFlip: true },
  { id: 'ruby', name: 'Cheese Hammer', color: 0xffcc33, cost: 400, model: '/models/hammer_cheese_01.glb', modelFlip: true },
{ id: 'rage-fury', name: 'Rage Fury', color: 0xff4400, cost: 0, exclusive: true },
];

/** Get all hammer model paths for preloading. */
export function getHammerModelPaths(): string[] {
  return HAMMER_SKINS.filter((s) => s.model).map((s) => s.model!);
}
