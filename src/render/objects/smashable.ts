import * as THREE from 'three';
import { CONFIG } from '../../game/config';
import { SmashableObjectDef } from '../../game/state';
import { ModelManager } from '../ModelManager';
import { MODEL_REGISTRY } from '../../content/model-registry';

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function lightenColor(hex: number, factor: number): number {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0xffffff), factor);
  return c.getHex();
}

function darkenColor(hex: number, factor: number): number {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0x000000), factor);
  return c.getHex();
}

// ---------------------------------------------------------------------------
// Shared material factory
// ---------------------------------------------------------------------------

function mat(color: number, extras?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, ...extras });
}

// ---------------------------------------------------------------------------
// Object builders
// ---------------------------------------------------------------------------

function buildCan(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.5, 24),
    mat(def.color),
  );
  const topDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24),
    mat(lightenColor(def.color, 0.3)),
  );
  topDisc.position.y = 0.265;
  const bottomDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.03, 24),
    mat(lightenColor(def.color, 0.15)),
  );
  bottomDisc.position.y = -0.265;
  group.add(body, topDisc, bottomDisc);
  return group;
}

function buildMug(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.4, 24),
    mat(def.color),
  );
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.04, 8, 16),
    mat(def.color),
  );
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.35, 0, 0);
  group.add(body, handle);
  return group;
}

function buildPhone(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.7, 0.05),
    mat(def.color),
  );
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.6, 0.052),
    mat(darkenColor(def.color, 0.4)),
  );
  screen.position.z = 0.002;
  group.add(body, screen);
  return group;
}

function buildLamp(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.5, 24),
    mat(def.color),
  );
  shade.position.y = 0.35;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8),
    mat(darkenColor(def.color, 0.3)),
  );
  pole.position.y = -0.2;
  group.add(shade, pole);
  return group;
}

function buildFootball(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    mat(def.color),
  );
  ball.scale.z = 1.3;
  group.add(ball);
  return group;
}

function buildSoccer(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    mat(def.color),
  );
  group.add(ball);
  return group;
}

function buildTrophy(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const cup = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 0.5, 24, 1, true),
    mat(def.color),
  );
  cup.rotation.x = Math.PI;
  cup.position.y = 0.35;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8),
    mat(def.color),
  );
  stem.position.y = 0.0;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24),
    mat(def.color),
  );
  base.position.y = -0.19;
  group.add(cup, stem, base);
  return group;
}

function buildHelmet(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(def.color),
  );
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.08, 0.15),
    mat(darkenColor(def.color, 0.3)),
  );
  visor.position.set(0, -0.02, 0.3);
  group.add(dome, visor);
  return group;
}

function buildDuck(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    mat(def.color),
  );
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    mat(def.color),
  );
  head.position.set(0, 0.28, 0.18);
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.12, 8),
    mat(0xff8c00),
  );
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 0.25, 0.38);
  group.add(body, head, beak);
  return group;
}

function buildCubeIdol(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    mat(def.color),
  );
  const wireframe = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshStandardMaterial({
      color: def.color,
      wireframe: true,
      emissive: new THREE.Color(lightenColor(def.color, 0.5)),
      emissiveIntensity: 0.6,
    }),
  );
  group.add(cube, wireframe);
  return group;
}

function buildTvHead(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.35, 0.3),
    mat(def.color),
  );
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.28, 0.01),
    mat(darkenColor(def.color, 0.45)),
  );
  screen.position.z = 0.155;
  const antennaL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6),
    mat(darkenColor(def.color, 0.2)),
  );
  antennaL.position.set(-0.1, 0.27, 0);
  antennaL.rotation.z = 0.3;
  const antennaR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6),
    mat(darkenColor(def.color, 0.2)),
  );
  antennaR.position.set(0.1, 0.27, 0);
  antennaR.rotation.z = -0.3;
  group.add(body, screen, antennaL, antennaR);
  return group;
}

function buildStatue(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.1, 8, 24),
    mat(def.color),
  );
  ring.position.y = 0.2;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.3),
    mat(darkenColor(def.color, 0.25)),
  );
  base.position.y = -0.1;
  group.add(ring, base);
  return group;
}

// --- New objects ---

function buildBottle(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  // Body: translucent cylinder
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.5, 16),
    mat(def.color, { transparent: true, opacity: 0.7 }),
  );
  body.position.y = -0.05;
  // Neck: narrower cylinder
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.25, 12),
    mat(def.color, { transparent: true, opacity: 0.7 }),
  );
  neck.position.y = 0.35;
  // Cap: small cylinder on top
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12),
    mat(lightenColor(def.color, 0.3)),
  );
  cap.position.y = 0.505;
  group.add(body, neck, cap);
  // Store fragment color hints
  group.userData.fragmentColors = [def.color, lightenColor(def.color, 0.4)];
  return group;
}

function buildWatermelon(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  // Oblate sphere
  const melon = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    mat(def.color),
  );
  melon.scale.y = 0.75;
  // Stripe overlay (wireframe)
  const stripes = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 8, 8),
    new THREE.MeshStandardMaterial({
      color: darkenColor(def.color, 0.4),
      wireframe: true,
    }),
  );
  stripes.scale.y = 0.75;
  group.add(melon, stripes);
  // Store fragment color hints (red inside + green outside)
  group.userData.fragmentColors = [0xff3333, def.color];
  return group;
}

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------

function buildDefault(def: SmashableObjectDef): THREE.Group {
  const group = new THREE.Group();
  let geometry: THREE.BufferGeometry;
  switch (def.geometry) {
    case 'box':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 32);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 16, 16);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(0.5, 1, 16);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 24);
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
  }
  const mesh = new THREE.Mesh(geometry, mat(def.color));
  group.add(mesh);
  return group;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

function buildObject(def: SmashableObjectDef): THREE.Group {
  switch (def.id) {
    // Everyday pack
    case 'can':        return buildCan(def);
    case 'mug':        return buildMug(def);
    case 'phone':      return buildPhone(def);
    case 'lamp':       return buildLamp(def);
    case 'bottle':     return buildBottle(def);
    // Sports pack
    case 'football':   return buildFootball(def);
    case 'soccer':     return buildSoccer(def);
    case 'trophy':     return buildTrophy(def);
    case 'helmet':     return buildHelmet(def);
    // Weird pack
    case 'duck':       return buildDuck(def);
    case 'cube-idol':  return buildCubeIdol(def);
    case 'tv-head':    return buildTvHead(def);
    case 'statue':     return buildStatue(def);
    case 'watermelon': return buildWatermelon(def);
    // Fallback
    default:           return buildDefault(def);
  }
}

// ---------------------------------------------------------------------------
// SmashableManager
// ---------------------------------------------------------------------------

export class SmashableManager {
  private scene: THREE.Scene;
  private modelManager: ModelManager | null = null;
  private currentGroup: THREE.Group | null = null;
  private animProgress: number = 1;
  private targetScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  private elapsedTime: number = 0;
  private baseY: number = CONFIG.objectSpawnY;

  constructor(scene: THREE.Scene, modelManager?: ModelManager) {
    this.scene = scene;
    this.modelManager = modelManager ?? null;
  }

  setModelManager(mgr: ModelManager): void {
    this.modelManager = mgr;
  }

  spawn(def: SmashableObjectDef): void {
    if (this.currentGroup) {
      this.scene.remove(this.currentGroup);
      this.currentGroup = null;
    }

    // Check registry for a GLB model
    const entry = MODEL_REGISTRY[def.id];
    if (entry && this.modelManager) {
      // Try synchronous clone first (model already cached from preload)
      const clone = this.modelManager.get(entry.path);
      if (clone) {
        this.placeGroup(clone, def, entry);
        return;
      }
      // Async fallback — show procedural immediately, swap when loaded
      const fallback = buildObject(def);
      this.placeGroup(fallback, def, entry);
      this.modelManager.loadAndClone(entry.path).then((loaded) => {
        if (loaded && this.currentGroup === fallback) {
          this.scene.remove(fallback);
          // Carry over position and rotation but NOT scale — placeGroupDirect
          // will apply the correct registry scale
          loaded.position.copy(fallback.position);
          loaded.rotation.copy(fallback.rotation);
          this.placeGroupDirect(loaded, def, entry);
        }
      });
      return;
    }

    // No registry entry — use procedural geometry
    const group = buildObject(def);
    this.placeGroup(group, def);
  }

  /** Place a group into the scene with spawn animation setup. */
  private placeGroup(
    group: THREE.Group,
    def: SmashableObjectDef,
    entry?: { scale?: number | [number, number, number]; offsetY?: number },
  ): void {
    group.userData.primaryColor = def.color;

    group.scale.set(0, 0, 0);

    if (entry?.scale != null) {
      const s = entry.scale;
      if (typeof s === 'number') {
        this.targetScale.set(s, s, s);
      } else {
        this.targetScale.set(s[0], s[1], s[2]);
      }
    } else {
      this.targetScale.set(def.scale[0], def.scale[1], def.scale[2]);
    }

    this.baseY = CONFIG.objectSpawnY + (entry?.offsetY ?? 0);
    group.position.set(0, this.baseY, 0);

    this.scene.add(group);
    this.currentGroup = group;
    this.animProgress = 0;
    this.elapsedTime = 0;
  }

  /** Place a group directly (for async swap — applies scale immediately). */
  private placeGroupDirect(
    group: THREE.Group,
    def: SmashableObjectDef,
    entry?: { scale?: number | [number, number, number]; offsetY?: number },
  ): void {
    group.userData.primaryColor = def.color;

    if (entry?.scale != null) {
      const s = entry.scale;
      if (typeof s === 'number') {
        this.targetScale.set(s, s, s);
      } else {
        this.targetScale.set(s[0], s[1], s[2]);
      }
    } else {
      this.targetScale.set(def.scale[0], def.scale[1], def.scale[2]);
    }

    // Apply scale immediately — animation already completed on the fallback
    group.scale.set(this.targetScale.x, this.targetScale.y, this.targetScale.z);

    this.baseY = CONFIG.objectSpawnY + (entry?.offsetY ?? 0);

    this.scene.add(group);
    this.currentGroup = group;
  }

  getCurrent(): THREE.Group | null {
    return this.currentGroup;
  }

  remove(): THREE.Group | null {
    const group = this.currentGroup;
    if (group) {
      this.scene.remove(group);
      this.currentGroup = null;
    }
    return group;
  }

  update(dt: number): void {
    if (!this.currentGroup) {
      return;
    }

    if (this.animProgress < 1) {
      this.animProgress += dt / CONFIG.spawnAnimDuration;
      if (this.animProgress > 1) {
        this.animProgress = 1;
      }

      // Elastic ease-out: overshoot to ~1.1 then settle to 1.0
      const p = this.animProgress;
      const t = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) * Math.cos((p * 10 - 0.75) * ((2 * Math.PI) / 3));

      this.currentGroup.scale.set(
        this.targetScale.x * t,
        this.targetScale.y * t,
        this.targetScale.z * t,
      );
    }

    if (this.animProgress >= 1) {
      this.elapsedTime += dt;

      this.currentGroup.position.y = this.baseY + Math.sin(this.elapsedTime * 2) * 0.05;
      this.currentGroup.rotation.y += 0.5 * dt;
    }
  }
}
