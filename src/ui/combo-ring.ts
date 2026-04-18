const SIZE = 180;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Persistent combo progress ring. Sits below the pedestal action area and fills
 * toward the next combo tier. Color follows the active tier. Fades out when
 * streak drops to 0.
 */
export class ComboRing {
  private root: HTMLElement;
  private track: SVGCircleElement;
  private progress: SVGCircleElement;
  private tierLabel: HTMLElement;
  private streakLabel: HTMLElement;
  private currentProgress = 0;
  private currentAlpha = 0;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'absolute',
      left: '50%',
      bottom: '22%',
      transform: 'translateX(-50%)',
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      pointerEvents: 'none',
      zIndex: '5',
      opacity: '0',
      transition: 'opacity 220ms ease',
      willChange: 'opacity',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    });

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(SIZE));
    svg.setAttribute('height', String(SIZE));
    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    svg.style.display = 'block';

    this.track = document.createElementNS(SVG_NS, 'circle');
    this.track.setAttribute('cx', String(SIZE / 2));
    this.track.setAttribute('cy', String(SIZE / 2));
    this.track.setAttribute('r', String(RADIUS));
    this.track.setAttribute('stroke', '#ffffff');
    this.track.setAttribute('stroke-opacity', '0.15');
    this.track.setAttribute('stroke-width', String(STROKE));
    this.track.setAttribute('fill', 'none');
    svg.appendChild(this.track);

    this.progress = document.createElementNS(SVG_NS, 'circle');
    this.progress.setAttribute('cx', String(SIZE / 2));
    this.progress.setAttribute('cy', String(SIZE / 2));
    this.progress.setAttribute('r', String(RADIUS));
    this.progress.setAttribute('stroke', '#ffffff');
    this.progress.setAttribute('stroke-width', String(STROKE));
    this.progress.setAttribute('stroke-linecap', 'round');
    this.progress.setAttribute('fill', 'none');
    this.progress.setAttribute('stroke-dasharray', String(CIRC));
    this.progress.setAttribute('stroke-dashoffset', String(CIRC));
    this.progress.setAttribute('transform', `rotate(-90 ${SIZE / 2} ${SIZE / 2})`);
    this.progress.style.transition = 'stroke-dashoffset 220ms ease, stroke 300ms ease, filter 300ms ease';
    svg.appendChild(this.progress);

    this.root.appendChild(svg);

    const labelWrap = document.createElement('div');
    Object.assign(labelWrap.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#ffffff',
      textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 16px rgba(0,0,0,0.4)',
      letterSpacing: '2px',
    });

    this.streakLabel = document.createElement('div');
    Object.assign(this.streakLabel.style, {
      fontSize: '36px',
      fontWeight: '900',
      lineHeight: '1',
    });
    this.streakLabel.textContent = '0';

    this.tierLabel = document.createElement('div');
    Object.assign(this.tierLabel.style, {
      fontSize: '11px',
      fontWeight: '800',
      marginTop: '4px',
      opacity: '0.85',
    });
    this.tierLabel.textContent = '';

    labelWrap.appendChild(this.streakLabel);
    labelWrap.appendChild(this.tierLabel);
    this.root.appendChild(labelWrap);

    container.appendChild(this.root);
  }

  /**
   * @param streak Current combo streak
   * @param progress 0..1 toward next tier (1 when at top tier)
   * @param tierColor Hex color for the stroke and tier name
   * @param tierName Tier display name ("GOLD", etc.)
   * @param tierAlpha Overall ring opacity for this tier (0 hides)
   */
  update(streak: number, progress: number, tierColor: number, tierName: string, tierAlpha: number): void {
    // Smooth progress using stroke-dashoffset (CSS handles the transition).
    const clamped = Math.max(0, Math.min(1, progress));
    this.currentProgress = clamped;
    const offset = CIRC * (1 - clamped);
    this.progress.setAttribute('stroke-dashoffset', String(offset));

    const hex = '#' + tierColor.toString(16).padStart(6, '0');
    this.progress.setAttribute('stroke', hex);
    this.progress.style.filter = `drop-shadow(0 0 8px ${hex})`;

    this.streakLabel.textContent = String(streak);
    this.streakLabel.style.color = hex;
    this.tierLabel.textContent = tierName;
    this.tierLabel.style.color = hex;

    const alpha = streak > 0 ? tierAlpha : 0;
    if (alpha !== this.currentAlpha) {
      this.currentAlpha = alpha;
      this.root.style.opacity = String(alpha);
    }
  }

  hide(): void {
    this.currentAlpha = 0;
    this.root.style.opacity = '0';
  }
}
