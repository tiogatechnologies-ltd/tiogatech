
-- 1. Finance application: new breakdown columns + assessment lineage
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS interest_rate_pct numeric,
  ADD COLUMN IF NOT EXISTS insurance_fee_ngn numeric,
  ADD COLUMN IF NOT EXISTS management_fee_ngn numeric,
  ADD COLUMN IF NOT EXISTS total_repayment_ngn numeric,
  ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_slug text;

-- 2. AI subscription plan enum
DO $$ BEGIN
  CREATE TYPE public.ai_plan AS ENUM ('free', 'starter', 'business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_sub_status AS ENUM ('active', 'expired', 'pending', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. ai_subscriptions table
CREATE TABLE IF NOT EXISTS public.ai_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.ai_plan NOT NULL DEFAULT 'free',
  status public.ai_sub_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  monthly_price_ngn numeric NOT NULL DEFAULT 2500,
  granted_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_subscriptions TO authenticated;
GRANT ALL ON public.ai_subscriptions TO service_role;

ALTER TABLE public.ai_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ai subscription" ON public.ai_subscriptions;
CREATE POLICY "Users read own ai subscription" ON public.ai_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Admins manage ai subscriptions" ON public.ai_subscriptions;
CREATE POLICY "Admins manage ai subscriptions" ON public.ai_subscriptions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE TRIGGER ai_subscriptions_updated_at
  BEFORE UPDATE ON public.ai_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Helper: has active paid AI subscription
CREATE OR REPLACE FUNCTION public.has_active_ai_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ai_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND plan IN ('starter','business')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- 5. Seed/update site_settings.finance with new lease-to-own structure
INSERT INTO public.site_settings (key, value)
VALUES ('finance', jsonb_build_object(
  'deposit_pct', 0.30,
  'insurance_pct', 0.02,
  'management_pct', 0.01,
  'tenures_months', jsonb_build_array(12, 24),
  'interest_tiers', jsonb_build_array(
    jsonb_build_object('min', 1000000, 'max', 5000000, 'rate', 0.09),
    jsonb_build_object('min', 5000001, 'max', 7500000, 'rate', 0.15),
    jsonb_build_object('min', 7500001, 'max', NULL, 'rate', 0.25)
  ),
  'vat_pct', 0.075,
  'install_pct', 0.10
))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
