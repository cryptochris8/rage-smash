import { Store } from '../game/state';
import { OBJECTS } from '../content/objects';
import { PACKS } from '../content/packs';
import { share, formatCollection, showShareToast } from '../systems/share';

export class CollectionUI {
  private container: HTMLElement;
  private store: Store;
  private root: HTMLDivElement | null = null;

  constructor(container: HTMLElement, store: Store) {
    this.container = container;
    this.store = store;
  }

  show(): void {
    if (this.root) return;

    const seen = new Set(this.store.state.seenObjects);
    const total = OBJECTS.length;
    const discovered = OBJECTS.reduce((n, o) => n + (seen.has(o.id) ? 1 : 0), 0);
    const percent = total === 0 ? 0 : Math.round((discovered / total) * 100);

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '220',
      background: 'rgba(0,0,0,0.88)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      overflowY: 'auto',
      padding: `calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px))`,
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      width: '100%',
      maxWidth: '420px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    });

    const title = document.createElement('div');
    title.textContent = 'COLLECTION';
    Object.assign(title.style, {
      fontSize: '22px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '2px',
    });

    const headerRight = document.createElement('div');
    Object.assign(headerRight.style, { display: 'flex', gap: '4px', alignItems: 'center' });

    const shareBtn = document.createElement('button');
    shareBtn.textContent = '\uD83D\uDCE4';
    Object.assign(shareBtn.style, {
      fontSize: '20px',
      background: 'rgba(110,168,254,0.18)',
      border: '1px solid rgba(110,168,254,0.35)',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      color: '#ffffff',
      cursor: 'pointer',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    shareBtn.addEventListener('pointerdown', async (e) => {
      e.stopPropagation();
      const out = await share({
        text: formatCollection(discovered, total),
        title: 'Rage Smash — Collection',
      });
      showShareToast(this.container, out.message);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '\u2715';
    Object.assign(closeBtn.style, {
      fontSize: '24px',
      background: 'none',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      padding: '8px',
      pointerEvents: 'auto',
      WebkitTapHighlightColor: 'transparent',
    });
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.hide();
    });

    headerRight.appendChild(shareBtn);
    headerRight.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(headerRight);
    this.root.appendChild(header);

    // Completion progress
    const progress = document.createElement('div');
    progress.textContent = `${discovered} / ${total} discovered \u2022 ${percent}%`;
    Object.assign(progress.style, {
      width: '100%',
      maxWidth: '420px',
      fontSize: '13px',
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '700',
      letterSpacing: '1px',
      marginBottom: '8px',
    });
    this.root.appendChild(progress);

    // Progress bar
    const barBg = document.createElement('div');
    Object.assign(barBg.style, {
      width: '100%',
      maxWidth: '420px',
      height: '6px',
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '999px',
      overflow: 'hidden',
      marginBottom: '20px',
    });
    const barFill = document.createElement('div');
    Object.assign(barFill.style, {
      width: `${percent}%`,
      height: '100%',
      background: 'linear-gradient(90deg, #6ea8fe, #a78bfa)',
      borderRadius: '999px',
      transition: 'width 0.3s ease',
    });
    barBg.appendChild(barFill);
    this.root.appendChild(barBg);

    // Per-pack sections
    const panel = document.createElement('div');
    Object.assign(panel.style, {
      width: '100%',
      maxWidth: '420px',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
    });

    for (const pack of PACKS) {
      const objectsInPack = OBJECTS.filter((o) => o.pack === pack.id);
      if (objectsInPack.length === 0) continue;

      const packSeen = objectsInPack.reduce((n, o) => n + (seen.has(o.id) ? 1 : 0), 0);

      const section = document.createElement('div');

      const heading = document.createElement('div');
      Object.assign(heading.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '8px',
      });

      const packName = document.createElement('div');
      packName.textContent = pack.name.toUpperCase();
      Object.assign(packName.style, {
        fontSize: '13px',
        fontWeight: '800',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: '2px',
      });

      const packCount = document.createElement('div');
      packCount.textContent = `${packSeen} / ${objectsInPack.length}`;
      Object.assign(packCount.style, {
        fontSize: '12px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
      });

      heading.appendChild(packName);
      heading.appendChild(packCount);
      section.appendChild(heading);

      // Grid of tiles
      const grid = document.createElement('div');
      Object.assign(grid.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
      });

      for (const obj of objectsInPack) {
        const seenIt = seen.has(obj.id);
        const tile = document.createElement('div');
        Object.assign(tile.style, {
          aspectRatio: '1 / 1',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: '700',
          background: seenIt ? this.toTileBg(obj.color) : 'rgba(40,40,60,0.5)',
          border: seenIt
            ? `2px solid ${this.toBorder(obj.color)}`
            : '2px solid rgba(60,60,80,0.4)',
          color: seenIt ? '#ffffff' : 'rgba(255,255,255,0.25)',
          textShadow: seenIt ? '0 2px 6px rgba(0,0,0,0.5)' : 'none',
          boxShadow: seenIt ? `0 0 12px ${this.toGlow(obj.color)}` : 'none',
        });

        const label = document.createElement('div');
        label.textContent = seenIt ? obj.name : '???';
        Object.assign(label.style, {
          lineHeight: '1.1',
          letterSpacing: '0.5px',
        });
        tile.appendChild(label);

        if (obj.rarity !== 'common') {
          const tag = document.createElement('div');
          tag.textContent = obj.rarity.toUpperCase();
          Object.assign(tag.style, {
            marginTop: '4px',
            fontSize: '9px',
            fontWeight: '800',
            color: obj.rarity === 'rare' ? '#ffd700' : '#80c8ff',
            opacity: seenIt ? '1' : '0.3',
            letterSpacing: '1px',
          });
          tile.appendChild(tag);
        }

        grid.appendChild(tile);
      }

      section.appendChild(grid);
      panel.appendChild(section);
    }

    this.root.appendChild(panel);

    // Block taps from reaching the game
    this.root.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.container.appendChild(this.root);
  }

  hide(): void {
    if (!this.root) return;
    this.root.remove();
    this.root = null;
  }

  isOpen(): boolean {
    return this.root !== null;
  }

  private toTileBg(hex: number): string {
    // Mix object color with dark background so text stays legible.
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return `linear-gradient(135deg, rgba(${r},${g},${b},0.35), rgba(${r},${g},${b},0.18))`;
  }

  private toBorder(hex: number): string {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return `rgba(${r},${g},${b},0.7)`;
  }

  private toGlow(hex: number): string {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return `rgba(${r},${g},${b},0.22)`;
  }
}
