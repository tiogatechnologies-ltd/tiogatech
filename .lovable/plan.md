# Plan

Four scoped changes. All frontend/presentation except a small CMS content addition for LumiVolt (reuses existing `useLandingContent` pattern).

## 1. Telegram Live Community Chat Widget

Add a floating Telegram chat bubble (bottom-right) on all public pages.

- Use a hosted widget script. Recommended: **Elfsight Telegram Chat** (no-code, single `<script>` snippet, free tier). Alternatives we can swap to: Social Intents, Re:amaze, Boei.
- Implementation: inject the widget script in `index.html` so it loads on every public route. Hide it on `/admin/*` routes via a small effect that toggles `display:none` on the widget container based on `location.pathname`.
- Required from you: the widget embed snippet (or the Telegram group invite link + we generate via Elfsight). I will use a placeholder snippet and a clearly-marked spot to paste the real one.
- Add a secondary "Join our Telegram Community" button to the footer and Contact page next to the existing social icons.

Note: BotFather tokens are NOT pasted into the website — they live inside the widget provider's dashboard. The site only ever gets a public JS snippet.

## 2. Move VoltAi under the Products mega-menu

- In `src/components/MegaMenu.tsx`: add **VoltAi** (and optionally **LumiVolt**) to the `productHubs` section so they appear inside the Products dropdown.
- In `src/components/SiteHeader.tsx`: remove `VoltAi` (and optionally `LumiVolt`) from the top-level `brandLinks` array, and remove from the mobile top-level nav. Keep them accessible via the Products mobile accordion (`productSubLinks`).

Question for you: should **LumiVolt** also move under Products, or stay as a top-level link? (Default: move both for consistency.)

## 3. Career page → 2 jobs + "See more" → full jobs page

- `src/pages/Career.tsx`: slice job list to first 2, add a "See all openings" CTA.
- New `src/pages/Jobs.tsx` (route `/careers/jobs`): LinkedIn-style listing with:
  - Search bar (title/keyword)
  - Filters: department, location, employment type (full-time/part-time/contract/intern), remote/onsite
  - Category chips for quick filtering
  - Card list with apply CTA reusing existing `CareerApplicationDialog`
- Data source: existing `useCareers` hook + `careers` table. No schema changes needed (existing columns cover department/location/type).
- Add route to `src/App.tsx` and a sitemap entry.

## 4. LumiVolt page — add the new structured content

Extend `src/pages/LumiVolt.tsx` with these new sections, wired to CMS via `useLandingContent` so you can edit text later in Admin → Content:

1. **Project Overview** — short intro paragraph
2. **Core Goal & Impact** — headline + 3 stat callouts (30% cost reduction, 12–18% ROI, $14B market)
3. **The Problem** — 4 cards (Urban Renters & SMEs, Estates & Communities, System Operators, Solar Installers)
4. **Target Audience** — 4-item icon list
5. **Platform Capabilities** — 2-column layout: capabilities list + MVP validation bullets (marketplace+BNPL/BOOT/PAYG, SaaS dashboard with IoT, digital solar reservation + AI underwriting)

Add corresponding rows to `landing_content` for each section (eyebrow/title/subtitle/body) and surface them in `AdminContent.tsx` under the existing LumiVolt tab. Hardcoded fallbacks shipped in the component so the page renders before any CMS edit.

## Technical notes

- No database schema changes. New `landing_content` rows only (data inserts).
- New files: `src/pages/Jobs.tsx`, `src/components/TelegramWidget.tsx` (mount + admin-route hide logic).
- Edited files: `index.html`, `src/App.tsx`, `src/components/SiteHeader.tsx`, `src/components/MegaMenu.tsx`, `src/components/SiteFooter.tsx`, `src/pages/Contact.tsx`, `src/pages/Career.tsx`, `src/pages/LumiVolt.tsx`, `src/pages/AdminContent.tsx`, `public/sitemap.xml`.

## Open questions before I build

1. Which widget provider do you want? (Elfsight recommended — free, fastest.) Do you already have the embed snippet, or should I scaffold a placeholder you paste later?
2. Move **LumiVolt** under Products too, or keep it top-level?
3. Telegram group public invite link (e.g. `https://t.me/+xxxx`) for the "Join Community" button in footer/contact.
