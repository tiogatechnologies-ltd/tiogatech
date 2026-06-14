---
name: Flexible Payment
description: Application + repayment schedule tracking for the BNPL-style finance flow
type: feature
---
**Flexible Payment** (June 2026):

- Customer: `/finance` (calculator) → "Apply for this plan" → `/finance/apply` (3-step: plan, details, review). ID upload to `finance-docs` storage (private). `/account/finance` shows their applications + schedules.
- Admin: `/admin/finance/applications` review + approve via `approve-finance` edge function (auto-generates schedule). `/admin/finance/schedules` track installments, mark paid manually with bank reference. Auto-marks overdue.
- Tables: `finance_applications` (status enum: pending/under_review/approved/rejected/active/completed/defaulted/cancelled), `finance_schedules` (installment_no, due_date, status: upcoming/due/paid/overdue/waived), `finance_payments`.
- Rates from `site_settings.finance`: 30% deposit + 3/6/12 months at 23.3/11.7/5.8% markup.
- Paystack recurring auto-debit is OUT OF SCOPE for now (manual payment confirmation only).
