// Cron-invoked: auto-charge upcoming installments using stored authorization codes.
// If no auth code or charge fails, generate a fallback manual payment link.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CRON_SECRET = Deno.env.get("CRON_SHARED_SECRET");
  if (!SECRET) return json({ error: "not configured" }, 500);

  // Only service_role OR the cron shared secret may call this
  const authHeader = req.headers.get("Authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const isAuthed = authHeader === `Bearer ${SERVICE_KEY}` || (CRON_SECRET && cronHeader === CRON_SECRET);
  if (!isAuthed) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: rows, error } = await admin
    .from("finance_schedules")
    .select("id, application_id, amount_ngn, due_date, is_deposit, finance_applications:application_id(email, paystack_authorization_code)")
    .in("status", ["upcoming", "due", "overdue"])
    .lte("due_date", in3Days);
  if (error) return json({ error: error.message }, 500);

  const results: any[] = [];
  for (const row of rows ?? []) {
    const app: any = (row as any).finance_applications;
    // Skip deposit (should be manually paid to establish auth code)
    if (row.is_deposit) { results.push({ id: row.id, skipped: "deposit" }); continue; }

    const authCode = app?.paystack_authorization_code;
    if (!authCode) {
      await ensureManualLink(row.id);
      results.push({ id: row.id, action: "manual_required_no_auth" });
      continue;
    }

    const r = await fetch("https://api.paystack.co/transaction/charge_authorization", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: app.email,
        amount: Math.round(Number(row.amount_ngn) * 100),
        authorization_code: authCode,
        reference: `tioga_ac_${row.id.slice(0, 8)}_${Date.now()}`,
        metadata: { schedule_id: row.id, application_id: row.application_id, auto: true },
      }),
    });
    const j = await r.json();
    if (j?.status && j?.data?.status === "success") {
      // Insert payment_events + mark paid (webhook will also fire, but insert is idempotent via unique reference)
      await admin.from("payment_events").insert({
        provider: "paystack", event_type: "auto_charge", reference: j.data.reference,
        schedule_id: row.id, application_id: row.application_id, status: "success",
        amount_ngn: Number(row.amount_ngn), raw: j,
      });
      await admin.from("finance_schedules").update({
        status: "paid", paid_at: new Date().toISOString(), paid_reference: j.data.reference,
        auto_charge_status: null, last_charge_error: null,
      }).eq("id", row.id);
      await admin.from("debit_retry_queue").update({ status: "success" })
        .eq("schedule_id", row.id).eq("status", "pending");
      results.push({ id: row.id, action: "auto_charged" });
    } else {
      const errMsg = j?.data?.gateway_response || j?.message || "charge failed";
      const needsOtp = String(j?.data?.status || "").toLowerCase() === "send_otp"
        || /otp|authentication/i.test(errMsg);

      // Track retry attempts
      const { data: retryRow } = await admin.from("debit_retry_queue")
        .select("id, attempt_number, max_attempts")
        .eq("schedule_id", row.id).eq("status", "pending").maybeSingle();
      const nextAttempt = (retryRow?.attempt_number ?? 0) + 1;
      const maxAttempts = retryRow?.max_attempts ?? 3;

      if (needsOtp) {
        // Card requires bank OTP — fall back to manual link immediately.
        await admin.from("finance_applications").update({
          effective_payment_method: "fallback_manual",
        }).eq("id", row.application_id);
        if (retryRow) {
          await admin.from("debit_retry_queue").update({
            status: "fallback_sent", attempt_number: nextAttempt, last_error: errMsg,
          }).eq("id", retryRow.id);
        }
        await admin.from("finance_schedules").update({
          auto_charge_status: "manual_required", last_charge_error: errMsg,
        }).eq("id", row.id);
        await ensureManualLink(row.id);
        results.push({ id: row.id, action: "otp_fallback", error: errMsg });
      } else if (nextAttempt >= maxAttempts) {
        if (retryRow) {
          await admin.from("debit_retry_queue").update({
            status: "abandoned", attempt_number: nextAttempt, last_error: errMsg,
          }).eq("id", retryRow.id);
        }
        await admin.from("finance_schedules").update({
          status: "overdue", auto_charge_status: "manual_required", last_charge_error: errMsg,
        }).eq("id", row.id);
        await ensureManualLink(row.id);
        results.push({ id: row.id, action: "abandoned_after_max_attempts", error: errMsg });
      } else {
        if (retryRow) {
          await admin.from("debit_retry_queue").update({
            attempt_number: nextAttempt, last_error: errMsg,
          }).eq("id", retryRow.id);
        }
        await admin.from("finance_schedules").update({
          auto_charge_status: "manual_required", last_charge_error: errMsg,
        }).eq("id", row.id);
        await ensureManualLink(row.id);
        results.push({ id: row.id, action: "manual_fallback", error: errMsg, attempt: nextAttempt });
      }
    }
  }

  return json({ processed: results.length, results });

  async function ensureManualLink(scheduleId: string) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/generate-payment-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: scheduleId }),
      });
    } catch (e) { console.error("ensureManualLink failed", e); }
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
