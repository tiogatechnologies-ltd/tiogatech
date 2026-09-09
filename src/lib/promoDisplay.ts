/**
 * Price-comparison helpers shared across product and package listings.
 *
 * Two sources feed the struck-through "was" price, in priority order:
 *
 *  1. A genuine previous price stored on the item (`compare_at_price`). Set
 *     this in Admin > Product Catalog whenever you actually sold the item for
 *     more - it is the accurate figure and always wins.
 *  2. A configurable list-price markup (Admin > Settings > Delivery, Tax &
 *     Promotions), applied to anything with no recorded previous price.
 *
 * The markup is a presentation setting, not a fact about the item, so it lives
 * in one place an admin can change or switch off rather than being hardcoded in
 * fourteen components the way it used to be.
 */

export interface ProductPromoOverride {
  compare_at_price?: number | null;
  discount_pct?: number | null;
  custom_badge?: string | null;
  exclude?: boolean;
}

export interface CompareAtOptions {
  show_compare_at_price: boolean;
  default_markup_pct: number;
  badge_format?: "save_pct" | "save_amount" | "pct_off";
  product_overrides?: Record<string, ProductPromoOverride>;
}

/**
 * The reference price to strike through, or null when there is nothing to show.
 * Priority order:
 *  1. Product-specific promo override from Admin Promotional Settings
 *  2. Genuine recorded previous price stored directly on the item
 *  3. Storewide list-price markup from Admin Promotional Settings
 */
export const resolveCompareAt = (
  price: number | null | undefined,
  recorded: number | null | undefined,
  opts?: CompareAtOptions,
  productId?: string,
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
  const real = Number(recorded);
  if (Number.isFinite(real) && real > now) return Math.round(real);

  // 3. Storewide promotional list price markup
  if (!opts?.show_compare_at_price) return null;
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
