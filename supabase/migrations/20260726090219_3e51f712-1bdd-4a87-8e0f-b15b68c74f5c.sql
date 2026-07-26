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
CREATE POLICY "Admins manage custom roles"
ON public.custom_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage user custom roles" ON public.user_custom_roles;
CREATE POLICY "Admins manage user custom roles"
ON public.user_custom_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read their own custom role" ON public.user_custom_roles;
CREATE POLICY "Users read their own custom role"
ON public.user_custom_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins manage page permissions" ON public.role_page_permissions;
CREATE POLICY "Admins manage page permissions"
ON public.role_page_permissions
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));