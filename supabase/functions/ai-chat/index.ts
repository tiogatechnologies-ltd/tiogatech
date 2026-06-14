// Site-wide AI chat assistant for Tioga Technologies — streaming via Lovable AI Gateway + AI SDK.
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "npm:ai@5.0.30";
import { z } from "npm:zod@3.23.8";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { createLovableAiGatewayProvider, corsHeaders } from "../_shared/ai-gateway.ts";

const WHATSAPP = "2348178000023";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { messages }: { messages: UIMessage[] } = await req.json();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: products }, { data: settings }] = await Promise.all([
      admin.from("products").select("name, category, series, price, best_for, tags").eq("is_active", true).limit(80),
      admin.from("site_settings").select("key, value").eq("key", "general").maybeSingle(),
    ]);

    const productSummary = (products || []).slice(0, 40).map((p: any) => `• ${p.name} (${p.category}${p.series ? `/${p.series}` : ""}) — ${p.price || "Price on request"} — ${p.best_for}`).join("\n");
    const contact = (settings?.value as any) || {};

    const system = `You are Volt, the helpful AI assistant for Tioga Technologies — a Nigerian company selling solar power, smart home, and security solutions.

Tone: warm, concise, professional. Use Naira (NGN) for prices. Never invent prices. Avoid em dashes.

What you can do:
- Recommend products from the catalog (use search_products).
- Estimate Flexible Payment plans (use get_finance_quote): 30% deposit, then 3, 6 or 12 month plans.
- Capture a lead so the team follows up (use start_consultation).
- Hand off to WhatsApp when the customer wants to chat with a human (use handoff_to_whatsapp).

Contact info:
- Phone/WhatsApp: ${contact.whatsapp || "+234 817 800 0023"}
- Email: ${contact.email || "sales@tiogatechnologies.com"}
- Address: ${contact.address || "Lagos, Nigeria"}

Top products (truncated):
${productSummary}

Always answer in 1 to 3 short paragraphs unless the user asks for more detail. When a tool helps, use it instead of guessing.`;

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-2.5-flash");

    const result = streamText({
      model,
      system,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(8),
      tools: {
        search_products: tool({
          description: "Search the active product catalog by free text query and optional category.",
          inputSchema: z.object({
            query: z.string(),
            category: z.enum(["solar", "smarthome", "smart_locks", "cctv"]).optional(),
            limit: z.number().int().min(1).max(8).default(5),
          }),
          execute: async ({ query, category, limit }) => {
            let q = admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(limit);
            if (category) q = q.eq("category", category);
            const { data } = await q.ilike("name", `%${query}%`);
            if (data && data.length > 0) return { results: data };
            const { data: alt } = await admin.from("products").select("name, category, series, price, best_for").eq("is_active", true).limit(limit).ilike("best_for", `%${query}%`);
            return { results: alt || [] };
          },
        }),
        get_finance_quote: tool({
          description: "Compute a flexible-payment plan estimate. Returns deposit + monthly payment for 3/6/12 month options.",
          inputSchema: z.object({ total_ngn: z.number().positive(), months: z.union([z.literal(3), z.literal(6), z.literal(12)]) }),
          execute: ({ total_ngn, months }) => {
            const deposit = Math.round(total_ngn * 0.3);
            const financed = total_ngn - deposit;
            const rateMap = { 3: 0.233, 6: 0.117, 12: 0.058 } as const;
            const monthly = Math.round((financed / months) * (1 + rateMap[months]));
            return { deposit, financed, months, monthly_payment: monthly, total_payable: deposit + monthly * months };
          },
        }),
        start_consultation: tool({
          description: "Capture a lead so the Tioga team follows up. Use when the customer agrees to be contacted.",
          inputSchema: z.object({
            full_name: z.string().min(2),
            phone: z.string().min(7),
            email: z.string().email().optional(),
            location: z.string().default("Nigeria"),
            interest: z.string().describe("Short summary of what they want"),
          }),
          execute: async ({ full_name, phone, email, location, interest }) => {
            const { data, error } = await admin.from("leads").insert({
              full_name, phone, email: email || null, location,
              products: [interest], source: "ai_chat", status: "new", consent: true,
            }).select("id").maybeSingle();
            if (error) return { ok: false, error: error.message };
            return { ok: true, lead_id: data?.id, message: "We've got it. The team will reach out shortly." };
          },
        }),
        handoff_to_whatsapp: tool({
          description: "Return a WhatsApp link with a pre-filled message for the customer to chat with a human.",
          inputSchema: z.object({ message: z.string().default("Hi Tioga, I'd like to talk to someone.") }),
          execute: ({ message }) => ({ url: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}` }),
        }),
      },
    });

    return result.toUIMessageStreamResponse({ headers: corsHeaders });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
