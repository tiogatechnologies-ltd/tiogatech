DROP POLICY IF EXISTS "Users can write own reviews" ON public.product_reviews;

CREATE POLICY "Users can write own reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND admin_reply IS NULL
  AND COALESCE(verified_purchase, false) = false
  AND length(body) >= 5 AND length(body) <= 4000
  AND length(author_name) >= 2 AND length(author_name) <= 120
);