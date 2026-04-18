/**
 * One-shot "play in landscape" nudge shown at app boot when the device is
 * both touch-capable and currently held in portrait. Stays subtle and
 * auto-dismisses; no localStorage gate — it re-appears every fresh session.
 */

function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

function isPortrait(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(orientation: portrait)').matches;
  }
  return window.innerHeight > window.innerWidth;
}

export function showLandscapeHintIfNeeded(container: HTMLElement): void {
  if (!isTouchDevice()) return;
  if (!isPortrait()) return;

  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'absolute',
    left: '50%',
    top: 'calc(12% + env(safe-area-inset-top, 0px))',
    transform: 'translateX(-50%) translateY(-8px)',
    padding: '10px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(17,17,28,0.85)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    borderRadius: '999px',
    pointerEvents: 'none',
    zIndex: '400',
    opacity: '0',
    transition: 'opacity 260ms ease, transform 260ms ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
    maxWidth: 'calc(100% - 32px)',
    whiteSpace: 'nowrap',
  });

  const icon = document.createElement('span');
  icon.textContent = '\uD83D\uDD04';
  icon.style.fontSize = '15px';
  el.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = 'Plays best in landscape — rotate your phone';
  el.appendChild(text);

  container.appendChild(el);

  // Show after a short beat so it doesn't fight the splash fade-out.
  setTimeout(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  }, 600);

  // Hold for ~3.5s then fade out.
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => el.remove(), 300);
  }, 4000);

  // If the player rotates to landscape during the hint, dismiss early.
  const mql = window.matchMedia?.('(orientation: portrait)');
  if (mql) {
    const onChange = () => {
      if (!mql.matches) {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
        mql.removeEventListener('change', onChange);
      }
    };
    mql.addEventListener('change', onChange);
  }
}
