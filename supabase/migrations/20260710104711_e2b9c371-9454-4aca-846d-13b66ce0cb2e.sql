
-- 1. Extend finance_applications
ALTER TABLE public.finance_applications
  ADD COLUMN IF NOT EXISTS direct_debit_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS consent_ip text,
  ADD COLUMN IF NOT EXISTS effective_payment_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_asset_financing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS monthly_principal_ngn numeric,
  ADD COLUMN IF NOT EXISTS monthly_interest_ngn numeric,
  ADD COLUMN IF NOT EXISTS total_interest_ngn numeric,
  ADD COLUMN IF NOT EXISTS deadline_date date;

-- 2. Extend finance_schedules
ALTER TABLE public.finance_schedules
  ADD COLUMN IF NOT EXISTS original_due_date date,
  ADD COLUMN IF NOT EXISTS override_reason text;

UPDATE public.finance_schedules SET original_due_date = due_date WHERE original_due_date IS NULL;

-- 3. Extend payment_events with idempotency key
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS paystack_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payment_events_paystack_event_id_uidx
  ON public.payment_events(paystack_event_id) WHERE paystack_event_id IS NOT NULL;

-- 4. debit_retry_queue
CREATE TABLE IF NOT EXISTS public.debit_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.finance_schedules(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  attempt_number int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.debit_retry_queue TO service_role;
GRANT SELECT ON public.debit_retry_queue TO authenticated;
ALTER TABLE public.debit_retry_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view debit_retry_queue"
  ON public.debit_retry_queue FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS debit_retry_queue_sched_idx ON public.debit_retry_queue(scheduled_date, status);
CREATE TRIGGER trg_debit_retry_queue_updated
  BEFORE UPDATE ON public.debit_retry_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. due_date_overrides
CREATE TABLE IF NOT EXISTS public.due_date_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.finance_schedules(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  installment_no int NOT NULL,
  original_due_date date NOT NULL,
  new_due_date date NOT NULL,
  reason text,
  overridden_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.due_date_overrides TO service_role;
GRANT SELECT ON public.due_date_overrides TO authenticated;
ALTER TABLE public.due_date_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view due_date_overrides"
  ON public.due_date_overrides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Extend approval trigger to compute amortization fields (flat/straight-line)
CREATE OR REPLACE FUNCTION public.generate_finance_schedule_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  i int;
  base_date date;
  fin numeric;
  ins int;
  interest_total numeric;
  monthly_p numeric;
  monthly_i numeric;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF EXISTS (SELECT 1 FROM public.finance_schedules WHERE application_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    base_date := COALESCE(NEW.approved_at::date, CURRENT_DATE);

    fin := COALESCE(NEW.financed_ngn, 0);
    ins := GREATEST(1, COALESCE(NEW.months, 1));
    interest_total := COALESCE(NEW.total_repayment_ngn, 0) - fin
                    - COALESCE(NEW.insurance_fee_ngn, 0) - COALESCE(NEW.management_fee_ngn, 0);
    IF interest_total < 0 THEN interest_total := 0; END IF;
    monthly_p := ROUND(fin / ins);
    monthly_i := ROUND(interest_total / ins);

    UPDATE public.finance_applications
      SET monthly_principal_ngn = monthly_p,
          monthly_interest_ngn = monthly_i,
          total_interest_ngn = interest_total
      WHERE id = NEW.id;

    IF COALESCE(NEW.deposit_ngn, 0) > 0 THEN
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, original_due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, 0, base_date, base_date, NEW.deposit_ngn, 'due', true, 'manual_required');
    END IF;

    FOR i IN 1..NEW.months LOOP
      INSERT INTO public.finance_schedules(application_id, installment_no, due_date, original_due_date, amount_ngn, status, is_deposit, auto_charge_status)
      VALUES (NEW.id, i, base_date + (i || ' months')::interval, base_date + (i || ' months')::interval,
              NEW.monthly_payment_ngn, 'upcoming', false,
              CASE WHEN i = 1 THEN 'manual_required' ELSE 'scheduled' END);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;
