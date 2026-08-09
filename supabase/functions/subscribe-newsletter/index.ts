import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { sendMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SITE = "https://tiogatechnologies.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, full_name, source } = await req.json();

    if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Please enter a valid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = typeof full_name === "string" ? full_name.trim().slice(0, 120) : null;
    const cleanSource = typeof source === "string" ? source.trim().slice(0, 60) : "footer";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Upsert — reactivate if previously unsubscribed
    const { error: upsertError } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: cleanEmail, full_name: cleanName, source: cleanSource, unsubscribed: false },
        { onConflict: "email" },
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Could not subscribe. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the row to get tokens for the email links
    const { data: row } = await supabase
      .from("newsletter_subscribers")
      .select("confirm_token, unsubscribe_token, confirmed")
      .eq("email", cleanEmail)
      .maybeSingle();

    const confirmUrl = `${SITE}/newsletter/confirm?token=${row?.confirm_token}`;
    const unsubUrl = `${SITE}/newsletter/unsubscribe?token=${row?.unsubscribe_token}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      // If already confirmed, send "you're already in" note; else send confirmation
      const isConfirm = !row?.confirmed;
      const subject = isConfirm
        ? "Please confirm your Tioga newsletter subscription"
        : "You're already subscribed to Tioga";

      const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">${isConfirm ? "One quick click" : "Welcome back"}</h1>
  </div>
  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; color: #333; font-size: 14px; line-height: 1.6;">
    <p>${cleanName ? `Hi ${cleanName},` : "Hi there,"}</p>
    ${isConfirm
      ? `<p>Thanks for joining the Tioga newsletter. Please confirm your email so we can start sending you energy tips, package launches and grid alerts.</p>
         <p style="text-align: center; margin: 28px 0;">
           <a href="${confirmUrl}" style="display: inline-block; background: #FFD700; color: #0A192F; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">Confirm my email</a>
         </p>
         <p style="font-size: 12px; color: #777;">Or paste this link: <br/>${confirmUrl}</p>`
      : `<p>You're already subscribed to the Tioga newsletter. No action needed.</p>`}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
    <p style="font-size: 11px; color: #999;">Didn't ask for this? <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>.</p>
  </div>
</div>`.trim();

      sendMail({
        to: cleanEmail,
        subject,
        text: isConfirm ? `Confirm your subscription: ${confirmUrl}` : "You're already subscribed.",
        html,
        sender: "noreply",
        label: "newsletter-confirm",
      }).catch((e) => console.log("Confirm email failed:", e));

      if (isConfirm) {
        sendMail({
          to: "sales@tiogatechnologies.com",
          subject: `New newsletter signup (pending confirm): ${cleanEmail}`,
          text: `${cleanName ?? "(no name)"} <${cleanEmail}> from ${cleanSource}.`,
          html: `<p><strong>${cleanName ?? "(no name)"}</strong> &lt;${cleanEmail}&gt; signed up from <em>${cleanSource}</em>. Awaiting email confirmation.</p>`,
          sender: "sales",
          label: "newsletter-signup-internal",
          critical: true,
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ success: true, pending_confirmation: !row?.confirmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Newsletter error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
