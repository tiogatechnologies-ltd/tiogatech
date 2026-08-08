// Shared outbound mailer.
//
// Delivery order:
//   1. Lovable managed email API (only works once a sender domain is verified)
//   2. Gmail connector gateway (works today via the GOOGLE_MAIL_API_KEY connector)
//
// Every caller gets a best-effort send with a clear result so guest-facing
// emails (order confirmations, newsletter confirmations) are not silently lost.

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

export type MailResult = { ok: boolean; via?: "lovable" | "gmail"; error?: string };

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildRaw(to: string, subject: string, html: string, fromName: string) {
  const headers = [
    `From: ${fromName}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ].join("\r\n");
  return b64url(`${headers}\r\n\r\n${html}`);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<MailResult> {
  const { to, subject, html } = opts;
  const text = opts.text ?? subject;
  const fromName = opts.fromName ?? "Tioga Technologies";
  const fromEmail = opts.fromEmail ?? "orders@tiogatechnologies.com";

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

  if (!to || !to.includes("@")) return { ok: false, error: "invalid recipient" };

  // 1) Gmail connector (primary working transport)
  if (LOVABLE_API_KEY && GMAIL_KEY) {
    try {
      const res = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GMAIL_KEY,
        },
        body: JSON.stringify({ raw: buildRaw(to, subject, html, fromName) }),
      });
      if (res.ok) return { ok: true, via: "gmail" };
      console.error("gmail send failed", res.status, (await res.text()).slice(0, 300));
    } catch (e) {
      console.error("gmail error", e);
    }
  }

  // 2) Managed email API fallback
  if (LOVABLE_API_KEY) {
    try {
      const res = await fetch("https://api.lovable.dev/v1/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ to, subject, html, text, from: `${fromName} <${fromEmail}>` }),
      });
      if (res.ok) return { ok: true, via: "lovable" };
      const t = (await res.text()).slice(0, 300);
      console.error("lovable email send failed", res.status, t);
      return { ok: false, error: `lovable ${res.status}: ${t}` };
    } catch (e) {
      console.error("lovable email error", e);
      return { ok: false, error: String(e) };
    }
  }

  return { ok: false, error: "no email transport configured" };
}
