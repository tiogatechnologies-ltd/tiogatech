// AI solar sizing: free-text description -> recommended system + matching package.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { description, budget_ngn } = await req.json();
    if (!description || typeof description !== "string") {
      return new Response(JSON.stringify({ error: "description is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: packages } = await admin.from("solar_packages").select("name, slug, capacity_kva, battery_kwh, price_ngn, suitable_for").eq("is_active", true).order("price_ngn");

    const list = (packages || []).map((p: any) => `- "${p.name}" (slug:${p.slug}) ${p.capacity_kva}kVA / ${p.battery_kwh}kWh — ₦${p.price_ngn} — ${p.suitable_for || ""}`).join("\n");

    const prompt = `You are a senior solar engineer for Tioga Technologies (Nigeria). Given a customer's description of their home and usage, estimate the right system and pick the best matching package.

Customer description: "${description}"
Budget (NGN, optional): ${budget_ngn || "not specified"}

Available packages:
${list || "(none configured yet — propose a custom build)"}

Return JSON ONLY in this schema:
{
  "estimated_daily_kwh": number,
  "recommended_inverter_kva": number,
  "recommended_battery_kwh": number,
  "recommended_panel_count_400w": number,
  "matching_package_slug": string | null,
  "rationale": string,
  "confidence": "low" | "medium" | "high"
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
      const msg = status === 429 ? "Rate limited" : status === 402 ? "AI credits exhausted" : "AI error";
      console.error("ai-solar-size gw error", res.status, t);
      return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { rationale: content }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-solar-size error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
