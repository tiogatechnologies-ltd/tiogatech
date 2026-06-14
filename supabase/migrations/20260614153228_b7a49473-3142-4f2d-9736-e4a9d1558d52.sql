DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

CREATE POLICY "Public can read non-sensitive site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key <> 'notification_preferences');

CREATE POLICY "Admins and staff can read all site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));