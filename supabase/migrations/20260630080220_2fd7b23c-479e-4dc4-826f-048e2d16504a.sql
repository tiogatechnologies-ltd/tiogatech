
-- Grant admin role to designated emails and any verified @tiogatechnologies.com user.

-- Backfill: existing users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
  AND (
    lower(u.email) = 'inememmanuel@gmail.com'
    OR lower(split_part(u.email, '@', 2)) = 'tiogatechnologies.com'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Trigger function: auto-grant admin for verified-matching emails
CREATE OR REPLACE FUNCTION public.grant_admin_for_verified_tioga_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (
       lower(NEW.email) = 'inememmanuel@gmail.com'
       OR lower(split_part(NEW.email, '@', 2)) = 'tiogatechnologies.com'
     )
  THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_tioga_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_tioga_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_tioga_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_tioga_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_verified_tioga_email();
