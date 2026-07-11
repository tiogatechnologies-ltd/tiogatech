
REVOKE ALL ON FUNCTION public.reset_monthly_free_credits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_monthly_free_credits() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_free_credits() TO service_role;
