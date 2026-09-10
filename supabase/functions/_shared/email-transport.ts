// Outbound email transport.
//
// The queue processor originally sent only through Lovable's API using
// LOVABLE_API_KEY. When that key is absent - as it is once a project leaves the
// Lovable platform - every queued message fails, so order confirmations,
// support acknowledgements, finance reminders and auth emails all silently
// stop. The transport is now chosen from whichever key is configured.
//
// Set ONE of these as a Supabase Edge Function secret:
//   RESEND_API_KEY  - recommended. Verify your sending domain at resend.com.
//   LOVABLE_API_KEY - the original transport; still works if you have a key.
import { sendLovableEmail } from 'npm:@lovable.dev/email-js'

export interface OutboundEmail {
  run_id?: string
  to: string
  cc?: string[]
  from: string
  sender_domain?: string
  subject: string
  html: string
  text?: string
  purpose?: string
  label?: string
  idempotency_key?: string
  unsubscribe_token?: string
  message_id?: string
}

export type TransportName = 'resend' | 'lovable'

export function activeTransport(): TransportName | null {
  if (Deno.env.get('RESEND_API_KEY')) return 'resend'
  if (Deno.env.get('LOVABLE_API_KEY')) return 'lovable'
  return null
}

async function sendViaResend(msg: OutboundEmail): Promise<void> {
  const key = Deno.env.get('RESEND_API_KEY')!
  const body: Record<string, unknown> = {
    from: msg.from,
    to: [msg.to],
    subject: msg.subject,
    html: msg.html,
  }
  if (msg.cc?.length) body.cc = msg.cc
  if (msg.text) body.text = msg.text
  // Lets recipients opt out from their mail client, which materially helps
  // deliverability and is required by bulk-sender rules at Gmail and Yahoo.
  if (msg.unsubscribe_token) {
    body.headers = {
      'List-Unsubscribe': `<https://tiogatechnologies.com/unsubscribe?token=${msg.unsubscribe_token}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      // Resend dedupes on this, so a retry cannot send the same mail twice.
      ...(msg.idempotency_key ? { 'Idempotency-Key': msg.idempotency_key } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    // Preserve the status so the caller's 429 back-off logic still applies.
    const err = new Error(`resend ${res.status}: ${detail}`) as Error & { status?: number }
    err.status = res.status
    throw err
  }
}

/** Sends through whichever transport is configured. Throws when none is. */
export async function sendOutboundEmail(msg: OutboundEmail): Promise<TransportName> {
  const transport = activeTransport()
  if (!transport) {
    throw new Error(
      'No email transport configured. Set RESEND_API_KEY (or LOVABLE_API_KEY) in Supabase Edge Function secrets.',
    )
  }

  if (transport === 'resend') {
    await sendViaResend(msg)
    return 'resend'
  }

  await sendLovableEmail(msg as never, {
    apiKey: Deno.env.get('LOVABLE_API_KEY')!,
    sendUrl: Deno.env.get('LOVABLE_SEND_URL'),
  })
  return 'lovable'
}
