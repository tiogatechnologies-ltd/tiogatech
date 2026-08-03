// Secure affiliate portal data endpoint.
// The affiliates / leads / orders tables are not readable by affiliate users,
// so all aggregation happens here with the service role after validating the
// caller's session and resolving their affiliate record by email.
import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { data: affiliate } = await admin
      .from("affiliates")
      .select("*")
      .ilike("email", ures.user.email)
      .maybeSingle();

    if (!affiliate) return json({ affiliate: null });

    const code = affiliate.code as string;

    const [linksRes, clicksRes, leadsRes, ordersRes, payoutsRes, requestsRes] = await Promise.all([
      admin.from("affiliate_links").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      admin.from("affiliate_link_clicks").select("id, link_id, slug, session_id, referrer, device_type, country, created_at")
        .eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(5000),
      admin.from("leads").select("id, full_name, email, phone, location, products, status, created_at, utm_source, utm_medium, utm_campaign, affiliate_link_slug")
        .eq("affiliate_code", code).order("created_at", { ascending: false }).limit(2000),
      admin.from("orders").select("id, order_number, full_name, email, total, status, payment_status, created_at, affiliate_link_slug, items_summary")
        .eq("affiliate_code", code).order("created_at", { ascending: false }).limit(2000),
      admin.from("affiliate_payouts").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      admin.from("affiliate_payout_requests").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
    ]);

    const links = linksRes.data ?? [];
    const clicks = clicksRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const payouts = payoutsRes.data ?? [];
    const requests = requestsRes.data ?? [];

    const rate = Number(affiliate.commission_rate || 0);
    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const commissionEarned = revenue * (rate / 100);
    const paidOut = payouts
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    const requestedPending = requests
      .filter((r) => r.status === "pending")
      .reduce((s, r) => s + Number(r.amount || 0), 0);
    const available = Math.max(0, commissionEarned - paidOut - requestedPending);

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
      stats: {
        clicks: clicks.length,
        unique_visitors: new Set(clicks.map((c) => c.session_id || c.id)).size,
        leads: leads.length,
        orders: orders.length,
        conversions: paidOrders.length,
        revenue,
        commission_earned: commissionEarned,
        paid_out: paidOut,
        requested_pending: requestedPending,
        available,
        conversion_rate: clicks.length ? (leads.length / clicks.length) * 100 : 0,
        close_rate: leads.length ? (paidOrders.length / leads.length) * 100 : 0,
      },
      links: linkStats,
      series: Object.values(series),
      leads,
      orders,
      payouts,
      payout_requests: requests,
    });
  } catch (err) {
    console.error("affiliate-portal error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
