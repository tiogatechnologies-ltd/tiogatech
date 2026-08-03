CREATE POLICY "Users read own assigned custom role"
ON public.custom_roles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_custom_roles ucr
  WHERE ucr.custom_role_key = custom_roles.key AND ucr.user_id = auth.uid()
));