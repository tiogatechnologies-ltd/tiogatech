-- Helper: resolve the affiliate row belonging to the signed-in user (by email)
CREATE OR REPLACE FUNCTION public.current_affiliate_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id FROM public.affiliates a
  WHERE lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  LIMIT 1
$$;

-- ============ affiliate_links ============
CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  destination_path text NOT NULL DEFAULT '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO authenticated;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates read own links" ON public.affiliate_links
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE POLICY "Affiliates create own links" ON public.affiliate_links
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.current_affiliate_id());

CREATE POLICY "Affiliates update own links" ON public.affiliate_links
  FOR UPDATE TO authenticated
  USING (affiliate_id = public.current_affiliate_id())
  WITH CHECK (affiliate_id = public.current_affiliate_id());

CREATE POLICY "Affiliates delete own links" ON public.affiliate_links
  FOR DELETE TO authenticated
  USING (affiliate_id = public.current_affiliate_id());

CREATE POLICY "Admins manage all links" ON public.affiliate_links
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER affiliate_links_set_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_affiliate_links_affiliate ON public.affiliate_links(affiliate_id);

-- ============ affiliate_link_clicks ============
CREATE TABLE public.affiliate_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  slug text,
  session_id text,
  referrer text,
  user_agent text,
  device_type text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.affiliate_link_clicks TO authenticated;
GRANT ALL ON public.affiliate_link_clicks TO service_role;
ALTER TABLE public.affiliate_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates read own clicks" ON public.affiliate_link_clicks
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE INDEX idx_affiliate_clicks_link ON public.affiliate_link_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_affiliate_date ON public.affiliate_link_clicks(affiliate_id, created_at DESC);

-- ============ affiliate_payout_requests ============
CREATE TABLE public.affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  note text,
  admin_note text,
  decided_by uuid,
  decided_at timestamptz,
  payout_id uuid REFERENCES public.affiliate_payouts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.affiliate_payout_requests TO authenticated;
GRANT ALL ON public.affiliate_payout_requests TO service_role;
ALTER TABLE public.affiliate_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates read own payout requests" ON public.affiliate_payout_requests
  FOR SELECT TO authenticated
  USING (affiliate_id = public.current_affiliate_id()
         OR private.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE POLICY "Affiliates create own payout requests" ON public.affiliate_payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (affiliate_id = public.current_affiliate_id()
              AND status = 'pending'
              AND decided_by IS NULL
              AND decided_at IS NULL
              AND payout_id IS NULL);

CREATE POLICY "Admins manage payout requests" ON public.affiliate_payout_requests
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER affiliate_payout_requests_set_updated_at
  BEFORE UPDATE ON public.affiliate_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ affiliates: self read + payout detail self-service ============
CREATE POLICY "Affiliates read own record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (id = public.current_affiliate_id());

CREATE POLICY "Affiliates update own payout details" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (id = public.current_affiliate_id())
  WITH CHECK (id = public.current_affiliate_id());

CREATE OR REPLACE FUNCTION public.affiliates_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.code IS DISTINCT FROM OLD.code
     OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.application_id IS DISTINCT FROM OLD.application_id
     OR NEW.notes IS DISTINCT FROM OLD.notes THEN
    RAISE EXCEPTION 'Only payout details and contact phone can be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER affiliates_self_update_guard
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.affiliates_guard_self_update();

-- ============ link attribution on leads/orders ============
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS affiliate_link_slug text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_link_slug text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_content text;