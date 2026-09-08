// Verify a Paystack transaction and confirm its matching order.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { z } from "npm:zod@3.23.8";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) {
      return new Response(JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // order_number is optional: when Paystack redirects using the dashboard-level
    // callback URL it only appends ?reference=, so we recover the order from the
    // transaction's own metadata instead of failing to verify.
    const BodySchema = z.object({
      reference: z.string().min(6).max(120),
      order_number: z.string().min(3).max(80).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "A valid reference is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { reference } = parsed.data;
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !supabaseUrl || !anonKey || !serviceKey) throw new Error("Payment service is not configured");
    const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData } = await authed.auth.getUser();
    if (!authData.user) return new Response(JSON.stringify({ error: "Please sign in." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(supabaseUrl, serviceKey);

    // Ask Paystack first so the order can be resolved from transaction metadata
    // when the caller did not supply an order number.
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const j = await r.json();
    const paidAmount = j?.data?.amount ? Number(j.data.amount) / 100 : 0;
    const metadataOrder = j?.data?.metadata?.order_number;
    const orderNumber = parsed.data.order_number ?? metadataOrder;
    if (!orderNumber) {
      return new Response(JSON.stringify({ error: "Could not resolve an order for this payment." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order } = await admin.from("orders").select("id, order_number, user_id, email, total, payment_status, discount_code, discount_amount").eq("order_number", orderNumber).maybeSingle();
    if (!order || order.user_id !== authData.user.id) return new Response(JSON.stringify({ error: "Order not found." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Still require the transaction's own metadata to name this exact order and
    // the amount to match, so a reference can never confirm a different order.
    const success = j?.data?.status === "success" && metadataOrder === orderNumber && paidAmount === Number(order.total);
    if (success && order.payment_status !== "paid") {
      await admin.from("orders").update({ payment_status: "paid", payment_reference: reference, status: "confirmed" }).eq("order_number", orderNumber).eq("user_id", authData.user.id);

      // Record the redemption now that money has actually moved. Nothing wrote
      // this table before, so `max_uses` and `per_customer_cap` never fired -
      // a "10 uses only" code stayed usable forever. The payment_status guard
      // above makes this run once per order even if verify is called again.
      if (order.discount_code) {
        try {
          const { data: d } = await admin.from("discounts").select("id, uses_count").eq("code", order.discount_code).maybeSingle();
          if (d) {
            await admin.from("discount_redemptions").insert({
              discount_id: d.id,
              user_id: authData.user.id,
              email: order.email ?? authData.user.email ?? null,
              order_id: order.id,
              amount_discounted: Number(order.discount_amount) || 0,
            });
            await admin.from("discounts").update({ uses_count: (Number(d.uses_count) || 0) + 1 }).eq("id", d.id);
          }
        } catch (e) {
          // Never fail a confirmed payment over bookkeeping.
          console.error("discount redemption logging failed", e);
        }
      }
    }
    return new Response(JSON.stringify({
      success,
      order_number: metadataOrder,
      status: j?.data?.status,
      amount_ngn: paidAmount || null,
      currency: j?.data?.currency,
      reference: j?.data?.reference,
      paid_at: j?.data?.paid_at,
      customer_email: j?.data?.customer?.email,
      metadata: j?.data?.metadata,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
