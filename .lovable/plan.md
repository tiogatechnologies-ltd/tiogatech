## What I verified this turn

I read `src/lib/adminPages.ts` (39 admin pages), `src/pages/AdminSettings.tsx` (18 setting sections), `src/pages/Account.tsx`, and searched the whole `src/` tree and `supabase/functions/` for reviews and wishlist code.

**Confirmed present and working:** full storefront (catalog, PDPs at `/product/:slug`, cart, checkout with delivery rules, guest order tracking at `/track`), Easy Flex financing end-to-end, solar assessment + AI credits/subscriptions, blog, careers, affiliates, newsletter, support tickets, analytics, and per-role/per-page RBAC.

## Confirmed gaps

**Customer side**
1. **No product reviews or ratings** — no table, no UI. Also blocks `AggregateRating` rich results in search.
2. **No wishlist / save-for-later** — nothing in the codebase.
3. **Account page shows only the 5 most recent orders** (`limit(5)` in `Account.tsx`) with no full order-history page, no per-order detail view, and no reorder action.
4. **No saved delivery addresses** — customers retype their address on every checkout.
5. **No self-service order cancellation or return/refund request** — the only path is WhatsApp/support ticket.

**Admin side**
6. **No review moderation page** (needed only if #1 ships).
7. **No content/SEO health panel** — nothing surfaces posts missing meta descriptions or products missing images/descriptions/prices.
8. **Support tickets have no assignee field and no ageing/SLA indicator**, so triage across staff is manual.
9. **No in-admin notification centre** — new orders, applications and tickets are only visible by opening each page.

## Settings consolidation

Current 18 sections collapse to 12 without losing a single field — every existing settings key is kept, just regrouped under a merged pane with sub-headings:

```text
Storefront   General · Branding & Social · Contact · SEO & Tracking
Commerce     Payments & Financing   (Payments + Flexible Payment)
             Delivery & Tax         (Shipping & Pickup + Tax & Invoicing)
             Promotions             (Discounts + Affiliates)
Comms        Notifications & Email  (Notifications + Email & Templates)
System       Integrations · Security & Access (Security + Admins)
             Feature Flags · Backups & Exports
```

## Proposed work

**Track 1 — Settings merge (small, do first)**
Rewrite the `SECTIONS` array and pane markup in `AdminSettings.tsx` so merged panes render their former sections as labelled sub-cards. Keep the underlying `site_settings` keys (`payment`, `finance`, `shipping`, `tax`, …) unchanged so no migration or data change is needed, and keep the `adminOnly` flag on system panes.

**Track 2 — Order history & account depth**
Full `/account/orders` list with pagination and an order detail view reusing the `/track` timeline, a reorder button that repopulates the cart, and saved delivery addresses on the profile.

**Track 3 — Reviews**
`product_reviews` table (RLS: only verified purchasers write, public read of approved rows, GRANTs included), star UI plus review form on the PDP, `AggregateRating` JSON-LD, and an `/admin/reviews` moderation page wired into the RBAC page catalog.

**Track 4 — Admin polish**
Ticket assignee + ageing badges, and an SEO/content health panel listing incomplete products and posts.

## Technical notes
- Track 1 is presentation-only — no backend or business-logic change.
- Tracks 3 and 4 add tables/columns and therefore need migrations with explicit `GRANT`s and new entries in `src/lib/adminPages.ts` so role permissions cover the new pages.
- Wishlist (#2) and returns (#5) are deliberately left out of the tracks above; say the word and I'll fold them in.

Tell me which tracks to build — Track 1 alone is a clean first turn.
