// Runs after `vite build` (postbuild hook, via vite-node). Google runs the
// app's JavaScript to read each page's <title>/canonical, but crawlers that do
// not (social previews, some AI crawlers, Google's first pass) only see the
// homepage tags in index.html. This writes a copy of the built index.html per
// public route with that route's own title, description and canonical so those
// tags exist in the raw HTML. The app still boots and Helmet takes over as usual.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.tiogatechnologies.com";
const dist = resolve("dist");
const shell = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clean = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

function withMeta(html, { title, description, path }) {
  const url = `${BASE_URL}${path === "/" ? "/" : path}`;
  const t = esc(title.includes("Tioga") ? title : `${title} | Tioga Technologies`);
  const d = esc(description);
  let out = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  const set = (re, replacement) => { out = out.replace(re, replacement); };
  set(/(<meta name="description"[^>]*content=")[^"]*(")/, `$1${d}$2`);
  set(/(<link rel="canonical"[^>]*href=")[^"]*(")/, `$1${url}$2`);
  set(/(<meta property="og:title"[^>]*content=")[^"]*(")/, `$1${t}$2`);
  set(/(<meta property="og:description"[^>]*content=")[^"]*(")/, `$1${d}$2`);
  set(/(<meta property="og:url"[^>]*content=")[^"]*(")/, `$1${url}$2`);
  set(/(<meta name="twitter:title"[^>]*content=")[^"]*(")/, `$1${t}$2`);
  set(/(<meta name="twitter:description"[^>]*content=")[^"]*(")/, `$1${d}$2`);
  return out;
}

function write(path, meta) {
  if (!path || path === "/") return;
  const dir = join(dist, ...path.split("/").filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), withMeta(shell, { ...meta, path }));
}

// 1. Static pages: read the literal title/description/path props of <SEO> tags.
const pages = new Map();
for (const f of readdirSync(resolve("src/pages"))) {
  if (!f.endsWith(".tsx") || f.startsWith("Admin")) continue;
  const src = readFileSync(join("src/pages", f), "utf8");
  const at = src.indexOf("<SEO");
  if (at < 0) continue;
  const chunk = src.slice(at, at + 900);
  if (/<SEO\s+noindex/.test(chunk)) continue;
  const get = (k) => chunk.match(new RegExp(`\\b${k}="([^"]+)"`))?.[1];
  const path = get("path");
  const title = get("title");
  const description = get("description");
  if (path && title && description && path.startsWith("/") && !path.includes("$") && !pages.has(path)) {
    pages.set(path, { title, description });
  }
}
// Pages whose <SEO> props are expressions, so the literal scan above misses them.
const FALLBACKS = {
  "/catalog": { title: "Tioga Store & Hardware Catalog", description: "Explore tailored renewable energy, lithium battery storage, and smart home biometric access systems matching your load assessment." },
  "/finance": { title: "Lease-to-Own Solar Financing in Nigeria", description: "Own your solar system with 30% down and flexible 3, 6, 12 or 24 month monthly repayments. Bank-partner financing for homes and businesses across Nigeria." },
  "/contact": { title: "Contact Tioga Technologies", description: "Talk to Tioga Technologies about solar, smart locks or home automation. Call, WhatsApp, or visit our office in Jos." },
};
for (const [path, meta] of Object.entries(FALLBACKS)) if (!pages.has(path)) pages.set(path, meta);
for (const [path, meta] of pages) write(path, meta);

// 2. Products (static catalogue + database).
const kebab = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
const productSlug = (p) => `${kebab(p.name)}-${String(p.id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "item"}`;
let products = [];
try {
  const { PRODUCTS } = await import("../src/data/products.ts");
  products = PRODUCTS || [];
} catch (err) {
  console.warn("prerender: could not load products - " + (err && err.message));
}
let n = 0;
for (const p of products) {
  if (!p.name) continue;
  const description = clean(p.description, 155) || `${p.name} available from Tioga Technologies in Nigeria. Request a quote or order online.`;
  write(`/product/${productSlug(p)}`, { title: clean(p.name, 70), description });
  n++;
}

// 3. Blog posts (database).
let posts = 0;
try {
  const env = { ...process.env };
  if (existsSync(".env")) {
    for (const l of readFileSync(".env", "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (url && key) {
    const { data } = await createClient(url, key).from("blog_posts").select("slug,title,excerpt").eq("published", true).limit(1000);
    for (const p of data || []) {
      if (!p.slug || !p.title) continue;
      write(`/blog/${p.slug}`, { title: clean(p.title, 70), description: clean(p.excerpt, 155) || clean(p.title, 155) });
      posts++;
    }
  }
} catch (err) {
  console.warn("prerender: blog posts skipped - " + (err && err.message));
}

console.log(`prerender-meta: ${pages.size} pages + ${n} products + ${posts} blog posts`);
