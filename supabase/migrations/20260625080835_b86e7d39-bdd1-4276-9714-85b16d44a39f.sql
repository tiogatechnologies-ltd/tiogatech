CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION private.has_active_ai_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ai_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan IN ('starter','business')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.has_active_ai_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_any_role(uuid, public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION private.has_active_ai_subscription(uuid) TO service_role;

DO $$
DECLARE
  pol record;
  new_qual text;
  new_check text;
  sql text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ILIKE '%has_role(%' OR qual ILIKE '%has_any_role(%' OR qual ILIKE '%has_active_ai_subscription(%'
        OR with_check ILIKE '%has_role(%' OR with_check ILIKE '%has_any_role(%' OR with_check ILIKE '%has_active_ai_subscription(%'
      )
  LOOP
    new_qual := pol.qual;
    new_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'public.has_active_ai_subscription(', 'private.has_active_ai_subscription(');
      new_qual := replace(new_qual, 'public.has_any_role(', 'private.has_any_role(');
      new_qual := replace(new_qual, 'public.has_role(', 'private.has_role(');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_active_ai_subscription\(', '\1private.has_active_ai_subscription(', 'g');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_any_role\(', '\1private.has_any_role(', 'g');
      new_qual := regexp_replace(new_qual, '(^|[^\.[:alnum:]_])has_role\(', '\1private.has_role(', 'g');
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := replace(new_check, 'public.has_active_ai_subscription(', 'private.has_active_ai_subscription(');
      new_check := replace(new_check, 'public.has_any_role(', 'private.has_any_role(');
      new_check := replace(new_check, 'public.has_role(', 'private.has_role(');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_active_ai_subscription\(', '\1private.has_active_ai_subscription(', 'g');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_any_role\(', '\1private.has_any_role(', 'g');
      new_check := regexp_replace(new_check, '(^|[^\.[:alnum:]_])has_role\(', '\1private.has_role(', 'g');
    END IF;

    sql := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF new_qual IS NOT NULL THEN
      sql := sql || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      sql := sql || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE sql;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_ai_subscription(uuid) TO service_role;