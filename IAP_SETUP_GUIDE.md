# In-App Purchases — Setup Guide

This guide walks you through setting up the "Remove Ads" IAP in App Store Connect and wiring it to the app with StoreKit 2.

## Prerequisites

Before you can sell IAPs, you must complete:

1. **Agreements, Tax, and Banking** in App Store Connect
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click **Business** (top nav)
   - Under **Paid Apps**, click **Set Up** or **Review**
   - Fill out:
     - **Bank Account** — where Apple deposits your revenue
     - **Tax Forms** — W-9 for US individuals/LLCs
     - **Contact Info** — legal contact for Athlete Domains LLC
   - Status must show **Active** before IAPs work

> Apple handles ALL payment processing. No Stripe, no payment gateway, no merchant account needed. Apple collects from the customer and deposits to your bank minus their commission (15% for small developers earning under $1M/year, 30% otherwise).

---

## Step 1: Create the IAP Product in App Store Connect

1. Go to **App Store Connect** → **Rage Smash** → **Monetization** (left sidebar) → **In-App Purchases**
2. Click the **+** button to create a new IAP
3. Select **Non-Consumable** (one-time permanent purchase)
4. Fill in:

| Field | Value |
|-------|-------|
| **Reference Name** | Remove Ads |
| **Product ID** | `com.athletedomains.ragesmash.removeads` |
| **Price** | $2.99 (Tier 3) |

5. Click **Create**

---

## Step 2: Add Localization

After creating the product:

1. Click on the **Remove Ads** product you just created
2. Under **App Store Localization**, click **+** and add **English (U.S.)**
3. Fill in:

| Field | Value |
|-------|-------|
| **Display Name** | Remove Ads |
| **Description** | Permanently remove all ads from Rage Smash. One-time purchase. |

4. Click **Save**

---

## Step 3: Add a Screenshot for Review

Apple requires a screenshot of the IAP in action for review purposes:

1. Still on the Remove Ads product page, scroll to **Review Information**
2. Upload a screenshot showing the "Remove Ads" button in your Settings screen
3. Add review notes: `Tap Settings (gear icon) → "Remove Ads — $2.99" button`
4. Click **Save**

---

## Step 4: Submit for Review

IAPs must be submitted with an app version:

1. Go to **Rage Smash** → **1.x Prepare for Submission** (your next version)
2. Scroll to **In-App Purchases and Subscriptions**
3. Click **+** and select the **Remove Ads** IAP
4. Submit the version with the IAP included

---

## Step 5: Wire StoreKit 2 in the App (Code Changes)

Once the product is created in App Store Connect, update the app code:

### 5a. Create a StoreKit manager

Create a new Capacitor plugin or use `@capacitor-community/in-app-purchases` to handle StoreKit 2 transactions. The key operations:

1. **Load products** — fetch `com.athletedomains.ragesmash.removeads` from the App Store
2. **Purchase** — initiate the purchase flow
3. **Restore purchases** — required by Apple for non-consumable IAPs
4. **Check entitlements** — on app launch, verify if the user already purchased

### 5b. Update the Settings UI

Replace the stub callback in `src/game/Game.ts`:

```typescript
// Current stub:
this.store.update({ adsRemoved: true });

// Replace with:
const success = await storeKitManager.purchase('com.athletedomains.ragesmash.removeads');
if (success) {
  this.store.update({ adsRemoved: true });
}
```

### 5c. Add "Restore Purchases" button

Apple requires a way to restore non-consumable purchases. Add a "Restore Purchases" button in Settings below the "Remove Ads" button:

```typescript
// In settings.ts, add after Remove Ads button:
const restoreBtn = createLink('Restore Purchases');
restoreBtn.addEventListener('pointerdown', async () => {
  const restored = await storeKitManager.restorePurchases();
  if (restored.includes('com.athletedomains.ragesmash.removeads')) {
    store.update({ adsRemoved: true });
  }
});
```

### 5d. Check entitlements on launch

In `Game.ts` constructor, after loading saved state:

```typescript
// Verify IAP status on launch (handles reinstalls, new devices)
storeKitManager.checkEntitlements().then((entitlements) => {
  if (entitlements.includes('com.athletedomains.ragesmash.removeads')) {
    this.store.update({ adsRemoved: true });
  }
});
```

---

## Step 6: Test in Sandbox

Before submitting:

1. Create a **Sandbox Tester** account in App Store Connect → **Users and Access** → **Sandbox** tab
2. On your test device, go to **Settings** → **App Store** → **Sandbox Account** and sign in with the sandbox tester
3. Build and install via TestFlight or Xcode
4. Tap "Remove Ads" — it will prompt with a sandbox purchase (no real charge)
5. Verify:
   - Ads stop showing after purchase
   - `adsRemoved` persists after app restart
   - "Restore Purchases" works
   - The button changes to "Ads Removed" after purchase

---

## Checklist

- [ ] Agreements, Tax, and Banking completed (status: Active)
- [ ] IAP product created: `com.athletedomains.ragesmash.removeads` (Non-Consumable, $2.99)
- [ ] Localization added (Display Name + Description)
- [ ] Review screenshot uploaded
- [ ] StoreKit 2 integrated in app code
- [ ] "Restore Purchases" button added to Settings
- [ ] Entitlement check on app launch
- [ ] Tested with Sandbox account
- [ ] IAP attached to app version and submitted for review

---

## Pricing Notes

| Price Tier | US Price | Apple Cut (Small Biz) | Your Revenue |
|-----------|----------|----------------------|--------------|
| Tier 3 | $2.99 | 15% ($0.45) | $2.54 |

To enroll in the **App Store Small Business Program** (15% instead of 30%):
- Go to [developer.apple.com/app-store/small-business-program/](https://developer.apple.com/app-store/small-business-program/)
- Enroll with your Apple Developer account
- Applies automatically if you earn under $1M/year

---

## Future IAPs

You can add more products later using the same process:

| Product | Type | Price | Product ID |
|---------|------|-------|------------|
| Remove Ads | Non-Consumable | $2.99 | `com.athletedomains.ragesmash.removeads` |
| Starter Pack | Non-Consumable | $1.99 | `com.athletedomains.ragesmash.starterpack` |
| Coin Pack (Small) | Consumable | $0.99 | `com.athletedomains.ragesmash.coins.small` |
| Coin Pack (Large) | Consumable | $4.99 | `com.athletedomains.ragesmash.coins.large` |
