
-- 1) Remove public discounts read; validation happens via validate-discount edge function only
DROP POLICY IF EXISTS "Public can read active discounts" ON public.discounts;

-- 2) Tighten guest finance application insert with field-level validation
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications"
ON public.finance_applications
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 120
  AND length(btrim(phone)) BETWEEN 7 AND 40
  AND (email IS NULL OR length(btrim(email)) BETWEEN 5 AND 255)
  AND (id_number IS NULL OR length(btrim(id_number)) BETWEEN 3 AND 50)
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

-- 3) Let affiliates read their own payouts (matched via email of signed-in user)
CREATE POLICY "Affiliates can read their own payouts"
ON public.affiliate_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.affiliates a
    JOIN auth.users u ON lower(u.email) = lower(a.email)
    WHERE a.id = affiliate_payouts.affiliate_id
      AND u.id = auth.uid()
  )
);
