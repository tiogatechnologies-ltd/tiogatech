// Admin-only: shift a single installment's due date, logging the change.
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

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", ud.user.id);
    if (!(roles || []).some((r: any) => r.role === "admin" || r.role === "staff")) return json({ error: "forbidden" }, 403);

    const { schedule_id, new_due_date, reason } = await req.json().catch(() => ({}));
    if (!schedule_id || !new_due_date) return json({ error: "schedule_id and new_due_date required" }, 400);

    const { data: sched } = await admin
      .from("finance_schedules")
      .select("id, application_id, installment_no, due_date, original_due_date")
      .eq("id", schedule_id)
      .maybeSingle();
    if (!sched) return json({ error: "not found" }, 404);

    await admin.from("due_date_overrides").insert({
      schedule_id: sched.id,
      application_id: sched.application_id,
      installment_no: sched.installment_no,
      original_due_date: sched.original_due_date || sched.due_date,
      new_due_date,
      reason: reason || null,
      overridden_by: ud.user.id,
    });

    await admin.from("finance_schedules").update({
      due_date: new_due_date,
      override_reason: reason || null,
    }).eq("id", schedule_id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
