-- ==============================================================================
-- Tioga Technologies - Enterprise Retail E-Commerce Schema
-- Tables: Product Reviews, Product Variants, Store Banners, Product Bundles
-- ==============================================================================

-- 1. PRODUCT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  content text NOT NULL,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected', 'featured')),
  admin_reply text,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);

-- 2. PRODUCT VARIANTS TABLE (e.g. 5kVA, 8kVA, 10kVA / 5.12kWh, 10.24kWh / Finishes)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text NOT NULL UNIQUE,
  title text NOT NULL,
  option_type text NOT NULL DEFAULT 'capacity', -- capacity, voltage, finish, phase
  option_value text NOT NULL,
  price_adjustment numeric NOT NULL DEFAULT 0,
  final_price numeric NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- 3. STORE BANNERS & FLASH SALES TABLE
CREATE TABLE IF NOT EXISTS public.store_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_text text NOT NULL DEFAULT 'Flash Sale',
  headline text NOT NULL,
  subheadline text,
  cta_text text NOT NULL DEFAULT 'Shop Now',
  cta_link text NOT NULL DEFAULT '/retail',
  discount_code text,
  ends_at timestamptz,
  bg_gradient text DEFAULT 'from-primary/90 to-midnight',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. FREQUENTLY BOUGHT TOGETHER / PRODUCT BUNDLES TABLE
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  primary_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bundled_product_ids uuid[] NOT NULL,
  discount_percentage numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS POLICIES FOR E-COMMERCE STORE
-- SECURITY NOTE (corrected): "Admins can manage..." below originally checked
-- `USING (true)` - despite the name, that let ANY authenticated user (not
-- just admins) edit or delete every review/variant/banner/bundle, and
-- "Public can submit reviews" let anon insert a review with any `status`,
-- e.g. posting it as already 'approved' and bypassing moderation entirely.
-- Rewritten to match the real role checks used elsewhere (has_any_role).
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
CREATE POLICY "Public can view approved reviews" ON public.product_reviews FOR SELECT TO anon, authenticated USING (status IN ('approved', 'featured'));
DROP POLICY IF EXISTS "Public can submit reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users submit own pending reviews fix" ON public.product_reviews;
CREATE POLICY "Users submit own pending reviews fix" ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Staff manage all reviews fix" ON public.product_reviews;
CREATE POLICY "Staff manage all reviews fix" ON public.product_reviews FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active variants" ON public.product_variants;
CREATE POLICY "Public can view active variants" ON public.product_variants FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
DROP POLICY IF EXISTS "Staff manage variants fix" ON public.product_variants;
CREATE POLICY "Staff manage variants fix" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active store banners" ON public.store_banners;
CREATE POLICY "Public can view active store banners" ON public.store_banners FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage store banners" ON public.store_banners;
DROP POLICY IF EXISTS "Staff manage store banners fix" ON public.store_banners;
CREATE POLICY "Staff manage store banners fix" ON public.store_banners FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active product bundles" ON public.product_bundles;
CREATE POLICY "Public can view active product bundles" ON public.product_bundles FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage product bundles" ON public.product_bundles;
DROP POLICY IF EXISTS "Staff manage product bundles fix" ON public.product_bundles;
CREATE POLICY "Staff manage product bundles fix" ON public.product_bundles FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
