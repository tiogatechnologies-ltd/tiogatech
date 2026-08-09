import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { sendMail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://tiogatechnologies.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = await req.json();
    if (!subject || !html || typeof subject !== "string" || typeof html !== "string") {
      return new Response(JSON.stringify({ error: "subject and html required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (subject.length > 200 || html.length > 200_000) {
      return new Response(JSON.stringify({ error: "Subject or content too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs } = await supabase
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token, full_name")
      .eq("confirmed", true)
      .eq("unsubscribed", false);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Email transport not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const s of subs ?? []) {
      const unsubUrl = `${SITE}/newsletter/unsubscribe?token=${s.unsubscribe_token}`;
      const wrapped = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
  ${html}
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px" />
  <p style="font-size: 11px; color: #999; text-align:center;">
    You're receiving this because you subscribed to the Tioga newsletter.<br/>
    <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
  </p>
</div>`.trim();

      try {
        const r = await sendMail({ to: s.email, subject, html: wrapped, text: subject, sender: "noreply", label: "newsletter" });
        if (r.ok) sent++;
      } catch (e) {
        console.log("Send failed for", s.email, e);
      }
    }

    await supabase.from("newsletter_broadcasts").insert({
      subject, html, sent_count: sent, sent_by: user.id,
    });

    return new Response(JSON.stringify({ success: true, sent, total: subs?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Broadcast error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
