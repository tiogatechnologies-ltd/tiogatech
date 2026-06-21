
CREATE TABLE public.lumivolt_sizings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  appliances JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_load_w NUMERIC NOT NULL DEFAULT 0,
  daily_energy_wh NUMERIC NOT NULL DEFAULT 0,
  days_autonomy NUMERIC NOT NULL DEFAULT 1,
  battery_voltage NUMERIC NOT NULL DEFAULT 48,
  battery_type TEXT NOT NULL DEFAULT 'lithium',
  battery_dod NUMERIC NOT NULL DEFAULT 0.9,
  sunlight_hours NUMERIC NOT NULL DEFAULT 5,
  solar_panel_w NUMERIC,
  recommended_panel_w NUMERIC,
  inverter_w NUMERIC,
  battery_ah NUMERIC,
  battery_kwh NUMERIC,
  charge_controller_a NUMERIC,
  notes TEXT,
  source TEXT DEFAULT 'lumivolt_web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lumivolt_sizings TO authenticated;
GRANT INSERT ON public.lumivolt_sizings TO anon;
GRANT ALL ON public.lumivolt_sizings TO service_role;

ALTER TABLE public.lumivolt_sizings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sizings"
  ON public.lumivolt_sizings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own sizings"
  ON public.lumivolt_sizings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sizings"
  ON public.lumivolt_sizings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and engineers can view all sizings"
  ON public.lumivolt_sizings FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

CREATE POLICY "Admins can manage all sizings"
  ON public.lumivolt_sizings FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE TRIGGER lumivolt_sizings_updated_at
  BEFORE UPDATE ON public.lumivolt_sizings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_lumivolt_sizings_user ON public.lumivolt_sizings(user_id);
CREATE INDEX idx_lumivolt_sizings_created ON public.lumivolt_sizings(created_at DESC);
