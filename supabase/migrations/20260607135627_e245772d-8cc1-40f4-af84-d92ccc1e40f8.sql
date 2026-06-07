
-- Affiliate Applications (public submit, admin manage)
CREATE TABLE public.affiliate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text,
  audience_size text,
  channels text[] NOT NULL DEFAULT '{}',
  social_links text,
  why text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.affiliate_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.affiliate_applications TO authenticated;
GRANT ALL ON public.affiliate_applications TO service_role;

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit affiliate application"
  ON public.affiliate_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(full_name)) BETWEEN 2 AND 120
    AND length(btrim(email)) BETWEEN 5 AND 255
    AND length(btrim(phone)) BETWEEN 7 AND 40
    AND (why IS NULL OR length(why) <= 4000)
  );

CREATE POLICY "Admins manage affiliate applications"
  ON public.affiliate_applications FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER affiliate_applications_set_updated_at
  BEFORE UPDATE ON public.affiliate_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Affiliates (admin-only)
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  code text NOT NULL UNIQUE,
  commission_rate numeric(5,2) NOT NULL DEFAULT 10.00,
  status text NOT NULL DEFAULT 'active',
  payout_method text,
  payout_details text,
  notes text,
  application_id uuid REFERENCES public.affiliate_applications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliates"
  ON public.affiliates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER affiliates_set_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_affiliates_code ON public.affiliates(code);


-- Lead attribution fields
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE INDEX IF NOT EXISTS idx_leads_affiliate_code ON public.leads(affiliate_code);
