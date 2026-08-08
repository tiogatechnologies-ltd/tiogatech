import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { sendMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  product_type?: string;
  price_label?: string | null;
  quantity: number;
  image_url?: string | null;
}

interface OrderPayload {
  full_name: string;
  phone: string;
  email?: string;
  location: string;
  notes?: string;
  items: OrderItem[];
  source?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_fee?: number;
  subtotal?: number;
  total?: number;
  shipping_address?: Record<string, unknown> | null;
  billing_address?: Record<string, unknown> | null;
  user_id?: string | null;
  discount_code?: string | null;
  affiliate_code?: string | null;
  affiliate_link_slug?: string | null;
}

const ADMIN_EMAIL = "sales@tiogatechnologies.com";

async function sendEmail(to: string, subject: string, html: string, text: string) {
  return await sendMail({ to, subject, html, text });
}

function itemsHtml(items: OrderItem[]) {
  return items
    .map(
      (i, n) => `<tr>
        <td style="padding:8px 0;font-size:14px;color:#374151;">${n + 1}. ${escapeHtml(i.product_name)}${i.quantity > 1 ? ` <span style="color:#6b7280;">x${i.quantity}</span>` : ""}</td>
        <td style="padding:8px 0;font-size:14px;color:#059669;font-weight:600;text-align:right;">${i.price_label ? escapeHtml(i.price_label) : ""}</td>
      </tr>`
    )
    .join("");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as OrderPayload;

    // Validate
    if (!body.full_name || body.full_name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body.phone || body.phone.trim().length < 7) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body.location || body.location.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Invalid location" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const items_summary = body.items.map((i) => `${i.product_name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price_label ? ` (${i.price_label})` : ""}`).join("\n");
    const item_count = body.items.reduce((s, i) => s + (i.quantity || 1), 0);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        full_name: body.full_name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        location: body.location.trim(),
        notes: body.notes?.trim() || null,
        items_summary,
        item_count,
        source: body.source || "cart_checkout",
        payment_method: body.payment_method || "whatsapp",
        payment_status: "pending",
        shipping_method: body.shipping_method || "standard",
        shipping_fee: body.shipping_fee ?? 0,
        subtotal: body.subtotal ?? 0,
        total: body.total ?? 0,
        shipping_address: body.shipping_address ?? null,
        billing_address: body.billing_address ?? null,
        user_id: body.user_id ?? null,
        discount_code: body.discount_code ?? null,
        affiliate_code: body.affiliate_code ?? null,
        affiliate_link_slug: body.affiliate_link_slug ?? null,
      })
      .select()
      .single();

    if (orderErr || !order) {
      console.error("order insert failed", orderErr);
      return new Response(JSON.stringify({ error: "Could not create order" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const itemRows = body.items.map((i) => ({
      order_id: order.id,
      product_name: i.product_name.slice(0, 300),
      product_type: i.product_type || null,
      price_label: i.price_label || null,
      quantity: Math.min(Math.max(i.quantity || 1, 1), 999),
      image_url: i.image_url || null,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
    if (itemsErr) console.error("items insert failed", itemsErr);

    // Customer confirmation
    if (body.email) {
      const custHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
  <div style="background:#0d6b3f;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:22px;">Order received ✓</h1>
    <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Reference: ${order.order_number}</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <p style="font-size:15px;color:#111827;margin:0 0 12px;">Hi ${escapeHtml(body.full_name)},</p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px;">Thanks for your order. Our team will contact you within 1 business day to confirm pricing, delivery, and installation.</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
      ${itemsHtml(body.items)}
    </table>
    <div style="margin-top:20px;padding:14px;background:#f3f4f6;border-radius:8px;font-size:13px;color:#6b7280;">
      <strong style="color:#111827;">Delivery to:</strong> ${escapeHtml(body.location)}<br/>
      <strong style="color:#111827;">Phone:</strong> ${escapeHtml(body.phone)}
    </div>
    <div style="margin-top:20px;text-align:center;">
      <a href="https://tiogatechnologies.com/track?order=${encodeURIComponent(order.order_number)}" style="display:inline-block;background:#0d6b3f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:8px;">Track your order</a>
      <a href="https://wa.me/2348178000023" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Chat with us on WhatsApp</a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">Tioga Technologies · Solar, Smart Home, Security</p>
  </div>
</div>`.trim();
      const custText = `Order received — ${order.order_number}\n\nHi ${body.full_name},\n\nThanks for your order. We will contact you within 1 business day.\n\nItems:\n${items_summary}\n\nDelivery to: ${body.location}\nPhone: ${body.phone}\n\nTrack your order: https://tiogatechnologies.com/track?order=${order.order_number}\n\n— Tioga Technologies`;

      // Preferred: branded order-confirmation template via the verified sender domain.
      let confirmed = false;
      try {
        const { data: txData, error: txErr } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "order-confirmation",
            recipientEmail: body.email,
            idempotencyKey: `order-confirmation-${order.id}`,
            templateData: {
              customerName: body.full_name,
              orderNumber: order.order_number,
              status: order.status,
              items: body.items.map((i) => ({
                name: i.product_name,
                quantity: i.quantity,
                priceLabel: i.price_label,
              })),
              itemsSummary: items_summary,
              deliveryLocation: body.location,
              phone: body.phone,
              trackUrl: `https://tiogatechnologies.com/track?order=${encodeURIComponent(order.order_number)}`,
            },
          },
        });
        confirmed = !txErr;
        if (txErr) console.error("transactional order email failed", txErr);
      } catch (e) {
        console.error("transactional order email error", e);
      }

      if (!confirmed) {
        await sendEmail(body.email, `Order received — ${order.order_number}`, custHtml, custText);
      }
    }


    // Admin alert
    const adminHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0d6b3f;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:20px;">🛒 New Order — ${order.order_number}</h1>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:110px;">Customer</td><td style="padding:6px 0;font-weight:600;font-size:14px;">${escapeHtml(body.full_name)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Phone</td><td style="padding:6px 0;font-size:14px;"><a href="tel:${escapeHtml(body.phone)}" style="color:#2563eb;">${escapeHtml(body.phone)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(body.email || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Location</td><td style="padding:6px 0;font-size:14px;">${escapeHtml(body.location)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Items</td><td style="padding:6px 0;font-size:14px;">${item_count}</td></tr>
    </table>
    <h3 style="margin:20px 0 8px;font-size:15px;color:#111827;">Order items</h3>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
      ${itemsHtml(body.items)}
    </table>
    ${body.notes ? `<div style="margin-top:14px;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;"><strong>Notes:</strong> ${escapeHtml(body.notes)}</div>` : ""}
    <div style="margin-top:20px;">
      <a href="https://wa.me/${body.phone.replace(/\D/g, "")}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reply on WhatsApp</a>
    </div>
  </div>
</div>`.trim();
    const adminText = `New order ${order.order_number}\nCustomer: ${body.full_name}\nPhone: ${body.phone}\nEmail: ${body.email || "—"}\nLocation: ${body.location}\n\nItems:\n${items_summary}${body.notes ? `\n\nNotes: ${body.notes}` : ""}`;
    await sendEmail(ADMIN_EMAIL, `New Order: ${body.full_name} (${item_count} items)`, adminHtml, adminText);

    return new Response(JSON.stringify({ ok: true, order_number: order.order_number, order_id: order.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-order error", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
