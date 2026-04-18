const SHARE_URL = 'https://playragesmash.com';
const HASHTAG = '#RageSmash';

interface ShareInput {
  text: string;
  /** Optional title for the share sheet. Falls back to a generic one. */
  title?: string;
}

interface ShareResult {
  kind: 'shared' | 'copied' | 'failed';
  /** Human-readable reason — shown in a short toast. */
  message: string;
}

/** Returns true if the browser exposes the Web Share API. */
export function isNativeShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Attempts a native share, falling back to clipboard copy, then to an alert on
 * platforms that have neither. Returns which path was taken so the caller can
 * surface a quick confirmation toast.
 */
export async function share(input: ShareInput): Promise<ShareResult> {
  const text = input.text;
  const title = input.title ?? 'Rage Smash';

  if (isNativeShareAvailable()) {
    try {
      await navigator.share({ title, text, url: SHARE_URL });
      return { kind: 'shared', message: 'Shared!' };
    } catch (err) {
      // AbortError is thrown when the user dismisses the sheet — treat as a no-op.
      if ((err as DOMException)?.name === 'AbortError') {
        return { kind: 'failed', message: '' };
      }
      // Fall through to clipboard on permission errors or unsupported targets.
    }
  }

  const full = `${text} ${SHARE_URL}`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(full);
      return { kind: 'copied', message: 'Copied to clipboard!' };
    }
  } catch {
    // fall through to failure
  }
  return { kind: 'failed', message: 'Share unavailable' };
}

// --- Scenario formatters ---------------------------------------------------

export function formatDailyScore(score: number): string {
  return `I scored ${score.toLocaleString()} in today's Rage Smash daily! ${HASHTAG}`;
}

export function formatBestCombo(combo: number): string {
  return `Just hit a ${combo.toLocaleString()}-combo in Rage Smash! ${HASHTAG}`;
}

export function formatCollection(seen: number, total: number): string {
  return `I've discovered ${seen}/${total} objects in Rage Smash! ${HASHTAG}`;
}

export function formatAchievement(name: string): string {
  return `Just unlocked "${name}" in Rage Smash! ${HASHTAG}`;
}

// --- Lightweight toast for fallback feedback --------------------------------

export function showShareToast(container: HTMLElement, message: string): void {
  if (!message) return;
  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'absolute',
    left: '50%',
    top: '12%',
    transform: 'translateX(-50%) translateY(-8px)',
    padding: '8px 16px',
    background: 'rgba(34,197,94,0.92)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '1px',
    borderRadius: '999px',
    pointerEvents: 'none',
    zIndex: '400',
    opacity: '0',
    transition: 'opacity 180ms ease, transform 180ms ease',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
  });
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-8px)';
    setTimeout(() => el.remove(), 200);
  }, 1600);
}
