import master from "../data/retailMasterPrices.json";

export const normalizePriceName = (value: string) => value.toLowerCase().replace(/[–—]/g, " - ").replace(/\s+/g, " ").trim();
const aliases: Record<string, string> = master.aliases;
const prices: Record<string, number | null> = master.prices;

export const formatRetailPrice = (value: number) => `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(value) ? 0 : 2 })}`;
export const parseRetailPrice = (value?: string | null) => Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;

/** undefined = outside the sheet; null = a quote is required. Never guess by capacity. */
export function masterPriceFor(product: { name: string; id?: string; sku?: string; specifications?: Record<string, string> | null }): number | null | undefined {
  const name = normalizePriceName(product.name);
  const explicitSku = product.specifications?.SKU || product.sku || product.id?.match(/((?:INV|BAT|PNL|AIO|PPS|CTL|PMP|LGT|ACC|SEC|APP)-\d+)$/i)?.[1];
  const explicitId = explicitSku?.toUpperCase();
  const sourceId = explicitId && Object.prototype.hasOwnProperty.call(prices, explicitId) ? explicitId : aliases[name];
  return sourceId && Object.prototype.hasOwnProperty.call(prices, sourceId) ? prices[sourceId] : undefined;
}

// These legacy Luxpower IDs collided with SRNE IDs, losing products in the
// merged catalogue and sharing cart lines. Keep URL suffixes stable.
const collidingLuxpowerIds = new Set([101,102,103,104,105,106,107,110,112,113,115,116,120,121,122,123,124,125]);
export function canonicalRetailId(id: string, name: string) {
  return /^Luxpower\b/i.test(name) && /^a0000000-0000-0000-0000-000000000\d{3}$/.test(id) && collidingLuxpowerIds.has(Number(id.slice(-3))) ? `luxpower-${id}` : id;
}

// The old merged catalogue displayed Luxpower for these ten shared IDs.
// Wishlists stored only an ID, so preserve that displayed product on upgrade.
export function upgradeLegacyWishlistIds(ids: string[]) {
  const luxpowerWinners = new Set([101,110,112,113,115,116,120,121,124,125]);
  return ids.map(id => /^a0000000-0000-0000-0000-000000000\d{3}$/.test(id) && luxpowerWinners.has(Number(id.slice(-3))) ? `luxpower-${id}` : id);
}

/** Apply only reviewed prices, preserving the independent crossed-out price. */
export function applyMasterPrice<T extends { name: string; id: string; price?: string | null; numeric_price?: number | null; sku?: string; specifications?: Record<string, string> | null }>(product: T): T {
  const price = masterPriceFor(product);
  const id = canonicalRetailId(product.id, product.name);
  if (price === undefined) return id === product.id ? product : { ...product, id };
  return { ...product, id, price: price === null ? null : formatRetailPrice(price), numeric_price: price ?? undefined };
}

export function refreshRetailCartItem<T extends { type: string; refId: string; id: string; name: string; price: string | null; numericPrice?: number | null }>(item: T): T | null {
  if (item.type !== "product") return item;
  const price = masterPriceFor({ name: item.name, id: item.refId });
  if (price === null) return null;
  const refId = canonicalRetailId(item.refId, item.name);
  return { ...item, refId, id: refId === item.refId ? item.id : `product:${refId}`, ...(price === undefined ? {} : { price: formatRetailPrice(price), numericPrice: price }) };
}
