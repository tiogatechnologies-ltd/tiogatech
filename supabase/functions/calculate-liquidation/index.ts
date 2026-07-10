// Compute early payoff (liquidation) for an asset-financing loan.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
      .select("id, user_id, status, financed_ngn, monthly_principal_ngn, monthly_interest_ngn, months, is_asset_financing, item_name")
      .eq("id", application_id)
      .maybeSingle();
    if (!app) return json({ error: "not found" }, 404);
    if (app.user_id !== ud.user.id) {
      // allow admins
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", ud.user.id);
      if (!(roles || []).some((r: any) => r.role === "admin" || r.role === "staff")) return json({ error: "forbidden" }, 403);
    }
    if (!app.is_asset_financing) return json({ error: "Only asset-financing loans can be liquidated" }, 400);

    const { data: schedules } = await admin
      .from("finance_schedules")
      .select("id, installment_no, status, is_deposit")
      .eq("application_id", application_id);

    const paidInstallments = (schedules || []).filter((s: any) => !s.is_deposit && s.status === "paid").length;
    const totalInstallments = Number(app.months || 0);
    const monthlyPrincipal = Number(app.monthly_principal_ngn || 0);
    const monthlyInterest = Number(app.monthly_interest_ngn || 0);
    const financed = Number(app.financed_ngn || 0);

    const outstandingPrincipal = Math.max(0, financed - paidInstallments * monthlyPrincipal);
    const thisMonthInterest = paidInstallments >= totalInstallments ? 0 : monthlyInterest;
    const payoffAmount = outstandingPrincipal + thisMonthInterest;

    return json({
      application_id,
      item_name: app.item_name,
      installments_paid: paidInstallments,
      installments_total: totalInstallments,
      outstanding_principal: outstandingPrincipal,
      this_month_interest: thisMonthInterest,
      payoff_amount: payoffAmount,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
