

## Plan: Real-Time Visitor Tracking, AI Accuracy Fix, and Missing Features

### 1. Real-Time Visitor Tracking

**New table: `page_views`**
```sql
CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  device_type text, -- mobile, tablet, desktop
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- RLS: anyone can insert, admins can read
```

**New edge function: `track-pageview`** - receives page path, session ID, user agent; parses device type from UA string; inserts into `page_views`.

**Frontend tracker**: A lightweight `usePageTracker()` hook in `src/hooks/usePageTracker.ts` that:
- Generates a session ID (stored in sessionStorage)
- Fires on every route change via `useLocation()`
- Calls the edge function with path, referrer, and user agent
- Placed in `App.tsx` inside `<BrowserRouter>`

**Analytics dashboard update** (`AdminAnalytics.tsx`): Add a new "Site Traffic" section showing:
- Total page views, unique sessions, pages per session
- Traffic by page (bar chart)
- Device breakdown (pie chart)
- Real-time visitor count (sessions in last 5 min)
- Traffic trend over time (line chart)

---

### 2. Fix AI Recommendation Accuracy

The AI prompt has product names that don't match the database. Key mismatches found:
- Prompt: `"550-585W Monocrystalline (half-cut or PERC cells)"` vs DB: `"550-585WMonocrystalline"` (no space)
- Prompt lists only 5 panels; DB has 15 panels
- Prompt is missing many inverters (SRNE series has 20 models, prompt lists ~6)
- Prompt missing many batteries (Bread has 9, EOS has 7, PylonTech has 11)

**Fix**: Rewrite the AI edge function to dynamically fetch product names from the database at request time instead of using a hardcoded catalog string. This guarantees 100% name matching and stays in sync when products are added/removed via admin.

```
// Pseudocode
const { data: products } = await supabaseAdmin.from('products')
  .select('name, category, series, price, description, best_for')
  .eq('is_active', true)
  .in('category', relevantCategories);

// Build catalog string from live DB data
const catalogString = products.map(p => `- "${p.name}" ${p.series} - ${p.price || 'Contact for price'}`).join('\n');
```

Also add a validation step: after AI returns recommendations, verify each name exists in the fetched product list and remove any that don't match.

---

### 3. Missing Features Identified

**A. Lead follow-up notes/activity log**
- New table `lead_activities` (lead_id, action_type, note, created_by, created_at)
- Admin can log calls, emails, follow-ups per lead
- Shows timeline in lead detail modal

**B. Product inquiry tracking**
- Track which products users click "Order via WhatsApp" on in the catalog
- New table `product_clicks` (product_id, session_id, created_at)
- Shows "Most Inquired Products" in analytics

**C. Admin notification preferences**
- In Settings, let admin configure notification email recipients
- Store in `site_settings` with key `notification_preferences`

**D. Lead source tracking**
- Add `source` column to `leads` table (values: "website_form", "whatsapp", "referral", "manual")
- Admin can manually add leads with source attribution
- Show source breakdown in analytics

**E. Export/download for analytics**
- CSV export button on the analytics page for all chart data
- PDF report generation option

**F. Dashboard real-time updates**
- Enable Supabase realtime on `leads` and `page_views` tables
- Dashboard auto-refreshes when new leads come in

---

### Files to Create
- `src/hooks/usePageTracker.ts` - page view tracking hook
- `supabase/functions/track-pageview/index.ts` - edge function for tracking

### Files to Modify
- `supabase/functions/ai-recommend/index.ts` - dynamic product fetching from DB
- `src/pages/AdminAnalytics.tsx` - add traffic section, product clicks
- `src/App.tsx` - add page tracker
- `src/pages/Catalog.tsx` - track product clicks
- `src/pages/AdminLeads.tsx` - add activity log UI
- `src/pages/AdminSettings.tsx` - add notification preferences
- `src/pages/AdminDashboard.tsx` - add realtime updates

### Database Changes
- New table: `page_views`
- New table: `lead_activities`
- New table: `product_clicks`
- Add column: `leads.source` (text, default 'website_form')
- Enable realtime on `leads`, `page_views`

### Technical Notes
- The `track-pageview` edge function uses `verify_jwt = false` since anonymous visitors need to be tracked
- Page tracker uses `navigator.sendBeacon` for reliability on page unload
- AI recommendation engine creates a Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY` (already in secrets) to fetch products server-side
- Product click tracking is fire-and-forget to not block UI

