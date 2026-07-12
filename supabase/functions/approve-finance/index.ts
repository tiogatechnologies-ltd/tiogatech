// Approve a finance application and generate its repayment schedule (admin/staff only).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(roles || []).some((r: any) => r.role === "admin" || r.role === "staff")) return new Response("Forbidden", { status: 403, headers: corsHeaders });

    const { application_id, approve, rejection_reason } = await req.json();
    const { data: app } = await admin.from("finance_applications").select("*").eq("id", application_id).maybeSingle();
    if (!app) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!approve) {
      await admin.from("finance_applications").update({ status: "rejected", rejection_reason: rejection_reason || "Not eligible", reviewer_id: u.user.id }).eq("id", application_id);
      await admin.rpc("log_audit", { _action: "finance.reject", _entity: "finance_applications", _entity_id: application_id, _diff: { reason: rejection_reason } as any });
      return new Response(JSON.stringify({ ok: true, status: "rejected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const months = Number(app.months);
    const monthly = Number(app.monthly_payment_ngn);

    // Set status to 'approved' first — this fires the DB trigger
    // (generate_finance_schedule_on_approval) which creates BOTH the deposit row
    // (installment 0, is_deposit=true) AND all monthly installment rows with the
    // correct amounts/dates. We then transition to 'active' so the customer
    // dashboard picks it up.
    const nowIso = new Date().toISOString();
    const { error: approveErr } = await admin
      .from("finance_applications")
      .update({ status: "approved", approved_at: nowIso, reviewer_id: u.user.id })
      .eq("id", application_id);
    if (approveErr) {
      return new Response(JSON.stringify({ error: approveErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Defensive: if trigger produced no schedule (disabled/missing), synthesise one.
    const { count: schedCount } = await admin
      .from("finance_schedules")
      .select("id", { count: "exact", head: true })
      .eq("application_id", application_id);
    if (!schedCount || schedCount === 0) {
      const start = new Date();
      const rows: any[] = [];
      if (Number(app.deposit_ngn) > 0) {
        rows.push({ application_id, installment_no: 0, due_date: start.toISOString().slice(0, 10), original_due_date: start.toISOString().slice(0, 10), amount_ngn: Number(app.deposit_ngn), status: "due", is_deposit: true, auto_charge_status: "manual_required" });
      }
      for (let i = 1; i <= months; i++) {
        const d = new Date(start); d.setMonth(d.getMonth() + i);
        rows.push({ application_id, installment_no: i, due_date: d.toISOString().slice(0, 10), original_due_date: d.toISOString().slice(0, 10), amount_ngn: monthly, status: "upcoming", is_deposit: false, auto_charge_status: i === 1 ? "manual_required" : "scheduled" });
      }
      await admin.from("finance_schedules").insert(rows);
    }

    await admin.from("finance_applications").update({ status: "active" }).eq("id", application_id);
    await admin.rpc("log_audit", { _action: "finance.approve", _entity: "finance_applications", _entity_id: application_id, _diff: { months, monthly } as any });
    return new Response(JSON.stringify({ ok: true, status: "active", installments: months }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("approve-finance error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
