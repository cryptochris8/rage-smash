import { Store, SmashableObjectDef } from '../game/state';
import { SmashableManager } from '../render/objects/smashable';
import { OBJECTS } from '../content/objects';

/** Pick a random object using spawnWeight for weighted distribution. */
function weightedPick(candidates: SmashableObjectDef[]): SmashableObjectDef {
  let totalWeight = 0;
  for (const obj of candidates) {
    totalWeight += obj.spawnWeight ?? 1;
  }

  let roll = Math.random() * totalWeight;
  for (const obj of candidates) {
    roll -= obj.spawnWeight ?? 1;
    if (roll <= 0) return obj;
  }

  // Fallback (shouldn't happen)
  return candidates[candidates.length - 1];
}

export class SpawnSystem {
  private store: Store;
  private smashableManager: SmashableManager;
  private lastSpawnedId: string | null = null;

  constructor(store: Store, smashableManager: SmashableManager) {
    this.store = store;
    this.smashableManager = smashableManager;
  }

  spawnNext(): void {
    const unlockedPacks = this.store.state.unlockedPacks;

    // Filter objects to only those from unlocked packs
    const available = OBJECTS.filter((obj) => unlockedPacks.includes(obj.pack));

    if (available.length === 0) return;

    // Avoid spawning the same object twice in a row if possible
    let candidates = available;
    if (available.length > 1 && this.lastSpawnedId !== null) {
      candidates = available.filter((obj) => obj.id !== this.lastSpawnedId);
    }

    // Weighted random pick based on spawnWeight
    const def = weightedPick(candidates);

    this.lastSpawnedId = def.id;
    this.smashableManager.spawn(def);
    this.store.update({ currentObjectId: def.id });
  }
}
