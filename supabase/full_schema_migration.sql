-- Full Idempotent Schema Migration for Tioga Technologies
-- Project: xwxskzwceghftlcsbyyh
-- Generated automatically

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema usage to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Pre-define all ENUM types with complete values upfront
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'staff', 'affiliate', 'customer', 'engineer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_plan AS ENUM ('free', 'starter', 'business');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_sub_status AS ENUM ('active', 'expired', 'pending', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ==========================================
-- Migration: 20260318202339_a54f1530-1e3f-4279-9546-e16d3c0269d3.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  products TEXT[] NOT NULL DEFAULT '{}',
  has_electricity TEXT,
  main_goal TEXT,
  appliances TEXT[] DEFAULT '{}',
  budget TEXT,
  timeline TEXT,
  notes TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);


-- ==========================================
-- Migration: 20260320072702_733af759-0c45-4b8b-b31e-596a668af6d6.sql
-- ==========================================


-- User roles enum and table
-- Pre-declared public.app_role ENUM

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can read all roles, users can read their own
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- BUGFIX: no INSERT/UPDATE/DELETE policy existed for user_roles anywhere in
-- this schema, so with RLS enabled and no matching policy, ALL role writes
-- were silently rejected - AdminUsers.tsx could never actually assign,
-- change or remove anyone's role, even for a genuine admin.
DROP POLICY IF EXISTS "Admins manage user roles" ON public.user_roles;
CREATE POLICY "Admins manage user roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Products table (replaces hardcoded data)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  series text,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  best_for text NOT NULL DEFAULT '',
  price text,
  tier text NOT NULL DEFAULT 'entry' CHECK (tier IN ('premium', 'mid', 'affordable', 'entry')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Admins can do everything on products
DROP POLICY IF EXISTS "Admins full access on products" ON public.products;
CREATE POLICY "Admins full access on products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Admins can modify site settings
DROP POLICY IF EXISTS "Admins can modify site settings" ON public.site_settings;
CREATE POLICY "Admins can modify site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read leads
DROP POLICY IF EXISTS "Admins can read leads" ON public.leads;
CREATE POLICY "Admins can read leads" ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update leads
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete leads
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ==========================================
-- Migration: 20260321095352_0cf94184-f781-45e1-bc72-1c169bbbbe23.sql
-- ==========================================

-- Add image_url column to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read product images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Allow admins to upload product images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update product images
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete product images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Migration: 20260322132118_c1f9b4b4-5f6e-4df4-8218-7061d51d21ff.sql
-- ==========================================


-- Add status column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

-- Create form_questions table
CREATE TABLE IF NOT EXISTS public.form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  step_key text NOT NULL,
  question_text text NOT NULL,
  subtitle text,
  question_type text NOT NULL DEFAULT 'single_select',
  options jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on form_questions" ON public.form_questions;
CREATE POLICY "Admins full access on form_questions" ON public.form_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read active form_questions" ON public.form_questions;
CREATE POLICY "Anyone can read active form_questions" ON public.form_questions
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Create landing_content table
CREATE TABLE IF NOT EXISTS public.landing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on landing_content" ON public.landing_content;
CREATE POLICY "Admins full access on landing_content" ON public.landing_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read landing_content" ON public.landing_content;
CREATE POLICY "Anyone can read landing_content" ON public.landing_content
  FOR SELECT TO anon, authenticated
  USING (true);

-- Add tags and specifications to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;


-- ==========================================
-- Migration: 20260410104224_b8af455d-060b-4354-bf3c-2b14e37d7972.sql
-- ==========================================


-- 1. Page views table
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read page views" ON public.page_views;
CREATE POLICY "Admins can read page views" ON public.page_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views (session_id);

-- 2. Lead activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on lead_activities" ON public.lead_activities;
CREATE POLICY "Admins full access on lead_activities" ON public.lead_activities FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities (lead_id);

-- 3. Product clicks table
CREATE TABLE IF NOT EXISTS public.product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;
CREATE POLICY "Anyone can insert product clicks" ON public.product_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read product clicks" ON public.product_clicks;
CREATE POLICY "Admins can read product clicks" ON public.product_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON public.product_clicks (product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_created_at ON public.product_clicks (created_at DESC);

-- 4. Add source column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website_form';

-- 5. Enable realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;


-- ==========================================
-- Migration: 20260502081610_4d0d7f06-0ae3-4449-865b-93a8dae006cd.sql
-- ==========================================

-- Conversion event tracking
CREATE TABLE IF NOT EXISTS public.conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  page_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert conversions" ON public.conversions;
CREATE POLICY "Anyone can insert conversions" ON public.conversions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read conversions" ON public.conversions;
CREATE POLICY "Admins can read conversions" ON public.conversions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_conversions_event_type ON public.conversions(event_type);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_session ON public.conversions(session_id);

-- ==========================================
-- Migration: 20260503084314_2ae75806-ac47-449b-8755-f1557f707a0a.sql
-- ==========================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images" ON public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins manage product_images" ON public.product_images;
CREATE POLICY "Admins manage product_images" ON public.product_images for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.product_images_enforce_single_primary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_primary then
    update public.product_images
      set is_primary = false
      where product_id = NEW.product_id and id <> NEW.id;
  end if;
  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS trg_product_images_single_primary ON public.product_images;
CREATE TRIGGER trg_product_images_single_primary after insert or update of is_primary ON public.product_images
for each row when (NEW.is_primary)
execute function public.product_images_enforce_single_primary();

-- ==========================================
-- Migration: 20260513153815_0723e795-bf96-4e08-8da6-3f13a7bbe5fb.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.careers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  requirements text NOT NULL DEFAULT '',
  email_subject text NOT NULL DEFAULT '',
  deadline text NOT NULL DEFAULT '30th May, 2026',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active careers" ON public.careers;
CREATE POLICY "Anyone can read active careers" ON public.careers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins full access on careers" ON public.careers;
CREATE POLICY "Admins full access on careers" ON public.careers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.careers (title, location, summary, highlights, requirements, email_subject, sort_order) VALUES
('Call for Partnership — Nationwide Installers', 'Nationwide, Nigeria', 'Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions, integrated inverters and lithium battery systems, that reduce grid dependence.', ARRAY['Attractive commission structure','Reduce client grid dependence','Access to premium hardware stack'], 'Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.', 'Application - Partnership (Nationwide Installer)', 1),
('Engineering Force — Project Engineers & Solar Installers', 'Lagos | Abuja | Jos', 'Contract-based roles for engineers who can design, install and commission PV and ESS storage systems at scale.', ARRAY['2 to 5 years in Renewable Energy or Electrical Engineering','PV, ESS Storage and commissioning experience','Field-ready, safety-first mindset'], 'HND / B.Eng in Electrical Engineering or related field. COREN / NSE certification is an advantage.', 'Application - Project Engineer / Solar Installer', 2),
('Admin / Sales Representative', 'Jos', 'Front-line role supporting customers, coordinating quotes and keeping the Jos office running smoothly.', ARRAY['1 to 3 years in Admin or Sales','Strong multitasking and customer service skills','Comfortable with CRM and basic reporting'], 'Minimum OND / HND / B.Sc in any related discipline.', 'Application - Admin/Sales Representative (Jos)', 3),
('Business Development Manager', 'Abuja | Jos', 'Drive strategic growth across enterprise, SME and residential segments. Own pipeline, partnerships and regional expansion.', ARRAY['3 to 6 years in business development','Strategic growth and partnership focus','Renewable Energy background is an advantage'], 'Bachelor''s degree in Business, Engineering or a related field.', 'Application - Business Development Manager', 4);

-- ==========================================
-- Migration: 20260513154412_7d927c37-95c3-426b-9795-4b9a0ebe80a9.sql
-- ==========================================

-- Create a private storage bucket for career CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-cvs',
  'career-cvs',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

-- Create career applications table
CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid,
  role_title text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL DEFAULT '',
  years_experience text NOT NULL DEFAULT '',
  cover_note text NOT NULL DEFAULT '',
  cv_path text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for admin review
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON public.career_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_applications_role_title ON public.career_applications (role_title);

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_career_applications_updated_at ON public.career_applications;
CREATE TRIGGER set_career_applications_updated_at BEFORE UPDATE ON public.career_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Replace policies so the migration is safe to re-run
DROP POLICY IF EXISTS "Anyone can submit career applications" ON public.career_applications;
DROP POLICY IF EXISTS "Admins can manage career applications" ON public.career_applications;

DROP POLICY IF EXISTS "Anyone can submit career applications" ON public.career_applications;
CREATE POLICY "Anyone can submit career applications" ON public.career_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(role_title)) BETWEEN 2 AND 160
  AND length(trim(full_name)) BETWEEN 2 AND 120
  AND length(trim(email)) BETWEEN 5 AND 255
  AND length(trim(phone)) BETWEEN 7 AND 40
  AND length(trim(cv_path)) BETWEEN 8 AND 500
  AND length(cover_note) <= 2000
);

DROP POLICY IF EXISTS "Admins can manage career applications" ON public.career_applications;
CREATE POLICY "Admins can manage career applications" ON public.career_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage access rules for CV files
DROP POLICY IF EXISTS "Anyone can upload career CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read career CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete career CVs" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can upload career CVs" ON storage.objects;
CREATE POLICY "Anyone can upload career CVs" ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'career-cvs');

DROP POLICY IF EXISTS "Admins can read career CVs" ON storage.objects;
CREATE POLICY "Admins can read career CVs" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'career-cvs' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete career CVs" ON storage.objects;
CREATE POLICY "Admins can delete career CVs" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'career-cvs' AND public.has_role(auth.uid(), 'admin'::app_role));

-- ==========================================
-- Migration: 20260514070449_ad5de4f3-e770-424d-a488-4a5906c85211.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.solar_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_number integer NOT NULL,
  battery_type text NOT NULL DEFAULT 'lithium',
  inverter text NOT NULL,
  inverter_price numeric,
  solar_panels text NOT NULL,
  solar_panels_price numeric,
  battery text NOT NULL,
  battery_price numeric,
  charge_controller text NOT NULL DEFAULT 'NIL',
  charge_controller_price numeric,
  accessories_price numeric,
  setup_fee numeric,
  total_price numeric NOT NULL,
  appliances text NOT NULL,
  tagline text,
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solar_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active solar packages" ON public.solar_packages;
CREATE POLICY "Anyone can read active solar packages" ON public.solar_packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins full access on solar packages" ON public.solar_packages;
CREATE POLICY "Admins full access on solar packages" ON public.solar_packages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS set_solar_packages_updated_at ON public.solar_packages;
CREATE TRIGGER set_solar_packages_updated_at BEFORE UPDATE ON public.solar_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.solar_packages
  (package_number, battery_type, inverter, inverter_price, solar_panels, solar_panels_price, battery, battery_price, charge_controller, charge_controller_price, accessories_price, setup_fee, total_price, appliances, tagline, badge, sort_order)
VALUES
  (1,'lithium','Hybrid 3.5KVA 24V (Transformer-Based)',650000,'450W Panels x 8',1056000,'5kWh 24/48V x 1',1650000,'60Amp MPPT',198000,158000,312200,4024000,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','For small homes & flats','Starter',1),
  (2,'lithium','Hybrid 5KVA 24V/48V (Transformer-Based)',1105000,'450W Panels x 12',1584000,'7.2kWh 24/48V x 1',1950000,'NIL',NULL,224000,486300,5349300,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','For mid-sized homes','Popular',2),
  (3,'lithium','Hybrid 7.5KVA 48V (Transformer-Based)',1170000,'450W Panels x 18',2376000,'10kWh 24/48V x 1',2730000,'NIL',NULL,396000,667200,7339200,'36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC','Adds AC support','Family',3),
  (4,'lithium','Hybrid 10KVA 48V (Transformer-Based)',1690000,'450W Panels x 24',3168000,'15kWh 48/54V x 1',4160000,'120Amp MPPT',348000,510000,952800,10828800,'40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 2x 1HP AC','Large home / dual AC','Premium',4),
  (5,'lithium','Hybrid 10KVA (3 Phase) 48V (Transformer-Based)',1690000,'450W Panels x 24',3168000,'17kWh 48/54V x 1',5200000,'120Amp MPPT',348000,672000,1107800,12185800,'80 Bulbs, 12 Fans, 10 TVs, 10 Laptops, 4 Freezers, 3x 1HP AC','3-phase office / large home','3-Phase',5),
  (6,'lithium','Hybrid 10KVA (3 Phase) 48V (Transformer-Based)',1690000,'450W Panels x 28',3696000,'20kWh (10kWh 48/54V x 2)',5460000,'120Amp MPPT',348000,672000,1186600,13052600,'80 Bulbs, 12 Fans, 10 TVs, 10 Laptops, 4 Freezers, 3x 1HP AC','Extended runtime','Extended',6),
  (7,'lithium','Hybrid 20KVA (10KVA x 2) 48V (Transformer-Based)',3380000,'650W Panels x 32',5376000,'30kWh (15kWh 48/54V x 2)',8320000,'120Amp MPPT x 2',696000,1176000,1860000,20808000,'100 Bulbs, 15 Fans, 15 TVs, 15 Laptops, 5 Freezers, 4x 1HP AC','Small business / villa','Business',7),
  (8,'lithium','Hybrid 30KVA (10KVA x 3) 48V/74V (Transformer-Based)',5070000,'650W Panels x 48',8064000,'70kWh (17.5kWh 48/54V x 4)',20800000,'120Amp MPPT x 3',1044000,1848000,3682800,40508800,'200 Bulbs, 18 Fans, 20 TVs, 20 Laptops, 6 Freezers, 5x 1HP AC','Enterprise / estate','Enterprise',8),
  (9,'tubular','Hybrid 1KVA (12V/24V)',228000,'400W Panels x 2',221000,'220AH x 1',282000,'60Amp MPPT',198000,90000,106200,1125200,'9 Bulbs, 2 Fans, 2 TVs, 2 Laptops','Studio / shop starter','Starter',9),
  (10,'tubular','Hybrid 1.5KVA/1.7KVA (12V/24V)',247000,'400W Panels x 2',221000,'220AH x 2',564000,'60Amp MPPT',198000,120000,169500,1519500,'14 Bulbs, 3 Fans, 3 TVs, 3 Laptops','Small flat','Compact',10),
  (11,'tubular','Hybrid 2.5KVA/3.5KVA (24V)',560000,'450W Panels x 4',530000,'220AH x 2',546000,'60Amp MPPT',198000,132000,250800,2216000,'18 Bulbs, 4 Fans, 3 TVs, 3 Laptops','Mid flat / small home','Popular',11),
  (12,'tubular','Hybrid 3KVA (24V) (Transformer-less)',590000,'450W Panels x 8',1056000,'220AH x 4',1128000,'60Amp MPPT',198000,158000,312200,3442200,'30 Bulbs, 5 Fans, 4 TVs, 4 Laptops, 1 Freezer','Family home','Family',12),
  (13,'tubular','Hybrid 5KVA (24V/48V) (Transformer-Based)',1105000,'450W Panels x 12',1584000,'220AH x 6',1692000,'80Amp MPPT',240500,224000,450440,5295940,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','Larger family home','Premium',13),
  (14,'tubular','Hybrid 5KVA (24V/48V) (Transformer-less)',585000,'450W Panels x 12',1584000,'220AH x 6',1692000,'80Amp MPPT',240500,224000,450440,4775940,'30 Bulbs, 6 Fans, 5 TVs, 5 Laptops, 2 Freezers','Best value 5KVA','Value',14),
  (15,'tubular','Non-Hybrid 7.5KVA (Transformer-Based) 48V',1235000,'450W Panels x 18',2376000,'220AH x 8',2256000,'100Amp MPPT',312000,396000,678000,7253000,'36 Bulbs, 7 Fans, 5 TVs, 5 Laptops, 2 Freezers, 1HP AC','Home + AC','Home+AC',15),
  (16,'tubular','Non-Hybrid 10KVA (Transformer-Based) 48V',1690000,'450W Panels x 24',3168000,'220AH x 16',4512000,'120Amp MPPT',375000,510000,1029000,11284000,'40 Bulbs, 8 Fans, 6 TVs, 6 Laptops, 2 Freezers, 2x 1HP AC','Large home / dual AC','Premium',16);


-- ==========================================
-- Migration: 20260514071914_fc9d3603-2bc7-4a75-9cbd-bca9b3e44b44.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.smart_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'lock', -- 'lock' | 'accessory' | 'hotel'
  series TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC,
  price_label TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  power_system TEXT NOT NULL DEFAULT '',
  ideal_for TEXT NOT NULL DEFAULT '',
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active smart locks" ON public.smart_locks;
CREATE POLICY "Anyone can read active smart locks" ON public.smart_locks FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins full access on smart locks" ON public.smart_locks;
CREATE POLICY "Admins full access on smart locks" ON public.smart_locks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS set_smart_locks_updated_at ON public.smart_locks;
CREATE TRIGGER set_smart_locks_updated_at BEFORE UPDATE ON public.smart_locks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ==========================================
-- Migration: 20260514083021_d013caee-c3af-4afc-b3ba-569c0e9c5d1e.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.home_automation_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  entertainment text[] NOT NULL DEFAULT '{}',
  price numeric,
  price_label text,
  badge text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_automation_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active home automation packages" ON public.home_automation_packages;
CREATE POLICY "Anyone can read active home automation packages" ON public.home_automation_packages FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins full access on home automation packages" ON public.home_automation_packages;
CREATE POLICY "Admins full access on home automation packages" ON public.home_automation_packages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS set_home_automation_packages_updated_at ON public.home_automation_packages;
CREATE TRIGGER set_home_automation_packages_updated_at BEFORE UPDATE ON public.home_automation_packages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.home_automation_packages (tier, name, tagline, description, features, entertainment, price, price_label, badge, sort_order) VALUES
('Ascentia', 'Ascentia', 'Essential Areas', 'Our foundational package designed for modern security and core smart integration.',
 ARRAY['Smart Cameras','Video Doorbell','Smart Lock','Smart Control Panel','Motion & Door Sensors'],
 ARRAY['Amazon Echo Pop','Acoustic Ceiling Speakers'],
 4900000, 'From ₦4.9M', 'Foundational', 1),
('Sprout', 'Sprout', 'Core Areas', 'Elevate your living experience with enhanced lighting and automated window treatments. Includes everything in Ascentia.',
 ARRAY['Everything in Ascentia','Specialized Staircase Smart Lighting','Motorized Blinds or Curtains','Smart Control Panel'],
 ARRAY['Amazon Echo Show','Acoustic Ceiling Speakers with Amplifier'],
 10900000, 'From ₦10.9M', 'Most Popular', 2),
('Ibiza', 'Ibiza', 'Complete Home Automation', 'The ultimate luxury ecosystem for total property control and advanced technology. Includes everything in Ascentia & Sprout.',
 ARRAY['Everything in Ascentia & Sprout','Advanced AI Cameras','Starlight Night Vision','Motorised Gate','Starlink High-Speed Internet'],
 ARRAY['Multi-Surround Sound System','Amazon Echo Show 15'],
 18900000, 'From ₦18.9M', 'Luxury', 3);

-- ==========================================
-- Migration: 20260516062605_c19daef6-cafa-4cdc-b04f-852d11b5cee2.sql
-- ==========================================

-- Rename home automation tiers
UPDATE public.home_automation_packages SET tier = 'Apex', name = 'Apex' WHERE tier = 'Ascentia';
UPDATE public.home_automation_packages SET tier = 'Aura', name = 'Aura' WHERE tier = 'Sprout';
UPDATE public.home_automation_packages SET tier = 'Riviera', name = 'Riviera' WHERE tier = 'Ibiza';

-- Replace smart locks catalog with the correct STAMA lineup from the technical document
DELETE FROM public.smart_locks;

INSERT INTO public.smart_locks (category, series, model, name, tagline, description, price, price_label, features, power_system, ideal_for, badge, sort_order, is_active) VALUES
-- ELITE
('lock','Elite Series','K209','Elite Series A — Premier-Lux K209','Black & Gold · 1-year warranty','Flagship biometric lock with facial, palm-vein, fingerprint and Wi-Fi app control.',285000,'₦285,000',
 ARRAY['Facial Recognition','Palm-Vein Authentication','Fingerprint (up to 100 users)','RFID Card (up to 50)','Secure Passcode + Wi-Fi App','Mechanical Override Key','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Luxury homes · executive apartments · premium shortlets','Flagship',10,true),

('lock','Elite Series','S7','Elite Series B — Premier-Lux S7','Custom Israeli edition · Black & Silver','Premium Israeli-built door variant with full biometric stack and entry logs.',300000,'₦300,000',
 ARRAY['Facial Recognition','Palm-Vein Authentication','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode + Wi-Fi App','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern residence · executive apartments · Israeli-built doors','Israeli Edition',20,true),

-- APEX
('lock','Apex Series','D20','Apex Series A — E-Pro D20','Grey · 1-year warranty','Reliable smart access for homes and apartments with face, fingerprint and remote unlock.',280000,'₦280,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Remote Control','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern homes · apartments · rental units',NULL,30,true),

('lock','Apex Series','H11','Apex Series B — H11','1-year warranty','Smart entry with integrated doorbell and full biometric unlock methods.',280000,'₦280,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm','Video Intercom Viewer','Integrated Doorbell','Entry Record & Access Logs'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern home · private & commercial space · rental apartments',NULL,40,true),

('lock','Apex Series','F27','Apex Series — Apex-Lux F27 Wi-Fi','Grey · 1-year warranty','Wi-Fi enabled biometric lock with video intercom for modern homes and lounges.',350000,'₦350,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App (Wi-Fi)','Mechanical Key','Anti-Pry Alarm','Video Intercom Viewer','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern home · private & commercial space · rental apartments','Wi-Fi',50,true),

('lock','Apex Series','T8','Apex Custom Israeli — T8','Black · 1-year warranty','Premium custom-Israeli lock with camera, video intercom and full biometric access.',450000,'₦450,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Anti-Pry Alarm','Camera & Video Intercom','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Premium homes · Israeli-built doors','Top Tier',60,true),

-- PRO
('lock','Pro Series','SL02','Pro Series A — Wi-Fi SL02','Black · 1-year warranty','Wi-Fi enabled smart lock with built-in security camera and staff clock-in.',220000,'₦220,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (Wi-Fi & TTL)','Mechanical Key','Built-in Security Camera','Anti-Pry Alarm','Entry Record & Access Logs','Time Attendance (Clock-in)'],
 'AA Batteries · easy replacement','Homes · offices · hotels',NULL,70,true),

('lock','Pro Series','TFS','Pro Series B — BLE TFS','Black · 1-year warranty','Bluetooth-enabled pro lock for residential and small business doors.',220000,'₦220,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (BLE)','Mechanical Override'],
 'AA Batteries · low maintenance','Residential apartments · private homes · offices · shortlets',NULL,80,true),

('lock','Pro Series','N14','Pro Series D — Standard-Pro N14 BLE','Black · 1-year warranty','Smart control with business intelligence for homes, offices and hospitality.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (BLE)','Mechanical Key','Optional Remote','Anti-Pry Alarm','Entry Record & Access Logs','Time Attendance (Clock-in)','Record Query'],
 '8 × AA Batteries','Homes · offices · hospitality',NULL,90,true),

('lock','Pro Series','N22','Pro Series — N22','Black · 1-year warranty','Affordable BLE-enabled smart lock with strong daily-use feature set.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode','Mobile App (BLE)','Mechanical Override','Anti-Pry Alarm'],
 '8 × AA Batteries','Residential apartments · offices',NULL,100,true),

('lock','Pro Series','X04','Pro Series — X04','Black · 1-year warranty','Budget-friendly Pro variant with the essentials covered.',160000,'₦160,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode','Mobile App (BLE)','Mechanical Override'],
 'AA Batteries','Residential · offices · budget-conscious deployments','Best Value',110,true),

('lock','Pro Series','B16','Basic-Pro — B16','Black · 1-year warranty','Reliable pro-grade lock with camera and video intercom on AA batteries.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Anti-Pry Alarm','Camera & Video Intercom','Record Query'],
 '4 × AA Batteries','Homes · offices',NULL,120,true),

-- BASE / SPECIALTY
('lock','Base Series','G290','Base Series — G290 (Glass Doors)','1-year warranty','Engineered for modern home & office glass doors with full biometric unlock.',198000,'₦198,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm'],
 '4 × AA Batteries · 6–12 months','Glass doors · modern homes & offices',NULL,130,true),

('lock','Base Series','V80','Base Series — V80 (Conventional Doors & Gates)','1-year warranty','Smart way to secure conventional doors and gates with biometric access.',216000,'₦216,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm'],
 '3.7V Rechargeable Lithium · 6–12 months','Conventional doors · gates',NULL,140,true),

('lock','Base Series','KT14','Smart Padlock — D20 KT14','Black · 1-year warranty · IP67','Rugged biometric smart padlock for gates, sheds and outdoor assets.',80000,'₦80,000',
 ARRAY['Fingerprint (up to 50)','Mobile App (BLE)','Mechanical Key','Remote Control','IP67 Waterproof','Anti-Pry Alarm','Time Attendance','Entry Record & Access Logs'],
 '3.7V Built-in Rechargeable Battery','Gates · outdoor assets · staff clock-in',NULL,150,true),

-- ACCESSORIES
('accessory','Accessories','BATTERY','Replacement Lithium Battery','1-year warranty','Genuine STAMA replacement battery for rechargeable lock series.',45000,'₦45,000',
 ARRAY['Plug-and-play replacement','For Elite/Apex/Pro lithium locks'],'','All rechargeable STAMA locks',NULL,200,true),

('accessory','Accessories','REMOTE','Wireless Remote','1-year warranty','Handheld remote for compatible STAMA smart locks.',30000,'₦30,000',
 ARRAY['One-touch unlock','Range up to 30m'],'','Apex/Pro/Base lock owners',NULL,210,true),

('accessory','Accessories','GATEWAY','Wi-Fi Gateway','1-year warranty','Bridges BLE locks to Wi-Fi for remote control and logs.',42000,'₦42,000',
 ARRAY['BLE → Wi-Fi bridge','Remote unlock & monitoring','Multiple locks per gateway'],'','BLE Pro/Base lock owners','Recommended',220,true),

('accessory','Accessories','RFID','RFID Access Card','1-year warranty','Spare RFID access card for staff, family or guest entry.',7000,'₦7,000',
 ARRAY['Compatible with all STAMA locks','Add up to 50 per lock'],'','All STAMA lock owners',NULL,230,true),

-- HOTEL
('hotel','Hotel Ecosystem','HOTEL','STAMA Smart Hotel Ecosystem','Centralized · App + PC dashboard','Intelligent ecosystem for hotels, guest houses, serviced apartments and shortlets. Manage access, security and operations from one dashboard.',NULL,'On request',
 ARRAY['Seamless guest check-in & check-out','RFID cards · passcodes · mobile app · e-Key','Smart locks + Gateway + Router','PC management system','Card encoder + RFID cards','Energy-saving switch integration','Real-time entry logs & analytics'],
 'Per-room rechargeable + central gateway','Hotels · guest houses · serviced apartments · shortlets','Enterprise',300,true);

-- ==========================================
-- Migration: 20260518082208_a600a3ba-5b12-4fb4-9b3e-65251abb821c.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.app_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  platform text NOT NULL DEFAULT 'both',
  source text NOT NULL DEFAULT 'coming_soon',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_waitlist_email_unique UNIQUE (email),
  CONSTRAINT app_waitlist_platform_chk CHECK (platform IN ('ios','android','both')),
  CONSTRAINT app_waitlist_name_len CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  CONSTRAINT app_waitlist_email_len CHECK (char_length(trim(email)) BETWEEN 5 AND 255)
);

ALTER TABLE public.app_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.app_waitlist;
CREATE POLICY "Anyone can join the waitlist" ON public.app_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read waitlist" ON public.app_waitlist;
CREATE POLICY "Admins can read waitlist" ON public.app_waitlist FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete waitlist" ON public.app_waitlist;
CREATE POLICY "Admins can delete waitlist" ON public.app_waitlist FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS app_waitlist_created_idx ON public.app_waitlist (created_at DESC);


-- ==========================================
-- Migration: 20260524211956_f1cfa66d-6a76-4939-bc41-8786e60f4194.sql
-- ==========================================


-- 1) Remove page_views from realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.page_views;
EXCEPTION WHEN undefined_object THEN NULL; WHEN OTHERS THEN NULL;
END $$;

-- 2) Lock down realtime.messages so only admins can subscribe
-- Skipped internal realtime.messages RLS
-- Skipped internal realtime.messages policy drop
-- Skipped internal realtime.messages policy creation

-- 3) Tighten career CV upload path: require {uuid}/filename
DROP POLICY IF EXISTS "Anyone can upload career CVs" ON storage.objects;
CREATE POLICY "Anyone can upload career CVs" ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'career-cvs'
  AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[A-Za-z0-9._-]{1,160}$'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- 4) Remove broad SELECT listing on product-images bucket (public URLs continue to work via public endpoint)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- 5) Revoke EXECUTE on internal SECURITY DEFINER trigger functions from public roles
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;

-- 6) Replace overly permissive "WITH CHECK (true)" insert policies with validated versions
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead" ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND length(btrim(location)) BETWEEN 2 AND 200
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (notes IS NULL OR length(notes) <= 4000)
);

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
  AND length(page_path) BETWEEN 1 AND 500
);

DROP POLICY IF EXISTS "Anyone can insert conversions" ON public.conversions;
CREATE POLICY "Anyone can insert conversions" ON public.conversions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
  AND length(event_type) BETWEEN 1 AND 80
);

DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;
CREATE POLICY "Anyone can insert product clicks" ON public.product_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
);

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.app_waitlist;
CREATE POLICY "Anyone can join the waitlist" ON public.app_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);


-- ==========================================
-- Migration: 20260525164112_c63f37c3-c61a-4a34-a5b8-803fa2be3125.sql
-- ==========================================


-- ===== Blog Posts =====
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image_url text,
  author text NOT NULL DEFAULT 'Tioga Team',
  tags text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  read_minutes integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Admins full access on blog_posts" ON public.blog_posts;
CREATE POLICY "Admins full access on blog_posts" ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Newsletter Subscribers =====
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  source text NOT NULL DEFAULT 'footer',
  unsubscribed boolean NOT NULL DEFAULT false,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_token ON public.newsletter_subscribers (unsubscribe_token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(email)) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (full_name IS NULL OR length(btrim(full_name)) BETWEEN 0 AND 120)
    AND length(btrim(source)) BETWEEN 1 AND 60
  );

DROP POLICY IF EXISTS "Admins can read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can read newsletter subscribers" ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can update newsletter subscribers" ON public.newsletter_subscribers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can delete newsletter subscribers" ON public.newsletter_subscribers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_newsletter_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER trg_newsletter_updated_at BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ==========================================
-- Migration: 20260527162919_42af0069-5a3b-4351-a23f-63b3945eaa29.sql
-- ==========================================


-- Newsletter: double opt-in + admin broadcasts
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON public.newsletter_subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_idx
  ON public.newsletter_subscribers (unsubscribe_token);

-- Blog: scheduled publishing
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Update RLS so scheduled posts are NOT publicly visible until time arrives
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (
  published = true
  AND (published_at IS NULL OR published_at <= now())
);

-- Broadcast log so admin can track campaigns
CREATE TABLE IF NOT EXISTS public.newsletter_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html text NOT NULL,
  sent_count integer NOT NULL DEFAULT 0,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.newsletter_broadcasts TO authenticated;
GRANT ALL ON public.newsletter_broadcasts TO service_role;

ALTER TABLE public.newsletter_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read broadcasts" ON public.newsletter_broadcasts;
CREATE POLICY "Admins read broadcasts" ON public.newsletter_broadcasts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert broadcasts" ON public.newsletter_broadcasts;
CREATE POLICY "Admins insert broadcasts" ON public.newsletter_broadcasts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- ==========================================
-- Migration: 20260528151335_bce8edd6-fdca-4c08-9836-a0e5937d95be.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT ('TIO-' || to_char(now(), 'YYMMDD') || '-' || lpad((floor(random()*10000))::text, 4, '0')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  notes TEXT,
  items_summary TEXT NOT NULL DEFAULT '',
  item_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'cart_checkout',
  consent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type TEXT,
  price_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) BETWEEN 2 AND 120
    AND length(btrim(phone)) BETWEEN 7 AND 40
    AND length(btrim(location)) BETWEEN 2 AND 200
    AND (email IS NULL OR (length(btrim(email)) BETWEEN 5 AND 255))
    AND (notes IS NULL OR length(notes) <= 4000)
    AND item_count BETWEEN 1 AND 200
  );

DROP POLICY IF EXISTS "Admins read orders" ON public.orders;
CREATE POLICY "Admins read orders" ON public.orders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
CREATE POLICY "Anyone can add order items" ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(product_name)) BETWEEN 1 AND 300
    AND quantity BETWEEN 1 AND 999
  );

DROP POLICY IF EXISTS "Admins read order items" ON public.order_items;
CREATE POLICY "Admins read order items" ON public.order_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update order items" ON public.order_items;
CREATE POLICY "Admins update order items" ON public.order_items FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete order items" ON public.order_items;
CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- Migration: 20260531143510_916afe0e-d4d4-4ff8-b511-7872672fdc57.sql
-- ==========================================

-- Remove unused public INSERT policy on order_items. Orders are submitted exclusively
-- through the submit-order edge function (service role), so anonymous direct inserts
-- are not needed and were enabling unlinked rows to be attached to any order.
DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

-- ==========================================
-- Migration: 20260604085247_8fe08c89-05fc-43a4-8b22-ea9b1221482a.sql
-- ==========================================


DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tiogatechnologies@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'tiogatechnologies@gmail.com',
      crypt('P@55w0rd@1', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'tiogatechnologies@gmail.com', 'email_verified', true),
      'email', v_user_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt('P@55w0rd@1', gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE id = v_user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;


-- ==========================================
-- Migration: 20260605195551_2f451f0d-620d-4f4c-869d-5584c7d12ac3.sql
-- ==========================================


INSERT INTO public.solar_packages
  (package_number, battery_type, inverter, solar_panels, battery, charge_controller, total_price, appliances, tagline, badge, sort_order, is_active)
VALUES
  (17, 'high_voltage', '40KVA / 36KW Hybrid Inverter (with charge controller)', '60 x 600W Solar Panels', '60kWh Lithium Battery', 'Built-in MPPT', 25400000, 'Large homes, offices, small factories, filling stations', '40KVA Core Series', 'Commercial', 17, true),
  (18, 'high_voltage', '40KVA / 36KW Hybrid Inverter (with charge controller)', '72 x 600W Solar Panels', '90kWh Lithium Battery', 'Built-in MPPT', 31860000, 'Hotels, schools, large offices, mid-size factories', '40KVA Pro Series', 'Popular', 18, true),
  (19, 'high_voltage', '40KVA / 36KW Hybrid Inverter (with charge controller)', '100 x 550W Solar Panels', '120kWh Lithium Battery', 'Built-in MPPT', 46600000, 'Industrial, estates, large hotels, manufacturing', '40KVA Max Series', 'Flagship', 19, true);


-- ==========================================
-- Migration: 20260607135627_e245772d-8cc1-40f4-af84-d92ccc1e40f8.sql
-- ==========================================


-- Affiliate Applications (public submit, admin manage)
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text,
  audience_size text,
  channels text[] NOT NULL DEFAULT '{}',
  social_links text,
  why text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.affiliate_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.affiliate_applications TO authenticated;
GRANT ALL ON public.affiliate_applications TO service_role;

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit affiliate application" ON public.affiliate_applications;
CREATE POLICY "Anyone can submit affiliate application" ON public.affiliate_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) BETWEEN 2 AND 120
    AND length(btrim(email)) BETWEEN 5 AND 255
    AND length(btrim(phone)) BETWEEN 7 AND 40
    AND (why IS NULL OR length(why) <= 4000)
  );

DROP POLICY IF EXISTS "Admins manage affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Admins manage affiliate applications" ON public.affiliate_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS affiliate_applications_set_updated_at ON public.affiliate_applications;
CREATE TRIGGER affiliate_applications_set_updated_at BEFORE UPDATE ON public.affiliate_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Affiliates (admin-only)
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  code text NOT NULL UNIQUE,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  status text NOT NULL DEFAULT 'active',
  payout_method text,
  payout_details text,
  notes text,
  application_id uuid REFERENCES public.affiliate_applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage affiliates" ON public.affiliates;
CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS affiliates_set_updated_at ON public.affiliates;
CREATE TRIGGER affiliates_set_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);


-- Lead attribution fields
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE INDEX IF NOT EXISTS idx_leads_affiliate_code ON public.leads(affiliate_code);


-- ==========================================
-- Migration: 20260608211612_5803c118-2c9e-46c2-b762-bfa456201c72.sql
-- ==========================================


-- =========================================================
-- AFFILIATE PAYOUTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  lead_count integer NOT NULL DEFAULT 0,
  revenue_total numeric(14,2) NOT NULL DEFAULT 0,
  commission_total numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  notes text,
  statement_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_payouts_status_chk
    CHECK (status IN ('pending','approved','paid','rejected')),
  CONSTRAINT affiliate_payouts_period_chk
    CHECK (period_end >= period_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage affiliate payouts" ON public.affiliate_payouts;
CREATE POLICY "Admins manage affiliate payouts" ON public.affiliate_payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS affiliate_payouts_set_updated_at ON public.affiliate_payouts;
CREATE TRIGGER affiliate_payouts_set_updated_at BEFORE UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_token ON public.affiliate_payouts(statement_token);

-- =========================================================
-- SECURITY HARDENING: revoke execute on internal trigger fns
-- (They run as table owner during triggers; no need for API/role grants.)
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;


-- ==========================================
-- Migration: 20260610192417_4a68559c-190c-4e96-9370-de1a800b87fc.sql
-- ==========================================


REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;


-- ==========================================
-- Migration: 20260612202501_23cd9dce-364d-4273-a874-d388f928a3fa.sql
-- ==========================================


-- 1. Extend role enum
-- Pre-declared app_role value: staff
-- Pre-declared app_role value: affiliate
-- Pre-declared app_role value: customer


-- ==========================================
-- Migration: 20260612202531_02a39bef-78a2-4c17-bc5a-cdafd822f217.sql
-- ==========================================


-- ============== PROFILES ==============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== HAS_ANY_ROLE HELPER ==============
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- ============== HANDLE NEW USER ==============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== ORDERS EXTENSIONS ==============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_address jsonb,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS affiliate_code text;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON public.orders(payment_reference);

-- Customers can read their own orders
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- Staff can also read/update
DROP POLICY IF EXISTS "Staff read orders" ON public.orders;
CREATE POLICY "Staff read orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));


-- ==========================================
-- Migration: 20260612202545_b98788d0-77d3-4172-8271-95cdc3805f5c.sql
-- ==========================================


-- Revoke broad EXECUTE on security-definer helpers; only allow what's needed.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.product_images_enforce_single_primary() TO service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;


-- ==========================================
-- Migration: 20260613081228_0ce98852-c6f9-4de2-b137-bfb56e1e400f.sql
-- ==========================================

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- ==========================================
-- Migration: 20260614153228_b7a49473-3142-4f2d-9736-e4a9d1558d52.sql
-- ==========================================

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

DROP POLICY IF EXISTS "Public can read non-sensitive site settings" ON public.site_settings;
CREATE POLICY "Public can read non-sensitive site settings" ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key <> 'notification_preferences');

DROP POLICY IF EXISTS "Admins and staff can read all site settings" ON public.site_settings;
CREATE POLICY "Admins and staff can read all site settings" ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ==========================================
-- Migration: 20260614154355_7f31f02f-8210-4c33-9fec-32d89d9153ab.sql
-- ==========================================


-- ============ DISCOUNTS ============
CREATE TABLE IF NOT EXISTS public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  type text NOT NULL CHECK (type IN ('percent','flat')),
  value numeric(12,2) NOT NULL CHECK (value > 0),
  min_cart_ngn numeric(12,2) NOT NULL DEFAULT 0,
  max_uses integer,
  per_customer_cap integer NOT NULL DEFAULT 1,
  starts_at timestamptz,
  expires_at timestamptz,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','category','product')),
  applies_to_values text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  uses_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active discounts" ON public.discounts;
CREATE POLICY "Public can read active discounts" ON public.discounts FOR SELECT TO anon, authenticated USING (active = true AND (expires_at IS NULL OR expires_at > now()));
DROP POLICY IF EXISTS "Admins manage discounts" ON public.discounts;
CREATE POLICY "Admins manage discounts" ON public.discounts FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP TRIGGER IF EXISTS trg_discounts_updated_at ON public.discounts;
CREATE TRIGGER trg_discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  amount_discounted numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.discount_redemptions TO authenticated;
GRANT ALL ON public.discount_redemptions TO service_role;
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own redemptions" ON public.discount_redemptions;
CREATE POLICY "Users see own redemptions" ON public.discount_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins manage redemptions" ON public.discount_redemptions;
CREATE POLICY "Admins manage redemptions" ON public.discount_redemptions FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ AUDIT LOG ============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  diff jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity, entity_id);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity text, _entity_id text, _diff jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_log (actor_id, actor_email, action, entity, entity_id, diff)
  VALUES (auth.uid(), _email, _action, _entity, _entity_id, _diff);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) TO authenticated, service_role;

-- ============ FINANCE ============
DO $$ BEGIN
  CREATE TYPE finance_app_status AS ENUM ('pending','under_review','approved','rejected','active','completed','defaulted','cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE finance_inst_status AS ENUM ('upcoming','due','paid','overdue','waived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.finance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  state text,
  city text,
  date_of_birth date,
  occupation text,
  employer text,
  monthly_income_ngn numeric(12,2),
  id_type text,
  id_number text,
  id_document_url text,
  next_of_kin_name text,
  next_of_kin_phone text,
  item_name text NOT NULL,
  item_reference text,
  total_amount_ngn numeric(12,2) NOT NULL,
  deposit_ngn numeric(12,2) NOT NULL DEFAULT 0,
  financed_ngn numeric(12,2) NOT NULL,
  months integer NOT NULL CHECK (months IN (3,6,12)),
  monthly_payment_ngn numeric(12,2) NOT NULL,
  status finance_app_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  consent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_app_user ON public.finance_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_fin_app_status ON public.finance_applications (status);
GRANT SELECT, INSERT, UPDATE ON public.finance_applications TO authenticated;
GRANT ALL ON public.finance_applications TO service_role;
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert their applications" ON public.finance_applications;
CREATE POLICY "Users insert their applications" ON public.finance_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications" ON public.finance_applications FOR INSERT TO anon WITH CHECK (user_id IS NULL);
DROP POLICY IF EXISTS "Users read own applications" ON public.finance_applications;
CREATE POLICY "Users read own applications" ON public.finance_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins manage applications" ON public.finance_applications;
CREATE POLICY "Admins manage applications" ON public.finance_applications FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
GRANT INSERT ON public.finance_applications TO anon;
DROP TRIGGER IF EXISTS trg_fin_app_updated_at ON public.finance_applications;
CREATE TRIGGER trg_fin_app_updated_at BEFORE UPDATE ON public.finance_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.finance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  installment_no integer NOT NULL,
  due_date date NOT NULL,
  amount_ngn numeric(12,2) NOT NULL,
  status finance_inst_status NOT NULL DEFAULT 'upcoming',
  paid_at timestamptz,
  paid_reference text,
  proof_url text,
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, installment_no)
);
CREATE INDEX IF NOT EXISTS idx_fin_sched_due ON public.finance_schedules (due_date);
CREATE INDEX IF NOT EXISTS idx_fin_sched_status ON public.finance_schedules (status);
GRANT SELECT, UPDATE ON public.finance_schedules TO authenticated;
GRANT ALL ON public.finance_schedules TO service_role;
ALTER TABLE public.finance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own schedules" ON public.finance_schedules;
CREATE POLICY "Users read own schedules" ON public.finance_schedules FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])))
);
DROP POLICY IF EXISTS "Admins manage schedules" ON public.finance_schedules;
CREATE POLICY "Admins manage schedules" ON public.finance_schedules FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP TRIGGER IF EXISTS trg_fin_sched_updated_at ON public.finance_schedules;
CREATE TRIGGER trg_fin_sched_updated_at BEFORE UPDATE ON public.finance_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.finance_schedules(id) ON DELETE SET NULL,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  amount_ngn numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  proof_url text,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.finance_payments TO authenticated;
GRANT ALL ON public.finance_payments TO service_role;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own payments" ON public.finance_payments;
CREATE POLICY "Users read own payments" ON public.finance_payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])))
);
DROP POLICY IF EXISTS "Users submit payments" ON public.finance_payments;
CREATE POLICY "Users submit payments" ON public.finance_payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins manage payments" ON public.finance_payments;
CREATE POLICY "Admins manage payments" ON public.finance_payments FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ CRM ============
CREATE TABLE IF NOT EXISTS public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);
GRANT SELECT, INSERT, DELETE ON public.customer_tags TO authenticated;
GRANT ALL ON public.customer_tags TO service_role;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage tags" ON public.customer_tags;
CREATE POLICY "Admins manage tags" ON public.customer_tags FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage notes" ON public.customer_notes;
CREATE POLICY "Admins manage notes" ON public.customer_notes FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ ORDER STATUS HISTORY ============
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_osh_order ON public.order_status_history (order_id);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read order history" ON public.order_status_history;
CREATE POLICY "Admins read order history" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins insert order history" ON public.order_status_history;
CREATE POLICY "Admins insert order history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- Order columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

-- Product stock columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_qty integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;


-- ==========================================
-- Migration: 20260614154427_cb643eb9-7c3f-478b-9e66-98ef355a1d6a.sql
-- ==========================================


DROP POLICY IF EXISTS "Finance docs: users upload own" ON storage.objects;
CREATE POLICY "Finance docs: users upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'finance-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Finance docs: anon upload tmp" ON storage.objects;
CREATE POLICY "Finance docs: anon upload tmp" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'finance-docs' AND (storage.foldername(name))[1] = 'guest');

DROP POLICY IF EXISTS "Finance docs: read own or admin" ON storage.objects;
CREATE POLICY "Finance docs: read own or admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'finance-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])));

DROP POLICY IF EXISTS "Finance docs: admin delete" ON storage.objects;
CREATE POLICY "Finance docs: admin delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'finance-docs' AND public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));


-- ==========================================
-- Migration: 20260617072408_0abd63e8-4206-4ea1-b44d-e1c952cb9191.sql
-- ==========================================


-- Inventory movements
CREATE TABLE IF NOT EXISTS public.product_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_psm_product ON public.product_stock_movements(product_id, created_at DESC);
GRANT SELECT, INSERT ON public.product_stock_movements TO authenticated;
GRANT ALL ON public.product_stock_movements TO service_role;
ALTER TABLE public.product_stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff read movements" ON public.product_stock_movements;
CREATE POLICY "Staff read movements" ON public.product_stock_movements FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Staff insert movements" ON public.product_stock_movements;
CREATE POLICY "Staff insert movements" ON public.product_stock_movements FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- Auto-apply movement to stock
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
    SET stock = GREATEST(0, COALESCE(stock,0) + NEW.delta)
    WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_apply_stock_movement ON public.product_stock_movements;
CREATE TRIGGER trg_apply_stock_movement AFTER INSERT ON public.product_stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Order status: auto-log history on change + allow user-visible reads
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status, actor_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Let order owner read their own history
DROP POLICY IF EXISTS "Users read own order history" ON public.order_status_history;
CREATE POLICY "Users read own order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id
    AND (o.user_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))));
DROP POLICY IF EXISTS "Staff read order history" ON public.order_status_history;
CREATE POLICY "Staff read order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- low_stock_threshold on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;


-- ==========================================
-- Migration: 20260617072422_0144b603-9cb8-400e-bc94-c082bda6eca0.sql
-- ==========================================


REVOKE EXECUTE ON FUNCTION public.apply_stock_movement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- ==========================================
-- Migration: 20260618224511_d0d672bb-0be6-4c15-b820-fd4daa55cc7c.sql
-- ==========================================


-- Allow customers to read items for orders they own
DROP POLICY IF EXISTS "Customers can read their own order items" ON public.order_items;
CREATE POLICY "Customers can read their own order items" ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

-- Rewrite site_settings public-read policy as an explicit allowlist
DROP POLICY IF EXISTS "Public can read non-sensitive site settings" ON public.site_settings;

DROP POLICY IF EXISTS "Public can read whitelisted site settings" ON public.site_settings;
CREATE POLICY "Public can read whitelisted site settings" ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY['general','branding','social_links','hero_content','contact_public','seo','homepage','footer']));


-- ==========================================
-- Migration: 20260618224529_0fb5c1ac-b5f8-415f-8bb8-c0beb946ff4a.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.log_audit(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- ==========================================
-- Migration: 20260619201939_c0ad80dd-b877-48f3-8152-a3b2f25a197d.sql
-- ==========================================


-- 1) Remove public discounts read; validation happens via validate-discount edge function only
DROP POLICY IF EXISTS "Public can read active discounts" ON public.discounts;

-- 2) Tighten guest finance application insert with field-level validation
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications" ON public.finance_applications
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (id_number IS NULL OR length(btrim(id_number)) BETWEEN 3 AND 50)
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

-- 3) Let affiliates read their own payouts (matched via email of signed-in user)
DROP POLICY IF EXISTS "Affiliates can read their own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can read their own payouts" ON public.affiliate_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliates a
    JOIN auth.users u ON lower(u.email) = lower(a.email)
    WHERE a.id = affiliate_payouts.affiliate_id
      AND u.id = auth.uid()
  )
);


-- ==========================================
-- Migration: 20260620112846_fd767c8a-88f9-427a-b1be-def7c768b997.sql
-- ==========================================

-- Pre-declared app_role value: engineer

-- ==========================================
-- Migration: 20260620112913_e2113fa8-9757-48b6-9b1b-ccafdc390965.sql
-- ==========================================

-- Add account_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual','business','installer'));

-- solar_assessments
CREATE TABLE IF NOT EXISTS public.solar_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  building_type TEXT,
  occupants INT,
  appliances JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_kwh NUMERIC,
  peak_load_w NUMERIC,
  current_power_situation TEXT,
  monthly_bill_ngn NUMERIC,
  recommendation JSONB,
  full_report JSONB,
  status TEXT NOT NULL DEFAULT 'basic' CHECK (status IN ('draft','basic','full','reviewed','quoted','closed')),
  engineer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  engineer_notes TEXT,
  is_full_unlocked BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.solar_assessments TO authenticated;
GRANT SELECT, INSERT ON public.solar_assessments TO anon;
GRANT ALL ON public.solar_assessments TO service_role;
ALTER TABLE public.solar_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert assessment" ON public.solar_assessments;
CREATE POLICY "Anyone can insert assessment" ON public.solar_assessments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users read own assessments" ON public.solar_assessments;
CREATE POLICY "Users read own assessments" ON public.solar_assessments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));
DROP POLICY IF EXISTS "Public read by share token" ON public.solar_assessments;
CREATE POLICY "Public read by share token" ON public.solar_assessments
  FOR SELECT TO anon, authenticated USING (share_token IS NOT NULL);
DROP POLICY IF EXISTS "Users update own assessments" ON public.solar_assessments;
CREATE POLICY "Users update own assessments" ON public.solar_assessments
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

DROP TRIGGER IF EXISTS solar_assessments_updated_at ON public.solar_assessments;
CREATE TRIGGER solar_assessments_updated_at BEFORE UPDATE ON public.solar_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- assessment_credits
CREATE TABLE IF NOT EXISTS public.assessment_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INT NOT NULL DEFAULT 3,
  used_credits INT NOT NULL DEFAULT 0,
  purchased_credits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessment_credits TO authenticated;
GRANT ALL ON public.assessment_credits TO service_role;
ALTER TABLE public.assessment_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own credits" ON public.assessment_credits;
CREATE POLICY "Users read own credits" ON public.assessment_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- custom_solution_requests
CREATE TABLE IF NOT EXISTS public.custom_solution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','won','lost')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_solution_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.custom_solution_requests TO authenticated;
GRANT ALL ON public.custom_solution_requests TO service_role;
ALTER TABLE public.custom_solution_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create request" ON public.custom_solution_requests;
CREATE POLICY "Anyone can create request" ON public.custom_solution_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admin/staff read all requests" ON public.custom_solution_requests;
CREATE POLICY "Admin/staff read all requests" ON public.custom_solution_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));
DROP POLICY IF EXISTS "Admin/staff update requests" ON public.custom_solution_requests;
CREATE POLICY "Admin/staff update requests" ON public.custom_solution_requests
  FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP TRIGGER IF EXISTS custom_solution_requests_updated_at ON public.custom_solution_requests;
CREATE TRIGGER custom_solution_requests_updated_at BEFORE UPDATE ON public.custom_solution_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update handle_new_user to auto-create credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.assessment_credits (user_id, total_credits)
  VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill credits for existing users
INSERT INTO public.assessment_credits (user_id, total_credits)
SELECT id, 3 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- Migration: 20260620112926_428852fd-4637-4c0e-95a9-fe688c3d0771.sql
-- ==========================================

DROP POLICY IF EXISTS "Anyone can insert assessment" ON public.solar_assessments;
CREATE POLICY "Anyone can insert assessment" ON public.solar_assessments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 7 AND 40)
    AND (location IS NULL OR char_length(location) <= 200)
    AND (engineer_notes IS NULL)
    AND (full_report IS NULL)
    AND is_full_unlocked = false
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can create request" ON public.custom_solution_requests;
CREATE POLICY "Anyone can create request" ON public.custom_solution_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 7 AND 40)
    AND (location IS NULL OR char_length(location) <= 200)
    AND (requirements IS NULL OR char_length(requirements) <= 4000)
    AND (admin_notes IS NULL)
    AND status = 'new'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- ==========================================
-- Migration: 20260621130559_e89417c2-4a9a-499c-9ec5-9504f0e55771.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.lumivolt_sizings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  appliances JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_load_w NUMERIC NOT NULL DEFAULT 0,
  daily_energy_wh NUMERIC NOT NULL DEFAULT 0,
  days_autonomy NUMERIC NOT NULL DEFAULT 1,
  battery_voltage NUMERIC NOT NULL DEFAULT 48,
  battery_type TEXT NOT NULL DEFAULT 'lithium',
  battery_dod NUMERIC NOT NULL DEFAULT 0.9,
  sunlight_hours NUMERIC NOT NULL DEFAULT 5,
  solar_panel_w NUMERIC,
  recommended_panel_w NUMERIC,
  inverter_w NUMERIC,
  battery_ah NUMERIC,
  battery_kwh NUMERIC,
  charge_controller_a NUMERIC,
  notes TEXT,
  source TEXT DEFAULT 'lumivolt_web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lumivolt_sizings TO authenticated;
GRANT INSERT ON public.lumivolt_sizings TO anon;
GRANT ALL ON public.lumivolt_sizings TO service_role;

ALTER TABLE public.lumivolt_sizings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert sizings" ON public.lumivolt_sizings;
CREATE POLICY "Anyone can insert sizings" ON public.lumivolt_sizings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own sizings" ON public.lumivolt_sizings;
CREATE POLICY "Users can view their own sizings" ON public.lumivolt_sizings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own sizings" ON public.lumivolt_sizings;
CREATE POLICY "Users can update their own sizings" ON public.lumivolt_sizings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and engineers can view all sizings" ON public.lumivolt_sizings;
CREATE POLICY "Admins and engineers can view all sizings" ON public.lumivolt_sizings FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

DROP POLICY IF EXISTS "Admins can manage all sizings" ON public.lumivolt_sizings;
CREATE POLICY "Admins can manage all sizings" ON public.lumivolt_sizings FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP TRIGGER IF EXISTS lumivolt_sizings_updated_at ON public.lumivolt_sizings;
CREATE TRIGGER lumivolt_sizings_updated_at BEFORE UPDATE ON public.lumivolt_sizings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lumivolt_sizings_user ON public.lumivolt_sizings(user_id);
CREATE INDEX IF NOT EXISTS idx_lumivolt_sizings_created ON public.lumivolt_sizings(created_at DESC);


-- ==========================================
-- Migration: 20260621130901_9d0770bb-fba5-4070-8a07-918c7772fec4.sql
-- ==========================================


DROP POLICY IF EXISTS "Anyone can insert sizings" ON public.lumivolt_sizings;

DROP POLICY IF EXISTS "Public can insert valid sizings" ON public.lumivolt_sizings;
CREATE POLICY "Public can insert valid sizings" ON public.lumivolt_sizings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    daily_energy_wh > 0
    AND (
      (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
      OR (auth.uid() IS NULL AND user_id IS NULL AND email IS NOT NULL AND length(email) > 3)
    )
  );


-- ==========================================
-- Migration: 20260623164641_b1a6f5a3-1d36-403e-a068-b3b3eb23c642.sql
-- ==========================================


-- 1. Finance application: new breakdown columns + assessment lineage
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS interest_rate_pct numeric,
  ADD COLUMN IF NOT EXISTS insurance_fee_ngn numeric,
  ADD COLUMN IF NOT EXISTS management_fee_ngn numeric,
  ADD COLUMN IF NOT EXISTS total_repayment_ngn numeric,
  ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_slug text;

-- 2. AI subscription plan enum
DO $$ BEGIN
  -- Pre-declared public.ai_plan ENUM
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  -- Pre-declared public.ai_sub_status ENUM
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. ai_subscriptions table
CREATE TABLE IF NOT EXISTS public.ai_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.ai_plan NOT NULL DEFAULT 'free',
  status public.ai_sub_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  monthly_price_ngn numeric NOT NULL DEFAULT 2500,
  granted_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_subscriptions TO authenticated;
GRANT ALL ON public.ai_subscriptions TO service_role;

ALTER TABLE public.ai_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai subscription" ON public.ai_subscriptions;
CREATE POLICY "Users read own ai subscription" ON public.ai_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Admins manage ai subscriptions" ON public.ai_subscriptions;
CREATE POLICY "Admins manage ai subscriptions" ON public.ai_subscriptions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP TRIGGER IF EXISTS ai_subscriptions_updated_at ON public.ai_subscriptions;
CREATE TRIGGER ai_subscriptions_updated_at BEFORE UPDATE ON public.ai_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Helper: has active paid AI subscription
CREATE OR REPLACE FUNCTION public.has_active_ai_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ai_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan IN ('starter','business')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- 5. Seed/update site_settings.finance with new lease-to-own structure
INSERT INTO public.site_settings (key, value)
VALUES ('finance', jsonb_build_object(
  'deposit_pct', 0.30,
  'insurance_pct', 0.02,
  'management_pct', 0.01,
  'tenures_months', jsonb_build_array(12, 24),
  'interest_tiers', jsonb_build_array(
    jsonb_build_object('min', 1000000, 'max', 5000000, 'rate', 0.09),
    jsonb_build_object('min', 5000001, 'max', 7500000, 'rate', 0.15),
    jsonb_build_object('min', 7500001, 'max', NULL, 'rate', 0.25)
  ),
  'vat_pct', 0.075,
  'install_pct', 0.10
))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- ==========================================
-- Migration: 20260623164653_eeea0e3d-652a-4f0a-b5e3-417a2d289443.sql
-- ==========================================


REVOKE EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) TO authenticated, service_role;


-- ==========================================
-- Migration: 20260624082948_6d40f55c-6f5a-4538-9a31-1594d0dc73f5.sql
-- ==========================================


CREATE TABLE IF NOT EXISTS public.ai_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  assessment_id uuid,
  source text,
  description text,
  used_free_credit boolean NOT NULL DEFAULT true,
  subscription_plan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_usage_user ON public.ai_credit_usage(user_id, created_at DESC);

GRANT SELECT ON public.ai_credit_usage TO authenticated;
GRANT ALL ON public.ai_credit_usage TO service_role;

ALTER TABLE public.ai_credit_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own AI usage" ON public.ai_credit_usage;
CREATE POLICY "Users view own AI usage" ON public.ai_credit_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff view all AI usage" ON public.ai_credit_usage;
CREATE POLICY "Staff view all AI usage" ON public.ai_credit_usage FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));


-- ==========================================
-- Migration: 20260625080529_d261a44f-74d0-47a8-a880-f1510cf5a3d6.sql
-- ==========================================

ALTER TABLE public.finance_applications DROP CONSTRAINT IF EXISTS finance_applications_months_check;
ALTER TABLE public.finance_applications ADD CONSTRAINT finance_applications_months_check CHECK (months = ANY (ARRAY[3, 6, 12, 24]));

UPDATE public.site_settings
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{tenures_months}',
  '[3,6,12,24]'::jsonb,
  true
)
WHERE key = 'finance';

INSERT INTO public.site_settings (key, value)
SELECT 'finance', '{"tenures_months":[3,6,12,24],"vat_pct":0.075,"deposit_pct":0.30,"install_pct":0.10,"insurance_pct":0.02,"management_pct":0.01,"interest_tiers":[{"min":1000000,"max":5000000,"rate":0.09},{"min":5000001,"max":7500000,"rate":0.15},{"min":7500001,"max":null,"rate":0.25}]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'finance');

-- ==========================================
-- Migration: 20260625080835_b86e7d39-bdd1-4276-9714-85b16d44a39f.sql
-- ==========================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION private.has_active_ai_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ai_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan IN ('starter','business')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.has_active_ai_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_active_ai_subscription(uuid) TO service_role;

DO $$
DECLARE
  pol record;
  new_qual text;
  new_check text;
  sql text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ILIKE '%has_role(%' OR qual ILIKE '%has_any_role(%' OR qual ILIKE '%has_active_ai_subscription(%'
        OR with_check ILIKE '%has_role(%' OR with_check ILIKE '%has_any_role(%' OR with_check ILIKE '%has_active_ai_subscription(%'
      )
  LOOP
    new_qual := pol.qual;
    new_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'public.has_active_ai_subscription(', 'private.has_active_ai_subscription(');
      new_qual := replace(new_qual, 'public.has_any_role(', 'private.has_any_role(');
      new_qual := replace(new_qual, 'public.has_role(', 'private.has_role(');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_active_ai_subscription\(', '\1private.has_active_ai_subscription(', 'g');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_any_role\(', '\1private.has_any_role(', 'g');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_role\(', '\1private.has_role(', 'g');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, 'public.has_active_ai_subscription(', 'private.has_active_ai_subscription(');
      new_check := replace(new_check, 'public.has_any_role(', 'private.has_any_role(');
      new_check := replace(new_check, 'public.has_role(', 'private.has_role(');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_active_ai_subscription\(', '\1private.has_active_ai_subscription(', 'g');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_any_role\(', '\1private.has_any_role(', 'g');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_role\(', '\1private.has_role(', 'g');
    END IF;

    sql := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF new_qual IS NOT NULL THEN
      sql := sql || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      sql := sql || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE sql;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) TO service_role;

-- ==========================================
-- Migration: 20260627071453_829b7e32-6510-471f-aa39-7d10c6d47b0e.sql
-- ==========================================

DROP POLICY IF EXISTS "Users view own affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Users view own affiliate applications" ON public.affiliate_applications
FOR SELECT TO authenticated
USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));

-- ==========================================
-- Migration: 20260627072054_0362f096-e002-4cad-8eef-81fac7038c64.sql
-- ==========================================


INSERT INTO public.blog_posts (slug, title, excerpt, content, cover_image_url, author, tags, category, published, published_at, seo_title, seo_description, read_minutes)
VALUES
(
  'solar-system-cost-nigeria-2026',
  'How Much Does a Solar System Cost in Nigeria? Full 2026 Price Breakdown',
  'A transparent 2026 breakdown of what a solar system actually costs in Nigeria — by home size, battery type, and inverter capacity — with real Naira figures.',
$$Solar has gone from a luxury upgrade to a survival tool in Nigeria. With grid supply at record lows and diesel above ₦1,200/litre in many states, more homes are asking the same question: **what does a solar system actually cost in 2026?**

This guide gives you transparent, current pricing — no padded markups, no foreign-currency gymnastics.

![Solar panels installed on a Nigerian rooftop](https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=80&auto=format&fit=crop)

## The short answer

For a typical Nigerian home in 2026:

| System size | Best for | Estimated cost (NGN) |
|---|---|---|
| 1.5kVA / 1.2kW | Lights, fans, TV, phones | ₦950,000 – ₦1.4M |
| 3.5kVA / 3kW | Above + small freezer, pumping machine | ₦2.1M – ₦3.2M |
| 5kVA / 5kW | Full 2–3 bedroom flat (no heavy AC) | ₦3.8M – ₦5.5M |
| 7.5kVA / 7.5kW | Duplex with 1–2 inverter ACs | ₦6.5M – ₦9M |
| 10kVA / 10kW | Large home, office, or shop with ACs | ₦9M – ₦13M |

These are turnkey prices — panels, inverter, batteries, mounting, cabling, breakers, labour and a real warranty. Browse our [pre-configured solar packages](/packages) to see live pricing.

## What actually drives the price

### 1. Battery chemistry (the biggest line item)

Lithium (LiFePO4) batteries now make up **50–65% of total system cost** but they last 8–10× longer than tubular batteries and don't need ventilation.

- Tubular (200Ah): cheaper upfront, replace every 2–3 years
- Lithium (5kWh wall-mount): higher upfront, 10-year warranty, deeper discharge

### 2. Inverter quality

A genuine pure sine wave hybrid inverter from a reputable brand (Deye, Felicity, Luxpower, Victron) protects your appliances and lets you add panels later. Cheap clones save ₦200k now and fry your fridge in year two.

### 3. Panel wattage and orientation

Monocrystalline panels at 550W+ are the standard in 2026. Two well-oriented panels often outperform four poorly mounted ones.

![Battery storage and inverter installation](https://images.unsplash.com/photo-1611365892117-bce8a09a6abc?w=1600&q=80&auto=format&fit=crop)

## Can you finance it?

Yes — and you should consider it, because diesel and fuel costs you're avoiding usually exceed your monthly payment.

Tioga offers **3, 6, 12 and 24-month lease-to-own plans** on every package. You can [check your finance options here](/finance) or [run a free solar assessment](/assessment) to get a personalised quote in under 2 minutes.

## Hidden costs to watch for

- **Cable upgrades** — long runs from roof to inverter eat efficiency
- **Roof reinforcement** for older zinc roofs
- **Change-over switch and surge protection** (non-negotiable)
- **Annual maintenance** — usually 1–2% of system cost

## Bottom line

Don't shop by sticker price. Shop by **₦ per usable kWh over 10 years**. A ₦4M lithium system that delivers reliably for a decade beats a ₦2.5M tubular system you'll rebuild twice.

Ready to size yours? [Talk to a Tioga engineer](/contact) or use our [free AI solar sizing tool](/assessment).
$$,
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=80&auto=format&fit=crop',
  'Tioga Engineering Team',
  ARRAY['solar cost nigeria','solar pricing','lithium battery','solar financing'],
  'Solar',
  true,
  now() - interval '5 days',
  'Solar System Cost in Nigeria (2026) — Real Naira Prices by Size',
  'See real 2026 Naira prices for 1.5kVA to 10kVA solar systems in Nigeria, what drives the cost, and how to finance with Tioga lease-to-own plans.',
  6
),
(
  'best-solar-size-for-nigerian-homes',
  'What Size Solar System Do You Actually Need? A Nigerian Home Sizing Guide',
  'Skip the guesswork. Learn how to size a solar system for your Nigerian home based on real appliance loads, autonomy days, and inverter headroom.',
$$Most undersized solar systems in Nigeria fail for the same reason: someone picked a "5kVA" because the neighbour has one — not because of an actual load calculation.

Here's how Tioga engineers size systems that *actually run your home*.

![Engineer reviewing solar system design](https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1600&q=80&auto=format&fit=crop)

## Step 1: List every appliance

Group them into:

- **Essentials** (must run 24/7): fridge, freezer, router, security lights
- **Daily** (run a few hours): TV, fans, laptops, phone chargers, blender
- **Occasional**: iron, microwave, pumping machine, washing machine

For each, note **watts** and **hours/day**. Add 20% safety margin.

## Step 2: Calculate daily energy (kWh/day)

```
Daily Wh = sum of (watts × hours)
Daily kWh = Daily Wh ÷ 1000
```

A typical 3-bed flat without AC lands around **6–9 kWh/day**. Add an inverter AC and that doubles.

## Step 3: Size the battery bank

```
Battery kWh = (Daily kWh × Autonomy Days) ÷ (Depth of Discharge × Efficiency)
```

For lithium: DoD = 0.9, efficiency = 0.95. For 1 autonomy day and 8 kWh consumption, you need roughly **9.3 kWh of lithium storage** (e.g. two 5kWh wall-mounts).

![Modern Nigerian home powered by solar](https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&q=80&auto=format&fit=crop)

## Step 4: Size the inverter

Your inverter must handle the **peak simultaneous load** — usually 60–70% of the sum of all running appliances at once. A 5kW hybrid inverter comfortably runs ~3.5kW continuous.

## Step 5: Size the solar array

```
Panel kW = (Daily kWh ÷ Sun-hours) ÷ Efficiency
```

Most of Nigeria gets **4.5–5.5 peak sun-hours/day**. For 8 kWh/day, you need around **2 kW of panels** — typically 4 × 550W modules.

## Skip the math

Our free [LumiVolt solar sizing tool](/lumivolt) does all of this in 60 seconds — and our [AI solar assessment](/assessment) generates a full engineering report you can hand to any installer.

## Sizing mistakes that cost the most

1. Forgetting the **freezer surge** at compressor start
2. Ignoring **harmattan dust** losses (de-rate panels by ~15% Dec–Feb)
3. Mixing **battery brands or ages** in one bank
4. Choosing inverter wattage based on a generator's kVA rating

When in doubt, [book a free site survey](/contact). It's cheaper than rebuilding a wrongly sized system in year two.
$$,
  'https://images.unsplash.com/photo-1592833159155-c62df1b65634?w=1600&q=80&auto=format&fit=crop',
  'Tioga Engineering Team',
  ARRAY['solar sizing','inverter sizing','battery sizing','nigerian homes'],
  'Guides',
  true,
  now() - interval '4 days',
  'Solar Sizing Guide for Nigerian Homes — kVA, kWh, Panels Explained',
  'A practical 5-step guide to sizing a solar system for any Nigerian home: appliances, daily kWh, batteries, inverter and panel array — with real examples.',
  7
),
(
  'solar-vs-generator-nigeria-cost-comparison',
  'Solar vs Generator in Nigeria: The Real 5-Year Cost Comparison',
  'We ran the numbers on a typical 5kVA Nigerian household across 5 years. The result will change how you think about your generator bill.',
$$Most Nigerian families treat their generator as a "free" backup because the diesel cost is paid in monthly chunks. Add it up over five years and the picture changes completely.

![Diesel generator running outside a Nigerian home](https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600&q=80&auto=format&fit=crop)

## The setup we modelled

A typical Lagos/Abuja household consuming **8 kWh/day**, running a 5kVA petrol generator for 6 hours daily during outages, vs a 5kVA Tioga hybrid solar system.

## 5-year total cost of ownership

| Item | Generator (5kVA) | Solar (5kVA lithium) |
|---|---|---|
| Upfront cost | ₦650,000 | ₦4,200,000 |
| Fuel (5yr @ ₦1,100/L) | ₦7,920,000 | ₦0 |
| Engine oil + filters | ₦240,000 | ₦0 |
| Major service (×2) | ₦300,000 | ₦0 |
| Replacement after 4–5 yrs | ₦650,000 | ₦0 (10-yr battery warranty) |
| **5-year total** | **₦9,760,000** | **₦4,200,000** |

The solar system pays for itself in roughly **26 months** — every month after is pure savings.

## What the table doesn't show

- **Noise pollution** and neighbour complaints
- **Carbon monoxide risk** from indoor exhaust
- **Fuel queueing** during scarcity
- **Engine failure** at the worst possible moment

![Quiet rooftop solar array on a Lagos home](https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&q=80&auto=format&fit=crop)

## "But I can't afford ₦4M upfront"

You don't have to. Tioga's [flexible payment plans](/finance) start from 3 months and go up to 24 months — your monthly payment is usually **less than your current diesel bill**.

A 5kVA system on a 12-month plan costs roughly **₦380,000/month** — most households spend ₦100k–₦180k/month on diesel alone. Within a year you own a quiet, fuel-free system outright.

## When a generator still makes sense

- Construction sites with intermittent heavy loads
- Industrial machinery > 15kW
- Backup-of-backup for hospitals and data centres

For the average Nigerian home? The math is no longer close.

[Get a personalised solar quote](/assessment) or [chat with our team on WhatsApp](https://wa.me/2348178000023).
$$,
  'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1600&q=80&auto=format&fit=crop',
  'Tioga Engineering Team',
  ARRAY['solar vs generator','diesel cost','solar savings nigeria'],
  'Solar',
  true,
  now() - interval '3 days',
  'Solar vs Generator in Nigeria — The Real 5-Year Cost (2026)',
  'A side-by-side 5-year cost comparison of running a 5kVA generator vs a 5kVA solar system in Nigeria. See why solar pays back in under 26 months.',
  6
),
(
  'flexible-solar-financing-nigeria-lease-to-own',
  'Flexible Solar Financing in Nigeria: Lease-to-Own vs Outright Purchase',
  'Should you pay cash or spread it over 24 months? Here is how Tioga''s lease-to-own model works, what it costs, and when each option is the smarter move.',
$$Cash purchase isn't always the right answer — even when you have the money.

Here's a clear breakdown of when to pay outright vs use a flexible payment plan from Tioga.

![Family in a solar-powered Nigerian home](https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1600&q=80&auto=format&fit=crop)

## How Tioga's Lease-to-Own works

You pick a system from our [solar packages](/packages) or a custom build from your [assessment report](/assessment). Then choose a tenure:

| Tenure | Best for | Interest tier |
|---|---|---|
| 3 months | Bridging an expected payout | Lowest |
| 6 months | Smoothing year-end cash flow | Low |
| 12 months | Most households | Standard |
| 24 months | Maximising monthly cash retained | Slightly higher |

Approval is online, you upload basic KYC, and once approved we install within 5–10 business days. You own the system from day one — Tioga simply retains an interest until the last payment clears.

## When to pay outright

- You have idle cash earning < 12% per annum
- You want zero monthly obligation
- You're buying a smaller system (< ₦1.5M)

## When financing wins

- Your **monthly diesel/fuel bill exceeds the proposed payment** (this is most Nigerian households today)
- You'd rather keep working capital for business
- You want to install a larger, future-proof system instead of compromising

![Modern solar inverter and lithium battery wall](https://images.unsplash.com/photo-1611365892117-bce8a09a6abc?w=1600&q=80&auto=format&fit=crop)

## Worked example

A ₦4.2M 5kVA lithium system on a 12-month plan:

- Monthly payment: ~₦380,000
- Diesel saved (current bill): ~₦150,000/month
- Productivity/comfort gained: priceless

Total out of pocket over 12 months: roughly ₦2.4M *net* after diesel savings — for a system that lasts 10+ years.

## What you need to apply

- Valid government ID (NIN or driver's licence)
- Proof of address (utility bill)
- Bank statement or income evidence
- Installation address survey (we handle it)

[Start a finance application](/finance) or [chat with us](/contact) — most decisions come back inside 48 hours.

## Common questions

**Is there a down payment?** Yes — typically 20–30% depending on tenure.

**Can I pay off early?** Absolutely, with no penalty.

**What happens if I miss a payment?** A short grace period applies, then standard recovery terms in your agreement. We always reach out first.
$$,
  'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1600&q=80&auto=format&fit=crop',
  'Tioga Finance Team',
  ARRAY['solar financing','lease to own','flexible payment','solar loan nigeria'],
  'Finance',
  true,
  now() - interval '2 days',
  'Solar Financing in Nigeria — Tioga Lease-to-Own (3, 6, 12, 24 Months)',
  'Compare lease-to-own vs outright solar purchase in Nigeria. See Tioga 3, 6, 12 and 24-month flexible payment plans, eligibility and worked examples.',
  6
),
(
  'smart-home-nigeria-beyond-the-hype',
  'Smart Homes in Nigeria, Beyond the Hype: What Actually Works on Unreliable Power',
  'Wi-Fi bulbs and voice assistants are useless when the grid is down. Here is how to design a genuinely smart, resilient home in Nigeria in 2026.',
$$The Nigerian smart home conversation needs a reset.

A house full of Wi-Fi gadgets that all die during a power outage isn't a smart home — it's an expensive lighting display.

![Smart lighting and home automation in a modern home](https://images.unsplash.com/photo-1558002038-1055907df827?w=1600&q=80&auto=format&fit=crop)

## What "smart" should actually mean here

A truly smart Nigerian home is built on three pillars:

1. **Resilient power** — solar + lithium, so automation never goes dark
2. **Local-first control** — devices that work without the cloud
3. **Integration over apps** — one dashboard, not twelve

## The power layer comes first

There is no point installing smart switches that lose state every outage. Begin with:

- A hybrid solar inverter with grid passthrough
- Lithium storage sized for at least 1 autonomy day
- Surge protection on every sensitive circuit

Browse [Tioga residential packages](/packages) sized exactly for this.

## Choosing devices that survive Nigerian conditions

| Bad fit | Better fit |
|---|---|
| Cloud-only smart plugs | Zigbee / Matter plugs with local control |
| Wi-Fi-only thermostats | Hybrid hub + sensor systems |
| Voice assistants requiring 24/7 internet | Local hubs (Home Assistant, Hubitat) |

![Solar-powered modern Nigerian home](https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1600&q=80&auto=format&fit=crop)

## The minimum-viable smart setup

1. Hybrid solar inverter + monitoring
2. One smart hub (local-first)
3. Smart breakers on the heaviest 2–3 circuits
4. Motion-activated security lighting on dedicated DC
5. Water-tank level sensor — no more dry pumps

That's it. You don't need 40 devices.

## Where AI fits

Use AI where it actually helps:

- **Load forecasting** — predict tomorrow's solar yield and shift heavy appliances
- **Anomaly alerts** — get notified before a fridge compressor fails
- **Energy reports** — Tioga's [VoltAi assistant](/voltai) can analyse your monthly usage and suggest savings

## The Tioga approach

We design smart homes the same way we design solar systems: **start from the load profile, work backwards**. Book a [free assessment](/assessment) and we'll map your house, not just sell you boxes.

A genuinely smart home in Nigeria is quiet, boring, and never makes you reach for the generator key. That's the goal.
$$,
  'https://images.unsplash.com/photo-1558002038-1055907df827?w=1600&q=80&auto=format&fit=crop',
  'Tioga Engineering Team',
  ARRAY['smart home nigeria','home automation','solar smart home','resilient power'],
  'Smart Home',
  true,
  now() - interval '1 day',
  'Smart Homes in Nigeria — What Actually Works on Unreliable Power (2026)',
  'How to design a genuinely smart, resilient home in Nigeria: solar-first power, local-control devices, and where AI adds real value over the hype.',
  6
)
ON CONFLICT (slug) DO NOTHING;


-- ==========================================
-- Migration: 20260630080220_2fd7b23c-479e-4dc4-826f-048e2d16504a.sql
-- ==========================================


-- Grant admin role to designated emails and any verified @tiogatechnologies.com user.

-- Backfill: existing users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
  AND (
    lower(u.email) = 'inememmanuel@gmail.com'
    OR lower(split_part(u.email, '@', 2)) = 'tiogatechnologies.com'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger function: auto-grant admin for verified-matching emails
CREATE OR REPLACE FUNCTION public.grant_admin_for_verified_tioga_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (
       lower(NEW.email) = 'inememmanuel@gmail.com'
       OR lower(split_part(NEW.email, '@', 2)) = 'tiogatechnologies.com'
     )
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_tioga_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_tioga_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_tioga_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_tioga_admin AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();


-- ==========================================
-- Migration: 20260630080232_16cb29a1-e797-4cca-ae27-2c7e2063bab6.sql
-- ==========================================


REVOKE EXECUTE ON FUNCTION public.grant_admin_for_verified_tioga_email() FROM PUBLIC, anon, authenticated;


-- ==========================================
-- Migration: 20260701065718_193897eb-3a43-4278-b5ab-7fd2b7564988.sql
-- ==========================================

-- 1. Extend superadmin trigger to include tiogatechnologies@gmail.com
CREATE OR REPLACE FUNCTION public.grant_admin_for_verified_tioga_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (
       lower(NEW.email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
       OR lower(split_part(NEW.email, '@', 2)) = 'tiogatechnologies.com'
     )
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- remove the auto-assigned customer role so the badge shows admin
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'customer';
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the triggers exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

-- 2. Backfill: grant admin to existing matching accounts and strip stray customer role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
   OR lower(split_part(email, '@', 2)) = 'tiogatechnologies.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'customer'
  AND (
    lower(u.email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
    OR lower(split_part(u.email, '@', 2)) = 'tiogatechnologies.com'
  );

-- 3. Global cache-bust row in site_settings (already exists as table)
INSERT INTO public.site_settings (key, value)
VALUES ('cache_bust', jsonb_build_object('bumped_at', now()))
ON CONFLICT (key) DO NOTHING;

-- 4. Backups log table
CREATE TABLE IF NOT EXISTS public.backups_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  drive_file_id text,
  drive_web_link text,
  size_bytes bigint,
  tables_count int,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  triggered_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.backups_log TO authenticated;
GRANT ALL ON public.backups_log TO service_role;

ALTER TABLE public.backups_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view backups" ON public.backups_log;
CREATE POLICY "Admins can view backups" ON public.backups_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service role manages backups" ON public.backups_log;
CREATE POLICY "Service role manages backups" ON public.backups_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ==========================================
-- Migration: 20260706194210_22e16b85-af58-45c9-b922-44a2f486fd81.sql
-- ==========================================

DROP POLICY IF EXISTS "Admins can view backups" ON public.backups_log;
CREATE POLICY "Admins can view backups" ON public.backups_log FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Skipped internal realtime.messages policy drop
-- Skipped internal realtime.messages policy creation

-- ==========================================
-- Migration: 20260708054420_0a7d1486-65e4-446a-94d7-3a1c830e51f3.sql
-- ==========================================


-- 1. Add columns to finance_schedules
ALTER TABLE public.finance_schedules
  ADD COLUMN IF NOT EXISTS payment_url text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS auto_charge_status text,
  ADD COLUMN IF NOT EXISTS last_charge_error text,
  ADD COLUMN IF NOT EXISTS is_deposit boolean NOT NULL DEFAULT false;

-- 2. Add columns to finance_applications
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
  ADD COLUMN IF NOT EXISTS paystack_customer_code text;

-- 3. payment_events table
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paystack',
  event_type text NOT NULL,
  reference text NOT NULL UNIQUE,
  schedule_id uuid REFERENCES public.finance_schedules(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.finance_applications(id) ON DELETE SET NULL,
  status text NOT NULL,
  amount_ngn numeric(12,2),
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own payment events" ON public.payment_events;
CREATE POLICY "Users read own payment events" ON public.payment_events FOR SELECT
  TO authenticated
  USING (
    application_id IN (SELECT id FROM public.finance_applications WHERE user_id = auth.uid())
    OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role])
  );

CREATE INDEX IF NOT EXISTS idx_payment_events_schedule ON public.payment_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_app ON public.payment_events(application_id);

-- 4. Trigger to auto-generate schedule on approval
CREATE OR REPLACE FUNCTION public.generate_finance_schedule_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  base_date date;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Skip if schedule already exists
    IF EXISTS (SELECT 1 FROM public.finance_schedules WHERE application_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    base_date := COALESCE(NEW.approved_at::date, CURRENT_DATE);

    -- Deposit row (installment_no = 0, due immediately)
    IF COALESCE(NEW.deposit_ngn, 0) > 0 THEN
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, 0, base_date, NEW.deposit_ngn, 'due', true, 'manual_required');
    END IF;

    -- Monthly installments
    FOR i IN 1..NEW.months LOOP
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, i, base_date + (i || ' months')::interval, NEW.monthly_payment_ngn, 'upcoming', false,
              CASE WHEN i = 1 THEN 'manual_required' ELSE 'scheduled' END);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gen_finance_schedule ON public.finance_applications;
CREATE TRIGGER trg_gen_finance_schedule AFTER UPDATE OF status ON public.finance_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_finance_schedule_on_approval();


-- ==========================================
-- Migration: 20260708054434_9532df74-c5b5-469b-890f-dc97d47512c0.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.generate_finance_schedule_on_approval() FROM PUBLIC, anon, authenticated;

-- ==========================================
-- Migration: 20260710104711_e2b9c371-9454-4aca-846d-13b66ce0cb2e.sql
-- ==========================================


-- 1. Extend finance_applications
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS direct_debit_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS effective_payment_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_asset_financing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS monthly_principal_ngn numeric,
  ADD COLUMN IF NOT EXISTS monthly_interest_ngn numeric,
  ADD COLUMN IF NOT EXISTS total_interest_ngn numeric,
  ADD COLUMN IF NOT EXISTS deadline_date date;

-- 2. Extend finance_schedules
ALTER TABLE public.finance_schedules
  ADD COLUMN IF NOT EXISTS original_due_date date,
  ADD COLUMN IF NOT EXISTS override_reason text;

UPDATE public.finance_schedules SET original_due_date = due_date WHERE original_due_date IS NULL;

-- 3. Extend payment_events with idempotency key
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS paystack_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_paystack_event_id_uidx
  ON public.payment_events(paystack_event_id) WHERE paystack_event_id IS NOT NULL;

-- 4. debit_retry_queue
CREATE TABLE IF NOT EXISTS public.debit_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.finance_schedules(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  attempt_number int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.debit_retry_queue TO service_role;
GRANT SELECT ON public.debit_retry_queue TO authenticated;
ALTER TABLE public.debit_retry_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view debit_retry_queue" ON public.debit_retry_queue;
CREATE POLICY "Admins can view debit_retry_queue" ON public.debit_retry_queue FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS debit_retry_queue_sched_idx ON public.debit_retry_queue(scheduled_date, status);
DROP TRIGGER IF EXISTS trg_debit_retry_queue_updated ON public.debit_retry_queue;
CREATE TRIGGER trg_debit_retry_queue_updated BEFORE UPDATE ON public.debit_retry_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. due_date_overrides
CREATE TABLE IF NOT EXISTS public.due_date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.finance_schedules(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  installment_no int NOT NULL,
  original_due_date date NOT NULL,
  new_due_date date NOT NULL,
  reason text,
  overridden_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.due_date_overrides TO service_role;
GRANT SELECT ON public.due_date_overrides TO authenticated;
ALTER TABLE public.due_date_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view due_date_overrides" ON public.due_date_overrides;
CREATE POLICY "Admins can view due_date_overrides" ON public.due_date_overrides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Extend approval trigger to compute amortization fields (flat/straight-line)
CREATE OR REPLACE FUNCTION public.generate_finance_schedule_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  i int;
  base_date date;
  fin numeric;
  ins int;
  interest_total numeric;
  monthly_p numeric;
  monthly_i numeric;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF EXISTS (SELECT 1 FROM public.finance_schedules WHERE application_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    base_date := COALESCE(NEW.approved_at::date, CURRENT_DATE);

    fin := COALESCE(NEW.financed_ngn, 0);
    ins := GREATEST(1, COALESCE(NEW.months, 1));
    interest_total := COALESCE(NEW.total_repayment_ngn, 0) - fin
                    - COALESCE(NEW.insurance_fee_ngn, 0) - COALESCE(NEW.management_fee_ngn, 0);
    IF interest_total < 0 THEN interest_total := 0; END IF;
    monthly_p := ROUND(fin / ins);
    monthly_i := ROUND(interest_total / ins);

    UPDATE public.finance_applications
      SET monthly_principal_ngn = monthly_p,
          monthly_interest_ngn = monthly_i,
          total_interest_ngn = interest_total
      WHERE id = NEW.id;

    IF COALESCE(NEW.deposit_ngn, 0) > 0 THEN
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, original_due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, 0, base_date, base_date, NEW.deposit_ngn, 'due', true, 'manual_required');
    END IF;

    FOR i IN 1..NEW.months LOOP
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, original_due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, i, base_date + (i || ' months')::interval, base_date + (i || ' months')::interval,
              NEW.monthly_payment_ngn, 'upcoming', false,
              CASE WHEN i = 1 THEN 'manual_required' ELSE 'scheduled' END);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;


-- ==========================================
-- Migration: 20260711102811_ed083ef4-eeb7-4bfb-9be3-9c9ae275153b.sql
-- ==========================================


-- 1. Monthly free-credit reset support
ALTER TABLE public.assessment_credits
  ADD COLUMN IF NOT EXISTS last_reset_at timestamptz;

-- 2. Drop the insecure public share policy (anyone could read any shared assessment)
DROP POLICY IF EXISTS "Public read by share token" ON public.solar_assessments;

-- 3. Function that tops up every user's free credits to at least 3 once per calendar month.
-- Never reduces total_credits, never touches purchased_credits or used_credits.
CREATE OR REPLACE FUNCTION public.reset_monthly_free_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
  month_start timestamptz := date_trunc('month', now());
BEGIN
  WITH upd AS (
    UPDATE public.assessment_credits
    SET total_credits = GREATEST(total_credits, 3),
        used_credits = 0,
        last_reset_at = month_start,
        updated_at = now()
    WHERE last_reset_at IS NULL OR last_reset_at < month_start
    RETURNING user_id
  )
  SELECT count(*) INTO updated_count FROM upd;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_monthly_free_credits() TO service_role;


-- ==========================================
-- Migration: 20260711102825_41817d8c-7f03-4bec-833b-461a89039671.sql
-- ==========================================


REVOKE ALL ON FUNCTION public.reset_monthly_free_credits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_monthly_free_credits() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_free_credits() TO service_role;


-- ==========================================
-- Migration: 20260712081944_ebab5e72-2fbf-4237-9ea3-d72200898390.sql
-- ==========================================


-- 1) Remove the redundant/weak INSERT policy on finance_applications
DROP POLICY IF EXISTS "Users insert their applications" ON public.finance_applications;
DROP POLICY IF EXISTS "Users insert own applications" ON public.finance_applications;
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;

-- Authenticated users: must own the row AND cannot pre-approve
DROP POLICY IF EXISTS "Users insert own applications" ON public.finance_applications;
CREATE POLICY "Users insert own applications" ON public.finance_applications
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
);

-- Anonymous guests: no owner, cannot pre-approve, basic length checks retained
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications" ON public.finance_applications
FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'pending'
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (id_number IS NULL OR length(btrim(id_number)) BETWEEN 3 AND 50)
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

-- 2) Tighten orders INSERT — customers/anon cannot pre-set paid/completed
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  COALESCE(payment_status, 'pending') = 'pending'
  AND COALESCE(status, 'new') = 'new'
  AND payment_reference IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND length(btrim(location)) BETWEEN 2 AND 200
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND item_count BETWEEN 1 AND 200
);


-- ==========================================
-- Migration: 20260715084033_b9fcc61d-80c5-46cc-8196-3536e8d95e70.sql
-- ==========================================


-- 1) Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.enforce_deposit_before_installments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deposit_status text;
BEGIN
  IF NEW.status = 'paid' AND NEW.is_deposit = false AND OLD.status <> 'paid' THEN
    SELECT status INTO deposit_status
    FROM finance_schedules
    WHERE application_id = NEW.application_id AND is_deposit = true
    LIMIT 1;

    IF deposit_status IS DISTINCT FROM 'paid' THEN
      RAISE EXCEPTION 'Deposit must be paid before any installment can be marked paid (application_id: %)', NEW.application_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Solar assessments: restrict which columns customers can change on UPDATE
CREATE OR REPLACE FUNCTION public.solar_assessments_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass for service_role and privileged users
  IF auth.uid() IS NULL OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_full_unlocked IS DISTINCT FROM OLD.is_full_unlocked THEN
    RAISE EXCEPTION 'Not allowed to modify is_full_unlocked';
  END IF;
  IF NEW.full_report IS DISTINCT FROM OLD.full_report THEN
    RAISE EXCEPTION 'Not allowed to modify full_report';
  END IF;
  IF NEW.engineer_notes IS DISTINCT FROM OLD.engineer_notes THEN
    RAISE EXCEPTION 'Not allowed to modify engineer_notes';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to modify status';
  END IF;
  IF NEW.share_token IS DISTINCT FROM OLD.share_token THEN
    RAISE EXCEPTION 'Not allowed to modify share_token';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to reassign user_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_solar_assessments_guard ON public.solar_assessments;
CREATE TRIGGER trg_solar_assessments_guard BEFORE UPDATE ON public.solar_assessments
FOR EACH ROW EXECUTE FUNCTION public.solar_assessments_guard_privileged_fields();

-- Tighten the UPDATE policy with an explicit WITH CHECK
DROP POLICY IF EXISTS "Users update own assessments" ON public.solar_assessments;
CREATE POLICY "Users update own assessments" ON public.solar_assessments
FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid()) OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
)
WITH CHECK (
  (user_id = auth.uid()) OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
);

-- 3) LumiVolt sizings: restrict which fields non-admin users can change
CREATE OR REPLACE FUNCTION public.lumivolt_sizings_guard_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Not allowed to change email';
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    RAISE EXCEPTION 'Not allowed to change source';
  END IF;
  IF NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Not allowed to change notes';
  END IF;
  IF NEW.daily_energy_wh IS DISTINCT FROM OLD.daily_energy_wh THEN
    RAISE EXCEPTION 'Not allowed to change daily_energy_wh';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lumivolt_sizings_guard ON public.lumivolt_sizings;
CREATE TRIGGER trg_lumivolt_sizings_guard BEFORE UPDATE ON public.lumivolt_sizings
FOR EACH ROW EXECUTE FUNCTION public.lumivolt_sizings_guard_fields();

DROP POLICY IF EXISTS "Users can update their own sizings" ON public.lumivolt_sizings;
CREATE POLICY "Users can update their own sizings" ON public.lumivolt_sizings
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ==========================================
-- Migration: 20260715084047_1156f838-155c-4e3a-be24-5c50a27eaa6a.sql
-- ==========================================


REVOKE ALL ON FUNCTION public.solar_assessments_guard_privileged_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lumivolt_sizings_guard_fields() FROM PUBLIC, anon, authenticated;


-- ==========================================
-- Migration: 20260716122904_21dc099b-ea9f-4965-9c7a-f0a4d8b56600.sql
-- ==========================================


ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS is_new_session boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON public.page_views (utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_landing ON public.page_views (landing_path) WHERE is_new_session = true;

CREATE INDEX IF NOT EXISTS idx_conversions_event_type ON public.conversions (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_session ON public.conversions (session_id);


-- ==========================================
-- Migration: 20260719115159_71f909c1-1975-4cf3-8cfc-a87286de656c.sql
-- ==========================================

DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- ==========================================
-- Migration: 20260720135326_09fb039a-84c9-4ea3-a9a6-e6c9ba2077e6.sql
-- ==========================================


CREATE SEQUENCE IF NOT EXISTS public.support_tickets_number_seq START 1000;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || nextval('public.support_tickets_number_seq')::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_contact TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  conversation_context TEXT,
  channel TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.support_tickets_number_seq OWNED BY public.support_tickets.ticket_number;

GRANT SELECT, INSERT ON public.support_tickets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT USAGE ON SEQUENCE public.support_tickets_number_seq TO anon, authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can create a ticket, but only with safe defaults.
DROP POLICY IF EXISTS "Anyone can create a support ticket" ON public.support_tickets;
CREATE POLICY "Anyone can create a support ticket" ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'open'
    AND resolved_at IS NULL
    AND length(user_name) BETWEEN 1 AND 200
    AND length(user_contact) BETWEEN 1 AND 200
    AND length(message) BETWEEN 1 AND 10000
  );

-- Signed-in users can read their own tickets.
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin and staff can view all tickets.
DROP POLICY IF EXISTS "Admin/staff can view all tickets" ON public.support_tickets;
CREATE POLICY "Admin/staff can view all tickets" ON public.support_tickets FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]));

-- Admin and staff can update tickets.
DROP POLICY IF EXISTS "Admin/staff can update tickets" ON public.support_tickets;
CREATE POLICY "Admin/staff can update tickets" ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]));

-- Admin can delete tickets.
DROP POLICY IF EXISTS "Admin can delete tickets" ON public.support_tickets;
CREATE POLICY "Admin can delete tickets" ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON public.support_tickets(user_id);

DROP TRIGGER IF EXISTS set_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER set_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ==========================================
-- Migration: 20260722173058_d6204525-3907-42f4-a105-35c370411a43.sql
-- ==========================================


-- 1. Fix affiliate_applications SELECT policy: avoid auth.users lookup
DROP POLICY IF EXISTS "Users view own affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Users view own affiliate applications" ON public.affiliate_applications
FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 2. Fix stock movement trigger to update stock_qty (real column) not stock
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.products
    SET stock_qty = GREATEST(0, COALESCE(stock_qty, 0) + NEW.delta)
    WHERE id = NEW.product_id;
  RETURN NEW;
END;
$function$;


-- ==========================================
-- Migration: 20260723163549_65b966a3-9d8c-4afa-addc-b350be693903.sql
-- ==========================================


-- Custom named roles (inherit from a base app_role)
CREATE TABLE IF NOT EXISTS public.custom_roles (
  key text PRIMARY KEY,
  label text NOT NULL,
  base_role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT ALL ON public.custom_roles TO service_role;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone signed-in can read custom roles" ON public.custom_roles;
CREATE POLICY "Anyone signed-in can read custom roles" ON public.custom_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage custom roles" ON public.custom_roles;
CREATE POLICY "Admins manage custom roles" ON public.custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User -> custom role assignment (one per user)
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_key text NOT NULL REFERENCES public.custom_roles(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_custom_roles TO authenticated;
GRANT ALL ON public.user_custom_roles TO service_role;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read their own custom role" ON public.user_custom_roles;
CREATE POLICY "Users read their own custom role" ON public.user_custom_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage user custom roles" ON public.user_custom_roles;
CREATE POLICY "Admins manage user custom roles" ON public.user_custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Per-role, per-page access overrides. role_key can be 'staff','engineer','affiliate' or a custom_roles.key
CREATE TABLE IF NOT EXISTS public.role_page_permissions (
  role_key text NOT NULL,
  page_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, page_key)
);
GRANT SELECT ON public.role_page_permissions TO authenticated;
GRANT ALL ON public.role_page_permissions TO service_role;
ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Signed-in can read page permissions" ON public.role_page_permissions;
CREATE POLICY "Signed-in can read page permissions" ON public.role_page_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage page permissions" ON public.role_page_permissions;
CREATE POLICY "Admins manage page permissions" ON public.role_page_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- ==========================================
-- Migration: 20260725213345_8b59af87-e80d-40e1-b425-171e873a102d.sql
-- ==========================================

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO anon;

-- ==========================================
-- Migration: 20260725213401_4f3b3ca6-2942-4361-b071-8b913cb192a1.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO anon, authenticated, service_role;

-- ==========================================
-- Migration: 20260726090219_3e51f712-1bdd-4a87-8e0f-b15b68c74f5c.sql
-- ==========================================

-- RBMS hardening: make the permission matrix usable and enforceable through RLS.
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.custom_roles TO authenticated;
GRANT ALL ON public.custom_roles TO service_role;

GRANT SELECT ON public.user_custom_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_custom_roles TO authenticated;
GRANT ALL ON public.user_custom_roles TO service_role;

GRANT SELECT ON public.role_page_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.role_page_permissions TO authenticated;
GRANT ALL ON public.role_page_permissions TO service_role;

-- Keep legacy public role helpers executable where older policies/functions may still reference them.
-- They are SECURITY DEFINER functions that only return booleans and do not expose role rows.
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- Prefer private hardened helpers inside RBMS policies.
DROP POLICY IF EXISTS "Admins manage custom roles" ON public.custom_roles;
CREATE POLICY "Admins manage custom roles" ON public.custom_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage user custom roles" ON public.user_custom_roles;
CREATE POLICY "Admins manage user custom roles" ON public.user_custom_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read their own custom role" ON public.user_custom_roles;
CREATE POLICY "Users read their own custom role" ON public.user_custom_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage page permissions" ON public.role_page_permissions;
CREATE POLICY "Admins manage page permissions" ON public.role_page_permissions
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- ==========================================
-- Migration: 20260726090312_79952394-ae44-4518-96ac-c308117ef116.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- ==========================================
-- Migration: 20260728125726_7242d5ce-6b10-4541-9c8c-d5a8dda0c1f3.sql
-- ==========================================

DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

DROP POLICY IF EXISTS "Read own roles or admin reads all" ON public.user_roles;
CREATE POLICY "Read own roles or admin reads all" ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

-- ==========================================
-- Migration: 20260730072308_b3a3bfd0-5a50-44e4-a9a4-0031ff43c54e.sql
-- ==========================================

-- 1. finance_payments: block self-verification on user inserts
DROP POLICY IF EXISTS "Users submit payments" ON public.finance_payments;
CREATE POLICY "Users submit payments" ON public.finance_payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.finance_applications a
    WHERE a.id = finance_payments.application_id
      AND a.user_id = auth.uid()
  )
  AND verified = false
  AND verified_by IS NULL
  AND verified_at IS NULL
);

-- 2. role_page_permissions: restrict reads to privileged roles
DROP POLICY IF EXISTS "Signed-in can read page permissions" ON public.role_page_permissions;
DROP POLICY IF EXISTS "Privileged roles can read page permissions" ON public.role_page_permissions;
CREATE POLICY "Privileged roles can read page permissions" ON public.role_page_permissions
FOR SELECT
TO authenticated
USING (
  private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
);

-- ==========================================
-- Migration: 20260730074931_9ebc251d-b69c-4f41-ba63-e800520ec47e.sql
-- ==========================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_address jsonb;

-- ==========================================
-- Migration: 20260731141957_47529e1e-7030-43c6-bc94-621e428493a8.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.product_reviews;
CREATE POLICY "Public can read approved reviews" ON public.product_reviews FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Users can read own reviews" ON public.product_reviews;
CREATE POLICY "Users can read own reviews" ON public.product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can read all reviews" ON public.product_reviews;
CREATE POLICY "Staff can read all reviews" ON public.product_reviews FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP POLICY IF EXISTS "Users can write own reviews" ON public.product_reviews;
CREATE POLICY "Users can write own reviews" ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND admin_reply IS NULL
    AND length(body) BETWEEN 5 AND 4000
    AND length(author_name) BETWEEN 2 AND 120
  );

DROP POLICY IF EXISTS "Users can edit own reviews" ON public.product_reviews;
CREATE POLICY "Users can edit own reviews" ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews" ON public.product_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can moderate reviews" ON public.product_reviews;
CREATE POLICY "Staff can moderate reviews" ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP POLICY IF EXISTS "Staff can delete reviews" ON public.product_reviews;
CREATE POLICY "Staff can delete reviews" ON public.product_reviews FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP TRIGGER IF EXISTS product_reviews_set_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_set_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Guard: non-staff cannot self-approve or set admin_reply / verified_purchase
CREATE OR REPLACE FUNCTION public.product_reviews_guard_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to change review status';
  END IF;
  IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply THEN
    RAISE EXCEPTION 'Not allowed to change admin_reply';
  END IF;
  IF NEW.verified_purchase IS DISTINCT FROM OLD.verified_purchase THEN
    RAISE EXCEPTION 'Not allowed to change verified_purchase';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_reviews_guard ON public.product_reviews;
CREATE TRIGGER product_reviews_guard BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.product_reviews_guard_fields();

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id, status);

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- ==========================================
-- Migration: 20260731142023_70979c43-1064-457c-8fdb-084c7e7a9e6d.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.product_reviews_guard_fields() FROM PUBLIC, anon, authenticated;

-- ==========================================
-- Migration: 20260801194447_44456f80-3dbc-4e83-979e-cb55b554b891.sql
-- ==========================================


DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders
FOR INSERT
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (COALESCE(payment_status, 'pending') = 'pending')
  AND (COALESCE(status, 'new') = 'new')
  AND payment_reference IS NULL
  AND (length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120)
  AND (length(btrim(phone)) >= 7 AND length(btrim(phone)) <= 40)
  AND (length(btrim(location)) >= 2 AND length(btrim(location)) <= 200)
  AND (email IS NULL OR (length(btrim(email)) >= 5 AND length(btrim(email)) <= 255))
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (item_count >= 1 AND item_count <= 200)
);

DROP POLICY IF EXISTS "Public can insert valid sizings" ON public.lumivolt_sizings;
CREATE POLICY "Public can insert valid sizings" ON public.lumivolt_sizings
FOR INSERT
WITH CHECK (
  daily_energy_wh > 0
  AND (
    (
      auth.uid() IS NOT NULL
      AND (user_id IS NULL OR user_id = auth.uid())
      AND (
        email IS NULL
        OR lower(btrim(email)) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
      )
    )
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND email IS NOT NULL
      AND length(btrim(email)) BETWEEN 5 AND 255
      AND btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
    )
  )
);


-- ==========================================
-- Migration: 20260801195623_email_infra.sql
-- ==========================================

-- Email infrastructure
-- Creates the queue system, send log, send state, suppression, and unsubscribe
-- tables used by both auth and transactional emails.

-- Extensions required for queue processing
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- Create email queues (auth = high priority, transactional = normal)
-- Wrapped in DO blocks to handle "queue already exists" errors idempotently.
DO $$ BEGIN PERFORM pgmq.create('auth_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Dead-letter queues for messages that exceed max retries
DO $$ BEGIN PERFORM pgmq.create('auth_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM pgmq.create('transactional_emails_dlq'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Email send log table (audit trail for all send attempts)
-- UPDATE is allowed for the service role so the suppression edge function
-- can update a log record's status when a bounce/complaint/unsubscribe occurs.
CREATE TABLE IF NOT EXISTS public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase no longer grants public-schema access to service_role by default;
-- emit the grant explicitly so edge functions can reach the table via PostgREST.
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
CREATE POLICY "Service role can read send log" ON public.email_send_log FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
CREATE POLICY "Service role can insert send log" ON public.email_send_log FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role can update send log" ON public.email_send_log FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient ON public.email_send_log(recipient_email);

-- Backfill: add message_id column to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_log ADD COLUMN IF NOT EXISTS message_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_send_log_message ON public.email_send_log(message_id);

-- Prevent duplicate sends: only one 'sent' row per message_id.
-- If VT expires and another worker picks up the same message, the pre-send
-- check catches it. This index is a DB-level safety net for race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_send_log_message_sent_unique
  ON public.email_send_log(message_id) WHERE status = 'sent';

-- Backfill: update status CHECK constraint for existing tables that predate new statuses
DO $$ BEGIN
  ALTER TABLE public.email_send_log DROP CONSTRAINT IF EXISTS email_send_log_status_check;
  ALTER TABLE public.email_send_log ADD CONSTRAINT email_send_log_status_check
    CHECK (status IN ('pending', 'sent', 'suppressed', 'failed', 'bounced', 'complained', 'dlq'));
END $$;

-- Rate-limit state and queue config (single row, tracks Retry-After cooldown + throughput settings)
CREATE TABLE IF NOT EXISTS public.email_send_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retry_after_until TIMESTAMPTZ,
  batch_size INTEGER NOT NULL DEFAULT 10,
  send_delay_ms INTEGER NOT NULL DEFAULT 200,
  auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Backfill: add config columns to existing tables that predate this migration
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN IF NOT EXISTS batch_size INTEGER NOT NULL DEFAULT 10;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN IF NOT EXISTS send_delay_ms INTEGER NOT NULL DEFAULT 200;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN IF NOT EXISTS auth_email_ttl_minutes INTEGER NOT NULL DEFAULT 15;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.email_send_state ADD COLUMN IF NOT EXISTS transactional_email_ttl_minutes INTEGER NOT NULL DEFAULT 60;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

GRANT ALL ON public.email_send_state TO service_role;

ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state" ON public.email_send_state FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RPC wrappers so Edge Functions can interact with pgmq via supabase.rpc()
-- (PostgREST only exposes functions in the public schema; pgmq functions are in the pgmq schema)
-- All wrappers auto-create the queue on undefined_table (42P01) so emails
-- are never lost if the queue was dropped (extension upgrade, restore, etc.).
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INT, vt INT)
RETURNS TABLE(msg_id BIGINT, read_ct INT, message JSONB)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, message_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(
  source_queue TEXT, dlq_name TEXT, message_id BIGINT, payload JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

-- Restrict queue RPC wrappers to service_role only (SECURITY DEFINER runs as owner,
-- so without this any authenticated user could manipulate the email queues)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Suppressed emails table (tracks unsubscribes, bounces, complaints)
-- Append-only: no DELETE or UPDATE policies to prevent bypassing suppression.
CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

GRANT ALL ON public.suppressed_emails TO service_role;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email ON public.suppressed_emails(email);

-- Email unsubscribe tokens table (one token per email address for unsubscribe links)
-- No DELETE policy to prevent removing tokens. UPDATE allowed only to mark tokens as used.
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

GRANT ALL ON public.email_unsubscribe_tokens TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens FOR SELECT
    USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.email_unsubscribe_tokens(token);

-- ============================================================
-- POST-MIGRATION STEPS (applied dynamically by setup_email_infra)
-- These steps contain project-specific secrets and URLs and
-- cannot be expressed as static SQL. They are applied via the
-- Supabase Management API (ExecuteSQL) each time the tool runs.
-- ============================================================
--
-- 1. VAULT SECRET
--    Stores (or updates) the Supabase service_role key in
--    vault as 'email_queue_service_role_key'.
--    Uses vault.create_secret / vault.update_secret (upsert).
--    To revert: DELETE FROM vault.secrets WHERE name = 'email_queue_service_role_key';
--
-- 2. CRON JOB (pg_cron)
--    Creates job 'process-email-queue' with a 5-second interval.
--    The job checks:
--      a) rate-limit cooldown (email_send_state.retry_after_until)
--      b) whether auth_emails or transactional_emails queues have messages
--    If conditions are met, it calls the process-email-queue Edge Function
--    via net.http_post using the vault-stored service_role key.
--    To revert: SELECT cron.unschedule('process-email-queue');


-- ==========================================
-- Migration: 20260803135017_cc3d49e3-d270-403e-b45c-64e5a779fa67.sql
-- ==========================================

-- 1. custom_roles: restrict read to admin/staff
DROP POLICY IF EXISTS "Anyone signed-in can read custom roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Privileged users read custom roles" ON public.custom_roles;
CREATE POLICY "Privileged users read custom roles" ON public.custom_roles FOR SELECT TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

-- 2. finance_applications insert policies: block self-declared payment authorization fields
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications" ON public.finance_applications FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'pending'::finance_app_status
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND paystack_authorization_code IS NULL
  AND paystack_customer_code IS NULL
  AND consent_ip IS NULL
  AND effective_payment_method IN ('manual','auto_debit')
  AND (length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120)
  AND (length(btrim(phone)) >= 7 AND length(btrim(phone)) <= 40)
  AND (email IS NULL OR (length(btrim(email)) >= 5 AND length(btrim(email)) <= 255))
  AND (id_number IS NULL OR (length(btrim(id_number)) >= 3 AND length(btrim(id_number)) <= 50))
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

DROP POLICY IF EXISTS "Users insert own applications" ON public.finance_applications;
CREATE POLICY "Users insert own applications" ON public.finance_applications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'::finance_app_status
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND paystack_authorization_code IS NULL
  AND paystack_customer_code IS NULL
  AND consent_ip IS NULL
  AND effective_payment_method IN ('manual','auto_debit')
);

-- 3. Fix mutable search_path on remaining functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;


-- ==========================================
-- Migration: 20260803135103_4f0f2425-43da-46fa-8154-ccaf79fa4c58.sql
-- ==========================================

DROP POLICY IF EXISTS "Users read own assigned custom role" ON public.custom_roles;
CREATE POLICY "Users read own assigned custom role" ON public.custom_roles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_custom_roles ucr
  WHERE ucr.custom_role_key = custom_roles.key AND ucr.user_id = auth.uid()
));

-- ==========================================
-- Migration: 20260803135826_1cbddca0-52eb-49de-bf55-36d6bcaaa1ba.sql
-- ==========================================

-- Helper: resolve the affiliate row belonging to the signed-in user (by email)
CREATE OR REPLACE FUNCTION public.current_affiliate_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.affiliates a
  WHERE lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  LIMIT 1
$$;

-- ============ affiliate_links ============
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  destination_path text NOT NULL DEFAULT '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO authenticated;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates read own links" ON public.affiliate_links;
CREATE POLICY "Affiliates read own links" ON public.affiliate_links
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP POLICY IF EXISTS "Affiliates create own links" ON public.affiliate_links;
CREATE POLICY "Affiliates create own links" ON public.affiliate_links
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.current_affiliate_id());

DROP POLICY IF EXISTS "Affiliates update own links" ON public.affiliate_links;
CREATE POLICY "Affiliates update own links" ON public.affiliate_links
  FOR UPDATE TO authenticated
  USING (affiliate_id = public.current_affiliate_id())
  WITH CHECK (affiliate_id = public.current_affiliate_id());

DROP POLICY IF EXISTS "Affiliates delete own links" ON public.affiliate_links;
CREATE POLICY "Affiliates delete own links" ON public.affiliate_links
  FOR DELETE TO authenticated
  USING (affiliate_id = public.current_affiliate_id());

DROP POLICY IF EXISTS "Admins manage all links" ON public.affiliate_links;
CREATE POLICY "Admins manage all links" ON public.affiliate_links
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS affiliate_links_set_updated_at ON public.affiliate_links;
CREATE TRIGGER affiliate_links_set_updated_at BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate ON public.affiliate_links(affiliate_id);

-- ============ affiliate_link_clicks ============
CREATE TABLE IF NOT EXISTS public.affiliate_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  slug text,
  session_id text,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.affiliate_link_clicks TO authenticated;
GRANT ALL ON public.affiliate_link_clicks TO service_role;
ALTER TABLE public.affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates read own clicks" ON public.affiliate_link_clicks;
CREATE POLICY "Affiliates read own clicks" ON public.affiliate_link_clicks
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON public.affiliate_link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_date ON public.affiliate_link_clicks(affiliate_id, created_at DESC);

-- ============ affiliate_payout_requests ============
CREATE TABLE IF NOT EXISTS public.affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  note text,
  admin_note text,
  decided_by uuid,
  decided_at timestamptz,
  payout_id uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.affiliate_payout_requests TO authenticated;
GRANT ALL ON public.affiliate_payout_requests TO service_role;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates read own payout requests" ON public.affiliate_payout_requests;
CREATE POLICY "Affiliates read own payout requests" ON public.affiliate_payout_requests
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP POLICY IF EXISTS "Affiliates create own payout requests" ON public.affiliate_payout_requests;
CREATE POLICY "Affiliates create own payout requests" ON public.affiliate_payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.current_affiliate_id()
              AND status = 'pending'
              AND decided_by IS NULL
              AND decided_at IS NULL
              AND payout_id IS NULL);

DROP POLICY IF EXISTS "Admins manage payout requests" ON public.affiliate_payout_requests;
CREATE POLICY "Admins manage payout requests" ON public.affiliate_payout_requests
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS affiliate_payout_requests_set_updated_at ON public.affiliate_payout_requests;
CREATE TRIGGER affiliate_payout_requests_set_updated_at BEFORE UPDATE ON public.affiliate_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ affiliates: self read + payout detail self-service ============
DROP POLICY IF EXISTS "Affiliates read own record" ON public.affiliates;
CREATE POLICY "Affiliates read own record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (id = public.current_affiliate_id());

DROP POLICY IF EXISTS "Affiliates update own payout details" ON public.affiliates;
CREATE POLICY "Affiliates update own payout details" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (id = public.current_affiliate_id())
  WITH CHECK (id = public.current_affiliate_id());

CREATE OR REPLACE FUNCTION public.affiliates_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.code IS DISTINCT FROM OLD.code
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.application_id IS DISTINCT FROM OLD.application_id
     OR NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Only payout details and contact phone can be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS affiliates_self_update_guard ON public.affiliates;
CREATE TRIGGER affiliates_self_update_guard BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.affiliates_guard_self_update();

-- ============ link attribution on leads/orders ============
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS affiliate_link_slug text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_link_slug text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content text;

-- ==========================================
-- Migration: 20260805081033_a19aca08-2572-408b-80c8-280dd433ddde.sql
-- ==========================================

-- Workflow columns on lumivolt_sizings
ALTER TABLE public.lumivolt_sizings
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS sales_owner_id uuid,
  ADD COLUMN IF NOT EXISTS engineer_owner_id uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS revised jsonb,
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lumivolt_sizings_share_token_key ON public.lumivolt_sizings (share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS lumivolt_sizings_pipeline_status_idx ON public.lumivolt_sizings (pipeline_status);

-- Workflow columns on solar_assessments
ALTER TABLE public.solar_assessments
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS sales_owner_id uuid,
  ADD COLUMN IF NOT EXISTS engineer_owner_id uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS revised jsonb;

CREATE INDEX IF NOT EXISTS solar_assessments_pipeline_status_idx ON public.solar_assessments (pipeline_status);

-- Timeline of internal events for a brief (sizing or assessment)
CREATE TABLE IF NOT EXISTS public.brief_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('sizing', 'assessment')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('status', 'assignment', 'note', 'revision', 'export', 'quote')),
  from_value text,
  to_value text,
  note text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.brief_events TO authenticated;
GRANT ALL ON public.brief_events TO service_role;

ALTER TABLE public.brief_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Privileged can read brief events" ON public.brief_events;
CREATE POLICY "Privileged can read brief events" ON public.brief_events FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));

DROP POLICY IF EXISTS "Privileged can add brief events" ON public.brief_events;
CREATE POLICY "Privileged can add brief events" ON public.brief_events FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
  AND actor_id = auth.uid()
);

CREATE INDEX IF NOT EXISTS brief_events_entity_idx ON public.brief_events (entity_type, entity_id, created_at DESC);

-- ==========================================
-- Migration: 20260806072456_ee809ad3-8a04-4368-9727-229fa825d36d.sql
-- ==========================================

-- ============ QUOTES ============
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  version integer NOT NULL DEFAULT 1,
  parent_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  sizing_id uuid REFERENCES public.lumivolt_sizings(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_location text,
  title text NOT NULL DEFAULT 'Solar System Quotation',
  subtitle text,
  scope text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  options_table jsonb,
  notes text[] NOT NULL DEFAULT '{}',
  exclusions text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  deposit_pct numeric NOT NULL DEFAULT 30,
  valid_until date,
  status text NOT NULL DEFAULT 'draft',
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotes_sizing ON public.quotes(sizing_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assessment ON public.quotes(assessment_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage quotes" ON public.quotes;
CREATE POLICY "Staff manage quotes" ON public.quotes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
DROP POLICY IF EXISTS "Customers view own quotes" ON public.quotes;
CREATE POLICY "Customers view own quotes" ON public.quotes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));

DROP TRIGGER IF EXISTS quotes_set_updated_at ON public.quotes;
CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRODUCT WARRANTY ============
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty_months integer NOT NULL DEFAULT 12;

-- ============ DEVICE SERIALS ============
CREATE TABLE IF NOT EXISTS public.device_serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  user_id uuid,
  customer_email text,
  status text NOT NULL DEFAULT 'dispatched',
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  warranty_until date,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT device_serials_serial_unique UNIQUE (serial)
);
CREATE INDEX IF NOT EXISTS idx_device_serials_order ON public.device_serials(order_id);
CREATE INDEX IF NOT EXISTS idx_device_serials_serial ON public.device_serials(lower(serial));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_serials TO authenticated;
GRANT ALL ON public.device_serials TO service_role;
ALTER TABLE public.device_serials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage serials" ON public.device_serials;
CREATE POLICY "Staff manage serials" ON public.device_serials FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
DROP POLICY IF EXISTS "Customers view own serials" ON public.device_serials;
CREATE POLICY "Customers view own serials" ON public.device_serials FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));

DROP TRIGGER IF EXISTS device_serials_set_updated_at ON public.device_serials;
CREATE TRIGGER device_serials_set_updated_at BEFORE UPDATE ON public.device_serials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ WARRANTY CLAIMS ============
CREATE SEQUENCE IF NOT EXISTS public.rma_seq START 1000;

CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number text NOT NULL UNIQUE DEFAULT ('RMA-' || nextval('public.rma_seq')),
  serial_id uuid REFERENCES public.device_serials(id) ON DELETE SET NULL,
  serial text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_name text,
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  reason text NOT NULL,
  description text NOT NULL,
  photo_urls text[] NOT NULL DEFAULT '{}',
  in_warranty boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'submitted',
  resolution text,
  assigned_to uuid,
  internal_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON public.warranty_claims(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage claims" ON public.warranty_claims;
CREATE POLICY "Staff manage claims" ON public.warranty_claims FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
DROP POLICY IF EXISTS "Customers view own claims" ON public.warranty_claims;
CREATE POLICY "Customers view own claims" ON public.warranty_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));
DROP POLICY IF EXISTS "Customers create own claims" ON public.warranty_claims;
CREATE POLICY "Customers create own claims" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email',''))
    AND status = 'submitted'
    AND assigned_to IS NULL
    AND resolution IS NULL
    AND internal_notes IS NULL
    AND resolved_at IS NULL
  );

DROP TRIGGER IF EXISTS warranty_claims_set_updated_at ON public.warranty_claims;
CREATE TRIGGER warranty_claims_set_updated_at BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.warranty_claims_guard_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.resolution IS DISTINCT FROM OLD.resolution
     OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
     OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
     OR NEW.in_warranty IS DISTINCT FROM OLD.in_warranty
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only staff can change claim handling fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS warranty_claims_guard ON public.warranty_claims;
CREATE TRIGGER warranty_claims_guard BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.warranty_claims_guard_fields();

CREATE TABLE IF NOT EXISTS public.warranty_claim_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_value text,
  to_value text,
  note text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.warranty_claim_events TO authenticated;
GRANT ALL ON public.warranty_claim_events TO service_role;
ALTER TABLE public.warranty_claim_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff manage claim events" ON public.warranty_claim_events;
CREATE POLICY "Staff manage claim events" ON public.warranty_claim_events FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
DROP POLICY IF EXISTS "Customers view own claim events" ON public.warranty_claim_events;
CREATE POLICY "Customers view own claim events" ON public.warranty_claim_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.warranty_claims c
    WHERE c.id = claim_id
      AND (c.user_id = auth.uid() OR lower(c.customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')))
  ));

-- ============ AUTOMATIONS ============
CREATE TABLE IF NOT EXISTS public.automation_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_settings TO authenticated;
GRANT ALL ON public.automation_settings TO service_role;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage automation settings" ON public.automation_settings;
CREATE POLICY "Admins manage automation settings" ON public.automation_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Staff read automation settings" ON public.automation_settings;
CREATE POLICY "Staff read automation settings" ON public.automation_settings FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

DROP TRIGGER IF EXISTS automation_settings_set_updated_at ON public.automation_settings;
CREATE TRIGGER automation_settings_set_updated_at BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  entity_type text,
  entity_id text,
  recipient text,
  status text NOT NULL DEFAULT 'sent',
  detail text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automation_runs_rule ON public.automation_runs(rule_key, created_at DESC);

GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read automation runs" ON public.automation_runs;
CREATE POLICY "Staff read automation runs" ON public.automation_runs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

-- ==========================================
-- Migration: 20260808084620_3490cbe8-cc03-4c5e-bd60-c269e31c3b3e.sql
-- ==========================================

DROP POLICY IF EXISTS "Engineers can update sizings" ON public.lumivolt_sizings;
CREATE POLICY "Engineers can update sizings" ON public.lumivolt_sizings
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));

-- ==========================================
-- Migration: 20260809061834_176841c4-801d-4b73-b7ed-79fab5ee0940.sql
-- ==========================================


-- Helper: returns the caller's email only when the auth provider marked it verified
CREATE OR REPLACE FUNCTION public.verified_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND u.email_confirmed_at IS NOT NULL
        AND u.email IS NOT NULL
    ) THEN (SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid())
    ELSE NULL
  END
$$;

GRANT EXECUTE ON FUNCTION public.verified_email() TO authenticated, service_role;

-- Affiliate identity now requires a verified email
CREATE OR REPLACE FUNCTION public.current_affiliate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.affiliates a
  WHERE public.verified_email() IS NOT NULL
    AND lower(a.email) = public.verified_email()
  LIMIT 1
$$;

-- Affiliate payouts: use the same hardened identity check
DROP POLICY IF EXISTS "Affiliates can read their own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can read their own payouts" ON public.affiliate_payouts FOR SELECT TO authenticated
USING (affiliate_id = public.current_affiliate_id());

-- Device serials
DROP POLICY IF EXISTS "Customers view own serials" ON public.device_serials;
CREATE POLICY "Customers view own serials" ON public.device_serials FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

-- Quotes
DROP POLICY IF EXISTS "Customers view own quotes" ON public.quotes;
CREATE POLICY "Customers view own quotes" ON public.quotes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

-- Warranty claims
DROP POLICY IF EXISTS "Customers view own claims" ON public.warranty_claims;
CREATE POLICY "Customers view own claims" ON public.warranty_claims FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

DROP POLICY IF EXISTS "Customers create own claims" ON public.warranty_claims;
CREATE POLICY "Customers create own claims" ON public.warranty_claims FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.verified_email() IS NOT NULL
  AND lower(customer_email) = public.verified_email()
  AND status = 'submitted'
  AND assigned_to IS NULL
  AND resolution IS NULL
  AND internal_notes IS NULL
  AND resolved_at IS NULL
);

-- Warranty claim events
DROP POLICY IF EXISTS "Customers view own claim events" ON public.warranty_claim_events;
CREATE POLICY "Customers view own claim events" ON public.warranty_claim_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.warranty_claims c
  WHERE c.id = warranty_claim_events.claim_id
    AND (
      c.user_id = auth.uid()
      OR (public.verified_email() IS NOT NULL AND lower(c.customer_email) = public.verified_email())
    )
));


-- ==========================================
-- Migration: 20260809061851_54217fba-6a7a-4d0b-897d-dac4c2c74d3f.sql
-- ==========================================

REVOKE EXECUTE ON FUNCTION public.verified_email() FROM PUBLIC, anon;

-- ==========================================
-- Migration: 20260810084831_fc1d9e44-9aef-445c-a289-25c669d1b94d.sql
-- ==========================================

DROP POLICY IF EXISTS "Users can write own reviews" ON public.product_reviews;
CREATE POLICY "Users can write own reviews" ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND admin_reply IS NULL
  AND COALESCE(verified_purchase, false) = false
  AND length(body) >= 5 AND length(body) <= 4000
  AND length(author_name) >= 2 AND length(author_name) <= 120
);

-- Grant permissions on all public tables, sequences, and routines to anon and authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
