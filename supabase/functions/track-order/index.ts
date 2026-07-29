// Guest order tracking: look up one order by order number + matching email or phone.
// Runs with the service role so guests (who have no RLS read access to orders)
// can see their own order status without exposing the table publicly.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const digits = (s: string) => s.replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { order_number, contact } = await req.json();
    if (!order_number || !contact) return json({ error: "order_number and contact required" }, 400);

    const ref = String(order_number).trim().toUpperCase();
    const who = String(contact).trim().toLowerCase();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order } = await admin
      .from("orders")
      .select(
        "id, order_number, full_name, email, phone, status, payment_status, payment_method, items_summary, item_count, subtotal, shipping_fee, discount_amount, total, location, shipping_method, tracking_number, created_at, updated_at, fulfilled_at",
      )
      .eq("order_number", ref)
      .maybeSingle();

    // Same generic answer whether the order is missing or the contact is wrong,
    // so order numbers can't be enumerated.
    const contactOk =
      !!order &&
      ((order.email && order.email.toLowerCase() === who) ||
        (order.phone && digits(order.phone).endsWith(digits(who)) && digits(who).length >= 7));

    if (!order || !contactOk) {
      return json({ found: false, message: "No order matches that reference and contact." });
    }

    const { data: history } = await admin
      .from("order_status_history")
      .select("from_status, to_status, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    // Never leak internal notes, user_id or raw addresses to an unauthenticated caller.
    const { id: _id, email: _e, phone: _p, ...safe } = order as Record<string, unknown>;

    return json({
      found: true,
      order: { ...safe, contact_masked: who.includes("@") ? who.replace(/(.).+(@.*)/, "$1***$2") : `***${digits(who).slice(-4)}` },
      history: history ?? [],
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
