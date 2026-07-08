// Paystack webhook handler — verifies HMAC-SHA512 signature, records charge.success events.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!SECRET) return new Response("not configured", { status: 500 });

  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", SECRET).update(raw).digest("hex");
  if (sig !== expected) return new Response("invalid signature", { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const type = event?.event as string;
  const data = event?.data ?? {};
  const reference: string = data?.reference || "";
  const metadata = data?.metadata ?? {};
  const scheduleId: string | null = metadata?.schedule_id ?? null;
  const applicationId: string | null = metadata?.application_id ?? null;
  const status = data?.status === "success" ? "success" : (data?.status || "failed");
  const amountNgn = data?.amount ? Number(data.amount) / 100 : null;

  // Idempotent insert
  const { error: insErr } = await admin.from("payment_events").insert({
    provider: "paystack",
    event_type: type,
    reference,
    schedule_id: scheduleId,
    application_id: applicationId,
    status,
    amount_ngn: amountNgn,
    raw: event,
  });
  // Duplicate reference = already processed; return 200 so Paystack stops retrying
  if (insErr && !String(insErr.message).includes("duplicate")) {
    console.error("payment_events insert failed", insErr);
  }
  if (insErr) return new Response("ok", { status: 200 });

  if (type === "charge.success" && status === "success" && scheduleId) {
    // Mark schedule paid
    await admin.from("finance_schedules").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_reference: reference,
      auto_charge_status: null,
      last_charge_error: null,
    }).eq("id", scheduleId);

    // Store authorization code on application for future auto-charges
    const authCode = data?.authorization?.authorization_code;
    const customerCode = data?.customer?.customer_code;
    if (applicationId && authCode) {
      const { data: appRow } = await admin.from("finance_applications")
        .select("paystack_authorization_code, status")
        .eq("id", applicationId).maybeSingle();
      const patch: Record<string, unknown> = {};
      if (!appRow?.paystack_authorization_code) patch.paystack_authorization_code = authCode;
      if (customerCode) patch.paystack_customer_code = customerCode;
      // Move approved → active on first successful payment
      if (appRow?.status === "approved") patch.status = "active";
      if (Object.keys(patch).length) await admin.from("finance_applications").update(patch).eq("id", applicationId);
    }
  }

  return new Response("ok", { status: 200 });
});
