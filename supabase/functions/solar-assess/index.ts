// Solar assessment engine: basic recommendation (free) + full engineering report (credit-gated).
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

interface Appliance { name: string; qty: number; watts: number; hours: number; }

function computeLoad(appliances: Appliance[]) {
  const peak = appliances.reduce((s, a) => s + (Number(a.watts) || 0) * (Number(a.qty) || 1), 0);
  const daily_kwh = appliances.reduce((s, a) => s + ((Number(a.watts) || 0) * (Number(a.qty) || 1) * (Number(a.hours) || 0)) / 1000, 0);
  return { peak_load_w: Math.round(peak), daily_kwh: Math.round(daily_kwh * 100) / 100 };
}

function basicRecommend(peak_w: number, daily_kwh: number) {
  // Rule-of-thumb sizing
  const inverter_kva = Math.max(1, Math.ceil((peak_w * 1.25) / 1000));
  const battery_kwh = Math.max(2.4, Math.ceil(daily_kwh * 0.6 * 10) / 10);
  const panel_w = 450;
  const panel_count = Math.max(2, Math.ceil((daily_kwh * 1000) / (panel_w * 4.5))); // 4.5 peak sun hrs
  const backup_hours = Math.round((battery_kwh / Math.max(0.3, daily_kwh / 8)) * 10) / 10;
  return { inverter_kva, battery_kwh, panel_count, panel_w, backup_hours };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const mode: "basic" | "full" = body.mode || "basic";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth (optional for basic, required for full)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

    if (mode === "basic") {
      const { appliances = [], full_name, email, phone, location, building_type, occupants, current_power_situation, monthly_bill_ngn } = body;
      if (!full_name || !email || !Array.isArray(appliances) || appliances.length === 0) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { peak_load_w, daily_kwh } = computeLoad(appliances);
      const rec = basicRecommend(peak_load_w, daily_kwh);

      const { data: assessment, error } = await admin.from("solar_assessments").insert({
        user_id: userId,
        full_name, email, phone, location, building_type, occupants,
        appliances, daily_kwh, peak_load_w,
        current_power_situation, monthly_bill_ngn,
        recommendation: rec,
        status: "basic",
      }).select().single();
      if (error) {
        console.error("insert assessment", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Notify admin (fire-and-forget)
      try {
        await admin.functions.invoke("notify-new-lead", { body: { source: "solar_assessment", assessment_id: assessment.id, full_name, email, phone, location, summary: `${rec.inverter_kva}kVA / ${rec.battery_kwh}kWh / ${rec.panel_count}x${rec.panel_w}W` } });
      } catch (e) { console.error("notify error", e); }

      return new Response(JSON.stringify({ assessment_id: assessment.id, peak_load_w, daily_kwh, recommendation: rec }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // FULL mode — requires auth + credits
    if (!userId) {
      return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { assessment_id } = body;
    if (!assessment_id) return new Response(JSON.stringify({ error: "assessment_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: assessment, error: aerr } = await admin.from("solar_assessments").select("*").eq("id", assessment_id).single();
    if (aerr || !assessment) return new Response(JSON.stringify({ error: "Assessment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // If already unlocked, return existing full_report
    if (assessment.is_full_unlocked && assessment.full_report) {
      return new Response(JSON.stringify({ full_report: assessment.full_report, recommendation: assessment.recommendation }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Claim assessment to this user if guest
    if (!assessment.user_id) {
      await admin.from("solar_assessments").update({ user_id: userId }).eq("id", assessment_id);
    } else if (assessment.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check active paid AI subscription — bypasses credit usage
    const { data: subActive } = await admin.rpc("has_active_ai_subscription", { _user_id: userId });
    const hasSub = subActive === true;

    // Check & decrement credits (only if no active subscription)
    const { data: credits } = await admin.from("assessment_credits").select("*").eq("user_id", userId).maybeSingle();
    if (!credits) {
      await admin.from("assessment_credits").insert({ user_id: userId, total_credits: 3 });
    }
    const available = ((credits?.total_credits ?? 3) + (credits?.purchased_credits ?? 0)) - (credits?.used_credits ?? 0);
    if (!hasSub && available <= 0) {
      return new Response(JSON.stringify({ error: "subscription_required", message: "You've used all your free analyses. Subscribe to AI Starter (₦2,500/mo) for unlimited reports." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate full report via AI
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: packages } = await admin.from("solar_packages").select("name, slug, capacity_kva, battery_kwh, price_ngn, suitable_for").eq("is_active", true).order("price_ngn");
    const pkgList = (packages || []).map((p: any) => `- "${p.name}" (slug:${p.slug}) ${p.capacity_kva}kVA / ${p.battery_kwh}kWh — ₦${p.price_ngn}`).join("\n");

    const prompt = `You are a senior solar engineer for Tioga Technologies (Lagos, Nigeria). Produce a complete engineering specification.

Customer:
- Name: ${assessment.full_name}
- Location: ${assessment.location || "Nigeria"}
- Building: ${assessment.building_type || "residential"} (${assessment.occupants || "n/a"} occupants)
- Power situation: ${assessment.current_power_situation || "n/a"}
- Monthly bill: ₦${assessment.monthly_bill_ngn || "n/a"}

Computed load:
- Peak load: ${assessment.peak_load_w} W
- Daily energy: ${assessment.daily_kwh} kWh
- Appliances: ${JSON.stringify(assessment.appliances)}

Basic recommendation already shown: ${JSON.stringify(assessment.recommendation)}

Available Tioga packages:
${pkgList || "(propose custom build)"}

Return JSON ONLY in this schema:
{
  "load_analysis": { "total_connected_load_w": number, "peak_demand_w": number, "daily_kwh": number, "diversified_load_w": number },
  "solar_sizing": { "panel_count": number, "panel_wattage": number, "total_array_w": number, "arrangement": string, "required_roof_m2": number },
  "inverter_spec": { "size_kva": number, "type": string, "recommended_models": string[] },
  "battery_spec": { "capacity_kwh": number, "voltage_v": number, "chemistry": string, "backup_hours_estimate": number },
  "electrical_components": { "dc_cable_mm2": number, "ac_cable_mm2": number, "dc_breaker_a": number, "ac_breaker_a": number, "charge_controller": string, "earthing_notes": string, "protection_notes": string },
  "installation_notes": { "space_m2": number, "mounting": string, "site_requirements": string[] },
  "bill_of_materials": [ { "item": string, "qty": number, "notes": string } ],
  "recommended_package_slugs": string[],
  "engineer_summary": string
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-pro", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("ai gw error", res.status, t);
      const status = res.status === 429 ? 429 : res.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : status === 402 ? "AI credits exhausted" : "AI error" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await res.json();
    let full_report: any = {};
    try { full_report = JSON.parse(j.choices?.[0]?.message?.content || "{}"); } catch { full_report = {}; }

    // Generate share token
    const share_token = crypto.randomUUID().replace(/-/g, "");

    // Persist and decrement credit atomically
    await admin.from("solar_assessments").update({
      full_report,
      is_full_unlocked: true,
      status: "full",
      share_token,
    }).eq("id", assessment_id);

    if (!hasSub) {
      await admin.from("assessment_credits").update({
        used_credits: (credits?.used_credits ?? 0) + 1,
      }).eq("user_id", userId);
    }

    // Log usage (for user + admin history)
    await admin.from("ai_credit_usage").insert({
      user_id: userId,
      feature: "solar_assess",
      assessment_id,
      source: "solar-assessment",
      description: `${assessment.recommendation?.inverter_kva || "?"}kVA · ${assessment.recommendation?.battery_kwh || "?"}kWh report · ${assessment.location || "Nigeria"}`,
      used_free_credit: !hasSub,
      subscription_plan: hasSub ? "starter_or_business" : null,
    });

    return new Response(JSON.stringify({ full_report, share_token, credits_remaining: hasSub ? null : available - 1, subscription_active: hasSub }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("solar-assess error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
