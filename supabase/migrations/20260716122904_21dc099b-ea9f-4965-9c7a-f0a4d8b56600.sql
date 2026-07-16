
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS is_new_session boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON public.page_views (utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_views_landing ON public.page_views (landing_path) WHERE is_new_session = true;

CREATE INDEX IF NOT EXISTS idx_conversions_event_type ON public.conversions (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversions_session ON public.conversions (session_id);
