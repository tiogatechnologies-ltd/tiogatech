# Implementation Plan

This is a large batch. I will ship it in the order below so the smaller wins land fast and the heavy CMS work is last.

## 1. Smart Lock category nav centering (mobile)
- In `SmartLocksSection.tsx`, the series tab strip currently left-aligns and overflows on small screens. Wrap the tab row in a `flex justify-center` container and let it scroll horizontally with `overflow-x-auto` + center alignment to match the Solar tabs.

## 2. Replace the "Businesses" stock image on the home page
- The `TargetUsers.tsx` Businesses card reuses the Office image. Generate a fresh stock photo (a Nigerian retail shopfront or small business storefront with lights on) and wire it into the card.

## 3. App Waitlist (Coming Soon page)
- New table `app_waitlist` (name, email, platform, created_at) with public INSERT + admin SELECT/DELETE RLS.
- Add a form on `/coming-soon` collecting **Name + Email + Platform (iOS / Android / Both)** with zod validation, toast confirmation, success state.
- New admin page `/admin/waitlist` listing entries with CSV export.

## 4. Packages page perceived loading
- Lazy-load `SolarPackagesSection`, `SmartLocksSection`, `HomeAutomationSection` via `React.lazy` + `Suspense` skeleton so the hero and tabs render instantly.
- Preload the category background images so swapping is instant.

## 5. Admin "Content" section (Phase 2 CMS)
- Rename sidebar group: replace "Landing Page" with a collapsible **Content** group containing: Landing, About, VoltAI, LumiVolt, Finance, Contact, FAQ, Coming Soon, Solar Packages, Smart Locks, Home Automation, Products, Careers.
- Extend the existing `landing_content` table to hold one row per `page_key` (already supports arbitrary JSON). Each static page gets a content schema: `{ hero: {eyebrow, title, subtitle, image}, sections: [...] }`.
- Refactor `About.tsx`, `VoltAi.tsx`, `LumiVolt.tsx`, `Finance.tsx`, `Contact.tsx`, `ComingSoon.tsx`, `FAQSection.tsx` to read copy/images from `useLandingContent(<page_key>)` with the current hardcoded text as fallback (no visual regression if DB row missing).
- Build a generic admin editor `AdminContentEditor.tsx` that takes a page key + schema and renders text inputs, textareas, list editors, and an image picker (uploads to existing `product-images` bucket or new `content-images` bucket).
- Routes: `/admin/content/landing`, `/admin/content/about`, … one per page.

## 6. Admin sidebar mobile/tablet overlap fix
- `AdminLayout.tsx` sidebar uses `absolute bottom-0` for the sign-out block which overlaps the nav when the menu grows past viewport height. Switch the sidebar to a flex column (`flex flex-col h-full`), make the `nav` `flex-1 overflow-y-auto`, and let the user/sign-out block sit at the bottom naturally.
- Add `flex-shrink-0` to header/footer blocks. Verify on 390px and 768px viewports.

## 7. Analytics accuracy
You did not specify which numbers look wrong, so I will do a targeted audit pass:
- De-duplicate page views per session+path within a 30s window (bot/double-fire protection).
- Fix device detection to handle iPad iPadOS 13+ (reports as Mac).
- Filter admin routes (`/admin/*`) out of public traffic counts.
- Recompute "unique visitors" by `count(distinct session_id)` instead of row count.
- Show "Last 7d / 30d / 90d" toggle that actually filters the queries.
If you can tell me which specific chart looked wrong I will go deeper on it.

## 8. SEO pass
- Run `seo_chat--list_findings`, then fix everything in one batch:
  - Per-route `<title>` + `<meta description>` via `react-helmet-async` on the 10 main routes.
  - Add canonical URLs.
  - Add `Organization` JSON-LD in `index.html` with address + phone + hours.
  - Generate `public/sitemap.xml` via `scripts/generate-sitemap.ts` covering all public routes + dynamic packages.
  - Add `public/robots.txt` with sitemap reference if missing.
  - Add alt text audit and `loading="lazy"` to non-hero images.
- Mark findings fixed after each.

## Technical notes
- Storage: reuse `product-images` bucket for content images to avoid a new bucket migration.
- All new tables: `app_waitlist` only. CMS leverages existing `landing_content` with new keys.
- Backward compatibility: every page falls back to its current hardcoded copy if no CMS row exists, so nothing breaks while you populate content.
- Estimated tool calls: ~40–50. I'll ship in the order above, pausing only if a migration needs your approval.

Reply **approve** to start, or tell me to reorder / drop items.