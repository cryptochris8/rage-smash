/**
 * Reusable UI primitives. Each factory returns a real DOM element — no
 * framework, no virtual DOM, just typed constructors that bake in the
 * theme tokens so callers can stop hand-rolling the same gradient + shadow
 * + padding combo in 5 different files.
 *
 * Migration is incremental: callers can adopt these one button at a time.
 */

import { COLOR, GRADIENT, SHADOW, FONT_STACK, FONT_WEIGHT, SPACE, RADIUS, Z } from './theme';

// ---------- Buttons ----------

export interface ButtonOpts {
  /** Min touch target — defaults to iOS-friendly 44px. Set 48 for primary CTAs. */
  minSize?: number;
  /** Disable the button on mount. */
  disabled?: boolean;
  /** Inline overrides applied last (escape hatch). */
  style?: Partial<CSSStyleDeclaration>;
}

function applyButtonBase(btn: HTMLButtonElement, minSize: number): void {
  Object.assign(btn.style, {
    minWidth: `${minSize}px`,
    minHeight: `${minSize}px`,
    padding: `${SPACE.md} ${SPACE.lg}`,
    border: 'none',
    borderRadius: RADIUS.md,
    fontFamily: FONT_STACK,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: '15px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    color: COLOR.textPrimary,
    boxShadow: SHADOW.button,
    WebkitTapHighlightColor: 'transparent',
    transition: 'transform 0.1s ease, opacity 0.15s ease',
  });
}

export function primaryButton(label: string, opts: ButtonOpts = {}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  applyButtonBase(btn, opts.minSize ?? 48);
  btn.style.background = GRADIENT.primaryGreen;
  if (opts.disabled) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
  if (opts.style) Object.assign(btn.style, opts.style);
  return btn;
}

export function secondaryButton(label: string, opts: ButtonOpts = {}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  applyButtonBase(btn, opts.minSize ?? 44);
  btn.style.background = COLOR.surface2;
  btn.style.border = `1px solid ${COLOR.border}`;
  btn.style.color = COLOR.textSecondary;
  if (opts.disabled) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
  if (opts.style) Object.assign(btn.style, opts.style);
  return btn;
}

export function dangerButton(label: string, opts: ButtonOpts = {}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  applyButtonBase(btn, opts.minSize ?? 44);
  btn.style.background = GRADIENT.danger;
  if (opts.disabled) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
  if (opts.style) Object.assign(btn.style, opts.style);
  return btn;
}

// ---------- Modal card ----------

export function modalCard(): HTMLDivElement {
  const card = document.createElement('div');
  Object.assign(card.style, {
    background: GRADIENT.modalCard,
    border: `1px solid ${COLOR.borderStrong}`,
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    boxShadow: SHADOW.card,
    color: COLOR.textPrimary,
    fontFamily: FONT_STACK,
  });
  return card;
}

// ---------- Section header ----------

export function sectionHeader(text: string): HTMLDivElement {
  const el = document.createElement('div');
  el.textContent = text;
  Object.assign(el.style, {
    fontFamily: FONT_STACK,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: COLOR.textMuted,
    margin: `${SPACE.lg} 0 ${SPACE.sm}`,
  });
  return el;
}

// ---------- List row ----------

export interface ListRowOpts {
  label: string;
  sub?: string;
  right?: HTMLElement | string;
  onTap?: () => void;
}

export function listRow(opts: ListRowOpts): HTMLDivElement {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    padding: `${SPACE.md} ${SPACE.lg}`,
    borderRadius: RADIUS.md,
    background: COLOR.surface1,
    fontFamily: FONT_STACK,
    color: COLOR.textPrimary,
    cursor: opts.onTap ? 'pointer' : 'default',
  });

  const labelCol = document.createElement('div');
  labelCol.style.flex = '1';
  labelCol.style.minWidth = '0';

  const labelEl = document.createElement('div');
  labelEl.textContent = opts.label;
  labelEl.style.fontWeight = FONT_WEIGHT.semibold;
  labelEl.style.fontSize = '14px';
  labelCol.appendChild(labelEl);

  if (opts.sub) {
    const subEl = document.createElement('div');
    subEl.textContent = opts.sub;
    subEl.style.fontSize = '12px';
    subEl.style.color = COLOR.textMuted;
    subEl.style.marginTop = '2px';
    labelCol.appendChild(subEl);
  }
  row.appendChild(labelCol);

  if (opts.right) {
    if (typeof opts.right === 'string') {
      const r = document.createElement('div');
      r.textContent = opts.right;
      r.style.color = COLOR.textSecondary;
      r.style.fontSize = '13px';
      row.appendChild(r);
    } else {
      row.appendChild(opts.right);
    }
  }

  if (opts.onTap) {
    row.addEventListener('click', opts.onTap);
  }

  return row;
}

export function divider(): HTMLDivElement {
  const d = document.createElement('div');
  Object.assign(d.style, {
    height: '1px',
    background: COLOR.border,
    margin: `${SPACE.md} 0`,
  });
  return d;
}

// ---------- Keyframe injection (deduped) ----------

const injectedKeyframes = new Set<string>();

/** Append a <style> block with @keyframes once per id. Subsequent calls
 *  with the same id are no-ops. Use for animation rules that need to live
 *  in the stylesheet (transform, opacity, etc.) rather than inline. */
export function injectKeyframesOnce(id: string, css: string): void {
  if (injectedKeyframes.has(id)) return;
  if (document.getElementById(id)) {
    injectedKeyframes.add(id);
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  injectedKeyframes.add(id);
}

// ---------- Async helpers ----------

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/** Race a promise against a timer. Resolves to the promise's value or
 *  rejects with TimeoutError after `ms`. The original promise is NOT
 *  cancelled — caller should treat the result as authoritative even if
 *  the underlying op later resolves. */
export function withTimeout<T>(p: Promise<T>, ms = 15000, label = 'Operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new TimeoutError(`${label} timed out after ${ms}ms`));
    }, ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface BindAsyncOpts {
  timeoutMs?: number;
  pendingLabel?: string;
  /** Called on success with the resolved value. */
  onSuccess?: (value: unknown) => void;
  /** Called on error/timeout. Defaults to a toast. */
  onError?: (err: unknown) => void;
  /** Friendly label for timeout messages. */
  label?: string;
}

/** Wrap an async button click with: (1) "Processing..." label, (2) pointer-
 *  events lockout, (3) timeout safety net so a hung promise doesn't leave
 *  the button stuck. On settle: pointerEvents and disabled are always
 *  restored. The text is restored ONLY if onSuccess/onError didn't change
 *  it — so callers can set a sticky label like "Restored: X" without it
 *  being clobbered by the finally block. */
export function bindAsyncButton(
  btn: HTMLButtonElement,
  fn: () => Promise<unknown>,
  opts: BindAsyncOpts = {},
): void {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    const originalText = btn.textContent ?? '';
    const originalPE = btn.style.pointerEvents;
    const pendingLabel = opts.pendingLabel ?? 'Processing...';
    btn.textContent = pendingLabel;
    btn.style.pointerEvents = 'none';
    btn.disabled = true;

    try {
      const result = await withTimeout(fn(), opts.timeoutMs ?? 15000, opts.label ?? 'Action');
      opts.onSuccess?.(result);
    } catch (err) {
      if (opts.onError) {
        opts.onError(err);
      } else if (err instanceof TimeoutError) {
        showToast('Took too long, please try again', 'danger');
      } else {
        showToast('Something went wrong', 'danger');
      }
    } finally {
      // Only restore text if the success/error handler didn't override it.
      // Callers that set a sticky label (e.g. "Restored: X") keep their text.
      if (btn.textContent === pendingLabel) {
        btn.textContent = originalText;
      }
      btn.style.pointerEvents = originalPE;
      btn.disabled = false;
    }
  });
}

// ---------- Toast ----------

export type ToastKind = 'info' | 'success' | 'danger';

const TOAST_BG: Record<ToastKind, string> = {
  info:    'rgba(99,102,241,0.92)',
  success: 'rgba(34,197,94,0.92)',
  danger:  'rgba(239,68,68,0.92)',
};

/** Transient bottom-of-screen toast. 2s auto-dismiss with fade. */
export function showToast(message: string, kind: ToastKind = 'info', durationMs = 2000): void {
  const el = document.createElement('div');
  el.textContent = message;
  Object.assign(el.style, {
    position: 'fixed',
    left: '50%',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
    transform: 'translateX(-50%) translateY(20px)',
    background: TOAST_BG[kind],
    color: COLOR.textPrimary,
    fontFamily: FONT_STACK,
    fontWeight: FONT_WEIGHT.semibold,
    fontSize: '14px',
    padding: `${SPACE.md} ${SPACE.lg}`,
    borderRadius: RADIUS.pill,
    boxShadow: SHADOW.card,
    pointerEvents: 'none',
    zIndex: String(Z.toastTop),
    opacity: '0',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    maxWidth: '85vw',
    textAlign: 'center',
  });
  document.body.appendChild(el);

  // Trigger entrance
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(20px)';
    window.setTimeout(() => el.remove(), 250);
  }, durationMs);
}
