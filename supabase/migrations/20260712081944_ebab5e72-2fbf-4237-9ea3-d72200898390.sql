
-- 1) Remove the redundant/weak INSERT policy on finance_applications
DROP POLICY IF EXISTS "Users insert their applications" ON public.finance_applications;
DROP POLICY IF EXISTS "Users insert own applications" ON public.finance_applications;
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;

-- Authenticated users: must own the row AND cannot pre-approve
CREATE POLICY "Users insert own applications"
ON public.finance_applications
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
);

-- Anonymous guests: no owner, cannot pre-approve, basic length checks retained
CREATE POLICY "Anon can submit guest applications"
ON public.finance_applications
FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'pending'
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (id_number IS NULL OR length(btrim(id_number)) BETWEEN 3 AND 50)
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

-- 2) Tighten orders INSERT — customers/anon cannot pre-set paid/completed
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
  COALESCE(payment_status, 'pending') = 'pending'
  AND COALESCE(status, 'new') = 'new'
  AND payment_reference IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND length(btrim(location)) BETWEEN 2 AND 200
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND item_count BETWEEN 1 AND 200
);
