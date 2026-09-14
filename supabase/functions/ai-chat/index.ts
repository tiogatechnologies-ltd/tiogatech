// Site-wide AI chat assistant — simple JSON request/response with tool calling. v2
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders, resolveAiGateway, aiChatCompletion } from "../_shared/ai-gateway.ts";
import { notifyAdminsOfTicket } from "../_shared/support-notify.ts";

const WHATSAPP = "2348178000023";
const GATEWAY = resolveAiGateway();
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const TOOL_SPECS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search the active product catalog by free-text query and optional category.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string", enum: ["solar", "smarthome", "smart_locks", "cctv"] },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_finance_quote",
      description: "Compute flexible-payment estimate (deposit + monthly).",
      parameters: {
        type: "object",
        properties: {
          total_ngn: { type: "number" },
          months: { type: "number", enum: [3, 6, 12, 24] },
        },
        required: ["total_ngn", "months"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "start_consultation",
      description: "Create a sales lead when a customer wants a callback, quote, or site inspection.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          location: { type: "string" },
          interest: { type: "string" },
        },
        required: ["full_name", "phone", "interest"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_support_ticket",
      description: "Open a formal support ticket when a customer has an issue, complaint, or explicit request for human support. Requires customer name and contact info (phone or email).",
      parameters: {
        type: "object",
        properties: {
          user_name: { type: "string", description: "Customer's name" },
          user_contact: { type: "string", description: "Customer's phone number or email address" },
          subject: { type: "string", description: "Brief issue summary" },
          message: { type: "string", description: "Detailed description of the issue or complaint" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_support_ticket",
      description: "Check the status and details of an existing support ticket by ticket number (e.g. TKT-1006).",
      parameters: {
        type: "object",
        properties: {
          ticket_number: { type: "string", description: "Ticket reference number (e.g. TKT-1006)" },
        },
        required: ["ticket_number"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "close_support_ticket",
      description: "Close or mark an existing support ticket as resolved when the user asks to end/close/cancel the ticket or confirms their issue has been resolved.",
      parameters: {
        type: "object",
        properties: {
          ticket_number: { type: "string", description: "Ticket reference number (e.g. TKT-1006)" },
          reason: { type: "string", description: "Reason for closing the ticket" },
        },
        required: ["ticket_number"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "handoff_to_whatsapp",
      description: "Return a WhatsApp link to chat with a human team member directly.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
];

interface SessionUserInfo {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  openTickets?: Array<{ ticket_number: string; status: string; subject: string; created_at: string }>;
}

async function runTool(name: string, args: any, userInfo: SessionUserInfo, conversationContext: string) {
  if (name === "search_products") {
    let q = admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(Math.min(args.limit || 5, 8));
    if (args.category) q = q.eq("category", args.category);
    const { data } = await q.ilike("name", `%${args.query}%`);
    if (data && data.length) return { results: data };
    const { data: alt } = await admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(5).ilike("best_for", `%${args.query}%`);
    return { results: alt || [] };
  }

  if (name === "get_finance_quote") {
    const total = Number(args.total_ngn || 0);
    const deposit = Math.round(total * 0.3);
    const financed = total - deposit;
    const rate = total <= 5_000_000 ? 0.09 : total <= 7_500_000 ? 0.15 : 0.25;
    const monthly = Math.round((financed + financed * rate + financed * 0.02 + financed * 0.01) / args.months);
    return { deposit, financed, months: args.months, monthly_payment: monthly, total_payable: deposit + monthly * args.months };
  }

  if (name === "start_consultation") {
    const { data, error } = await admin.from("leads").insert({
      full_name: args.full_name,
      phone: args.phone,
      email: args.email || null,
      location: args.location || "Nigeria",
      products: [args.interest],
      source: "ai_chat",
      status: "new",
      consent: true,
    }).select("id").maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, lead_id: data?.id, message: "Got it! Our team will reach out shortly." };
  }

  if (name === "create_support_ticket") {
    let userName = (args.user_name || userInfo.name || "").trim();
    let userContact = (args.user_contact || userInfo.phone || userInfo.email || "").trim();
    const userId = userInfo.id || null;

    if (!userContact || userContact.toLowerCase() === "not provided") {
      return {
        ok: false,
        needs_contact_info: true,
        message: "Contact info missing. Please ask the user for their name and an email address or phone number so our team can follow up with them.",
      };
    }

    const row = {
      user_id: userId,
      user_name: (userName || "Customer").slice(0, 200),
      user_contact: userContact.slice(0, 200),
      subject: (args.subject || args.message.slice(0, 80)).slice(0, 200),
      message: args.message.slice(0, 10000),
      conversation_context: conversationContext ? conversationContext.slice(0, 10000) : null,
      channel: "web",
      status: "open",
    };

    const { data: ticket, error } = await admin.from("support_tickets").insert(row).select("*").single();
    if (error) return { ok: false, error: error.message };

    notifyAdminsOfTicket(admin, ticket, { reason: "A customer requested support via Volt AI chat" }).catch(console.error);

    return {
      ok: true,
      ticket_number: ticket.ticket_number,
      status: ticket.status,
      message: `Support ticket ${ticket.ticket_number} created successfully.`,
    };
  }

  if (name === "check_support_ticket") {
    const rawNum = String(args.ticket_number || "").toUpperCase().trim();
    const num = rawNum.startsWith("TKT-") ? rawNum : `TKT-${rawNum}`;
    const { data: ticket, error } = await admin
      .from("support_tickets")
      .select("ticket_number, status, subject, message, created_at, resolved_at, priority")
      .eq("ticket_number", num)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!ticket) return { ok: false, error: `Ticket ${num} was not found. Please double-check the ticket reference.` };

    return {
      ok: true,
      ticket_number: ticket.ticket_number,
      status: ticket.status,
      subject: ticket.subject,
      created_at: ticket.created_at,
      resolved_at: ticket.resolved_at,
      priority: ticket.priority,
    };
  }

  if (name === "close_support_ticket") {
    const rawNum = String(args.ticket_number || "").toUpperCase().trim();
    const num = rawNum.startsWith("TKT-") ? rawNum : `TKT-${rawNum}`;
    const { data: existing, error: findErr } = await admin
      .from("support_tickets")
      .select("id, ticket_number, status")
      .eq("ticket_number", num)
      .maybeSingle();

    if (findErr) return { ok: false, error: findErr.message };
    if (!existing) return { ok: false, error: `Ticket ${num} was not found. Please verify the ticket reference.` };

    if (existing.status === "closed" || existing.status === "resolved") {
      return {
        ok: true,
        ticket_number: existing.ticket_number,
        status: existing.status,
        message: `Ticket ${existing.ticket_number} is already marked as ${existing.status}.`,
      };
    }

    const { error: updErr } = await admin
      .from("support_tickets")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updErr) return { ok: false, error: updErr.message };

    return {
      ok: true,
      ticket_number: existing.ticket_number,
      status: "resolved",
      message: `Support ticket ${existing.ticket_number} has been marked as resolved and closed.`,
    };
  }

  if (name === "handoff_to_whatsapp") {
    return { url: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(args.message || "Hi Tioga")}` };
  }

  return { error: "Unknown tool" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!GATEWAY) {
      return new Response(
        JSON.stringify({
          error: "AI is not configured. Set OPENROUTER_API_KEY (or OPENAI_API_KEY) in Supabase Edge Function secrets.",
          text: "The assistant is temporarily unavailable. Please use WhatsApp or the contact form and we will get right back to you.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, user } = await req.json();

    // Identify user profile & any open tickets if authenticated
    const userInfo: SessionUserInfo = {
      id: user?.id || null,
      email: user?.email || null,
      name: null,
      phone: null,
      openTickets: [],
    };

    if (user?.id) {
      const [{ data: prof }, { data: tickets }] = await Promise.all([
        admin.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
        admin
          .from("support_tickets")
          .select("ticket_number, status, subject, created_at")
          .eq("user_id", user.id)
          .in("status", ["open", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      if (prof) {
        userInfo.name = prof.full_name || null;
        userInfo.phone = prof.phone || null;
        userInfo.email = prof.email || userInfo.email;
      }
      userInfo.openTickets = tickets || [];
    }

    const [{ data: products }, { data: settings }] = await Promise.all([
      admin.from("products").select("name, category, price, best_for").eq("is_active", true).limit(35),
      admin.from("site_settings").select("value").eq("key", "general").maybeSingle(),
    ]);

    const contact: any = settings?.value || {};
    const productSummary = (products || [])
      .slice(0, 25)
      .map((p: any) => `- ${p.name} (${p.category}) — ${p.price || "Price on request"} — ${p.best_for || ""}`)
      .join("\n");

    const contextText = messages
      .slice(-8)
      .map((m: any) => `${m.role}: ${(m.parts || []).map((p: any) => (p.type === "text" ? p.text : "")).join("")}`)
      .join("\n");

    const openTicketsSummary = userInfo.openTickets?.length
      ? userInfo.openTickets.map((t) => `${t.ticket_number} (Status: ${t.status}, Subject: ${t.subject})`).join("; ")
      : "None";

    const system = `You are Volt, Tioga Technologies' AI assistant (Nigeria, solar/smart home/security).
Style: warm, friendly, concise, Naira (NGN) only, no em dashes.

User context:
- Signed in: ${userInfo.id ? `Yes (Name: ${userInfo.name || "Customer"}, Email: ${userInfo.email || "unknown"}, Phone: ${userInfo.phone || "unknown"})` : "No (anonymous website visitor)"}
- User's currently open tickets: ${openTicketsSummary}

Available tools:
- search_products: search catalog for pricing, specs, recommendations.
- get_finance_quote: compute monthly installment estimates (30% deposit + 3/6/12/24 months).
- start_consultation: capture a sales lead for site audits or calls.
- create_support_ticket: create a formal support ticket. MUST have customer name and contact (email or phone). If anonymous and contact is missing, politely ask the user for their name and email/phone first.
- check_support_ticket: check status of a ticket by ticket number (e.g. TKT-1006).
- close_support_ticket: close or mark a ticket as resolved.
- handoff_to_whatsapp: connect customer to a live human on WhatsApp.

CRITICAL RULES FOR TICKETS:
1. ENDING / CLOSING TICKETS: When the user says "end the ticket", "close ticket", "cancel ticket", or confirms their problem is resolved:
   - If a ticket number was mentioned in this chat OR if the user has an active open ticket listed above (e.g. ${userInfo.openTickets?.[0]?.ticket_number || "none"}), call close_support_ticket with that ticket number.
   - If no ticket number is known, ask the user: "Could you please provide your ticket number (e.g. TKT-1006) so I can close it for you?"
   - DO NOT EVER create a new ticket when the user wants to end or close a ticket!
2. CHECKING TICKETS: When the user asks "what is the status of ticket...", call check_support_ticket with the ticket number.
3. CREATING TICKETS: Open a support ticket ONLY when the customer explicitly asks for human support, wants a ticket opened, or has an unresolved technical complaint. If they are anonymous, ask for their contact details before opening.
4. TALKING TO A HUMAN: When the user asks for a live agent or human, offer WhatsApp handoff (${contact.whatsapp || "+234 817 800 0023"}) or offer to create a support ticket.

Contact info: WhatsApp ${contact.whatsapp || "+234 817 800 0023"} · Email ${contact.email || "sales@tiogatechnologies.com"}.

Catalog preview:
${productSummary}

Keep responses to 1-3 short paragraphs.`;

    // Convert UIMessage parts to OpenAI message format
    const openaiMessages: any[] = [{ role: "system", content: system }];
    for (const m of messages) {
      const text = (m.parts || []).map((p: any) => (p.type === "text" ? p.text : "")).join("");
      if (text) openaiMessages.push({ role: m.role, content: text });
    }

    // Agentic loop: up to 4 tool rounds
    const toolEvents: any[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await aiChatCompletion(GATEWAY, { messages: openaiMessages, tools: TOOL_SPECS, tool_choice: "auto" });
      if (!r.ok) {
        const txt = await r.text();
        const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
        const msg = status === 429 ? "Rate limited, please try again in a moment." : status === 402 ? "AI credits exhausted. Top up your AI provider account." : "AI error";
        console.error("ai-chat gateway", r.status, txt);
        return new Response(JSON.stringify({ error: msg, text: msg, tool_events: [] }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const j = await r.json();
      const msg = j.choices?.[0]?.message;
      if (!msg) break;
      openaiMessages.push(msg);

      const calls = msg.tool_calls || [];
      if (!calls.length) {
        const answer = msg.content || "";
        return new Response(JSON.stringify({ text: answer, tool_events: toolEvents }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const c of calls) {
        const args = JSON.parse(c.function.arguments || "{}");
        const result = await runTool(c.function.name, args, userInfo, contextText);
        toolEvents.push({ name: c.function.name, args, result });
        openaiMessages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }

    return new Response(JSON.stringify({ text: "Is there anything else I can help you with?", tool_events: toolEvents }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
