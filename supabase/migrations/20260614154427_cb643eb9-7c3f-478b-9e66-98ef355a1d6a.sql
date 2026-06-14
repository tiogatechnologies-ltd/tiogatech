
CREATE POLICY "Finance docs: users upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'finance-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Finance docs: anon upload tmp"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'finance-docs' AND (storage.foldername(name))[1] = 'guest');

CREATE POLICY "Finance docs: read own or admin"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'finance-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])));

CREATE POLICY "Finance docs: admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'finance-docs' AND public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
