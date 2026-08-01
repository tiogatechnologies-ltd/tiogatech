import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing auth" }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await userClient.auth.getUser();
    if (!ures?.user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isStaff } = await admin.rpc("has_any_role", { _user_id: ures.user.id, _roles: ["admin", "staff"] });
    if (!isStaff) return json({ error: "Forbidden" }, 403);

    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== "string") return json({ error: "order_id required" }, 400);

    const { data: order } = await admin.from("orders").select("*").eq("id", order_id).maybeSingle();
    if (!order) return json({ error: "Order not found" }, 404);
    if (!order.email) return json({ error: "This order has no email address on file" }, 400);

    const { data: items } = await admin
      .from("order_items")
      .select("product_name, quantity, price_label")
      .eq("order_id", order_id);

    const rows = (items || [])
      .map(
        (i: any, n: number) =>
          `<tr><td style="padding:8px 0;font-size:14px;color:#374151;">${n + 1}. ${esc(i.product_name)}${
            i.quantity > 1 ? ` <span style="color:#6b7280;">x${i.quantity}</span>` : ""
          }</td><td style="padding:8px 0;font-size:14px;color:#059669;font-weight:600;text-align:right;">${
            i.price_label ? esc(i.price_label) : ""
          }</td></tr>`,
      )
      .join("");

    const trackUrl = `https://tiogatechnologies.com/track?order=${encodeURIComponent(order.order_number)}`;
    const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
  <div style="background:#0d6b3f;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:22px;">Your order ${esc(order.order_number)}</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Status: ${esc(order.status)}</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <p style="font-size:15px;color:#111827;margin:0 0 12px;">Hi ${esc(order.full_name)},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">Here is a copy of your order details.</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">${rows}</table>
    <div style="margin-top:20px;padding:14px;background:#f3f4f6;border-radius:8px;font-size:13px;color:#6b7280;">
      <strong style="color:#111827;">Delivery to:</strong> ${esc(order.location)}<br/>
      <strong style="color:#111827;">Phone:</strong> ${esc(order.phone)}
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:#0d6b3f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Track your order</a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Tioga Technologies · Solar, Smart Home, Security</p>
  </div>
</div>`.trim();

    const result = await sendMail({
      to: order.email,
      subject: `Your order ${order.order_number} — Tioga Technologies`,
      html,
      text: `Order ${order.order_number}\nStatus: ${order.status}\n\n${order.items_summary}\n\nTrack: ${trackUrl}`,
    });

    if (!result.ok) return json({ error: result.error || "Email failed" }, 502);
    return json({ success: true, via: result.via, to: order.email });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
