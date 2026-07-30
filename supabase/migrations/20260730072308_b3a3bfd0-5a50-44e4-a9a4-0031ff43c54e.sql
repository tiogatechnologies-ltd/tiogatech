-- 1. finance_payments: block self-verification on user inserts
DROP POLICY IF EXISTS "Users submit payments" ON public.finance_payments;
CREATE POLICY "Users submit payments"
ON public.finance_payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.finance_applications a
    WHERE a.id = finance_payments.application_id
      AND a.user_id = auth.uid()
  )
  AND verified = false
  AND verified_by IS NULL
  AND verified_at IS NULL
);

-- 2. role_page_permissions: restrict reads to privileged roles
DROP POLICY IF EXISTS "Signed-in can read page permissions" ON public.role_page_permissions;
CREATE POLICY "Privileged roles can read page permissions"
ON public.role_page_permissions
FOR SELECT
TO authenticated
USING (
  private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
);