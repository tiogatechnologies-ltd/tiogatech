/**
 * Price-comparison helpers shared across product and package listings.
 *
 * Sources feed the struck-through "was" price, in priority order:
 *
 *  1. A per-product promo override (Admin > Retail Promotions > Product
 *     Overrides) - an explicit exception for one item.
 *  2. A genuine previous price stored on the item (`compare_at_price`). Set
 *     this in Admin > Product Catalog whenever you actually sold the item for
 *     more - it is the accurate figure and wins over generic policy.
 *  3. A per-brand discount policy (Admin > Retail Promotions > Brand
 *     Discounts), e.g. "Luxpower = 20% off", "SRNE = 20% off".
 *  4. A varied per-product fallback discount (5%-20%), deterministically
 *     derived from the product id so every item gets its own badge - like a
 *     Temu-style listing page - instead of one identical flat % on
 *     everything. Stable across reloads/sessions, requires no stored data,
 *     and automatically covers new products as they're added.
 *  5. A flat configurable storewide list-price markup, used only when the
 *     admin turns randomized fallback off in Admin > Retail Promotions.
 *
 * These are presentation settings, not facts about the item, so they live in
 * one place an admin can change or switch off rather than being hardcoded in
 * fourteen components the way they used to be.
 */

export interface ProductPromoOverride {
  compare_at_price?: number | null;
  discount_pct?: number | null;
  custom_badge?: string | null;
  exclude?: boolean;
}

export interface BrandPromoOverride {
  discount_pct?: number | null;
  exclude?: boolean;
}

export interface CompareAtOptions {
  show_compare_at_price: boolean;
  default_markup_pct: number;
  badge_format?: "save_pct" | "save_amount" | "pct_off";
  product_overrides?: Record<string, ProductPromoOverride>;
  brand_overrides?: Record<string, BrandPromoOverride>;
  /** When true (the default), unassigned products get a varied 5%-20% fallback instead of one flat markup. */
  randomize_fallback_pct?: boolean;
}

/**
 * Parses a price that may be a plain number or a currency-formatted string
 * (e.g. "₦230,000"). Strips everything but digits and the decimal point.
 */
const parseMoney = (value: number | string | null | undefined): number => {
  if (value == null) return NaN;
  if (typeof value === "number") return value;
  const digits = value.replace(/[^0-9.]/g, "");
  return digits ? Number(digits) : NaN;
};

const FALLBACK_MIN_PCT = 5;
const FALLBACK_MAX_PCT = 20;

/**
 * Deterministic pseudo-random integer in [FALLBACK_MIN_PCT, FALLBACK_MAX_PCT]
 * derived from a seed string (the product id), so the same product always
 * gets the same badge on every render/reload instead of flickering.
 */
const seededFallbackPct = (seed: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;
  const span = FALLBACK_MAX_PCT - FALLBACK_MIN_PCT + 1;
  return FALLBACK_MIN_PCT + (hash % span);
};

/**
 * The reference price to strike through, or null when there is nothing to show.
 * Priority order:
 *  1. Product-specific promo override from Admin Promotional Settings
 *  2. Genuine recorded previous price stored directly on the item
 *  3. Brand-level discount policy from Admin Promotional Settings
 *  4. Varied per-product 5%-20% fallback (deterministic, default behavior)
 *  5. Flat storewide list-price markup, if randomization is switched off
 */
export const resolveCompareAt = (
  price: number | null | undefined,
  recorded: number | string | null | undefined,
  opts?: CompareAtOptions,
  productId?: string,
  brand?: string | null,
): number | null => {
  const now = Number(price);
  if (!Number.isFinite(now) || now <= 0) return null;

  // 1. Check if this product has a specific promo override in admin settings
  if (productId && opts?.product_overrides && opts.product_overrides[productId]) {
    const override = opts.product_overrides[productId];
    if (override.exclude) return null; // Admin explicitly excluded this product
    if (override.compare_at_price && Number(override.compare_at_price) > now) {
      return Math.round(Number(override.compare_at_price));
    }
    if (override.discount_pct && Number(override.discount_pct) > 0) {
      return Math.round(now / (1 - Number(override.discount_pct) / 100));
    }
  }

  // 2. Genuine previous price recorded directly on the item
  const real = parseMoney(recorded);
  if (Number.isFinite(real) && real > now) return Math.round(real);

  // 3. Brand-level discount policy
  if (brand && opts?.brand_overrides && opts.brand_overrides[brand]) {
    const brandOverride = opts.brand_overrides[brand];
    if (brandOverride.exclude) return null; // Admin explicitly excluded this brand
    if (brandOverride.discount_pct && Number(brandOverride.discount_pct) > 0) {
      return Math.round(now / (1 - Number(brandOverride.discount_pct) / 100));
    }
  }

  if (!opts?.show_compare_at_price) return null;

  // 4. Varied per-product fallback discount (5%-20%), unless the admin
  // switched back to one flat storewide markup for everything.
  if (opts.randomize_fallback_pct !== false) {
    const seed = productId || `${now}`;
    const pct = seededFallbackPct(seed);
    return Math.round(now / (1 - pct / 100));
  }

  // 5. Flat storewide promotional list price markup
  const pct = Number(opts.default_markup_pct);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return Math.round(now * (1 + pct / 100));
};

/**
 * Resolves any custom promotional badge assigned to this product by the admin
 */
export const resolvePromoBadge = (
  productId?: string,
  opts?: CompareAtOptions,
  defaultBadge?: string,
): string | null => {
  if (productId && opts?.product_overrides && opts.product_overrides[productId]) {
    const override = opts.product_overrides[productId];
    if (override.custom_badge && override.custom_badge.trim().length > 0) {
      return override.custom_badge.trim();
    }
  }
  return defaultBadge || null;
};

/** The reference price, or null when it is missing or not actually higher. */
export const wasPrice = (
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null => {
  const now = Number(price);
  const before = Number(compareAt);
  if (!Number.isFinite(now) || !Number.isFinite(before)) return null;
  if (now <= 0 || before <= now) return null;
  return Math.round(before);
};

/** Amount saved against the reference price, or null. */
export const savedAmount = (
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null => {
  const before = wasPrice(price, compareAt);
  return before === null ? null : before - Math.round(Number(price));
};

/** Percentage off the reference price, rounded. Null when there is none. */
export const savingsPct = (
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null => {
  const before = wasPrice(price, compareAt);
  if (before === null) return null;
  return Math.round(((before - Number(price)) / before) * 100);
};
