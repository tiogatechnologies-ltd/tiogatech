
## Part 1 — Admin pages audit (what's missing on each)

Reviewed every `/admin/*` page. Notes are per page.

**Dashboard (`/admin`)**
- Only a hero + a few KPI cards. Missing: today vs. yesterday deltas, revenue sparkline, "action needed" queue (overdue installments, pending finance apps, unfulfilled orders, low stock, new leads), quick-links to the most-used tools, recent audit activity, cron/edge-function health.

**Analytics (`/admin/analytics`)**
- Solid. Missing: date-range presets shared across all tabs, CSV export per chart, event drill-down (click on a step → underlying page_views), geo/device breakdown, cohort/retention.

**Orders (`/admin/orders`)**
- Missing: bulk actions (mark paid / fulfilled / cancel), refund via Paystack, order timeline UI (order_status_history is stored but not shown), print/invoice PDF, in-page order detail drawer (currently modal is minimal), delivery-fee & discount breakdown, tracking number field, notes tab per order.

**Customers (`/admin/customers`)**
- N+1 order fetch (one query per profile) — slow. Missing: segment tabs (VIP / repeat / at-risk / dormant, using `customer_tags`), tag editor, notes editor (`customer_notes` table exists), order history drawer, LTV chart, "email selected" bulk action, CSV export, `?view=segments` route actually shows segments.

**Leads (`/admin/leads`)**
- Missing: kanban view (new → contacted → qualified → won/lost), assign-to-staff, activity timeline (`lead_activities` exists), SLA badge (age since created), source & UTM columns, bulk convert-to-customer.

**Discounts (`/admin/discounts`)**
- Missing: applies-to picker (currently just "all"), product/category scoping, redemption list per code, ability to disable without deleting is there, but no schedule preview or usage chart, no test-code validator.

**App Waitlist (`/admin/waitlist`)**
- Missing: export CSV, mark contacted, bulk email/SMS, source breakdown.

**Finance Applications (`/admin/finance/applications`)**
- Missing: filter by status/tenure/amount, aging column, one-click "generate schedule preview" before approve, direct link to schedules, KYC review checklist, ability to reassign reviewer.

**Finance Schedules (`/admin/finance/schedules`)**
- Missing: application → schedule drill-down page, per-installment payment history (`finance_payments`), retry queue view (`debit_retry_queue` table exists but no UI), due-date override log (`due_date_overrides` table exists but no UI), liquidation trigger (`liquidate-finance` function exists but no button), auto-charge status badges.

**Solar Assessments (`/admin/assessments`)**
- Missing: assign engineer, engineer notes editor, unlock/lock full report, mark status (draft/reviewed/delivered), share-link management, PDF export, filter by tier already in tabs but no free-text search.

**LumiVolt Sizings (`/admin/lumivolt-sizings`)**
- Missing: convert to lead/quote, contact button, notes, status field.

**Custom Requests (`/admin/custom-requests`)**
- Very bare. Missing: detail modal (currently row-only), assign-to-staff, quote/attachment upload, convert-to-order, email/WhatsApp actions, filter by status, notes.

**AI Subscriptions (`/admin/ai-subscriptions`)**
- Missing: cancel/refund, extend expiry, manual grant, per-user credit adjust, revenue summary.

**AI Credit Usage (`/admin/ai-usage`)**
- Missing: cost/estimated tokens, per-model breakdown, abuse detector (spikes), top users list, date filter.

**Products / Solar Packages / Smart Locks / Home Automation**
- Products page is complete. The three category pages are lighter: missing gallery manager reuse, drag-to-reorder, duplicate button, "publish/unpublish" toggle visibility, SEO fields.

**Inventory (`/admin/inventory`)**
- Missing: barcode/SKU column, supplier field, reorder threshold bulk edit, CSV import, purchase orders, warehouse locations, forecast (avg daily sales), export.

**Blog (`/admin/blog`)**
- Missing: scheduled publishing UI, revision history, SEO preview, category/tag manager, cover image picker connected to media library.

**Landing Sections / Content (`/admin/landing`, `/admin/content`)**
- Missing: live preview, publish-vs-draft workflow, i18n placeholder.

**Form Builder (`/admin/forms`)**
- Missing: preview mode, per-flow analytics (drop-off), conditional logic UI.

**Newsletter (`/admin/newsletter`)**
- Missing: broadcast open/click stats, subscriber growth chart, segment sends, template gallery.

**Email (`/admin/email`)**
- Missing: sent history from `send-gmail` logs, templates, saved snippets, delivery status.

**Affiliates / Payouts / Analytics**
- Affiliates pages are the most complete. Missing: bulk-approve payouts, tier management UI, referral link QR export, fraud flags.

**Career Listings / Applications**
- Missing: application status pipeline, notes, rating, resume preview in-drawer, bulk reject/email.

**Users & Roles (`/admin/users`)**
- Missing: invite-by-email (create + auto-assign role), impersonate for support (admin only, audited), ban/disable, last-ip/last-device, password reset trigger, role-change audit trail visible inline.

**Audit Log (`/admin/audit-log`)**
- Missing: entity filter dropdown, date range, per-user filter, export, pagination (500-row cap today).

**Settings (`/admin/settings`)**
- Missing: business info (address, phone, WhatsApp, hours), payment settings, delivery zones editor (currently hardcoded Abuja/Jos free), email templates config, cron status.

**Reports (`/admin/reports`)**
- Missing: report presets with filters (date range, status), scheduled email reports, additional entities (finance_schedules, ai_credit_usage, page_views).

**Media Library (`/admin/storage`)**
- Only lists product-images bucket, no folders, no bulk delete, no search, no filter by type, no rename, no `career-cvs`/`finance-docs` browsing (admin-only), no drag-drop upload, no image dimensions.

## Part 2 — RBAC scoping per role

Current state: `AdminLayout` filters groups/items by role, but almost everything defaults to visible for `admin | staff | engineer`. Affiliate has its own `/affiliate` page. Customer has `/account`.

Goal: each non-customer role sees an admin surface tailored to their job.

- **admin** — full access (unchanged).
- **staff** — Sales + Support day-to-day. Sees: Dashboard, Analytics (Revenue+Traffic only), Orders, Customers, Leads, Discounts, Waitlist, Finance Applications (view + comment, no approve), Assessments (basic view), Custom Requests, Blog, Newsletter, Email, Career Applications, Reports, Media library. Hidden: Users & Roles, Audit Log, Settings, Affiliates, Form Builder, Landing Sections, AI Subscriptions billing side, Finance approve/liquidate actions.
- **engineer** — Assessments + Sizings + Custom Requests. Sees: Solar Assessments (full editor, assign to self, engineer notes, unlock report), LumiVolt Sizings, Custom Requests (technical review). Hidden: everything sales/finance/marketing. Landing = `/admin/assessments`.
- **affiliate** — no `/admin` at all. Stays on `/affiliate` dashboard.
- **customer** — no admin.

Implementation:

1. Add explicit `roles` on every nav item/group in `AdminLayout`. Tighten `Admin` route wrappers in `App.tsx` from broad `admin | staff | engineer` to per-page role lists.
2. Add a `usePermissions` hook (`can("approve_finance")`, `can("manage_users")` …) so buttons inside pages (Approve, Delete, Mark Paid, Grant Role) hide when the role can't do the action, even if the page itself is visible.
3. Engineer scope: `/admin` dashboard becomes a redirect to `/admin/assessments` for engineers.
4. Staff-safe finance: hide Approve/Reject/Liquidate; keep read + comment.
5. Server-side: audit RLS policies on `finance_applications`, `finance_schedules`, `finance_payments`, `orders`, `user_roles`, `assessment_credits`, `ai_subscriptions`, `audit_log`, `discounts` — verify each write policy checks `has_role(admin)` where it should (admin-only), and `has_any_role(admin, staff)` for staff-writable tables. Anywhere it's currently "staff or admin" but should be admin-only (payouts approval, role changes, liquidation, settings, audit log read), tighten with a migration.

## Part 3 — Filling in the "empty" pages first

Highest visible impact, in this order:

1. **Media library** — search, filter (mime/size), bulk select+delete, drag-drop upload, image preview lightbox, tabs for `product-images` / `career-cvs` (admin-only) / `finance-docs` (admin-only), rename, dimensions & size, copy-URL and copy-Markdown.
2. **Inventory** — SKU + supplier fields (migration), CSV import/export, bulk threshold edit, top-movers chart, "restock needed" auto-list, export purchase order.
3. **Custom Requests** — full detail drawer, assign-to, notes, quote upload, convert-to-order, WhatsApp/email actions, filters.
4. **Customers** — fix N+1 (single aggregated query), segments tab, tag editor, notes editor, drawer with order history, bulk email.
5. **Audit Log** — entity/date/user filters, pagination, export.
6. **Reports** — presets, date filters, scheduling.
7. **Dashboard** — action-needed queue + sparklines.

## Part 4 — Technical notes

- New tables: none required for Part 3 items 1, 3, 5, 6, 7. For Inventory SKU/supplier, add columns to `products` (nullable, backwards-compatible). Bucket read for `career-cvs` and `finance-docs` needs an edge function that streams admin-only signed URLs (buckets are private).
- New edge functions: `admin-invite-user`, `admin-impersonate` (audited), `admin-storage-signed-url`, `schedule-report`.
- Existing tables already there but unused in UI: `customer_notes`, `customer_tags`, `lead_activities`, `order_status_history`, `debit_retry_queue`, `due_date_overrides`, `payment_events`.
- Every new admin write path must call `log_audit(...)`.
- All RBAC tightening goes through one migration; every table currently accessed by staff/engineer gets a WITH CHECK re-review.

## Scope for this plan

This is a large body of work. I recommend we ship it in three build turns:

- **Turn A — RBAC scoping** (Part 2): nav filtering, per-page route roles, `usePermissions`, engineer redirect, hide destructive actions from staff, RLS migration for the tightening.
- **Turn B — Fill the empty pages** (Part 3 items 1–4): Media library, Inventory, Custom Requests, Customers.
- **Turn C — Ops polish** (Part 3 items 5–7 + admin action queue on Dashboard, Audit filters, Reports presets).

Approve and I'll start with Turn A. If you'd rather I bundle everything into one turn, say so and I will — it will be a large diff.
