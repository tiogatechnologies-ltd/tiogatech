CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text NOT NULL,
  verified_purchase boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can read own reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can read all reviews"
  ON public.product_reviews FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE POLICY "Users can write own reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND admin_reply IS NULL
    AND length(body) BETWEEN 5 AND 4000
    AND length(author_name) BETWEEN 2 AND 120
  );

CREATE POLICY "Users can edit own reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can moderate reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE POLICY "Staff can delete reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE TRIGGER product_reviews_set_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Guard: non-staff cannot self-approve or set admin_reply / verified_purchase
CREATE OR REPLACE FUNCTION public.product_reviews_guard_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to change review status';
  END IF;
  IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply THEN
    RAISE EXCEPTION 'Not allowed to change admin_reply';
  END IF;
  IF NEW.verified_purchase IS DISTINCT FROM OLD.verified_purchase THEN
    RAISE EXCEPTION 'Not allowed to change verified_purchase';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_reviews_guard
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.product_reviews_guard_fields();

CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id, status);

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';