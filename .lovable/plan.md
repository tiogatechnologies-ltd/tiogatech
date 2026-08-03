# Affiliate Portal: full link, tracking and payout dashboard

## The core problem first

The current affiliate dashboard is effectively broken for real affiliates. It reads the `affiliates`, `leads` and `orders` tables straight from the browser, but the access rules on all three are admin-only (orders are limited to a user's own orders). Only the payouts table has an affiliate rule. A signed-in affiliate therefore gets an empty page telling them they are "not an active affiliate yet".

So the first job is to serve the dashboard through a secure backend endpoint that verifies who the affiliate is and returns only their own data. Everything else is built on top of that.

## What affiliates get

### 1. Overview
- Clicks, leads, orders, conversion rate, referred revenue, commission earned, paid out, pending balance.
- 30/90-day trend chart, plus a top-performing links table.
- Their code, commission rate and account status.

### 2. Link manager (the main addition)
- Build a link: pick a landing page (home, catalog, a specific product, packages, finance, solar assessment, contact) and set `utm_source`, `utm_medium`, `utm_campaign`, plus optional `utm_term` and `utm_content`. The affiliate code is always attached automatically.
- Save it with a nickname ("IG bio link", "WhatsApp status Jan").
- Every saved link gets a short URL, `tiogatechnologies.com/r/<slug>`, that redirects to the full UTM link and records the click.
- Downloadable QR code per link (PNG), generated in the browser.
- Per-link stats: clicks, unique visitors, leads, orders, revenue, conversion rate.
- Copy, rename, archive and delete links. Preset templates for Instagram, WhatsApp, Facebook, X, TikTok and email.

### 3. Referrals
- Full list of referred leads (name, contact, product interest, status, date) and referred orders with values and payment status, filterable by date range and by which link brought them in. CSV export.

### 4. Payouts, self-service
- Payout history with statement links.
- Editable payout details (method, bank/account info).
- "Request payout" button once pending commission clears a minimum threshold; creates a request the admin sees in Admin → Affiliates → Payouts and approves or rejects.

### 5. Resources
- Their referral link and code, program terms, commission rate, and the 60-day attribution window explained.

## Admin side
- Admin → Affiliates gains a Links tab showing every affiliate's saved links with click and conversion counts.
- Pending payout requests appear in the payouts view with approve/reject and payment reference entry.

## Technical notes

**Database (new tables):**
- `affiliate_links` — affiliate_id, slug (unique short code), label, destination path, utm_source/medium/campaign/term/content, is_archived, created_at. Affiliates read/write only their own rows; admins see all.
- `affiliate_link_clicks` — link_id, affiliate_id, session_id, referrer, user_agent, device, country, created_at. Written by the redirect function only; readable by the owning affiliate and admins.
- `affiliate_payout_requests` — affiliate_id, amount, status (pending/approved/rejected/paid), note, decided_by, timestamps. Affiliates insert and read their own; admins manage all.
- Add `affiliate_link_slug` to `leads` and `orders` so a lead or sale can be traced to the exact link.
- All tables get explicit grants and row-level rules; nothing new is exposed to anonymous users except the redirect path.

**Edge functions:**
- `affiliate-portal` — verifies the caller's session, resolves their affiliate record by email, and returns overview stats, links with metrics, referrals and payout data in one payload. All aggregation happens server-side, so the browser never needs privileged table access.
- `affiliate-redirect` — public `GET /r/:slug`; logs the click, then 302s to the full destination URL with the affiliate code and UTM parameters attached. Bot user-agents are filtered out of click counts.
- `affiliate-payout-request` — validates the requested amount against the real pending balance before creating a request.

**Frontend:**
- Rewrite `src/pages/AffiliateDashboard.tsx` as a tabbed portal (Overview, Links, Referrals, Payouts, Resources) with the existing card/rounded-3xl styling, sharing components under `src/components/affiliate/`.
- Extend `src/lib/attribution.ts` to also capture `utm_term`, `utm_content` and the link slug, and persist the slug alongside the affiliate code for the same 60-day window so lead and order submissions carry it.
- Add a `/r/:slug` route that immediately forwards to the redirect function, so short links work even when shared as site URLs.
- QR codes generated client-side with the `qrcode` package.
