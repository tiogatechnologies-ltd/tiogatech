## Goals
Make the home page feel alive and easy to scan: continuous animation in body sections, real brand logos, more imagery + transitions, smaller helper text, a bounce on the pre-footer Solar/Smart Home/Security tiles, and trimmed wording throughout.

## Changes

### 1. ProblemSection — shrink "Tap for solution"
- Reduce label from `text-[10px]` to `text-[9px]`, lower opacity, move to a corner chip so it never overlaps the headline.
- Show only on hover/focus on desktop; keep a tiny dot indicator at rest.

### 2. SolutionSection — continuous transitions on landing
- Add an always-on subtle Ken Burns zoom + slow pan to each feature image (loops every ~12s, staggered per card) so motion is visible immediately, not only on hover.
- Add a soft shimmer sweep across each card every ~6s.
- Image-to-text hover swap: on hover, image scales and a translucent caption strip slides up with a one-line benefit (already partially present — make it auto-cycle once on first viewport entry to hint the interaction).
- Trim copy: shorter one-line descriptions (≤9 words each).

### 3. TrustSection — real brand logos
- Replace the text-only marquee with image logos.
- Add `src/assets/brands/` with simple SVG/PNG wordmarks for: Tuya, Hikvision, Dahua, Tiandy, Growatt, Deye, SRNE, Lux Power, HDL, LifeSmart, ITEL, Bread.
- Use `imagegen` (transparent PNG, "on a solid white background") to generate clean monochrome wordmark tiles where official assets are not bundled.
- Keep grayscale → color hover, dual-row marquee for density.

### 4. More stock imagery + animations on Home
- ProblemSection: add a parallax background strip (slow translateY on scroll) using an existing `bg-lagos-traffic.jpg`.
- OfferSection: add a small thumbnail image to each of the 3 offer cards (generate `offer-solar.jpg`, `offer-automation.jpg`, `offer-security.jpg`) with `ios-card` hover and a continuous gentle float.
- HowItWorks: add a connecting animated line/progress that draws as the section enters view.
- TargetUsers: add a subtle pulsing ring behind each icon, plus rotate-on-hover already present — add idle micro-bob.

### 5. FinalCTA (pre-footer) — bounce animation on Solar / Smart Home / Security
- Add a new keyframe `bounce-soft` (translateY 0 → -8px → 0, 1.6s, easeOutBack) in `tailwind.config.ts`.
- Apply it to the three benefit tiles with staggered `animationDelay` (0s, 0.2s, 0.4s) so they bounce in a wave, looping infinitely.
- Add hover scale + accent glow.

### 6. Simplify navigation & copy
- Hero subtitle: shorten to "Solar, automation, and security — one seamless system."
- SolutionSection heading description: cut to one sentence.
- OfferSection: trim each highlight bullet to ≤5 words.
- TargetUsers: trim each `desc` to one short sentence.
- FinalCTA paragraph: cut to one sentence.
- Remove the duplicate "Free consultation, no obligations" badge wording — keep just "Free consultation".

### 7. Global animation utilities
- Add to `tailwind.config.ts`:
  - `bounce-soft` (1.6s infinite)
  - `ken-burns` (12s ease-in-out infinite alternate, scale 1 → 1.08 + translate)
  - `shimmer-sweep` (6s linear infinite)
  - `idle-bob` (4s ease-in-out infinite, ±3px)
- Respect `prefers-reduced-motion` (already handled in `index.css`).

## Technical Notes
- Files touched: `src/components/ProblemSection.tsx`, `SolutionSection.tsx`, `TrustSection.tsx`, `OfferSection.tsx`, `TargetUsers.tsx`, `HowItWorks.tsx`, `FinalCTA.tsx`, `Hero.tsx`, `tailwind.config.ts`, `src/index.css`.
- New assets: ~12 brand logo PNGs in `src/assets/brands/` + 3 offer thumbnails in `src/assets/`.
- All colors via semantic tokens; no hardcoded hex.
- No backend or routing changes.

## Out of Scope
- Sub-brand pages (LumiVolt/VoltAi) — already done.
- Catalog/Packages — unchanged.
