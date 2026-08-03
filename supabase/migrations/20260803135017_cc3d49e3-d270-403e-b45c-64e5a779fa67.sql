-- 1. custom_roles: restrict read to admin/staff
DROP POLICY IF EXISTS "Anyone signed-in can read custom roles" ON public.custom_roles;
CREATE POLICY "Privileged users read custom roles"
ON public.custom_roles FOR SELECT TO authenticated
USING (private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

-- 2. finance_applications insert policies: block self-declared payment authorization fields
DROP POLICY IF EXISTS "Anon can submit guest applications" ON public.finance_applications;
CREATE POLICY "Anon can submit guest applications"
ON public.finance_applications FOR INSERT TO anon
WITH CHECK (
  user_id IS NULL
  AND status = 'pending'::finance_app_status
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND paystack_authorization_code IS NULL
  AND paystack_customer_code IS NULL
  AND consent_ip IS NULL
  AND effective_payment_method IN ('manual','auto_debit')
  AND (length(btrim(full_name)) >= 2 AND length(btrim(full_name)) <= 120)
  AND (length(btrim(phone)) >= 7 AND length(btrim(phone)) <= 40)
  AND (email IS NULL OR (length(btrim(email)) >= 5 AND length(btrim(email)) <= 255))
  AND (id_number IS NULL OR (length(btrim(id_number)) >= 3 AND length(btrim(id_number)) <= 50))
  AND (next_of_kin_name IS NULL OR length(btrim(next_of_kin_name)) <= 120)
  AND (next_of_kin_phone IS NULL OR length(btrim(next_of_kin_phone)) <= 40)
  AND (notes IS NULL OR length(notes) <= 4000)
  AND (monthly_income_ngn IS NULL OR monthly_income_ngn >= 0)
);

DROP POLICY IF EXISTS "Users insert own applications" ON public.finance_applications;
CREATE POLICY "Users insert own applications"
ON public.finance_applications FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'::finance_app_status
  AND approved_at IS NULL
  AND reviewer_id IS NULL
  AND rejection_reason IS NULL
  AND paystack_authorization_code IS NULL
  AND paystack_customer_code IS NULL
  AND consent_ip IS NULL
  AND effective_payment_method IN ('manual','auto_debit')
);

-- 3. Fix mutable search_path on remaining functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
