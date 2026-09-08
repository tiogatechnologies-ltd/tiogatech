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

export interface CompareAtOptions {
  show_compare_at_price: boolean;
  default_markup_pct: number;
}

/**
 * The reference price to strike through, or null when there is nothing to show.
 * Prefers a real recorded previous price; otherwise derives one from the
 * configured markup.
 */
export const resolveCompareAt = (
  price: number | null | undefined,
  recorded: number | null | undefined,
  opts?: CompareAtOptions,
): number | null => {
  const now = Number(price);
  if (!Number.isFinite(now) || now <= 0) return null;

  // A real previous price is shown even if the markup is switched off - it is a
  // fact about the item, not a marketing default.
  const real = Number(recorded);
  if (Number.isFinite(real) && real > now) return Math.round(real);

  if (!opts?.show_compare_at_price) return null;
  const pct = Number(opts.default_markup_pct);
  if (!Number.isFinite(pct) || pct <= 0) return null;
  return Math.round(now * (1 + pct / 100));
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
