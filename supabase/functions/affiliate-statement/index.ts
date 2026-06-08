// Public endpoint that returns an affiliate's payout statement as JSON or CSV.
// Access is gated by the statement_token issued when the payout is created.
// No auth required — token is the secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const money = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(n || 0);

const csvEscape = (s: unknown) => {
  const v = String(s ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    if (!UUID_RE.test(token)) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payout, error } = await supabase
      .from("affiliate_payouts")
      .select(
        "id, period_start, period_end, lead_count, revenue_total, commission_total, amount, status, payment_method, payment_reference, paid_at, notes, created_at, affiliates(full_name, email, code, commission_rate)",
      )
      .eq("statement_token", token)
      .maybeSingle();

    if (error || !payout) {
      return new Response(JSON.stringify({ error: "Statement not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aff = (payout as any).affiliates || {};
    const { data: leads } = await supabase
      .from("leads")
      .select("id, created_at, full_name, status, budget")
      .eq("affiliate_code", aff.code)
      .gte("created_at", `${payout.period_start}T00:00:00Z`)
      .lte("created_at", `${payout.period_end}T23:59:59Z`)
      .order("created_at", { ascending: true });

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(`Tioga Technologies — Affiliate Statement`);
      lines.push(`Affiliate,${csvEscape(aff.full_name)}`);
      lines.push(`Email,${csvEscape(aff.email)}`);
      lines.push(`Code,${csvEscape(aff.code)}`);
      lines.push(`Commission rate,${aff.commission_rate}%`);
      lines.push(`Period,${payout.period_start} to ${payout.period_end}`);
      lines.push(`Status,${payout.status}`);
      lines.push(`Paid at,${payout.paid_at ?? ""}`);
      lines.push(`Payment method,${csvEscape(payout.payment_method ?? "")}`);
      lines.push(`Payment reference,${csvEscape(payout.payment_reference ?? "")}`);
      lines.push("");
      lines.push("Lead ID,Date,Name,Status,Budget");
      (leads || []).forEach((l: any) => {
        lines.push(
          [l.id, l.created_at, l.full_name, l.status, l.budget].map(csvEscape).join(","),
        );
      });
      lines.push("");
      lines.push(`Leads in period,${payout.lead_count}`);
      lines.push(`Gross revenue (NGN),${payout.revenue_total}`);
      lines.push(`Commission (NGN),${payout.commission_total}`);
      lines.push(`Payout amount (NGN),${payout.amount}`);

      return new Response(lines.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="statement-${aff.code}-${payout.period_start}-${payout.period_end}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        affiliate: aff,
        payout,
        leads: leads || [],
        totals: {
          revenue_formatted: money(Number(payout.revenue_total)),
          commission_formatted: money(Number(payout.commission_total)),
          amount_formatted: money(Number(payout.amount)),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("affiliate-statement error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
