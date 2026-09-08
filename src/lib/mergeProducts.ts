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
export function mergeProducts<T extends { id: string; name: string; image_url?: string | null; [key: string]: any }>(
  staticList: T[],
  dbList: T[]
): T[] {
  const dbIds = new Set(dbList.map((item) => item.id));

  // Build lookup maps for static products by id and normalized name
  const staticById = new Map<string, T>();
  const staticByName = new Map<string, T>();
  for (const s of staticList) {
    staticById.set(s.id, s);
    staticByName.set(s.name.trim().toLowerCase(), s);
  }

  // Merge DB items with matching static records to ensure authentic images & metadata
  // are never wiped out by null/empty database columns.
  const mergedDbList = dbList.map((dbItem) => {
    const staticMatch = staticById.get(dbItem.id) || staticByName.get(dbItem.name.trim().toLowerCase());
    if (!staticMatch) return dbItem;

    const hasAuthenticDbImg =
      dbItem.image_url &&
      typeof dbItem.image_url === "string" &&
      dbItem.image_url.trim().length > 0 &&
      !dbItem.image_url.startsWith("/products/minisim/");

    return {
      ...staticMatch,
      ...dbItem,
      image_url: hasAuthenticDbImg ? dbItem.image_url : (staticMatch.image_url || dbItem.image_url),
      serial_number: dbItem.serial_number ?? staticMatch.serial_number,
      sku: dbItem.sku ?? staticMatch.sku,
      numeric_price: dbItem.numeric_price ?? staticMatch.numeric_price,
      specifications: dbItem.specifications && Object.keys(dbItem.specifications).length > 0
        ? dbItem.specifications
        : staticMatch.specifications,
      features: Array.isArray(dbItem.features) && dbItem.features.length > 0
        ? dbItem.features
        : staticMatch.features,
    };
  });

  const byId = new Map<string, T>();
  staticList.forEach((item) => byId.set(item.id, item));
  mergedDbList.forEach((item) => byId.set(item.id, item));

  const byName = new Map<string, T>();
  byId.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || (dbIds.has(item.id) && !dbIds.has(existing.id))) {
      // If the incoming winner has an empty image_url but existing has an authentic one, preserve it
      const hasImg = item.image_url && typeof item.image_url === "string" && item.image_url.trim().length > 0 && !item.image_url.startsWith("/products/minisim/");
      const winner = !hasImg && existing?.image_url ? { ...item, image_url: existing.image_url } : item;
      byName.set(key, winner);
    }
  });

  return Array.from(byName.values());
}
