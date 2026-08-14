import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      // Custom email from admin
      to = body.to;
      subject = body.subject;
      textBody = body.message;
      htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Tioga Technologies</h1>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    ${body.recipient_name ? `<p style="font-size: 14px; color: #333;">Hi ${body.recipient_name},</p>` : ""}
    <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${body.message}</div>
    <p style="margin-top: 24px; font-size: 13px; color: #999;">Tioga Technologies • sales@tiogatechnologies.com</p>
  </div>
</div>`.trim();
    } else {
      // Lead / Enquiry notification from storefront
      const lead = body;
      to = "sales@tiogatechnologies.com";
      subject = `🔔 New Customer Enquiry: ${lead.full_name || "New Lead"} — ${lead.budget || "Budget TBD"}`;
      textBody = `New Customer Enquiry: ${lead.full_name}\nPhone: ${lead.phone}\nEmail: ${lead.email || "N/A"}\nLocation: ${lead.location}\nBudget: ${lead.budget || "N/A"}\nProducts: ${(lead.products || []).join(", ")}\nNotes: ${lead.notes || "None"}`;
      htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">🔔 New Customer Enquiry Submitted</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Storefront Lead & Quote Request</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Customer Name</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${lead.full_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px;"><a href="tel:${lead.phone}" style="color: #2563eb; font-weight: 600;">${lead.phone}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${lead.email}" style="color: #2563eb;">${lead.email || "Not provided"}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td><td style="padding: 8px 0; font-size: 14px;">${lead.location}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Budget Range</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #059669;">${lead.budget || "Not specified"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Products / Interest</td><td style="padding: 8px 0; font-size: 14px;">${(lead.products || []).join(", ") || "General Enquiry"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Notes / Load Details</td><td style="padding: 8px 0; font-size: 14px;">${lead.notes || "N/A"}</td></tr>
    </table>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px;">
      <a href="https://wa.me/${lead.phone?.replace(/\D/g, '')}" style="display: inline-block; background: #25D366; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">💬 Chat on WhatsApp</a>
      ${lead.email ? `<a href="mailto:${lead.email}" style="display: inline-block; background: #0d6b3f; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">✉️ Reply via Email</a>` : ""}
    </div>
  </div>
</div>`.trim();
    }

    console.log("Sending lead notification to:", to, "with admin CC to tiogatechnologies@gmail.com and inememmanuel@gmail.com");

    const result = await sendMail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
      sender: "sales",
      label: "new-lead",
      critical: true,
      copyAdmins: true,
    });

    if (!result.ok) {
      console.log("Lead notification email note:", result.error || result.reason);
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
