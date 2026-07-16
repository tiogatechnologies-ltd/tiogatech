## Analytics overhaul plan

### 1. New tracking (starts recording from ship time forward)

**Schema additions to `page_views`** — capture attribution on every hit:
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (text)
- `landing_path` (text, first path of session)
- `is_new_session` (bool)

**Client instrumentation** (`usePageTracker` + `src/lib/tracking.ts`):
- Read UTMs from `location.search` and persist to `sessionStorage` for the session
- Track first page of session as `landing_path` + flag session as new (first hit)
- **Scroll depth** — fire `conversions` events at 25/50/75/100 % once per page
- **Session duration** — on `visibilitychange:hidden` / `pagehide`, send accumulated active-time as a `session_end` conversion
- **Checkout funnel** — new events `checkout_view`, `checkout_step` ({step: contact|delivery|payment}), `checkout_paid` in `Checkout.tsx`
- **AI chat** — `ai_chat_open`, `ai_chat_message` in `AiChatWidget.tsx`
- **Calculator / sizer** — `energy_calculator_submit`, `lumivolt_sizer_submit`
- **Product view** — fire from product detail / catalog card open

All events reuse the existing `conversions` table (event_type + metadata).

### 2. Lead analytics audit — fixes to `AdminAnalytics`

| Issue found | Fix |
|---|---|
| `parseBudget` strips currency but breaks on ranges like "500K-1M" | Parse midpoints for range strings, keep single-value logic |
| Conversion rate treats only `status='converted'` as won, ignores `closed` | Rate = converted / total; add separate "closed lost" metric |
| Location parsing uses second-to-last comma segment — miscounts single-word cities | Normalize with a small city map (Lagos, Abuja, PH, Jos, etc.) + fallback |
| No dedup by phone/email — a repeated submission double-counts | Add "unique leads" KPI counting distinct phone+email |
| `source` fallback lumps all "website_form" — missing UTM breakdown | Cross-reference `utm_source`/`utm_medium`/`utm_campaign` columns already on `leads` |
| Growth vs previous period uses period=0 as 0-baseline | Skip growth pill when period=0 (All time) |

### 3. New tabs on `/admin/analytics`

Reworked tab bar: **Overview · Leads · Revenue · Traffic · Funnels · Performance**

**Overview** — top-line KPIs across all domains + 30-day trend spark.

**Revenue** (new)
- Gross revenue (paid orders only), net revenue (minus discounts), pending revenue
- AOV, orders count, paid vs pending vs cancelled split
- Top 10 products by revenue (from `order_items` × parsed `price_label`)
- Revenue by state (from `shipping_address` → state), payment method, source
- Discount usage: redemptions, total discounted, top codes
- Daily revenue trend chart

**Traffic** (expanded)
- Sessions, page views, unique visitors, pages/session, avg session duration, bounce rate
- New vs returning sessions
- Top sources / referrers, top UTM campaigns
- Top landing pages, top exit pages
- Country / city map list, device split
- Traffic trend (daily/weekly)

**Funnels** (new)
- Site funnel: Sessions → Product views → Cart adds → Checkout views → Paid orders (with drop-off %)
- Assessment funnel: Assessment starts → Basic completes → Full unlocks → Subscribes
- Lead funnel: Landing → Lead form open → Lead submitted → Contacted → Converted

**Leads** — audited existing charts, add UTM/campaign breakdown card.

**Performance** — unchanged (LCP/INP/CLS + errors).

### 4. Data-fetch fixes
- Paginate `orders`, `order_items`, `conversions` past PostgREST's 1k cap (same pattern already applied to `page_views`)
- Server-side date filter by selected period on every big query

### Technical notes
- New tracking events use existing `conversions` insert policy (bounds are already length-checked). Add `event_type` values to the `ConversionEvent` union in `src/lib/tracking.ts`.
- Bounce = sessions with exactly 1 page_view AND no conversion event.
- Avg session duration = median of `session_end.metadata.duration_ms` (median, not mean, to resist outliers).
- New vs returning = based on whether session_id has a stored `first_seen` in a new `visitor_sessions` view derived from `page_views` (`min(created_at) < 24h ago` = new).
- Landing page = row in `page_views` where `is_new_session=true`.

### Files touched
- `supabase/migrations/*` — add columns to `page_views`
- `src/hooks/usePageTracker.ts` — UTMs, landing, new-session flag, scroll depth, session duration
- `src/lib/tracking.ts` — expand `ConversionEvent` union, add helpers
- `supabase/functions/track-pageview/index.ts` — persist new columns
- `src/pages/Checkout.tsx`, `src/components/AiChatWidget.tsx`, `src/components/EnergyCalculatorDialog.tsx`, `src/components/LumiVoltSizer.tsx`, `src/pages/Catalog.tsx` — event calls
- `src/pages/AdminAnalytics.tsx` — full rewrite of tabs + charts + fetchers