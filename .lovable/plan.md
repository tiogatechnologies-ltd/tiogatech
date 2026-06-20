## Solar Assessment Platform — Implementation Plan

Transforms the existing lead form into a full solar assessment + gated report platform with engineering review, trial credits, and PDF reports. Reuses existing infrastructure (Lovable Cloud auth, products table, solar_packages, ai-solar-size edge function, lead system, admin dashboard).

---

### Phase 1A — Database Schema

New migration adding:

- **`solar_assessments`** — stores every assessment (logged-in or guest).
  Fields: `user_id` (nullable), `lead_id`, `full_name`, `email`, `phone`, `location`, `building_type`, `occupants`, `appliances` (jsonb: [{name, qty, watts, hours}]), `daily_kwh`, `peak_load_w`, `current_power_situation`, `monthly_bill_ngn`, `recommendation` (jsonb: inverter/battery/panels/backup), `full_report` (jsonb: detailed spec), `status` (draft/basic/full/reviewed/quoted), `engineer_id`, `engineer_notes`, `is_full_unlocked` (bool).
- **`assessment_credits`** — `user_id`, `total_credits` (default 3), `used_credits`, `purchased_credits`.
- **`assessment_reports`** — generated PDF artifacts: `assessment_id`, `pdf_path` (storage), `shared_via` (email/whatsapp/link), `share_token`.
- **`custom_solution_requests`** — `assessment_id` (nullable), name/email/phone/location/requirements, `status`.
- Extend **`profiles`** with `account_type` (individual/business/installer).
- RLS: users see only own rows; admin/staff/engineer see all. New `engineer` role added to `app_role` enum. GRANTs on all new tables.
- Trigger: on new user, insert `assessment_credits` row with 3 free credits.
- Storage bucket: `assessment-reports` (private, signed URLs).

### Phase 1B — AI Recommendation Engine

- Extend existing `ai-solar-size` edge function (or new `solar-assess`) to accept the full appliance list + building context and return:
  - Basic output: inverter kVA, battery kWh, panel count/wattage, backup hours, package category.
  - Full output (gated): load table, peak load, daily kWh, panel arrangement, inverter model suggestions, battery type/voltage, cable sizing, breaker ratings, charge controller, earthing, mounting/space notes, bill of materials matched to `products` table, recommended `solar_packages`.
- Uses Lovable AI Gateway (`google/gemini-2.5-pro` for full report, flash for basic).
- Server-side credit decrement happens in the edge function before returning full report.

### Phase 2 — User Frontend

New/updated pages and components:

- **`/solar-assessment`** (new page) — multi-step wizard replacing the solar branch of the current LeadForm:
  1. Contact + location
  2. Building type + occupants
  3. Appliance picker (reuse `WattsCalculator` + `applianceWatts.ts`, add qty/hours per item)
  4. Power situation + monthly bill
  5. Submit → basic recommendation card
- **Basic recommendation card** — inverter/battery/panels/backup summary + "View Full System Specification" CTA.
- **Auth gate** — unauthenticated users redirected to `/auth?next=/solar-assessment/:id/full`. After login, full report unlocks if credits available; otherwise paywall card.
- **`/solar-assessment/:id/full`** — renders the detailed engineering spec, BoM table, package recommendations, download/share buttons.
- **`/account/assessments`** — list of user's past assessments + remaining credits + re-download/share.
- **PDF generation** — client-side via `jspdf` + `jspdf-autotable` (no new server cost); brand-styled header, customer block, energy analysis, BoM, packages.
- **Share** — email (mailto), WhatsApp (wa.me with summary + link), and tokenized public share link (`/r/:share_token`).
- **Recommended packages section** — pulled from `solar_packages` table filtered by capacity match.
- **"Request Custom Solution" CTA** — opens dialog, creates `custom_solution_requests` row + lead, triggers `notify-new-lead`.

### Phase 3 — Account Type & Trials

- Extend `/auth` signup with account-type radio (Individual/Business/Installer).
- Credit badge in `Account` header showing `X of 3 free analyses left`.
- After credits exhausted: paywall card with WhatsApp CTA ("Contact sales to unlock more reports").

### Phase 4 — Admin / Engineering

New admin surfaces:

- **`/admin/assessments`** — table of all assessments, filters (status, building type, location, date), row drawer with full input + AI output + customer contact.
- **`/admin/assessments/:id`** (Engineering Review Panel) — edit recommendation JSON, approve/modify, add notes, assign engineer, convert to quote/lead, generate quotation PDF.
- **`/admin/custom-requests`** — list of custom solution requests with status pipeline.
- **Dashboard additions**: KPIs for total assessments, assessments today, pending engineering review, top requested system sizes, popular packages, conversion (assessment → order). Add to existing `AdminDashboard.tsx` grid.
- **Sidebar**: new "Assessments" section grouping Assessments, Engineering Queue, Custom Requests.
- **Role gating**: new `engineer` role limited to assessment review + product/package read.
- **User management**: extend `AdminUsers` with credit adjustment (add/reset trial credits).

### Phase 5 — Notifications

Edge functions / triggers:

- New assessment → email admin + customer confirmation (reuse `send-gmail`).
- Full report generated → customer email with PDF link.
- Trial credits at 1 left → in-app banner + email nudge.
- Custom request → admin email + Telegram (existing channel).
- Engineering review completed → customer email with updated spec.

### Phase 6 — Analytics

Extend `AdminAnalytics`:

- Assessments per day chart
- Most common building types
- Average system size (kVA, kWh)
- Top appliances reported
- Geographic heat (state breakdown)
- Conversion funnel: assessment → full unlock → custom request → order

### Out of scope (Phase 2 / future)

- Marketplace, installer network, payment-based credit top-ups, automated procurement, mobile app, real-time monitoring. Wire only the placeholders ("Contact sales to upgrade") for now.

### Technical notes

- No new heavy deps beyond `jspdf` + `jspdf-autotable` (~50KB gz).
- Reuses: `AuthContext`, `useAuth`, `RequireRole`, `applianceWatts.ts`, `WattsCalculator`, `solar_packages` table, `products` table, `ai-solar-size` function, `notify-new-lead`, `send-gmail`, `AdminLayout`.
- All new public-schema tables include GRANTs + RLS in the same migration.
- Engineer role added to `app_role` enum; `has_role`/`has_any_role` already support it.
- PDF generation client-side to avoid serverless cost; share-token route renders read-only HTML report.

### Build order

1. Migration (schema + role + bucket + trigger)
2. `solar-assess` edge function (basic + full)
3. `/solar-assessment` wizard + basic result card
4. Auth gate + credit logic + full report page + PDF + share
5. `/account/assessments` + credit badge
6. Admin: assessments list + engineering panel + custom requests
7. Dashboard KPIs + analytics extensions
8. Notification wiring
