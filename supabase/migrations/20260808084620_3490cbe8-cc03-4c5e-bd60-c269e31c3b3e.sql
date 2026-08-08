CREATE POLICY "Engineers can update sizings"
ON public.lumivolt_sizings
FOR UPDATE
TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
WITH CHECK (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));