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
      prompt = `You are a solar energy expert for Tioga Technologies in Nigeria. Based on the customer's needs, recommend the best solar products.

Customer details:
- Appliances: ${JSON.stringify(appliances || [])}
- Estimated total watts: ${totalWatts || 0}W
- Budget: ${budget || "Not specified"}
- System preference: ${systemType || formContext?.systemType || "Not specified"}
- Property type: ${propertyType || formContext?.propertyType || "Not specified"}  
- Usage hours: ${usageDuration || formContext?.usageDuration || "Not specified"}

Available INVERTERS (Selling Prices in Naira):

GETA INVERTERS:
- Geta 1.5K: 1.5KW single phase - ₦299,000
- Geta 3.6K: 3.6KW single phase - ₦357,500

SNA INVERTERS:
- SNA5000 WPV: 5KW single phase - ₦702,000
- SNA6000 WPV: 6KW single phase - ₦715,000
- SNA-EU 12000: 12KW single phase - ₦1,885,000
- SNA2 EU LT 12K: 12KW single phase - ₦1,469,000

GEN EU INVERTERS:
- GEN EU 8K: 8KW single phase hybrid - ₦2,275,000
- GEN EU 10K: 10KW single phase hybrid - ₦2,649,400

THREE PHASE INVERTERS:
- Trip-HB-EU 20K: 20KW three phase hybrid - ₦3,120,000
- Trip-HB-EU 25K: 25KW three phase hybrid - ₦3,679,000
- TRIP2-HB-EU 30K: 30KW three phase hybrid - ₦3,185,000
- Trip2-LB-3P 10K/12K/15K/20K: 10-20KW three phase - ₦2,883,400 to ₦3,016,000

SRNE INVERTERS:
- HF1215S60-108: 1.5KW 12V - ₦345,800
- HF2430S60-108: 3KW 24V - ₦426,400
- HF2430S80-H: 3.3KW 24V - ₦486,200
- HF4850S80-H: 5KW 48V - ₦566,800
- HFP4850S80-145: 5KW 48V parallel - ₦561,600
- HFP4850S80-H: 5KW 48V 500V - ₦595,400
- AFP4850S100-H: 5KW 48V hybrid - ₦595,400
- ASP48100S200-H: 10KW 48V - ₦1,563,900
- ASP48120S200-H: 12KW 48V - ₦1,664,000
- ASP48120SH3: 12KW 3phase - ₦1,717,300
- ASF48120SH3: 12KW 3phase promo - ₦1,478,100
- HESP4860S100-H: 6KW 48V IP66 - ₦1,375,400
- HESP48120SH3: 12KW 3phase IP65 - ₦3,148,600
- HESP48200SH3: 20KW IP65 - ₦5,209,100
- HYP4850S100-H: 5KW 48V parallel - ₦631,800
- HYP4860S100-H: 6KW 48V parallel - ₦799,500

BREAD INVERTERS:
- BIS1500-12L: 1.5KW 12V - ₦240,500
- BIS3500-24S: 3.5KW 24V - ₦344,500
- BIS6200-48l: 6.2KW 48V - ₦520,000
- BIS11000-48L: 11KW 48V - ₦975,000
- BIS11000-48L PRO: 11KW 48V Pro - ₦1,105,000

ALPSOLAR INVERTERS:
- Pulse S3: 6KW 48V IP66 - ₦845,000
- Pulse S2: 11KW 48V IP66 - ₦1,235,000
- ROSA Series G2: 11KW 48V 3MPPT - ₦702,000

Available BATTERIES:
- TAICO 5.12KWH (TKPW-5500) - ₦845,000
- TAICO 10.24KWH (TKPW-10000) - ₦1,950,000
- TAICO 15.36KWH (TKRB-1500) - ₦3,250,000
- TAICO 20.48KWH (TKRB-2000) - ₦3,770,000
- TAICO 20.48KWH (TKRB-2028) - ₦4,680,000
- EOS 2.56KWH 12V - ₦548,600
- EOS 2.56KWH 24V - ₦548,601
- EOS 5.12KWH (EOC05B) - ₦1,324,700
- EOS 5.12KWH Pro - ₦1,584,700
- EOS 7.16KWH 24V - ₦1,752,400
- EOS 10.24KWH - ₦3,331,900
- Bread 5.12KWH - ₦1,105,000
- Bread 7.17KWH Wall Mount - ₦1,430,000
- Bread 4.80KWH 48V Wall Mount - ₦1,300,000
- Bread 5.12KWH Wall Mount - ₦1,300,000
- Bread 9.6KWH Rack - ₦2,145,000
- Bread 10.24KWH Wall Mount - ₦2,405,000
- Bread 13.44KWH Wall Mount - ₦2,600,000
- Bread 15.67KWH Wall Mount - ₦2,795,000
- PylonTech Li-5 5.12KWH - ₦1,300,000
- PylonTech Li-7.5 7.5KWH - ₦1,485,900
- PylonTech PGEM 5.12KWH - ₦1,365,000
- PylonTech PGEM PRO 14.3KWH - ₦3,295,500
- PylonTech PGEM MAX 16KWH - ₦3,409,900
- PylonTech PSHIELD MAX 16KWH IP65 - ₦4,342,000

SOLAR PANELS:
- 200W Mono - ₦45,500
- 280W Mono - ₦71,500
- 440-455W Mono - ₦123,500
- 460-465W Mono - ₦123,500
- 470-475W Mono - ₦124,800
- 480-485W Mono - ₦127,400
- 490-495W Mono - ₦130,000
- 500-505W Mono - ₦130,000
- 510-515W Mono - ₦136,500
- 550-585W Mono - ₦137,800

Recommend the best COMBINATION of inverter + battery + panels based on the customer's wattage needs and budget. Be specific with product names and prices.`;
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
