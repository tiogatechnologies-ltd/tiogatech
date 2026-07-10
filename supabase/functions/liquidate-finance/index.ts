// Generate a one-time Paystack payment link for early loan payoff.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!SECRET) return json({ error: "Paystack not configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);
    const anon = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ud } = await anon.auth.getUser();
    if (!ud?.user) return json({ error: "unauthorized" }, 401);

    const { application_id } = await req.json().catch(() => ({}));
    if (!application_id) return json({ error: "application_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: app } = await admin
      .from("finance_applications")
      .select("id, user_id, email, item_name, financed_ngn, monthly_principal_ngn, monthly_interest_ngn, months, is_asset_financing, status")
      .eq("id", application_id)
      .maybeSingle();
    if (!app) return json({ error: "not found" }, 404);
    if (app.user_id !== ud.user.id) return json({ error: "forbidden" }, 403);
    if (!app.is_asset_financing) return json({ error: "Only asset-financing loans can be liquidated" }, 400);

    const { data: schedules } = await admin
      .from("finance_schedules")
      .select("id, installment_no, status, is_deposit")
      .eq("application_id", application_id);
    const paidInstallments = (schedules || []).filter((s: any) => !s.is_deposit && s.status === "paid").length;
    const totalInstallments = Number(app.months || 0);
    if (paidInstallments >= totalInstallments) return json({ error: "Loan already fully paid" }, 409);

    const financed = Number(app.financed_ngn || 0);
    const outstandingPrincipal = Math.max(0, financed - paidInstallments * Number(app.monthly_principal_ngn || 0));
    const payoff = outstandingPrincipal + Number(app.monthly_interest_ngn || 0);
    if (payoff <= 0) return json({ error: "Nothing to pay" }, 409);

    const reference = `tioga_liq_${application_id.slice(0, 8)}_${Date.now()}`;
    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: app.email,
        amount: Math.round(payoff * 100),
        currency: "NGN",
        reference,
        metadata: { application_id, liquidation: true, item: app.item_name },
      }),
    });
    const j = await r.json();
    if (!j.status) return json({ error: j.message || "Paystack init failed" }, 502);

    return json({ authorization_url: j.data.authorization_url, reference: j.data.reference, payoff_amount: payoff });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
