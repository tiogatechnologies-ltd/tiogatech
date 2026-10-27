// Secure affiliate portal data endpoint.
// The affiliates / leads / orders tables are not readable by affiliate users,
// so all aggregation happens here with the service role after validating the
// caller's session and resolving their affiliate record by verified email.
import { createClient } from "npm:@supabase/supabase-js@2";
import { computeBalance, escapeLike, findAffiliateForUser, getAffiliateSettings } from "../_shared/affiliate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Affiliates should be able to see how their referrals are doing, not to
// harvest customer contact details (NDPR data-minimisation), so referred
// customers are shown in masked form.
const maskName = (n?: string | null) => {
  const parts = (n ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Customer";
  return parts.length > 1 ? `${parts[0]} ${parts[1][0].toUpperCase()}.` : parts[0];
};
const maskEmail = (e?: string | null) => {
  if (!e) return null;
  const [user, domain] = e.split("@");
  return domain ? `${user.slice(0, 1)}***@${domain}` : "***";
};
const maskPhone = (p?: string | null) => {
  const digits = (p ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? `${digits.slice(0, 3)}****${digits.slice(-2)}` : null;
};

// PostgREST caps a single response (1,000 rows by default), so money-related
// totals must page through every row rather than trust one capped query.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await page(from, from + 999);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ures, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ures.user?.email) return json({ error: "Invalid session" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const affiliate = await findAffiliateForUser(admin, ures.user);
    if (!affiliate) return json({ affiliate: null });

    const code = affiliate.code as string;
    const codePattern = escapeLike(code);
    const settings = await getAffiliateSettings(admin);

    const [linksRes, clicksRes, clickCountRes, leads, orders, payoutsRes, requestsRes] = await Promise.all([
      admin.from("affiliate_links").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      admin.from("affiliate_link_clicks").select("id, link_id, slug, session_id, referrer, device_type, country, created_at")
        .eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(1000),
      admin.from("affiliate_link_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
      fetchAll((from, to) =>
        admin.from("leads").select("id, full_name, email, phone, location, products, status, created_at, utm_source, utm_medium, utm_campaign, affiliate_link_slug")
          .ilike("affiliate_code", codePattern).order("created_at", { ascending: false }).range(from, to)),
      fetchAll((from, to) =>
        admin.from("orders").select("id, order_number, full_name, email, total, status, payment_status, created_at, affiliate_link_slug, items_summary")
          .ilike("affiliate_code", codePattern).order("created_at", { ascending: false }).range(from, to)),
      admin.from("affiliate_payouts").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      admin.from("affiliate_payout_requests").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
    ]);

    const links = linksRes.data ?? [];
    const clicks = clicksRes.data ?? [];
    const totalClicks = clickCountRes.count ?? clicks.length;
    const payouts = payoutsRes.data ?? [];
    const requests = requestsRes.data ?? [];

    const rate = Number(affiliate.commission_rate || 0);
    const { paidOrders, revenue, earned: commissionEarned, paidOut, inProgress, available } =
      computeBalance(rate, orders, payouts, requests);

    // Per-link performance
    const bySlug = (rows: { affiliate_link_slug?: string | null }[]) => {
      const m: Record<string, number> = {};
      rows.forEach((r) => {
        if (r.affiliate_link_slug) m[r.affiliate_link_slug] = (m[r.affiliate_link_slug] || 0) + 1;
      });
      return m;
    };
    const leadsBySlug = bySlug(leads);
    const ordersBySlug = bySlug(paidOrders);
    const revenueBySlug: Record<string, number> = {};
    paidOrders.forEach((o) => {
      if (o.affiliate_link_slug) {
        revenueBySlug[o.affiliate_link_slug] = (revenueBySlug[o.affiliate_link_slug] || 0) + Number(o.total || 0);
      }
    });
    const clicksBySlug: Record<string, number> = {};
    const uniqueBySlug: Record<string, Set<string>> = {};
    clicks.forEach((c) => {
      const s = c.slug || "";
      if (!s) return;
      clicksBySlug[s] = (clicksBySlug[s] || 0) + 1;
      (uniqueBySlug[s] ||= new Set()).add(c.session_id || c.id);
    });

    const linkStats = links.map((l) => {
      const clickCount = clicksBySlug[l.slug] || 0;
      const leadCount = leadsBySlug[l.slug] || 0;
      const orderCount = ordersBySlug[l.slug] || 0;
      return {
        ...l,
        clicks: clickCount,
        unique_visitors: uniqueBySlug[l.slug]?.size || 0,
        leads: leadCount,
        orders: orderCount,
        revenue: revenueBySlug[l.slug] || 0,
        conversion_rate: clickCount ? (leadCount / clickCount) * 100 : 0,
      };
    });

    // 90-day daily series
    const series: Record<string, { date: string; clicks: number; leads: number; revenue: number }> = {};
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      series[k] = { date: k, clicks: 0, leads: 0, revenue: 0 };
    }
    const bump = (iso: string, field: "clicks" | "leads" | "revenue", amount = 1) => {
      const k = new Date(iso).toISOString().slice(0, 10);
      if (series[k]) series[k][field] += amount;
    };
    clicks.forEach((c) => bump(c.created_at, "clicks"));
    leads.forEach((l) => bump(l.created_at, "leads"));
    paidOrders.forEach((o) => bump(o.created_at, "revenue", Number(o.total || 0)));

    return json({
      affiliate: {
        id: affiliate.id,
        full_name: affiliate.full_name,
        email: affiliate.email,
        phone: affiliate.phone,
        code: affiliate.code,
        commission_rate: rate,
        status: affiliate.status,
        payout_method: affiliate.payout_method,
        payout_details: affiliate.payout_details,
        created_at: affiliate.created_at,
      },
      settings: { min_payout_ngn: settings.min_payout_ngn },
      stats: {
        clicks: totalClicks,
        unique_visitors: new Set(clicks.map((c) => c.session_id || c.id)).size,
        leads: leads.length,
        orders: orders.length,
        conversions: paidOrders.length,
        revenue,
        commission_earned: commissionEarned,
        paid_out: paidOut,
        requested_pending: inProgress,
        available,
        conversion_rate: totalClicks ? (leads.length / totalClicks) * 100 : 0,
        close_rate: leads.length ? (paidOrders.length / leads.length) * 100 : 0,
      },
      links: linkStats,
      series: Object.values(series),
      leads: leads.slice(0, 500).map((l) => ({
        ...l,
        full_name: maskName(l.full_name),
        email: maskEmail(l.email),
        phone: maskPhone(l.phone),
      })),
      orders: orders.slice(0, 500).map((o) => ({
        ...o,
        full_name: maskName(o.full_name),
        email: maskEmail(o.email),
      })),
      payouts,
      payout_requests: requests,
    });
  } catch (err) {
    console.error("affiliate-portal error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
