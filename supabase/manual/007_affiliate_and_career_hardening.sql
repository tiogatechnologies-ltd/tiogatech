-- ==============================================================================
-- 007_affiliate_and_career_hardening.sql
-- Database side of the affiliate + careers audit. Safe to run more than once.
-- Run in the Supabase SQL editor (one transaction).
--
--  1. Affiliates could insert payout requests straight through the REST API,
--     skipping the balance / minimum / bank-details checks in the
--     affiliate-payout-request function. Only the function (service role) and
--     admins may create requests now.
--  2. Orders placed through Checkout write their affiliate code from the browser.
--     A trigger now credits only a real, active affiliate who is not the buyer,
--     lower-cases the code (links typed as ?ref=JOHN were never credited), and
--     drops a link slug that does not belong to that affiliate.
--  3. Back-fills lower-case codes on existing orders/leads so sales that were
--     lost to the case mismatch are credited.
--  4. Lets the storefront read the "promotions" and "affiliate" settings.
--     The public read policy for site_settings is an allowlist; without these
--     keys, values an admin saves (discount badges, referral window) never
--     reach customers' browsers. This ADDS a policy and leaves existing ones.
--  5. The Careers page used to inject a hardcoded "Graphics Designer" role on top
--     of whatever the database held, so it could never be closed from Admin >
--     Careers. The page now shows only database roles; this adds that role to the
--     database (once) so it keeps showing AND can be edited or closed in the admin.
--     Skip section 5 if you do not want that role advertised.
-- ==============================================================================

BEGIN;

-- 1. Payout requests: no direct inserts by affiliates ---------------------------
DROP POLICY IF EXISTS "Affiliates create own payout requests" ON public.affiliate_payout_requests;

-- 2. Validate affiliate attribution on every new order ---------------------------
CREATE OR REPLACE FUNCTION public.orders_validate_affiliate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aff record;
BEGIN
  IF NEW.affiliate_code IS NULL OR btrim(NEW.affiliate_code) = '' THEN
    NEW.affiliate_code := NULL;
    NEW.affiliate_link_slug := NULL;
    RETURN NEW;
  END IF;

  SELECT id, code, email, status INTO aff
  FROM public.affiliates
  WHERE lower(code) = lower(btrim(NEW.affiliate_code))
  LIMIT 1;

  IF NOT FOUND
     OR aff.status <> 'active'
     OR (NEW.email IS NOT NULL AND lower(btrim(NEW.email)) = lower(aff.email)) THEN
    NEW.affiliate_code := NULL;
    NEW.affiliate_link_slug := NULL;
    RETURN NEW;
  END IF;

  NEW.affiliate_code := lower(aff.code);

  IF NEW.affiliate_link_slug IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.affiliate_links l
       WHERE l.slug = NEW.affiliate_link_slug AND l.affiliate_id = aff.id
     ) THEN
    NEW.affiliate_link_slug := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_validate_affiliate ON public.orders;
CREATE TRIGGER orders_validate_affiliate
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_validate_affiliate();

-- 3. Back-fill: credit sales whose code differed only by letter case -------------
UPDATE public.orders SET affiliate_code = lower(btrim(affiliate_code))
WHERE affiliate_code IS NOT NULL AND affiliate_code <> lower(btrim(affiliate_code));

UPDATE public.leads SET affiliate_code = lower(btrim(affiliate_code))
WHERE affiliate_code IS NOT NULL AND affiliate_code <> lower(btrim(affiliate_code));

-- 4. Storefront-readable settings ------------------------------------------------
DROP POLICY IF EXISTS "Public can read storefront promo and affiliate settings" ON public.site_settings;
CREATE POLICY "Public can read storefront promo and affiliate settings" ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = ANY (ARRAY['promotions', 'affiliate']));

-- 5. Keep the Graphics Designer role, now manageable from Admin > Careers --------
INSERT INTO public.careers (title, location, summary, highlights, requirements, email_subject, deadline, is_active, sort_order)
SELECT
  'Graphics Designer (Full-Time, Remote)',
  'Remote',
  'We are seeking a creative Full-Time Remote Graphics Designer to craft compelling visual campaigns, social media creatives, product flyers, and brand collateral for Tioga Technologies'' solar energy, smart security, and home automation lines.',
  ARRAY[
    'Full-time, 100% Remote role at Tioga Technologies',
    'Design high-converting social media graphics, product promos & brand assets',
    '2+ years experience in Adobe Photoshop, Illustrator, Figma or CorelDRAW'
  ],
  'Proven Graphic Design experience with a strong portfolio (Behance, Dribbble, or PDF). Strong mastery of typography, layout hierarchy, and product visual storytelling.',
  'Application - Graphics Designer (Full-Time Remote)',
  'Rolling Recruitment',
  true,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.careers WHERE title ILIKE '%graphic%');

COMMIT;
