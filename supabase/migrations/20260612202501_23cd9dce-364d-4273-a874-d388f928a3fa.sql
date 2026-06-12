
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
