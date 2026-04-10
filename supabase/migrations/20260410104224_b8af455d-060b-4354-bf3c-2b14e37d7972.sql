
-- 1. Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read page views"
ON public.page_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);

-- 2. Lead activities table
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on lead_activities"
ON public.lead_activities FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities (lead_id);

-- 3. Product clicks table
CREATE TABLE public.product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert product clicks"
ON public.product_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read product clicks"
ON public.product_clicks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_product_clicks_product_id ON public.product_clicks (product_id);
CREATE INDEX idx_product_clicks_created_at ON public.product_clicks (created_at DESC);

-- 4. Add source column to leads
ALTER TABLE public.leads ADD COLUMN source text NOT NULL DEFAULT 'website_form';

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
