import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Studio-wide GLB model loader with caching, cloning, and disposal.
 *
 * Models are auto-normalized at load time so that their largest dimension
 * fits within 1 unit. Registry `scale` values then act as a simple
 * multiplier (e.g. scale 1.0 = 1 unit tall, scale 1.5 = 1.5 units tall).
 *
 * Cache is LRU-bounded so room/skin churn over a long session can't grow
 * GPU memory without bound. The currently-equipped hammer + current room
 * (anything returned by `activePathsProvider`) is never evicted.
 */
export class ModelManager {
  private loader = new GLTFLoader();
  /** Map preserves insertion order; we re-insert on hit to mark "freshest". */
  private cache = new Map<string, THREE.Group>();
  private pending = new Map<string, Promise<THREE.Group | null>>();
  private maxCacheSize: number;
  private activePathsProvider: () => Set<string> = () => new Set();

  constructor(maxCacheSize: number = 32) {
    this.maxCacheSize = maxCacheSize;
  }

  /** Caller registers a function that returns paths which must NOT be
   *  evicted (current hammer model, currently equipped skins, etc.). */
  setActivePathsProvider(fn: () => Set<string>): void {
    this.activePathsProvider = fn;
  }

  /** Load a GLB, normalize its size, and cache it. Returns null on failure. */
  async load(path: string): Promise<THREE.Group | null> {
    if (this.cache.has(path)) {
      // Mark as freshest by re-inserting (Map insertion order = LRU order).
      const cached = this.cache.get(path)!;
      this.cache.delete(path);
      this.cache.set(path, cached);
      return cached;
    }
    if (this.pending.has(path)) return this.pending.get(path)!;

    const promise = new Promise<THREE.Group | null>((resolve) => {
      this.loader.load(
        path,
        (gltf: GLTF) => {
          const root = gltf.scene;
          this.normalizeSize(root);
          // Wrap in a container so normalization scale on `root` is preserved
          // when SmashableManager animates the container's scale
          const container = new THREE.Group();
          container.add(root);
          this.cache.set(path, container);
          this.pending.delete(path);
          this.evictIfOverCapacity();
          resolve(container);
        },
        undefined,
        (err) => {
          console.warn(`[ModelManager] Failed to load ${path}:`, err);
          this.pending.delete(path);
          resolve(null);
        },
      );
    });

    this.pending.set(path, promise);
    return promise;
  }

  /** Clone a cached (already normalized) model. Returns null if not cached. */
  get(path: string): THREE.Group | null {
    const original = this.cache.get(path);
    if (!original) return null;
    // Cache hit also marks freshest.
    this.cache.delete(path);
    this.cache.set(path, original);
    return original.clone();
  }

  /** Load + clone in one call. Returns null on failure. */
  async loadAndClone(path: string): Promise<THREE.Group | null> {
    const original = await this.load(path);
    if (!original) return null;
    return original.clone();
  }

  /** Preload a list of model paths (fire-and-forget). */
  async preload(paths: string[]): Promise<void> {
    await Promise.all(paths.map((p) => this.load(p)));
  }

  /** Check if a model is already cached. */
  has(path: string): boolean {
    return this.cache.has(path);
  }

  /** Dispose a single cached model and its GPU resources. */
  dispose(path: string): void {
    const root = this.cache.get(path);
    if (!root) return;
    this.disposeGroup(root);
    this.cache.delete(path);
  }

  /** Dispose all cached models. */
  disposeAll(): void {
    for (const [, root] of this.cache) {
      this.disposeGroup(root);
    }
    this.cache.clear();
  }

  /** Visible for tests / dev probe. */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * If cache exceeds `maxCacheSize`, evict from oldest entries first,
   * skipping anything in the active set or still pending. May leave the
   * cache at slightly > max if everything is active — better than evicting
   * the equipped hammer.
   */
  private evictIfOverCapacity(): void {
    if (this.cache.size <= this.maxCacheSize) return;
    const active = this.activePathsProvider();
    let toEvict = this.cache.size - this.maxCacheSize;
    // Iterate in insertion order (oldest first).
    for (const path of this.cache.keys()) {
      if (toEvict <= 0) break;
      if (active.has(path)) continue;
      if (this.pending.has(path)) continue;
      const root = this.cache.get(path);
      if (!root) continue;
      this.disposeGroup(root);
      this.cache.delete(path);
      toEvict--;
    }
  }

  /**
   * Normalize a loaded GLB so its largest bounding-box dimension equals 1 unit.
   * This makes registry `scale` values intuitive (1.0 = 1 unit, 1.5 = 1.5 units).
   */
  private normalizeSize(root: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0) {
      const normScale = 1.0 / maxDim;
      root.scale.multiplyScalar(normScale);
    }

    // Re-center so the model's bottom sits at y=0
    const normalizedBox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    normalizedBox.getCenter(center);
    root.position.x = -center.x;
    root.position.z = -center.z;
    root.position.y = -normalizedBox.min.y;
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => this.disposeMaterial(m));
        } else if (mesh.material) {
          this.disposeMaterial(mesh.material);
        }
      }
    });
  }

  private disposeMaterial(material: THREE.Material): void {
    const mat = material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.normalMap?.dispose();
    mat.roughnessMap?.dispose();
    mat.metalnessMap?.dispose();
    mat.emissiveMap?.dispose();
    mat.aoMap?.dispose();
    material.dispose();
  }
}
