import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail, type SenderKey } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRaw({ to, cc, bcc, subject, html, fromName }: { to: string; cc?: string; bcc?: string; subject: string; html: string; fromName?: string }) {
  const headers = [
    fromName ? `From: ${fromName}` : null,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ].filter(Boolean).join("\r\n");
  return b64url(`${headers}\r\n\r\n${html}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(JSON.stringify({ error: "Gmail connector is not configured. Connect Google Mail in Lovable settings." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: ures } = await userClient.auth.getUser();
    if (!ures?.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isStaff } = await admin.rpc("has_any_role", { _user_id: ures.user.id, _roles: ["admin", "staff"] });
    if (!isStaff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const recipients: string[] = Array.isArray(body.recipients) ? body.recipients.filter((x: any) => typeof x === "string" && x.includes("@")) : [];
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const fromName = body.from_name ? String(body.from_name) : "Tioga Technologies";
    if (recipients.length === 0 || !subject || !message) {
      return new Response(JSON.stringify({ error: "recipients, subject and message are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#0d6b3f;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0;"><h1 style="margin:0;font-size:18px;">Tioga Technologies</h1></div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:22px;border-radius:0 0 12px 12px;font-size:14px;color:#222;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</div>
    </div>`;

    const allowed: SenderKey[] = ["noreply", "sales", "orders", "support", "finance"];
    const requested = String(body.sender ?? "support") as SenderKey;
    const sender: SenderKey = allowed.includes(requested) ? requested : "support";

    const results: { to: string; ok: boolean; error?: string }[] = [];
    for (const to of recipients) {
      try {
        const r = await sendMail({
          to,
          subject,
          html,
          text: message,
          sender,
          fromName,
          label: String(body.label ?? "admin-message"),
          critical: body.critical !== false,
        });
        results.push(r.ok ? { to, ok: true } : { to, ok: false, error: r.error || r.reason });
      } catch (e) {
        results.push({ to, ok: false, error: (e as Error).message });
      }
    }

    const ok = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ sent: ok, total: recipients.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
