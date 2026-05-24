
-- 1) Remove page_views from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.page_views;

-- 2) Lock down realtime.messages so only admins can subscribe
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can receive realtime" ON realtime.messages;
CREATE POLICY "Admins can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Tighten career CV upload path: require {uuid}/filename
DROP POLICY IF EXISTS "Anyone can upload career CVs" ON storage.objects;
CREATE POLICY "Anyone can upload career CVs"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'career-cvs'
  AND name ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[A-Za-z0-9._-]{1,160}$'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- 4) Remove broad SELECT listing on product-images bucket (public URLs continue to work via public endpoint)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;

-- 5) Revoke EXECUTE on internal SECURITY DEFINER trigger functions from public roles
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;

-- 6) Replace overly permissive "WITH CHECK (true)" insert policies with validated versions
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Anyone can submit a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND length(btrim(location)) BETWEEN 2 AND 200
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (notes IS NULL OR length(notes) <= 4000)
);

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
  AND length(page_path) BETWEEN 1 AND 500
);

DROP POLICY IF EXISTS "Anyone can insert conversions" ON public.conversions;
CREATE POLICY "Anyone can insert conversions"
ON public.conversions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
  AND length(event_type) BETWEEN 1 AND 80
);

DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;
CREATE POLICY "Anyone can insert product clicks"
ON public.product_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
);

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.app_waitlist;
CREATE POLICY "Anyone can join the waitlist"
ON public.app_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
