import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLAR_PRODUCTS = `
COMBO PACKAGES (recommend these first when they fit):
- "Starter Home Solar Kit" - BIS3500 + 5.12KWH battery + 4x500W panels (~₦1.5M) - for small apartments
- "Standard Home Solar Kit" - SNA5000 + TAICO 5.12KWH + 6x500W panels (~₦2.5M) - for medium homes
- "Premium Home Solar Kit" - GEN EU 8K + TAICO 10.24KWH + 8x550W panels (~₦5.5M) - for large homes with AC
- "Full Duplex Solar Kit" - GEN EU 10K + TAICO 20.48KWH + 12x550W panels (~₦8.5M) - for duplexes
- "Commercial Solar Kit" - Three Phase 20K + 2x TAICO 20.48KWH + 20x550W panels (~₦15M+) - for businesses

INVERTERS:
- "Geta 1.5K" 1.5KW - ₦299,000
- "Geta 3.6K" 3.6KW - ₦357,500
- "SNA5000 WPV" 5KW - ₦702,000
- "SNA6000 WPV" 6KW - ₦715,000
- "SNA-EU 12000" 12KW - ₦1,885,000
- "SNA2 EU LT 12K" 12KW - ₦1,469,000
- "GEN EU 8K" 8KW hybrid - ₦2,275,000
- "GEN EU 10K" 10KW hybrid - ₦2,649,400
- "Trip-HB-EU 20K" 20KW 3phase - ₦3,120,000
- "Trip-HB-EU 25K" 25KW 3phase - ₦3,679,000
- "TRIP2-HB-EU 30K" 30KW 3phase - ₦3,185,000
- "BIS1500-12L" 1.5KW - ₦240,500
- "BIS3500-24S" 3.5KW - ₦344,500
- "BIS6200-48l" 6.2KW - ₦520,000
- "BIS11000-48L  48V Hybrid Inverter" 11KW - ₦975,000
- "HF1215S60-108" 1.5KW SRNE - ₦345,800
- "HF2430S60-108" 3KW SRNE - ₦426,400
- "HF4850S80-H PV input 500V" 5KW SRNE - ₦566,800
- "ASP48100S200-H" 10KW SRNE - ₦1,563,900
- "ASP48120S200-H" 12KW SRNE - ₦1,664,000
- "PULSE S3 Off-Grid Hybrid Inverter" 6KW - ₦845,000
- "PULSE S2 Off-Grid Hybrid Inverter" 11KW - ₦1,235,000
- "ROSA Series G2 Single Phase Hybrid Inverter" 11KW - ₦702,000

BATTERIES:
- "TKPW-5500" TAICO 5.12KWH - ₦845,000
- "TKPW-10000" TAICO 10.24KWH - ₦1,950,000
- "TKRB-1500" TAICO 15.36KWH - ₦3,250,000
- "TKRB-2000" TAICO 20.48KWH - ₦3,770,000
- "TKRB-2028" TAICO 20.48KWH - ₦4,680,000
- "EOC05B" EOS 5.12KWH - ₦1,324,700
- "EOS10B" EOS 10.24KWH - ₦3,331,900
- "PGEM" PylonTech 5.12KWH - ₦1,365,000
- "PGEM PRO" PylonTech 14.3KWH - ₦3,295,500
- "PGEM MAX" PylonTech 16KWH - ₦3,409,900

SOLAR PANELS:
- "200W Mono Solar Panel" - ₦45,500
- "280W Mono Solar Panel  (Promotion)" - ₦71,500
- "440-455W Monocrystalline (half-cut or PERC cells)" - ₦123,500
- "490-495W Monocrystalline (half-cut or PERC cells)" - ₦130,000
- "550-585W Monocrystalline (half-cut or PERC cells)" - ₦137,800
`;

const SECURITY_PRODUCTS = `
COMBO PACKAGES (recommend these first when they fit):
- "Home Security Starter" - SL02 lock + 2x indoor cameras (~₦250k) - for apartments
- "Full Home Security" - D20 Apex lock + 2x outdoor + 1x dome camera (~₦500k) - for houses
- "Business Security Suite" - 2x K209 Elite locks + 4x bullet cameras + DVR (~₦1M+) - for businesses

SMART LOCKS:
Elite Series:
- "Model K209" - Facial recognition, palm-vein, video intercom
- "Model S7" - IP66 waterproof, facial recognition
Apex Series:
- "Model D20" - Facial recognition, WiFi app
- "Model H11" - Facial recognition, video intercom
- "Model C11" - Facial recognition, doorbell
Pro Series:
- "SL02" - Built-in camera, staff attendance
- "TF5" - Remote access, BLE app
- "N22" - WiFi, 100 fingerprints
- "N14" - Business, time attendance
Base Series:
- "V80" - Compact, mobile app
- "G290" - Fingerprint + card + key
- "KT14" - Portable biometric, IP67

CCTV:
- "Indoor Camera" - 1080p, night vision
- "Outdoor Camera" - IP66 weatherproof
- "Dome Camera" - 360, vandal-proof
- "Bullet Camera" - 30m IR night vision
`;

const SMARTHOME_PRODUCTS = `
COMBO PACKAGES (recommend these first when they fit):
- "Smart Starter Kit" - 4x 1 Gang switches + 1x Granite Display (~₦150k) - for beginners
- "Smart Home Complete" - 8 Gang + 4x 1 Gang + Granite Display + TF5 lock (~₦350k) - full automation

SWITCHES:
- "8 Gang WiFi Smart Switch" - Multi-circuit remote control
- "1 Gang WiFi Smart Switch" - Single switch with timer
- "Granite Display Smart Switch" - Premium touch display, scene control, energy monitoring
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { category, appliances, totalWatts, budget, formContext } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const effectiveCategory = category || formContext?.category || "solar";

    let catalogSection = SOLAR_PRODUCTS;
    let expertRole = "solar energy expert";
    let customerDetails = "";

    if (effectiveCategory === "solar") {
      const ctx = formContext || {};
      customerDetails = `
- Appliances: ${JSON.stringify(appliances || [])}
- Estimated total watts: ${totalWatts || 0}W
- Budget: ${budget || "Not specified"}
- System preference: ${ctx.systemType || "Not specified"}
- Property type: ${ctx.propertyType || "Not specified"}
- Usage hours: ${ctx.usageDuration || "Not specified"}`;
    } else if (effectiveCategory === "automation") {
      catalogSection = SMARTHOME_PRODUCTS;
      expertRole = "smart home automation expert";
      const ctx = formContext || {};
      customerDetails = `
- What they want to automate: ${JSON.stringify(ctx.automateWhat || [])}
- Control preference: ${ctx.controlPreference || "Not specified"}
- Property type: ${ctx.propertyType || "Not specified"}
- Scale: ${ctx.automationScale || "Not specified"}
- Budget: ${budget || "Not specified"}`;
    } else if (effectiveCategory === "security") {
      catalogSection = SECURITY_PRODUCTS;
      expertRole = "security systems expert";
      const ctx = formContext || {};
      customerDetails = `
- Security needs: ${JSON.stringify(ctx.securityNeeds || [])}
- Property type: ${ctx.propertyType || "Not specified"}
- Access type preferences: ${JSON.stringify(ctx.accessType || [])}
- CCTV coverage: ${JSON.stringify(ctx.cctvCoverage || [])}
- Budget: ${budget || "Not specified"}`;
    }

    const prompt = `You are a ${expertRole} for Tioga Technologies in Nigeria.

CRITICAL: You MUST return product names EXACTLY as they appear in quotes below. Do NOT modify, shorten, or rephrase product names.

Customer details:${customerDetails}

Available products:
${catalogSection}

Based on the customer's needs and budget, recommend the TOP 3-5 products that best match. If a combo package fits, recommend it first. Then recommend individual components that complement it.`;

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
            name: "recommend_products",
            description: "Return ranked product recommendations using EXACT product names from the catalog",
            parameters: {
              type: "object",
              properties: {
                recommendedProducts: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of 3-5 exact product names from the catalog, ranked by fit. Use the exact names in quotes from the product list.",
                },
                recommendedCombo: {
                  type: "string",
                  description: "The exact name of a combo package if one fits well, e.g. 'Standard Home Solar Kit'",
                },
                reason: { type: "string", description: "2-3 sentence explanation of why these products are the best fit" },
                budgetFit: { type: "string", enum: ["within_budget", "slightly_over", "over_budget"] },
                tip: { type: "string", description: "One helpful pro tip for the customer" },
              },
              required: ["recommendedProducts", "reason", "budgetFit", "tip"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_products" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      const msg = status === 429 ? "Rate limited, please try again later." : status === 402 ? "AI credits exhausted." : "AI service error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
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
        recommendation = {
          recommendedProducts: [],
          reason: "We'd love to help you find the perfect solution.",
          budgetFit: "within_budget",
          tip: "Reach out on WhatsApp for the fastest response.",
        };
      }
    }

    // Ensure backwards compatibility
    if (!recommendation.recommendedProducts) {
      recommendation.recommendedProducts = [];
      if (recommendation.recommendedPackage) {
        recommendation.recommendedProducts.push(recommendation.recommendedPackage);
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
