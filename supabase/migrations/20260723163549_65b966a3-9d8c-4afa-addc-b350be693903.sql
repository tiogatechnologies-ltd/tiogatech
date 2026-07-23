
-- Custom named roles (inherit from a base app_role)
CREATE TABLE IF NOT EXISTS public.custom_roles (
  key text PRIMARY KEY,
  label text NOT NULL,
  base_role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT ALL ON public.custom_roles TO service_role;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed-in can read custom roles"
  ON public.custom_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage custom roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User -> custom role assignment (one per user)
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_role_key text NOT NULL REFERENCES public.custom_roles(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_custom_roles TO authenticated;
GRANT ALL ON public.user_custom_roles TO service_role;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own custom role"
  ON public.user_custom_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage user custom roles"
  ON public.user_custom_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Per-role, per-page access overrides. role_key can be 'staff','engineer','affiliate' or a custom_roles.key
CREATE TABLE IF NOT EXISTS public.role_page_permissions (
  role_key text NOT NULL,
  page_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, page_key)
);
GRANT SELECT ON public.role_page_permissions TO authenticated;
GRANT ALL ON public.role_page_permissions TO service_role;
ALTER TABLE public.role_page_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in can read page permissions"
  ON public.role_page_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage page permissions"
  ON public.role_page_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
