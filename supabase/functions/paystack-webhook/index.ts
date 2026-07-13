// Paystack webhook — verifies HMAC-SHA512 signature; handles charges, refunds, liquidation.
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
  const paystackEventId: string | null = event?.id ? String(event.id) : null;
  const data = event?.data ?? {};
  const reference: string = data?.reference || "";
  const metadata = data?.metadata ?? {};
  const scheduleId: string | null = metadata?.schedule_id ?? null;
  const applicationId: string | null = metadata?.application_id ?? null;
  const isLiquidation: boolean = !!metadata?.liquidation;
  const status = data?.status === "success" ? "success" : (data?.status || type || "unknown");
  const amountNgn = data?.amount ? Number(data.amount) / 100 : null;

  // Idempotent insert (paystack_event_id unique when present, reference otherwise)
  const { error: insErr } = await admin.from("payment_events").insert({
    provider: "paystack",
    event_type: type,
    reference,
    paystack_event_id: paystackEventId,
    schedule_id: scheduleId,
    application_id: applicationId,
    status,
    amount_ngn: amountNgn,
    raw: event,
  });
  if (insErr && !String(insErr.message).toLowerCase().includes("duplicate")) {
    console.error("payment_events insert failed", insErr);
  }
  if (insErr) return new Response("ok", { status: 200 });

  // charge.success handling
  if (type === "charge.success" && status === "success") {
    // 0) AI subscription activation (purpose: ai_subscription)
    if (metadata?.purpose === "ai_subscription" && metadata?.user_id) {
      const plan = (metadata?.plan === "business" ? "business" : "starter") as "starter" | "business";
      const monthly = amountNgn ?? (plan === "business" ? 12000 : 2500);
      const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await admin.from("ai_subscriptions").select("id").eq("user_id", metadata.user_id).maybeSingle();
      const payload = {
        user_id: metadata.user_id,
        plan,
        status: "active" as const,
        monthly_price_ngn: monthly,
        started_at: new Date().toISOString(),
        expires_at,
        notes: `Paystack ${reference}`,
      };
      if (existing?.id) await admin.from("ai_subscriptions").update(payload).eq("id", existing.id);
      else await admin.from("ai_subscriptions").insert(payload);

      // Top up purchased credits so counters reflect the plan immediately
      const creditsPack = plan === "business" ? 120 : 20;
      const { data: cRow } = await admin.from("assessment_credits").select("id, purchased_credits").eq("user_id", metadata.user_id).maybeSingle();
      if (cRow?.id) {
        await admin.from("assessment_credits").update({
          purchased_credits: (Number(cRow.purchased_credits) || 0) + creditsPack,
          updated_at: new Date().toISOString(),
        }).eq("id", cRow.id);
      } else {
        await admin.from("assessment_credits").insert({ user_id: metadata.user_id, total_credits: 3, purchased_credits: creditsPack });
      }
      return new Response("ok", { status: 200 });
    }


    // 1) Liquidation payoff
    if (isLiquidation && applicationId) {
      await admin.from("finance_schedules").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_reference: reference,
        auto_charge_status: null,
        last_charge_error: null,
      }).eq("application_id", applicationId).neq("status", "paid");

      await admin.from("finance_applications").update({
        status: "completed",
      }).eq("id", applicationId);
      return new Response("ok", { status: 200 });
    }

    // 2) Regular schedule payment
    if (scheduleId) {
      await admin.from("finance_schedules").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_reference: reference,
        auto_charge_status: null,
        last_charge_error: null,
      }).eq("id", scheduleId);

      // 3) Store authorization ONLY if reusable (Paystack direct-debit tokenization)
      const auth = data?.authorization || {};
      const authCode = auth?.authorization_code;
      const isReusable = auth?.reusable === true;
      const customerCode = data?.customer?.customer_code;

      if (applicationId) {
        const { data: appRow } = await admin.from("finance_applications")
          .select("paystack_authorization_code, status, effective_payment_method")
          .eq("id", applicationId).maybeSingle();
        const patch: Record<string, unknown> = {};
        if (isReusable && authCode && !appRow?.paystack_authorization_code) {
          patch.paystack_authorization_code = authCode;
          if (customerCode) patch.paystack_customer_code = customerCode;
        } else if (!isReusable && appRow?.effective_payment_method === "auto_debit") {
          // Card can't be silently charged — fall back to manual links
          patch.effective_payment_method = "fallback_manual";
        }
        if (appRow?.status === "approved") patch.status = "active";
        if (Object.keys(patch).length) await admin.from("finance_applications").update(patch).eq("id", applicationId);

        // Mark any pending retry-queue row for this schedule successful
        await admin.from("debit_retry_queue").update({ status: "success" })
          .eq("schedule_id", scheduleId).eq("status", "pending");
      }
    }
  }

  // charge.failed → log to retry queue (payment_events already logged above)
  if (type === "charge.failed" && scheduleId) {
    await admin.from("finance_schedules").update({
      auto_charge_status: "manual_required",
      last_charge_error: data?.gateway_response || "charge failed",
    }).eq("id", scheduleId);
  }

  // refund.processed → revert schedule + reactivate application
  if (type === "refund.processed") {
    const refRef = data?.transaction_reference || data?.transaction?.reference || reference;
    if (refRef) {
      const { data: sch } = await admin.from("finance_schedules")
        .select("id, application_id")
        .eq("paid_reference", refRef).maybeSingle();
      if (sch) {
        await admin.from("finance_schedules").update({
          status: "due",
          paid_at: null,
          paid_reference: null,
        }).eq("id", sch.id);
        if (sch.application_id) {
          await admin.from("finance_applications").update({ status: "active" }).eq("id", sch.application_id);
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
});
