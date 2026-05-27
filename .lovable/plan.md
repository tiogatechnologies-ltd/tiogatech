## 1. Remove RSS Feed from blog

- Remove the "RSS Feed" button + `Rss` icon import + `RSS_URL` constant from `src/pages/Blog.tsx`.
- Remove the `<link rel="alternate" type="application/rss+xml">` auto-discovery tag from `index.html`.
- Delete the `supabase/functions/blog-rss/` Edge Function (no longer referenced).

(Keeping the function deployed but unused would be dead infra — safer to remove.)

## 2. Website audit — missing or incomplete features

After scanning the codebase, routes, DB schema, and edge functions, here is what is genuinely missing or only half-built. Nothing below is a "nice to have" — each is something the UI implies should work but doesn't, or a standard expectation for a site of this scope.

### A. Newsletter — partially done
- `subscribe-newsletter` works and stores subscribers, but there is **no double opt-in / confirm flow** (no `confirm-newsletter` function, no `/newsletter/confirm` page, no `confirmed` column on the table).
- **No unsubscribe page**, even though `unsubscribe_token` is stored. Required for CAN-SPAM / good sender reputation.
- **No broadcast / send-to-list** action in `/admin/newsletter` — admins can only export CSV.

### B. Blog — partially done
- No **search** or **category/tag filter** on `/blog`.
- No **pagination** (loads all posts in one query).
- No **draft preview** for admins (can only see live, published posts).
- No **scheduled publishing** (only an instant publish toggle).
- `read_minutes` is stored as a manual number; should auto-calc from content length.

### C. SEO
- `public/sitemap.xml` is **static** — new blog posts are never added. Needs a dynamic sitemap (edge function `sitemap-xml` reading from `blog_posts`).
- No `og:image` fallback on most pages — only set when a post has a cover image.
- No structured data for `Organization` / `LocalBusiness` on the home page (important for Google Knowledge Panel + local Nigerian search).

### D. Auth & accounts
- Admin auth exists, but there is **no customer-facing auth** at all. Implications:
  - "Cart" persists only in localStorage; no order history, no saved addresses.
  - Newsletter confirm / unsubscribe links can't tie to a user.
  - Lead-form re-entry — returning users re-fill everything.
- No password reset flow for admins.

### E. Cart / Checkout
- `CartDrawer` exists and items can be added, but there is **no checkout** — pressing checkout just opens WhatsApp with a pre-filled message. No `orders` table, no order confirmation email, no admin order management.

### F. Lead flow
- `notify-new-lead` exists but I should verify it actually sends (no rate-limit, no retry).
- No **lead assignment** to specific staff in `/admin/leads`.
- No **status pipeline** UI (status is just a text field; no Kanban or quick-update).

### G. Analytics
- `page_views` + `product_clicks` are captured, but `/admin/analytics` likely shows only basic counts. No funnel, no source breakdown, no time-on-page.
- No **Google Analytics 4** or **Meta Pixel** snippet in `index.html` — relying only on first-party tracking misses retargeting.

### H. Communications
- No **WhatsApp Business API** webhook (currently only `wa.me` deep links).
- No **SMS** confirmation for leads / orders (critical in NG where email is less reliable).
- No **transactional email templates** stored in DB — every function hardcodes HTML.

### I. Content / CMS gaps
- `landing_content` is editable, but **About**, **Finance**, **Contact**, **Privacy**, **Terms** pages are hardcoded — admin can't edit copy without a code change.
- No **testimonials** / case studies CMS (the home page testimonial block is hardcoded if present).
- No **media library** — every image upload goes to `product-images` bucket regardless of context.

### J. Security / ops
- No **rate-limiting** on public edge functions (`subscribe-newsletter`, `notify-new-lead`, `ai-recommend`) — vulnerable to spam/abuse.
- No **CAPTCHA** on lead form, newsletter, career application.
- No **error monitoring** (Sentry-equivalent) — silent failures.
- `career-cvs` bucket is private, but no signed-URL admin viewer is wired (need to confirm `AdminCareerApplications` can actually download CVs).

### K. Mobile / PWA
- No `manifest.json` / install prompt / offline shell — site is mobile-responsive but not installable, despite being heavily mobile-targeted.

### L. Misc
- 404 page exists but has no internal-link suggestions.
- No `humans.txt`, no security.txt, no `/api/health` for uptime monitors.
- WhatsApp click tracking — `wa.me` links don't fire a `conversions` event.

## Next step

I'll wait for your direction before doing anything beyond the RSS removal (item 1).

**Reply with which of A–L you want me to tackle now** (e.g., "Do A, C, E, J"), and I'll either implement directly or come back with a focused plan for each. If you just want the RSS removal, say "just RSS" and I'll ship only that.
