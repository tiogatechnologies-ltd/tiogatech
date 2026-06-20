-- Add account_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual','business','installer'));

-- solar_assessments
CREATE TABLE IF NOT EXISTS public.solar_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  building_type TEXT,
  occupants INT,
  appliances JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_kwh NUMERIC,
  peak_load_w NUMERIC,
  current_power_situation TEXT,
  monthly_bill_ngn NUMERIC,
  recommendation JSONB,
  full_report JSONB,
  status TEXT NOT NULL DEFAULT 'basic' CHECK (status IN ('draft','basic','full','reviewed','quoted','closed')),
  engineer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  engineer_notes TEXT,
  is_full_unlocked BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.solar_assessments TO authenticated;
GRANT SELECT, INSERT ON public.solar_assessments TO anon;
GRANT ALL ON public.solar_assessments TO service_role;
ALTER TABLE public.solar_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert assessment" ON public.solar_assessments
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Users read own assessments" ON public.solar_assessments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));
CREATE POLICY "Public read by share token" ON public.solar_assessments
  FOR SELECT TO anon, authenticated USING (share_token IS NOT NULL);
CREATE POLICY "Users update own assessments" ON public.solar_assessments
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

CREATE TRIGGER solar_assessments_updated_at BEFORE UPDATE ON public.solar_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- assessment_credits
CREATE TABLE IF NOT EXISTS public.assessment_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits INT NOT NULL DEFAULT 3,
  used_credits INT NOT NULL DEFAULT 0,
  purchased_credits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessment_credits TO authenticated;
GRANT ALL ON public.assessment_credits TO service_role;
ALTER TABLE public.assessment_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON public.assessment_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- custom_solution_requests
CREATE TABLE IF NOT EXISTS public.custom_solution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','won','lost')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.custom_solution_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.custom_solution_requests TO authenticated;
GRANT ALL ON public.custom_solution_requests TO service_role;
ALTER TABLE public.custom_solution_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create request" ON public.custom_solution_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin/staff read all requests" ON public.custom_solution_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));
CREATE POLICY "Admin/staff update requests" ON public.custom_solution_requests
  FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE TRIGGER custom_solution_requests_updated_at BEFORE UPDATE ON public.custom_solution_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update handle_new_user to auto-create credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.assessment_credits (user_id, total_credits)
  VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill credits for existing users
INSERT INTO public.assessment_credits (user_id, total_credits)
SELECT id, 3 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;