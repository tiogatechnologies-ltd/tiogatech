
CREATE TABLE public.smart_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'lock', -- 'lock' | 'accessory' | 'hotel'
  series TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC,
  price_label TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  power_system TEXT NOT NULL DEFAULT '',
  ideal_for TEXT NOT NULL DEFAULT '',
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active smart locks"
  ON public.smart_locks FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins full access on smart locks"
  ON public.smart_locks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_smart_locks_updated_at
  BEFORE UPDATE ON public.smart_locks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
