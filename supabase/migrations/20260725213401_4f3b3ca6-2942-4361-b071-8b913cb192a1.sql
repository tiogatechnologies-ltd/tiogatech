REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO anon, authenticated, service_role;