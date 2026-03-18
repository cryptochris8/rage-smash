import { AdEvent, AdEventType } from './types';

type AdEventListener = (event: AdEvent) => void;

class AdAnalytics {
  private listeners: Set<AdEventListener> = new Set();

  subscribe(fn: AdEventListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(type: AdEventType, placement: string, provider: string, error?: string): void {
    const event: AdEvent = {
      type,
      placement,
      provider,
      error,
      timestamp: Date.now(),
    };
    console.log(`[AdAnalytics] ${type} | ${placement} | ${provider}${error ? ` | ${error}` : ''}`);
    this.listeners.forEach((fn) => fn(event));
  }
}

export const adAnalytics = new AdAnalytics();
