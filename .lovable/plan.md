## What I'll do

### 1. Fix "24 Support" → "24/7 Support & Monitoring"
The stat value is already set to `"24/7"` in `StatsSection.tsx`, but a bug in the `Counter` auto-extracts the digits `24` and renders that instead of the literal `"24/7"`. Fix: only treat the value as a counter when it doesn't contain non-numeric characters like `/`.

### 2. SEO — get non-home pages indexed by Google
Most pages already mount `<SEO>`, but a few gaps explain why only the home page is showing up:

- **Pre-rendered HTML** — only `index.html` has the title/description baked into the source. Crawlers that don't run JS only see one page. Add a small `vite-plugin-prerender`-style step OR (lighter) inject route-specific `<title>` / `<meta description>` / `<link rel="canonical">` in `index.html` via a prerender script for all public routes. I'll use a `scripts/prerender.ts` invoked from `postbuild` that emits `dist/<route>/index.html` with the right head.
- **Per-page canonicals** — audit every public page (`About`, `LumiVolt`, `VoltAi`, `Finance`, `Contact`, `Packages`, `Catalog`, `Career`, `Jobs`, `Privacy`, `Terms`, `ComingSoon`) to confirm each `<SEO>` call has unique `title`, `description`, `path`. Fix any duplicates.
- **Sitemap** — add `/blog` and any new routes, set `<lastmod>`, and confirm it's referenced from `robots.txt` (it already is).
- **Internal linking** — add Blog link to header + footer so crawlers discover it.
- **Trigger an SEO scan** at the end so you get a fresh report in the SEO tab.

### 3. Add a Blog feature (CMS + public pages + admin)
**Database** (new migration):
- `blog_posts` table: `slug` (unique), `title`, `excerpt`, `content` (markdown), `cover_image_url`, `author`, `tags` (text[]), `published` (bool), `published_at`, `seo_title`, `seo_description`.
- RLS: public can read where `published = true`; admins full CRUD via `has_role`.

**Public pages**:
- `/blog` — index with cards (cover, title, excerpt, date, tags), pagination.
- `/blog/:slug` — article page with markdown rendering (`react-markdown` + `remark-gfm`), `<SEO>` with Article JSON-LD, BreadcrumbList JSON-LD, canonical, og:image from cover.

**Admin** (`/admin/blog`):
- List, create, edit, delete posts.
- Markdown editor with live preview, cover image upload to existing storage bucket, tag input, publish toggle, SEO override fields.

**Nav & SEO wiring**:
- Add "Blog" to `SiteHeader` and `SiteFooter`.
- Add `/blog` and dynamic post URLs to `sitemap.xml` (generator script reads from DB at build time).

### 4. Make Newsletter functional
Currently the footer form just toasts a fake success.

- New `newsletter_subscribers` table: `email` (unique, citext), `source`, `confirmed` (bool), `confirm_token`, `unsubscribe_token`, `subscribed_at`.
- RLS: anyone can insert (with email-format check); only admins can read.
- New edge function `subscribe-newsletter`: validates email, inserts row, sends double-opt-in confirmation email (using existing Resend setup via `notify-new-lead` pattern).
- New edge function `confirm-newsletter` (public route): flips `confirmed=true` when the token link is clicked, then redirects to a thank-you page.
- Admin page `/admin/newsletter`: list subscribers, export CSV, send broadcast via existing Email Composer.
- Update `SiteFooter` `onSubscribe` to call the edge function and show real success/error.

### 5. Security & feature audit
- Run `supabase--linter` and `security--run_security_scan`, fix anything new (most likely: blog/newsletter RLS tightening, rate limiting on newsletter endpoint).
- Verify: leaked-password protection, admin role table, RLS on every new table, no client-side admin checks, validation triggers on inputs.
- Add a basic rate-limit (IP + email) on the newsletter and blog-comment endpoints to prevent abuse.

### Technical summary (for reference)
- Files touched: `StatsSection.tsx` (1-line fix), `SiteHeader.tsx`, `SiteFooter.tsx`, `App.tsx` (route registration), `sitemap.xml` / generator, `index.html` (if needed).
- New files: `pages/Blog.tsx`, `pages/BlogPost.tsx`, `pages/AdminBlog.tsx`, `pages/AdminNewsletter.tsx`, `pages/NewsletterConfirm.tsx`, `components/MarkdownRenderer.tsx`, `supabase/functions/subscribe-newsletter/`, `supabase/functions/confirm-newsletter/`, `scripts/generate-sitemap.ts` (upgrade existing), one migration for `blog_posts` + `newsletter_subscribers`.
- Packages: `react-markdown`, `remark-gfm`.

### Questions before I start
1. **Prerendering** — happy with a build-time prerender script that produces static HTML for each public route? (Best fix for "only home page in Google" without changing stack.)
2. **Blog content authoring** — markdown editor in admin is fine, or do you want a richer WYSIWYG (TipTap)?
3. **Newsletter double opt-in** — confirm yes (recommended, anti-spam). If no, I'll skip the confirm step.
