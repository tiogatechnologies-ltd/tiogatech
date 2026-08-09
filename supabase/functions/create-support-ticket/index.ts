// Channel-agnostic ticket creation endpoint.
// Any channel (web widget, WhatsApp webhook, etc.) can POST here.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";
import { sendMail } from "../_shared/mailer.ts";
import { brandedEmail } from "../_shared/email-layout.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const SUPPORT_INBOX = Deno.env.get("SUPPORT_INBOX") || "support@tiogatechnologies.com";

async function notifyByEmail(ticket: any) {
  // 1) Internal alert to the support inbox
  try {
    await sendMail({
      to: SUPPORT_INBOX,
      subject: `New support ticket ${ticket.ticket_number}`,
      html: brandedEmail({
        title: `New support ticket ${ticket.ticket_number}`,
        rows: [
          ["From", ticket.user_name],
          ["Contact", ticket.user_contact],
          ["Channel", ticket.channel],
          ["Subject", ticket.subject],
        ],
        paragraphs: [ticket.message],
        ctaLabel: "Open in admin",
        ctaUrl: "https://tiogatechnologies.com/admin/tickets",
      }),
      text: `New ticket ${ticket.ticket_number} from ${ticket.user_name} (${ticket.user_contact}): ${ticket.message}`,
      sender: "support",
      label: "ticket-created-internal",
      idempotencyKey: `ticket-internal-${ticket.id}`,
      critical: true,
    });
  } catch (e) {
    console.error("support inbox notify failed", e);
  }

  // 2) Acknowledgement to the customer when we have an email address
  const contact = String(ticket.user_contact || "");
  if (contact.includes("@")) {
    try {
      await sendMail({
        to: contact,
        subject: `We received your request — ${ticket.ticket_number}`,
        html: brandedEmail({
          title: `Ticket ${ticket.ticket_number} received`,
          intro: `Hi ${String(ticket.user_name || "there").split(" ")[0]},`,
          paragraphs: [
            "Thanks for reaching out. Our support team has your request and will get back to you shortly.",
            ticket.message,
          ],
          rows: [["Reference", ticket.ticket_number]],
          ctaLabel: "Visit support",
          ctaUrl: "https://tiogatechnologies.com/support",
        }),
        text: `We received your request. Reference: ${ticket.ticket_number}`,
        sender: "support",
        label: "ticket-created-ack",
        idempotencyKey: `ticket-ack-${ticket.id}`,
        critical: true,
      });
    } catch (e) {
      console.error("ticket ack failed", e);
    }
  }
}

async function notify(ticket: any) {
  // Configurable notification hook. Set SUPPORT_NOTIFY_WEBHOOK to a Slack/Discord/
  // generic webhook URL to enable posting. Email can be wired later via send-gmail.
  const webhook = Deno.env.get("SUPPORT_NOTIFY_WEBHOOK");
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🎫 New support ticket ${ticket.ticket_number}\n*From:* ${ticket.user_name} (${ticket.user_contact})\n*Channel:* ${ticket.channel}\n*Message:* ${ticket.message}`,
        ticket,
      }),
    });
  } catch (e) {
    console.error("notify webhook failed", e);
  }
}

export async function createSupportTicket(input: {
  userId?: string | null;
  userName: string;
  userContact: string;
  subject?: string;
  message: string;
  conversationContext?: string;
  channel?: string;
}) {
  const row = {
    user_id: input.userId || null,
    user_name: (input.userName || "Anonymous").slice(0, 200),
    user_contact: (input.userContact || "not provided").slice(0, 200),
    subject: (input.subject || input.message.slice(0, 80)).slice(0, 200),
    message: input.message.slice(0, 10000),
    conversation_context: (input.conversationContext || "").slice(0, 10000) || null,
    channel: input.channel || "web",
    status: "open",
  };
  const { data, error } = await admin.from("support_tickets").insert(row).select("*").single();
  if (error) throw error;
  notify(data).catch(() => {});
  notifyByEmail(data).catch(() => {});
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const ticket = await createSupportTicket({
      userId: body.userId,
      userName: body.userName || body.user_name,
      userContact: body.userContact || body.user_contact,
      subject: body.subject,
      message: body.message,
      conversationContext: body.conversationContext || body.conversation_context,
      channel: body.channel,
    });
    return new Response(JSON.stringify({ ok: true, ticket }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("create-support-ticket error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
