/**
 * Price-comparison helpers shared across product and package listings.
 *
 * These used to fabricate everything they returned: the "was" price was just
 * `price * 1.12`, and "save X%", "N sold this week" and "N people viewing" were
 * derived from a hash of the row id. Customers were shown discounts that never
 * happened and sales counts that were never counted.
 *
 * Now a strikethrough only appears when an admin has entered a genuine previous
 * price that is actually higher than the current one. No value here is invented.
 */

/** The genuine previous price, or null when there is nothing real to compare to. */
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

/** Amount saved against the genuine previous price, or null. */
export const savedAmount = (
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null => {
  const before = wasPrice(price, compareAt);
  return before === null ? null : before - Math.round(Number(price));
};

/** Real percentage off, rounded. Null when there is no genuine previous price. */
export const savingsPct = (
  price: number | null | undefined,
  compareAt: number | null | undefined,
): number | null => {
  const before = wasPrice(price, compareAt);
  if (before === null) return null;
  return Math.round(((before - Number(price)) / before) * 100);
};
