// Emails the hiring inbox when a job application is submitted and sends the
// applicant a receipt. Applications are written straight from the browser (RLS
// allows anonymous inserts), so without this nobody was alerted - they only
// appeared if an admin happened to open the Career Applications page.
//
// The caller passes only an application id. Everything emailed is read back from
// the database row, and only for applications created in the last 15 minutes,
// so this endpoint cannot be used to email arbitrary addresses or content.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendMail } from "../_shared/mailer.ts";
import { escapeHtml } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HIRING_INBOX = "careers@tiogatechnologies.com";
const FRESH_WINDOW_MS = 15 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const clip = (v: unknown, max: number) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.application_id ?? "");
    if (!UUID_RE.test(id)) return json({ error: "Invalid application id" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: app } = await admin
      .from("career_applications")
      .select("id, role_title, full_name, email, phone, location, years_experience, cover_note, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!app) return json({ error: "Application not found" }, 404);
    if (Date.now() - new Date(app.created_at).getTime() > FRESH_WINDOW_MS) return json({ ok: true, skipped: "stale" });

    const role = clip(app.role_title, 160);
    const name = clip(app.full_name, 120);

    const adminHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">New job application</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${escapeHtml(role)}</p>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;">${escapeHtml(clip(app.email, 255))}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Phone</td><td style="padding: 6px 0;">${escapeHtml(clip(app.phone, 40))}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Location</td><td style="padding: 6px 0;">${escapeHtml(clip(app.location, 120))}</td></tr>
      <tr><td style="padding: 6px 0; color: #6b7280;">Experience</td><td style="padding: 6px 0;">${escapeHtml(clip(app.years_experience, 80))}</td></tr>
    </table>
    ${app.cover_note ? `<p style="margin-top: 16px; font-size: 14px; color: #374151; white-space: pre-wrap;">${escapeHtml(String(app.cover_note).slice(0, 2000))}</p>` : ""}
    <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">The CV is stored securely - open it from Admin &gt; Career Applications: https://tiogatechnologies.com/admin/career-applications</p>
  </div>
</div>`.trim();

    await sendMail({
      to: HIRING_INBOX,
      subject: `New application: ${role} - ${name}`,
      html: adminHtml,
      text: `New application for ${role} from ${name} (${clip(app.email, 255)}, ${clip(app.phone, 40)}). Review it at https://tiogatechnologies.com/admin/career-applications`,
      sender: "info",
      label: "career-application-admin",
      idempotencyKey: `career-application-admin-${app.id}`,
    });

    const applicantHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0d6b3f; color: #fff; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Application received</h1>
  </div>
  <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; font-size: 14px; color: #374151; line-height: 1.6;">
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thank you for applying for <strong>${escapeHtml(role)}</strong> at Tioga Technologies. We have received your application and CV, and our team will review it. If your profile is a match we will contact you on the email or phone number you provided.</p>
    <p style="color: #6b7280;">Tioga Technologies · Jos, Nigeria</p>
  </div>
</div>`.trim();

    await sendMail({
      to: String(app.email),
      subject: `We received your application - ${role}`,
      html: applicantHtml,
      text: `Hi ${name}, thank you for applying for ${role} at Tioga Technologies. We have received your application and will be in touch if your profile is a match.`,
      sender: "info",
      label: "career-application-receipt",
      idempotencyKey: `career-application-receipt-${app.id}`,
      copyAdmins: false,
    });

    return json({ ok: true });
  } catch (err) {
    console.error("notify-career-application error", err);
    return json({ error: "Notification failed" }, 500);
  }
});
