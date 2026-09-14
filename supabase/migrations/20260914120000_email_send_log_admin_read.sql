-- Admins/staff could never see the Email delivery status admin page: only
-- service_role had SELECT on email_send_log, so the page's own client-side
-- query always returned zero rows despite the table having real data.
GRANT SELECT ON public.email_send_log TO authenticated;

DO $$ BEGIN
  CREATE POLICY "Staff read email send log"
    ON public.email_send_log FOR SELECT TO authenticated
    USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
