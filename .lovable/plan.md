# Tioga Technologies 2.0 — Phased Build Plan

Existing green primary stays. We layer in **Midnight Navy (#0A192F)** as a new deep surface and keep **Solar Gold (#FFD700)** as the CTA accent (already close to current accent). Green remains the eco/success token.

---

## Phase 1 — Design tokens + Header / Mega-Menu

**Tokens (`src/index.css`, `tailwind.config.ts`)**
- Add `--midnight: 215 64% 11%` (#0A192F) and `--solar-gold: 51 100% 50%` (#FFD700).
- Bump `--secondary` to midnight navy so existing dark surfaces (footer, hero overlays) gain depth.
- Tighten accent gold to #FFD700.
- Add Plus Jakarta Sans alongside Poppins/Inter (fallback chain only — no font swap on body).
- Add a `.no-clip` utility (`overflow: visible; padding-block: 0.15em`) for animated headings to prevent descender clipping.

**Header (`SiteHeader.tsx`)**
- Frosted glass on scroll already present; deepen to `bg-midnight/70 backdrop-blur-xl` when on dark.
- Replace flat link list with: Home, Products (mega), Packages, Store, How It Works, Career, About, Contact.
- New `MegaMenu.tsx` shown on Products hover/focus:
  - Left col: LumiVolt (Residential) · VoltAi (Smart Automation) — sub-brand cards.
  - Right col: 6-tile grid (Smart Lock, CCTV, Smart Lights, Solar Inverter, Panels, Batteries) → each links to `/store?cat=...`.
- Add **AI Recommendation** glow badge next to Get Started CTA. Pulsing gold ring, opens existing `LeadForm`.
- Mobile: collapse mega-menu into accordion inside the existing sheet.

## Phase 2 — Hero motion + Body components

**Hero (`Hero.tsx`)**
- Headline: "One system. Everything connected." with letter-stagger reveal (framer-motion-free; CSS keyframe per span).
- Rotating sub-text cycling through the 3 phrases every 3.5s.
- Find/replace `5.2KW` → `5.2KWp` across hero graphics/content.
- Wrap headline in `.no-clip`.

**Problem/Solution flip cards (`ProblemSection.tsx`)**
- Convert tiles to 3D Y-axis flip on hover (desktop) and on first-tap (mobile, via `onClick` toggle).
- Front: light card + vector icon; Back: midnight bg + gold text describing Tioga's solution.

**Solutions grid (`SolutionSection.tsx`)**
- Add scroll-reveal float-in (reuse `useScrollReveal`).
- Hover: image scale 1.1 inside `overflow-hidden` container + sliding "Learn More →" overlay.

**Counters (`StatsSection.tsx`)**
- Replace static numbers with `useCountUp` hook driven by IntersectionObserver.
- Add animated mesh/solar-wave SVG background behind the strip.

## Phase 3 — Trust + AI quote modal polish

**Brand carousel (`TrustSection.tsx`)**
- Infinite marquee (already in tailwind config) of grayscale logos: TUYA, AlpSolarr, ITEL, SRNE, Hikvision, Tiandy, Dahua, HDL, Lux Power, Bread, Tiaco, Fireman, LifeSmart, Dawnice. Hover → full color via `grayscale-0` transition. Logos rendered as text-pill placeholders where image assets are unavailable.

**Quote modal (`LeadForm.tsx`)**
- Replace top `Progress` bar with a "liquid fill" gradient bar (gold → green) that animates width with spring easing.
- No flow logic changes (per your answer — reuse existing form).

## Phase 4 — Footer, new pages, QC

**Footer (`SiteFooter.tsx`)**
- 4 columns: Company · Solutions · Support · Newsletter (email input + high-contrast gold CTA).
- Move "Why Us" section into About page hero/below-hero band.

**New pages**
- `src/pages/Packages.tsx` — curated bundle cards (Starter Solar, Smart Home Essentials, Total Security, Whole-Home Combo) using existing product-bundle memory. CTA opens LeadForm.
- `src/pages/Career.tsx` — intro hero, "Why work at Tioga" trio, open-roles list (placeholder + "No openings, send your CV" mailto), simple application CTA.
- Routes wired in `App.tsx`. Both use shared `PageHero` + `SiteHeader` + `SiteFooter`.
- Store: nav "Store" link points to existing `/catalog` (still gated). No new page.

**QC pass**
- Audit hero/section headings for descender clipping; apply `.no-clip` where needed.
- Ensure `html { scroll-behavior: smooth }` (already set).
- Verify flip cards toggle on mobile tap.
- Lighthouse-style pass on mobile 390px.

---

## Technical notes
- No DB migrations. Pure frontend.
- No new dependencies — animations via Tailwind keyframes + CSS transforms; counter via lightweight custom hook; mega-menu via Radix `NavigationMenu` (already installed).
- Color memory (`mem://design/colors`) updated after Phase 1 to record navy + refined gold.
- Memory `mem://features/navigation-ctas` updated after Phase 1 to reflect mega-menu structure.

I'll ship Phase 1 first and pause for your review before continuing to Phase 2.