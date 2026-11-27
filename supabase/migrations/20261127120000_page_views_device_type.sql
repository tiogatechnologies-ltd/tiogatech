-- page_views.device_type was never filled in.
--
-- The site records page views with a direct insert from usePageTracker; the
-- track-pageview edge function that used to work out the device type is not
-- called any more. Every row therefore had device_type = NULL and the admin
-- "Device Split" chart showed 100% desktop. The client now sends the device
-- type itself; this migration
--   1. fills it in for existing rows from the stored user agent, and
--   2. fills it on insert whenever a client leaves it out (old cached bundles).
-- Rules match parseDeviceType() in src/hooks/usePageTracker.ts.

CREATE OR REPLACE FUNCTION public.page_views_device_type_from_ua(ua text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN ua IS NULL OR ua = '' THEN NULL
    WHEN ua ~* '(ipad|tablet|playbook|silk|kindle)' THEN 'tablet'
    WHEN ua ~* 'android' AND ua !~* 'mobile' THEN 'tablet'
    WHEN ua ~* '(mobile|android|iphone|ipod|blackberry|opera mini|iemobile)' THEN 'mobile'
    ELSE 'desktop'
  END
$$;

CREATE OR REPLACE FUNCTION public.page_views_fill_device_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.device_type IS NULL THEN
    NEW.device_type := public.page_views_device_type_from_ua(NEW.user_agent);
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.page_views_fill_device_type() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS page_views_fill_device_type ON public.page_views;
CREATE TRIGGER page_views_fill_device_type
  BEFORE INSERT ON public.page_views
  FOR EACH ROW EXECUTE FUNCTION public.page_views_fill_device_type();

UPDATE public.page_views
SET device_type = public.page_views_device_type_from_ua(user_agent)
WHERE device_type IS NULL AND user_agent IS NOT NULL AND user_agent <> '';
