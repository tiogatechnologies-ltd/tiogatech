## Priority 1 — Admin access (permanent fix)

**Problem:** `inememmanuel@gmail.com` and `tiogatechnologies@gmail.com` sometimes show as "customer" and get blocked from `/admin`. Existing trigger only covers verified `@tiogatechnologies.com` domain + `inememmanuel@gmail.com`, and only fires on future auth events — it doesn't heal existing rows or the second Gmail address.

**Fix:**

1. **Migration** — extend `grant_admin_for_verified_tioga_email()` to also match `tiogatechnologies@gmail.com` (exact address). Backfill: `INSERT INTO user_roles(user_id,'admin') SELECT id FROM auth.users WHERE lower(email) IN (...) OR lower(split_part(email,'@',2))='tiogatechnologies.com' ON CONFLICT DO NOTHING`. Also **remove** the stray `'customer'` row for these accounts so the UI badge is correct.
2. **Password reset** — reset `inememmanuel@gmail.com` password to `emma2013e` via a one-off admin edge function call (`supabase.auth.admin.updateUserById`) invoked from a new `bootstrap-superadmin` edge function that runs the backfill + password set. Safe because it's guarded by service role and hardcoded email allowlist.
3. **RequireRole race** — `AuthContext.loadUserData` runs async after `setUser`; roles can briefly be `[]` causing `<Navigate to="/">`. Change `RequireRole` to also wait for a `rolesLoaded` flag (new state in AuthContext set true after `loadUserData` resolves), not just `loading`.
4. **AdminLogin** — after successful `signIn`, explicitly `await refreshProfile()` before navigating to `/admin` so the first render already has roles.
5. **Account page role badge** — show highest role (admin > staff > affiliate > customer) instead of first one, so admins never display as "customer". [inememmanuel@gmail.com](mailto:inememmanuel@gmail.com) must always be seen as an admin.

## Priority 2 — Cache issues (users can't see blog/packages)

**Root cause:** SWR layer stores in `sessionStorage` keyed by hook name with no version key. When a migration republishes posts or toggles `published`, stale clients keep serving the old empty payload until the tab is closed.

**Fix:**

1. Add a global `CACHE_VERSION` constant (bumped per deploy via Vite `__BUILD_ID__` define). All SWR hooks (`useBlog`, `useSolarPackages`, `useSmartLocks`, `useHomeAutomationPackages`, `useLandingContent`) prefix their sessionStorage key with the build id; stale versions are ignored and purged.
2. Add a lightweight `site_cache_bust` row in `site_settings` (single row, `updated_at`). On app boot, fetch it once; if newer than local `lastBust`, clear all `tioga:` sessionStorage keys.
3. New **Admin Settings → "Clear website cache" button** that:
  - Bumps `site_cache_bust.updated_at = now()` (all clients invalidate on next load).
  - Calls a new `purge-cache` edge function that: touches the row, and pings `/` with a cache-buster to warm the CDN.
  - Also clears local admin's own storage.
4. Show a small toast "All visitors will fetch fresh data within 60s".
5. Add explicit empty/error/retry state to `Blog.tsx` and `Packages.tsx` so a transient empty fetch no longer looks like "nothing exists".

## Priority 3 — Google Drive backup

1. Use existing `google_drive` connector (already wired) — no new secret needed.
2. New edge function `backup-to-drive`:
  - Dumps key tables to JSON via `service_role` (`profiles`, `orders`, `order_items`, `products`, `solar_packages`, `home_automation_packages`, `smart_locks`, `blog_posts`, `leads`, `finance_applications`, `solar_assessments`, `lumivolt_sizings`, `newsletter_subscribers`, `affiliates`, `user_roles`, `landing_content`, `careers`, `career_applications`).
  - Zips into a single `tioga-backup-YYYY-MM-DD.json` (JSON per table).
  - Uploads to Drive via connector gateway multipart upload into a `Tioga Backups` folder (created if missing).
3. **Admin Settings → "Backups" card:**
  - "Backup now" button → invokes function, shows Drive file link on success.
  - Schedule toggle → `pg_cron` daily 02:00 WAT.
  - Table listing last 10 backups (new `backups_log` table: filename, drive_file_id, size, created_at, status).

## Priority 4 — Routing & UX fixes

1. **Pricing route:** wherever code links to the "2 plans" page (`AccountSubscription`, `AiUpgradeDialog`, AI chat upsell), change every `/pricing` / `/subscription` upgrade link to `/ai-pricing` (the 3-tier page). Audit: `AccountSubscription.tsx`, `AiChatWidget.tsx`, `AiUpgradeDialog.tsx`, Account.tsx CTA.
2. **Merge Pricing with AccountSubscription:** delete standalone `/subscription` page content; make `AccountSubscription` embed the 3-tier pricing grid (Starters/Businesses/Custom) plus the user's current plan card, credits meter, usage history, and "Manage" actions. Redirect old `/subscription` → `/account/subscription`. Keep `/ai-pricing` as the public marketing route that shows the same tier grid without the user-scoped panels.
3. **Energy Calculator → LumiVolt back button:** add a top-of-page "← Back to LumiVolt" link on `EnergyCalculator.tsx` (and inside the popup dialog footer).
4. **Waitlist as popup:**
  - Convert `AppWaitlistForm` into a Dialog-wrapped `WaitlistDialog` (pattern from `EnergyCalculatorDialog`).
  - Everywhere a "Download App" / "Join Waitlist" button exists (Hero, Footer, mobile menu, StickyCTA) → open the dialog instead of navigating to `/coming-soon` or a dedicated waitlist route.
  - Keep `/coming-soon` reachable but no longer the primary CTA target.
5. Add new feature badge to the Energy Calculator, LumiVolt, Finance pages so new users can easily know all the new features that has been added to the website. There should also be occasional popups telling users to try out a new feature so they can be aware.

## Technical notes (non-user-facing)

- Migration is one file: extend trigger fn, backfill roles, drop stray customer rows for the two superadmins, add `site_cache_bust` row + `backups_log` table (with GRANTs + admin-only RLS) + optional `pg_cron` schedule.
- Edge functions: `bootstrap-superadmin` (one-shot, callable by admin only), `backup-to-drive`, `purge-cache`.
- No new external secrets. Google Drive uses the existing connector; Paystack + Lovable AI already configured.
- AuthContext gets a `rolesLoaded` boolean; `RequireRole` blocks render until both `!loading && rolesLoaded`.

## Out of scope

- No visual redesign beyond the merged subscription page.
- Finance, LumiVolt content, checkout flow — untouched.