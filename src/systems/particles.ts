import * as THREE from 'three';
import { CONFIG } from '../game/config';
import type { ParticleTheme } from '../game/state';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  baseScale: number;
}

function variedParticleColor(baseColor: number): THREE.Color {
  const color = new THREE.Color(baseColor);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  // Slight hue shift +/-8%
  hsl.h += (Math.random() - 0.5) * 0.16;
  // Slight lightness offset +/-0.1
  hsl.l = THREE.MathUtils.clamp(hsl.l + (Math.random() - 0.5) * 0.2, 0, 1);

  color.setHSL(hsl.h, hsl.s, hsl.l);
  return color;
}

const DRAG_FACTOR = 0.95;

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  emit(position: THREE.Vector3, color: number, theme?: ParticleTheme): void {
    const themeConfig = CONFIG.particleThemes[theme ?? 'default'] ?? CONFIG.particleThemes['default'];
    const count = Math.round(CONFIG.particleCount * themeConfig.countMul);
    const baseAlpha = themeConfig.alpha;

    for (let i = 0; i < count; i++) {
      // Varied particle size
      const size = (0.04 + Math.random() * 0.08) * themeConfig.sizeMul;

      const geometry = new THREE.BoxGeometry(size, size, size);

      // Slight color variation per particle
      const particleColor = variedParticleColor(color);

      const material = new THREE.MeshBasicMaterial({
        color: particleColor,
        transparent: true,
        opacity: baseAlpha,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);

      // Start small -- will scale up during first 20% of life
      mesh.scale.setScalar(0.01);

      // Random outward velocity (high initial speed)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = CONFIG.particleSpread * (0.5 + Math.random() * 0.5);

      const velocity = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.abs(Math.cos(phi)) * speed,
        Math.sin(theta) * Math.sin(phi) * speed,
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        age: 0,
        lifetime: CONFIG.particleLifetime,
        baseScale: 1,
      });
    }
  }

  /** Gold coin-shaped particles arcing upward */
  emitCoinBurst(position: THREE.Vector3): void {
    const count = CONFIG.coinBurstCount;
    for (let i = 0; i < count; i++) {
      const size = 0.06 + Math.random() * 0.04;
      // Flat disc shape
      const geometry = new THREE.CylinderGeometry(size, size, size * 0.2, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffd700).lerp(new THREE.Color(0xffee88), Math.random() * 0.3),
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.scale.setScalar(0.01);

      const theta = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      const velocity = new THREE.Vector3(
        Math.cos(theta) * speed * 0.5,
        2 + Math.random() * 2,
        Math.sin(theta) * speed * 0.5,
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        age: 0,
        lifetime: 0.6,
        baseScale: 1,
      });
    }
  }

  /** Colorful confetti burst from above on combo milestones */
  emitConfetti(): void {
    const count = CONFIG.confettiCount;
    const colors = CONFIG.confettiColors;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const width = 0.06 + Math.random() * 0.06;
      const height = 0.04 + Math.random() * 0.04;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Spawn from above, spread horizontally
      mesh.position.set(
        (Math.random() - 0.5) * 6,
        5 + Math.random() * 2,
        (Math.random() - 0.5) * 4,
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      mesh.scale.setScalar(0.01);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -(1 + Math.random() * 2),
        (Math.random() - 0.5) * 1,
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        age: 0,
        lifetime: 1.5 + Math.random() * 0.5,
        baseScale: 1,
      });
    }
  }

  /** Large gold particles for jackpot event */
  emitJackpotBurst(position: THREE.Vector3): void {
    const count = CONFIG.jackpotParticleCount;
    const color = CONFIG.jackpotParticleColor;

    for (let i = 0; i < count; i++) {
      const size = 0.1 + Math.random() * 0.08;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color(0xffee88), Math.random() * 0.3),
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.scale.setScalar(0.01);

      const theta = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.cos(theta) * speed * 0.7,
        3 + Math.random() * 4,
        Math.sin(theta) * speed * 0.7,
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        age: 0,
        lifetime: 1.0 + Math.random() * 0.5,
        baseScale: 1.5,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.age += dt;

      if (particle.age >= particle.lifetime) {
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        (particle.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Apply velocity
      particle.mesh.position.x += particle.velocity.x * dt;
      particle.mesh.position.y += particle.velocity.y * dt;
      particle.mesh.position.z += particle.velocity.z * dt;

      // Apply gravity
      particle.velocity.y += CONFIG.fragmentGravity * dt;

      // Drag: decelerate velocity each frame
      particle.velocity.multiplyScalar(DRAG_FACTOR);

      // Lifetime ratio
      const lifeRatio = particle.age / particle.lifetime;

      // Fade opacity
      const mat = particle.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (mat.opacity > 0 ? mat.opacity : 1) * (1 - lifeRatio);

      // Scale animation: grow for first 20% of life, shrink for remaining 80%
      let scale: number;
      if (lifeRatio < 0.2) {
        // Grow from 0 to full scale during first 20%
        scale = particle.baseScale * (lifeRatio / 0.2);
      } else {
        // Shrink from full scale to 0 during remaining 80%
        scale = particle.baseScale * (1 - (lifeRatio - 0.2) / 0.8);
      }
      particle.mesh.scale.setScalar(Math.max(scale, 0));
    }
  }
}
