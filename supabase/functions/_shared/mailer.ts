// Shared outbound mailer for Tioga Technologies.
//
// Delivery order:
//   1. Lovable Emails queue on the verified sender domain
//      (notify.tiogatechnologies.com) — branded From addresses like
//      noreply@tiogatechnologies.com / sales@tiogatechnologies.com, with
//      retries, suppression handling and delivery logging.
//   2. Gmail connector gateway fallback, so nothing is silently lost if the
//      queue is unavailable.
//
// Callers pass ready-made HTML; the queue accepts pre-rendered messages.

import { createClient } from "npm:@supabase/supabase-js@2";

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

/** Verified delegated sender subdomain — must match the Lovable email domain. */
export const SENDER_DOMAIN = "notify.tiogatechnologies.com";
/** Domain shown in the From header. */
export const FROM_DOMAIN = "tiogatechnologies.com";

/** Approved sender identities. Anything else falls back to noreply. */
export const SENDERS = {
  noreply: { email: `noreply@${FROM_DOMAIN}`, name: "Tioga Technologies" },
  sales: { email: `sales@${FROM_DOMAIN}`, name: "Tioga Sales" },
  orders: { email: `orders@${FROM_DOMAIN}`, name: "Tioga Orders" },
  support: { email: `support@${FROM_DOMAIN}`, name: "Tioga Support" },
  finance: { email: `finance@${FROM_DOMAIN}`, name: "Tioga Easy Flex" },
} as const;

export type SenderKey = keyof typeof SENDERS;

export type MailResult = { ok: boolean; via?: "queue" | "gmail"; error?: string; reason?: string };

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRaw(to: string, subject: string, html: string, from: string) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ].join("\r\n");
  return b64url(`${headers}\r\n\r\n${html}`);
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function sendViaGmail(to: string, subject: string, html: string, from: string): Promise<MailResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!LOVABLE_API_KEY || !GMAIL_KEY) return { ok: false, error: "gmail transport not configured" };
  try {
    const res = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_KEY,
      },
      body: JSON.stringify({ raw: buildRaw(to, subject, html, from) }),
    });
    if (res.ok) return { ok: true, via: "gmail" };
    const body = (await res.text()).slice(0, 300);
    console.error("gmail send failed", res.status, body);
    return { ok: false, error: `gmail ${res.status}: ${body}` };
  } catch (e) {
    console.error("gmail error", e);
    return { ok: false, error: String(e) };
  }
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Which branded identity the email comes from. Defaults to noreply. */
  sender?: SenderKey;
  fromName?: string;
  fromEmail?: string;
  /** Short label used for delivery reporting (defaults to "app-email"). */
  label?: string;
  /** Stable key so retries don't duplicate a send. */
  idempotencyKey?: string;
  /**
   * Critical account/order mail (receipts, security, order status).
   * Still delivered through Gmail if the address is on the suppression list.
   */
  critical?: boolean;
}): Promise<MailResult> {
  const { to, subject, html } = opts;
  const text = opts.text ?? subject;
  const identity = SENDERS[opts.sender ?? "noreply"] ?? SENDERS.noreply;
  const fromEmail = opts.fromEmail ?? identity.email;
  const fromName = opts.fromName ?? identity.name;
  const from = `${fromName} <${fromEmail}>`;
  const label = opts.label ?? "app-email";

  if (!to || !to.includes("@")) return { ok: false, error: "invalid recipient" };
  const recipient = to.trim();
  const normalized = recipient.toLowerCase();

  const supabase = serviceClient();

  // 1) Branded queue on the verified sender domain.
  if (supabase) {
    try {
      const messageId = crypto.randomUUID();

      const { data: suppressed } = await supabase
        .from("suppressed_emails")
        .select("id")
        .eq("email", normalized)
        .maybeSingle();

      if (suppressed) {
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: label,
          recipient_email: recipient,
          status: "suppressed",
        });
        if (!opts.critical) return { ok: false, reason: "email_suppressed", error: "recipient suppressed" };
        // Critical mail still goes out through the direct transport.
        return await sendViaGmail(recipient, subject, html, from);
      }

      // One unsubscribe token per address (reused when still valid).
      let unsubscribeToken: string | undefined;
      const { data: existing } = await supabase
        .from("email_unsubscribe_tokens")
        .select("token, used_at")
        .eq("email", normalized)
        .maybeSingle();

      if (existing?.token && !existing.used_at) {
        unsubscribeToken = existing.token;
      } else if (!existing) {
        const token = randomToken();
        await supabase
          .from("email_unsubscribe_tokens")
          .upsert({ token, email: normalized }, { onConflict: "email", ignoreDuplicates: true });
        const { data: stored } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token")
          .eq("email", normalized)
          .maybeSingle();
        unsubscribeToken = stored?.token ?? token;
      }

      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: label,
        recipient_email: recipient,
        status: "pending",
      });

      const { error: enqueueError } = await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          to: recipient,
          from,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text,
          purpose: "transactional",
          label,
          idempotency_key: opts.idempotencyKey ?? messageId,
          unsubscribe_token: unsubscribeToken,
          queued_at: new Date().toISOString(),
        },
      });

      if (!enqueueError) return { ok: true, via: "queue" };
      console.error("email enqueue failed", enqueueError);
      await supabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: label,
        recipient_email: recipient,
        status: "failed",
        error_message: String(enqueueError.message ?? enqueueError).slice(0, 300),
      });
    } catch (e) {
      console.error("queue transport error", e);
    }
  }

  // 2) Gmail connector fallback.
  return await sendViaGmail(recipient, subject, html, from);
}
