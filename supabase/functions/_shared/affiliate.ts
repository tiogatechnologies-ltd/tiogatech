// Shared affiliate logic so the portal, the payout-request check and (via the
// same rules in the admin UI) payout creation all agree on one balance.
// The client type is left loose on purpose: an `npm:` import here cannot be
// resolved outside Deno, and this file is also unit-tested under Node/Vitest.
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// Fallbacks match what the live system did before these became configurable,
// so nothing changes for affiliates until an admin edits the settings.
export const AFFILIATE_DEFAULTS = {
  default_commission_percent: 10,
  min_payout_ngn: 10000,
  cookie_window_days: 60,
};

export async function getAffiliateSettings(admin: SupabaseClient) {
  const { data } = await admin.from("site_settings").select("value").eq("key", "affiliate").maybeSingle();
  const v = (data?.value ?? {}) as Record<string, unknown>;
  const num = (x: unknown, fallback: number) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : fallback);
  return {
    default_commission_percent: num(v.default_commission_percent, AFFILIATE_DEFAULTS.default_commission_percent),
    min_payout_ngn: num(v.min_payout_ngn, AFFILIATE_DEFAULTS.min_payout_ngn),
    cookie_window_days: num(v.cookie_window_days, AFFILIATE_DEFAULTS.cookie_window_days),
  };
}

/** Escapes LIKE/ILIKE wildcards so an email is matched literally, never as a pattern. */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

/**
 * Finds the affiliate account for a signed-in user. Matching is by verified
 * email only, and wildcards in the email are escaped - previously an address
 * containing "_" or "%" was treated as a pattern and could match someone
 * else's affiliate record.
 */
export async function findAffiliateForUser(
  admin: SupabaseClient,
  user: { email?: string | null; email_confirmed_at?: string | null },
  columns = "*",
) {
  const email = (user.email ?? "").trim();
  if (!email || !user.email_confirmed_at) return null;
  const { data } = await admin
    .from("affiliates")
    .select(columns)
    .ilike("email", escapeLike(email))
    .maybeSingle();
  return data as Record<string, any> | null;
}

type Money = { total?: number | string | null; payment_status?: string | null };
type Payout = { amount?: number | string | null; status?: string | null };
type Req = { amount?: number | string | null; status?: string | null };

/**
 * Balance = commission earned on paid orders, minus everything already paid or
 * committed to be paid. Approved-but-unpaid payouts and open payout requests
 * both count as committed; before, an approved payout didn't reduce the
 * balance until it was marked paid, so the same money could be requested twice.
 */
export function computeBalance(rate: number, orders: Money[], payouts: Payout[], requests: Req[]) {
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const revenue = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const earned = revenue * (rate / 100);
  const sum = (rows: { amount?: number | string | null }[]) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
  const paidOut = sum(payouts.filter((p) => p.status === "paid"));
  const payoutsInProgress = sum(payouts.filter((p) => p.status === "pending" || p.status === "approved"));
  const requestsPending = sum(requests.filter((r) => r.status === "pending"));
  const committed = payoutsInProgress + requestsPending;
  return {
    paidOrders,
    revenue,
    earned,
    paidOut,
    inProgress: committed,
    available: Math.max(0, earned - paidOut - committed),
  };
}
