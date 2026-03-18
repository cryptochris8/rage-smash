import { Store } from '../game/state';

export class AudioSystem {
  private store: Store;
  private ctx: AudioContext | null = null;

  constructor(store: Store) {
    this.store = store;
  }

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playImpact(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const duration = 0.1;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with random noise
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Quick volume decay envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  }

  playCoin(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const duration = 0.1;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(1200, ctx.currentTime + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  /** Low-frequency wobble for overcharge fail */
  playFail(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const duration = 0.3;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  /** Rising tone while charging — pitch increases with level (0-1) */
  playCharge(level: number): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const duration = 0.05;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 + level * 600, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  /** Satisfying cha-ching for daily reward claim */
  playRewardClaim(): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;

    // Two-note cha-ching
    const playNote = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    };

    playNote(1200, 0, 0.08);
    playNote(1600, 0.08, 0.12);
  }

  /** Pitch increases with combo tier (1-6) */
  playComboEscalation(tier: number): void {
    if (this.store.state.muted || !this.ctx) return;

    const ctx = this.ctx;
    const duration = 0.08;
    const baseFreq = 600 + tier * 150;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}
