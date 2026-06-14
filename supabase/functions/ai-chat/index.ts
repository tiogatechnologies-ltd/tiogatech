// Site-wide AI chat assistant — simple JSON request/response with tool calling.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

const WHATSAPP = "2348178000023";
const KEY = Deno.env.get("LOVABLE_API_KEY")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const TOOL_SPECS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Search the active product catalog by free-text query and optional category.",
      parameters: { type: "object", properties: { query: { type: "string" }, category: { type: "string", enum: ["solar","smarthome","smart_locks","cctv"] }, limit: { type: "number" } }, required: ["query"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_finance_quote",
      description: "Compute flexible-payment estimate (deposit + monthly).",
      parameters: { type: "object", properties: { total_ngn: { type: "number" }, months: { type: "number", enum: [3, 6, 12] } }, required: ["total_ngn", "months"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "start_consultation",
      description: "Create a sales lead. Use only when the customer agrees to be contacted.",
      parameters: { type: "object", properties: { full_name: { type: "string" }, phone: { type: "string" }, email: { type: "string" }, location: { type: "string" }, interest: { type: "string" } }, required: ["full_name", "phone", "interest"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "handoff_to_whatsapp",
      description: "Return a WhatsApp link to chat with a human.",
      parameters: { type: "object", properties: { message: { type: "string" } } },
    },
  },
];

async function runTool(name: string, args: any) {
  if (name === "search_products") {
    let q = admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(Math.min(args.limit || 5, 8));
    if (args.category) q = q.eq("category", args.category);
    const { data } = await q.ilike("name", `%${args.query}%`);
    if (data && data.length) return { results: data };
    const { data: alt } = await admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(5).ilike("best_for", `%${args.query}%`);
    return { results: alt || [] };
  }
  if (name === "get_finance_quote") {
    const deposit = Math.round(args.total_ngn * 0.3);
    const financed = args.total_ngn - deposit;
    const rate: Record<number, number> = { 3: 0.233, 6: 0.117, 12: 0.058 };
    const monthly = Math.round((financed / args.months) * (1 + rate[args.months]));
    return { deposit, financed, months: args.months, monthly_payment: monthly, total_payable: deposit + monthly * args.months };
  }
  if (name === "start_consultation") {
    const { data, error } = await admin.from("leads").insert({
      full_name: args.full_name, phone: args.phone, email: args.email || null,
      location: args.location || "Nigeria", products: [args.interest], source: "ai_chat", status: "new", consent: true,
    }).select("id").maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, lead_id: data?.id, message: "Got it! Our team will reach out shortly." };
  }
  if (name === "handoff_to_whatsapp") {
    return { url: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(args.message || "Hi Tioga")}` };
  }
  return { error: "Unknown tool" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!KEY) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { messages } = await req.json();

    const [{ data: products }, { data: settings }] = await Promise.all([
      admin.from("products").select("name, category, price, best_for").eq("is_active", true).limit(40),
      admin.from("site_settings").select("value").eq("key", "general").maybeSingle(),
    ]);
    const contact: any = settings?.value || {};
    const productSummary = (products || []).slice(0, 30).map((p: any) => `- ${p.name} (${p.category}) — ${p.price || "Price on request"} — ${p.best_for}`).join("\n");

    const system = `You are Volt, Tioga Technologies' AI assistant (Nigeria, solar/smart home/security).
Style: warm, concise, Naira (NGN) only, no em dashes.
Use tools when helpful:
- search_products for catalog questions
- get_finance_quote for plan estimates (30% deposit + 3/6/12 monthly)
- start_consultation to capture a lead
- handoff_to_whatsapp to connect to a human

Contact: WhatsApp ${contact.whatsapp || "+234 817 800 0023"} · email ${contact.email || "sales@tiogatechnologies.com"}.

Top products:
${productSummary}

Keep answers to 1-3 short paragraphs unless asked for more.`;

    // Convert UIMessage parts to OpenAI message format
    const openaiMessages: any[] = [{ role: "system", content: system }];
    for (const m of messages) {
      const text = (m.parts || []).map((p: any) => (p.type === "text" ? p.text : "")).join("");
      if (text) openaiMessages.push({ role: m.role, content: text });
    }

    // Agentic loop: up to 4 tool rounds
    const toolEvents: any[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: openaiMessages, tools: TOOL_SPECS, tool_choice: "auto" }),
      });
      if (!r.ok) {
        const txt = await r.text();
        const status = r.status === 429 ? 429 : r.status === 402 ? 402 : 500;
        const msg = status === 429 ? "Rate limited, please try again in a moment." : status === 402 ? "AI credits exhausted. Please add credits in workspace settings." : "AI error";
        console.error("ai-chat gateway", r.status, txt);
        return new Response(JSON.stringify({ error: msg, text: msg, tool_events: [] }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      const msg = j.choices?.[0]?.message;
      if (!msg) break;
      openaiMessages.push(msg);
      const calls = msg.tool_calls || [];
      if (!calls.length) {
        return new Response(JSON.stringify({ text: msg.content || "", tool_events: toolEvents }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      for (const c of calls) {
        const args = JSON.parse(c.function.arguments || "{}");
        const result = await runTool(c.function.name, args);
        toolEvents.push({ name: c.function.name, args, result });
        openaiMessages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
      }
    }
    return new Response(JSON.stringify({ text: "Sorry, I got stuck. Try rephrasing?", tool_events: toolEvents }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
