## Part 1 — Finance auto-payment system (largest change)

**Note:** I checked the codebase — there is no existing `payment_events` table and no Silicon Edge HMAC pattern in this project (that must live in a different workspace). I'll create it fresh following Paystack's standard HMAC-SHA512 signature check. Flag: confirm this is OK.

### Database migration
- Add `payment_events` table: `id`, `provider` (default 'paystack'), `event_type`, `reference` (unique), `schedule_id` (fk `finance_schedules`), `application_id` (fk `finance_applications`), `status` (`success|failed|pending`), `amount_ngn`, `raw` jsonb, `created_at`. RLS: users read own (via application), service_role all.
- Add columns to `finance_schedules`: `payment_url text`, `payment_reference text`, `auto_charge_status text` (`scheduled|attempting|failed|manual_required`), `last_charge_error text`.
- Add column to `finance_applications`: `paystack_authorization_code text` (stored as-is; Paystack auth codes are opaque tokens, not raw card data — encryption at rest is provided by Supabase). Add `paystack_customer_code text`.
- Trigger on `finance_applications`: when `status` transitions to `approved`, generate deposit row + N monthly rows in `finance_schedules` using existing `deposit_ngn`, `monthly_payment_ngn`, `months`, `created_at + i months` due dates. Idempotent (skip if rows exist).

### Edge functions
- **`generate-payment-link`** (POST `{schedule_id}`): auth-required, verifies user owns the app OR is admin. Checks `payment_events` for success — returns existing url if paid. Calls Paystack `/transaction/initialize` with schedule amount, stores `authorization_url` + `reference` on the row, returns them.
- **`paystack-webhook`** (public, no JWT): verifies HMAC-SHA512 using `PAYSTACK_SECRET_KEY`. On `charge.success`: idempotent insert into `payment_events` (unique reference), marks matching `finance_schedules` paid, and on the first successful payment for an application stores `authorization.authorization_code` on `finance_applications`.
- **`auto-charge-due`** (invoked by cron, service-role only): finds schedules unpaid & due within 3 days; for each, tries `/transaction/charge_authorization` with stored auth code. Success → mark paid + payment_events. Failure or missing code → call generate-payment-link internally, set `auto_charge_status='manual_required'`.

### Cron
- `pg_cron` daily 09:00 Africa/Lagos → `net.http_post` to `auto-charge-due` with service-role auth header (via `insert` tool, not migration, per rules).

### Frontend (AccountFinance.tsx)
- For each application's next unpaid schedule row: show due date + amount. If `payment_url` set OR it's the first installment unpaid → "Pay Now" button (links to `payment_url`, or triggers `generate-payment-link` first). Else → "Auto-pay scheduled for [date]".

### Secrets required
- `PAYSTACK_SECRET_KEY` (already present ✓)
- Webhook URL to register in Paystack dashboard: I'll surface the URL after deploy.

---

## Part 2 — Plan review "Total cost" line

In `src/pages/FinanceApply.tsx` (line 203 and 267 area) and `src/pages/Finance.tsx` (line 144), insert a new `<Row>` right after "Total repayment" and before "Monthly":
- Label: `Total cost (deposit + repayment)`
- Value: `formatNGN(breakdown.deposit + breakdown.total_repayment)`
- `bold` prop, no color emphasis (matches "Total repayment" styling).

No changes to `financeCalc.ts` — purely derived display.

---

## Part 3 — Blog share component

New `src/components/SharePost.tsx` (reusable):
- Props: `url`, `title`.
- Buttons: X, Facebook, LinkedIn, WhatsApp — each `window.open()` to native share intent URL.
- "Copy link" → `navigator.clipboard.writeText(url)` + sonner toast "Link copied".

Drop into `src/pages/BlogPost.tsx` right after the meta row (below author/date/read-time) and again at the bottom of the article.

---

## Part 4 — Global click-outside + Escape audit

Radix Dialog/Sheet/Drawer components already handle both — no change needed for shadcn dialogs.

Custom overlays to audit and fix if missing:
- `EnergyCalculatorDialog.tsx` ✓ already correct
- `ImageLightbox.tsx` ✓ already correct
- `LeadForm.tsx` ✓ already fixed previously
- `AiChatWidget.tsx`, `CartDrawer.tsx`, `WaitlistDialog.tsx`, `CustomSolutionDialog.tsx`, `AffiliateApplicationDialog.tsx`, `CareerApplicationDialog.tsx`, `FlexiblePaymentDialog.tsx`, `AiUpgradeDialog.tsx` — check each; add backdrop `onClick={close}` + Escape listener where missing.

Mobile hamburger menu (`SiteHeader.tsx` / `MegaMenu.tsx`): add backdrop overlay that closes the menu on tap; ensure Escape key closes it.

I'll only flag confirmation dialogs (destructive delete confirms) — those should stay click-locked.

---

## Part 5 — Smooth scroll audit

Root cause candidates:
- `SmoothScroll.tsx` (Lenis) intercepts wheel events globally. Lenis by default supports keyboard scroll but sometimes breaks Page Down/Space when a container has `overflow: hidden`. I'll verify Lenis config allows keyboard and doesn't block inner scrollables.
- Audit for `overflow: hidden` on root wrappers in `App.tsx`, `index.css`, and page containers. Ensure `body`/`html` allow natural scroll.
- Add `data-lenis-prevent` attribute to inner scroll containers (cart drawer, dialogs, admin sidebars) that need their own scroll.

Fix: keep Lenis but verify no `overflow: hidden` on `<main>` or route wrappers; ensure keyboard scroll works by not calling `preventDefault` on key events.

---

## Files touched

**New:** `supabase/functions/generate-payment-link/index.ts`, `supabase/functions/paystack-webhook/index.ts`, `supabase/functions/auto-charge-due/index.ts`, `src/components/SharePost.tsx`, 1 migration, 1 insert (cron).
**Edited:** `src/pages/FinanceApply.tsx`, `src/pages/Finance.tsx`, `src/pages/AccountFinance.tsx`, `src/pages/BlogPost.tsx`, `src/components/SmoothScroll.tsx`, plus click-outside fixes on any custom dialogs missing them.

Approve to proceed, or tell me which parts to skip / do first.