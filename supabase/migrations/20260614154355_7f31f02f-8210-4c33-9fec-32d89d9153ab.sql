
-- ============ DISCOUNTS ============
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  type text NOT NULL CHECK (type IN ('percent','flat')),
  value numeric(12,2) NOT NULL CHECK (value > 0),
  min_cart_ngn numeric(12,2) NOT NULL DEFAULT 0,
  max_uses integer,
  per_customer_cap integer NOT NULL DEFAULT 1,
  starts_at timestamptz,
  expires_at timestamptz,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','category','product')),
  applies_to_values text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  uses_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active discounts" ON public.discounts FOR SELECT TO anon, authenticated USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins manage discounts" ON public.discounts FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE TRIGGER trg_discounts_updated_at BEFORE UPDATE ON public.discounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.discount_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  amount_discounted numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.discount_redemptions TO authenticated;
GRANT ALL ON public.discount_redemptions TO service_role;
ALTER TABLE public.discount_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own redemptions" ON public.discount_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE POLICY "Admins manage redemptions" ON public.discount_redemptions FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  diff jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity, entity_id);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE OR REPLACE FUNCTION public.log_audit(_action text, _entity text, _entity_id text, _diff jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_log (actor_id, actor_email, action, entity, entity_id, diff)
  VALUES (auth.uid(), _email, _action, _entity, _entity_id, _diff);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit(text,text,text,jsonb) TO authenticated, service_role;

-- ============ FINANCE ============
CREATE TYPE finance_app_status AS ENUM ('pending','under_review','approved','rejected','active','completed','defaulted','cancelled');
CREATE TYPE finance_inst_status AS ENUM ('upcoming','due','paid','overdue','waived');

CREATE TABLE public.finance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  state text,
  city text,
  date_of_birth date,
  occupation text,
  employer text,
  monthly_income_ngn numeric(12,2),
  id_type text,
  id_number text,
  id_document_url text,
  next_of_kin_name text,
  next_of_kin_phone text,
  item_name text NOT NULL,
  item_reference text,
  total_amount_ngn numeric(12,2) NOT NULL,
  deposit_ngn numeric(12,2) NOT NULL DEFAULT 0,
  financed_ngn numeric(12,2) NOT NULL,
  months integer NOT NULL CHECK (months IN (3,6,12)),
  monthly_payment_ngn numeric(12,2) NOT NULL,
  status finance_app_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  notes text,
  consent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_app_user ON public.finance_applications (user_id);
CREATE INDEX idx_fin_app_status ON public.finance_applications (status);
GRANT SELECT, INSERT, UPDATE ON public.finance_applications TO authenticated;
GRANT ALL ON public.finance_applications TO service_role;
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert their applications" ON public.finance_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Anon can submit guest applications" ON public.finance_applications FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Users read own applications" ON public.finance_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE POLICY "Admins manage applications" ON public.finance_applications FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
GRANT INSERT ON public.finance_applications TO anon;
CREATE TRIGGER trg_fin_app_updated_at BEFORE UPDATE ON public.finance_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.finance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  installment_no integer NOT NULL,
  due_date date NOT NULL,
  amount_ngn numeric(12,2) NOT NULL,
  status finance_inst_status NOT NULL DEFAULT 'upcoming',
  paid_at timestamptz,
  paid_reference text,
  proof_url text,
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, installment_no)
);
CREATE INDEX idx_fin_sched_due ON public.finance_schedules (due_date);
CREATE INDEX idx_fin_sched_status ON public.finance_schedules (status);
GRANT SELECT, UPDATE ON public.finance_schedules TO authenticated;
GRANT ALL ON public.finance_schedules TO service_role;
ALTER TABLE public.finance_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own schedules" ON public.finance_schedules FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])))
);
CREATE POLICY "Admins manage schedules" ON public.finance_schedules FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE TRIGGER trg_fin_sched_updated_at BEFORE UPDATE ON public.finance_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.finance_schedules(id) ON DELETE SET NULL,
  application_id uuid NOT NULL REFERENCES public.finance_applications(id) ON DELETE CASCADE,
  amount_ngn numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'bank_transfer',
  reference text,
  proof_url text,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.finance_payments TO authenticated;
GRANT ALL ON public.finance_payments TO service_role;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.finance_payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND (a.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])))
);
CREATE POLICY "Users submit payments" ON public.finance_payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.finance_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);
CREATE POLICY "Admins manage payments" ON public.finance_payments FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ CRM ============
CREATE TABLE public.customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tag)
);
GRANT SELECT, INSERT, DELETE ON public.customer_tags TO authenticated;
GRANT ALL ON public.customer_tags TO service_role;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tags" ON public.customer_tags FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

CREATE TABLE public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notes" ON public.customer_notes FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- ============ ORDER STATUS HISTORY ============
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_osh_order ON public.order_status_history (order_id);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read order history" ON public.order_status_history FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE POLICY "Admins insert order history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- Order columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz;

-- Product stock columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_qty integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 5;
