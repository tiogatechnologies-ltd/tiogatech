## Goal
Rebuild the `/catalog` page (browse view — when there's no AI recommendation state) into a modern, Shopify-style storefront: clean category browsing, filters tucked behind buttons, marketing-driven product rails, and a tidy responsive grid. Preserve the existing AI-recommendation flow (the version rendered when users arrive from the guided lead form with `location.state`) — only revamp the general browse experience.

## Scope
- File: `src/pages/Catalog.tsx` (browse mode only)
- Reuse existing `ProductCard`, cart, tracking, and Supabase product fetch — no schema or business-logic changes.
- Zero backend changes.

## New Browse Layout

### 1. Sticky top toolbar (below site header)
- Search input (filters by name/description/features/tags — client-side).
- "Filters" button → opens a shadcn `Sheet` (slides from right on desktop, bottom on mobile) containing:
  - Category checkboxes (Solar, Smart Locks, Smart Home, CCTV)
  - Tier checkboxes (Premium, Mid-tier, Affordable, Entry)
  - Series dropdown (populated from data)
  - Price bucket (Under ₦500k / ₦500k–₦1M / ₦1M–₦3M / ₦3M+ / Price on request)
  - "Clear all" + "Show N results" footer buttons
- Sort dropdown: Recommended · Lowest price · Highest price · Newest · Name A–Z.
- Active-filter chips row (dismissible) directly under the toolbar.

### 2. Category pill nav
- Horizontal scrollable pills: "All", "Solar", "Smart Locks", "Smart Home", "CCTV", each with icon + count.
- Sticks under toolbar on scroll; snap-scroll on mobile.

### 3. Marketing rails (only shown on "All" view, hidden when a filter/category is active)
Horizontal scroll rails, each 1–1.5 cards wide on mobile, 3–4 on desktop:
- **⭐ Top Recommended** — products tagged `recommended` or top-tier picks per category (curated by tier=premium + featured tag fallback).
- **🔥 Best Sellers** — highest `product_clicks` count (already tracked); fallback to a static curated list if empty.
- **💰 Lowest Prices** — cheapest 8 items with a real numeric price.
- **✨ New Arrivals** — most recent by `created_at`.
- **🎁 Bundle & Save** — items where `tags` includes `combo` or `series` includes "Combo".

Each rail: title + "See all →" link that pre-applies the equivalent filter/sort.

### 4. Product grid
- Responsive grid: 2 cols on mobile, 3 on tablet, 4 on desktop (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`).
- Cards get lightweight marketing badges layered onto the existing `ProductCard` (top-left corner):
  - "Best Seller" (top 10% clicks)
  - "Great Value" (lowest 25% priced within its category)
  - "New" (created within last 30 days)
  - "Popular Pick" (premium tier)
- Add a subtle "N sold this week" style social-proof line using rounded click counts (e.g. "12+ interested this week"). Keep it soft, no fake data — only shows when clicks > 0.
- Grouped section headers when no filter is active: cards render in category sections with sticky mini-headers ("Solar Products · 24 items").

### 5. Empty & loading states
- Skeleton cards while fetching (6 shimmer tiles).
- Empty state: friendly illustration + "Reset filters" CTA when no matches.

### 6. Mobile polish
- Sticky bottom "Filters (3)" floating button on mobile as a secondary trigger for the sheet.
- Cart button already in header; ensure toolbar collapses cleanly under 375px.
- Touch targets ≥ 44px; horizontal rails use `snap-x snap-mandatory`.

## Preserved behavior
- Guided-form arrival (`location.state.products`) still shows AI recommendation section + curated picks first, then the new browse grid below.
- `ProductCard`, cart add, tracking, WhatsApp chat, FlexiblePaymentButton unchanged.
- Pagination retained at the bottom of the flat grid view (15/page).
- SEO, `SiteHeader`, `SiteFooter`, `ImageLightbox` unchanged.

## Technical notes
- Extract browse-mode UI into a `CatalogBrowse` component inside `Catalog.tsx` (or a new `src/components/catalog/` folder with `FilterSheet.tsx`, `CategoryPills.tsx`, `MarketingRail.tsx`, `ProductBadges.tsx`).
- Use existing shadcn `Sheet`, `Select`, `Checkbox`, `Badge`, `ScrollArea`, `Input`.
- All colors via semantic tokens (`primary`, `accent`, `muted`, `card`) — no hard-coded hex.
- Client-side filtering/sorting only (data already fetched); memoize derived rails and filtered lists.
- Marketing badges computed once via `useMemo` over `allProducts`.

## Out of scope
- Product detail pages, wishlist, reviews, price editing.
- Any change to AI recommendation logic.
- Server-side pagination or new DB columns.

Confirm and I'll implement.
