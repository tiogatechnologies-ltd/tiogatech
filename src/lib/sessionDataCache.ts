/**
 * Tiny in-memory, per-tab cache for read-mostly admin-managed catalogs (solar
 * packages, smart locks, automation packages, CCTV kits). These tables change
 * only when an admin edits them, yet every component that reads one
 * (`useSolarPackages`, `useSmartLocks`, ...) used to re-fetch the whole table
 * on its own mount - so a visitor landing on the home page and clicking
 * through to the full listing and then a detail page read the same table
 * three times in a few seconds. The cache is cleared on a hard reload
 * (module-scoped) or explicitly by the matching Admin page after a save, via
 * `invalidateCached`, so admins always see their own edits immediately.
 */

const store = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, value);
}

/** Runs `create` at most once per key while a fetch is in flight; concurrent callers share the result. */
export function getOrCreateInflight<T>(key: string, create: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = create().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function invalidateCached(key: string): void {
  store.delete(key);
  inflight.delete(key);
}
