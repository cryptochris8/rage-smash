import * as THREE from 'three';
import { CONFIG } from '../../game/config';

interface Fragment {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  lifetime: number;
  age: number;
  bounced: boolean;
  initialScale: number;
}

type FragmentShapeType = 'box' | 'tetrahedron' | 'shard';

function pickShape(): FragmentShapeType {
  const r = Math.random();
  if (r < 0.60) return 'box';
  if (r < 0.85) return 'tetrahedron';
  return 'shard';
}

function createFragmentGeometry(shape: FragmentShapeType, size: number): THREE.BufferGeometry {
  switch (shape) {
    case 'box':
      return new THREE.BoxGeometry(size, size, size);
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(size * 0.65);
    case 'shard':
      return new THREE.BoxGeometry(size, size * 0.12, size * 0.65);
  }
}

function variedColor(baseColor: number): THREE.Color {
  const color = new THREE.Color(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  hsl.h += (Math.random() - 0.5) * 0.2;
  hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.3, 0, 1);

  color.setHSL(hsl.h, hsl.s, hsl.l);
  return color;
}

export class FragmentManager {
  private scene: THREE.Scene;
  private fragments: Fragment[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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
    const total = CONFIG.fragmentCount + extraCount;

    for (let i = 0; i < total; i++) {
      if (this.fragments.length >= CONFIG.maxFragments) {
        const oldest = this.fragments.shift()!;
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
        (oldest.mesh.material as THREE.Material).dispose();
      }

      const size = 0.08 + Math.random() * 0.14;

      const shape = pickShape();
      const geometry = createFragmentGeometry(shape, size);

      // Pick color: use overrides if provided, otherwise base color
      let baseColor = color;
      if (colorOverrides && colorOverrides.length > 0) {
        baseColor = colorOverrides[Math.floor(Math.random() * colorOverrides.length)];
      }
      const fragColor = variedColor(baseColor);

      const material = new THREE.MeshStandardMaterial({
        color: fragColor,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const spread = CONFIG.fragmentSpread;
      const vx = Math.cos(angle) * (Math.random() * spread);
      const vy = Math.random() * spread * 0.8 + spread * 0.3;
      const vz = Math.sin(angle) * (Math.random() * spread);

      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
      );

      this.scene.add(mesh);

      this.fragments.push({
        mesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        rotSpeed,
        lifetime: CONFIG.fragmentLifetime,
        age: 0,
        bounced: false,
        initialScale: 1,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const frag = this.fragments[i];
      frag.age += dt;

      if (frag.age >= frag.lifetime) {
        this.scene.remove(frag.mesh);
        frag.mesh.geometry.dispose();
        (frag.mesh.material as THREE.Material).dispose();
        this.fragments.splice(i, 1);
        continue;
      }

      frag.velocity.y += CONFIG.fragmentGravity * dt;

      frag.mesh.position.x += frag.velocity.x * dt;
      frag.mesh.position.y += frag.velocity.y * dt;
      frag.mesh.position.z += frag.velocity.z * dt;

      if (frag.mesh.position.y < 0.1 && !frag.bounced) {
        frag.bounced = true;
        frag.mesh.position.y = 0.1;
        frag.velocity.y = -frag.velocity.y * 0.4;
        frag.velocity.x *= 0.5;
        frag.velocity.z *= 0.5;
      }

      frag.mesh.rotation.x += frag.rotSpeed.x * dt;
      frag.mesh.rotation.y += frag.rotSpeed.y * dt;
      frag.mesh.rotation.z += frag.rotSpeed.z * dt;

      const progress = frag.age / frag.lifetime;

      (frag.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - progress;

      if (progress > 0.7) {
        const scaleProgress = (progress - 0.7) / 0.3;
        const scale = frag.initialScale * (1 - scaleProgress);
        frag.mesh.scale.setScalar(Math.max(scale, 0));
      }
    }
  }

  clear(): void {
    for (const frag of this.fragments) {
      this.scene.remove(frag.mesh);
      frag.mesh.geometry.dispose();
      (frag.mesh.material as THREE.Material).dispose();
    }
    this.fragments.length = 0;
  }
}
