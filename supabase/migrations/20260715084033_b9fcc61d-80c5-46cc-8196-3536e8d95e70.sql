
-- 1) Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.enforce_deposit_before_installments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deposit_status text;
BEGIN
  IF NEW.status = 'paid' AND NEW.is_deposit = false AND OLD.status <> 'paid' THEN
    SELECT status INTO deposit_status
    FROM finance_schedules
    WHERE application_id = NEW.application_id AND is_deposit = true
    LIMIT 1;

    IF deposit_status IS DISTINCT FROM 'paid' THEN
      RAISE EXCEPTION 'Deposit must be paid before any installment can be marked paid (application_id: %)', NEW.application_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Solar assessments: restrict which columns customers can change on UPDATE
CREATE OR REPLACE FUNCTION public.solar_assessments_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass for service_role and privileged users
  IF auth.uid() IS NULL OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_full_unlocked IS DISTINCT FROM OLD.is_full_unlocked THEN
    RAISE EXCEPTION 'Not allowed to modify is_full_unlocked';
  END IF;
  IF NEW.full_report IS DISTINCT FROM OLD.full_report THEN
    RAISE EXCEPTION 'Not allowed to modify full_report';
  END IF;
  IF NEW.engineer_notes IS DISTINCT FROM OLD.engineer_notes THEN
    RAISE EXCEPTION 'Not allowed to modify engineer_notes';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not allowed to modify status';
  END IF;
  IF NEW.share_token IS DISTINCT FROM OLD.share_token THEN
    RAISE EXCEPTION 'Not allowed to modify share_token';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to reassign user_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_solar_assessments_guard ON public.solar_assessments;
CREATE TRIGGER trg_solar_assessments_guard
BEFORE UPDATE ON public.solar_assessments
FOR EACH ROW EXECUTE FUNCTION public.solar_assessments_guard_privileged_fields();

-- Tighten the UPDATE policy with an explicit WITH CHECK
DROP POLICY IF EXISTS "Users update own assessments" ON public.solar_assessments;
CREATE POLICY "Users update own assessments" ON public.solar_assessments
FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid()) OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
)
WITH CHECK (
  (user_id = auth.uid()) OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
);

-- 3) LumiVolt sizings: restrict which fields non-admin users can change
CREATE OR REPLACE FUNCTION public.lumivolt_sizings_guard_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Not allowed to change email';
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    RAISE EXCEPTION 'Not allowed to change source';
  END IF;
  IF NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Not allowed to change notes';
  END IF;
  IF NEW.daily_energy_wh IS DISTINCT FROM OLD.daily_energy_wh THEN
    RAISE EXCEPTION 'Not allowed to change daily_energy_wh';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lumivolt_sizings_guard ON public.lumivolt_sizings;
CREATE TRIGGER trg_lumivolt_sizings_guard
BEFORE UPDATE ON public.lumivolt_sizings
FOR EACH ROW EXECUTE FUNCTION public.lumivolt_sizings_guard_fields();

DROP POLICY IF EXISTS "Users can update their own sizings" ON public.lumivolt_sizings;
CREATE POLICY "Users can update their own sizings" ON public.lumivolt_sizings
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
