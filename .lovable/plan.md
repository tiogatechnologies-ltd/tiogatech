## Plan: Fix identified issues + global inconsistencies

### 1. Remove Google login
- Remove Google button + `handleGoogle` from `src/pages/Auth.tsx` and the `signInWithGoogle` usage from `src/components/AccountButton.tsx`/anywhere else.
- Strip `signInWithGoogle` from `AuthContext.tsx` (keep interface tidy).
- Disable Google provider via `configure_social_auth` (`disable_providers: ["google"]`).

### 2. Admin accounts showing as "customer"
Root cause: `handle_new_user()` trigger inserts `customer` role for every new signup, and the profile badge shows the first role in the array. Admins retain both `admin` + `customer`.
- Data fix: DELETE `customer` rows from `user_roles` for users who also have `admin` or `staff`.
- Trigger fix: update `handle_new_user()` to skip inserting `customer` when a role already exists (idempotent) — already partially handled by `grant_admin_for_verified_tioga_email`, but that runs on email confirm; ensure it also removes `customer` (it does). Add a safeguard: prefer highest-priority role in UI.
- Frontend fix: in `AccountButton.tsx` and profile/dashboard displays, compute a single `primaryRole` = admin > staff > engineer > affiliate > customer, and render that.

### 3. Subscribe button text
- `src/pages/AccountSubscription.tsx`: change `cta: "Subscribe via WhatsApp"` → `"Subscribe"` for both plans; change the button label logic (line 290) to render `"Manage plan"` / `"Subscribe"` instead of WhatsApp copy; swap `MessageCircle` icon for a neutral one; ensure `onClick` calls the Paystack init flow (already wired via `AiUpgradeDialog`) and never opens `wa.me`.

### 4. Duplicate "Back to LumiVolt" on Energy Calculator
- `src/pages/EnergyCalculator.tsx` renders the link twice (lines 78 & 91). Remove one — keep the top-of-page one inside the hero, drop the second.

### 5. Role-based dashboards
- Create a `/dashboard` route that inspects `roles` and redirects:
  - admin/staff → `/admin`
  - affiliate → `/affiliate`
  - engineer → `/admin/assessments` (review queue)
  - customer → `/account`
- Update post-login redirect in `Auth.tsx` to use this single entry point.
- In `AccountButton.tsx` menu, show role-appropriate quick links only (hide "My AI assessments" for pure affiliates, etc.).
- No new role tables — reuse existing `user_roles` + `has_role`.

### 6. Flex Lease-to-Own submission failing
- Audit `src/pages/FinanceApply.tsx` submit handler: check the insert into `finance_applications`, storage upload to `finance-docs`, and any RLS policy on INSERT for authenticated users.
- Add try/catch with `toast.error(err.message)` and a visible inline error state.
- Verify the file-upload path uses `${user.id}/...` to satisfy storage RLS.
- If the RLS policy is missing an INSERT rule scoped to `auth.uid() = user_id`, add a migration.

### Global scan — additional inconsistencies I'll fix in the same pass
- **Stale role list**: `AppRole` type includes `"user"` which doesn't exist in the enum — remove.
- **`AccountButton` "Staff dashboard"** links to `/admin` even for non-admin staff without permission gates — align with role redirect map.
- **`Auth.tsx` post-login** ignores `staff`, `engineer` — route them via new `/dashboard`.
- **WhatsApp copy leak** in `FinanceApply.tsx` line 211 — reword to "…via email or your account page."
- **`AdminLayout.can()` currently returns `true`** (from earlier "remove restrictions" turn) — restore role-gated nav so non-admin staff don't see admin-only items. Keep the two seed admins fully unrestricted through role, not email hardcoding.
- **`Account.tsx`** hardcoded email check for the "Open Admin Dashboard" button — replace with `isAdmin` check.

### Technical section
Files to edit:
- `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`, `src/components/AccountButton.tsx`
- `src/pages/AccountSubscription.tsx`
- `src/pages/EnergyCalculator.tsx`
- `src/pages/FinanceApply.tsx`
- `src/pages/Account.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/App.tsx` (new `/dashboard` route)
Files to create:
- `src/pages/DashboardRouter.tsx`
Backend:
- Migration: cleanup duplicate customer rows for admin/staff users; ensure `finance_applications` + `finance-docs` bucket have correct INSERT policies scoped to `auth.uid()`.
- `configure_social_auth` to disable Google.

### Out of scope (confirm if you want these too)
- Redesigning the customer dashboard content itself (only routing/gating changes here).
- Building a new "Engineer" workspace UI (currently routes to existing assessments review).

Approve and I'll implement in one build pass.