import { registerPlugin } from '@capacitor/core';

interface StoreKitPluginInterface {
  loadProducts(): Promise<{
    products: Array<{
      id: string;
      displayName: string;
      description: string;
      price: string;
      displayPrice: string;
    }>;
  }>;
  purchase(options: { productId: string }): Promise<{
    success: boolean;
    productId?: string;
    cancelled?: boolean;
    pending?: boolean;
  }>;
  restorePurchases(): Promise<{ entitlements: string[] }>;
  checkEntitlements(): Promise<{ entitlements: string[] }>;
}

const StoreKit = registerPlugin<StoreKitPluginInterface>('StoreKit');

const ENTITLEMENT_CACHE_KEY = 'rage-smash-entitlements';

export const PRODUCT_IDS = {
  removeAds: 'com.athletedomains.ragesmash.removeads',
  starterPack: 'com.athletedomains.ragesmash.starterpack',
} as const;

export interface ProductInfo {
  id: string;
  displayName: string;
  description: string;
  price: string;
  displayPrice: string;
}

export class StoreKitManager {
  private products: Map<string, ProductInfo> = new Map();
  private isNative = false;
  private loaded = false;
  private onTransactionUpdate: ((productId: string) => void) | null = null;

  async init(): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      this.isNative = Capacitor.isNativePlatform();
    } catch {
      this.isNative = false;
    }

    if (!this.isNative) return;

    try {
      const result = await StoreKit.loadProducts();
      for (const product of result.products) {
        this.products.set(product.id, product);
      }
      this.loaded = true;
    } catch (err) {
      console.warn('[StoreKitManager] Failed to load products:', err);
    }

    // Listen for transactions that complete outside the purchase flow
    // (e.g. pending Ask-to-Buy approvals, interrupted purchases)
    try {
      await (StoreKit as any).addListener('transactionUpdate', (data: { productId: string }) => {
        console.log('[StoreKitManager] Transaction update:', data.productId);
        this.onTransactionUpdate?.(data.productId);
      });
    } catch (err) {
      console.warn('[StoreKitManager] Failed to add transaction listener:', err);
    }
  }

  /** Register a callback for transactions that complete asynchronously (pending, interrupted, etc.) */
  setTransactionUpdateHandler(handler: (productId: string) => void): void {
    this.onTransactionUpdate = handler;
  }

  /** Get product info (display price, name, etc.) */
  getProduct(productId: string): ProductInfo | null {
    return this.products.get(productId) ?? null;
  }

  /** Get the display price string (e.g. "$2.99") */
  getDisplayPrice(productId: string): string | null {
    return this.products.get(productId)?.displayPrice ?? null;
  }

  /** Returns true if IAP is available (native platform + products loaded) */
  isAvailable(): boolean {
    return this.isNative && this.loaded;
  }

  /** Purchase a product. Returns true on success. */
  async purchase(productId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const result = await StoreKit.purchase({ productId });
      return result.success === true;
    } catch (err) {
      console.warn('[StoreKitManager] Purchase failed:', err);
      return false;
    }
  }

  /** Restore previous purchases. Returns list of active product IDs. */
  async restorePurchases(): Promise<string[]> {
    if (!this.isNative) return [];

    try {
      const result = await StoreKit.restorePurchases();
      // Refresh cache so the next launch's mismatch check sees post-restore truth.
      this.cacheEntitlements(result.entitlements);
      return result.entitlements;
    } catch (err) {
      console.warn('[StoreKitManager] Restore failed:', err);
      return [];
    }
  }

  /** Check current entitlements (for launch verification). Returns active
   *  product IDs. Compares against the cached set from a previous launch
   *  and logs any mismatch (entitlement added since last launch, or
   *  unexpectedly missing). StoreKit is treated as authoritative — the
   *  cache is purely for detection, never for granting. No server-side
   *  validation: at this scale, StoreKit + Apple's receipt validation is
   *  cryptographically sufficient. */
  async checkEntitlements(): Promise<string[]> {
    if (!this.isNative) return [];

    try {
      const result = await StoreKit.checkEntitlements();
      this.detectEntitlementMismatch(result.entitlements);
      this.cacheEntitlements(result.entitlements);
      return result.entitlements;
    } catch (err) {
      console.warn('[StoreKitManager] Entitlement check failed:', err);
      return [];
    }
  }

  /** Read the previous launch's entitlement snapshot. Returns [] if missing
   *  or unparseable. Surfaces stale-state cases — e.g., player owned
   *  Remove Ads at last launch but StoreKit no longer reports it (refund,
   *  family-sharing change, signed in to different Apple ID). */
  private getCachedEntitlements(): string[] {
    try {
      const raw = localStorage.getItem(ENTITLEMENT_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((s: unknown) => typeof s === 'string') : [];
    } catch {
      return [];
    }
  }

  private cacheEntitlements(entitlements: string[]): void {
    try {
      localStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(entitlements));
    } catch {
      // Storage full or unavailable — non-fatal, the cache is a probe not authority.
    }
  }

  private detectEntitlementMismatch(current: string[]): void {
    const cached = this.getCachedEntitlements();
    if (cached.length === 0 && current.length === 0) return;
    const currentSet = new Set(current);
    const cachedSet = new Set(cached);
    const added = current.filter((id) => !cachedSet.has(id));
    const removed = cached.filter((id) => !currentSet.has(id));
    if (added.length > 0) {
      console.log('[StoreKitManager] Entitlements gained since last launch:', added);
    }
    if (removed.length > 0) {
      // Stale cache. Most common cause: refund, family-sharing revocation, or
      // signed in with a different Apple ID. Trust StoreKit's current view.
      console.warn('[StoreKitManager] Entitlements lost since last launch:', removed);
    }
  }
}
