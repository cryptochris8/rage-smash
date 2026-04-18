import * as THREE from 'three';
import { Store } from '../game/state';
import { CONFIG } from '../game/config';
import { calculateCoins } from '../game/economy';
import { SmashableManager } from '../render/objects/smashable';
import { FragmentManager } from '../render/objects/fragments';
import { OBJECTS } from '../content/objects';
import { HAMMER_SKINS } from '../content/skins';
import { ParticleSystem } from './particles';
import { AudioManager } from '../audio/AudioManager';
import { IAdSystem } from '../ads/types';
import { JackpotSystem } from './jackpot';
import { StarterPackSystem } from './starter-pack';
import { EventSystem } from './events';
import { ModelManager } from '../render/ModelManager';

type SmashPhase = 'idle' | 'swinging' | 'returning';

export class SmashSystem {
  private scene: THREE.Scene;
  private store: Store;
  private smashableManager: SmashableManager;
  private fragmentManager: FragmentManager;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private adSystem: IAdSystem;
  private jackpotSystem: JackpotSystem;
  private starterPackSystem: StarterPackSystem;
  private eventSystem: EventSystem;

  private hammer: THREE.Group;
  private phase: SmashPhase = 'idle';
  private timer = 0;
  private pendingChargeMultiplier = 1;
  private modelManager: ModelManager;
  private hammerModelLoaded = false;
  private currentHammerSkinId: string = '';

  private aura: THREE.Mesh;
  private auraMaterial: THREE.MeshBasicMaterial;
  private auraTargetColor = new THREE.Color(0xffffff);
  private auraTargetAlpha = 0;
  private auraCurrentAlpha = 0;
  private auraPulsePhase = 0;

  private chargeLevel = 0;
  private breathePhase = 0;

  constructor(
    scene: THREE.Scene,
    store: Store,
    smashableManager: SmashableManager,
    fragmentManager: FragmentManager,
    particleSystem: ParticleSystem,
    audioManager: AudioManager,
    adSystem: IAdSystem,
    jackpotSystem: JackpotSystem,
    starterPackSystem: StarterPackSystem,
    eventSystem: EventSystem,
    modelManager: ModelManager,
  ) {
    this.scene = scene;
    this.store = store;
    this.smashableManager = smashableManager;
    this.fragmentManager = fragmentManager;
    this.particleSystem = particleSystem;
    this.audioManager = audioManager;
    this.adSystem = adSystem;
    this.jackpotSystem = jackpotSystem;
    this.starterPackSystem = starterPackSystem;
    this.eventSystem = eventSystem;
    this.modelManager = modelManager;

    this.hammer = this.createHammer();
    this.scene.add(this.hammer);

    // Combo-tier aura: additive-blended sphere sitting at the hammer head,
    // parented to the hammer group so it follows the swing.
    const auraGeom = new THREE.SphereGeometry(0.38, 20, 16);
    this.auraMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.aura = new THREE.Mesh(auraGeom, this.auraMaterial);
    this.aura.position.y = -CONFIG.hammerLength;
    this.aura.visible = false;
    this.hammer.add(this.aura);

    // Load initial hammer model and react to skin changes
    this.applyHammerSkin();
    this.store.subscribe(() => this.applyHammerSkin());
  }

  /** Reposition the aura to the current hammer's head after a skin swap. */
  private attachAura(): void {
    if (!this.aura) return;
    if (this.aura.parent) this.aura.parent.remove(this.aura);
    // For procedural hammers the head sits at y = -hammerLength. For GLB models
    // wrapped in an outerGroup, y = -hammerLength * 1.2 roughly matches the head
    // (models are scaled to hammerLength * 1.2). Either way -hammerLength reads
    // as "bottom of the hammer," which is visually correct.
    this.aura.position.set(0, -CONFIG.hammerLength, 0);
    this.hammer.add(this.aura);
  }

  /** Set combo tier visuals — color + target alpha for the hammer aura. */
  setComboTier(color: number, alpha: number): void {
    this.auraTargetColor.setHex(color);
    this.auraTargetAlpha = alpha;
  }

  /** 0..1 charge level drives the idle hammer breathe-scale. */
  setChargeLevel(level: number): void {
    this.chargeLevel = Math.max(0, Math.min(1, level));
  }

  private applyHammerSkin(): void {
    const skin = HAMMER_SKINS.find((s) => s.id === this.store.state.selectedHammer);
    if (!skin) return;

    // If skin changed, swap model or revert to procedural
    if (skin.id !== this.currentHammerSkinId) {
      this.currentHammerSkinId = skin.id;
      if (skin.model) {
        this.loadHammerModel(skin.model);
      } else {
        this.swapToProcedural(skin.color);
      }
      return;
    }

    // Same skin — only tint procedural (color-only) hammers.
    // 3D model skins keep their original textures untouched.
    if (!skin.model && !this.hammerModelLoaded) {
      const head = this.hammer.children[1] as THREE.Mesh;
      if (head) {
        (head.material as THREE.MeshStandardMaterial).color.setHex(skin.color);
      }
    }
  }

  private tintHammerModel(color: number): void {
    this.hammer.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat.color) {
            stdMat.color.setHex(color);
          }
        }
      }
    });
  }

  private swapToProcedural(color: number): void {
    const pos = this.hammer.position.clone();
    const rot = this.hammer.rotation.clone();
    this.scene.remove(this.hammer);

    this.hammer = this.createHammer();
    this.hammer.position.copy(pos);
    this.hammer.rotation.copy(rot);
    this.hammerModelLoaded = false;
    this.scene.add(this.hammer);

    const head = this.hammer.children[1] as THREE.Mesh;
    if (head) {
      (head.material as THREE.MeshStandardMaterial).color.setHex(color);
    }

    this.attachAura();
  }

  private async loadHammerModel(modelPath: string): Promise<void> {
    const model = await this.modelManager.loadAndClone(modelPath);
    if (!model) return;

    // Deep-clone materials so tinting one hammer can't affect the cache
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
      }
    });

    // If skin changed again while loading, abort
    const skin = HAMMER_SKINS.find((s) => s.id === this.store.state.selectedHammer);
    if (!skin || skin.model !== modelPath) return;

    const pos = this.hammer.position.clone();
    const rot = this.hammer.rotation.clone();
    this.scene.remove(this.hammer);

    // GLB models are normalized to 1 unit sitting on y=0.
    // modelFlip: true = head is at top natively, flip 180° so head hangs below pivot.
    // modelFlip: false/omitted = head is already at bottom, no flip needed.
    const outerGroup = new THREE.Group();
    const hammerScale = CONFIG.hammerLength * 1.2;
    model.scale.setScalar(hammerScale);

    if (skin.modelFlip) {
      // Head at top natively — flip so head hangs below pivot.
      // After flip, handle naturally lands at origin (pivot).
      model.rotation.x = Math.PI;
    } else {
      // Head at bottom natively — offset down so handle top is at pivot.
      model.position.y = -hammerScale;
    }
    model.rotation.y = skin.modelRotationY ?? -Math.PI / 2;

    outerGroup.add(model);
    outerGroup.position.copy(pos);
    outerGroup.rotation.copy(rot);

    this.hammer = outerGroup;
    this.hammerModelLoaded = true;
    this.scene.add(this.hammer);

    this.attachAura();
  }

  private createHammer(): THREE.Group {
    const group = new THREE.Group();

    const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, CONFIG.hammerLength, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -CONFIG.hammerLength / 2;

    const headGeometry = new THREE.BoxGeometry(
      CONFIG.hammerHeadSize * 2,
      CONFIG.hammerHeadSize,
      CONFIG.hammerHeadSize
    );
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = -CONFIG.hammerLength;

    group.add(handle);
    group.add(head);

    group.position.set(1.5, 3, 0);
    group.rotation.z = CONFIG.hammerRestAngle;

    return group;
  }

  showHammer(): void { this.hammer.visible = true; }
  hideHammer(): void { this.hammer.visible = false; }

  /** Set charge multiplier before calling execute() */
  setChargeMultiplier(mul: number): void {
    this.pendingChargeMultiplier = mul;
  }

  execute(): void {
    if (this.phase !== 'idle') return;

    this.store.update({ isSmashing: true, canTap: false });
    this.phase = 'swinging';
    this.timer = 0;
  }

  update(dt: number): void {
    // Aura runs every frame (including idle) so tier changes animate smoothly.
    this.updateAura(dt);

    // Breathe-scale while idle and charging. During swing/return the scale
    // must be neutral so the rotation animation reads cleanly.
    if (this.phase === 'idle' && this.chargeLevel > 0) {
      this.breathePhase += dt * 7;
      const amp = 0.07 * this.chargeLevel;
      const s = 1 + Math.sin(this.breathePhase) * amp;
      this.hammer.scale.setScalar(s);
    } else if (this.hammer.scale.x !== 1) {
      this.hammer.scale.setScalar(1);
    }

    if (this.phase === 'idle') return;

    this.timer += dt;
    const halfDuration = CONFIG.smashDuration / 2;

    if (this.phase === 'swinging') {
      const t = Math.min(this.timer / halfDuration, 1);
      const eased = t * t;
      this.hammer.rotation.z = THREE.MathUtils.lerp(
        CONFIG.hammerRestAngle,
        CONFIG.hammerSmashAngle,
        eased
      );

      if (t >= 1) {
        this.onImpact();
        this.phase = 'returning';
        this.timer = 0;
      }
    } else if (this.phase === 'returning') {
      const t = Math.min(this.timer / halfDuration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      this.hammer.rotation.z = THREE.MathUtils.lerp(
        CONFIG.hammerSmashAngle,
        CONFIG.hammerRestAngle,
        eased
      );

      if (t >= 1) {
        this.hammer.rotation.z = CONFIG.hammerRestAngle;
        this.phase = 'idle';
        this.timer = 0;
        this.store.update({ isSmashing: false, canTap: true });
      }
    }
  }

  private updateAura(dt: number): void {
    // Smoothly lerp color + alpha toward the target set by setComboTier().
    this.auraMaterial.color.lerp(this.auraTargetColor, Math.min(1, dt * 6));
    const alphaLerp = Math.min(1, dt * 4);
    this.auraCurrentAlpha += (this.auraTargetAlpha - this.auraCurrentAlpha) * alphaLerp;

    // Gentle pulse so the glow feels alive, scaled by current alpha.
    this.auraPulsePhase += dt * 3.2;
    const pulse = 0.85 + Math.sin(this.auraPulsePhase) * 0.15;
    this.auraMaterial.opacity = this.auraCurrentAlpha * pulse;
    this.aura.visible = this.auraCurrentAlpha > 0.01;

    // Scale in with alpha so tier bumps feel like the aura inflating.
    const s = 0.7 + this.auraCurrentAlpha * 0.6;
    this.aura.scale.setScalar(s);
  }

  private onImpact(): void {
    const group = this.smashableManager.remove();
    if (!group) return;

    const position = group.position.clone();
    const color: number = group.userData.primaryColor ?? 0xffffff;

    // Find the object def for particle theme and sound
    const currentObjectId = this.store.state.currentObjectId;
    const def = currentObjectId ? OBJECTS.find((o) => o.id === currentObjectId) : null;
    const theme = def?.particleTheme;

    // Scale fragment count by charge level and combo streak
    const chargeMul = this.pendingChargeMultiplier;
    const chargeExtra = chargeMul > 1 ? Math.floor((chargeMul - 1) * 4) : 0;
    const streakExtra = Math.floor(this.store.state.streak / 5);
    const extraFragments = chargeExtra + streakExtra;

    // Visual effects
    this.fragmentManager.explode(position, color, extraFragments, def?.color ? [color] : undefined);
    this.particleSystem.emit(position, color, theme);
    this.particleSystem.emitCoinBurst(position);
    this.particleSystem.emitShockwave(position, color);

    // Economy
    const state = this.store.state;
    const streak = state.streak;
    const newStreak = streak + 1;

    let rarity: 'common' | 'uncommon' | 'rare' = 'common';
    if (def) rarity = def.rarity;

    const adMultiplier = this.adSystem.getRewardMultiplier();
    const starterBoost = this.starterPackSystem.getBoostMultiplier();
    const eventBonus = def ? 1 + this.eventSystem.getRewardBonus(def.pack) : 1;
    const result = calculateCoins(rarity, newStreak, chargeMul, adMultiplier * starterBoost * eventBonus, this.store.state.powerLevel);

    // Jackpot roll (doubled chance during Jackpot Frenzy event and/or Day 7 streak boost)
    const eventJackpotMul = this.eventSystem.isJackpotBoosted() ? 2 : 1;
    const streakBoostMul = this.store.state.jackpotBoostExpiresAt > Date.now() ? 2 : 1;
    const jackpotChanceMul = eventJackpotMul * streakBoostMul;
    const jackpot = this.jackpotSystem.roll(jackpotChanceMul);
    const finalCoins = jackpot.triggered ? result.coins * jackpot.multiplier : result.coins;

    const bestCombo = Math.max(state.bestCombo, result.multiplier);

    this.store.update({
      coins: state.coins + finalCoins,
      streak: newStreak,
      combo: result.multiplier,
      bestCombo,
      totalSmashes: state.totalSmashes + 1,
      currentObjectId: null,
      jackpotActive: jackpot.triggered,
      jackpotMultiplier: jackpot.multiplier,
    });

    // Jackpot visual effects
    if (jackpot.triggered) {
      this.particleSystem.emitJackpotBurst(position);
    }

    // Layered audio sequence: impact → break → coin → combo → rare boom
    // power = charge multiplier normalized to 0-1 range
    const power = Math.min(chargeMul / CONFIG.chargeMultiplierOptimalMax, 1);
    this.audioManager.playSmashSequence(currentObjectId, power, newStreak, rarity);

    // Reset charge multiplier
    this.pendingChargeMultiplier = 1;
  }
}
