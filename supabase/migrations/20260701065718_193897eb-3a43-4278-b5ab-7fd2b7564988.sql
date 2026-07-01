-- 1. Extend superadmin trigger to include tiogatechnologies@gmail.com
CREATE OR REPLACE FUNCTION public.grant_admin_for_verified_tioga_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (
       lower(NEW.email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
       OR lower(split_part(NEW.email, '@', 2)) = 'tiogatechnologies.com'
     )
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- remove the auto-assigned customer role so the badge shows admin
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'customer';
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure the triggers exist (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

-- 2. Backfill: grant admin to existing matching accounts and strip stray customer role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
   OR lower(split_part(email, '@', 2)) = 'tiogatechnologies.com'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'customer'
  AND (
    lower(u.email) IN ('inememmanuel@gmail.com', 'tiogatechnologies@gmail.com')
    OR lower(split_part(u.email, '@', 2)) = 'tiogatechnologies.com'
  );

-- 3. Global cache-bust row in site_settings (already exists as table)
INSERT INTO public.site_settings (key, value)
VALUES ('cache_bust', jsonb_build_object('bumped_at', now()))
ON CONFLICT (key) DO NOTHING;

-- 4. Backups log table
CREATE TABLE IF NOT EXISTS public.backups_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  drive_file_id text,
  drive_web_link text,
  size_bytes bigint,
  tables_count int,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  triggered_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.backups_log TO authenticated;
GRANT ALL ON public.backups_log TO service_role;

ALTER TABLE public.backups_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backups"
  ON public.backups_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages backups"
  ON public.backups_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);