import { Store } from '../game/state';
import { AUDIO_CONFIG } from './audioConfig';

/**
 * Adaptive background music system with two layers:
 * - Chill layer: always playing at base volume
 * - Intense layer: crossfades in as combo/streak rises
 *
 * Uses Web Audio API for seamless looping and smooth gain transitions.
 */
export class MusicManager {
  private store: Store;
  private ctx: AudioContext | null = null;

  // Audio buffers
  private chillBuffer: AudioBuffer | null = null;
  private intenseBuffer: AudioBuffer | null = null;

  // Source nodes (recreated on each loop)
  private chillSource: AudioBufferSourceNode | null = null;
  private intenseSource: AudioBufferSourceNode | null = null;

  // Gain nodes (persistent)
  private chillGain: GainNode | null = null;
  private intenseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private loaded = false;
  private playing = false;

  // Current intensity (0 = full chill, 1 = full intense)
  private targetIntensity = 0;
  private currentIntensity = 0;

  constructor(store: Store) {
    this.store = store;
  }

  /** Set the shared AudioContext from AudioManager */
  setContext(ctx: AudioContext): void {
    if (this.ctx) return;
    this.ctx = ctx;
    this.setupGainNodes();
    this.preload();
  }

  private setupGainNodes(): void {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = AUDIO_CONFIG.musicVolume;
    this.masterGain.connect(this.ctx.destination);

    this.chillGain = this.ctx.createGain();
    this.chillGain.gain.value = 1;
    this.chillGain.connect(this.masterGain);

    this.intenseGain = this.ctx.createGain();
    this.intenseGain.gain.value = 0;
    this.intenseGain.connect(this.masterGain);
  }

  private async preload(): Promise<void> {
    if (!this.ctx || this.loaded) return;

    const load = async (path: string): Promise<AudioBuffer | null> => {
      try {
        const res = await fetch(path);
        const buf = await res.arrayBuffer();
        return await this.ctx!.decodeAudioData(buf);
      } catch (e) {
        console.warn(`[MusicManager] Failed to load ${path}:`, e);
        return null;
      }
    };

    const [chill, intense] = await Promise.all([
      load('/audio/music/bg-chill.mp3'),
      load('/audio/music/bg-intense.mp3'),
    ]);

    this.chillBuffer = chill;
    this.intenseBuffer = intense;
    this.loaded = true;

    // Auto-start if not muted
    if (!this.store.state.muted) {
      this.start();
    }
  }

  /** Start looping both layers */
  start(): void {
    if (!this.loaded || !this.ctx || this.playing) return;
    this.playing = true;
    this.startLayer('chill');
    this.startLayer('intense');
  }

  /** Stop all music */
  stop(): void {
    this.playing = false;
    this.stopLayer('chill');
    this.stopLayer('intense');
  }

  private startLayer(layer: 'chill' | 'intense'): void {
    if (!this.ctx) return;

    const buffer = layer === 'chill' ? this.chillBuffer : this.intenseBuffer;
    const gainNode = layer === 'chill' ? this.chillGain : this.intenseGain;
    if (!buffer || !gainNode) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gainNode);
    source.start(0);

    if (layer === 'chill') {
      this.chillSource = source;
    } else {
      this.intenseSource = source;
    }
  }

  private stopLayer(layer: 'chill' | 'intense'): void {
    const source = layer === 'chill' ? this.chillSource : this.intenseSource;
    if (source) {
      try { source.stop(); } catch (_) { /* already stopped */ }
    }
    if (layer === 'chill') {
      this.chillSource = null;
    } else {
      this.intenseSource = null;
    }
  }

  /**
   * Update intensity based on current combo/streak.
   * Call this every frame from the game loop.
   */
  update(streak: number): void {
    if (!this.ctx || !this.loaded) return;

    // Handle mute state
    if (this.store.state.muted) {
      if (this.playing) this.stop();
      return;
    } else if (!this.playing) {
      this.start();
    }

    // Map streak to intensity: 0 at streak 0, ramps to 1 at streak 10+
    this.targetIntensity = Math.min(1, streak / 10);

    // Smooth lerp toward target (fast rise, slower decay)
    const rate = this.targetIntensity > this.currentIntensity ? 0.08 : 0.03;
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) * rate;

    // Apply crossfade: chill fades out as intense fades in
    const now = this.ctx.currentTime;
    if (this.chillGain) {
      this.chillGain.gain.setTargetAtTime(1 - this.currentIntensity * 0.6, now, 0.1);
    }
    if (this.intenseGain) {
      this.intenseGain.gain.setTargetAtTime(this.currentIntensity, now, 0.1);
    }
  }

  /** Duck music volume briefly (e.g. during voice lines) */
  duck(durationMs: number = 400): void {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(AUDIO_CONFIG.musicVolume * 0.3, now, 0.05);
    setTimeout(() => {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(AUDIO_CONFIG.musicVolume, this.ctx.currentTime, durationMs / 1000);
      }
    }, durationMs);
  }

  /** Resume after audio context suspension (e.g. ad overlay) */
  resume(): void {
    if (this.loaded && !this.playing && !this.store.state.muted) {
      this.start();
    }
  }
}
