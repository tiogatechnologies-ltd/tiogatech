// Initialize a Paystack transaction and return the authorization URL.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { z } from "npm:zod@3.23.8";

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
    const safeMetadata: Record<string, unknown> = { ...(metadata || {}), user_id: userId };
    if (order_number) {
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: order, error: orderError } = await admin.from("orders")
        .select("order_number, user_id, email, total, payment_status")
        .eq("order_number", order_number).maybeSingle();
      if (orderError || !order || order.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Order not found." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (order.payment_status === "paid") {
        return new Response(JSON.stringify({ error: "This order has already been paid." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      amountNgn = Number(order.total);
      paymentEmail = order.email;
      safeMetadata.purpose = "order_checkout";
      safeMetadata.order_number = order.order_number;
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
