## Scope

Six fixes across the Easy Flex payment flow, header layout, admin AI limits, monthly credit renewal, and the solar_assessments share-token RLS vulnerability.

---

## 1. Easy Flex: enforce deposit-first, then installments

**Problem:** Users can currently attempt installments before the 30% deposit is paid.

**Changes:**
- **`generate-payment-link` edge function** — before returning/generating a link for installment `n ≥ 1`, verify the deposit row (`installment_no = 0`) for that application has `status = 'paid'`. If not, return 409 with `deposit_required: true` and the deposit's own payment link (auto-generate if missing).
- **`AccountFinance.tsx` / `Account.tsx`** — for each application, sort schedules by `installment_no`. Show the **deposit row first** with a prominent "Pay Deposit" CTA. Lock all installment "Pay Now" buttons (disabled + tooltip "Pay deposit first") until deposit `status = 'paid'`. After the deposit is paid, unlock installment 1; keep installments 2+ locked until their `due_date` is within the payment window or user chooses "Pay early".
- **`approve-finance`** — no auto-charge of installments until deposit is confirmed paid (webhook already flips application to `active` on first paid schedule; ensure the retry queue's first entry is installment 1, not 0, and is only enqueued after deposit success).
- **`paystack-webhook`** — when the deposit (installment 0) is marked paid, enqueue installment 1 into `debit_retry_queue` (if auto-debit) so auto-charge only begins post-deposit.

## 2. Easy Flex: dedicated Paystack payment page per installment (like screenshot)

**Problem:** Currently we call `transaction/initialize` which is a one-time checkout URL. The screenshot shows a **Paystack Payment Page** (persistent, branded, `paystack.shop/pay/...`) that customers can revisit and that tracks all payments against one page.

**Changes:**
- **`generate-payment-link`** — switch to Paystack **Payment Pages API** (`POST https://api.paystack.co/page`) per installment:
  - `name`: `"Tioga Easy Flex — {item_name} — Installment {n}/{months}"` (or "Deposit" for #0)
  - `amount`: fixed installment amount in kobo
  - `description`: due date + application ref
  - `slug`: `tioga-ef-{application_id_short}-{installment_no}` (unique, stable, reusable)
  - `metadata`: `{ schedule_id, application_id, installment_no }`
  - `redirect_url`: `https://tiogatechnologies.com/account/finance?paid={schedule_id}`
  - Store returned `page.slug` + full URL (`https://paystack.com/pay/{slug}`) in `finance_schedules.payment_url` and `payment_reference`.
  - Reuse existing page on subsequent calls (idempotent — check for existing `payment_url` before creating a new page).
- **Webhook** — already handles `charge.success` with metadata; verify Payment Pages fire the same event (they do, with `metadata` preserved).
- **UI copy** — "Open Paystack Payment Page" instead of "Pay Now", with a copy-link button so admin/customer can share/re-open.

## 3. Header not showing on Account, AI Plan & Credits, and other authenticated pages

**Problem:** `SiteHeader` is missing or overlapped on `/account`, `/account/subscription` (AI plan & credits), and related pages — content sits under a transparent/absent header with no top margin.

**Changes:**
- Audit these pages for missing `<SiteHeader />` or wrong layout wrapper: `Account.tsx`, `AccountFinance.tsx`, `AccountAssessments.tsx`, `AccountSubscription.tsx`, `AffiliateDashboard.tsx`, `DashboardRouter.tsx`, `FinanceApply.tsx`, `SolarAssessment.tsx`, `SolarAssessmentReport.tsx`.
- Ensure each renders `<SiteHeader />` at top and applies the standard top padding (`pt-24` / matching header height class used elsewhere) so content clears the fixed header.
- Confirm the header's `z-index` and `bg` tokens make it visible over these pages' backgrounds.

## 4. Admin unlimited AI usage

**Problem:** Admins are capped at the same 3-credit free tier as customers.

**Changes:**
- **`ai-chat` / `ai-recommend` / `ai-solar-size` / any AI edge function that checks `assessment_credits` or `ai_credit_usage`** — at the top of the credit check, call `has_role(user_id, 'admin')`. If true, skip the credit deduction and cap entirely (log usage to `ai_credit_usage` with a flag `is_admin: true` for auditing, but do not decrement).
- **Frontend `AccountSubscription.tsx`** — if current user has admin role, show "Unlimited (Admin)" instead of credit balance.

## 5. Monthly automatic renewal of the 3 free credits for all users

**Problem:** Free 3 credits are granted once at signup and never refill.

**Changes:**
- Add `assessment_credits.last_reset_at timestamptz` (migration).
- **New edge function `reset-monthly-free-credits`** — for every row in `assessment_credits`, if `last_reset_at` is null or older than the start of the current month, set `total_credits = GREATEST(total_credits, 3)` (top up to at least 3, never reduce paid credits) and `last_reset_at = date_trunc('month', now())`. Skip users with active paid AI subscriptions (they have their own quotas).
- **pg_cron** — schedule daily at 02:00 UTC using `CRON_SHARED_SECRET`; the function itself is idempotent so daily execution is safe and self-heals missed days.

## 6. Solar assessments share-token RLS vulnerability

**Problem:** `USING (share_token IS NOT NULL)` exposes every shared assessment to any anonymous visitor.

**Fix (edge function approach — safer than JWT claims for public share links):**
- **Migration** — drop the vulnerable policy. Replace with `USING (false)` for anon on the sensitive columns path (deny all direct anon SELECT).
- **New edge function `get-shared-assessment`** — accepts `{ share_token }`, uses service role, queries `solar_assessments WHERE share_token = $1 AND share_token IS NOT NULL LIMIT 1`, returns only the fields intended for public sharing (strip `email`, `phone` unless the customer opted in; keep `full_name`, `location`, `daily_kwh`, `monthly_bill_ngn`, `full_report`).
- **`SolarAssessmentReport.tsx`** — when accessed via a `?token=...` param (public/shared view), call the edge function instead of querying the table directly. Authenticated owner view keeps using the existing owner RLS policy.

---

## Technical Notes

- Paystack Payment Pages docs: `POST /page` returns `{ status, message, data: { id, name, slug, ... } }`. Public URL = `https://paystack.com/pay/{slug}`. Webhook `charge.success` events from a Payment Page include the page's metadata.
- `has_role` security-definer function already exists (`public.has_role(uuid, app_role)`).
- Monthly reset uses `GREATEST` so it never wipes purchased credits — only tops up the free floor.
- Share-token fix uses an edge function rather than JWT claim comparison because share links are opened by unauthenticated visitors and can't carry a JWT claim from Supabase auth.

## Build Order

1. Migration: `assessment_credits.last_reset_at`, drop + replace `solar_assessments` public share policy.
2. Edge functions: rewrite `generate-payment-link` (Payment Pages + deposit guard), new `get-shared-assessment`, new `reset-monthly-free-credits`, patch AI functions for admin bypass, patch `paystack-webhook` to enqueue installment 1 after deposit.
3. pg_cron: schedule monthly credit reset.
4. Frontend: `AccountFinance.tsx` / `Account.tsx` deposit-gating UI + "Open Paystack Page" button; `SolarAssessmentReport.tsx` public path via edge function; `AccountSubscription.tsx` admin unlimited badge; header/padding audit on all authenticated pages.
5. Typecheck.

## Not in Scope

- No change to the Paystack tokenized auto-debit flow beyond gating on deposit success.
- No change to admin approval workflow for finance applications.
