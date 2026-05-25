/**
 * Gameweek-scoped localStorage cache.
 *
 * Cache keys are namespaced by the current gameweek number (read from
 * localStorage at call time).  This means entries written in GW7 are
 * automatically invisible in GW8 — no explicit invalidation needed.
 *
 * Old entries accumulate but are harmless; localStorage quotas are generous
 * enough for the handful of API responses this app caches.
 */

import { GW_KEY } from './mockSquad';

const PREFIX = 'cg-cache';

function gwTag(): string {
  if (typeof window === 'undefined') return 'x';
  return window.localStorage.getItem(GW_KEY) ?? 'x';
}

/** Return the cached value, or null on miss / parse error. */
export function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:gw${gwTag()}:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Persist a value under a GW-scoped key.  Silently swallows quota errors. */
export function writeCache<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${PREFIX}:gw${gwTag()}:${key}`, JSON.stringify(value));
  } catch { /* storage quota exceeded — skip caching */ }
}
