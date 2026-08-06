-- ============ QUOTES ============
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  version integer NOT NULL DEFAULT 1,
  parent_quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  sizing_id uuid REFERENCES public.lumivolt_sizings(id) ON DELETE SET NULL,
  assessment_id uuid REFERENCES public.solar_assessments(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  customer_location text,
  title text NOT NULL DEFAULT 'Solar System Quotation',
  subtitle text,
  scope text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  options_table jsonb,
  notes text[] NOT NULL DEFAULT '{}',
  exclusions text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  deposit_pct numeric NOT NULL DEFAULT 30,
  valid_until date,
  status text NOT NULL DEFAULT 'draft',
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  accepted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_sizing ON public.quotes(sizing_id);
CREATE INDEX idx_quotes_assessment ON public.quotes(assessment_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage quotes" ON public.quotes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
CREATE POLICY "Customers view own quotes" ON public.quotes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));

CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PRODUCT WARRANTY ============
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty_months integer NOT NULL DEFAULT 12;

-- ============ DEVICE SERIALS ============
CREATE TABLE public.device_serials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  user_id uuid,
  customer_email text,
  status text NOT NULL DEFAULT 'dispatched',
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  warranty_until date,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT device_serials_serial_unique UNIQUE (serial)
);
CREATE INDEX idx_device_serials_order ON public.device_serials(order_id);
CREATE INDEX idx_device_serials_serial ON public.device_serials(lower(serial));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_serials TO authenticated;
GRANT ALL ON public.device_serials TO service_role;
ALTER TABLE public.device_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage serials" ON public.device_serials FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
CREATE POLICY "Customers view own serials" ON public.device_serials FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));

CREATE TRIGGER device_serials_set_updated_at BEFORE UPDATE ON public.device_serials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ WARRANTY CLAIMS ============
CREATE SEQUENCE IF NOT EXISTS public.rma_seq START 1000;

CREATE TABLE public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number text NOT NULL UNIQUE DEFAULT ('RMA-' || nextval('public.rma_seq')),
  serial_id uuid REFERENCES public.device_serials(id) ON DELETE SET NULL,
  serial text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_name text,
  user_id uuid,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  reason text NOT NULL,
  description text NOT NULL,
  photo_urls text[] NOT NULL DEFAULT '{}',
  in_warranty boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'submitted',
  resolution text,
  assigned_to uuid,
  internal_notes text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_warranty_claims_status ON public.warranty_claims(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage claims" ON public.warranty_claims FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
CREATE POLICY "Customers view own claims" ON public.warranty_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));
CREATE POLICY "Customers create own claims" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email',''))
    AND status = 'submitted'
    AND assigned_to IS NULL
    AND resolution IS NULL
    AND internal_notes IS NULL
    AND resolved_at IS NULL
  );

CREATE TRIGGER warranty_claims_set_updated_at BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.warranty_claims_guard_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.resolution IS DISTINCT FROM OLD.resolution
     OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
     OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
     OR NEW.in_warranty IS DISTINCT FROM OLD.in_warranty
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Only staff can change claim handling fields';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER warranty_claims_guard BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.warranty_claims_guard_fields();

CREATE TABLE public.warranty_claim_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.warranty_claims(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_value text,
  to_value text,
  note text,
  actor_id uuid,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.warranty_claim_events TO authenticated;
GRANT ALL ON public.warranty_claim_events TO service_role;
ALTER TABLE public.warranty_claim_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage claim events" ON public.warranty_claim_events FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
CREATE POLICY "Customers view own claim events" ON public.warranty_claim_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.warranty_claims c
    WHERE c.id = claim_id
      AND (c.user_id = auth.uid() OR lower(c.customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')))
  ));

-- ============ AUTOMATIONS ============
CREATE TABLE public.automation_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_settings TO authenticated;
GRANT ALL ON public.automation_settings TO service_role;
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage automation settings" ON public.automation_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff read automation settings" ON public.automation_settings FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));

CREATE TRIGGER automation_settings_set_updated_at BEFORE UPDATE ON public.automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  entity_type text,
  entity_id text,
  recipient text,
  status text NOT NULL DEFAULT 'sent',
  detail text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_automation_runs_rule ON public.automation_runs(rule_key, created_at DESC);

GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read automation runs" ON public.automation_runs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role]));