// Initialize a Paystack transaction and return the authorization URL.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { z } from "npm:zod@3.23.8";
import { CATALOG_PRICES } from "../_shared/catalog-prices.ts";
import { AI_PLAN_PRICES_NGN, buildDbPriceMap, checkOrderPrice } from "../_shared/pricing.ts";
import { escapeHtml } from "../_shared/auth.ts";
import { sendMail } from "../_shared/mailer.ts";

// Orders are written by the buyer's own browser, so `orders.total` cannot be
// trusted: before asking Paystack for money, work out what the items in the
// order cost from server-held prices and refuse if the total is lower.
//
//   PRICE_CHECK_MODE        enforce (default) | warn (alert only) | off
//   PRICE_CHECK_UNRESOLVED  set to "block" to also refuse orders containing items
//                           the server does not recognise (default: allow + alert)
// Every suspicious order emails the sales inbox either way.
async function checkPriceOrBlock(
  admin: ReturnType<typeof createClient>,
  order: { order_number: string; total: number | string; items_summary: string | null; discount_code: string | null },
): Promise<string | null> {
  const mode = (Deno.env.get("PRICE_CHECK_MODE") ?? "enforce").toLowerCase();
  if (mode === "off") return null;
  try {
    const [solar, locks, automation, cctv, products] = await Promise.all([
      admin.from("solar_packages").select("package_number, inverter, total_price"),
      admin.from("smart_locks").select("name, price"),
      admin.from("home_automation_packages").select("name, price"),
      admin.from("cctv_packages").select("name, price"),
      admin.from("products").select("name, price"),
    ]);
    const prices = {
      ...CATALOG_PRICES,
      ...buildDbPriceMap({
        solar: solar.data ?? [],
        locks: locks.data ?? [],
        automation: automation.data ?? [],
        cctv: cctv.data ?? [],
        products: products.data ?? [],
      }),
    };

    let discount: { type: string; value: number } | null = null;
    if (order.discount_code) {
      const { data } = await admin.from("discounts").select("type, value, active")
        .eq("code", String(order.discount_code).trim().toUpperCase()).maybeSingle();
      discount = data?.active ? (data as { type: string; value: number }) : null;
    }

    const check = checkOrderPrice({ summary: order.items_summary, total: Number(order.total), prices, discount });
    if (check.status === "ok") return null;

    const ngn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
    const headline =
      check.status === "underpaid" ? "total is LOWER than the items cost"
      : check.status === "empty" ? "order has no readable items"
      : "contains items the server does not recognise";
    try {
      await sendMail({
        to: "sales@tiogatechnologies.com",
        subject: `Price check: order ${order.order_number} - ${headline}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
<p><strong>Order ${escapeHtml(order.order_number)}</strong> failed the automatic price check: ${escapeHtml(headline)}.</p>
<p>Order total: <strong>${ngn(Number(order.total))}</strong><br/>Items cost (recognised items): <strong>${ngn(check.expected)}</strong><br/>Lowest total accepted: <strong>${ngn(check.floor)}</strong></p>
${check.unresolved.length ? `<p>Unrecognised: ${check.unresolved.map(escapeHtml).join("; ")}</p>` : ""}
<pre style="white-space:pre-wrap">${escapeHtml(order.items_summary ?? "")}</pre>
<p>Mode: ${escapeHtml(mode)}. ${check.status === "underpaid" || check.status === "empty" ? (mode === "enforce" ? "Payment was NOT started." : "Payment was allowed (warn mode).") : "Payment was allowed."}</p></div>`,
        text: `Order ${order.order_number} failed the price check: ${headline}. Total ${ngn(Number(order.total))}, items ${ngn(check.expected)}.`,
        sender: "sales",
        label: "price-check",
        idempotencyKey: `price-check-${order.order_number}-${check.status}`,
      });
    } catch (e) {
      console.error("price-check alert failed", e);
    }

    const refuse = "We could not confirm the price of this order. Please contact us on WhatsApp so we can sort it out quickly.";
    if (mode === "enforce" && (check.status === "underpaid" || check.status === "empty")) return refuse;
    if (mode === "enforce" && check.status === "unresolved" && Deno.env.get("PRICE_CHECK_UNRESOLVED") === "block") return refuse;
    return null;
  } catch (e) {
    // A failure in the check itself must never stop a genuine customer paying.
    console.error("price check failed", e);
    return null;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  amount_ngn: z.number().positive().optional(),
  email: z.string().email().optional(),
  order_number: z.string().min(3).max(80).optional(),
  metadata: z.record(z.unknown()).optional(),
  callback_url: z.string().url(),
  reference: z.string().min(6).max(120).regex(/^[A-Za-z0-9_.=-]+$/).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) {
      return new Response(JSON.stringify({ error: "Paystack not configured. Admin needs to add PAYSTACK_SECRET_KEY." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payment details" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { order_number, metadata, callback_url, reference } = parsed.data;

    // Optional: tie to authenticated user if Authorization header is sent
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Payment service is not configured");
    if (authHeader) {
      const sb = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await sb.auth.getUser();
      userId = data.user?.id ?? null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Please sign in before making a payment." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let amountNgn = parsed.data.amount_ngn;
    let paymentEmail = parsed.data.email;
    // Only metadata the server builds is sent to Paystack. The browser used to be
    // able to pass its own `schedule_id`, `application_id`, `liquidation` or
    // `plan`, which the webhook acts on - e.g. marking a finance instalment paid
    // or activating a plan for whatever amount was requested.
    const safeMetadata: Record<string, unknown> = { user_id: userId };
    const admin = createClient(supabaseUrl, serviceKey);

    if (order_number) {
      const { data: order, error: orderError } = await admin.from("orders")
        .select("order_number, user_id, email, total, payment_status, items_summary, discount_code")
        .eq("order_number", order_number).maybeSingle();
      if (orderError || !order || order.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Order not found." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (order.payment_status === "paid") {
        return new Response(JSON.stringify({ error: "This order has already been paid." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const blocked = await checkPriceOrBlock(admin, order);
      if (blocked) return new Response(JSON.stringify({ error: blocked }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      amountNgn = Number(order.total);
      paymentEmail = order.email;
      safeMetadata.purpose = "order_checkout";
      safeMetadata.order_number = order.order_number;
    } else if ((metadata as Record<string, unknown> | undefined)?.purpose === "ai_subscription") {
      const plan = String((metadata as Record<string, unknown>).plan ?? "");
      const planPrice = AI_PLAN_PRICES_NGN[plan];
      if (!planPrice) {
        return new Response(JSON.stringify({ error: "Please choose a valid plan." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // The plan decides the price; the amount sent by the browser is ignored.
      amountNgn = planPrice;
      safeMetadata.purpose = "ai_subscription";
      safeMetadata.plan = plan;
    } else {
      return new Response(JSON.stringify({ error: "Unsupported payment type." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!amountNgn || !paymentEmail || amountNgn <= 0) {
      return new Response(JSON.stringify({ error: "A valid amount and email are required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: paymentEmail,
        amount: Math.round(amountNgn * 100), // kobo
        currency: "NGN",
        reference: reference || `tioga_${Date.now()}`,
        callback_url,
        metadata: safeMetadata,
      }),
    });
    const j = await r.json();
    if (!j.status) {
      return new Response(JSON.stringify({ error: j.message || "Paystack init failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      authorization_url: j.data.authorization_url,
      access_code: j.data.access_code,
      reference: j.data.reference,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
