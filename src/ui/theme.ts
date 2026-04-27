/**
 * Centralized UI tokens. Imported by component factories in ui/components.ts
 * and (incrementally) by individual UI files to replace inline literals.
 *
 * Goal: change a brand color, font, or z-stack rule in one place. Don't
 * over-build — these are typed constants, not a CSS-in-JS framework.
 */

// ---------- Color palette ----------
export const COLOR = {
  // Backgrounds
  bgDeep:        '#0a0a1e',
  bgModal:       'rgba(10,10,30,0.92)',
  bgBackdrop:    'rgba(0,0,0,0.85)',
  bgBackdropSoft:'rgba(0,0,0,0.6)',

  // Surfaces (translucent overlays on dark bg)
  surface1:      'rgba(255,255,255,0.04)',
  surface2:      'rgba(255,255,255,0.08)',
  surface3:      'rgba(255,255,255,0.14)',
  border:        'rgba(255,255,255,0.20)',
  borderStrong:  'rgba(255,255,255,0.35)',

  // Text
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.78)',
  textMuted:     'rgba(255,255,255,0.55)',

  // Brand accents
  accentGold:    '#ffd700',
  accentCoin:    '#ffdd57',
  accentBlue:    '#6ea8fe',
  accentPurple:  '#a78bfa',
  accentPink:    '#ff44ff',

  // Semantic
  success:       '#22c55e',
  successDark:   '#16a34a',
  danger:        '#ef4444',
  warn:          '#eab308',
  warnDark:      '#f97316',
  info:          '#6366f1',
} as const;

// ---------- Gradients (often-repeated linear-gradient strings) ----------
export const GRADIENT = {
  primaryGreen:  'linear-gradient(135deg, #22c55e, #16a34a)',
  gold:          'linear-gradient(135deg, #ffd700, #ffaa00)',
  purple:        'linear-gradient(135deg, #a78bfa, #6366f1)',
  pink:          'linear-gradient(135deg, #ff6b9d, #c44569)',
  modalCard:     'linear-gradient(135deg, #1a1a2e, #16213e)',
  danger:        'linear-gradient(135deg, #ef4444, #b91c1c)',
} as const;

// ---------- Shadows ----------
export const SHADOW = {
  card:          '0 8px 32px rgba(0,0,0,0.4)',
  button:        '0 4px 12px rgba(0,0,0,0.3)',
  glowGold:      '0 0 24px rgba(255,215,0,0.45)',
  glowGreen:     '0 0 18px rgba(34,197,94,0.55)',
  glowDanger:    '0 0 18px rgba(239,68,68,0.55)',
  textPunch:     '0 2px 8px rgba(0,0,0,0.5)',
} as const;

// ---------- Typography ----------
export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const FONT_WEIGHT = {
  regular: '400',
  medium:  '500',
  semibold:'600',
  bold:    '700',
  black:   '900',
} as const;

// ---------- Spacing & radius scales ----------
export const SPACE = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
} as const;

export const RADIUS = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  pill: '999px',
} as const;

// ---------- Z-index map ----------
// Mirrors every literal currently in src/ui/*. Use these instead of bare
// numbers so future overlays don't accidentally collide. New layers should
// be added here, not invented at the call site.
export const Z = {
  background:        2,   // daily progress backdrop
  worldOverlay:      5,   // combo-ring
  hud:               10,  // hud
  goalsPanel:        15,
  goalsPanelExpand:  16,
  dailyProgress:     20,
  chargebar:         40,
  flashes:           45,  // impact flash
  popups:            50,  // coin/combo/overcharge popups
  popupsHigh:        55,  // saved / new-best / boost-toast / press-hud / progress-prompt
  popupsHigher:      60,  // jackpot / unlock celebration
  shopOverlay:       100, // shop, leaderboard, daily start screen
  settingsOverlay:   200, // settings, login reward
  collection:        220, // collection, achievements
  starterPack:       250, // starter pack, ad prompt modals
  adLoading:         300, // ad loading, reset confirm
  toastTop:          400, // landscape hint, ad-unavailable toast
  tutorial:          500,
} as const;

export type ZLayer = keyof typeof Z;
