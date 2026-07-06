DROP POLICY IF EXISTS "Admins can view backups" ON public.backups_log;
CREATE POLICY "Admins can view backups" ON public.backups_log FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can receive realtime" ON realtime.messages;
CREATE POLICY "Admins can receive realtime" ON realtime.messages FOR SELECT USING (private.has_role(auth.uid(), 'admin'::app_role));