# Plan: Smoother Motion + Admin Readiness Audit

## Part 1 — Sitewide motion polish (slower, smoother, more refined)

Goal: make every scroll reveal, page transition, and hover feel slower and silkier (iPhone-like), without changing layout or content.

### 1.1 Smoother page scroll (Lenis tuning)
File: `src/components/SmoothScroll.tsx`
- Lower `lerp` from `0.1` to `0.075` (slower glide, more inertia).
- Add `duration: 1.4` and `easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t))` for an exponential ease-out feel.
- Set `wheelMultiplier: 0.9` so wheel input feels less twitchy.
- Keep reduced-motion guard.

### 1.2 Slower, gentler reveals
File: `src/hooks/useScrollReveal.ts` + `src/components/Reveal.tsx`
- Bump default `duration` from 850ms to 1100ms.
- Default `distance` from 24px to 18px (less travel = calmer).
- Default `threshold` 0.12, `rootMargin` `0px 0px -6% 0px` so reveals fire just before entering view.
- Standardize easing to `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) across all directions.
- Stagger helper: allow `delay` prop to be auto-multiplied via an optional `index` prop on `<Reveal index={i} />` (×80ms per child).

### 1.3 Hover micro-interactions (calmer, longer)
File: `src/index.css`
- `.card-hover`: change transition from 600ms to 700ms `cubic-bezier(0.22,1,0.36,1)`, lift from `-6px` to `-4px`, add a subtle `box-shadow` fade (no scale).
- `.btn-press`: 220ms ease-out, scale `0.985` (less aggressive).
- New `.link-soft` utility: underline grows from 0→100% over 500ms ease-out for inline links.
- New `.img-soft-zoom` utility: image `transform: scale(1)` → `scale(1.03)` on parent hover over 1200ms ease-out (used for OfferSection thumbs as a replacement for the removed Ken Burns, only on hover).

### 1.4 Continuous animation tuning
File: `tailwind.config.ts`
- `idle-bob` 6s → 7s, range −4px → −3px.
- `shimmer-sweep` 9s → 12s.
- `ken-burns` 22s → 28s (kept only where currently used).
- `marquee` 50s → 70s for the brand row (slower, more premium).
- `float-slow` 6s → 8s, `float-slower` 9s → 12s.

### 1.5 Route transitions
New file: `src/components/RouteFade.tsx` (wraps `<Routes>` children).
- On `location.pathname` change, fade old view out (180ms) and new view in (450ms expo-out + 8px translateY).
- Implemented with a tiny CSS class toggle keyed off `useLocation().pathname` — no extra deps.
- Mounted in `src/App.tsx` around `<Routes>`.

### 1.6 Reduced-motion respect
- Single `@media (prefers-reduced-motion: reduce)` block in `index.css` already exists; extend to also disable RouteFade and reset Lenis.

Out of scope: copy changes, layout changes, new sections.

---

## Part 2 — Admin audit: gaps + tracking readiness

Findings from reviewing `AdminDashboard`, `AdminLeads`, `AdminProducts`, `AdminAnalytics`, `AdminEmail`, `AdminFormQuestions`, `AdminLandingPage`, `AdminSettings`, `AdminLayout`, `usePageTracker`, `tracking.ts`, and `track-pageview` Edge Function.

### 2.1 Tracking gaps (high priority)
Currently tracked: pageviews (via `track-pageview`), conversions table writes from `tracking.ts`. Missing wiring:
- **`cta_click`** — only fired by LeadFormHost on form open. Add to: Hero primary CTAs, sticky mobile CTA, MegaMenu "Get Started", FinalCTA buttons, Footer CTA.
- **`whatsapp_click`** — defined but not invoked anywhere. Add to all WhatsApp buttons (Catalog product cards, Contact page, StickyCTA, Footer).
- **`product_click`** — not invoked. Add to Catalog product card click + product detail/lightbox open.
- **`catalog_view`** — fire once per Catalog page mount.
- **`lead_form_started`** — fire when user advances past step 1 of LeadForm.
- **`contact_submitted`** — fire on Contact form success.
- **UTM capture** — read `utm_source/medium/campaign` from URL on first visit, persist in `sessionStorage`, attach to every `conversions.metadata` insert and to lead inserts.
- **Scroll depth** — single util that fires `scroll_depth` (25/50/75/100) per page in `usePageTracker`.
- **Outbound link tracking** — global click listener for external links → `outbound_click`.

### 2.2 Admin features missing / incomplete
- **Dashboard KPIs** (`AdminDashboard`) — verify it shows: today/7d/30d leads, conversion rate (lead/pageview), top source, top product, pending follow-ups. Add any missing tiles.
- **Leads** (`AdminLeads`):
  - CSV export button (already common pattern; confirm + add if absent).
  - Status pipeline view (kanban-lite: new → contacted → qualified → won/lost).
  - Bulk actions (status update, delete, export selected).
  - Notes/activity log per lead with timestamp + admin email.
  - Quick WhatsApp/Call/Email deep-links per row.
  - Assigned-to field (admin user) for multi-admin teams.
- **Products** (`AdminProducts`):
  - Drag-and-drop reordering inside category.
  - Bulk activate/deactivate.
  - Stock/availability flag (in stock / on order / out).
  - "Featured" toggle surfaced on home Offer/Catalog.
- **Form Builder** (`AdminFormQuestions`):
  - Preview mode (renders the live LeadForm with current questions).
  - Question reordering + duplicate.
  - Conditional logic UI (show Q if previous answer = X) — currently encoded in code; expose in UI.
- **Landing Page** (`AdminLandingPage`):
  - Live preview pane.
  - Image upload directly to Storage (replace URL paste flow).
  - Section visibility toggles (hide/show TrustSection, StatsSection, etc.).
- **Email** (`AdminEmail`):
  - Saved templates + variables (`{{lead_name}}`, `{{product}}`).
  - Send-history log table.
  - Test-send to admin before broadcast.
- **Analytics** (`AdminAnalytics`):
  - Date-range comparison (vs previous period).
  - Funnel: pageview → form open → form start → submit.
  - Source/UTM breakdown chart.
  - Per-page conversion table.
  - Export PNG/CSV of each chart.
- **Settings** (`AdminSettings`):
  - SEO defaults (default OG image, meta title/desc per route).
  - Business hours + auto-reply toggle.
  - Multi-recipient notification list (currently single email).
- **Auth/Roles**:
  - Admin user management screen (invite/remove, role: admin/editor/viewer) — currently only `assign-admin-role` Edge Function exists with no UI.
  - Audit log of admin actions.

### 2.3 Customer-readiness gaps (visible site)
- 404 page CTA back to home/catalog (verify NotFound has it).
- Cookie/consent banner for analytics (legal + tracking trust).
- WhatsApp floating button visible on every page (StickyCTA already exists — confirm coverage).
- Email confirmation page after lead submit (currently toast only).
- robots.txt + sitemap.xml — confirm sitemap is generated for all public routes.
- Per-route SEO `<title>` + meta description + OG image (some pages may inherit defaults).

### 2.4 Reliability + ops
- Error boundary at `App.tsx` root with friendly fallback + `error_logged` conversion event.
- Sentry-style client error capture into a `client_errors` table (lightweight).
- Edge Function logs review surface inside Admin (read-only list of recent failures from `notify-new-lead`, `ai-recommend`).

---

## Suggested implementation order (after approval)
1. Motion pass (Part 1) — single PR, low risk.
2. Tracking wiring (2.1) — single PR; unlocks meaningful Analytics.
3. Admin Leads upgrades (2.2 Leads) + CSV export.
4. Analytics funnel + UTM views.
5. Landing Page preview + Storage upload.
6. Admin user management + audit log.
7. Cookie banner + per-route SEO.

## Technical notes (for implementer)
- All animation easings centralized as CSS custom props in `index.css` (`--ease-expo`, `--ease-soft`) so future tweaks are one-line.
- New `conversions.metadata` keys: `utm_source`, `utm_medium`, `utm_campaign`, `referrer_host`, `scroll_depth`.
- New table (later step, not in motion PR): `admin_activity_log (id, admin_id, action, target_table, target_id, metadata, created_at)` with RLS restricted to admins via `has_role`.
- `client_errors (id, session_id, message, stack, page_path, user_agent, created_at)` — insert-only via Edge Function or anon insert with rate-limit RLS.

Confirm to proceed with **Part 1 (motion polish) first**, or pick a different starting slice.
