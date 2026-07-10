## Scope

Extend the existing finance system (`finance_applications`, `finance_schedules`, `finance_payments`, `payment_events` + `paystack-webhook`, `auto-charge-due`, `generate-payment-link`, `approve-finance`) to cover: direct-debit consent + tokenization, auto-debit retry queue, admin due-date overrides, early liquidation, and a real "Flexible payment plan" option on the checkout page. No parallel `payment_plans`/`enrollments` tables — I'll add columns to what exists. No "access_on_enrollment" gating (physical goods only).

## 1. Schema additions (single migration)

**`finance_applications`** — add:
- `direct_debit_consent` bool, `consent_timestamp` timestamptz, `consent_ip` text
- `effective_payment_method` text (`manual` | `auto_debit` | `fallback_manual`)
- `is_asset_financing` bool (default true — solar/hardware today)
- `monthly_principal_ngn`, `monthly_interest_ngn`, `total_interest_ngn` numeric (populated on approval)
- `deadline_date` date (nullable; reserved for future non-asset plans, no revocation logic wired now)

**`finance_schedules`** — add:
- `original_due_date` date (backfill from `due_date`)
- `override_reason` text (nullable)

**New `debit_retry_queue`** — `id`, `schedule_id` FK, `application_id` FK, `scheduled_date`, `attempt_number` int, `max_attempts` int default 3, `status` (`pending`/`success`/`failed`/`abandoned`/`fallback_sent`), `last_error`, timestamps. RLS: service role only; admins SELECT via `has_role(auth.uid(),'admin')`.

**New `due_date_overrides`** — `id`, `schedule_id`, `application_id`, `installment_no`, `original_due_date`, `new_due_date`, `reason`, `overridden_by` (uuid), `created_at`. RLS: service role only; admins SELECT via `has_role`.

Every new table gets: `GRANT` block (service_role ALL, authenticated SELECT only where policy allows), `ENABLE RLS`, then policies. Existing `payment_events` idempotency: add unique index on `(provider, reference, event_type)` if not present, plus a `paystack_event_id` column mirroring Paystack's event id for stronger dedupe.

Trigger update: extend `generate_finance_schedule_on_approval` to also compute and store `monthly_principal_ngn` / `monthly_interest_ngn` / `total_interest_ngn` on the application row.

## 2. Edge functions

- **`generate-payment-link`** (existing) — no change beyond already-added `force` + auto-pick-next.
- **`approve-finance`** (existing) — extend to write the amortization fields; if `effective_payment_method='auto_debit'` and consent present, initialize Paystack `charge` with `channels:['card']` for tokenization on the deposit, then enqueue installments into `debit_retry_queue` with `scheduled_date = due_date`.
- **`paystack-webhook`** (existing) — add: idempotency guard on `paystack_event_id`; on first successful auto-debit charge, store `paystack_authorization_code` **only if `authorization.reusable === true`**, else set `effective_payment_method='fallback_manual'` and call `generate-payment-link` for the next installment; handle `charge.failed` (log + increment retry attempt); handle `refund.processed` (decrement `installments_paid`-equivalent via schedule status revert + reactivate).
- **`auto-charge-due`** (existing daily cron) — rewrite to consume `debit_retry_queue`. On Paystack `send_otp` response, mark `fallback_sent`, generate a manual link, do not retry silently. After `max_attempts` failures, mark the application `overdue` (existing status enum already includes it via schedule status; add `overdue` handling on application if missing).
- **`check-overdue-and-deadlines`** (new daily cron) — marks schedules `overdue` where `due_date < today` and `status IN ('upcoming','due')`; no access revocation (per user).
- **`admin-override-due-date`** (new) — admin-only (verify `has_role`); inserts into `due_date_overrides` and updates `finance_schedules.due_date`, preserving `original_due_date`.
- **`calculate-liquidation`** (new) — returns `{ installments_paid, outstanding_principal, this_month_interest, payoff_amount }` using `outstanding_principal = financed_amount − (installments_paid × monthly_principal)` and `payoff_amount = monthly_interest + outstanding_principal`.
- **`liquidate-finance`** (new) — validates ownership, calls `calculate-liquidation`, calls `generate-payment-link` with the payoff amount + `metadata.liquidation:true`; webhook handler on `charge.success` with that flag marks application `status='completed'` and remaining schedules `paid`.

Cron: `auto-charge-due` (already daily) + new `check-overdue-and-deadlines` daily via pg_cron using `CRON_SHARED_SECRET`.

## 3. Checkout page (`src/pages/Checkout.tsx`)

- Default `payment` state → `"paystack"` (not `bank_transfer`).
- Reorder methods: **Card/Paystack → Bank Transfer → Flexible Plan → WhatsApp** (WhatsApp copy reframed as human-assisted fallback).
- Convert the "Need a flexible payment plan?" banner into a real 4th radio option `"flexible"`. When selected, expand inline:
  - Duration selector (3/6/12 months) using existing `site_settings.finance` rates.
  - Live-computed deposit (30%) + monthly repayment via `src/lib/financeCalc.ts`.
  - Copy: "Liquidate anytime — pay only this month's interest + remaining principal. No prepayment penalty."
  - Sub-choice: Manual installments vs Auto-debit. Auto-debit reveals the consent component (Section 4) and requires it checked to submit.
- Submit for `flexible`: create a `finance_applications` row (status `pending`) instead of an order, then navigate to `/account/finance` with a success toast. (Approval remains admin-gated so nothing auto-charges without review.)

## 4. Direct-debit consent component (`src/components/DirectDebitConsent.tsx`)

Checkbox + disclosure copy exactly as specified (Paystack PCI-DSS, per-charge amount, 24h reminder, non-reusable-card fallback, cancel via tiogatechnologies@gmail.com without cancelling debt). Rendered in Checkout flexible flow and in `FinanceApply.tsx` when auto-debit is chosen. Consent state + timestamp + IP (client-provided placeholder; real IP captured server-side in `approve-finance`) written to the application row.

## 5. Liquidation UI (`src/pages/AccountFinance.tsx` and `src/pages/Account.tsx`)

For each active/approved asset-financing application, add "Liquidate Now" button → opens dialog → calls `calculate-liquidation`, shows the 4-line breakdown, "Confirm & Pay" calls `liquidate-finance` and redirects to the Paystack authorization URL.

## 6. Terms & Conditions (`src/pages/Terms.tsx`)

Add Section 8 (Installment Payments & Direct Debit Authorization, 8.1–8.10) + 8.11 early liquidation clause (that month's interest + outstanding principal, no prepayment penalty).

## 7. Security

`PAYSTACK_SECRET_KEY` already exists as an edge-function secret — no code changes there. Verify no client bundle or committed file references it (grep during implementation).

## Build order

1. Migration (schema + RLS + trigger update + indexes).
2. Update `paystack-webhook`, `approve-finance`, `auto-charge-due`; add `check-overdue-and-deadlines`, `admin-override-due-date`, `calculate-liquidation`, `liquidate-finance`.
3. Schedule new cron job.
4. `DirectDebitConsent` component.
5. Checkout revamp (reorder, default, flexible option, consent wiring).
6. `FinanceApply.tsx` — surface auto-debit + consent.
7. `AccountFinance.tsx` / `Account.tsx` — Liquidate Now dialog.
8. `Terms.tsx` — Section 8 + 8.11.
9. Grep for hardcoded Paystack key; typecheck.

## Not in scope

- No parallel `payment_plans`/`enrollments` tables.
- No `access_granted` gating (physical products only; overdue is a follow-up flag on the schedule, not a lockout).
- No non-asset-financing plans wired end-to-end (columns exist for future use).
- Admin UI for `admin-override-due-date` is API-only in this pass; a UI can follow.
