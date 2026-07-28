// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Static routes are listed here; published blog posts are pulled from the database
// so the sitemap never goes stale as content is published.

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://tiogatechnologies.com";

/** @type {{path: string, changefreq: string, priority: string}[]} */
const STATIC_ENTRIES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/packages", changefreq: "weekly", priority: "0.9" },
  { path: "/catalog", changefreq: "weekly", priority: "0.9" },
  { path: "/lumivolt", changefreq: "monthly", priority: "0.8" },
  { path: "/voltai", changefreq: "monthly", priority: "0.8" },
  { path: "/finance", changefreq: "monthly", priority: "0.7" },
  { path: "/energy-calculator", changefreq: "monthly", priority: "0.7" },
  { path: "/solar-assessment", changefreq: "monthly", priority: "0.8" },
  { path: "/ai-pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/career", changefreq: "weekly", priority: "0.6" },
  { path: "/careers/jobs", changefreq: "weekly", priority: "0.6" },
  { path: "/blog", changefreq: "daily", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

function readEnv() {
  const env = { ...process.env };
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchBlogPosts() {
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const nowIso = new Date().toISOString();
    const endpoint =
      `${url}/rest/v1/blog_posts?select=slug,updated_at,published_at` +
      `&published=eq.true&published_at=lte.${encodeURIComponent(nowIso)}` +
      `&order=published_at.desc&limit=1000`;
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      console.warn(`[sitemap] blog fetch failed (${res.status}); writing static routes only`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("[sitemap] blog fetch error; writing static routes only:", err?.message ?? err);
    return [];
  }
}

function urlBlock({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

const posts = await fetchBlogPosts();

const blocks = [
  // No <lastmod> for static routes: there is no authoritative per-page timestamp,
  // and a build-time date would be a meaningless signal to crawlers.
  ...STATIC_ENTRIES.map((e) =>
    urlBlock({ loc: `${BASE_URL}${e.path}`, changefreq: e.changefreq, priority: e.priority }),
  ),
  ...posts.map((p) =>
    urlBlock({
      loc: `${BASE_URL}/blog/${escapeXml(p.slug)}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
      changefreq: "monthly",
      priority: "0.7",
    }),
  ),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...blocks,
  "</urlset>",
  "",
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${STATIC_ENTRIES.length} routes + ${posts.length} blog posts)`);
