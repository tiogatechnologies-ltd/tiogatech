// Admin AI Copilot — runs tasks against project data on behalf of admin users.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

const KEY = Deno.env.get("LOVABLE_API_KEY");

async function callAi(prompt: string, json = false) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`gateway ${r.status} ${t}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!KEY) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const isAdmin = (roles || []).some((r: any) => r.role === "admin" || r.role === "staff");
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { task, params = {} } = await req.json();

    if (task === "summarize_lead") {
      const { data: lead } = await admin.from("leads").select("*").eq("id", params.lead_id).maybeSingle();
      if (!lead) return new Response(JSON.stringify({ error: "Lead not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await callAi(`Summarize this sales lead for the admin team in 4 short bullets. Then propose the next best action. Lead:\n${JSON.stringify(lead, null, 2)}`);
      return new Response(JSON.stringify({ result: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (task === "draft_email") {
      const { data: lead } = await admin.from("leads").select("*").eq("id", params.lead_id).maybeSingle();
      const text = await callAi(`Draft a warm, concise follow-up email (subject + body) for this lead. Intent: ${params.intent || "follow up and offer a free consultation"}. Use Naira pricing. Sign off as 'The Tioga Team'.\n\nLead:\n${JSON.stringify(lead, null, 2)}`);
      return new Response(JSON.stringify({ result: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (task === "analyze_period") {
      const days = Math.min(Math.max(parseInt(params.days || 30), 1), 365);
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const [{ count: leads }, { count: orders }, { data: revenue }] = await Promise.all([
        admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
        admin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since),
        admin.from("orders").select("total").eq("payment_status", "paid").gte("created_at", since),
      ]);
      const totalRev = (revenue || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
      const text = await callAi(`Analyze this period (${days} days). Leads: ${leads}. Orders: ${orders}. Paid revenue (NGN): ${totalRev}. Write 5 bullet insights and 3 recommended actions.`);
      return new Response(JSON.stringify({ result: text, stats: { leads, orders, revenue_ngn: totalRev, days } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (task === "generate_blog") {
      const text = await callAi(`Write a 600-word SEO blog post for Tioga Technologies (Nigeria) on the topic: "${params.topic}". Keywords: ${(params.keywords || []).join(", ")}. Use H2/H3, short paragraphs, friendly authoritative tone. Output markdown with frontmatter: title, slug, excerpt.`);
      return new Response(JSON.stringify({ result: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (task === "write_product_description") {
      const { data: p } = await admin.from("products").select("*").eq("id", params.product_id).maybeSingle();
      if (!p) return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const text = await callAi(`Write a 90-word marketing description for this product. Include 4 bullet features. Plain text.\n\nProduct: ${JSON.stringify(p, null, 2)}`);
      return new Response(JSON.stringify({ result: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown task" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("copilot error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
