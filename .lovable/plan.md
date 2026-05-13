## Goal
Make the home page feel buttery and intentional: silky page scrolling, refined section reveals, and consistent hover micro-interactions. Remove the zoom-in/out on the "What We Offer" thumbnails. Other pages stay untouched in this pass.

## Changes

### 1. Stop the Offer zoom
`OfferSection.tsx`
- Remove `animate-ken-burns` and the hover `scale-110` from each thumbnail image.
- Remove `animate-idle-bob` from the floating icon disc (also reads as a zoom).
- Replace with a static image plus a soft hover lift on the whole card and a subtle tint overlay fade.

### 2. Smooth page scrolling (iPhone feel)
- Install `lenis` (Studio Freight). Mount once in `App.tsx` with `lerp: 0.1`, `wheelMultiplier: 1`, `smoothTouch: false` so mobile keeps native momentum.
- Drive a `requestAnimationFrame` loop; respect `prefers-reduced-motion` (skip Lenis init).
- Keep CSS `scroll-behavior: smooth` as fallback.

### 3. Upgrade the reveal hook
`useScrollReveal.ts` becomes `useReveal({ direction, delay, threshold, once })`:
- Directions: `up` (default), `fade`, `left`, `right`, `scale`.
- Uses `IntersectionObserver` with `rootMargin: "0px 0px -10% 0px"` so reveals trigger slightly before entry — feels anticipatory, not late.
- Returns `ref` + a `style` object with `transform` / `opacity` / `transition` (cubic-bezier(0.22, 1, 0.36, 1), 800ms) so we don't depend on Tailwind keyframes for one-shot reveals (smoother on first paint).

New `<Reveal>` wrapper component for ergonomic usage:
```tsx
<Reveal direction="up" delay={120}>...</Reveal>
```

### 4. Apply the new reveal across home sections
Replace the current `animate-fade-up + opacity-0` pattern in:
- `ProblemSection`, `SolutionSection`, `OfferSection`, `StatsSection`, `HowItWorks`, `TargetUsers`, `TrustSection`, `FAQSection`, `FinalCTA`.
- Stagger children with incremental `delay` (90ms steps) for a wave reveal.
- Headline blocks use `direction="up"`, side cards alternate `left` / `right` where layout allows (Solution + How It Works).

### 5. Standardize hover micro-interactions
Single utility class `card-hover` in `index.css`:
```
.card-hover { transition: transform 500ms cubic-bezier(0.22,1,0.36,1),
                          box-shadow 500ms cubic-bezier(0.22,1,0.36,1),
                          border-color 300ms ease; }
.card-hover:hover { transform: translateY(-6px); box-shadow: var(--shadow-elevated); }
```
- Apply to all card grids (Solution, Offer, How It Works, Target Users, Trust reasons).
- Replace ad-hoc `hover:-translate-y-1/2` + `transition-all` combos with this class for consistency.
- Buttons: add `.btn-press` (active scale 0.97, 150ms ease-out).

### 6. Refine continuous animations
- `tailwind.config.ts`: slow `idle-bob` to 6s, soften `shimmer-sweep` to 9s with a longer fade at edges, slow `ken-burns` to 22s (used only on `SolutionSection` and Hero parallax now).
- `Hero.tsx`: keep parallax, but clamp scrollY transform to a max so it never feels "jumpy" on long pages, and add `transition: transform 0.05s linear` to smooth rAF gaps.
- `TrustSection`: pause marquee on hover (`hover:[animation-play-state:paused]`); already GPU-accelerated.

### 7. Respect reduced motion
- `index.css`: a single `@media (prefers-reduced-motion: reduce)` block disabling Ken Burns, idle-bob, shimmer, marquee, blob, and the Lenis loop.

## Technical notes
- Files touched: `src/App.tsx`, `src/index.css`, `src/hooks/useScrollReveal.ts` (rewritten), new `src/components/Reveal.tsx`, `tailwind.config.ts`, and the home section components listed in step 4.
- New dep: `lenis` (~6 KB).
- No backend, routing, or content changes.

## Out of scope
- Other pages (About, Catalog, Packages, etc.) — handled in a follow-up.
- New imagery or copy.
