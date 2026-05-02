-- Conversion event tracking
CREATE TABLE IF NOT EXISTS public.conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  event_type text NOT NULL,
  page_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert conversions"
  ON public.conversions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read conversions"
  ON public.conversions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_conversions_event_type ON public.conversions(event_type);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_session ON public.conversions(session_id);