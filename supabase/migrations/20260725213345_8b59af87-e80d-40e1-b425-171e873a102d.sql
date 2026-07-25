GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, app_role[]) TO anon;