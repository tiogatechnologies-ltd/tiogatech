-- ==============================================================================
-- Tioga Technologies ERP - System, RBAC, Users & Automations Fix
-- Enables full live user synchronization, custom roles, audit log, automations
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. LIVE USER PROFILES & AUTH SYNCHRONIZATION TRIGGER
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function to automatically replicate any signup/OAuth into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = now();

  -- Assign default customer role if no role exists yet
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'customer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill all existing auth.users into public.profiles immediately
INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

-- Ensure admin role for corporate accounts
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com', 'admin@tiogatechnologies.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. CUSTOM ROLES & GRANULAR PERMISSIONS
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  base_role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL,
  page_key TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(role_key, page_key)
);

CREATE TABLE IF NOT EXISTS public.user_custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  custom_role_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default enterprise custom roles
INSERT INTO public.custom_roles (key, label, base_role)
VALUES
  ('sales_director', 'Sales & Marketing Director', 'staff'),
  ('chief_engineer', 'Chief Solar Engineer', 'engineer'),
  ('inventory_officer', 'Warehouse & Logistics Controller', 'staff'),
  ('finance_controller', 'Financial Accountant & Tax Officer', 'staff')
ON CONFLICT (key) DO NOTHING;

-- 3. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  diff JSONB DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. AUTOMATION SETTINGS & RUNS
CREATE TABLE IF NOT EXISTS public.automation_settings (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Automation Rules
INSERT INTO public.automation_settings (key, label, category, enabled, config)
VALUES
  ('welcome_lead_email', 'Send Welcome Email & WhatsApp Link to New Leads', 'Lead Management', true, '{"delay_hours": 0}'),
  ('order_confirmation_dispatch', 'Auto-Dispatch Order Confirmation & FIRS Invoice', 'Sales & Orders', true, '{"delay_hours": 0}'),
  ('low_stock_threshold_alert', 'Warehouse Low Stock Warning (< 5 units)', 'Inventory & ERP', true, '{"min_units": 5}'),
  ('invoice_overdue_reminder', 'Invoice Overdue Payment Followup (7 Days)', 'Finance & Billing', true, '{"days_after": 7}'),
  ('rma_bench_test_escalation', 'Escalate Pending Warranty RMA to Lead Engineer (24h)', 'Warranty & Support', true, '{"delay_hours": 24}'),
  ('commission_payout_notification', 'Notify Field Technician on Approved Bonus Payout', 'Field Operations', true, '{"delay_hours": 0}')
ON CONFLICT (key) DO NOTHING;

-- 5. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ENABLE RLS AND GRANT PERMISSIONS ACROSS ALL SYSTEM TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- SECURITY NOTE (corrected): the original version of this file granted
-- `USING (true) WITH CHECK (true)` to `anon, authenticated` on every one of
-- these tables - i.e. any visitor, logged in or not, could read AND write
-- user_roles (grant themselves admin), profiles, audit_log, site_settings,
-- etc. That was superseded by the properly role-scoped policies below and
-- in full_schema_migration.sql, which is what the live database actually
-- runs. Kept here, corrected, so this file is safe to ever re-run.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custom_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.role_page_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_custom_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;
GRANT ALL ON TABLE public.profiles, public.user_roles, public.custom_roles, public.role_page_permissions, public.user_custom_roles, public.audit_log, public.automation_settings, public.automation_runs, public.site_settings TO service_role;

DROP POLICY IF EXISTS "Allow full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage user_roles" ON public.user_roles;
CREATE POLICY "Admins manage user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on custom_roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Admins manage custom_roles fix" ON public.custom_roles;
CREATE POLICY "Admins manage custom_roles fix" ON public.custom_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on role_page_permissions" ON public.role_page_permissions;
DROP POLICY IF EXISTS "Admins manage role_page_permissions fix" ON public.role_page_permissions;
CREATE POLICY "Admins manage role_page_permissions fix" ON public.role_page_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on user_custom_roles" ON public.user_custom_roles;
DROP POLICY IF EXISTS "Admins manage user_custom_roles fix" ON public.user_custom_roles;
CREATE POLICY "Admins manage user_custom_roles fix" ON public.user_custom_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on audit_log" ON public.audit_log;
DROP POLICY IF EXISTS "Admins read audit_log fix" ON public.audit_log;
CREATE POLICY "Admins read audit_log fix" ON public.audit_log FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "System inserts audit_log fix" ON public.audit_log;
CREATE POLICY "System inserts audit_log fix" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on automation_settings" ON public.automation_settings;
DROP POLICY IF EXISTS "Admins manage automation_settings fix" ON public.automation_settings;
CREATE POLICY "Admins manage automation_settings fix" ON public.automation_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Staff read automation_settings fix" ON public.automation_settings;
CREATE POLICY "Staff read automation_settings fix" ON public.automation_settings FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on automation_runs" ON public.automation_runs;
DROP POLICY IF EXISTS "Admins manage automation_runs fix" ON public.automation_runs;
CREATE POLICY "Admins manage automation_runs fix" ON public.automation_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Staff read automation_runs fix" ON public.automation_runs;
CREATE POLICY "Staff read automation_runs fix" ON public.automation_runs FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins manage site_settings fix" ON public.site_settings;
CREATE POLICY "Admins manage site_settings fix" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone reads site_settings fix" ON public.site_settings;
CREATE POLICY "Anyone reads site_settings fix" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
