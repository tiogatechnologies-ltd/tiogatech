// Generate (or retrieve) a dedicated Paystack Payment Page for a finance_schedules row.
// - Deposit (installment_no = 0) must be paid before any monthly installment link is issued.
// - Uses Paystack Payment Pages API so each installment has a persistent, brandable, re-openable URL.
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

    // Auth: allow owner OR service_role internal call
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

    // Auto-pick next unpaid schedule for application
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
      .select("id, application_id, installment_no, is_deposit, amount_ngn, status, payment_url, payment_reference, due_date, finance_applications:application_id(user_id, email, full_name, item_name, months)")
      .eq("id", scheduleId!)
      .maybeSingle();
    if (sErr || !sched) return json({ error: "schedule not found" }, 404);

    const app = (sched as any).finance_applications;
    if (!isInternal && app?.user_id !== requesterId) return json({ error: "forbidden" }, 403);

    // Idempotency: already paid?
    if (sched.status === "paid") return json({ error: "Installment already paid" }, 409);

    // ── Deposit-first gate ──
    // Any installment (installment_no >= 1) requires the deposit (installment_no = 0) to be paid.
    if (!sched.is_deposit && sched.installment_no >= 1) {
      const { data: deposit } = await admin
        .from("finance_schedules")
        .select("id, status, payment_url")
        .eq("application_id", sched.application_id)
        .eq("installment_no", 0)
        .maybeSingle();
      if (deposit && deposit.status !== "paid") {
        return json({
          error: "deposit_required",
          message: "Pay your 30% deposit before making installment payments.",
          deposit_schedule_id: deposit.id,
          deposit_payment_url: deposit.payment_url || null,
        }, 409);
      }
    }

    // Return existing Payment Page if we already created one and caller isn't forcing regen
    if (!force && sched.payment_url && sched.payment_reference) {
      return json({
        authorization_url: sched.payment_url,
        reference: sched.payment_reference,
        reused: true,
      });
    }

    // Build a persistent Paystack Payment Page for this installment
    const shortApp = String(sched.application_id).replace(/-/g, "").slice(0, 8);
    const slug = `tioga-ef-${shortApp}-${sched.is_deposit ? "dep" : `i${sched.installment_no}`}`;
    const label = sched.is_deposit
      ? "Deposit"
      : `Installment ${sched.installment_no}${app?.months ? ` of ${app.months}` : ""}`;
    const pageName = `Tioga Easy Flex — ${app?.item_name || "Plan"} — ${label}`;
    const description = `Due ${sched.due_date}. Application ${shortApp}. Amount ₦${Number(sched.amount_ngn).toLocaleString("en-NG")}.`;
    const amountKobo = Math.round(Number(sched.amount_ngn) * 100);

    // Try to create the Payment Page (idempotent-ish via slug — Paystack rejects duplicates).
    let pageSlug: string | null = null;
    let pageUrl: string | null = null;

    const createResp = await fetch("https://api.paystack.co/page", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pageName,
        description,
        amount: amountKobo,
        slug,
        currency: "NGN",
        redirect_url: `https://tiogatechnologies.com/account/finance?paid=${scheduleId}`,
        metadata: {
          schedule_id: scheduleId,
          application_id: sched.application_id,
          installment_no: sched.installment_no,
          is_deposit: sched.is_deposit,
          item: app?.item_name,
        },
      }),
    });
    const cj = await createResp.json();

    if (cj?.status && cj?.data?.slug) {
      pageSlug = cj.data.slug;
      pageUrl = `https://paystack.com/pay/${pageSlug}`;
    } else if (typeof cj?.message === "string" && cj.message.toLowerCase().includes("slug")) {
      // Slug likely already exists — fetch it
      const getResp = await fetch(`https://api.paystack.co/page/${slug}`, {
        headers: { Authorization: `Bearer ${SECRET}` },
      });
      const gj = await getResp.json();
      if (gj?.status && gj?.data?.slug) {
        pageSlug = gj.data.slug;
        pageUrl = `https://paystack.com/pay/${pageSlug}`;
      }
    }

    // Fallback to one-time transaction/initialize if Payment Pages API isn't available
    if (!pageUrl) {
      const reference = `tioga_fs_${String(scheduleId).slice(0, 8)}_${Date.now()}`;
      const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: app.email,
          amount: amountKobo,
          currency: "NGN",
          reference,
          metadata: {
            schedule_id: scheduleId,
            application_id: sched.application_id,
            installment_no: sched.installment_no,
            is_deposit: sched.is_deposit,
            item: app?.item_name,
          },
        }),
      });
      const ij = await initResp.json();
      if (!ij?.status) return json({ error: ij?.message || "Paystack init failed" }, 502);
      pageUrl = ij.data.authorization_url;
      pageSlug = ij.data.reference;
    }

    await admin.from("finance_schedules").update({
      payment_url: pageUrl,
      payment_reference: pageSlug,
      auto_charge_status: "manual_required",
    }).eq("id", scheduleId);

    return json({ authorization_url: pageUrl, reference: pageSlug, payment_page: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
