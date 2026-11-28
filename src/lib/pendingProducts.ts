import { useEffect, useState } from "react";

/**
 * WS7 - Pending (Viewed-but-Uncarted) Products Store
 *
 * Persists the visitor's last 3 viewed products that have not been added to cart
 * in `localStorage` (`tioga_pending_products_v1`) with a 7-day TTL and cross-tab
 * synchronization via `storage` + same-tab custom events.
 */

export const PENDING_PRODUCTS_KEY = "tioga_pending_products_v1";
export const PENDING_PRODUCTS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const PENDING_PRODUCTS_MAX = 3;
const CUSTOM_EVENT = "tioga:pending-products-updated";

export interface PendingProduct {
  id: string;
  refId: string;
  type: "product" | "package";
  slug: string;
  name: string;
  image: string;
  priceLabel: string;
  numericPrice: number;
  qty: number;
  category?: string;
  viewed_at: number;
}

function broadcast() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT));
  }
}

export function getPendingProducts(nowMs: number = Date.now()): PendingProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (item): item is PendingProduct =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.viewed_at === "number" &&
        nowMs - item.viewed_at < PENDING_PRODUCTS_TTL_MS,
    );
    valid.sort((a, b) => b.viewed_at - a.viewed_at);
    return valid.slice(0, PENDING_PRODUCTS_MAX);
  } catch {
    return [];
  }
}

function savePendingProducts(items: PendingProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = items.slice(0, PENDING_PRODUCTS_MAX);
    localStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(trimmed));
    broadcast();
  } catch {
    // ignore quota errors
  }
}

export function recordPendingProduct(
  item: Omit<PendingProduct, "viewed_at" | "qty"> & { qty?: number; viewed_at?: number },
  cartRefIds?: Iterable<string>,
): PendingProduct[] {
  if (!item.id || !item.name || !Number.isFinite(item.numericPrice) || item.numericPrice <= 0) {
    return getPendingProducts();
  }
  const inCart = cartRefIds ? new Set(cartRefIds) : new Set<string>();
  if (inCart.has(item.refId) || inCart.has(item.id) || inCart.has(`${item.type}:${item.refId}`)) {
    return getPendingProducts();
  }

  const now = item.viewed_at ?? Date.now();
  const existing = getPendingProducts(now);
  const prev = existing.find((p) => p.id === item.id || p.refId === item.refId);
  const filtered = existing.filter((p) => p.id !== item.id && p.refId !== item.refId);

  const nextEntry: PendingProduct = {
    ...item,
    qty: Math.max(1, item.qty ?? prev?.qty ?? 1),
    viewed_at: now,
  };

  const next = [nextEntry, ...filtered].slice(0, PENDING_PRODUCTS_MAX);
  savePendingProducts(next);
  return next;
}

export function updatePendingProductQty(idOrRefId: string, qty: number): PendingProduct[] {
  const existing = getPendingProducts();
  const safeQty = Math.max(1, Math.min(99, Math.round(qty) || 1));
  let changed = false;
  const next = existing.map((p) => {
    if (p.id === idOrRefId || p.refId === idOrRefId) {
      changed = true;
      return { ...p, qty: safeQty };
    }
    return p;
  });
  if (changed) savePendingProducts(next);
  return next;
}

export function removePendingProduct(idOrRefId: string): PendingProduct[] {
  const existing = getPendingProducts();
  const next = existing.filter(
    (p) => p.id !== idOrRefId && p.refId !== idOrRefId && `${p.type}:${p.refId}` !== idOrRefId,
  );
  if (next.length !== existing.length) {
    savePendingProducts(next);
  }
  return next;
}

export function syncPendingWithCart(cartKeys: Iterable<string>): PendingProduct[] {
  const keys = new Set(cartKeys);
  if (keys.size === 0) return getPendingProducts();
  const existing = getPendingProducts();
  const next = existing.filter(
    (p) => !keys.has(p.id) && !keys.has(p.refId) && !keys.has(`${p.type}:${p.refId}`),
  );
  if (next.length !== existing.length) {
    savePendingProducts(next);
  }
  return next;
}

export function clearPendingProducts(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_PRODUCTS_KEY);
    broadcast();
  } catch {
    // ignore
  }
}

export function usePendingProducts(): PendingProduct[] {
  const [items, setItems] = useState<PendingProduct[]>(() => getPendingProducts());

  useEffect(() => {
    const refresh = () => setItems(getPendingProducts());
    const onStorage = (e: StorageEvent) => {
      if (e.key === PENDING_PRODUCTS_KEY || e.key === null) refresh();
    };
    window.addEventListener(CUSTOM_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CUSTOM_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return items;
}
