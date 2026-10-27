// Server-side price check for store orders.
//
// Checkout writes the order straight from the browser, so `orders.total` is
// whatever the buyer's browser said it was, and paystack-init then charges that
// number. This module works out what the items in an order should cost from
// prices the server holds, so an order whose total is lower than its contents
// can be stopped before money is requested.
//
// Pure functions only (no Deno or Supabase imports) so they run in the edge
// functions and in Vitest.

/** Same normalisation the storefront applies to names read from the database. */
export const normalizeCopy = (value: string): string =>
  value.replace(/\s*—\s*/g, " - ").replace(/—/g, "-");

export const normName = (value: string): string =>
  normalizeCopy(String(value ?? "")).toLowerCase().replace(/\s+/g, " ").trim();

/** `raw` is the line without its number and price label; `name`/`qty` read it as "name xQTY". */
export type ParsedItem = { name: string; qty: number; raw: string };

/**
 * Parses the `items_summary` Checkout writes: one line per item,
 * `1. Name x2 (₦1,234)`. The trailing price label is the buyer's own claim and
 * is deliberately ignored - only the name and quantity are used.
 */
export function parseItemsSummary(summary: string | null | undefined): ParsedItem[] {
  const items: ParsedItem[] = [];
  for (const raw of String(summary ?? "").split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    line = line.replace(/^\d+\s*[.)]\s*/, "");
    line = line.replace(/\s*\(\s*₦[^()]*\)\s*$/, "");
    const rawLine = line.trim();
    // Checkout appends exactly " x<number>" (lower-case x) for quantities above 1.
    // Anything looser also swallows model codes such as "Pro Series - X04".
    let qty = 1;
    const q = rawLine.match(/ x(\d{1,3})$/);
    if (q) qty = Math.min(Math.max(parseInt(q[1], 10), 1), 999);
    const name = q ? rawLine.slice(0, q.index).trim() : rawLine;
    if (name) items.push({ name, qty, raw: rawLine });
  }
  return items;
}

/** Static catalog -> normalised name -> numeric price (lowest wins if a name repeats). */
export function buildStaticPriceMap(
  products: { name: string; numeric_price?: number | null }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of products) {
    const price = Number(p.numeric_price);
    if (!p.name || !Number.isFinite(price) || price <= 0) continue;
    const key = normName(p.name);
    if (!(key in out) || price < out[key]) out[key] = price;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

type Row = Record<string, any>;

/**
 * Prices of the things stored only in the database (packages, locks, kits),
 * under every name the storefront adds them to the cart with.
 */
export function buildDbPriceMap(rows: {
  solar?: Row[];
  locks?: Row[];
  automation?: Row[];
  cctv?: Row[];
  products?: Row[];
}): Record<string, number> {
  const out: Record<string, number> = {};
  const put = (name: unknown, price: unknown) => {
    const n = Number(price);
    if (!name || !Number.isFinite(n) || n <= 0) return;
    const key = normName(String(name));
    if (!(key in out) || n < out[key]) out[key] = n;
  };
  for (const r of rows.solar ?? []) put(`Solar Package #${r.package_number} - ${r.inverter}`, r.total_price);
  for (const r of rows.locks ?? []) put(r.name, r.price);
  for (const r of rows.automation ?? []) {
    put(`${r.name} - Home Automation`, r.price);
    put(`${r.name} Home Automation Package`, r.price);
    put(r.name, r.price);
  }
  for (const r of rows.cctv ?? []) put(r.name, r.price);
  for (const r of rows.products ?? []) {
    const digits = String(r.price ?? "").replace(/[^0-9]/g, "");
    if (digits) put(r.name, parseInt(digits, 10));
  }
  return out;
}

export type DiscountRow = { type?: string | null; value?: number | string | null } | null | undefined;

/** The most a discount code can take off. Unknown codes take off nothing. */
export function maxDiscountFor(subtotal: number, discount: DiscountRow): number {
  if (!discount) return 0;
  const value = Number(discount.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return discount.type === "percent" ? Math.round((subtotal * Math.min(value, 100)) / 100) : Math.min(subtotal, value);
}

export type PriceCheck = {
  status: "ok" | "underpaid" | "unresolved" | "empty";
  expected: number; // what the recognised items cost
  floor: number; // lowest total we accept (items - allowed discount - tolerance)
  total: number;
  unresolved: string[];
};

/**
 * `total` must cover the recognised items less any valid discount. Shipping is
 * never required (pickup is free) and overpaying is never an attack, so this is
 * a one-sided check: it only objects when the total is too LOW.
 *
 * Items the server does not recognise are reported as "unresolved" rather than
 * silently priced at zero, so the caller decides how strict to be.
 */
export function checkOrderPrice(args: {
  summary: string | null | undefined;
  total: number;
  prices: Record<string, number>;
  discount?: DiscountRow;
}): PriceCheck {
  const items = parseItemsSummary(args.summary);
  const total = Number(args.total) || 0;
  if (items.length === 0) return { status: "empty", expected: 0, floor: 0, total, unresolved: [] };

  let expected = 0;
  const unresolved: string[] = [];
  for (const item of items) {
    // A name that itself ends in " x<number>" is ambiguous, so try the whole line
    // as one product (quantity 1) before reading the ending as a quantity.
    const whole = args.prices[normName(item.raw)];
    if (whole !== undefined) {
      expected += whole;
      continue;
    }
    const price = args.prices[normName(item.name)];
    if (price === undefined) unresolved.push(item.name);
    else expected += price * item.qty;
  }

  const allowed = maxDiscountFor(expected, args.discount);
  const tolerance = Math.max(100, Math.round(expected * 0.001));
  const floor = Math.max(0, expected - allowed - tolerance);

  if (expected > 0 && total < floor) return { status: "underpaid", expected, floor, total, unresolved };
  if (unresolved.length > 0) return { status: "unresolved", expected, floor, total, unresolved };
  return { status: "ok", expected, floor, total, unresolved };
}

/** Monthly price of each self-serve AI plan. The server charges these, never a browser-supplied amount. */
export const AI_PLAN_PRICES_NGN: Record<string, number> = { starter: 2500, business: 12000 };
