// Generate (or retrieve) a Paystack payment link for a finance_schedules row.
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
    if (!SECRET) return json({ error: "Paystack not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    let scheduleId: string | undefined = body?.schedule_id;
    const applicationId: string | undefined = body?.application_id;
    const force: boolean = !!body?.force;
    if (!scheduleId && !applicationId) return json({ error: "schedule_id or application_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth: allow user who owns the app, or service_role calling internally
    const authHeader = req.headers.get("Authorization");
    const isInternal = authHeader === `Bearer ${SERVICE_KEY}`;
    let requesterId: string | null = null;
    if (!isInternal) {
      if (!authHeader) return json({ error: "unauthorized" }, 401);
      const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: ud } = await anon.auth.getUser();
      requesterId = ud.user?.id ?? null;
      if (!requesterId) return json({ error: "unauthorized" }, 401);
    }

    // Auto-pick next unpaid schedule for application if no schedule_id
    if (!scheduleId && applicationId) {
      const { data: next } = await admin
        .from("finance_schedules")
        .select("id")
        .eq("application_id", applicationId)
        .not("status", "in", "(paid,waived)")
        .order("installment_no", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!next) return json({ error: "No unpaid installments remaining" }, 404);
      scheduleId = next.id;
    }


    const { data: sched, error: sErr } = await admin
      .from("finance_schedules")
      .select("id, application_id, amount_ngn, status, payment_url, payment_reference, finance_applications:application_id(user_id, email, full_name, item_name)")
      .eq("id", scheduleId)
      .maybeSingle();
    if (sErr || !sched) return json({ error: "schedule not found" }, 404);

    const app = (sched as any).finance_applications;
    if (!isInternal && app?.user_id !== requesterId) return json({ error: "forbidden" }, 403);

    // Idempotency: successful payment_events?
    const { data: paid } = await admin.from("payment_events").select("id").eq("schedule_id", scheduleId).eq("status", "success").maybeSingle();
    if (paid) return json({ error: "Installment already paid" }, 409);

    if (!force && sched.payment_url && sched.payment_reference) {
      return json({ authorization_url: sched.payment_url, reference: sched.payment_reference, reused: true });
    }


    const reference = `tioga_fs_${scheduleId.slice(0, 8)}_${Date.now()}`;
    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: app.email,
        amount: Math.round(Number(sched.amount_ngn) * 100),
        currency: "NGN",
        reference,
        metadata: { schedule_id: scheduleId, application_id: sched.application_id, item: app.item_name },
      }),
    });
    const j = await r.json();
    if (!j.status) return json({ error: j.message || "Paystack init failed" }, 502);

    await admin.from("finance_schedules").update({
      payment_url: j.data.authorization_url,
      payment_reference: j.data.reference,
      auto_charge_status: "manual_required",
    }).eq("id", scheduleId);

    return json({ authorization_url: j.data.authorization_url, reference: j.data.reference });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
