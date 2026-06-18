
# Admin revamp + completeness + SEO/security pass

## 1. Admin Dashboard revamp (`src/pages/AdminDashboard.tsx`)

Current dashboard shows only 4 KPI cards and a recent leads table — too thin for the app's scope (orders, finance, inventory, affiliates, newsletter, careers, AI). Rebuild it as a true command center.

**New layout** (responsive 12-col grid):
- **Top KPI strip (8 cards)**: Revenue today / 7d, Orders pending fulfillment, Leads today, New customers 7d, Active finance plans, Overdue installments, Low-stock SKUs, Newsletter subs.
- **Revenue + leads trend chart** (recharts, 30-day dual line, fed by `orders.created_at` sum + `leads` count).
- **Orders by status donut** (pending → delivered) with click-through to `/admin/orders?status=`.
- **Recent activity feed** (unified stream: new orders, leads, finance apps, career apps, waitlist signups) — pulled from `audit_log` plus realtime channels.
- **Top products this week** (by `order_items` qty) with thumbnail + revenue.
- **Inventory alerts panel** (products where `stock <= low_stock_threshold`).
- **Finance health panel** (next 7-day installments due, overdue count, total receivable).
- **Quick actions row**: New product, New blog post, Send newsletter, Export leads CSV, Open AI assistant.
- **Pending review queue** (career applications, affiliate applications, finance applications awaiting decision) with one-click approve/reject.

All blocks gated by role (staff sees subset; admin sees all). Realtime via Supabase channels on `orders`, `leads`, `finance_applications`.

## 2. Admin completeness audit — fill gaps

Add missing admin surfaces and wire missing controls:

- **`/admin/affiliate-applications`** — review queue for pending affiliate applications (table exists, no admin UI yet). Approve/reject → creates `affiliates` row.
- **`/admin/reports`** — exportable reports hub (leads CSV, orders CSV, finance CSV, affiliates CSV). Surfaces existing `export-csv` edge function in one place.
- **`/admin/storage`** — lightweight media library for `product-images` bucket (browse, upload, delete) — currently only inline in product editor.
- **Order detail drawer** in `/admin/orders` — currently a row; add side drawer with full items, status history timeline, customer notes, manual status change with reason, manual refund flag, and shipping/tracking entry.
- **`/admin/finance/applications`** — confirm Approve/Reject buttons invoke `approve-finance` edge function and generate schedule rows.
- **Finance schedule "Mark paid" + "Send reminder now"** action per installment row (calls `finance-reminders` directly).
- **Discounts**: add "Create code" form (currently only list/usage). Bulk enable/disable.
- **Newsletter**: add scheduled broadcasts (column already there?), open/click stats card.
- **Customers**: add merge duplicates + lifetime value column from orders sum.
- **Audit log**: add filters (actor, entity, date range) + CSV export button.
- **Settings**: confirm tabs cover Business info, Branding, Notifications, Payment methods, Email signatures, AI prompts, Integrations (Telegram/WhatsApp), Maintenance mode.

## 3. Security fixes

From scanner results:

- **`order_items` RLS gap** — add SELECT policy so authenticated owners can read their own items:
  `EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())`.
- **`site_settings` denylist → allowlist** — rewrite "Public can read non-sensitive site settings" policy to whitelist specific safe keys (`general`, `branding`, `social_links`, `hero_content`, `contact_public`, etc.) instead of `key != 'notification_preferences'`. Move any sensitive keys behind admin-only read.
- **Extension in public** (warn) — note in plan but leave unless user wants migration; moving `pg_net`/similar can break existing functions. Will flag and ask before acting.

## 4. SEO fixes

`seo--list_findings` returned no failing items currently, but harden the basics:
- Verify each public route has unique `<title>` + meta description via `SEO` component (sweep: Index, About, LumiVolt, VoltAi, Finance, Packages, Catalog, Contact, Career, Jobs, Blog, BlogPost, Privacy, Terms).
- Confirm `canonical` and `og:url` self-reference per route (already in `SEO.tsx`, just audit usage).
- Add `BreadcrumbList` JSON-LD to deep routes (BlogPost, Customize, Jobs detail).
- Add `Product` JSON-LD to Catalog product cards and `FAQPage` JSON-LD where FAQs exist.
- Trigger a fresh `seo--trigger_scan` at the end so any new gaps surface.

## 5. Technical details

- **Charts**: use `recharts` (already in shadcn `chart.tsx`).
- **Dashboard data**: one parallel `Promise.all` of count/aggregate queries + a single realtime channel that invalidates a react-query key.
- **Role gating**: `useAuth().isAdmin / roles` — staff sees Orders/Leads/Inventory blocks only; admin sees Finance + Affiliates + Audit blocks.
- **Migration**: one SQL file for the two RLS fixes; allowlist values pulled from a brief codebase grep for `site_settings.select`.
- **No new dependencies** required.

## Out of scope (ask before doing)

- Moving extensions out of `public` schema.
- Building per-user SSO providers beyond what's already configured.
- Rewriting individual admin pages beyond the gap list above.

Ready to switch to build mode and implement in this order: security migration → dashboard rewrite → completeness gaps → SEO sweep → rescan.
