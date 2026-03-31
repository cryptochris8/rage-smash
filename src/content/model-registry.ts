/**
 * Asset registry — maps smashable object IDs to GLB model paths and metadata.
 *
 * Objects with an entry here will attempt to load the GLB model first.
 * If loading fails or no entry exists, SmashableManager falls back to
 * procedural geometry.
 */

export interface ModelEntry {
  /** Path relative to public/ root (served by Vite as static asset). */
  path: string;
  /** Scale multiplier applied after loading (uniform or [x,y,z]). */
  scale?: number | [number, number, number];
  /** Y-offset to align model on pedestal. */
  offsetY?: number;
  /** Is this a hero/premium asset? (informational for budgeting) */
  hero?: boolean;
  /** Expected triangle budget class. */
  triBudget?: 'low' | 'mid' | 'hero';
  /** If true, model is a placeholder awaiting a better version. */
  placeholder?: boolean;
}

/**
 * Registry keyed by SmashableObjectDef.id.
 * Add entries here as new GLB models are supplied.
 */
// Models are auto-normalized to 1 unit max dimension at load time.
// Scale values here = final size in world units (1.0 = 1 unit tall).
export const MODEL_REGISTRY: Record<string, ModelEntry> = {
  bottle: {
    path: '/models/smash_glass_bottle_01.glb',
    scale: 1.4,
    offsetY: 0,
    hero: false,
    triBudget: 'mid',
  },

  plate: {
    path: '/models/smash_plate_ceramic_01.glb',
    scale: 1.0,
    offsetY: 0.1,
    hero: false,
    triBudget: 'low',
  },

  mug: {
    path: '/models/smash_mug_ceramic_01.glb',
    scale: 1.0,
    offsetY: 0,
    hero: false,
    triBudget: 'mid',
  },

  'tv-head': {
    path: '/models/smash_tv_old_01.glb',
    scale: 1.2,
    offsetY: 0,
    hero: false,
    triBudget: 'mid',
  },

  chair: {
    path: '/models/smash_chair_wood_01.glb',
    scale: 1.4,
    offsetY: 0,
    hero: false,
    triBudget: 'low',
  },

  watermelon: {
    path: '/models/smash_watermelon_01.glb',
    scale: 1.0,
    offsetY: 0,
    hero: false,
    triBudget: 'low',
  },

  trophy: {
    path: '/models/smash_trophy_gold_01.glb',
    scale: 1.4,
    offsetY: 0,
    hero: true,
    triBudget: 'hero',
  },

  // ── Future entries ────────────────────────────────────────────────
};

/** Get all model paths that should be preloaded. */
export function getPreloadPaths(): string[] {
  return Object.values(MODEL_REGISTRY).map((e) => e.path);
}
