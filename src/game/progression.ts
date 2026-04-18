import { Store } from './state';
import { PACKS } from '../content/packs';
import { HAMMER_SKINS } from '../content/skins';
import { ROOMS } from '../content/rooms';
import { UPGRADES, UpgradeCategory, PressUpgradeCategory } from '../content/upgrades';
import { getUpgradeCost } from './economy';
import { CONFIG } from './config';

/** Check if the player can afford to unlock a pack. */
export function canUnlockPack(store: Store, packId: string): boolean {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) return false;
  if (store.state.unlockedPacks.includes(packId)) return false;
  return store.state.coins >= pack.cost;
}

/** Attempt to unlock a pack, deduct coins, and return whether it succeeded. */
export function unlockPack(store: Store, packId: string): boolean {
  if (!canUnlockPack(store, packId)) return false;

  const pack = PACKS.find((p) => p.id === packId)!;
  store.update({
    coins: store.state.coins - pack.cost,
    unlockedPacks: [...store.state.unlockedPacks, packId],
  });
  return true;
}

/** Check if the player can afford a hammer skin. */
export function canUnlockHammer(store: Store, hammerId: string): boolean {
  const skin = HAMMER_SKINS.find((s) => s.id === hammerId);
  if (!skin) return false;
  if (store.state.unlockedHammers.includes(hammerId)) return false;
  return store.state.coins >= skin.cost;
}

/** Attempt to unlock a hammer skin, deduct coins, and return whether it succeeded. */
export function unlockHammer(store: Store, hammerId: string): boolean {
  if (!canUnlockHammer(store, hammerId)) return false;

  const skin = HAMMER_SKINS.find((s) => s.id === hammerId)!;
  store.update({
    coins: store.state.coins - skin.cost,
    unlockedHammers: [...store.state.unlockedHammers, hammerId],
  });
  return true;
}

/** Select an owned hammer skin. Returns false if the skin is not owned. */
export function selectHammer(store: Store, hammerId: string): boolean {
  if (!store.state.unlockedHammers.includes(hammerId)) return false;
  store.update({ selectedHammer: hammerId });
  return true;
}

/** Check if the player can afford to unlock a room. */
export function canUnlockRoom(store: Store, roomId: string): boolean {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return false;
  if (store.state.unlockedRooms.includes(roomId)) return false;
  return store.state.coins >= room.cost;
}

/** Attempt to unlock a room, deduct coins, and return whether it succeeded. */
export function unlockRoom(store: Store, roomId: string): boolean {
  if (!canUnlockRoom(store, roomId)) return false;

  const room = ROOMS.find((r) => r.id === roomId)!;
  store.update({
    coins: store.state.coins - room.cost,
    unlockedRooms: [...store.state.unlockedRooms, roomId],
  });
  return true;
}

/** Select an owned room. Returns false if the room is not owned. */
export function selectRoom(store: Store, roomId: string): boolean {
  if (!store.state.unlockedRooms.includes(roomId)) return false;
  store.update({ selectedRoom: roomId });
  return true;
}

/** Get current level for an upgrade category */
export function getUpgradeLevel(store: Store, category: UpgradeCategory): number {
  switch (category) {
    case 'power': return store.state.powerLevel;
    case 'speed': return store.state.speedLevel;
    case 'multiplier': return store.state.multiplierLevel;
  }
}

/** Check if the player can afford the next upgrade level */
export function canUpgrade(store: Store, category: UpgradeCategory): boolean {
  const level = getUpgradeLevel(store, category);
  if (level >= CONFIG.upgradeMaxLevel) return false;
  const cost = getUpgradeCost(level);
  return store.state.coins >= cost;
}

/** Attempt to purchase an upgrade. Returns true if successful. */
export function doUpgrade(store: Store, category: UpgradeCategory): boolean {
  if (!canUpgrade(store, category)) return false;

  const level = getUpgradeLevel(store, category);
  const cost = getUpgradeCost(level);

  const updates: Record<string, number> = {
    coins: store.state.coins - cost,
  };

  switch (category) {
    case 'power':
      updates.powerLevel = level + 1;
      break;
    case 'speed':
      updates.speedLevel = level + 1;
      break;
    case 'multiplier':
      updates.multiplierLevel = level + 1;
      break;
  }

  store.update(updates);
  return true;
}

// ---------------------------------------------------------------------------
// Press upgrades — same cost curve and max level, separate state field.
// ---------------------------------------------------------------------------

export function getPressUpgradeLevel(store: Store, category: PressUpgradeCategory): number {
  const pu = store.state.pressUpgrades;
  switch (category) {
    case 'pressPower': return pu.power;
    case 'pressSpeed': return pu.speed;
    case 'pressFragments': return pu.fragments;
  }
}

export function canPressUpgrade(store: Store, category: PressUpgradeCategory): boolean {
  const level = getPressUpgradeLevel(store, category);
  if (level >= CONFIG.upgradeMaxLevel) return false;
  return store.state.coins >= getUpgradeCost(level);
}

export function doPressUpgrade(store: Store, category: PressUpgradeCategory): boolean {
  if (!canPressUpgrade(store, category)) return false;

  const level = getPressUpgradeLevel(store, category);
  const cost = getUpgradeCost(level);
  const pu = { ...store.state.pressUpgrades };

  switch (category) {
    case 'pressPower':     pu.power = level + 1; break;
    case 'pressSpeed':     pu.speed = level + 1; break;
    case 'pressFragments': pu.fragments = level + 1; break;
  }

  store.update({
    coins: store.state.coins - cost,
    pressUpgrades: pu,
  });
  return true;
}
