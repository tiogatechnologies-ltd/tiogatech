-- ==============================================================================
-- Tioga Technologies ERP - Phase 3 Migration Script
-- General Ledger, Chart of Accounts, Job Costing & Engineer Commissions
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CHART OF ACCOUNTS (COA)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Standard Solar & Smart Tech Chart of Accounts
INSERT INTO public.chart_of_accounts (code, name, account_type, balance, description)
VALUES
  ('1010', 'Cash on Hand (Petty Cash)', 'asset', 450000, 'Operating cash float for office & minor site supplies'),
  ('1020', 'Access Bank Plc (Operating Account)', 'asset', 18500000, 'Primary corporate collection & disbursements account'),
  ('1030', 'Accounts Receivable (Trade Debtors)', 'asset', 8450000, 'Pending customer invoice & installment balances'),
  ('1040', 'Solar & Hardware Inventory Asset', 'asset', 34200000, 'Valuation of inverters, lithium batteries & panels in hubs'),
  ('2010', 'Accounts Payable (Trade Creditors)', 'liability', 5200000, 'Outstanding supplier invoices & vendor balances'),
  ('2020', 'FIRS VAT Payable (7.5%)', 'liability', 1240000, 'Collected sales tax due to Federal Inland Revenue Service'),
  ('3010', 'Owner Equity & Retained Earnings', 'equity', 45000000, 'Initial capital and accumulated retained profits'),
  ('4010', 'Solar System Sales Revenue', 'revenue', 82000000, 'Income from solar packages, inverters & battery installations'),
  ('4020', 'Smart Home & Security Sales Revenue', 'revenue', 14500000, 'Income from smart door locks & CCTV installations'),
  ('4030', 'Engineering & Installation Service Revenue', 'revenue', 9800000, 'Service fees for sizing, mounting & commissioning'),
  ('5010', 'Cost of Goods Sold (Hardware COGS)', 'expense', 48500000, 'Direct landed cost of equipment installed at client sites'),
  ('5020', 'Field Technician Wages & Labor', 'expense', 6200000, 'Direct installer stipends and milestone bonuses'),
  ('5030', 'Freight, Logistics & Waybill Haulage', 'expense', 2400000, 'Transport, delivery vans and interstate shipping fees'),
  ('5040', 'Marketing, Software & Utilities', 'expense', 3100000, 'Online advertising, cloud servers and showroom power')
ON CONFLICT (code) DO NOTHING;

-- 2. DOUBLE-ENTRY JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type TEXT NOT NULL DEFAULT 'manual' CHECK (reference_type IN ('invoice', 'purchase_order', 'payroll', 'expense', 'manual')),
  reference_no TEXT,
  narration TEXT NOT NULL,
  total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted')),
  created_by TEXT DEFAULT 'Finance Manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. JOB COSTING & PROJECT PROFITABILITY
CREATE TABLE IF NOT EXISTS public.job_costing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no TEXT NOT NULL UNIQUE,
  work_order_no TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  system_description TEXT NOT NULL,
  contract_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
  hardware_cogs NUMERIC(15, 2) NOT NULL DEFAULT 0,
  technician_labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  logistics_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  miscellaneous_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Sample Job Costing Records
INSERT INTO public.job_costing_records (job_no, work_order_no, customer_name, system_description, contract_revenue, hardware_cogs, technician_labor_cost, logistics_cost, miscellaneous_cost, gross_profit, gross_margin_percent)
VALUES
  ('JOB-2608-01', 'WO-2608-1001', 'Dr. Kolawole Balogun (Lekki)', '10kVA Solar System + 20kWh Lithium Battery', 7500000, 4800000, 350000, 120000, 80000, 2150000, 28.67),
  ('JOB-2608-02', 'WO-2608-1002', 'Alhaji Mansur Bello (Maitama)', '15kVA 3-Phase Commercial Solar Rig', 12000000, 7900000, 550000, 180000, 120000, 3250000, 27.08),
  ('JOB-2608-03', 'WO-2608-1003', 'Apex Luxury Apartments (Ikoyi)', '4x Smart Door Locks + Biometric Intercom', 1850000, 950000, 150000, 45000, 25000, 680000, 36.76)
ON CONFLICT (job_no) DO NOTHING;

-- 4. FIELD ENGINEER COMMISSIONS
CREATE TABLE IF NOT EXISTS public.engineer_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_name TEXT NOT NULL,
  engineer_phone TEXT,
  work_order_no TEXT NOT NULL,
  system_size_kwp NUMERIC(5, 2) NOT NULL DEFAULT 0,
  commission_rate_per_kwp NUMERIC(15, 2) NOT NULL DEFAULT 15000,
  commission_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_payout NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued', 'approved', 'paid')),
  approved_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Sample Commission Records
INSERT INTO public.engineer_commissions (engineer_name, engineer_phone, work_order_no, system_size_kwp, commission_rate_per_kwp, commission_amount, bonus_amount, total_payout, status)
VALUES
  ('Engr. Sunday Okon', '+2348123456781', 'WO-2608-1001', 10.0, 15000, 150000, 25000, 175000, 'approved'),
  ('Engr. Musa Ibrahim', '+2348123456782', 'WO-2608-1002', 15.0, 15000, 225000, 50000, 275000, 'accrued'),
  ('Tunde Electrician', '+2348123456783', 'WO-2608-1003', 2.5, 15000, 37500, 10000, 47500, 'paid')
ON CONFLICT DO NOTHING;

-- 5. FIELD ENGINEER HSE CERTIFICATIONS
CREATE TABLE IF NOT EXISTS public.engineer_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_name TEXT NOT NULL,
  certification_name TEXT NOT NULL,
  certificate_number TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Engineer Certifications
INSERT INTO public.engineer_certifications (engineer_name, certification_name, certificate_number, issuing_authority, issued_date, expiry_date, status)
VALUES
  ('Engr. Sunday Okon', 'NEMSA Certified Solar Competency Certificate', 'NEMSA-SOL-2024-884', 'Nigerian Electricity Management Services Agency', '2024-01-15', '2027-01-15', 'active'),
  ('Engr. Sunday Okon', 'Working at Height & Rooftop Safety (HSE Level 3)', 'HSE-WAH-2023-102', 'Institute of Safety Professionals of Nigeria', '2023-06-10', '2026-06-10', 'active'),
  ('Engr. Musa Ibrahim', 'COREN Registered Electrical Engineer', 'R.48291/COREN', 'Council for the Regulation of Engineering in Nigeria', '2022-09-01', '2027-09-01', 'active')
ON CONFLICT DO NOTHING;

-- 6. ENABLE RLS AND GRANT PERMISSIONS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_costing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_certifications ENABLE ROW LEVEL SECURITY;

-- SECURITY NOTE (corrected): originally `USING (true)` for `anon,
-- authenticated` - any visitor could read/write/delete the general ledger,
-- journal entries and engineer commission/payroll data with no login.
-- Chart of accounts and journal entries are admin-only (core accounting);
-- job costing and engineer records are admin/staff.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chart_of_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.journal_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.journal_entry_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_costing_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.engineer_commissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.engineer_certifications TO authenticated;
GRANT ALL ON TABLE public.chart_of_accounts, public.journal_entries, public.journal_entry_lines, public.job_costing_records, public.engineer_commissions, public.engineer_certifications TO service_role;

DROP POLICY IF EXISTS "Allow full access on chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins manage chart_of_accounts fix" ON public.chart_of_accounts;
CREATE POLICY "Admins manage chart_of_accounts fix" ON public.chart_of_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Admins manage journal_entries fix" ON public.journal_entries;
CREATE POLICY "Admins manage journal_entries fix" ON public.journal_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on journal_entry_lines" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "Admins manage journal_entry_lines fix" ON public.journal_entry_lines;
CREATE POLICY "Admins manage journal_entry_lines fix" ON public.journal_entry_lines FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Allow full access on job_costing_records" ON public.job_costing_records;
DROP POLICY IF EXISTS "Staff manage job_costing_records fix" ON public.job_costing_records;
CREATE POLICY "Staff manage job_costing_records fix" ON public.job_costing_records FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on engineer_commissions" ON public.engineer_commissions;
DROP POLICY IF EXISTS "Staff manage engineer_commissions fix" ON public.engineer_commissions;
CREATE POLICY "Staff manage engineer_commissions fix" ON public.engineer_commissions FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Allow full access on engineer_certifications" ON public.engineer_certifications;
DROP POLICY IF EXISTS "Staff manage engineer_certifications fix" ON public.engineer_certifications;
CREATE POLICY "Staff manage engineer_certifications fix" ON public.engineer_certifications FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
