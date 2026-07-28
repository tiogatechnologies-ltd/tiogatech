## What I verified this turn

I read `index.html`, `public/robots.txt`, `public/sitemap.xml`, `src/App.tsx` routes, every `src/pages/*.tsx` for SEO tags, and searched for product-detail, review, wishlist and order-tracking code.

**Already strong:** every public page uses the `SEO` component (title/description/canonical/og/twitter); `index.html` has a rich Organization + WebSite + LocalBusiness JSON-LD graph; `public/llms.txt` is thorough; robots.txt explicitly allows GPTBot, PerplexityBot, ClaudeBot, CCBot etc.; all admin pages are noindex via `AdminSEO`; FAQ, Article, Breadcrumb, Blog, Catalog and Packages structured data exist.

## Confirmed gaps

### SEO / AI search
1. **Sitemap is stale and static.** `public/sitemap.xml` lists 13 URLs and contains **zero blog posts**. A `supabase/functions/sitemap-xml` function that includes posts exists but nothing serves it at `/sitemap.xml`, so it's dead code. Missing routes: `/energy-calculator`, `/solar-assessment`, `/ai-pricing`, `/customize/*`.
2. **Broken `SearchAction`.** The JSON-LD advertises `?q={search_term_string}` on `/catalog`, but Catalog only reads search from local state — no `useSearchParams`. Google following that URL gets an unfiltered page.
3. **No product detail pages.** Products live only inside `/catalog` state, so there are no indexable product URLs and no `Product`/`Offer` schema with price, availability or ratings — the single biggest organic and AI-search loss for an e-commerce site.
4. **No `BreadcrumbList`** outside blog posts, and no `Service`/`Product` schema on `/packages`, `/lumivolt`, `/voltai`.
5. `og:image` points at a Lovable R2 preview screenshot rather than a branded 1200×630 asset.

### Consumer features
6. **No guest order tracking.** After checkout there's no `/track` page to look up an order by reference — currently only signed-in users can see anything.
7. **No product reviews/ratings** (no table, no UI) — also blocks `AggregateRating` rich results.
8. **No wishlist / save-for-later.**
9. **No deep-linkable product URLs** for sharing or WhatsApp campaigns.

### Admin
10. No admin surface for **product reviews** moderation (needed if #7 ships).
11. No **SEO/content health panel** (which posts lack meta descriptions, which products lack images/descriptions).
12. `AdminSupportTickets` exists but there's no **SLA/ageing indicator** or assignment-to-staff field.

## Proposed work (pick a scope)

**Track A — SEO & AI search (recommended first, low risk)**
- Serve a live sitemap: add a `predev`/`prebuild` generator or route `/sitemap.xml` to the existing edge function so blog posts and all public routes appear; keep `lastmod` only from real post `updated_at`.
- Wire `?q=`, `?category=` into Catalog via `useSearchParams` so the advertised SearchAction works and filtered views are shareable.
- Add `BreadcrumbList` to Catalog, Packages, Career, Contact; add `Service` schema to `/lumivolt` and `/voltai`.
- Generate a branded 1200×630 og:image and point og/twitter at it.

**Track B — Product detail pages**
- New route `/catalog/:slug` rendering a full PDP (gallery, specs, finance estimate, add-to-cart), linked from catalog cards, with `Product` + `Offer` + `BreadcrumbList` JSON-LD and inclusion in the sitemap.

**Track C — Order tracking + reviews**
- `/track` guest lookup by order reference + email, showing the existing `order_status_history` timeline.
- `product_reviews` table (RLS: verified purchasers write, public read approved), star UI on PDP, `AggregateRating` schema, and an admin moderation page.

## Technical notes
- Sitemap change must not replace the existing mechanism silently — I'd keep `public/sitemap.xml` as the served path and populate it from a generator script (dev/build hook) so no hosting rewrite is needed, unless you prefer routing to the edge function.
- Reviews require a new public table, so it needs `GRANT`s plus RLS restricting writes to users with a matching paid order.
- No business-logic changes to finance, checkout or RBAC are included here.

Tell me which tracks to build (A alone is a good first turn) and I'll scope it.