import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_MAP: Record<string, string[]> = {
  solar: ["solar"],
  automation: ["smarthome"],
  security: ["smart_locks", "cctv"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { category, appliances, totalWatts, budget, formContext } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const effectiveCategory = category || formContext?.category || "solar";

    // Dynamically fetch products from DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const dbCategories = CATEGORY_MAP[effectiveCategory] || ["solar"];
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("name, category, series, price, description, best_for, tier, tags")
      .eq("is_active", true)
      .in("category", dbCategories)
      .order("sort_order");

    const productList = (products || [])
      .map((p: any) => {
        const combo = (p.tags as string[] || []).includes("combo") ? " [COMBO PACKAGE]" : "";
        return `- "${p.name}" - ${p.series || p.category} - ${p.price || "Price on request"} - ${p.best_for}${combo}`;
      })
      .join("\n");

    // Build expert role and customer details
    let expertRole = "solar energy expert";
    let customerDetails = "";

    if (effectiveCategory === "solar") {
      expertRole = "solar energy expert";
      const ctx = formContext || {};
      customerDetails = `
- Appliances: ${JSON.stringify(appliances || [])}
- Estimated total watts: ${totalWatts || 0}W
- Budget: ${budget || "Not specified"}
- System preference: ${ctx.systemType || "Not specified"}
- Property type: ${ctx.propertyType || "Not specified"}
- Usage hours: ${ctx.usageDuration || "Not specified"}`;
    } else if (effectiveCategory === "automation") {
      expertRole = "smart home automation expert";
      const ctx = formContext || {};
      customerDetails = `
- What they want to automate: ${JSON.stringify(ctx.automateWhat || [])}
- Control preference: ${ctx.controlPreference || "Not specified"}
- Property type: ${ctx.propertyType || "Not specified"}
- Scale: ${ctx.automationScale || "Not specified"}
- Budget: ${budget || "Not specified"}`;
    } else if (effectiveCategory === "security") {
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

CRITICAL: You MUST return product names EXACTLY as they appear in quotes below. Do NOT modify, shorten, or rephrase product names. If a COMBO PACKAGE fits the customer's needs, recommend it first.

Customer details:${customerDetails}

Available products (from database):
${productList}

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
                  description: "Array of 3-5 exact product names from the catalog, ranked by fit.",
                },
                recommendedCombo: {
                  type: "string",
                  description: "The exact name of a combo package if one fits well",
                },
                reason: { type: "string", description: "2-3 sentence explanation" },
                budgetFit: { type: "string", enum: ["within_budget", "slightly_over", "over_budget"] },
                tip: { type: "string", description: "One helpful pro tip" },
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

    // Validate: only keep names that exist in DB
    const validNames = new Set((products || []).map((p: any) => p.name.toLowerCase().trim()));
    recommendation.recommendedProducts = recommendation.recommendedProducts.filter(
      (name: string) => validNames.has(name.toLowerCase().trim())
    );

    if (recommendation.recommendedCombo && !validNames.has(recommendation.recommendedCombo.toLowerCase().trim())) {
      delete recommendation.recommendedCombo;
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
