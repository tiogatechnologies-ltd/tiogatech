# Branded Documents, Serial Tracking & Automations

## 1. Document style — yes, we can replicate it

The uploaded quotation is a strong template: a bold company masthead with RC/TIN line, a highlighted bank-details strip, a title + one-line spec summary, a compact Date/Client/Scope table, shaded callout paragraphs with a left accent bar, section headings above bordered tables with a totals row, two-column bullet blocks, and a footer with validity and payment details.

We rebuild the PDF renderer to that structure in Tioga colours (green primary, midnight navy headings, gold accents) and apply it to:

- **Quotation / proposal** — new document generated from a sizing or assessment brief.
- **Customer sizing report** and **internal engineering brief** — restyled to the same look.

Layout blocks to support: masthead, bank/payment strip, meta table, callout box, section heading, item table with totals row, two-column bullets, options comparison table, notes and exclusions, footer.

## 2. Quotation builder

New admin flow from a sizing/assessment brief:

- Pull appliances, load, and recommended system into a draft quote.
- Line items grouped into sections (Inverter, Solar array, Batteries, Balance of system, Labour), each with qty, unit price, total.
- Optional alternative options (e.g. two battery brands) shown as a comparison table like the sample.
- Notes, exclusions, validity period, deposit terms.
- Save, version, download PDF, email to customer, share by WhatsApp link.
- Accepting a quote can create an order or a finance application.

## 3. Serial number tracking

Serials are captured **at fulfilment/dispatch**.

- Each order line gets a serial entry panel in the admin order view; admin enters one serial per unit (qty 3 = 3 serial fields), with scan-friendly input.
- Serials are validated for uniqueness and stored against order, item, product and customer.
- Order cannot be marked *Dispatched* until every serialised line has its serials, unless admin overrides with a reason.
- Serials appear on the receipt PDF and the customer's order page.
- **Serial lookup**: admin search by serial returns product, order, customer, dispatch date, warranty window and claim history.

## 4. Returns / warranty (RMA)

- Customer raises a claim from their order page against a specific serial, choosing a reason and description, with photo upload.
- Claim gets a reference (RMA-1000 style) and a status pipeline: Submitted → Under review → Approved / Rejected → Item received → Repaired / Replaced / Refunded → Closed.
- Admin queue with filters, assignee, internal notes and a timeline of every status change.
- Warranty period per product; the claim form shows whether the serial is in or out of warranty.
- Each status change emails the customer.

## 5. Automations

**Order & payment lifecycle**
- Order placed → confirmation email.
- Payment confirmed → receipt PDF link with items and serials.
- Dispatched → dispatch notice with tracking and serials.
- Delivered / installed → completion note plus warranty summary.
- Abandoned unpaid order → reminder after a set delay, cancel after expiry.

**Finance / Easy Flex**
- Deposit due reminder and deposit receipt.
- Instalment reminders at 5 days, 1 day and on due date, each with the payment link.
- Missed payment → escalating overdue notices and an admin alert.
- Instalment paid → receipt; final payment → completion certificate.

**Lead & sizing follow-up**
- Sizing saved → report email with PDF link.
- No response after 24h and 72h → follow-up nudges.
- Lead untouched for N days → alert to the assigned sales owner.
- Quote sent → reminder before validity expires.

All customer emails go through the existing app-email queue with new branded templates; internal alerts go to the assigned staff member. Every automation is logged so admins can see what fired and when, and each rule can be toggled from Admin → Settings.

## Technical notes

- Rewrite `src/lib/reportPdf.ts` into a block-based renderer (masthead, meta table, callout, section table, options table, bullets, footer) with Tioga tokens; `briefData.ts` feeds it. Quotation, sizing report and engineering brief all use it.
- New tables: `quotes` + `quote_items` (versioned, linked to sizing/assessment/lead), `product_serials` (serial, product, order item, status, warranty_until), `warranty_claims` + reuse of a timeline events table, `automation_runs` for the log, `automation_settings` for toggles. Every table gets GRANTs plus RLS — customers see only their own serials/claims, staff/admin see all.
- Serial entry lives in the admin order drawer; dispatch guard enforced by a database trigger as well as UI.
- Scheduled automations run from a single cron-driven edge function that evaluates due rules, with idempotency keys so nothing double-sends.
- New app-email templates: receipt, dispatch notice, quotation sent, instalment reminder, overdue notice, RMA status update.

## Suggested build order

1. Branded PDF renderer + restyled sizing report and engineering brief.
2. Quotation builder and quote PDF/email.
3. Serial capture at dispatch, receipt with serials, serial lookup.
4. Warranty/RMA flow, customer and admin sides.
5. Automation engine, templates, settings toggles and run log.
