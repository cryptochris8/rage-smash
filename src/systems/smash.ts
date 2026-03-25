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

    this.hammer = this.createHammer();
    this.scene.add(this.hammer);

    // Apply initial skin color + react to skin changes
    this.applyHammerSkin();
    this.store.subscribe(() => this.applyHammerSkin());
  }

  private applyHammerSkin(): void {
    const skin = HAMMER_SKINS.find((s) => s.id === this.store.state.selectedHammer);
    if (!skin) return;
    const head = this.hammer.children[1] as THREE.Mesh;
    if (head) {
      (head.material as THREE.MeshStandardMaterial).color.setHex(skin.color);
    }
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

  private onImpact(): void {
    const group = this.smashableManager.remove();
    if (!group) return;

    const position = group.position.clone();
    const color: number = group.userData.primaryColor ?? 0xffffff;

    // Find the object def for particle theme and sound
    const currentObjectId = this.store.state.currentObjectId;
    const def = currentObjectId ? OBJECTS.find((o) => o.id === currentObjectId) : null;
    const theme = def?.particleTheme;

    // Scale fragment count by charge level
    const chargeMul = this.pendingChargeMultiplier;
    const extraFragments = chargeMul > 1 ? Math.floor((chargeMul - 1) * 4) : 0;

    // Visual effects
    this.fragmentManager.explode(position, color, extraFragments, def?.color ? [color] : undefined);
    this.particleSystem.emit(position, color, theme);
    this.particleSystem.emitCoinBurst(position);

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
