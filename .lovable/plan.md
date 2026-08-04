# Sizing-to-Project Handoff: Customer PDF + Internal Spec Sheet

Turn every self-service sizing/assessment into (a) a shareable customer PDF and (b) a single internal "job brief" that sales and engineering both work from, with a clear handoff trail.

## 1. Customer side — shareable spec PDF

At the end of the calculator / AI recommendation:

- **Download PDF** button generating a branded document: customer details, appliance list with watts/hours/Wh, total load, daily energy, recommended inverter, panel array, battery bank, charge controller, autonomy, and (when unlocked) the bill of materials and engineer summary.
- **Share on WhatsApp** button that opens WhatsApp with a short summary plus a link to the hosted report page (`/report/:token`) so the customer can forward it without attaching a file.
- **Email me my report** — sends the same branded report via the existing transactional email system.
- A stable, tokenised report link so the same document can be reopened later by the customer or a sales rep.

## 2. Internal side — one job brief per enquiry

New admin view: **Sizing Brief** (opened from Leads, LumiVolt Sizings, and Solar Assessments — all three point to the same brief).

Sections in the brief:

- **Customer & lead**: name, phone, email, location, source, UTM/affiliate, date, linked lead record.
- **Load profile**: full appliance table (qty, watts, hours, Wh), total connected load, diversified load, daily kWh, peak demand.
- **Recommended system**: inverter kVA, panel count/wattage/array size, battery bank kWh and voltage, charge controller, autonomy days, sun hours used.
- **Engineering detail** (when a full report exists): cable and breaker sizing, earthing/protection notes, roof area, mounting, bill of materials.
- **Commercials**: matched package(s), indicative price, financing option if the customer started one.
- **Activity timeline**: every status change, note, assignment and quote attached to this enquiry.

Actions on the brief: edit/override any recommended value (with the original kept as "system recommended" vs "engineer revised"), add internal notes, attach a quote, print/export the brief as an engineering PDF for the install team.

## 3. Handoff workflow (lightweight project management)

A single status pipeline shared by sales and engineering:

```text
New  →  Sales review  →  Quoted  →  Customer approved  →  Engineering review
     →  Scheduled  →  Installed  →  Closed
```

- **Assign to** field (sales owner and engineering owner, chosen from staff/engineer users).
- Moving a brief to *Engineering review* notifies the assigned engineer by email; moving to *Customer approved* notifies sales.
- Engineering sees a filtered queue of briefs assigned to them, with revisions and notes.
- Every transition is recorded with actor and timestamp, so nothing is lost between teams.

## 4. Role visibility

- **Sales/staff**: full brief, customer contacts, status, quotes, notes.
- **Engineer**: full technical brief and revision tools; customer contact limited to what's needed for site visits.
- **Admin**: everything, including deletion and reassignment.

Handled through the existing per-role page permission system.

## Technical notes

- New tables: `enquiry_briefs` (or a unified view over `lumivolt_sizings` + `solar_assessments` keyed by lead), `brief_events` (timeline: status, assignment, note), plus assignment/status columns. RLS: owners and privileged roles only; GRANTs for `authenticated` and `service_role`.
- PDF generation reuses the existing `jspdf` + `jspdf-autotable` setup already used in `SolarAssessmentReport.tsx`, extracted into a shared `lib/reportPdf.ts` so the customer PDF and the internal engineering PDF share one renderer.
- Hosted report page uses a server-validated share token (edge function), not a public RLS read.
- Email notifications go through the existing transactional email queue on `notify.tiogatechnologies.com`, with new templates for "your solar report" and internal "brief assigned to you".
- Sizing submissions that currently create no lead will also create/link a `leads` row so sales sees them in one place.

## Suggested build order

1. Shared PDF renderer + customer download/WhatsApp/email on the sizing result.
2. Internal Sizing Brief view with full load and recommendation detail (read-only).
3. Status pipeline, assignment, notes and timeline.
4. Engineer revision of recommended values + engineering PDF export.
5. Notifications and role-scoped queues.
