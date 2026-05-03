## Goals

1. Make the hero text smaller and more premium on mobile.
2. Replace the static "Power your smart future with the sun" headline with a rotating typewriter line that cycles through what Tioga covers.
3. Change the "12mo Warranty" stat to "2yrs Warranty".
4. Stop showing a broken/empty image placeholder (with the product name as alt text) for products without a real picture.

## 1. Hero typography on mobile (`src/components/Hero.tsx`)

Current headline classes: `text-5xl sm:text-6xl lg:text-7xl xl:text-8xl` — far too large at 390–414px.

Update to a more refined mobile-first scale:
- Headline: `text-[2.25rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`
- Sub-headline paragraph: `text-base sm:text-lg lg:text-xl`
- Trust pill: shrink padding + `text-[11px] sm:text-sm`, allow wrapping
- CTA buttons: `px-6 py-3 text-sm` on mobile, full-width stacked
- Stat strip numbers: `text-xl sm:text-2xl`
- Tighten section vertical padding on mobile (`pt-24 pb-16 sm:pt-28 sm:pb-20`)

## 2. Rotating typewriter headline

Replace the fixed two-line headline with one cohesive line:

> **Powering Nigerian homes with** *[rotating word]*

Rotating phrases (typewriter: type → hold → delete → next):
- `solar energy.`
- `smart automation.`
- `smart locks.`
- `smart lighting.`
- `security cameras.`
- `intelligent living.`

Implementation:
- Inline `Typewriter` component inside `Hero.tsx` (no new deps).
- Uses `useState` + `useEffect` with `setTimeout`. Typing speed ~70ms, deleting ~40ms, hold ~1400ms.
- Word renders inside a gradient span (keep current `from-accent via-accent to-yellow-300 bg-clip-text`).
- Trailing blinking caret (`|`) using a small CSS animation already-available pattern (add a `caret-blink` keyframe to `tailwind.config.ts`, 1s steps).
- Min-height reserved on the rotating span to prevent layout jump on mobile.
- The decorative floating `Cpu` chip badge moves to sit beside the gradient word but is hidden on mobile (`hidden sm:inline-flex`) so it doesn't clutter small screens.

## 3. Warranty stat

In `Hero.tsx` stat strip, change:
```
{ v: "12mo", l: "Warranty" }
```
to:
```
{ v: "2yrs", l: "Warranty" }
```

## 4. Product image placeholder fix (`src/pages/Catalog.tsx`)

Two issues:
- Some products have an `image_url` value that is empty string, whitespace, or broken — so the `<img>` renders, fails, and the alt text (product name) is what the user sees inside the grey box.
- The grey container itself appears even when image fails.

Fix:
- Treat empty/whitespace `image_url` as missing: `const hasImage = !!product.image_url?.trim();`
- Add `onError` handler to the `<img>` that sets local state `imgFailed = true`, which hides the entire image container.
- Render image alt as empty string (`alt=""`) so a broken image never shows the product name as fallback text. Product name is already shown as the card title below.
- Apply the same logic anywhere else products are rendered with images (verify only `Catalog.tsx` renders product cards — confirmed by search).

## Technical notes

- All changes are client-side only, no DB or edge-function changes.
- Add one keyframe `caret-blink` to `tailwind.config.ts` and matching `animation` entry.
- No new packages.

## Files to change

- `src/components/Hero.tsx` — mobile type scale, rotating typewriter headline, warranty label
- `src/pages/Catalog.tsx` — robust empty/broken image handling, empty alt
- `tailwind.config.ts` — add `caret-blink` keyframe + animation
