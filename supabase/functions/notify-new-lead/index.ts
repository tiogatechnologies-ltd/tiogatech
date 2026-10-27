import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendMail } from "../_shared/mailer.ts";
import { requireServiceOrStaff, escapeHtml } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    let to: string;
    let subject: string;
    let textBody: string;
    let htmlBody: string;

    if (body.custom_email) {
      // Free-form email to an arbitrary recipient: staff/admin (or another edge
      // function) only. This used to be callable by anyone holding the public
      // anon key, which made it an open mail relay from our sending domain.
      const denied = await requireServiceOrStaff(req, corsHeaders);
      if (denied) return denied;

      to = clip(body.to, 255).trim();
      if (!EMAIL_RE.test(to)) {
        return new Response(JSON.stringify({ error: "Invalid recipient" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      subject = clip(body.subject, 200) || "Message from Tioga Technologies";
      textBody = clip(body.message, 5000);
      htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Tioga Technologies</h1>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    ${body.recipient_name ? `<p style="font-size: 14px; color: #333;">Hi ${escapeHtml(clip(body.recipient_name, 120))},</p>` : ""}
    <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(textBody)}</div>
    <p style="margin-top: 24px; font-size: 13px; color: #999;">Tioga Technologies • sales@tiogatechnologies.com</p>
  </div>
</div>`.trim();
    } else {
      // Lead / Enquiry notification from storefront. Always goes to our own
      // sales inbox, and every customer-supplied field is escaped before it is
      // placed in the HTML.
      const lead = body ?? {};
      const fullName = clip(lead.full_name, 120);
      const phone = clip(lead.phone, 40);
      const email = clip(lead.email, 255);
      const location = clip(lead.location, 200);
      const budget = clip(lead.budget, 120);
      const notes = clip(lead.notes, 2000);
      const products = (Array.isArray(lead.products) ? lead.products : []).slice(0, 30).map((p: unknown) => clip(p, 120));
      const waDigits = phone.replace(/\D/g, "");

      to = "sales@tiogatechnologies.com";
      subject = `🔔 New Customer Enquiry: ${fullName.replace(/[\r\n]+/g, " ") || "New Lead"} — ${budget.replace(/[\r\n]+/g, " ") || "Budget TBD"}`;
      textBody = `New Customer Enquiry: ${fullName}\nPhone: ${phone}\nEmail: ${email || "N/A"}\nLocation: ${location}\nBudget: ${budget || "N/A"}\nProducts: ${products.join(", ")}\nNotes: ${notes || "None"}`;
      htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">🔔 New Customer Enquiry Submitted</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Storefront Lead & Quote Request</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Customer Name</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${escapeHtml(fullName)}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px;"><a href="tel:${escapeHtml(waDigits)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(phone)}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px;">${email ? `<a href="mailto:${escapeHtml(email)}" style="color: #2563eb;">${escapeHtml(email)}</a>` : "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td><td style="padding: 8px 0; font-size: 14px;">${escapeHtml(location)}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Budget Range</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #059669;">${escapeHtml(budget || "Not specified")}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Products / Interest</td><td style="padding: 8px 0; font-size: 14px;">${escapeHtml(products.join(", ") || "General Enquiry")}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Notes / Load Details</td><td style="padding: 8px 0; font-size: 14px;">${escapeHtml(notes || "N/A")}</td></tr>
    </table>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px;">
      <a href="https://wa.me/${escapeHtml(waDigits)}" style="display: inline-block; background: #25D366; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">💬 Chat on WhatsApp</a>
      ${email ? `<a href="mailto:${escapeHtml(email)}" style="display: inline-block; background: #0d6b3f; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">✉️ Reply via Email</a>` : ""}
    </div>
  </div>
</div>`.trim();
    }

    console.log("Sending notification to:", to);

    const result = await sendMail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
      sender: "sales",
      label: body.custom_email ? "admin-custom-email" : "new-lead",
      critical: true,
      copyAdmins: true,
    });

    if (!result.ok) {
      console.log("Notification email note:", result.error || result.reason);
    }

    return new Response(JSON.stringify({ success: true, via: result.via }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: "Notification failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
