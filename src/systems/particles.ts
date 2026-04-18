import * as THREE from 'three';
import { CONFIG } from '../game/config';
import type { ParticleTheme } from '../game/state';
import { motionScale } from './motion-prefs';

type ParticleKind = 'box' | 'coin' | 'confetti';

interface Particle {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  velocity: THREE.Vector3;
  baseSize: THREE.Vector3;
  age: number;
  lifetime: number;
  baseScale: number;
  baseAlpha: number;
  kind: ParticleKind;
}

interface Shockwave {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  age: number;
  lifetime: number;
  baseAlpha: number;
}

// Shared unit-sized geometries — physical size is applied via mesh.scale.
const BOX_GEOM = new THREE.BoxGeometry(1, 1, 1);
const COIN_GEOM = new THREE.CylinderGeometry(1, 1, 0.2, 8);
const CONFETTI_GEOM = new THREE.PlaneGeometry(1, 1);
const SHOCKWAVE_GEOM = new THREE.RingGeometry(0.05, 0.15, 32);

const TMP_COLOR = new THREE.Color();

function applyVariedColor(baseColor: number, out: THREE.Color): void {
  out.setHex(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  out.getHSL(hsl);
  hsl.h += (Math.random() - 0.5) * 0.16;
  hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.2, 0, 1);
  out.setHSL(hsl.h, hsl.s, hsl.l);
}

const DRAG_FACTOR = 0.95;

export class ParticleSystem {
  private scene: THREE.Scene;
  private active: Particle[] = [];
  private shockwavesActive: Shockwave[] = [];

  // Free-lists: inactive Particle structs (mesh + material are retained)
  private boxPool: Particle[] = [];
  private coinPool: Particle[] = [];
  private confettiPool: Particle[] = [];
  private shockwavePool: Shockwave[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private poolFor(kind: ParticleKind): Particle[] {
    return kind === 'box' ? this.boxPool : kind === 'coin' ? this.coinPool : this.confettiPool;
  }

  private acquireParticle(kind: ParticleKind): Particle {
    const pool = this.poolFor(kind);
    const reused = pool.pop();
    if (reused) {
      reused.mesh.visible = true;
      return reused;
    }
    let geom: THREE.BufferGeometry;
    let material: THREE.MeshBasicMaterial;
    if (kind === 'box') {
      geom = BOX_GEOM;
      material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 });
    } else if (kind === 'coin') {
      geom = COIN_GEOM;
      material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1 });
    } else {
      geom = CONFETTI_GEOM;
      material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, side: THREE.DoubleSide });
    }
    const mesh = new THREE.Mesh(geom, material);
    this.scene.add(mesh);
    return {
      mesh,
      material,
      velocity: new THREE.Vector3(),
      baseSize: new THREE.Vector3(1, 1, 1),
      age: 0,
      lifetime: 1,
      baseScale: 1,
      baseAlpha: 1,
      kind,
    };
  }

  private releaseParticle(p: Particle): void {
    p.mesh.visible = false;
    this.poolFor(p.kind).push(p);
  }

  private acquireShockwave(): Shockwave {
    const reused = this.shockwavePool.pop();
    if (reused) {
      reused.mesh.visible = true;
      return reused;
    }
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(SHOCKWAVE_GEOM, material);
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    return { mesh, material, age: 0, lifetime: 0.35, baseAlpha: 0.8 };
  }

  private releaseShockwave(s: Shockwave): void {
    s.mesh.visible = false;
    this.shockwavePool.push(s);
  }

  emit(position: THREE.Vector3, color: number, theme?: ParticleTheme): void {
    const themeConfig = CONFIG.particleThemes[theme ?? 'default'] ?? CONFIG.particleThemes['default'];
    const count = Math.max(1, Math.round(CONFIG.particleCount * themeConfig.countMul * motionScale()));
    const baseAlpha = themeConfig.alpha;

    for (let i = 0; i < count; i++) {
      const size = (0.04 + Math.random() * 0.08) * themeConfig.sizeMul;
      const p = this.acquireParticle('box');

      applyVariedColor(color, TMP_COLOR);
      p.material.color.copy(TMP_COLOR);
      p.material.opacity = baseAlpha;

      p.mesh.position.copy(position);
      p.mesh.scale.setScalar(0.01);
      p.baseSize.set(size, size, size);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = CONFIG.particleSpread * (0.5 + Math.random() * 0.5);
      p.velocity.set(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.abs(Math.cos(phi)) * speed,
        Math.sin(theta) * Math.sin(phi) * speed,
      );

      p.age = 0;
      p.lifetime = CONFIG.particleLifetime;
      p.baseScale = 1;
      p.baseAlpha = baseAlpha;

      this.active.push(p);
    }
  }

  /** Gold coin-shaped particles arcing upward */
  emitCoinBurst(position: THREE.Vector3): void {
    const count = Math.max(1, Math.round(CONFIG.coinBurstCount * motionScale()));
    for (let i = 0; i < count; i++) {
      const size = 0.06 + Math.random() * 0.04;
      const p = this.acquireParticle('coin');

      TMP_COLOR.setHex(0xffd700).lerp(new THREE.Color(0xffee88), Math.random() * 0.3);
      p.material.color.copy(TMP_COLOR);
      p.material.opacity = 1;

      p.mesh.position.copy(position);
      p.mesh.scale.setScalar(0.01);
      p.baseSize.set(size, size, size);

      const theta = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      p.velocity.set(
        Math.cos(theta) * speed * 0.5,
        2 + Math.random() * 2,
        Math.sin(theta) * speed * 0.5,
      );

      p.age = 0;
      p.lifetime = 0.6;
      p.baseScale = 1;
      p.baseAlpha = 1;

      this.active.push(p);
    }
  }

  /** Colorful confetti burst from above on combo milestones */
  emitConfetti(): void {
    const count = Math.max(1, Math.round(CONFIG.confettiCount * motionScale()));
    const colors = CONFIG.confettiColors;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const width = 0.06 + Math.random() * 0.06;
      const height = 0.04 + Math.random() * 0.04;

      const p = this.acquireParticle('confetti');
      p.material.color.setHex(color);
      p.material.opacity = 1;

      p.mesh.position.set(
        (Math.random() - 0.5) * 6,
        5 + Math.random() * 2,
        (Math.random() - 0.5) * 4,
      );
      p.mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      p.mesh.scale.setScalar(0.01);
      p.baseSize.set(width, height, 1);

      p.velocity.set(
        (Math.random() - 0.5) * 2,
        -(1 + Math.random() * 2),
        (Math.random() - 0.5) * 1,
      );

      p.age = 0;
      p.lifetime = 1.5 + Math.random() * 0.5;
      p.baseScale = 1;
      p.baseAlpha = 1;

      this.active.push(p);
    }
  }

  /** Expanding shockwave ring on impact */
  emitShockwave(position: THREE.Vector3, color?: number): void {
    const s = this.acquireShockwave();
    s.material.color.setHex(color ?? 0xffffff);
    s.material.opacity = 0.8;
    s.mesh.position.copy(position);
    s.mesh.scale.setScalar(0.1);
    s.age = 0;
    s.lifetime = 0.35;
    s.baseAlpha = 0.8;
    this.shockwavesActive.push(s);
  }

  /** Large gold particles for jackpot event */
  emitJackpotBurst(position: THREE.Vector3): void {
    const count = Math.max(1, Math.round(CONFIG.jackpotParticleCount * motionScale()));
    const color = CONFIG.jackpotParticleColor;

    for (let i = 0; i < count; i++) {
      const size = 0.1 + Math.random() * 0.08;
      const p = this.acquireParticle('box');

      TMP_COLOR.setHex(color).lerp(new THREE.Color(0xffee88), Math.random() * 0.3);
      p.material.color.copy(TMP_COLOR);
      p.material.opacity = 1;

      p.mesh.position.copy(position);
      p.mesh.scale.setScalar(0.01);
      p.baseSize.set(size, size, size);

      const theta = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      p.velocity.set(
        Math.cos(theta) * speed * 0.7,
        3 + Math.random() * 4,
        Math.sin(theta) * speed * 0.7,
      );

      p.age = 0;
      p.lifetime = 1.0 + Math.random() * 0.5;
      p.baseScale = 1.5;
      p.baseAlpha = 1;

      this.active.push(p);
    }
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.age += dt;

      if (p.age >= p.lifetime) {
        // swap-and-pop
        const last = this.active.length - 1;
        if (i !== last) this.active[i] = this.active[last];
        this.active.pop();
        this.releaseParticle(p);
        continue;
      }

      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      p.velocity.y += CONFIG.fragmentGravity * dt;
      p.velocity.multiplyScalar(DRAG_FACTOR);

      const lifeRatio = p.age / p.lifetime;

      // Preserve original compound opacity fade (reset-on-zero branch intact).
      const mat = p.material;
      mat.opacity = (mat.opacity > 0 ? mat.opacity : 1) * (1 - lifeRatio);

      let lifeScale: number;
      if (lifeRatio < 0.2) {
        lifeScale = p.baseScale * (lifeRatio / 0.2);
      } else {
        lifeScale = p.baseScale * (1 - (lifeRatio - 0.2) / 0.8);
      }
      const s = Math.max(lifeScale, 0);
      p.mesh.scale.set(p.baseSize.x * s, p.baseSize.y * s, p.baseSize.z * s);
    }

    for (let i = this.shockwavesActive.length - 1; i >= 0; i--) {
      const sw = this.shockwavesActive[i];
      sw.age += dt;

      if (sw.age >= sw.lifetime) {
        const last = this.shockwavesActive.length - 1;
        if (i !== last) this.shockwavesActive[i] = this.shockwavesActive[last];
        this.shockwavesActive.pop();
        this.releaseShockwave(sw);
        continue;
      }

      const t = sw.age / sw.lifetime;
      sw.mesh.scale.setScalar(0.1 + t * 4);
      sw.material.opacity = sw.baseAlpha * (1 - t * t);
    }
  }
}
