-- ==============================================================================
-- Tioga Technologies ERP - Phase 1 Migration Script
-- Multi-Warehouse Inventory, Serial Tracking, Tax Invoicing & Field Work Orders
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WAREHOUSES & LOCATIONS
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  manager_name TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Default Warehouses
INSERT INTO public.warehouses (name, code, location, manager_name, phone)
VALUES 
  ('Lagos Central Hub (Ikeja)', 'LOS-CENTRAL', '12 Commercial Ave, Ikeja, Lagos', 'Babatunde Adeleke', '+2348178000023'),
  ('Abuja Regional Hub (Maitama)', 'ABJ-REGIONAL', 'Plot 402 Constitution Ave, Maitama, Abuja', 'Emeka Nwosu', '+2348031234567'),
  ('Field Service Van 1 (Lagos Team A)', 'VAN-LOS-01', 'Mobile - Lagos Mainland & Island', 'Sunday Okon', '+2348123456781'),
  ('Field Service Van 2 (Abuja Team A)', 'VAN-ABJ-01', 'Mobile - FCT & Environs', 'Musa Ibrahim', '+2348123456782'),
  ('RMA & Quarantine Depot', 'RMA-DEPOT', 'Ikeja Service Center, Lagos', 'Tayo Ogundipe', '+2348178000025')
ON CONFLICT (code) DO NOTHING;

-- 2. WAREHOUSE INVENTORY ITEMS (Stock per Location)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_allocated INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 5,
  unit_cost NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, warehouse_id)
);

-- 3. SERIAL NUMBERS LIFECYCLE TRACKER
CREATE TABLE IF NOT EXISTS public.serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_no TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'allocated', 'installed', 'rma_defective', 'returned')),
  installed_customer_name TEXT,
  installed_customer_phone TEXT,
  work_order_no TEXT,
  warranty_start_date DATE,
  warranty_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. STOCK TRANSFERS & WAYBILLS
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_no TEXT NOT NULL UNIQUE,
  from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT NOT NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_no TEXT,
  waybill_notes TEXT,
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. COMMERCIAL TAX & PROFORMA INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL DEFAULT 'tax_invoice' CHECK (invoice_type IN ('tax_invoice', 'proforma', 'receipt')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat_applicable BOOLEAN NOT NULL DEFAULT true,
  vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  wht_applicable BOOLEAN NOT NULL DEFAULT false,
  wht_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  deposit_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FIELD WORK ORDERS & DIGITAL COMMISSIONING
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_no TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  site_address TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  lead_engineer_name TEXT NOT NULL,
  crew_members TEXT[] DEFAULT '{}',
  job_type TEXT NOT NULL DEFAULT 'solar_installation' CHECK (job_type IN ('solar_installation', 'smart_home_setup', 'maintenance_repair', 'security_cctv')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'commissioned', 'cancelled')),
  bill_of_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  commissioning_checklist JSONB NOT NULL DEFAULT '{
    "pv_voltage_checked": false,
    "earthing_tested": false,
    "battery_terminal_torqued": false,
    "app_monitoring_synced": false,
    "fire_safety_breaker_tested": false,
    "customer_trained": false
  }'::jsonb,
  pv_voltage_recorded TEXT,
  earthing_resistance TEXT,
  customer_notes TEXT,
  commissioned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ENABLE ROW LEVEL SECURITY AND PERMISSIONS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Grant permissions to standard roles
GRANT ALL ON TABLE public.warehouses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inventory_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.serial_numbers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stock_transfers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.invoices TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.work_orders TO anon, authenticated, service_role;

-- Public RLS Policies
DROP POLICY IF EXISTS "Allow full access on warehouses" ON public.warehouses;
CREATE POLICY "Allow full access on warehouses" ON public.warehouses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on inventory_items" ON public.inventory_items;
CREATE POLICY "Allow full access on inventory_items" ON public.inventory_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on serial_numbers" ON public.serial_numbers;
CREATE POLICY "Allow full access on serial_numbers" ON public.serial_numbers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on stock_transfers" ON public.stock_transfers;
CREATE POLICY "Allow full access on stock_transfers" ON public.stock_transfers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on invoices" ON public.invoices;
CREATE POLICY "Allow full access on invoices" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on work_orders" ON public.work_orders;
CREATE POLICY "Allow full access on work_orders" ON public.work_orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
