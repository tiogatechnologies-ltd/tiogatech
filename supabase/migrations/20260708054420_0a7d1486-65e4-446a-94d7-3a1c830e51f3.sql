
-- 1. Add columns to finance_schedules
ALTER TABLE public.finance_schedules
  ADD COLUMN IF NOT EXISTS payment_url text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS auto_charge_status text,
  ADD COLUMN IF NOT EXISTS last_charge_error text,
  ADD COLUMN IF NOT EXISTS is_deposit boolean NOT NULL DEFAULT false;

-- 2. Add columns to finance_applications
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS paystack_authorization_code text,
  ADD COLUMN IF NOT EXISTS paystack_customer_code text;

-- 3. payment_events table
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paystack',
  event_type text NOT NULL,
  reference text NOT NULL UNIQUE,
  schedule_id uuid REFERENCES public.finance_schedules(id) ON DELETE SET NULL,
  application_id uuid REFERENCES public.finance_applications(id) ON DELETE SET NULL,
  status text NOT NULL,
  amount_ngn numeric(12,2),
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payment events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (
    application_id IN (SELECT id FROM public.finance_applications WHERE user_id = auth.uid())
    OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role])
  );

CREATE INDEX IF NOT EXISTS idx_payment_events_schedule ON public.payment_events(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_app ON public.payment_events(application_id);

-- 4. Trigger to auto-generate schedule on approval
CREATE OR REPLACE FUNCTION public.generate_finance_schedule_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  base_date date;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Skip if schedule already exists
    IF EXISTS (SELECT 1 FROM public.finance_schedules WHERE application_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    base_date := COALESCE(NEW.approved_at::date, CURRENT_DATE);

    -- Deposit row (installment_no = 0, due immediately)
    IF COALESCE(NEW.deposit_ngn, 0) > 0 THEN
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, 0, base_date, NEW.deposit_ngn, 'due', true, 'manual_required');
    END IF;

    -- Monthly installments
    FOR i IN 1..NEW.months LOOP
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, i, base_date + (i || ' months')::interval, NEW.monthly_payment_ngn, 'upcoming', false,
              CASE WHEN i = 1 THEN 'manual_required' ELSE 'scheduled' END);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gen_finance_schedule ON public.finance_applications;
CREATE TRIGGER trg_gen_finance_schedule
  AFTER UPDATE OF status ON public.finance_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_finance_schedule_on_approval();
