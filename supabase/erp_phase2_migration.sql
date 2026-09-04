-- ==============================================================================
-- Tioga Technologies ERP - Phase 2 Migration Script
-- Multi-Tier Enterprise Approvals & OEM Manufacturer RMA Lifecycle
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MULTI-TIER APPROVAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL CHECK (request_type IN ('discount_override', 'purchase_order', 'expense_claim', 'inventory_writeoff')),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15, 2) DEFAULT 0,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  requested_by_name TEXT NOT NULL,
  requested_by_role TEXT NOT NULL DEFAULT 'staff',
  target_reference TEXT,
  required_approval_tier TEXT NOT NULL DEFAULT 'sales_manager' CHECK (required_approval_tier IN ('sales_manager', 'cfo_accountant', 'director_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Sample Approval Requests
INSERT INTO public.approval_requests (request_no, request_type, title, description, amount, discount_percent, requested_by_name, requested_by_role, target_reference, required_approval_tier, status)
VALUES
  ('APR-2608-101', 'discount_override', '10% Commercial Solar Discount for Lekki Phase 1 Project', 'Client requested discount on 15kVA 3-Phase system due to bulk order of 3 units.', 12500000, 10.0, 'Emeka Nwosu', 'sales_rep', 'QUO-2608-491', 'sales_manager', 'pending'),
  ('APR-2608-102', 'purchase_order', 'Procurement of 20 units 10kWh LiFePO4 Lithium Batteries (Felicity)', 'Emergency replenishment for Abuja depot before upcoming price adjustment.', 28500000, 0, 'Babatunde Adeleke', 'warehouse_manager', 'PO-2026-088', 'director_admin', 'pending'),
  ('APR-2608-103', 'expense_claim', 'Field Installation Transit & Heavy Equipment Scaffolding', 'Hired boom lift and fuel for rooftop installation at Victoria Island tower.', 185000, 0, 'Engr. Sunday Okon', 'engineer', 'WO-2608-1001', 'cfo_accountant', 'pending')
ON CONFLICT (request_no) DO NOTHING;

-- 2. ENSURE WARRANTY CLAIMS TABLE HAS OEM RMA COLUMNS
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  product_name TEXT NOT NULL,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.warranty_claims ADD COLUMN IF NOT EXISTS rma_number TEXT;
ALTER TABLE public.warranty_claims ADD COLUMN IF NOT EXISTS oem_manufacturer TEXT;
ALTER TABLE public.warranty_claims ADD COLUMN IF NOT EXISTS diagnostic_test_notes TEXT;
ALTER TABLE public.warranty_claims ADD COLUMN IF NOT EXISTS loaner_serial_no TEXT;
ALTER TABLE public.warranty_claims ADD COLUMN IF NOT EXISTS oem_rma_status TEXT DEFAULT 'pending_bench_test';

-- 3. ENABLE RLS AND PERMISSIONS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

-- SECURITY NOTE (corrected): originally `USING (true)` for `anon,
-- authenticated` - i.e. any visitor, logged in or not, could read/write/
-- delete every approval request and warranty claim. Scoped to match the
-- policies the live database actually runs: staff/admin manage everything,
-- customers only see and create their own claims.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.warranty_claims TO authenticated;
GRANT ALL ON TABLE public.approval_requests, public.warranty_claims TO service_role;

DROP POLICY IF EXISTS "Allow full access on approval_requests" ON public.approval_requests;
DROP POLICY IF EXISTS "Staff manage approval_requests fix" ON public.approval_requests;
CREATE POLICY "Staff manage approval_requests fix" ON public.approval_requests FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on warranty_claims" ON public.warranty_claims;
DROP POLICY IF EXISTS "Staff manage claims" ON public.warranty_claims;
CREATE POLICY "Staff manage claims" ON public.warranty_claims FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role,'staff'::app_role,'engineer'::app_role]));
DROP POLICY IF EXISTS "Customers view own claims" ON public.warranty_claims;
CREATE POLICY "Customers view own claims" ON public.warranty_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));
DROP POLICY IF EXISTS "Customers create own claims" ON public.warranty_claims;
CREATE POLICY "Customers create own claims" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email','')));
