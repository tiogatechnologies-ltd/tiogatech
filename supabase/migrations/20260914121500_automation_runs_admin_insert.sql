-- automation_runs had a GRANT INSERT to authenticated but no RLS policy for
-- INSERT at all (only "Staff read automation runs" for SELECT), so RLS's
-- default-deny blocked every insert. Combined with the AdminAutomations
-- "Run Now" insert using a mismatched "details" column (fixed separately),
-- the manual-trigger log write failed for two independent reasons and
-- "Runs logged" stayed at 0 no matter how many times an automation was run.
DO $$ BEGIN
  CREATE POLICY "Staff log automation runs"
    ON public.automation_runs FOR INSERT TO authenticated
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
