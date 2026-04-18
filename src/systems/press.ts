import * as THREE from 'three';
import { Store } from '../game/state';
import { CONFIG } from '../game/config';
import { calculateCoins } from '../game/economy';
import { SmashableManager } from '../render/objects/smashable';
import { FragmentManager } from '../render/objects/fragments';
import { OBJECTS } from '../content/objects';
import { ParticleSystem } from './particles';
import { AudioManager } from '../audio/AudioManager';
import { IAdSystem } from '../ads/types';
import { JackpotSystem } from './jackpot';
import { StarterPackSystem } from './starter-pack';
import { EventSystem } from './events';

type PressPhase = 'idle' | 'descending' | 'crushing' | 'rising';

export class PressSystem {
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

  private press: THREE.Group;
  private plate: THREE.Mesh;
  private phase: PressPhase = 'idle';
  private timer = 0;
  private targetObject: THREE.Group | null = null;
  private originalScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);
  private crushFragmentsEmitted = 0;

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

    this.press = new THREE.Group();
    this.plate = this.createPress();
    this.press.visible = false;
    this.scene.add(this.press);
  }

  private createPress(): THREE.Mesh {
    // Plate
    const plateGeo = new THREE.BoxGeometry(1.6, 0.2, 1.6);
    const plateMat = new THREE.MeshStandardMaterial({
      color: CONFIG.pressPlateColor,
      metalness: 0.8,
      roughness: 0.3,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    this.press.add(plate);

    // Guide rails
    const railGeo = new THREE.BoxGeometry(0.08, 3, 0.08);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-0.9, 0, 0);
    this.press.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat.clone());
    rightRail.position.set(0.9, 0, 0);
    this.press.add(rightRail);

    this.press.position.set(0, CONFIG.pressRestY, 0);

    return plate;
  }

  show(): void {
    this.press.visible = true;
  }

  hide(): void {
    this.press.visible = false;
  }

  execute(): void {
    if (this.phase !== 'idle') return;

    this.store.update({ isSmashing: true, canTap: false, pressActive: true, pressProgress: 0 });

    // Grab current object mesh for squash animation
    this.targetObject = this.smashableManager.getCurrent();
    if (this.targetObject) {
      this.originalScale.copy(this.targetObject.scale);
    }

    this.show();
    this.press.position.y = CONFIG.pressRestY;
    this.phase = 'descending';
    this.timer = 0;
    this.crushFragmentsEmitted = 0;
  }

  /** 1 → 1 at speedLevel 0, shrinks with each level (min clamp 40%). */
  private speedScale(): number {
    const level = this.store.state.pressUpgrades.speed;
    return Math.max(0.4, 1 - level * CONFIG.pressUpgradeSpeedBonus);
  }

  update(dt: number): void {
    if (this.phase === 'idle') return;

    this.timer += dt;

    if (this.phase === 'descending') {
      const t = Math.min(this.timer / (CONFIG.pressDescentDuration * this.speedScale()), 1);
      const eased = t * t; // ease-in-quad
      const y = CONFIG.pressRestY + (CONFIG.pressCrushY - CONFIG.pressRestY) * eased;
      this.press.position.y = y;

      // Squash the object proportionally
      if (this.targetObject) {
        const scaleY = 1 - eased * 0.6; // compress to 40% during descent
        const scaleXZ = 1 + eased * 0.3; // expand to conserve volume
        this.targetObject.scale.set(
          this.originalScale.x * scaleXZ,
          this.originalScale.y * scaleY,
          this.originalScale.z * scaleXZ,
        );
      }

      this.store.update({ pressProgress: t * 0.5 }); // 0 → 0.5 during descent

      if (t >= 1) {
        this.phase = 'crushing';
        this.timer = 0;
      }
    } else if (this.phase === 'crushing') {
      const t = Math.min(this.timer / (CONFIG.pressCrushDuration * this.speedScale()), 1);

      // Flatten to 10% Y scale
      if (this.targetObject) {
        const scaleY = 0.4 - t * 0.3; // 0.4 → 0.1
        const scaleXZ = 1.3 + t * 0.3; // 1.3 → 1.6
        this.targetObject.scale.set(
          this.originalScale.x * scaleXZ,
          this.originalScale.y * scaleY,
          this.originalScale.z * scaleXZ,
        );
      }

      this.store.update({ pressProgress: 0.5 + t * 0.5 }); // 0.5 → 1.0

      // Progressive fragment emission during crush
      const fragmentInterval = 0.1;
      const expectedFragments = Math.floor(this.timer / fragmentInterval);
      if (expectedFragments > this.crushFragmentsEmitted && this.targetObject) {
        const pos = this.targetObject.position.clone();
        const color: number = this.targetObject.userData.primaryColor ?? 0xffffff;
        this.fragmentManager.explodeCrushed(pos, color, 0, color ? [color] : undefined);
        this.crushFragmentsEmitted = expectedFragments;
      }

      if (t >= 1) {
        this.onImpact();
        this.phase = 'rising';
        this.timer = 0;
      }
    } else if (this.phase === 'rising') {
      const t = Math.min(this.timer / (CONFIG.pressRiseDuration * this.speedScale()), 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-out-quad
      const y = CONFIG.pressCrushY + (CONFIG.pressRestY - CONFIG.pressCrushY) * eased;
      this.press.position.y = y;

      if (t >= 1) {
        this.press.position.y = CONFIG.pressRestY;
        this.hide();
        this.phase = 'idle';
        this.timer = 0;
        this.targetObject = null;
        this.store.update({ isSmashing: false, canTap: true, pressActive: false, pressProgress: 0 });
      }
    }
  }

  private onImpact(): void {
    const group = this.smashableManager.remove();
    if (!group) return;

    const position = group.position.clone();
    const color: number = group.userData.primaryColor ?? 0xffffff;

    const currentObjectId = this.store.state.currentObjectId;
    const def = currentObjectId ? OBJECTS.find((o) => o.id === currentObjectId) : null;
    const theme = def?.particleTheme;

    // Lateral crushed fragments — scaled by the Press Fragments upgrade.
    const fragLevel = this.store.state.pressUpgrades.fragments;
    const extraFragments = Math.round(
      CONFIG.pressFragmentCount * (1 + fragLevel * CONFIG.pressUpgradeFragmentsBonus),
    );
    this.fragmentManager.explodeCrushed(
      position,
      color,
      extraFragments,
      def?.color ? [color] : undefined,
    );

    // Double particles
    this.particleSystem.emit(position, color, theme);
    this.particleSystem.emit(position, color, theme);
    this.particleSystem.emitCoinBurst(position);

    // Economy — same as SmashSystem but with fixed press multiplier
    const state = this.store.state;
    const streak = state.streak;
    const newStreak = streak + 1;

    let rarity: 'common' | 'uncommon' | 'rare' = 'common';
    if (def) rarity = def.rarity;

    const adMultiplier = this.adSystem.getRewardMultiplier();
    const starterBoost = this.starterPackSystem.getBoostMultiplier();
    const eventBonus = def ? 1 + this.eventSystem.getRewardBonus(def.pack) : 1;
    // Press Power upgrade boosts the press's fixed multiplier directly.
    const pressPowerBoost = 1 + state.pressUpgrades.power * CONFIG.pressUpgradePowerBonus;
    const result = calculateCoins(
      rarity,
      newStreak,
      CONFIG.pressMultiplier * pressPowerBoost,
      adMultiplier * starterBoost * eventBonus,
      state.powerLevel,
    );

    // Jackpot roll
    const eventJackpotMul = this.eventSystem.isJackpotBoosted() ? 2 : 1;
    const streakBoostMul = state.jackpotBoostExpiresAt > Date.now() ? 2 : 1;
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

    if (jackpot.triggered) {
      this.particleSystem.emitJackpotBurst(position);
    }

    const power = 1; // press always full power
    this.audioManager.playSmashSequence(currentObjectId, power, newStreak, rarity);
  }

  dispose(): void {
    this.scene.remove(this.press);
    this.press.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
