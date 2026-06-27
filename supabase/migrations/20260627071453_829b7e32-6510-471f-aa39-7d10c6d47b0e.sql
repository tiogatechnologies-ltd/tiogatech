CREATE POLICY "Users view own affiliate applications" ON public.affiliate_applications
FOR SELECT TO authenticated
USING (lower(email) = lower((SELECT email FROM auth.users WHERE id = auth.uid())));