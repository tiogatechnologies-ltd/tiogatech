
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
