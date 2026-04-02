import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { category, appliances, totalWatts, budget, systemType, propertyType, usageDuration, formContext } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt = "";
    const effectiveCategory = category || formContext?.category || "solar";

    if (effectiveCategory === "solar") {
      prompt = `You are a solar energy expert for Tioga Technologies in Nigeria. Based on the customer's needs, recommend the best solar package.

Customer details:
- Appliances: ${JSON.stringify(appliances || [])}
- Estimated total watts: ${totalWatts || 0}W
- Budget: ${budget || "Not specified"}
- System preference: ${systemType || formContext?.systemType || "Not specified"}
- Property type: ${propertyType || formContext?.propertyType || "Not specified"}  
- Usage hours: ${usageDuration || formContext?.usageDuration || "Not specified"}

Available packages (with prices in Naira):
LITHIUM BATTERY PACKAGES:
1. 3.5KVA - ₦4,024,000 (3500W, 5kWh battery)
2. 5KVA - ₦5,349,300 (5000W, 7.2kWh battery)
3. 7.5KVA - ₦7,339,200 (7500W, 10kWh battery)
4. 10KVA - ₦10,828,800 (10000W, 15kWh battery)
5. 10KVA 3-Phase - ₦12,185,800 (10000W, 17kWh)
6. 10KVA 3-Phase 20kWh - ₦13,052,600
7. 20KVA - ₦20,808,000 (20000W, 30kWh)
8. 30KVA - ₦40,508,800 (30000W, 70kWh)

GEL BATTERY PACKAGES:
9. 1KVA - ₦1,125,200 (1000W)
10. 1.5KVA - ₦1,519,500 (1500W)
11. 2.5KVA - ₦2,216,000 (2500W)
12. 5KVA Gel - ₦4,775,940 (5000W)
13. 7.5KVA Gel - ₦7,253,000 (7500W)
14. 10KVA Gel - ₦11,284,000 (10000W)`;
    } else if (effectiveCategory === "automation") {
      const ctx = formContext || {};
      prompt = `You are a smart home automation expert for Tioga Technologies in Nigeria. Recommend the best automation products.

Customer details:
- What they want to automate: ${JSON.stringify(ctx.automateWhat || [])}
- Control preference: ${ctx.controlPreference || "Not specified"}
- Property type: ${ctx.propertyType || "Not specified"}
- Scale: ${ctx.automationScale || "Not specified"}
- Budget: ${budget || "Not specified"}

Available products:
1. 8 Gang WiFi Smart Switch - Multi-circuit remote control
2. 1 Gang WiFi Smart Switch - Single switch with timer
3. Granite Display Smart Switch - Premium touch display with scene control and energy monitoring`;
    } else if (effectiveCategory === "security") {
      const ctx = formContext || {};
      prompt = `You are a security systems expert for Tioga Technologies in Nigeria. Recommend the best security products.

Customer details:
- Security needs: ${JSON.stringify(ctx.securityNeeds || [])}
- Property type: ${ctx.propertyType || "Not specified"}
- Access type preferences: ${JSON.stringify(ctx.accessType || [])}
- CCTV coverage needed: ${JSON.stringify(ctx.cctvCoverage || [])}
- Budget: ${budget || "Not specified"}

Available Smart Lock Products:
ELITE SERIES (Premium):
1. Model K209 - Facial recognition, palm-vein, video intercom
2. Model S7 - Israeli edition, IP66 waterproof, facial recognition

APEX SERIES (Mid-tier):
3. Model D20 - Facial recognition, WiFi app control
4. Model H11 - Facial recognition, video intercom
5. Model C11 - Facial recognition, integrated doorbell

PRO SERIES (Affordable):
6. SL02 - Slim profile, built-in camera, staff attendance
7. TF5 - Remote access, BLE app control
8. N22 - WiFi control, 100 fingerprints
9. N14 - Business-friendly, time attendance

BASE SERIES (Entry):
10. V80 - Compact, mobile app control
11. G290 - Fingerprint + card + mechanical key
12. KT14 - Portable biometric, IP67 waterproof

HOTEL MANAGEMENT SUITE:
13. Smart Hotel Ecosystem - Centralized guest access, digital keys

Available CCTV Products:
- Indoor Camera - 1080p, night vision, two-way audio
- Outdoor Camera - Weatherproof IP66, motion alerts
- Dome Camera - 360 coverage, vandal-proof
- Bullet Camera - Long range IR, 30m night vision`;
    }

    prompt += `

Respond with a JSON object (no markdown):
{
  "recommendedPackage": "name of the best product/package",
  "reason": "2-3 sentence explanation why this is the best fit",
  "totalWattsNeeded": ${totalWatts || 0},
  "budgetFit": "within_budget" | "slightly_over" | "over_budget",
  "tip": "one helpful tip for the customer",
  "alternativePackage": "name of a backup option if budget is tight"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "recommend_package",
            description: "Recommend the best product/package for the customer",
            parameters: {
              type: "object",
              properties: {
                recommendedPackage: { type: "string" },
                reason: { type: "string" },
                totalWattsNeeded: { type: "number" },
                budgetFit: { type: "string", enum: ["within_budget", "slightly_over", "over_budget"] },
                tip: { type: "string" },
                alternativePackage: { type: "string" },
              },
              required: ["recommendedPackage", "reason", "budgetFit", "tip"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_package" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let recommendation;

    if (toolCall?.function?.arguments) {
      recommendation = JSON.parse(toolCall.function.arguments);
    } else {
      const content = result.choices?.[0]?.message?.content || "{}";
      try {
        recommendation = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        recommendation = { recommendedPackage: "Contact us for a custom recommendation", reason: "We'd love to help you find the perfect solution.", budgetFit: "within_budget", tip: "Reach out on WhatsApp for the fastest response." };
      }
    }

    return new Response(JSON.stringify(recommendation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
