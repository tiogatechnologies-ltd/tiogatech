
DROP POLICY IF EXISTS "Anyone can insert sizings" ON public.lumivolt_sizings;

CREATE POLICY "Public can insert valid sizings"
  ON public.lumivolt_sizings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    daily_energy_wh > 0
    AND (
      (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
      OR (auth.uid() IS NULL AND user_id IS NULL AND email IS NOT NULL AND length(email) > 3)
    )
  );
