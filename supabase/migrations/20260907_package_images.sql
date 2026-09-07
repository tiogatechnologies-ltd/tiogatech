-- ============================================================
-- Migration: Add image_url to solar_packages, home_automation_packages, and smart_locks
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Solar Packages: Add image_url column
ALTER TABLE IF EXISTS public.solar_packages
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Home Automation Packages: Add image_url column
ALTER TABLE IF EXISTS public.home_automation_packages
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Smart Locks: Add image_url column
ALTER TABLE IF EXISTS public.smart_locks
  ADD COLUMN IF NOT EXISTS image_url text;

-- 4. CCTV Packages: Ensure image_url column exists
ALTER TABLE IF EXISTS public.cctv_packages
  ADD COLUMN IF NOT EXISTS image_url text;

-- Comment on columns
COMMENT ON COLUMN public.solar_packages.image_url IS 'Custom picture URL or stock image path for the package';
COMMENT ON COLUMN public.home_automation_packages.image_url IS 'Custom picture URL or stock image path for the tier package';
COMMENT ON COLUMN public.smart_locks.image_url IS 'Custom picture URL or stock image path for the lock/accessory';
COMMENT ON COLUMN public.cctv_packages.image_url IS 'Custom picture URL or stock image path for the CCTV package';
