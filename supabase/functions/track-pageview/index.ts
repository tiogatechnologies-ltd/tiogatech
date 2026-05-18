import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseDeviceType(ua: string): string {
  // iPadOS 13+ reports as Mac with touch — detect via "Macintosh" + touch hints
  if (/ipad/i.test(ua)) return "tablet";
  if (/macintosh/i.test(ua) && /mobile|touch/i.test(ua)) return "tablet";
  if (/tablet|playbook|silk|kindle/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|preview|headless|lighthouse|pingdom|uptimerobot|gtmetrix/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, page_path, referrer, user_agent } = await req.json();

    if (!session_id || !page_path) {
      return new Response(JSON.stringify({ error: "session_id and page_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip bots
    if (user_agent && BOT_RE.test(user_agent)) {
      return new Response(JSON.stringify({ skipped: "bot" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip admin routes — they are not public traffic
    if (typeof page_path === "string" && page_path.startsWith("/admin")) {
      return new Response(JSON.stringify({ skipped: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // De-duplicate: skip if same session+path was inserted within last 30s
    const since = new Date(Date.now() - 30_000).toISOString();
    const { data: recent } = await supabase
      .from("page_views")
      .select("id")
      .eq("session_id", session_id)
      .eq("page_path", page_path)
      .gte("created_at", since)
      .limit(1);

    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ skipped: "duplicate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const device_type = user_agent ? parseDeviceType(user_agent) : null;

    await supabase.from("page_views").insert({
      session_id,
      page_path,
      referrer: referrer || null,
      user_agent: user_agent || null,
      device_type,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("track-pageview error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
