## Goal
Ship a complete auth + role-based system, a real e-commerce checkout (Paystack), a "Flexible Payment" CTA on every product/package that routes to the Finance page, and round out the admin + Finance UX.

## 1. Authentication & RBAC

**Roles** (app_role enum extended): `admin`, `staff`, `affiliate`, `customer`.

**Tables**
- Extend `app_role` enum to add `staff` and `customer`.
- `profiles` table: `id (auth.users)`, `full_name`, `phone`, `avatar_url`, timestamps. RLS: user reads/updates own; admin/staff read all.
- Trigger on `auth.users` insert -> creates a profile and assigns `customer` role by default.
- Keep `has_role(_user_id, _role)` security-definer function; add `has_any_role(_user_id, _roles)` helper.
- Backfill existing affiliates so each linked auth user gets the `affiliate` role.
- GRANTs on new tables per Lovable rules.

**Frontend**
- New unified `/auth` page (tabs: Sign in / Sign up / Forgot password) — email + password, Google OAuth, `emailRedirectTo = window.location.origin`.
- New `/reset-password` route.
- `AuthContext` extended: `roles: app_role[]`, `hasRole(r)`, `profile`. Role check uses RPC `has_role`, fired async to avoid deadlock (existing pattern preserved).
- Route guards:
  - `<RequireAuth>` — any signed-in user.
  - `<RequireRole roles={[...]}>` — generic guard. Used for `/admin/*` (admin/staff), `/affiliate/*` (affiliate), `/account/*` (any authed).
- Header: show "Account" dropdown when logged in (My orders, Affiliate dashboard if affiliate, Admin if admin/staff, Sign out).
- Affiliate login is still reachable but reuses the same `/auth` page with a `?role=affiliate` hint.
- Customer pages: `/account` (profile + orders list), `/account/orders/:id`.

**Edge functions / security fixes**
- `create-admin`: handle "email already exists" by detecting the user and just assigning the admin role (resolves earlier 400).
- All edge functions: validate JWT via `getClaims`, enforce role via `has_role` for admin actions.

## 2. Revamped Checkout (Paystack)

Style modeled on the Shopinverse screenshot: single-column, sticky order summary collapsible, clean white surface, large typography, NGN formatting.

**Pages / components**
- `/checkout` route replacing the current cart -> WhatsApp flow. Sections:
  1. Contact (email; pre-filled if logged in; "Sign in" link on the right).
  2. Delivery — Ship / Pickup toggle; Nigerian states dropdown (existing `AddressInput`), city, street, phone.
  3. Shipping method — pulled from `site_settings` (free shipping threshold, flat fee).
  4. Payment — Paystack (default) + "Bank transfer / WhatsApp confirmation" radio + "Flexible payment plan" link to `/finance`.
  5. Billing address (same as shipping toggle).
  6. Sticky bottom "Pay now" button + total breakdown (subtotal, shipping, discount, total in NGN).
- Order summary panel on right (desktop) / collapsible header (mobile).
- Discount code field hitting a future `discounts` table (placeholder for now, validates non-empty only — actual table can come later if requested).

**Paystack integration**
- Two new secrets requested: `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`.
- Edge function `paystack-initialize`: creates order (status `pending`), calls Paystack `/transaction/initialize`, returns `authorization_url`.
- Edge function `paystack-verify`: verifies reference, updates order to `paid`, decrements stock, attributes affiliate commission, fires `notify-new-order` email.
- Edge function `paystack-webhook`: signed via `x-paystack-signature` (HMAC SHA512 with secret); idempotent order status updates.
- Client: redirect to `authorization_url`; success page `/checkout/success?reference=...` calls `paystack-verify`.

**Schema additions to `orders`**: `payment_method` (`paystack` | `bank_transfer` | `whatsapp`), `payment_reference`, `payment_status`, `shipping_method`, `shipping_fee`, `discount_code`, `discount_amount`, `user_id` (nullable for guests), `billing_address` jsonb.

## 3. Flexible Payment CTA

- New small button "Flexible Payment" added to:
  - Product cards in Catalog
  - Solar Packages cards
  - Smart Locks cards
  - Home Automation cards
  - Product detail / customize views
- Behavior: `<Link to="/finance?item={slug}&type={product|package}">` — pure navigation per user choice.
- Finance page reads the query params and shows a small banner "Setting up flexible payment for {item name}" with a prefilled "Get Started" CTA that opens the lead form with the item context.

## 4. Finance Page additions
- Payment plan calculator: input total amount -> auto-shows 30% deposit + monthly breakdown for 3/6/12 months using rates from `site_settings.finance_*`.
- "Apply for financing" button -> opens lead form with `interest = financing` and item context if present.
- "Eligibility checklist" mini-section (valid ID, Nigerian address, employment/business).
- Downloadable PDF "Financing Terms" (static file in /public).
- Existing how-it-works, plans, FAQ kept; copy synced with admin-configurable rates.

## 5. Admin dashboard upgrades
- New sidebar entries (kept inside existing groups):
  - Overview: "Revenue" (new) — daily orders + revenue chart pulling from `orders` paid.
  - Sales: "Customers" page (lists profiles + orders), "Discounts" page (basic CRUD on `discounts` if added).
  - Affiliates: keep existing.
  - System: "Users & Roles" page — list profiles, assign/remove `admin`/`staff`/`affiliate` roles via secure edge function `manage-user-role` (admin-only).
- AdminDashboard summary cards refreshed to include paid revenue, pending payouts, conversion rate, new customers (last 30d).
- All admin pages wrapped in `<RequireRole roles={["admin","staff"]}>`; super-admin-only sections (Users & Roles, Settings finance/payment) gated to `admin` only.

## 6. Security warning sweep
- Fix any new linter warnings post-migration (search_path on new functions, GRANTs on all new public tables, RLS on every new table).
- Ensure `profiles`, `orders` user_id RLS scoped to `auth.uid()`.
- Add HIBP password check via `configure_auth(password_hibp_enabled: true)`.

## Technical notes
- All new tables follow: CREATE TABLE -> GRANT (authenticated + service_role; no anon) -> ENABLE RLS -> POLICY.
- Update trigger `set_updated_at` reused.
- No changes to `src/integrations/supabase/client.ts` or auto-gen types until migration runs.
- Cart drawer keeps existing behavior plus a new "Checkout" button that routes to `/checkout` instead of WhatsApp (WhatsApp remains as a secondary option).

## Out of scope (ask later if needed)
- Multi-currency, tax engine, refunds UI, real shipping carrier rates, 2FA, SAML SSO.
