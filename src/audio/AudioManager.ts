import { Store } from '../game/state';
import { AUDIO_CONFIG } from './audioConfig';
import { SOUND_ASSETS, OBJECT_BREAK_SOUNDS, SoundKey } from './soundRegistry';

/**
 * Centralized audio manager with:
 * - WAV file preloading via Web Audio API
 * - Layered smash sequence with timed offsets
 * - Pitch randomization
 * - Power-based volume scaling
 * - Object-specific break sounds
 * - Combo reinforcement
 * - Procedural fallback sounds
 * - Mobile-friendly sound capping
 */
export class AudioManager {
  private store: Store;
  private ctx: AudioContext | null = null;
  private buffers: Map<SoundKey, AudioBuffer> = new Map();
  private activeSources: number = 0;
  private loaded = false;

  constructor(store: Store) {
    this.store = store;
  }

  // --- Lifecycle ---

  getContext(): AudioContext | null {
    return this.ctx;
  }

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.preload();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private async preload(): Promise<void> {
    if (!this.ctx || this.loaded) return;

    const entries = Object.entries(SOUND_ASSETS) as [SoundKey, string][];
    const uniquePaths = new Map<string, SoundKey[]>();

    // Group keys by path to avoid loading the same file twice
    for (const [key, path] of entries) {
      if (!uniquePaths.has(path)) uniquePaths.set(path, []);
      uniquePaths.get(path)!.push(key);
    }

    const promises = Array.from(uniquePaths.entries()).map(async ([path, keys]) => {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
        for (const key of keys) {
          this.buffers.set(key, audioBuffer);
        }
      } catch (e) {
        console.warn(`[AudioManager] Failed to load ${path}:`, e);
      }
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  // --- Core playback ---

  private playBuffer(
    key: SoundKey,
    volume: number,
    pitchRange: [number, number],
    delayMs: number = 0,
  ): void {
    if (this.store.state.muted || !this.ctx) return;
    if (this.activeSources >= AUDIO_CONFIG.maxSimultaneous) return;

    const buffer = this.buffers.get(key);
    if (!buffer) return;

    const ctx = this.ctx;
    const startTime = ctx.currentTime + delayMs / 1000;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Pitch randomization
    source.playbackRate.value = pitchRange[0] + Math.random() * (pitchRange[1] - pitchRange[0]);

    // Volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(
      volume * AUDIO_CONFIG.masterVolume,
      startTime,
    );

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(startTime);

    this.activeSources++;
    source.onended = () => {
      this.activeSources = Math.max(0, this.activeSources - 1);
    };
  }

  // --- Procedural sound fallback ---

  private playProcedural(
    type: 'impact' | 'coin' | 'combo' | 'fail' | 'charge' | 'reward' | 'boost' | 'ui',
    options?: { freq?: number; duration?: number; volume?: number; waveform?: OscillatorType; pitch?: number },
  ): void {
    if (this.store.state.muted || !this.ctx) return;
    if (this.activeSources >= AUDIO_CONFIG.maxSimultaneous) return;

    const ctx = this.ctx;
    const dur = options?.duration ?? 0.1;
    const vol = (options?.volume ?? 0.3) * AUDIO_CONFIG.masterVolume;
    const freq = options?.freq ?? 400;

    const osc = ctx.createOscillator();
    osc.type = options?.waveform ?? 'sine';
    osc.frequency.setValueAtTime(freq * (options?.pitch ?? 1), ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);

    this.activeSources++;
    osc.onended = () => {
      this.activeSources = Math.max(0, this.activeSources - 1);
    };
  }

  // --- Public API ---

  /**
   * Layered smash sequence: impact → break → coin → optional combo
   * @param objectId - for object-specific break sound
   * @param power - 0-1, from charge level (1.0 = default tap)
   * @param comboLevel - current streak for combo reinforcement
   * @param rarity - object rarity for rare boom layer
   */
  playSmashSequence(objectId: string | null, power: number, comboLevel: number, rarity: string = 'common'): void {
    if (this.store.state.muted) return;

    // 1. Impact at 0ms (charged variant for high power)
    this.playImpact(power);

    // 2. Rare boom at +15ms (layered under break for rare objects)
    if (rarity === 'rare') {
      setTimeout(() => this.playRareBoom(), AUDIO_CONFIG.rareBoomDelay);
    }

    // 3. Break at +30ms
    setTimeout(() => this.playBreak(objectId, power), AUDIO_CONFIG.breakDelay);

    // 4. Coin at +80ms
    setTimeout(() => this.playCoin(comboLevel), AUDIO_CONFIG.coinDelay);

    // 5. Combo reinforcement at +110ms (only at thresholds)
    if (AUDIO_CONFIG.comboThresholds.includes(comboLevel)) {
      setTimeout(() => this.playCombo(comboLevel), AUDIO_CONFIG.comboDelay);
    }
  }

  playImpact(power: number = 1): void {
    const vol = AUDIO_CONFIG.volumeByPower.impact.base +
      AUDIO_CONFIG.volumeByPower.impact.scale * power;
    this.playBuffer('impact-hammer', vol, AUDIO_CONFIG.pitchRange.impact);

    // Layer bass-hit on charged hits for extra weight
    if (power >= AUDIO_CONFIG.chargedImpactThreshold) {
      this.playBuffer('impact-charged', AUDIO_CONFIG.chargedImpactVolume, AUDIO_CONFIG.pitchRange.impactCharged);
    }
  }

  playBreak(objectId: string | null, power: number = 1): void {
    const breakKey: SoundKey = objectId
      ? (OBJECT_BREAK_SOUNDS[objectId] ?? 'break-default')
      : 'break-default';
    const vol = AUDIO_CONFIG.volumeByPower.break.base +
      AUDIO_CONFIG.volumeByPower.break.scale * power;
    this.playBuffer(breakKey, vol, AUDIO_CONFIG.pitchRange.break);
  }

  playCoin(comboLevel: number = 0): void {
    const vol = AUDIO_CONFIG.volumeByPower.coin.base +
      AUDIO_CONFIG.volumeByPower.coin.scale * 0.8;

    // Combo-based pitch boost
    const pitchBoost = Math.min(
      (comboLevel - 1) * AUDIO_CONFIG.coinComboPitchBoost,
      AUDIO_CONFIG.coinComboPitchMax,
    );
    const range: [number, number] = [
      AUDIO_CONFIG.pitchRange.coin[0] + Math.max(0, pitchBoost),
      AUDIO_CONFIG.pitchRange.coin[1] + Math.max(0, pitchBoost),
    ];

    this.playBuffer('coin-pickup', vol, range);
  }

  playCombo(comboLevel: number): void {
    const tierIndex = AUDIO_CONFIG.comboThresholds.indexOf(comboLevel);
    const tier = tierIndex >= 0 ? tierIndex + 1 : 1;

    // Use cinematic impact WAV for big milestones (tier 3+: x5, x10, x20)
    if (tier >= 3) {
      this.playBuffer('combo-cinematic', AUDIO_CONFIG.cinematicComboVolume, AUDIO_CONFIG.pitchRange.comboCinematic);
      return;
    }

    // Procedural escalating tone for lower combos
    const baseFreq = 600 + tier * 150;
    this.playProcedural('combo', {
      freq: baseFreq,
      duration: 0.1,
      volume: AUDIO_CONFIG.comboVolume,
      waveform: 'triangle',
      pitch: 1 + tier * 0.05,
    });
  }

  playRareBoom(): void {
    this.playBuffer('rare-boom', AUDIO_CONFIG.rareBoomVolume, AUDIO_CONFIG.pitchRange.rareBoom);
  }

  playUIButton(): void {
    this.playProcedural('ui', {
      freq: 700,
      duration: 0.04,
      volume: AUDIO_CONFIG.uiVolume,
      waveform: 'sine',
    });
  }

  playChargeStart(): void {
    this.playProcedural('charge', {
      freq: 250,
      duration: 0.06,
      volume: AUDIO_CONFIG.chargeVolume,
      waveform: 'sine',
    });
  }

  playChargeLoop(level: number): void {
    // Short rising tick to simulate charge building
    this.playProcedural('charge', {
      freq: 200 + level * 600,
      duration: 0.04,
      volume: AUDIO_CONFIG.chargeVolume * (0.5 + level * 0.5),
      waveform: 'sine',
    });
  }

  playOverchargeFail(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const dur = 0.3;

    // Low sawtooth wobble
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(AUDIO_CONFIG.failVolume * AUDIO_CONFIG.masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);

    this.activeSources++;
    osc.onended = () => {
      this.activeSources = Math.max(0, this.activeSources - 1);
    };
  }

  playDailyReward(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;

    // Two-note cha-ching, then play coin pickup
    const playNote = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      const gain = ctx.createGain();
      const vol = AUDIO_CONFIG.rewardVolume * AUDIO_CONFIG.masterVolume;
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    };

    playNote(1200, 0, 0.08);
    playNote(1600, 0.08, 0.12);

    // Follow with coin pickup sound
    setTimeout(() => {
      this.playBuffer('coin-pickup', AUDIO_CONFIG.rewardVolume, AUDIO_CONFIG.pitchRange.coin);
    }, 150);
  }

  playJackpotSound(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const vol = AUDIO_CONFIG.rewardVolume * AUDIO_CONFIG.masterVolume;

    // Rising arpeggio: 3 notes ascending
    const notes = [800, 1200, 1600];
    notes.forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });

    // Follow with coin pickup
    setTimeout(() => {
      this.playBuffer('coin-pickup', vol, AUDIO_CONFIG.pitchRange.coin);
    }, 280);
  }

  playBoostActivate(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;

    // Rising sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    const vol = AUDIO_CONFIG.boostVolume * AUDIO_CONFIG.masterVolume;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
}
