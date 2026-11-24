-- WS6: Shop Trending & Real Recently Purchased Social Proof RPCs
-- Security & Privacy:
--   * Zero PII exposed (no customer names, emails, phones, or street addresses).
--   * Location is reduced to Nigerian state-level only (fallback: 'Nigeria').
--   * Only paid / confirmed / processing / shipped / delivered / completed orders are included.
--   * Both RPCs are SECURITY DEFINER and executable by anon & authenticated storefront clients.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_slug text;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON public.orders (created_at DESC, status, payment_status);
CREATE INDEX IF NOT EXISTS idx_page_views_product_path_created ON public.page_views (created_at DESC, page_path)
  WHERE page_path LIKE '/product/%';

-- Helper to normalize free-text delivery location to state-level only (no street PII)
CREATE OR REPLACE FUNCTION public.extract_nigerian_state(p_location text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v text := lower(coalesce(p_location, ''));
BEGIN
  IF v ~ 'lagos|lekki|ikeja|ikoyi|victoria island|ajah|surulere|yaba|gbagada' THEN RETURN 'Lagos';
  ELSIF v ~ 'abuja|fct|wuse|maitama|gwarinpa|garki|asokoro|kubwa|lugbe|kado|jabi' THEN RETURN 'Abuja';
  ELSIF v ~ 'jos|plateau' THEN RETURN 'Plateau';
  ELSIF v ~ 'port harcourt|rivers' THEN RETURN 'Rivers';
  ELSIF v ~ 'kano' THEN RETURN 'Kano';
  ELSIF v ~ 'ibadan|oyo' THEN RETURN 'Oyo';
  ELSIF v ~ 'enugu' THEN RETURN 'Enugu';
  ELSIF v ~ 'kaduna' THEN RETURN 'Kaduna';
  ELSIF v ~ 'anambra|awka|onitsha|nnewi' THEN RETURN 'Anambra';
  ELSIF v ~ 'delta|asaba|warri' THEN RETURN 'Delta';
  ELSIF v ~ 'edo|benin' THEN RETURN 'Edo';
  ELSIF v ~ 'ogun|abeokuta|ota|mowe' THEN RETURN 'Ogun';
  ELSIF v ~ 'akwa ibom|uyo' THEN RETURN 'Akwa Ibom';
  ELSIF v ~ 'cross river|calabar' THEN RETURN 'Cross River';
  ELSIF v ~ 'imo|owerri' THEN RETURN 'Imo';
  ELSIF v ~ 'abia|umuahia|aba\b' THEN RETURN 'Abia';
  ELSIF v ~ 'kwara|ilorin' THEN RETURN 'Kwara';
  ELSIF v ~ 'ondo|akure' THEN RETURN 'Ondo';
  ELSIF v ~ 'osun|osogbo' THEN RETURN 'Osun';
  ELSIF v ~ 'ekiti|ado' THEN RETURN 'Ekiti';
  ELSIF v ~ 'kogi|lokoja' THEN RETURN 'Kogi';
  ELSIF v ~ 'benue|makurdi' THEN RETURN 'Benue';
  ELSIF v ~ 'nasarawa|lafia|keffi|mararaba' THEN RETURN 'Nasarawa';
  ELSIF v ~ 'niger|minna' THEN RETURN 'Niger';
  ELSIF v ~ 'bauchi' THEN RETURN 'Bauchi';
  ELSIF v ~ 'borno|maiduguri' THEN RETURN 'Borno';
  ELSIF v ~ 'adamawa|yola' THEN RETURN 'Adamawa';
  ELSIF v ~ 'gombe' THEN RETURN 'Gombe';
  ELSIF v ~ 'taraba|jalingo' THEN RETURN 'Taraba';
  ELSIF v ~ 'sokoto' THEN RETURN 'Sokoto';
  ELSIF v ~ 'katsina' THEN RETURN 'Katsina';
  ELSIF v ~ 'kebbi' THEN RETURN 'Kebbi';
  ELSIF v ~ 'zamfara' THEN RETURN 'Zamfara';
  ELSIF v ~ 'jigawa' THEN RETURN 'Jigawa';
  ELSIF v ~ 'yobe' THEN RETURN 'Yobe';
  ELSIF v ~ 'bayelsa|yenagoa' THEN RETURN 'Bayelsa';
  ELSIF v ~ 'ebonyi|abakaliki' THEN RETURN 'Ebonyi';
  ELSE RETURN 'Nigeria';
  END IF;
END;
$$;

-- 1. Recent real purchases (non-PII, state-level location only)
CREATE OR REPLACE FUNCTION public.get_recent_purchases(
  p_limit int DEFAULT 20,
  p_days int DEFAULT 14
)
RETURNS TABLE (
  product_name text,
  image_url text,
  product_slug text,
  state text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    oi.product_name,
    oi.image_url,
    oi.product_slug,
    public.extract_nigerian_state(o.location) AS state,
    o.created_at
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE o.created_at >= now() - make_interval(days => GREATEST(1, LEAST(COALESCE(p_days, 14), 60)))
    AND (
      lower(coalesce(o.status, '')) IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed', 'paid')
      OR lower(coalesce(o.payment_status, '')) IN ('paid', 'verified', 'completed')
    )
    AND coalesce(trim(oi.product_name), '') <> ''
  ORDER BY o.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));
$$;

-- 2. Trending products by distinct viewing sessions in page_views
CREATE OR REPLACE FUNCTION public.get_trending_products(
  p_days int DEFAULT 7,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  page_path text,
  slug text,
  view_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    split_part(split_part(pv.page_path, '?', 1), '#', 1) AS page_path,
    regexp_replace(split_part(split_part(pv.page_path, '?', 1), '#', 1), '^/product/', '') AS slug,
    COUNT(DISTINCT COALESCE(NULLIF(trim(pv.session_id), ''), pv.id::text)) AS view_count
  FROM public.page_views pv
  WHERE pv.page_path LIKE '/product/%'
    AND pv.created_at >= now() - make_interval(days => GREATEST(1, LEAST(COALESCE(p_days, 7), 30)))
  GROUP BY 1, 2
  HAVING COUNT(DISTINCT COALESCE(NULLIF(trim(pv.session_id), ''), pv.id::text)) >= 1
  ORDER BY view_count DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 12), 30));
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_purchases(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_products(int, int) TO anon, authenticated;
