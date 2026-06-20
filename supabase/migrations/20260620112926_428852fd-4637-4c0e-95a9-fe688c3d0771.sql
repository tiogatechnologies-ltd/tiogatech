DROP POLICY IF EXISTS "Anyone can insert assessment" ON public.solar_assessments;
CREATE POLICY "Anyone can insert assessment" ON public.solar_assessments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 7 AND 40)
    AND (location IS NULL OR char_length(location) <= 200)
    AND (engineer_notes IS NULL)
    AND (full_report IS NULL)
    AND is_full_unlocked = false
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can create request" ON public.custom_solution_requests;
CREATE POLICY "Anyone can create request" ON public.custom_solution_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 120
    AND char_length(email) BETWEEN 5 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 7 AND 40)
    AND (location IS NULL OR char_length(location) <= 200)
    AND (requirements IS NULL OR char_length(requirements) <= 4000)
    AND (admin_notes IS NULL)
    AND status = 'new'
    AND (user_id IS NULL OR user_id = auth.uid())
  );