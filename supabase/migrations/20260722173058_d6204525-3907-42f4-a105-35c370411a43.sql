
-- 1. Fix affiliate_applications SELECT policy: avoid auth.users lookup
DROP POLICY IF EXISTS "Users view own affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Users view own affiliate applications"
ON public.affiliate_applications
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
