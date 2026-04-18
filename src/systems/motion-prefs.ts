const RM_KEY = 'rage-smash-reduced-motion';
const SS_KEY = 'rage-smash-screen-shake';

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

/** Scalar applied to particle / fragment emit counts. */
export function motionScale(): number {
  return isReducedMotion() ? 0.3 : 1.0;
}

/** Whether the given visual effect is currently allowed. */
export function shouldShake(): boolean {
  return !isReducedMotion() && isScreenShakeEnabled();
}

export function shouldZoom(): boolean {
  return !isReducedMotion();
}
