
-- =========================================================
-- AFFILIATE PAYOUTS
-- =========================================================
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  lead_count integer NOT NULL DEFAULT 0,
  revenue_total numeric(14,2) NOT NULL DEFAULT 0,
  commission_total numeric(14,2) NOT NULL DEFAULT 0,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  notes text,
  statement_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affiliate_payouts_status_chk
    CHECK (status IN ('pending','approved','paid','rejected')),
  CONSTRAINT affiliate_payouts_period_chk
    CHECK (period_end >= period_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_payouts TO authenticated;
GRANT ALL ON public.affiliate_payouts TO service_role;

ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliate payouts"
  ON public.affiliate_payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER affiliate_payouts_set_updated_at
  BEFORE UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_affiliate_payouts_affiliate ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX idx_affiliate_payouts_token ON public.affiliate_payouts(statement_token);

-- =========================================================
-- SECURITY HARDENING: revoke execute on internal trigger fns
-- (They run as table owner during triggers; no need for API/role grants.)
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.product_images_enforce_single_primary() FROM PUBLIC, anon, authenticated;
