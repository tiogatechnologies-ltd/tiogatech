/**
 * Cosmetic "was price" / urgency display helpers shared across product and
 * package detail/listing pages. Display only - real prices are never changed.
 */
export const PROMO_LIFT = 1.12;

function hashSeed(seed: string | number): number {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
}

/** Deterministic fake "N people viewing" count, roughly 3-18. */
export const viewerCount = (seed: string | number): number => 3 + (hashSeed(seed) % 16);

/** Deterministic fake "save X%" figure, roughly 7-17. */
export const savingsPct = (seed: string | number): number => 7 + (hashSeed(seed) % 11);

/** Deterministic fake "N sold" count, roughly 3-24. */
export const soldCount = (seed: string | number): number => 3 + (hashSeed(seed) % 22);

/** Cosmetic "was" price derived from the real price via PROMO_LIFT. */
export const wasPrice = (price: number): number => Math.round(price * PROMO_LIFT);
