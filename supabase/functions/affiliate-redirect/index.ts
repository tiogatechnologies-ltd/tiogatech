// Public short-link resolver: /affiliate-redirect?s=<slug>
// Logs the click (bots filtered out) and 302s to the full tracked URL.
// Pass &json=1 to receive the destination as JSON instead of a redirect.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SITE_ORIGIN = "https://tiogatechnologies.com";
const BOT_RE = /(bot|crawler|spider|crawling|facebookexternalhit|slurp|preview|whatsapp|telegram|pingdom|lighthouse|headless)/i;

function deviceType(ua: string) {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const slug = (url.searchParams.get("s") || "").trim().slice(0, 64);
  const wantsJson = url.searchParams.get("json") === "1";

  const fail = (msg: string, status: number) =>
    wantsJson
      ? new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })
      : Response.redirect(SITE_ORIGIN, 302);

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return fail("Invalid link", 400);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: link } = await admin
      .from("affiliate_links")
      .select("id, affiliate_id, slug, destination_path, utm_source, utm_medium, utm_campaign, utm_term, utm_content, is_archived, affiliates:affiliate_id(code, status)")
      .eq("slug", slug)
      .maybeSingle();

    if (!link || link.is_archived) return fail("Link not found", 404);

    const aff = (link as unknown as { affiliates: { code: string; status: string } | null }).affiliates;
    if (!aff || aff.status !== "active") return fail("Link inactive", 410);

    const params = new URLSearchParams();
    params.set("aff", aff.code);
    params.set("alk", link.slug);
    if (link.utm_source) params.set("utm_source", link.utm_source);
    if (link.utm_medium) params.set("utm_medium", link.utm_medium);
    if (link.utm_campaign) params.set("utm_campaign", link.utm_campaign);
    if (link.utm_term) params.set("utm_term", link.utm_term);
    if (link.utm_content) params.set("utm_content", link.utm_content);

    const path = link.destination_path?.startsWith("/") ? link.destination_path : `/${link.destination_path || ""}`;
    const destination = `${SITE_ORIGIN}${path}?${params.toString()}`;

    const ua = req.headers.get("user-agent") || "";
    if (!BOT_RE.test(ua)) {
      const cf = req.headers.get("cf-ipcountry");
      await admin.from("affiliate_link_clicks").insert({
        link_id: link.id,
        affiliate_id: link.affiliate_id,
        slug: link.slug,
        session_id: url.searchParams.get("sid")?.slice(0, 80) || crypto.randomUUID(),
        referrer: (req.headers.get("referer") || "").slice(0, 500) || null,
        user_agent: ua.slice(0, 400) || null,
        device_type: deviceType(ua),
        country: cf && cf !== "XX" ? cf : null,
      });
    }

    if (wantsJson) {
      return new Response(JSON.stringify({ destination }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 302, headers: { ...corsHeaders, Location: destination } });
  } catch (err) {
    console.error("affiliate-redirect error", err);
    return fail("Server error", 500);
  }
});
