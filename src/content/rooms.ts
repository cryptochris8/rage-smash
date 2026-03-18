import type { RoomDef } from '../game/state';

export const ROOMS: RoomDef[] = [
  { id: 'default', name: 'Rage Room', skybox: '/skybox/rage-smash.jpg', cost: 0 },
  { id: 'office', name: 'Office Rage', skybox: '/skybox/office-smash.jpg', cost: 5000 },
  { id: 'neon', name: 'Neon Arena', skybox: '/skybox/neon-arena.png', cost: 50000 },
  { id: 'luxury', name: 'Luxury Suite', skybox: '/skybox/luxury-suite.jpg', cost: 25000 },
  { id: 'dungeon', name: 'Dungeon', skybox: '/skybox/dungeon.jpg', cost: 10000 },
];
