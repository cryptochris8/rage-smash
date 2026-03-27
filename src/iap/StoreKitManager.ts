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
    if (!this.isNative) return false;

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
      return result.entitlements;
    } catch (err) {
      console.warn('[StoreKitManager] Restore failed:', err);
      return [];
    }
  }

  /** Check current entitlements (for launch verification). Returns active product IDs. */
  async checkEntitlements(): Promise<string[]> {
    if (!this.isNative) return [];

    try {
      const result = await StoreKit.checkEntitlements();
      return result.entitlements;
    } catch (err) {
      console.warn('[StoreKitManager] Entitlement check failed:', err);
      return [];
    }
  }
}
