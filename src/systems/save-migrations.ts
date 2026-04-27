/**
 * Save schema versioning + migrations.
 *
 * Save payloads are wrapped in a versioned envelope: { version, data }.
 * Legacy payloads (no `version` field) are treated as version 0.
 *
 * To bump the schema:
 *   1. Increment CURRENT_VERSION.
 *   2. Add a Migrator under the previous version key that transforms `data`
 *      from that version's shape into the new shape.
 *   3. Don't mutate input — return a new object.
 *
 * Migrators run in sequence: 0 -> 1 -> 2 -> ... -> CURRENT_VERSION.
 */

export const CURRENT_VERSION = 3;

export interface SaveEnvelope {
  version: number;
  data: any;
}

type Migrator = (data: any) => any;

/**
 * Map of `from-version` -> migrator that produces the next version's shape.
 * version 0: legacy unwrapped payload (no `version` field).
 * version 1: first explicit envelope, identical fields to v0.
 * version 2: hammer skin id `'ruby'` renamed to `'cheese'` for consistency
 *            with the model file (`hammer_cheese_01.glb`) and display name.
 * version 3: `jackpotBoostExpiresAt` renamed to `loginDay7BoostExpiresAt`.
 *            The field was misleadingly named — it's only set by the day-7
 *            login reward, never by JackpotSystem.
 */
const migrations: Record<number, Migrator> = {
  0: (data) => data, // identity: legacy shape == v1 shape
  1: (data) => {
    if (!data || typeof data !== 'object') return data;
    const next = { ...data };
    if (Array.isArray(next.unlockedHammers)) {
      next.unlockedHammers = next.unlockedHammers.map((id: string) =>
        id === 'ruby' ? 'cheese' : id,
      );
    }
    if (next.selectedHammer === 'ruby') {
      next.selectedHammer = 'cheese';
    }
    return next;
  },
  2: (data) => {
    if (!data || typeof data !== 'object') return data;
    const next = { ...data };
    if (typeof next.jackpotBoostExpiresAt === 'number' && next.loginDay7BoostExpiresAt === undefined) {
      next.loginDay7BoostExpiresAt = next.jackpotBoostExpiresAt;
    }
    delete next.jackpotBoostExpiresAt;
    return next;
  },
};

export function isEnvelope(raw: unknown): raw is SaveEnvelope {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as any).version === 'number' &&
    'data' in (raw as any)
  );
}

/** Run migrations from `fromVersion` up to CURRENT_VERSION. */
export function migrate(data: any, fromVersion: number): any {
  let result = data;
  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    const m = migrations[v];
    if (!m) {
      throw new Error(`Missing migrator for version ${v} -> ${v + 1}`);
    }
    result = m(result);
  }
  return result;
}

/**
 * Parse a raw localStorage string into a migrated v(CURRENT_VERSION) payload.
 * Returns null if the payload is unparseable or migration fails — caller
 * should fall back to defaults in that case.
 */
export function parseAndMigrate(raw: string): any | null {
  try {
    const parsed = JSON.parse(raw);
    if (isEnvelope(parsed)) {
      return migrate(parsed.data, parsed.version);
    }
    // Legacy: no envelope, treat as version 0.
    return migrate(parsed, 0);
  } catch (err) {
    console.warn('[save] failed to parse/migrate payload:', err);
    return null;
  }
}

export function wrapEnvelope(data: any): SaveEnvelope {
  return { version: CURRENT_VERSION, data };
}
