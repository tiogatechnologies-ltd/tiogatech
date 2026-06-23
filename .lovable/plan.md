## Tioga Flex Lease-to-Own + AI Subscription Integration

Three coordinated workstreams replace the current finance model, add a paid AI tier, and stitch the assessment → quote → finance → install pipeline together.

---

### 1. Lease-to-Own Finance Overhaul (replaces current model)

**Database (`site_settings.finance`)** — new structure:

```json
{
  "deposit_pct": 0.30,
  "insurance_pct": 0.02,
  "management_pct": 0.01,
  "tenures_months": [12, 24],
  "interest_tiers": [
    { "min": 1000000, "max": 5000000, "rate": 0.09 },
    { "min": 5000001, "max": 7500000, "rate": 0.15 },
    { "min": 7500001, "max": null,    "rate": 0.25 }
  ],
  "vat_pct": 0.075,
  "install_pct": 0.10
}
```

**`finance_applications`** — add columns:
- `interest_rate_pct numeric`
- `insurance_fee_ngn numeric`
- `management_fee_ngn numeric`
- `total_repayment_ngn numeric`
- `tenure_months int` (kept; constrained to 12 or 24)

**Flagship packages** seeded into `solar_packages` + BoM items in `products`:
- Package A: 6KVA / 48V / 15.36kWh — ₦8,185,402.50 total
- Package B: 11KVA / 48V / 20.48kWh — ₦12,033,762.50 total

Each package row stores BoQ JSON (item, qty, price), equipment subtotal, VAT (7.5%), install (10%), and the auto-derived monthly payments for 12 & 24 months.

**Frontend updates**

- `src/pages/Finance.tsx` — new calculator: pick package (or enter cost) → shows deposit, tiered interest auto-selected, insurance, management, total repayment, and side-by-side 12-mo vs 24-mo monthly figures. Mirrors the proposal's amortization layout.
- `src/pages/FinanceApply.tsx` — 3-step form: plan/package → applicant + eligibility docs (ID, utility bill, bank statement, employment/business doc, BVN/NIN, optional guarantor) → review. Uploads to `finance-docs` bucket.
- `src/components/FlexiblePaymentButton.tsx` — propagate package selection.
- New `src/lib/financeCalc.ts` — single source of truth for the formula; used by Finance page, FinanceApply, and `approve-finance` edge function.

**Edge function**

- `approve-finance` — rewrite calculation to: deposit = 30%; financed = 70%; interest tier lookup; total = financed + interest + insurance + mgmt; monthly = total / tenure. Schedule generation unchanged shape.

**Admin**

- `AdminFinanceApplications.tsx` — show full breakdown (interest tier, insurance, mgmt, total repayment) in detail drawer.
- `AdminSettings.tsx` — editor for deposit %, insurance %, mgmt %, tier table, tenures.

---

### 2. AI Subscription Paywall (Free 3 + ₦2,500/mo)

**Database — new table `ai_subscriptions`**:

| Field | Notes |
|---|---|
| `user_id` | unique |
| `plan` | enum `free` / `starter` / `business` (business surfaced as "Contact sales") |
| `status` | `active` / `expired` / `pending` |
| `started_at`, `expires_at` | manual admin-controlled |
| `monthly_price_ngn` | default 2500 |
| `granted_by` | admin user id |
| `notes` | text |

RLS: user reads own row; admin/staff full access; service_role for edge functions.

**Credit/paywall logic**

- Existing `assessment_credits` (3 free) stays for guests & free tier.
- `solar-assess` and `ai-recommend` edge functions: before charging a credit, check `ai_subscriptions` — active starter/business = unlimited, skip credit decrement.
- When free credits exhausted AND no active subscription:
  - Edge function returns `{ error: "subscription_required" }` HTTP 402.
  - Frontend shows upgrade dialog (new `src/components/AiUpgradeDialog.tsx`) with two plan cards (Starter ₦2,500/mo, Business "Contact sales") and a WhatsApp CTA to sales.

**Pages**

- `src/pages/Pricing.tsx` (new) — `/ai-pricing`: lists Free, Starter (₦2,500/mo), Business plans + feature matrix + WhatsApp CTA.
- `src/pages/AccountAssessments.tsx` — replace "X credits left" badge with subscription state ("Free — 2/3 uses left" or "Starter — unlimited until DD MMM").
- `src/components/AiChatWidget.tsx`, `LumiVoltSizer.tsx`, `SolarAssessment.tsx` — gate behind the same paywall check.

**Admin**

- New `src/pages/AdminAiSubscriptions.tsx` (`/admin/ai-subscriptions`):
  - Table of all subscriptions, filter by plan/status.
  - "Grant subscription" action: pick user, plan, duration (1/3/6/12 months), notes → inserts row, emails user.
  - "Revoke" action.
  - Linked from sidebar under existing Assessments group.

No payment gateway — all activation is manual via this admin page (WhatsApp/bank confirmation off-platform).

---

### 3. End-to-End Journey Wiring (AI → Quote → Finance → Install)

**SolarAssessmentReport.tsx**

- After the recommendation, add a "Next steps" section with three CTAs:
  1. **Get formal quote** — opens existing `CustomSolutionDialog` prefilled with assessment summary, inverter/battery/panel sizing, contact info.
  2. **Apply for Flex Pay** — deep-links to `/finance/apply?package=<matched_slug>&assessment=<id>`. If a flagship package matches the recommended sizing (≤6kVA → Package A, 7–11kVA → Package B), preselect it; otherwise pass through total cost from BoM.
  3. **Schedule installation** — WhatsApp link with assessment ID.

**FinanceApply.tsx**

- Read `package` and `assessment` query params; prefill item_name, total cost, BoM reference, and applicant fields from the assessment's contact block (when logged-in user owns it).
- On submit, write `assessment_id` into the new column `finance_applications.assessment_id` so admin can see the full lineage.

**Admin lineage**

- `AdminAssessments` row drawer adds links: "Quote requests (N)", "Finance applications (N)" filtered by assessment_id.
- `AdminFinanceApplications` drawer adds "View source assessment" link.

**Migration adds**: `finance_applications.assessment_id uuid references solar_assessments(id)`.

---

### Build order

1. Migration: `finance_applications` columns, `ai_subscriptions` table + grants + RLS, package seed inserts.
2. `src/lib/financeCalc.ts` + `Finance.tsx` rewrite + `approve-finance` edge function update.
3. `FinanceApply.tsx` rewrite (eligibility docs + package param).
4. `ai_subscriptions` paywall: edge function gating, `AiUpgradeDialog`, `Pricing.tsx`, account badge.
5. `AdminAiSubscriptions.tsx` + sidebar entry + `AdminFinanceApplications` drawer breakdown + `AdminSettings` finance editor.
6. SolarAssessmentReport "Next steps" CTAs + lineage links in admin pages.
7. Update sitemap + nav (Footer/MegaMenu link to `/ai-pricing`).

### Out of scope

- Online subscription billing (Paystack/Stripe) — manual only for now.
- Bank API integration — interest tiers are computed locally; admin still manually approves each application.
- Mobile app, marketplace, installer network (Phase 2 placeholders only).
