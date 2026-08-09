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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not set");
      return new Response(JSON.stringify({ error: "Server config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    <p style="margin-top: 24px; font-size: 13px; color: #999;">Tioga Technologies</p>
  </div>
</div>`.trim();
    } else {
      // Lead notification
      const lead = body;
      to = "sales@tiogatechnologies.com";
      subject = `New Lead: ${lead.full_name} - ${lead.budget || "Budget TBD"}`;
      textBody = `New Lead: ${lead.full_name}\nPhone: ${lead.phone}\nEmail: ${lead.email || "N/A"}\nLocation: ${lead.location}\nBudget: ${lead.budget || "N/A"}`;
      htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">🔔 New Lead Submission</h1>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${lead.full_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Phone</td><td style="padding: 8px 0; font-size: 14px;"><a href="tel:${lead.phone}" style="color: #2563eb;">${lead.phone}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-size: 14px;">${lead.email || "Not provided"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td><td style="padding: 8px 0; font-size: 14px;">${lead.location}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Budget</td><td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #059669;">${lead.budget || "Not specified"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Products</td><td style="padding: 8px 0; font-size: 14px;">${(lead.products || []).join(", ")}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Main Goal</td><td style="padding: 8px 0; font-size: 14px;">${lead.main_goal || "N/A"}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Appliances</td><td style="padding: 8px 0; font-size: 14px;">${(lead.appliances || []).join(", ") || "N/A"}</td></tr>
    </table>
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <a href="https://wa.me/${lead.phone?.replace(/\D/g, '')}" style="display: inline-block; background: #25D366; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reply on WhatsApp</a>
    </div>
  </div>
</div>`.trim();
    }

    console.log("Sending email to:", to);

    const result = await sendMail({ to, subject, html: htmlBody, text: textBody, sender: "sales", label: "new-lead", critical: true });
    if (!result.ok) console.log("Lead notification email failed:", result.error);

    return new Response(JSON.stringify({ success: true }), {
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
