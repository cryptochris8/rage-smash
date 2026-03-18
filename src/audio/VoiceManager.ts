import { Store } from '../game/state';

type VoiceCategory = 'brainrot' | 'combo' | 'perfect' | 'fail' | 'reward';

interface VoiceClip {
  category: VoiceCategory;
  path: string;
  buffer: AudioBuffer | null;
}

const VOICE_CLIPS: { category: VoiceCategory; path: string }[] = [
  // Brainrot — random rare callouts
  { category: 'brainrot', path: '/audio/voice/brainrot/voice_brainrot_01.mp3' },
  { category: 'brainrot', path: '/audio/voice/brainrot/voice_brainrot_02.mp3' },
  { category: 'brainrot', path: '/audio/voice/brainrot/voice_brainrot_03.mp3' },

  // Combo milestones
  { category: 'combo', path: '/audio/voice/combo/voice_combo_01.mp3' },
  { category: 'combo', path: '/audio/voice/combo/voice_combo_02.mp3' },
  { category: 'combo', path: '/audio/voice/combo/voice_combo_03.mp3' },

  // Perfect / high power hits
  { category: 'perfect', path: '/audio/voice/perfect/voice_perfect_01.mp3' },
  { category: 'perfect', path: '/audio/voice/perfect/voice_perfect_02.mp3' },
  { category: 'perfect', path: '/audio/voice/perfect/voice_perfect_03.mp3' },

  // Fail / overcharge
  { category: 'fail', path: '/audio/voice/fail/voice_fail_01.mp3' },
  { category: 'fail', path: '/audio/voice/fail/voice_fail_02.mp3' },
  { category: 'fail', path: '/audio/voice/fail/voice_fail_03.mp3' },

  // Big reward / rare object
  { category: 'reward', path: '/audio/voice/reward/voice_reward_01.mp3' },
  { category: 'reward', path: '/audio/voice/reward/voice_reward_02.mp3' },
  { category: 'reward', path: '/audio/voice/reward/voice_reward_03.mp3' },
];

/** Cooldowns in ms */
const COOLDOWNS = {
  global: 2500,
  brainrot: 5000,
  combo: 3000,
  perfect: 2000,
  fail: 0,
  reward: 3000,
};

/** Trigger chance for brainrot (random) lines */
const BRAINROT_CHANCE = 0.08;

/** Combo thresholds that trigger voice */
const COMBO_VOICE_THRESHOLDS = [2, 3, 5, 10, 20];

/** Power threshold for "perfect hit" voice */
const PERFECT_POWER_THRESHOLD = 0.9;

/** Voice volume relative to master */
const VOICE_VOLUME = 0.85;

/** SFX ducking amount (multiplied onto SFX gain while voice plays) */
const SFX_DUCK_AMOUNT = 0.5;
const SFX_DUCK_RELEASE_MS = 400;

export class VoiceManager {
  private store: Store;
  private ctx: AudioContext | null = null;
  private clips: VoiceClip[] = [];
  private loaded = false;

  private globalCooldownUntil = 0;
  private categoryCooldownUntil: Record<VoiceCategory, number> = {
    brainrot: 0,
    combo: 0,
    perfect: 0,
    fail: 0,
    reward: 0,
  };

  /** Track last played index per category to avoid repeats */
  private lastPlayed: Record<VoiceCategory, number> = {
    brainrot: -1,
    combo: -1,
    perfect: -1,
    fail: -1,
    reward: -1,
  };

  /** External gain node for SFX ducking (set by Game.ts) */
  private sfxDuckNode: GainNode | null = null;
  private duckTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(store: Store) {
    this.store = store;
  }

  // --- Lifecycle ---

  setAudioContext(ctx: AudioContext): void {
    if (this.ctx) return;
    this.ctx = ctx;
    this.preload();
  }

  private async preload(): Promise<void> {
    if (!this.ctx || this.loaded) return;

    const promises = VOICE_CLIPS.map(async (def) => {
      const clip: VoiceClip = { ...def, buffer: null };
      try {
        const response = await fetch(def.path);
        const arrayBuffer = await response.arrayBuffer();
        clip.buffer = await this.ctx!.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.warn(`[VoiceManager] Failed to load ${def.path}:`, e);
      }
      return clip;
    });

    this.clips = await Promise.all(promises);
    this.loaded = true;
  }

  // --- Core playback ---

  private canPlay(category: VoiceCategory): boolean {
    if (this.store.state.muted) return false;
    if (!this.ctx || !this.loaded) return false;

    const now = performance.now();
    if (now < this.globalCooldownUntil) return false;
    if (now < this.categoryCooldownUntil[category]) return false;

    return true;
  }

  private playRandom(category: VoiceCategory): void {
    if (!this.canPlay(category)) return;

    const available = this.clips
      .map((c, i) => ({ clip: c, index: i }))
      .filter((c) => c.clip.category === category && c.clip.buffer);

    if (available.length === 0) return;

    // Pick random, avoiding last played
    let pick: typeof available[number];
    if (available.length === 1) {
      pick = available[0];
    } else {
      const filtered = available.filter((c) => c.index !== this.lastPlayed[category]);
      pick = filtered[Math.floor(Math.random() * filtered.length)];
    }

    this.playClip(pick.clip, category);
    this.lastPlayed[category] = pick.index;
  }

  private playClip(clip: VoiceClip, category: VoiceCategory): void {
    if (!clip.buffer || !this.ctx) return;

    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = clip.buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(VOICE_VOLUME, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();

    // Set cooldowns
    const now = performance.now();
    this.globalCooldownUntil = now + COOLDOWNS.global;
    this.categoryCooldownUntil[category] = now + COOLDOWNS[category];

    // Duck SFX
    this.duckSfx();
    source.onended = () => this.releaseDuck();
  }

  // --- SFX Ducking ---

  setSfxDuckNode(node: GainNode): void {
    this.sfxDuckNode = node;
  }

  private duckSfx(): void {
    if (!this.sfxDuckNode || !this.ctx) return;
    if (this.duckTimeout) clearTimeout(this.duckTimeout);
    this.sfxDuckNode.gain.setTargetAtTime(SFX_DUCK_AMOUNT, this.ctx.currentTime, 0.02);
  }

  private releaseDuck(): void {
    if (!this.sfxDuckNode || !this.ctx) return;
    this.duckTimeout = setTimeout(() => {
      if (this.sfxDuckNode && this.ctx) {
        this.sfxDuckNode.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.05);
      }
    }, SFX_DUCK_RELEASE_MS);
  }

  // --- Public API ---

  /** Call on every smash — handles all voice logic internally */
  onSmash(power: number, comboLevel: number, rarity: string): void {
    if (this.store.state.muted || !this.loaded) return;

    // Priority order: fail handled separately, then perfect > reward > combo > brainrot

    // Perfect hit
    if (power >= PERFECT_POWER_THRESHOLD && this.canPlay('perfect')) {
      this.playRandom('perfect');
      return;
    }

    // Big reward (rare object)
    if (rarity === 'rare' && this.canPlay('reward')) {
      this.playRandom('reward');
      return;
    }

    // Combo milestone
    if (COMBO_VOICE_THRESHOLDS.includes(comboLevel) && this.canPlay('combo')) {
      this.playRandom('combo');
      return;
    }

    // Brainrot random chance
    if (Math.random() < BRAINROT_CHANCE && this.canPlay('brainrot')) {
      this.playRandom('brainrot');
    }
  }

  /** Always plays on fail (overcharge) — no randomness */
  playFailVoice(): void {
    if (this.store.state.muted || !this.loaded) return;
    // Fail bypasses global cooldown but respects its own
    const now = performance.now();
    if (now < this.categoryCooldownUntil['fail']) return;
    this.playRandom('fail');
  }

  /** Play reward voice for big coin moments */
  playRewardVoice(): void {
    this.playRandom('reward');
  }
}
