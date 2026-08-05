-- Workflow columns on lumivolt_sizings
ALTER TABLE public.lumivolt_sizings
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS sales_owner_id uuid,
  ADD COLUMN IF NOT EXISTS engineer_owner_id uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS revised jsonb,
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lumivolt_sizings_share_token_key ON public.lumivolt_sizings (share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS lumivolt_sizings_pipeline_status_idx ON public.lumivolt_sizings (pipeline_status);

-- Workflow columns on solar_assessments
ALTER TABLE public.solar_assessments
  ADD COLUMN IF NOT EXISTS pipeline_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS sales_owner_id uuid,
  ADD COLUMN IF NOT EXISTS engineer_owner_id uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS revised jsonb;

CREATE INDEX IF NOT EXISTS solar_assessments_pipeline_status_idx ON public.solar_assessments (pipeline_status);

-- Timeline of internal events for a brief (sizing or assessment)
CREATE TABLE IF NOT EXISTS public.brief_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('sizing', 'assessment')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('status', 'assignment', 'note', 'revision', 'export', 'quote')),
  from_value text,
  to_value text,
  note text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.brief_events TO authenticated;
GRANT ALL ON public.brief_events TO service_role;

ALTER TABLE public.brief_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Privileged can read brief events"
ON public.brief_events FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));

CREATE POLICY "Privileged can add brief events"
ON public.brief_events FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role])
  AND actor_id = auth.uid()
);

CREATE INDEX IF NOT EXISTS brief_events_entity_idx ON public.brief_events (entity_type, entity_id, created_at DESC);