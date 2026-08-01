
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND (COALESCE(payment_status, 'pending') = 'pending')
  AND (COALESCE(status, 'new') = 'new')
  AND payment_reference IS NULL
  AND (length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120)
  AND (length(btrim(phone)) >= 7 AND length(btrim(phone)) <= 40)
  AND (length(btrim(location)) >= 2 AND length(btrim(location)) <= 200)
  AND (email IS NULL OR (length(btrim(email)) >= 5 AND length(btrim(email)) <= 255))
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (item_count >= 1 AND item_count <= 200)
);

DROP POLICY IF EXISTS "Public can insert valid sizings" ON public.lumivolt_sizings;
CREATE POLICY "Public can insert valid sizings"
ON public.lumivolt_sizings
FOR INSERT
WITH CHECK (
  daily_energy_wh > 0
  AND (
    (
      auth.uid() IS NOT NULL
      AND (user_id IS NULL OR user_id = auth.uid())
      AND (
        email IS NULL
        OR lower(btrim(email)) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
      )
    )
    OR (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND email IS NOT NULL
      AND length(btrim(email)) BETWEEN 5 AND 255
      AND btrim(email) ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
    )
  )
);
