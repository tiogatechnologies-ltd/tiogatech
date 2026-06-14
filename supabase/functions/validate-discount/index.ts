// Validate a discount code against the cart subtotal.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, subtotal_ngn, email } = await req.json();
    if (!code || typeof subtotal_ngn !== "number") {
      return new Response(JSON.stringify({ error: "code and subtotal_ngn required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: d } = await admin.from("discounts").select("*").eq("code", code.trim().toUpperCase()).maybeSingle();
    if (!d || !d.active) return new Response(JSON.stringify({ valid: false, reason: "Code not found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const now = new Date();
    if (d.starts_at && new Date(d.starts_at) > now) return new Response(JSON.stringify({ valid: false, reason: "Not yet active" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (d.expires_at && new Date(d.expires_at) < now) return new Response(JSON.stringify({ valid: false, reason: "Expired" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (d.max_uses && d.uses_count >= d.max_uses) return new Response(JSON.stringify({ valid: false, reason: "Usage limit reached" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (subtotal_ngn < Number(d.min_cart_ngn || 0)) return new Response(JSON.stringify({ valid: false, reason: `Minimum cart ₦${d.min_cart_ngn}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (email && d.per_customer_cap) {
      const { count } = await admin.from("discount_redemptions").select("id", { count: "exact", head: true }).eq("discount_id", d.id).eq("email", email);
      if ((count || 0) >= d.per_customer_cap) return new Response(JSON.stringify({ valid: false, reason: "Already used by you" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const amount = d.type === "percent" ? Math.round(subtotal_ngn * Number(d.value) / 100) : Math.min(subtotal_ngn, Number(d.value));
    return new Response(JSON.stringify({ valid: true, discount_id: d.id, code: d.code, type: d.type, value: Number(d.value), amount_off: amount, description: d.description }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
