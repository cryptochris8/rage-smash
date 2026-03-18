import { Store } from '../game/state';
import { SmashableManager } from '../render/objects/smashable';
import { OBJECTS } from '../content/objects';

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

    // Pick a random object
    const index = Math.floor(Math.random() * candidates.length);
    const def = candidates[index];

    this.lastSpawnedId = def.id;
    this.smashableManager.spawn(def);
    this.store.update({ currentObjectId: def.id });
  }
}
