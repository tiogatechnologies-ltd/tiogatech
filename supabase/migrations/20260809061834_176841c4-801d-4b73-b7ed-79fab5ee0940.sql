
-- Helper: returns the caller's email only when the auth provider marked it verified
CREATE OR REPLACE FUNCTION public.verified_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND u.email_confirmed_at IS NOT NULL
        AND u.email IS NOT NULL
    ) THEN (SELECT lower(u.email) FROM auth.users u WHERE u.id = auth.uid())
    ELSE NULL
  END
$$;

GRANT EXECUTE ON FUNCTION public.verified_email() TO authenticated, service_role;

-- Affiliate identity now requires a verified email
CREATE OR REPLACE FUNCTION public.current_affiliate_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.affiliates a
  WHERE public.verified_email() IS NOT NULL
    AND lower(a.email) = public.verified_email()
  LIMIT 1
$$;

-- Affiliate payouts: use the same hardened identity check
DROP POLICY IF EXISTS "Affiliates can read their own payouts" ON public.affiliate_payouts;
CREATE POLICY "Affiliates can read their own payouts"
ON public.affiliate_payouts FOR SELECT TO authenticated
USING (affiliate_id = public.current_affiliate_id());

-- Device serials
DROP POLICY IF EXISTS "Customers view own serials" ON public.device_serials;
CREATE POLICY "Customers view own serials"
ON public.device_serials FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

-- Quotes
DROP POLICY IF EXISTS "Customers view own quotes" ON public.quotes;
CREATE POLICY "Customers view own quotes"
ON public.quotes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

-- Warranty claims
DROP POLICY IF EXISTS "Customers view own claims" ON public.warranty_claims;
CREATE POLICY "Customers view own claims"
ON public.warranty_claims FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (public.verified_email() IS NOT NULL AND lower(customer_email) = public.verified_email())
);

DROP POLICY IF EXISTS "Customers create own claims" ON public.warranty_claims;
CREATE POLICY "Customers create own claims"
ON public.warranty_claims FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.verified_email() IS NOT NULL
  AND lower(customer_email) = public.verified_email()
  AND status = 'submitted'
  AND assigned_to IS NULL
  AND resolution IS NULL
  AND internal_notes IS NULL
  AND resolved_at IS NULL
);

-- Warranty claim events
DROP POLICY IF EXISTS "Customers view own claim events" ON public.warranty_claim_events;
CREATE POLICY "Customers view own claim events"
ON public.warranty_claim_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.warranty_claims c
  WHERE c.id = warranty_claim_events.claim_id
    AND (
      c.user_id = auth.uid()
      OR (public.verified_email() IS NOT NULL AND lower(c.customer_email) = public.verified_email())
    )
));
