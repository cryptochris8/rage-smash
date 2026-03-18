/** Sound asset paths and object→sound mappings */

// All paths are relative to public/ (Vite serves public/ at root)
export const SOUND_ASSETS = {
  // Impacts
  'impact-hammer':   '/audio/hammer-hit.wav',
  'impact-charged':  '/audio/bass-hit.wav',

  // Breaks (object-specific)
  'break-glass':     '/audio/Glass-break.wav',
  'break-metal':     '/audio/metal-hit.wav',
  'break-organic':   '/audio/fruit-splat.wav',
  'break-default':   '/audio/hammer-hit.wav',   // fallback

  // Combo milestones
  'combo-cinematic': '/audio/cinematic-impact.wav',

  // Rare object boom
  'rare-boom':       '/audio/low-boom-hit.wav',

  // Rewards
  'coin-pickup':     '/audio/coin-pickup.wav',
} as const;

export type SoundKey = keyof typeof SOUND_ASSETS;

/**
 * Maps object IDs to their break sound key.
 * Objects not listed here use 'break-default'.
 */
export const OBJECT_BREAK_SOUNDS: Record<string, SoundKey> = {
  // Glass objects
  'bottle':      'break-glass',
  'mug':         'break-glass',

  // Metal objects
  'can':         'break-metal',
  'trophy':      'break-metal',
  'helmet':      'break-metal',

  // Organic objects
  'watermelon':  'break-organic',
  'duck':        'break-organic',

  // Electronic objects (use metal for cracking sound)
  'phone':       'break-metal',
  'tv-head':     'break-metal',
  'cube-idol':   'break-glass',

  // Default (thud-like)
  'football':    'break-default',
  'soccer':      'break-default',
  'lamp':        'break-default',
  'statue':      'break-default',
};
