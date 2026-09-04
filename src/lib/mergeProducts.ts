/**
 * Merge a static fallback product list with live DB rows into one deduped list.
 *
 * Two passes are needed:
 * 1. Key by id - static seed rows and their DB counterparts share the same
 *    fixed id, so this lets a DB row correctly override its static seed.
 * 2. Key by normalized name - some DB rows are stale/legacy duplicates of a
 *    static product under a different id (e.g. old demo data), so without
 *    this pass the same product would render twice with different data.
 *    The DB version wins since it's the more current source of truth.
 */
export function mergeProducts<T extends { id: string; name: string }>(
  staticList: T[],
  dbList: T[]
): T[] {
  const dbIds = new Set(dbList.map((item) => item.id));

  const byId = new Map<string, T>();
  staticList.forEach((item) => byId.set(item.id, item));
  dbList.forEach((item) => byId.set(item.id, item));

  const byName = new Map<string, T>();
  byId.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || (dbIds.has(item.id) && !dbIds.has(existing.id))) {
      byName.set(key, item);
    }
  });

  return Array.from(byName.values());
}
