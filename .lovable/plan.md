
## 1. Admin access for inememmanuel@gmail.com and @tiogatechnologies.com
- Add a DB migration that grants `admin` role to any existing `auth.users` row matching `inememmanuel@gmail.com` OR an `@tiogatechnologies.com` email (insert into `public.user_roles` on conflict do nothing).
- Add a trigger on `auth.users` (insert + update of `email_confirmed_at`) that auto-grants `admin` for verified emails matching those rules (per the email-domain-role-assignment security pattern — verified emails only).
- Frontend: `AuthContext` already exposes `loading`; double-check `RequireRole` waits for it (it does). Add a small "force refresh roles" call right after sign-in in `AdminLogin` to avoid first-load races.

## 2. Hero CTA: replace "Chat on WhatsApp" with "Energy Calculator" popup
- In `src/components/Hero.tsx`, swap the WhatsApp secondary button for an "Energy Calculator" button that opens a Dialog containing `LumiVoltSizer` (same modal pattern as the AI recommendations popup).
- New component `src/components/EnergyCalculatorDialog.tsx` (Dialog wrapper around `LumiVoltSizer`, with CTA to the full page).

## 3. Remove the homepage calculator section
- In `src/pages/Index.tsx`, delete the `#power-calculator` section block (the one added previously). Keep the deep-link target on the new full page.

## 4. New full Energy Calculator page
- New route `/energy-calculator` → `src/pages/EnergyCalculator.tsx` with:
  - SEO meta + JSON-LD
  - Cover image (generate one stock-style hero, stored in `src/assets/`)
  - Sections: what it does, how it works, why sizing matters, appliance tips, FAQ, embedded `LumiVoltSizer`, CTAs to packages/finance.
- Add route in `src/App.tsx`.
- Add link under the "Products" group in the hamburger / mega menu (`SiteHeader.tsx` + `MegaMenu.tsx`).

## 5. Packages page not loading for some users + speed
- Audit `src/pages/Packages.tsx` and `useSolarPackages` hook: ensure no infinite spinner when query returns empty; add retry-with-backoff (same pattern as `useBlog.ts`) and a stale-while-revalidate cache in `sessionStorage` so a revisit renders instantly.
- Fix the deep-link scroll: if data isn't loaded yet, defer the scrollIntoView until after packages render (run in a `useEffect` keyed on `packages.length` + `location.hash`).
- Add proper empty/error states with a "Retry" button.

## 6. Minor bugs & cache issues
- Verify `index.html` cache headers are sane (HTML no-cache, assets hashed/cacheable — already set, re-verify).
- Add a small `BUILD_ID` query bust on critical Supabase reads that users reported as stale (landing_content, blog_posts, solar_packages) via `sb.from(...).select(...).order(...)` already correct; main fix is the SWR cache + retry pattern.
- Sweep for known small issues: AI chat outside-click close (verify still works), TelegramWidget popup timing.

## 7. AI Credit Pricing page — 3 tiers
- Rebuild `src/pages/Pricing.tsx` with **Starters / Businesses / Custom** tiers. Clear distinctions:
  - **Starters** — ₦2,500/mo · 20 credits · personal use · email support · reports + BoM
  - **Businesses** — ₦12,000/mo · 120 credits · multi-site, team seats (3), installer dashboard, priority queue, CSV export, monthly insights
  - **Custom** — Talk to sales · unlimited team seats, custom credit pack, API access, dedicated engineer review, SLA
- Each tier: icon, distinct accent color, "Best for…" line, feature checklist, CTA (Subscribe via WhatsApp / Build my plan).
- Keep free 3-credit onboarding banner above the grid (not a tier).
- Ensure `/ai-pricing` route already wired; add link from `AccountSubscription` + AI chat upgrade dialog.

## 8. Blog page showing no posts
- Investigate live: query `blog_posts` for `published=true`. Most likely cause is that the migration adding the 5 SEO posts was either rolled back or `published` defaults to false.
- Fix via migration: upsert the 5 SEO posts (solar costs, sizing, generators vs solar, financing, smart homes) with `published=true`, `published_at=now()`, proper slugs, cover_image_url, tags, seo_title/seo_description, and bodies that don't begin with a duplicate cover image.
- Verify `useBlogPosts` already retries — keep as-is.

## Technical notes
- All DB changes via `supabase--migration`. Public-schema tables touched (`user_roles`, `blog_posts`) already have GRANTs from prior migrations; the migration only inserts data + a trigger function (SECURITY DEFINER, `search_path=public`).
- New image asset generated via `imagegen` (premium not needed — no text).
- No new deps required.

## Out of scope (will not touch)
- Paystack flow, finance calculator, LumiVolt page content — already shipped.
- Admin Copilot — confirmed removed.
