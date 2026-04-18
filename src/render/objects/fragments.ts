import * as THREE from 'three';
import { CONFIG } from '../../game/config';
import { motionScale } from '../../systems/motion-prefs';

type FragmentShapeType = 'box' | 'tetrahedron' | 'shard';

interface Fragment {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  lifetime: number;
  age: number;
  bounced: boolean;
  initialScale: number;
  baseSize: number;
  shape: FragmentShapeType;
}

// Shared unit-sized geometries — physical size is applied via mesh.scale.
// Ratios preserved from the pre-pool implementation.
const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1);
const TETRA_GEOM = new THREE.TetrahedronGeometry(0.65);
const SHARD_GEOM = new THREE.BoxGeometry(1, 0.12, 0.65);

function geomFor(shape: FragmentShapeType): THREE.BufferGeometry {
  switch (shape) {
    case 'box':
      return BOX_GEOM;
    case 'tetrahedron':
      return TETRA_GEOM;
    case 'shard':
      return SHARD_GEOM;
  }
}

function pickShape(): FragmentShapeType {
  const r = Math.random();
  if (r < 0.60) return 'box';
  if (r < 0.85) return 'tetrahedron';
  return 'shard';
}

function pickCrushedShape(): FragmentShapeType {
  const r = Math.random();
  if (r < 0.60) return 'shard';
  if (r < 0.85) return 'box';
  return 'tetrahedron';
}

const TMP_COLOR = new THREE.Color();

function applyVariedColor(baseColor: number, out: THREE.Color): void {
  out.setHex(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  out.getHSL(hsl);
  hsl.h += (Math.random() - 0.5) * 0.2;
  hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.3, 0, 1);
  out.setHSL(hsl.h, hsl.s, hsl.l);
}

export class FragmentManager {
  private scene: THREE.Scene;
  private active: Fragment[] = [];

  // Per-shape free-lists — meshes keep the geometry matching their original shape.
  private boxPool: Fragment[] = [];
  private tetraPool: Fragment[] = [];
  private shardPool: Fragment[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private poolFor(shape: FragmentShapeType): Fragment[] {
    return shape === 'box' ? this.boxPool : shape === 'tetrahedron' ? this.tetraPool : this.shardPool;
  }

  private acquire(shape: FragmentShapeType): Fragment {
    const pool = this.poolFor(shape);
    const reused = pool.pop();
    if (reused) {
      reused.mesh.visible = true;
      return reused;
    }
    const material = new THREE.MeshStandardMaterial({ transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geomFor(shape), material);
    this.scene.add(mesh);
    return {
      mesh,
      material,
      velocity: new THREE.Vector3(),
      rotSpeed: new THREE.Vector3(),
      lifetime: CONFIG.fragmentLifetime,
      age: 0,
      bounced: false,
      initialScale: 1,
      baseSize: 1,
      shape,
    };
  }

  private release(f: Fragment): void {
    f.mesh.visible = false;
    this.poolFor(f.shape).push(f);
  }

  /** Evict oldest-ish active fragment when at maxFragments cap (O(1)). */
  private evictOne(): void {
    if (this.active.length === 0) return;
    // swap-and-pop from index 0 — caveat: swap-and-pop doesn't preserve insertion
    // order, so this isn't strictly the oldest, but it's a constant-time eviction
    // of some active fragment and is visually indistinguishable at this scale.
    const victim = this.active[0];
    const last = this.active.length - 1;
    if (last !== 0) this.active[0] = this.active[last];
    this.active.pop();
    this.release(victim);
  }

  /**
   * @param position - explosion center
   * @param color - base fragment color
   * @param extraCount - additional fragments (from charge level)
   * @param colorOverrides - optional array of colors to randomly pick from
   */
  explode(
    position: THREE.Vector3,
    color: number,
    extraCount: number = 0,
    colorOverrides?: number[],
  ): void {
    const total = Math.max(1, Math.round((CONFIG.fragmentCount + extraCount) * motionScale()));

    for (let i = 0; i < total; i++) {
      if (this.active.length >= CONFIG.maxFragments) this.evictOne();

      const size = 0.08 + Math.random() * 0.14;
      const shape = pickShape();
      const f = this.acquire(shape);

      let baseColor = color;
      if (colorOverrides && colorOverrides.length > 0) {
        baseColor = colorOverrides[Math.floor(Math.random() * colorOverrides.length)];
      }
      applyVariedColor(baseColor, TMP_COLOR);
      f.material.color.copy(TMP_COLOR);
      f.material.opacity = 1;

      f.mesh.position.copy(position);
      f.mesh.scale.setScalar(size);
      f.baseSize = size;

      const angle = Math.random() * Math.PI * 2;
      const spread = CONFIG.fragmentSpread;
      f.velocity.set(
        Math.cos(angle) * (Math.random() * spread),
        Math.random() * spread * 0.8 + spread * 0.3,
        Math.sin(angle) * (Math.random() * spread),
      );

      f.mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      f.rotSpeed.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      );

      f.lifetime = CONFIG.fragmentLifetime;
      f.age = 0;
      f.bounced = false;
      f.initialScale = 1;

      this.active.push(f);
    }
  }

  /** Lateral (crushed) fragment explosion — horizontal velocity bias, more shards */
  explodeCrushed(
    position: THREE.Vector3,
    color: number,
    extraCount: number = 0,
    colorOverrides?: number[],
  ): void {
    const total = Math.max(1, Math.round((CONFIG.fragmentCount + extraCount) * motionScale()));

    for (let i = 0; i < total; i++) {
      if (this.active.length >= CONFIG.maxFragments) this.evictOne();

      const size = 0.1 + Math.random() * 0.18;
      const shape = pickCrushedShape();
      const f = this.acquire(shape);

      let baseColor = color;
      if (colorOverrides && colorOverrides.length > 0) {
        baseColor = colorOverrides[Math.floor(Math.random() * colorOverrides.length)];
      }
      applyVariedColor(baseColor, TMP_COLOR);
      f.material.color.copy(TMP_COLOR);
      f.material.opacity = 1;

      f.mesh.position.copy(position);
      f.mesh.scale.setScalar(size);
      f.baseSize = size;

      const angle = Math.random() * Math.PI * 2;
      const spread = CONFIG.fragmentSpread * 1.5;
      f.velocity.set(
        Math.cos(angle) * (Math.random() * spread),
        Math.random() * 1.0,
        Math.sin(angle) * (Math.random() * spread),
      );

      f.mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      f.rotSpeed.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      );

      f.lifetime = CONFIG.fragmentLifetime;
      f.age = 0;
      f.bounced = false;
      f.initialScale = 1;

      this.active.push(f);
    }
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const f = this.active[i];
      f.age += dt;

      if (f.age >= f.lifetime) {
        const last = this.active.length - 1;
        if (i !== last) this.active[i] = this.active[last];
        this.active.pop();
        this.release(f);
        continue;
      }

      f.velocity.y += CONFIG.fragmentGravity * dt;

      f.mesh.position.x += f.velocity.x * dt;
      f.mesh.position.y += f.velocity.y * dt;
      f.mesh.position.z += f.velocity.z * dt;

      if (f.mesh.position.y < 0.1 && !f.bounced) {
        f.bounced = true;
        f.mesh.position.y = 0.1;
        f.velocity.y = -f.velocity.y * 0.4;
        f.velocity.x *= 0.5;
        f.velocity.z *= 0.5;
      }

      f.mesh.rotation.x += f.rotSpeed.x * dt;
      f.mesh.rotation.y += f.rotSpeed.y * dt;
      f.mesh.rotation.z += f.rotSpeed.z * dt;

      const progress = f.age / f.lifetime;
      f.material.opacity = 1 - progress;

      if (progress > 0.7) {
        const scaleProgress = (progress - 0.7) / 0.3;
        const scale = f.initialScale * (1 - scaleProgress);
        f.mesh.scale.setScalar(f.baseSize * Math.max(scale, 0));
      }
    }
  }

  clear(): void {
    for (const f of this.active) this.release(f);
    this.active.length = 0;
  }
}
