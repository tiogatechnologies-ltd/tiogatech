// Notifies every admin account by email whenever a support ticket is opened.
import { sendMail } from "./mailer.ts";
import { brandedEmail } from "./email-layout.ts";

export async function adminEmails(admin: any): Promise<string[]> {
  const emails = new Set<string>();
  try {
    const { data: roles } = await admin.from("user_roles").select("user_id").eq("role", "admin");
    const ids = (roles || []).map((r: any) => r.user_id);
    if (ids.length) {
      const { data: profs } = await admin.from("profiles").select("email").in("id", ids);
      for (const p of profs || []) if (p?.email?.includes("@")) emails.add(String(p.email).toLowerCase());
    }
  } catch (e) {
    console.error("adminEmails lookup failed", e);
  }
  const inbox = Deno.env.get("SUPPORT_INBOX") || "support@tiogatechnologies.com";
  emails.add(inbox.toLowerCase());
  return [...emails];
}

export async function notifyAdminsOfTicket(admin: any, ticket: any, opts?: { reason?: string }) {
  const recipients = await adminEmails(admin);
  const reason = opts?.reason || "A customer has a message for us";
  await Promise.all(
    recipients.map((to) =>
      sendMail({
        to,
        subject: `New support ticket ${ticket.ticket_number} — ${reason}`,
        html: brandedEmail({
          title: `New support ticket ${ticket.ticket_number}`,
          intro: reason,
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
        label: "ticket-created-admin-alert",
        idempotencyKey: `ticket-admin-${ticket.id}-${to}`,
        critical: true,
      }).catch((e) => console.error("admin ticket alert failed", to, e)),
    ),
  );
}
