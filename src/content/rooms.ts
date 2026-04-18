import type { RoomDef } from '../game/state';

export const ROOMS: RoomDef[] = [
  {
    id: 'default',
    name: 'Rage Room',
    skybox: '/skybox/rage-smash.jpg',
    cost: 0,
    // Neutral studio lighting — unchanged from the baseline defaults.
    ambientColor: 0xeeeeff,
    ambientIntensity: 0.4,
    directionalColor: 0xfff8ee,
    directionalIntensity: 1.0,
    directionalPosition: [3, 6, 4],
  },
  {
    id: 'office',
    name: 'Office Rage',
    skybox: '/skybox/office-smash.jpg',
    cost: 5000,
    // Cool fluorescent — harsher shadows, slightly desaturated.
    ambientColor: 0xdce4f0,
    ambientIntensity: 0.35,
    directionalColor: 0xffffff,
    directionalIntensity: 1.2,
    directionalPosition: [3, 6, 4],
  },
  {
    id: 'neon',
    name: 'Neon Arena',
    skybox: '/skybox/neon-arena.png',
    cost: 50000,
    // Deep moody ambient with hot magenta key light.
    ambientColor: 0x3a1e5c,
    ambientIntensity: 0.30,
    directionalColor: 0xff3aa2,
    directionalIntensity: 1.15,
    directionalPosition: [2, 5, 4],
  },
  {
    id: 'luxury',
    name: 'Luxury Suite',
    skybox: '/skybox/luxury-suite.jpg',
    cost: 25000,
    // Warm champagne — high ambient, soft gold key.
    ambientColor: 0xffeacc,
    ambientIntensity: 0.55,
    directionalColor: 0xffd988,
    directionalIntensity: 0.95,
    directionalPosition: [3, 6, 4],
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    skybox: '/skybox/dungeon.jpg',
    cost: 10000,
    // Low red ambient with a warm torch-ish key from one corner.
    ambientColor: 0x3d1a14,
    ambientIntensity: 0.28,
    directionalColor: 0xff6622,
    directionalIntensity: 1.10,
    directionalPosition: [-4, 5, 3],
  },
];
