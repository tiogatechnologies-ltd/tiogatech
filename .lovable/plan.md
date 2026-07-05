# Plan: Site-wide UX + Finance fixes

## 1. Dialogs — click-outside to close
Audit all custom modals (non-Radix). Radix Dialog/Sheet/Drawer already close on outside click. Focus:
- `EnergyCalculatorDialog.tsx` — already closes on backdrop click (verify).
- `AiUpgradeDialog.tsx`, `AffiliateApplicationDialog.tsx`, `CareerApplicationDialog.tsx`, `CustomSolutionDialog.tsx`, `WaitlistDialog.tsx`, `LeadForm.tsx`, `ImageLightbox.tsx`, `CartDrawer.tsx`, `AiChatWidget.tsx` — ensure backdrop `onClick={close}` + inner `stopPropagation`. Patch any that don't.

## 2. Energy Calculator — "Quick Add Common Appliance"
In `LumiVoltSizer.tsx` (used in `/energy-calculator` and the dialog), add a "Quick Add Common Appliance" section listing chips from `src/data/applianceWatts.ts` grouped by category, each showing name + avg watts. Click adds it to the selected list.

## 3. Retail page → Coming Soon
Header hamburger "Retail" link → route to `/coming-soon` (existing `ComingSoon.tsx`) OR wrap Retail route to render ComingSoon. Update `MegaMenu.tsx` / `SiteHeader.tsx` link.

## 4. "Browse categories" → Packages
Locate the "Browse categories" CTA (likely in `Catalog.tsx` or Hero). Change link to `/packages`.

## 5. Finance page — Easy Flex rebrand + rate correction
- Rename "Flex Lease-to-Own" → "Easy Flex" everywhere (`Finance.tsx`, `FinanceApply.tsx`, `FlexiblePaymentButton.tsx` tooltip, `AccountFinance.tsx` copy, nav labels).
- Verify `src/lib/financeCalc.ts` tiers match: 1M–5M @ 9%, 5M–7.5M @ 15%, 7.6M+ @ 25% — already correct (tier max 7.5M then 7.5M+). Confirm and adjust boundaries so 7.5M–7.6M gap doesn't fall to 25%; set tier2 max=7_500_000, tier3 min=7_500_001. Already matches — no change needed. Just ensure Finance.tsx displays these values from config.
- Add **Requirements** sections on Finance page:
  - "For Imperium Lease-to-Own Customers" (bullet list — will use current standard requirements copy from FinanceApply's document list).
  - "For SMEs" (bullet list — CAC cert, 6 mo bank statement, etc.).

## 6. Flexible Payment popup
On product cards, clicking `FlexiblePaymentButton` currently navigates to `/finance`. Change to open a modal (new `FlexiblePaymentDialog.tsx`) showing:
- Mini plan calculator (reuse `calcPlan` + tenure selector)
- Interest tier table
- **Eligibility** as a `<details>` dropdown
- "Visit full Finance page" button → `/finance`
Keep prop signature (itemName, price, etc.) so no caller changes needed.

## 7. "Talk to an expert" → /contact
Find all "Talk to an expert" / "Talk to expert" CTAs (grep). Point every href/link to `/contact`.

## 8. Finance page cleanup
- Remove "Get an AI assessment" button.
- Remove entire "Ready to own your power?" section (final CTA block).

## 9. Careers page — 3 featured, "See more" reveals rest
In `Career.tsx` / `Jobs.tsx`: slice openings to first 3, add "See more openings" button that reveals the rest (client state).

## 10. Affiliate page — replace yellow
In `AffiliateDashboard.tsx` (+ any affiliate marketing pages), swap yellow (`bg-yellow-*`, `text-yellow-*`, or Solar Gold `#FFD700` used as text on light bg) for a readable token — `text-primary` / `bg-accent` / a darker amber (`text-amber-700 dark:text-amber-300`).

## Files touched (approx)
Edits: `LumiVoltSizer.tsx`, `MegaMenu.tsx`/`SiteHeader.tsx`, `App.tsx` (Retail route), `Catalog.tsx`/Hero (Browse categories), `Finance.tsx`, `FinanceApply.tsx`, `FlexiblePaymentButton.tsx`, `AccountFinance.tsx`, `Career.tsx`, `AffiliateDashboard.tsx`, misc dialog components.
New: `src/components/FlexiblePaymentDialog.tsx`.
No DB changes.

## Questions before I start
1. **"Talk to an expert"** — should it navigate to `/contact` (static form) or open the existing lead-form popup pre-filled? You said Contact page — I'll use `/contact`. Confirm.
2. **Requirements copy** — do you have the exact bullet lists for "Imperium Lease-to-Own Customers" and "SMEs"? If not, I'll draft standard ones (valid ID, 6-month bank statement, proof of address, employment letter / CAC + business account for SMEs) and you can revise.
3. **Retail** — turn the route into Coming Soon page, or just link the menu item to `/coming-soon`? I'll do both (route + link) unless you object.
4. **Affiliate yellow** — replace with brand green (`primary`) or a muted amber? I'll default to `primary` for CTAs and `amber-700` for accents.
