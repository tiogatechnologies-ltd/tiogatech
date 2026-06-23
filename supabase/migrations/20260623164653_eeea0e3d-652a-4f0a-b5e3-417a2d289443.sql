
REVOKE EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) TO authenticated, service_role;
