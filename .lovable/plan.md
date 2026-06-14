## 1. Admin Settings redesign — Left-rail nav + cards

New `/admin/settings` layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Settings                            [Search settings 🔍] │
├─────────────┬────────────────────────────────────────────┤
│ ◉ General   │  ┌──────────── Section header ─────────┐   │
│   Branding  │  │ Title + subtitle              [Save]│   │
│   Contact   │  ├─────────────────────────────────────┤   │
│   Payments  │  │  Card: Field   Field                │   │
│   Financing │  │  Card: Toggle  Toggle               │   │
│   Shipping  │  └─────────────────────────────────────┘   │
│   Tax       │  ┌── Next card group ──────────────────┐   │
│   ...       │  └─────────────────────────────────────┘   │
└─────────────┴────────────────────────────────────────────┘
```

Components: collapsible left rail (sticky, scroll-spy active state, icon + label, mobile becomes a top sheet/drawer), per-section card groups, inline field hints, image upload chips for logo/favicon/OG image, copy buttons for keys, "Last saved" timestamp, sticky bottom "Unsaved changes" bar with Save/Discard, optimistic save with toast, per-section permission gating (admin-only sections hidden for staff).

Sections (additions in bold): General, Branding, Contact, Payments, Financing, Shipping, **Tax & invoicing**, Affiliates, **Discounts**, **Customers**, Notifications, **Email & templates**, SEO, Social, **Integrations** (Paystack, GA, Meta Pixel, GTM, WhatsApp Business, Telegram, Gmail), Security, **API & webhooks**, **Backups & exports**, **Audit log**, **Feature flags**, Admins.

## 2. New admin areas

**Orders & Inventory**

- `/admin/orders`: filter by status (pending/paid/processing/shipped/delivered/cancelled/refunded), bulk status update, search, date range, payment method filter, export CSV.
- Order detail drawer: customer, items, addresses, payment ref, timeline, internal notes, refund button, resend invoice email, mark shipped + tracking number.
- `/admin/inventory`: stock per product, low-stock threshold, auto low-stock email, bulk stock adjust, stock movements log.
- DB: `orders.status` enum, `order_status_history`, `product_stock_movements`, `products.low_stock_threshold`.

**Discounts**

- `/admin/discounts`: list, create/edit modal.
- Fields: code, type (percent/flat), value, min cart, max uses, per-customer cap, starts_at, expires_at, applies_to (all/categories/products), active.
- Checkout: validate via edge function `validate-discount`, show breakdown.
- DB: `discounts`, `discount_redemptions`.

**Customers CRM**

- `/admin/customers`: profiles + computed LTV, orders count, last order, tags, notes.
- Detail page: timeline (orders, leads, emails sent, page views), manual email send, tag/segment.
- DB: `customer_tags`, `customer_notes`.

**Audit log + exports**

- `/admin/audit-log`: who/what/when, filter by actor/entity/action.
- DB: `audit_log` (actor_id, action, entity, entity_id, diff jsonb, ip, ua). Triggers on `site_settings`, `user_roles`, `discounts`, `orders` status changes. Edge function `log-audit` for app-level events.
- Exports: CSV download buttons on Leads, Orders, Customers, Affiliates, Newsletter. Edge function `export-csv` (admin-gated).

## 3. Flexible Payment — Application + schedule tracking

**Customer flow**

- `/finance` keeps calculator. New "Apply for this plan" button opens `/finance/apply?item=...&amount=...&months=...`.
- Application form: personal, employment, monthly income, ID upload (Storage bucket `finance-docs`), delivery address, plan choice, e-signature checkbox.
- Submit creates `finance_applications` row (status `pending`), notifies admin email.

**Admin flow**

- `/admin/finance/applications`: list, filter by status (pending/under-review/approved/rejected/active/completed/defaulted).
- Review page: applicant data, ID preview, approve → auto-generates `finance_schedules` (N installments, due dates), reject with reason.
- `/admin/finance/schedules`: list of active plans, filter by overdue, mark installment paid with reference, send manual reminder.

**Automation**

- Daily cron edge function `finance-reminders`: emails customers 3 days before due, on due date, and 3/7/14 days overdue; updates schedule item status (`upcoming`/`due`/`overdue`/`paid`).
- Customer self-serve at `/account/finance`: shows their plans, next due, payment instructions, upload proof of payment.

**Tables**: `finance_applications`, `finance_schedules` (application_id, installment_no, due_date, amount, status, paid_at, paid_reference, proof_url), `finance_payments`.

## 4. AI upgrades

All AI runs through Lovable AI Gateway via Supabase Edge Functions using `google/gemini-3-flash-preview` by default.

**Smarter recommender** — upgrade `ai-recommend`

- Inputs: budget, appliances, location, electricity availability, prior lead history, current cart.
- Output: ranked top 3 with one-line reasoning + add-on suggestions. Cached per session.

**Admin AI copilot** — new `/admin/copilot`

- Side panel available across admin (sheet trigger).
- Tools: `summarize_lead(id)`, `draft_email(lead_id, intent)`, `analyze_period(days)`, `generate_blog(topic, keywords)`, `write_product_description(product_id)`, `suggest_discount(scenario)`.
- Uses AI SDK `streamText` + tools, role-gated to admin/staff.

**Site AI chat assistant** — `AiChatWidget` floating bottom-right

- Per `chat-agent-ui-contract`: one conversation, localStorage persistence (no per-user threading initially).
- Knowledge: products, packages, financing terms, contact info pulled into system prompt.
- Tools: `search_products`, `get_finance_quote`, `start_consultation` (creates lead), `handoff_to_whatsapp` (returns wa.me link).
- AI Elements components: Conversation, Message, MessageResponse, PromptInput, Shimmer, Tool. Custom Tioga brand avatar (no Sparkles).
- Toggle in Settings → Feature flags to disable site-wide.

## 5. Security & permissions

- Every new table: GRANT to authenticated + service_role, RLS enabled, policies scoped via `has_role`/`has_any_role`.
- Audit-log writes via SECURITY DEFINER function, reads admin-only.
- Finance docs in private Storage bucket with signed URLs.
- Sidebar visibility: new groups (Finance, Discounts, Customers, Audit) gated by role using existing `can()` helper.

## 6. Mobile

- Settings rail collapses into a top sheet picker on <768px.
- Order/customer detail uses bottom-sheet drawer on mobile.
- AI chat widget: full-screen on mobile, FAB on desktop.

## Technical summary (for reference)

- New tables: `order_status_history`, `product_stock_movements`, `discounts`, `discount_redemptions`, `customer_tags`, `customer_notes`, `audit_log`, `finance_applications`, `finance_schedules`, `finance_payments`, `ai_chat_sessions` (optional, only if persistence requested later).
- New columns: `products.low_stock_threshold`, `orders.tracking_number`, `orders.internal_notes`.
- New Storage bucket: `finance-docs` (private).
- New edge functions: `validate-discount`, `export-csv`, `log-audit`, `finance-reminders` (pg_cron), `ai-solar-size`, `ai-copilot`, `ai-chat`. Upgrade `ai-recommend`.
- pg_cron job for `finance-reminders` (daily 09:00 WAT).
- New routes: `/admin/orders/:id`, `/admin/inventory`, `/admin/discounts`, `/admin/customers`, `/admin/customers/:id`, `/admin/audit-log`, `/admin/finance/applications`, `/admin/finance/applications/:id`, `/admin/finance/schedules`, `/admin/copilot`, `/finance/apply`, `/account/finance`.
- AI Elements install for chat widget: `bun x ai-elements@latest add conversation message prompt-input shimmer tool`.

## Out of scope (ask later)

- Paystack live integration / recurring auto-debit.
- Multi-currency, real shipping rates, refunds via payment processor, 2FA, SAML SSO.
- Per-user AI chat threads in DB (deferred unless requested).