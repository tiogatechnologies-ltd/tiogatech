// Shared outbound mailer for Tioga Technologies.
// Configured with 3 primary sender identities:
//   - info@tiogatechnologies.com (General, Confirmations, Newsletter)
//   - sales@tiogatechnologies.com (Leads, Quotes, Proposals, Orders, Finance)
//   - support@tiogatechnologies.com (Support tickets, Customer inquiries, Warranty)
//
// Admin copy recipients (always copied on all automated emails):
//   - tiogatechnologies@gmail.com
//   - inememmanuel@gmail.com

import { createClient } from "npm:@supabase/supabase-js@2";

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

/** Verified delegated sender subdomain — must match the email sender domain. */
export const SENDER_DOMAIN = "notify.tiogatechnologies.com";
/** Domain shown in the From header. */
export const FROM_DOMAIN = "tiogatechnologies.com";

/** The two admin addresses that must ALWAYS be copied on all automation emails. */
export const ADMIN_COPY_EMAILS = [
  "tiogatechnologies@gmail.com",
  "inememmanuel@gmail.com",
] as const;

/** 3 primary sender identities for all website automations. */
export const SENDERS = {
  info: { email: `info@${FROM_DOMAIN}`, name: "Tioga Technologies" },
  sales: { email: `sales@${FROM_DOMAIN}`, name: "Tioga Sales" },
  support: { email: `support@${FROM_DOMAIN}`, name: "Tioga Support" },
  // Backwards compatibility aliases mapped cleanly to the 3 main senders:
  noreply: { email: `info@${FROM_DOMAIN}`, name: "Tioga Technologies" },
  orders: { email: `sales@${FROM_DOMAIN}`, name: "Tioga Sales" },
  finance: { email: `sales@${FROM_DOMAIN}`, name: "Tioga Sales" },
} as const;

export type SenderKey = keyof typeof SENDERS;

export type MailResult = { ok: boolean; via?: "queue" | "gmail"; error?: string; reason?: string };

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRaw(to: string, subject: string, html: string, from: string, ccEmails: string[] = []) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    ccEmails.length > 0 ? `Cc: ${ccEmails.join(", ")}` : "",
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ].filter(Boolean).join("\r\n");
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

async function sendViaGmail(to: string, subject: string, html: string, from: string, ccEmails: string[] = []): Promise<MailResult> {
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
      body: JSON.stringify({ raw: buildRaw(to, subject, html, from, ccEmails) }),
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
  /** Primary sender identity: 'info' | 'sales' | 'support' */
  sender?: SenderKey;
  fromName?: string;
  fromEmail?: string;
  /** Short label used for delivery reporting (defaults to "app-email"). */
  label?: string;
  /** Stable key so retries don't duplicate a send. */
  idempotencyKey?: string;
  /**
   * Critical account/order mail (receipts, security, order status).
   */
  critical?: boolean;
  /** Set to false if you wish to bypass admin copying for internal system checks */
  copyAdmins?: boolean;
}): Promise<MailResult> {
  const { to, subject, html } = opts;
  const text = opts.text ?? subject;
  const identity = SENDERS[opts.sender ?? "info"] ?? SENDERS.info;
  const fromEmail = opts.fromEmail ?? identity.email;
  const fromName = opts.fromName ?? identity.name;
  const from = `${fromName} <${fromEmail}>`;
  const label = opts.label ?? "app-email";

  if (!to || !to.includes("@")) return { ok: false, error: "invalid recipient" };
  const recipient = to.trim();
  const normalized = recipient.toLowerCase();

  // Admin CC list (skip if recipient is already one of the admins)
  const copyAdmins = opts.copyAdmins !== false;
  const ccRecipients = copyAdmins
    ? ADMIN_COPY_EMAILS.filter((adminEmail) => adminEmail.toLowerCase() !== normalized)
    : [];

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
        return await sendViaGmail(recipient, subject, html, from, ccRecipients);
      }

      // One unsubscribe token per address
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
          cc: ccRecipients,
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

      // Also ensure copies are directly sent to admins if queue is being processed
      for (const adminEmail of ccRecipients) {
        await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: crypto.randomUUID(),
            to: adminEmail,
            from,
            sender_domain: SENDER_DOMAIN,
            subject: `[Admin Copy] ${subject}`,
            html,
            text,
            purpose: "transactional",
            label: `${label}-admin-copy`,
            idempotency_key: `${opts.idempotencyKey ?? messageId}-admin-${adminEmail}`,
            queued_at: new Date().toISOString(),
          },
        }).catch(console.error);
      }

      if (!enqueueError) return { ok: true, via: "queue" };
      console.error("email enqueue failed", enqueueError);
    } catch (e) {
      console.error("queue transport error", e);
    }
  }

  // 2) Gmail connector fallback.
  return await sendViaGmail(recipient, subject, html, from, ccRecipients);
}
