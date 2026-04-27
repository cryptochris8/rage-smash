const RM_KEY = 'rage-smash-reduced-motion';
const SS_KEY = 'rage-smash-screen-shake';

export type PerfTier = 'high' | 'medium' | 'low';

/** Perf-monitor pushes tier here. User accessibility prefs (Reduced Motion,
 *  Screen Shake toggle) ALWAYS take precedence — perf can further reduce
 *  visual density on slow devices, but never restore an effect the user
 *  asked to turn off. */
let perfMultiplier = 1.0;
let perfShakeAllowed = true;
let perfZoomAllowed = true;

/** Reduced Motion defaults OFF. When ON: disables shake + zoom punch, cuts particles to 30%. */
export function isReducedMotion(): boolean {
  return localStorage.getItem(RM_KEY) === 'on';
}

export function setReducedMotion(on: boolean): void {
  localStorage.setItem(RM_KEY, on ? 'on' : 'off');
}

/** Screen Shake defaults ON. Independent finer control — can be disabled without full reduced motion. */
export function isScreenShakeEnabled(): boolean {
  return localStorage.getItem(SS_KEY) !== 'off';
}

export function setScreenShakeEnabled(on: boolean): void {
  localStorage.setItem(SS_KEY, on ? 'on' : 'off');
}

/** Scalar applied to particle / fragment emit counts. Combines the user's
 *  Reduced Motion pref with the perf-monitor's auto-throttle so older
 *  devices spawn fewer particles without code changes at every emit site. */
export function motionScale(): number {
  const userMul = isReducedMotion() ? 0.3 : 1.0;
  return userMul * perfMultiplier;
}

/** Whether the given visual effect is currently allowed. */
export function shouldShake(): boolean {
  return !isReducedMotion() && isScreenShakeEnabled() && perfShakeAllowed;
}

export function shouldZoom(): boolean {
  return !isReducedMotion() && perfZoomAllowed;
}

/** Called by perf-monitor when the rolling FPS sample crosses a tier
 *  boundary. Tiers map to:
 *    high   — full visual density, shake + zoom on
 *    medium — particles 0.7x, fragments 0.7x, shake + zoom on
 *    low    — particles 0.4x, fragments 0.4x, shake OFF, zoom OFF
 *  Caller should debounce / hysteresis to avoid thrash. */
export function setPerfTier(tier: PerfTier): void {
  switch (tier) {
    case 'high':
      perfMultiplier = 1.0;
      perfShakeAllowed = true;
      perfZoomAllowed = true;
      break;
    case 'medium':
      perfMultiplier = 0.7;
      perfShakeAllowed = true;
      perfZoomAllowed = true;
      break;
    case 'low':
      perfMultiplier = 0.4;
      perfShakeAllowed = false;
      perfZoomAllowed = false;
      break;
  }
}

/** Inspect the currently active perf tier (for HUD overlay / dev probes). */
export function getPerfState(): { multiplier: number; shake: boolean; zoom: boolean } {
  return { multiplier: perfMultiplier, shake: perfShakeAllowed, zoom: perfZoomAllowed };
}
