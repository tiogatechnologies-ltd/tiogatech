DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));