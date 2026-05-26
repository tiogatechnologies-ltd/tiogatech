import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://tiogatechnologies.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data } = await supabase
      .from("blog_posts")
      .select("slug,title,excerpt,published_at,updated_at,author,cover_image_url,tags")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(50);

    const items = (data ?? []).map((p: any) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.published_at ?? p.updated_at).toUTCString()}</pubDate>
      <author>noreply@tiogatechnologies.com (${escapeXml(p.author ?? "Tioga Team")})</author>
      ${(p.tags ?? []).map((t: string) => `<category>${escapeXml(t)}</category>`).join("")}
      <description>${escapeXml(p.excerpt ?? "")}</description>
      ${p.cover_image_url ? `<enclosure url="${escapeXml(p.cover_image_url)}" type="image/jpeg" />` : ""}
    </item>`).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tioga Technologies Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Solar tips, smart-home guides, and energy insights from Tioga Technologies.</description>
    <language>en-NG</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (err) {
    console.error("RSS error:", err);
    return new Response("RSS generation failed", { status: 500, headers: corsHeaders });
  }
});
