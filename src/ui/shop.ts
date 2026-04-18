import { Store, Pack, HammerSkin } from '../game/state';
import { PACKS } from '../content/packs';
import { HAMMER_SKINS } from '../content/skins';
import { ROOMS } from '../content/rooms';
import { UPGRADES, PRESS_UPGRADES } from '../content/upgrades';
import {
  canUnlockPack,
  unlockPack,
  canUnlockHammer,
  unlockHammer,
  canUnlockRoom,
  unlockRoom,
  selectRoom,
  getUpgradeLevel,
  canUpgrade,
  doUpgrade,
  getPressUpgradeLevel,
  canPressUpgrade,
  doPressUpgrade,
} from '../game/progression';
import { getUpgradeCost } from '../game/economy';
import { CONFIG } from '../game/config';
import { StoreKitManager, PRODUCT_IDS } from '../iap/StoreKitManager';

export class Shop {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private content: HTMLDivElement;
  private upgradesSection: HTMLDivElement;
  private packsSection: HTMLDivElement;
  private roomsSection: HTMLDivElement;
  private skinsSection: HTMLDivElement;
  private footerCoins: HTMLSpanElement;
  private unsubscribe: () => void;
  private visible = false;
  private onRoomSelect: ((roomId: string) => void) | null = null;
  private onUpgradePurchase: (() => void) | null = null;
  private onUnlock: ((itemName: string) => void) | null = null;
  private onUpgradeRescue: ((needed: number, upgradeName: string) => void) | null = null;
  private storeKit: StoreKitManager | null = null;
  private onRemoveAds: (() => Promise<boolean>) | null = null;
  private onBuyStarterPack: (() => Promise<boolean>) | null = null;
  private offersSection: HTMLDivElement;

  constructor(container: HTMLElement, store: Store, onRoomSelect?: (roomId: string) => void, onUpgradePurchase?: () => void, onUnlock?: (itemName: string) => void, onUpgradeRescue?: (needed: number, upgradeName: string) => void, storeKit?: StoreKitManager, onRemoveAds?: () => Promise<boolean>, onBuyStarterPack?: () => Promise<boolean>) {
    this.container = container;
    this.store = store;
    this.onRoomSelect = onRoomSelect ?? null;
    this.onUpgradePurchase = onUpgradePurchase ?? null;
    this.onUnlock = onUnlock ?? null;
    this.onUpgradeRescue = onUpgradeRescue ?? null;
    this.storeKit = storeKit ?? null;
    this.onRemoveAds = onRemoveAds ?? null;
    this.onBuyStarterPack = onBuyStarterPack ?? null;

    // --- Root overlay ---
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '100',
      display: 'none',
      opacity: '0',
      transition: 'opacity 0.25s ease',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    // --- Backdrop ---
    this.backdrop = document.createElement('div');
    Object.assign(this.backdrop.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(10,10,30,0.95)',
    });
    this.root.appendChild(this.backdrop);

    // --- Scrollable wrapper ---
    const scrollWrapper = document.createElement('div');
    Object.assign(scrollWrapper.style, {
      position: 'absolute',
      inset: '0',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      padding: `calc(16px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(80px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px))`,
    });

    // --- Header ---
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    });

    const title = document.createElement('h1');
    title.textContent = 'SHOP';
    Object.assign(title.style, {
      margin: '0',
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
      textShadow: '0 2px 8px rgba(0,0,0,0.4)',
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715'; // X
    Object.assign(closeBtn.style, {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '50%',
      width: '44px',
      height: '44px',
      fontSize: '20px',
      fontWeight: '700',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.15s ease',
    });
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    scrollWrapper.appendChild(header);

    // --- Content ---
    this.content = document.createElement('div');

    // Section: Special Offers (IAP)
    const offersHeading = this.createSectionHeading('Special Offers');
    this.content.appendChild(offersHeading);
    this.offersSection = document.createElement('div');
    Object.assign(this.offersSection.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    });
    this.content.appendChild(this.offersSection);

    // Section: Upgrades
    const upgradesHeading = this.createSectionHeading('Upgrades');
    this.content.appendChild(upgradesHeading);
    this.upgradesSection = document.createElement('div');
    Object.assign(this.upgradesSection.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    });
    this.content.appendChild(this.upgradesSection);

    // Section: Object Packs
    const packsHeading = this.createSectionHeading('Object Packs');
    this.content.appendChild(packsHeading);
    this.packsSection = document.createElement('div');
    Object.assign(this.packsSection.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    });
    this.content.appendChild(this.packsSection);

    // Section: Rage Rooms
    const roomsHeading = this.createSectionHeading('Rage Rooms');
    this.content.appendChild(roomsHeading);
    this.roomsSection = document.createElement('div');
    Object.assign(this.roomsSection.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    });
    this.content.appendChild(this.roomsSection);

    // Section: Hammer Skins
    const skinsHeading = this.createSectionHeading('Hammer Skins');
    this.content.appendChild(skinsHeading);
    this.skinsSection = document.createElement('div');
    Object.assign(this.skinsSection.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginBottom: '28px',
    });
    this.content.appendChild(this.skinsSection);

    scrollWrapper.appendChild(this.content);
    this.root.appendChild(scrollWrapper);

    // --- Footer (current coins) ---
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: 'auto',
      padding: `12px 20px calc(12px + env(safe-area-inset-bottom, 0px)) 20px`,
      background: 'linear-gradient(transparent, rgba(10,10,30,0.98) 30%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      pointerEvents: 'none',
    });

    const footerIcon = document.createElement('span');
    footerIcon.textContent = '\uD83E\uDE99';
    footerIcon.style.fontSize = '20px';

    this.footerCoins = document.createElement('span');
    Object.assign(this.footerCoins.style, {
      fontSize: '18px',
      fontWeight: '800',
      color: '#ffdd57',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    });

    footer.appendChild(footerIcon);
    footer.appendChild(this.footerCoins);
    this.root.appendChild(footer);

    // Mount
    this.container.appendChild(this.root);

    // Subscribe for reactive updates while shop is open
    this.unsubscribe = this.store.subscribe(() => {
      if (this.visible) {
        this.rebuild();
      }
    });
  }

  show(): void {
    this.visible = true;
    this.store.update({ shopOpen: true });
    this.rebuild();
    this.root.style.display = 'block';
    // Force reflow so opacity transition fires
    void this.root.offsetHeight;
    this.root.style.opacity = '1';
  }

  hide(): void {
    this.visible = false;
    this.store.update({ shopOpen: false });
    this.root.style.opacity = '0';
    const onEnd = () => {
      if (!this.visible) {
        this.root.style.display = 'none';
      }
      this.root.removeEventListener('transitionend', onEnd);
    };
    this.root.addEventListener('transitionend', onEnd);
  }

  dispose(): void {
    this.unsubscribe();
    this.root.remove();
  }

  // ---- Private helpers ----

  private rebuild(): void {
    this.rebuildOffers();
    this.rebuildUpgrades();
    this.rebuildPacks();
    this.rebuildRooms();
    this.rebuildSkins();
    this.footerCoins.textContent = this.store.state.coins.toLocaleString();
  }

  private rebuildOffers(): void {
    this.offersSection.innerHTML = '';

    // Starter Pack
    if (!this.store.state.starterPackPurchased) {
      const card = this.createCard();
      Object.assign(card.style, {
        border: '1px solid rgba(255,215,0,0.3)',
        background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,255,255,0.06))',
      });

      const icon = document.createElement('div');
      icon.textContent = '\u2B50';
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = 'Starter Pack';
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffd700',
        marginBottom: '2px',
      });

      const desc = document.createElement('div');
      desc.textContent = 'Rage Fury Hammer + 5,000 Coins + 24h 2X Boost';
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.55)',
        lineHeight: '1.3',
      });

      info.appendChild(name);
      info.appendChild(desc);
      card.appendChild(info);

      const price = this.storeKit?.getDisplayPrice(PRODUCT_IDS.starterPack) ?? '$1.99';
      const btn = this.createBuyButton(price);
      Object.assign(btn.style, {
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      });
      btn.addEventListener('pointerdown', async (e) => {
        e.stopPropagation();
        if (this.onBuyStarterPack) {
          btn.textContent = '...';
          btn.style.pointerEvents = 'none';
          const success = await this.onBuyStarterPack();
          if (!success) {
            btn.textContent = price;
            btn.style.pointerEvents = 'auto';
          }
        }
      });
      card.appendChild(btn);
      this.offersSection.appendChild(card);
    } else {
      const card = this.createCard();
      const icon = document.createElement('div');
      icon.textContent = '\u2B50';
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      const name = document.createElement('div');
      name.textContent = 'Starter Pack';
      Object.assign(name.style, {
        flex: '1',
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
      });
      card.appendChild(name);
      card.appendChild(this.createBadge('OWNED', '#6b7280'));
      this.offersSection.appendChild(card);
    }

    // Remove Ads
    if (!this.store.state.adsRemoved) {
      const card = this.createCard();

      const icon = document.createElement('div');
      icon.textContent = '\uD83D\uDEAB';
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = 'Remove Ads';
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '2px',
      });

      const desc = document.createElement('div');
      desc.textContent = 'Permanently remove all ads';
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.55)',
      });

      info.appendChild(name);
      info.appendChild(desc);
      card.appendChild(info);

      const price = this.storeKit?.getDisplayPrice(PRODUCT_IDS.removeAds) ?? '$2.99';
      const btn = this.createBuyButton(price);
      btn.addEventListener('pointerdown', async (e) => {
        e.stopPropagation();
        if (this.onRemoveAds) {
          btn.textContent = '...';
          btn.style.pointerEvents = 'none';
          const success = await this.onRemoveAds();
          if (!success) {
            btn.textContent = price;
            btn.style.pointerEvents = 'auto';
          }
        }
      });
      card.appendChild(btn);
      this.offersSection.appendChild(card);
    } else {
      const card = this.createCard();
      const icon = document.createElement('div');
      icon.textContent = '\uD83D\uDEAB';
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      const name = document.createElement('div');
      name.textContent = 'Remove Ads';
      Object.assign(name.style, {
        flex: '1',
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
      });
      card.appendChild(name);
      card.appendChild(this.createBadge('ACTIVE', '#22c55e'));
      this.offersSection.appendChild(card);
    }
  }

  private rebuildUpgrades(): void {
    this.upgradesSection.innerHTML = '';

    for (const upgrade of UPGRADES) {
      const level = getUpgradeLevel(this.store, upgrade.id);
      const maxed = level >= CONFIG.upgradeMaxLevel;
      const affordable = canUpgrade(this.store, upgrade.id);
      const cost = maxed ? 0 : getUpgradeCost(level);
      const card = this.createCard();

      // Icon
      const icon = document.createElement('div');
      icon.textContent = upgrade.icon;
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      // Info
      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = `${upgrade.name} Lv.${level}`;
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '2px',
      });

      const desc = document.createElement('div');
      desc.textContent = upgrade.description;
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
      });

      info.appendChild(name);
      info.appendChild(desc);
      card.appendChild(info);

      // Action
      if (maxed) {
        card.appendChild(this.createBadge('MAX', '#6366f1'));
      } else if (affordable) {
        const btn = this.createBuyButton(`\uD83E\uDE99 ${cost}`);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          doUpgrade(this.store, upgrade.id);
          if (this.onUpgradePurchase) this.onUpgradePurchase();
        });
        card.appendChild(btn);
      } else {
        card.appendChild(this.createBadge(`\uD83E\uDE99 ${cost}`, '#4b5563', true));

        // Upgrade rescue: show "Watch" if within 15% of cost
        const gap = cost - this.store.state.coins;
        if (gap > 0 && gap <= cost * 0.15 && this.onUpgradeRescue) {
          const rescueBtn = document.createElement('button');
          rescueBtn.textContent = '\uD83C\uDFAC';
          Object.assign(rescueBtn.style, {
            background: 'rgba(99,102,241,0.8)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '16px',
            cursor: 'pointer',
            minWidth: '36px',
            minHeight: '36px',
            flexShrink: '0',
            marginLeft: '6px',
            WebkitTapHighlightColor: 'transparent',
          });
          const rescueCb = this.onUpgradeRescue;
          const upgradeName = upgrade.name;
          rescueBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            rescueCb(gap, upgradeName);
          });
          card.appendChild(rescueBtn);
        }
      }

      this.upgradesSection.appendChild(card);
    }

    // --- Press upgrades section ---
    const pressLabel = document.createElement('div');
    pressLabel.textContent = 'PRESS UPGRADES';
    Object.assign(pressLabel.style, {
      fontSize: '11px',
      fontWeight: '800',
      color: 'rgba(255,255,255,0.45)',
      letterSpacing: '2px',
      padding: '14px 4px 4px',
    });
    this.upgradesSection.appendChild(pressLabel);

    for (const upgrade of PRESS_UPGRADES) {
      const level = getPressUpgradeLevel(this.store, upgrade.id);
      const maxed = level >= CONFIG.upgradeMaxLevel;
      const affordable = canPressUpgrade(this.store, upgrade.id);
      const cost = maxed ? 0 : getUpgradeCost(level);
      const card = this.createCard();

      const icon = document.createElement('div');
      icon.textContent = upgrade.icon;
      icon.style.fontSize = '24px';
      icon.style.flexShrink = '0';
      card.appendChild(icon);

      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = `${upgrade.name} Lv.${level}`;
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '2px',
      });

      const desc = document.createElement('div');
      desc.textContent = upgrade.description;
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
      });

      info.appendChild(name);
      info.appendChild(desc);
      card.appendChild(info);

      if (maxed) {
        card.appendChild(this.createBadge('MAX', '#6366f1'));
      } else if (affordable) {
        const btn = this.createBuyButton(`\uD83E\uDE99 ${cost}`);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          doPressUpgrade(this.store, upgrade.id);
          if (this.onUpgradePurchase) this.onUpgradePurchase();
        });
        card.appendChild(btn);
      } else {
        card.appendChild(this.createBadge(`\uD83E\uDE99 ${cost}`, '#4b5563', true));
      }

      this.upgradesSection.appendChild(card);
    }
  }

  private rebuildPacks(): void {
    this.packsSection.innerHTML = '';
    const { unlockedPacks, coins } = this.store.state;

    for (const pack of PACKS) {
      const owned = unlockedPacks.includes(pack.id);
      const affordable = canUnlockPack(this.store, pack.id);
      const card = this.createCard();

      // Info column
      const info = document.createElement('div');
      info.style.flex = '1';

      const name = document.createElement('div');
      name.textContent = pack.name;
      Object.assign(name.style, {
        fontSize: '16px',
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: '3px',
      });

      const desc = document.createElement('div');
      desc.textContent = pack.description;
      Object.assign(desc.style, {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.55)',
        lineHeight: '1.3',
      });

      info.appendChild(name);
      info.appendChild(desc);
      card.appendChild(info);

      // Action
      if (owned) {
        card.appendChild(this.createBadge('OWNED', '#6b7280'));
      } else if (affordable) {
        const btn = this.createBuyButton(`\uD83E\uDE99 ${pack.cost}`);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          unlockPack(this.store, pack.id);
          if (this.onUnlock) this.onUnlock(pack.name);
        });
        card.appendChild(btn);
      } else {
        card.appendChild(this.createBadge(`\uD83E\uDE99 ${pack.cost}`, '#4b5563', true));
      }

      this.packsSection.appendChild(card);
    }
  }

  private rebuildRooms(): void {
    this.roomsSection.innerHTML = '';
    const { unlockedRooms, selectedRoom } = this.store.state;

    for (const room of ROOMS) {
      const owned = unlockedRooms.includes(room.id);
      const selected = selectedRoom === room.id;
      const affordable = canUnlockRoom(this.store, room.id);
      const card = this.createCard();

      // Name
      const name = document.createElement('div');
      name.textContent = room.name;
      Object.assign(name.style, {
        flex: '1',
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
      });
      card.appendChild(name);

      // Action
      if (selected) {
        card.appendChild(this.createBadge('SELECTED', '#6366f1'));
      } else if (owned) {
        const btn = this.createSelectButton('SELECT');
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          selectRoom(this.store, room.id);
          if (this.onRoomSelect) {
            this.onRoomSelect(room.id);
          }
        });
        card.appendChild(btn);
      } else if (room.cost === 0) {
        card.appendChild(this.createBadge('FREE', '#22c55e'));
      } else if (affordable) {
        const btn = this.createBuyButton(`\uD83E\uDE99 ${room.cost}`);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          unlockRoom(this.store, room.id);
          if (this.onUnlock) this.onUnlock(room.name);
        });
        card.appendChild(btn);
      } else {
        card.appendChild(this.createBadge(`\uD83E\uDE99 ${room.cost}`, '#4b5563', true));
      }

      this.roomsSection.appendChild(card);
    }
  }

  private rebuildSkins(): void {
    this.skinsSection.innerHTML = '';
    const { unlockedHammers, selectedHammer } = this.store.state;

    for (const skin of HAMMER_SKINS) {
      // Hide exclusive skins from shop — they're only obtainable via starter pack
      if (skin.exclusive && !unlockedHammers.includes(skin.id)) continue;

      const owned = unlockedHammers.includes(skin.id);
      const selected = selectedHammer === skin.id;
      const affordable = canUnlockHammer(this.store, skin.id);
      const card = this.createCard();

      // Color swatch or 3D icon
      const swatch = document.createElement('div');
      if (skin.model) {
        swatch.textContent = '\uD83D\uDD28';
        Object.assign(swatch.style, {
          width: '32px',
          height: '32px',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
        });
      } else {
        const hexColor = '#' + skin.color.toString(16).padStart(6, '0');
        Object.assign(swatch.style, {
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: hexColor,
          border: '2px solid rgba(255,255,255,0.2)',
          flexShrink: '0',
        });
      }
      card.appendChild(swatch);

      // Name + 3D badge
      const nameRow = document.createElement('div');
      nameRow.style.flex = '1';
      nameRow.style.paddingLeft = '10px';

      const name = document.createElement('div');
      name.textContent = skin.name;
      Object.assign(name.style, {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
      });
      nameRow.appendChild(name);

      if (skin.model) {
        const tag = document.createElement('div');
        tag.textContent = '3D Model';
        Object.assign(tag.style, {
          fontSize: '11px',
          color: 'rgba(255,215,0,0.7)',
          fontWeight: '600',
        });
        nameRow.appendChild(tag);
      }

      card.appendChild(nameRow);

      // Action
      if (selected) {
        card.appendChild(this.createBadge('SELECTED', '#6366f1'));
      } else if (owned) {
        const btn = this.createSelectButton('SELECT');
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.store.update({ selectedHammer: skin.id });
        });
        card.appendChild(btn);
      } else if (affordable) {
        const btn = this.createBuyButton(`\uD83E\uDE99 ${skin.cost}`);
        btn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          unlockHammer(this.store, skin.id);
          if (this.onUnlock) this.onUnlock(skin.name);
        });
        card.appendChild(btn);
      } else {
        card.appendChild(this.createBadge(`\uD83E\uDE99 ${skin.cost}`, '#4b5563', true));
      }

      this.skinsSection.appendChild(card);
    }
  }

  private createSectionHeading(text: string): HTMLDivElement {
    const heading = document.createElement('div');
    heading.textContent = text;
    Object.assign(heading.style, {
      fontSize: '13px',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '10px',
    });
    return heading;
  }

  private createCard(): HTMLDivElement {
    const card = document.createElement('div');
    Object.assign(card.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '12px 14px',
    });
    return card;
  }

  private createBuyButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      background: '#22c55e',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '800',
      cursor: 'pointer',
      minWidth: '44px',
      minHeight: '44px',
      flexShrink: '0',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.12s ease',
    });
    return btn;
  }

  private createSelectButton(label: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      background: 'rgba(99,102,241,0.8)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      padding: '8px 14px',
      fontSize: '13px',
      fontWeight: '800',
      cursor: 'pointer',
      minWidth: '44px',
      minHeight: '44px',
      flexShrink: '0',
      WebkitTapHighlightColor: 'transparent',
      transition: 'background 0.12s ease',
    });
    return btn;
  }

  private createBadge(
    text: string,
    bg: string,
    dimmed = false,
  ): HTMLDivElement {
    const badge = document.createElement('div');
    badge.textContent = text;
    Object.assign(badge.style, {
      background: bg,
      color: dimmed ? 'rgba(255,255,255,0.45)' : '#ffffff',
      borderRadius: '10px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: '800',
      textAlign: 'center',
      flexShrink: '0',
      minWidth: '44px',
    });
    return badge;
  }
}
