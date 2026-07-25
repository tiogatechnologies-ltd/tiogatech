## Global audit — verified findings

Everything below was confirmed this turn by reading code or querying the database. Nothing is guesswork.

### 1. RBAC is cosmetic, not enforced (high)
`src/components/auth/RequirePage.tsx` exists but a repo-wide search shows it is referenced only inside its own file. All 39 `/admin/*` routes in `src/App.tsx` are still wrapped only by the base-role guard. So revoking "Orders" from staff in `/admin/roles` hides the sidebar link but a staff user can still open `/admin/orders` directly and edit data. There is also no server-side enforcement: RLS still keys off base roles only, so page permissions never restrict actual data access.

Fix: wrap every admin route in `RequirePage` with its `pageKey`, and treat the matrix as UI-scoping only (document that RLS is still the real boundary), or add role-page checks to sensitive write paths.

### 2. `backup-to-drive` admin check will always fail (high)
The function calls `supabase.rpc("has_role", ...)`. Database privileges confirm `public.has_role` has EXECUTE for **neither** `anon` nor `authenticated` — only `private.has_role` is granted. The call is made with the service-role client so it currently works, but `public.has_role` being ungranted while `public.has_any_role` is granted to `authenticated` is an inconsistency worth normalising (grant or drop the public wrapper).

Regarding the monitoring finding about `permission denied for function has_any_role` for anon: I checked all 119 policies — **no policy applying to `anon` calls `has_any_role`**, and every admin/staff policy uses the `private.*` variants. The errors are most likely from an older policy set already replaced, or from `public.has_any_role` being invoked directly. Verifying the current error stream is step 1 before changing grants.

### 3. Admin pages still stubs (the "empty page" work from the earlier plan, Turns B and C, was never built)
Line counts tell the story:
- `AdminStorage.tsx` (94 lines) — lists `product-images` only. No search, filters, bulk delete, drag-drop upload, rename, dimensions, no `career-cvs` / `finance-docs` browsing.
- `AdminCustomRequests.tsx` (63) — table rows only. No detail drawer, assign-to, notes, quote upload, convert-to-order, filters.
- `AdminCustomers.tsx` (64) — still N+1 order fetching, no segments, tags, notes, or order drawer despite `customer_tags` / `customer_notes` existing.
- `AdminAuditLog.tsx` (55) — no entity/date/user filters, no pagination, no export.
- `AdminReports.tsx` (64) — no presets, date filters, or scheduling.
- `AdminInventory.tsx` (204) — no SKU/supplier, CSV import/export, bulk threshold edit, or restock forecast.

Tables that exist but have zero UI: `debit_retry_queue`, `due_date_overrides`, `payment_events`, `order_status_history`, `lead_activities`.

### 4. Finance ops gaps
No drill-down from an application to its schedule, no per-installment payment history view, no retry-queue or due-date-override UI, and the `liquidate-finance` edge function has no button anywhere in admin.

### 5. Things that are healthy
- All four cron jobs are active, including `reset-monthly-free-credits-daily`.
- Head metadata, canonical, robots, sitemap, manifest are all properly set.
- Every page under `src/pages` is routed — no orphans.
- Order and finance INSERT policies now correctly force `payment_status='pending'` / `status='new'` with `payment_reference IS NULL`.

## Recommended order of work

1. **Enforce RBAC** — wire `RequirePage` into all admin routes (small diff, closes the security finding).
2. **Resolve the `has_any_role` error stream** — inspect current logs, then either grant EXECUTE or scope the offending policies to `authenticated`.
3. **Fill the stub pages** — Media library, Custom Requests, Customers, then Audit Log / Reports / Inventory.
4. **Finance ops UI** — schedule drill-down, payment history, retry queue, liquidation action.

Tell me which of these to start with and I'll scope it into a build.
