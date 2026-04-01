import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { appliances, totalWatts, budget, systemType, propertyType, usageDuration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a solar energy expert for Tioga Technologies in Nigeria. Based on the customer's needs, recommend the best solar package.

Customer details:
- Appliances: ${JSON.stringify(appliances)}
- Estimated total watts: ${totalWatts}W
- Budget: ${budget}
- System preference: ${systemType || "Not specified"}
- Property type: ${propertyType || "Not specified"}  
- Usage hours: ${usageDuration || "Not specified"}

Available packages (with prices in Naira):
LITHIUM BATTERY PACKAGES:
1. 3.5KVA - ₦4,024,000 (3500W, 5kWh battery) - Powers: 30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers
2. 5KVA - ₦5,349,300 (5000W, 7.2kWh battery) - Powers: 30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers
3. 7.5KVA - ₦7,339,200 (7500W, 10kWh battery) - Powers: 36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC
4. 10KVA - ₦10,828,800 (10000W, 15kWh battery) - Powers: 40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 1HP AC
5. 10KVA 3-Phase - ₦12,185,800 (10000W, 17kWh) - Powers: 80 Bulbs, 12 Fans, 10 TVs, 10 Laptops, 4 Freezers, 3x 1HP AC
6. 10KVA 3-Phase 20kWh - ₦13,052,600 - Same capacity, more storage
7. 20KVA - ₦20,808,000 (20000W, 30kWh) - Powers: 100 Bulbs, 15 Fans, 15 TVs, 15 Laptops, 5 Freezers, 4x 1HP AC
8. 30KVA - ₦40,508,800 (30000W, 70kWh) - Industrial grade

GEL BATTERY PACKAGES (more affordable):
9. 1KVA - ₦1,125,200 (1000W) - Powers: 9 Bulbs, 2 Fans, 2 TVs, 2 Laptops
10. 1.5KVA - ₦1,519,500 (1500W) - Powers: 14 Bulbs, 3 Fans, 3 TVs, 3 Laptops
11. 2.5KVA - ₦2,216,000 (2500W) - Powers: 18 Bulbs, 4 Fans, 3 TVs, 3 Laptops
12. 5KVA Gel - ₦4,775,940 (5000W) - Powers: 30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 1 Freezer
13. 7.5KVA Gel - ₦7,253,000 (7500W) - Powers: 36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC
14. 10KVA Gel - ₦11,284,000 (10000W) - Powers: 40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 2x 1HP AC

Respond with a JSON object (no markdown):
{
  "recommendedPackage": "name of the best package",
  "reason": "2-3 sentence explanation why this is the best fit",
  "totalWattsNeeded": number,
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
            description: "Recommend the best solar package for the customer",
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
              required: ["recommendedPackage", "reason", "totalWattsNeeded", "budgetFit", "tip"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_package" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
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
      // Fallback: try parsing content as JSON
      const content = result.choices?.[0]?.message?.content || "{}";
      try {
        recommendation = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      } catch {
        recommendation = { recommendedPackage: "5KVA Solar Package", reason: "A versatile choice for most homes.", totalWattsNeeded: totalWatts, budgetFit: "within_budget", tip: "Consider LED bulbs to reduce power consumption." };
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
