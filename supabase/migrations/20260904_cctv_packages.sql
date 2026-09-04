-- ============================================================
-- Migration: Create cctv_packages table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cctv_packages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  brand       text        NOT NULL DEFAULT 'Hikvision / Dahua Tier-1',
  tagline     text,
  badge       text,
  price       integer,
  channels    integer     NOT NULL DEFAULT 4,
  specs       text[]      NOT NULL DEFAULT '{}',
  features    text[]      NOT NULL DEFAULT '{}',
  image_url   text,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE public.cctv_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packages (mirrors smart_locks / home_automation_packages)
CREATE POLICY "cctv_packages_public_read"
  ON public.cctv_packages FOR SELECT
  USING (is_active = true);

-- Admins & staff can read ALL rows (including hidden), insert, update, delete
CREATE POLICY "cctv_packages_admin_all"
  ON public.cctv_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'staff')
    )
  );

-- Seed the 3 original hardcoded packages
INSERT INTO public.cctv_packages
  (id, name, brand, tagline, badge, price, channels, specs, is_active, sort_order)
VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    '4-Channel Smart AI CCTV Kit',
    'Hikvision / Dahua Tier-1',
    'Ideal for 3-4 Bedroom Residences & Retail Stores',
    'Most Popular',
    480000, 4,
    ARRAY[
      '4x 5MP ColorVu Full-Color Cameras',
      '1TB Surveillance Hard Drive (30 Days)',
      'AI Human & Vehicle Motion Filtering',
      '4K PoE NVR with Remote Phone Streaming',
      'Complete Cabling & In-House Installation'
    ],
    true, 1
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    '8-Channel Perimeter Surveillance System',
    'Hikvision Pro Series',
    'Full Perimeter Coverage for Duplexes & Commercial Offices',
    'Commercial Grade',
    920000, 8,
    ARRAY[
      '8x 5MP Audio-Enabled Weatherproof IP Cameras',
      '2TB High-Endurance NVR Storage',
      'Perimeter Tripwire & Intrusion Siren',
      'Night Vision up to 40 meters',
      'Free Expert Setup & Mobile App Onboarding'
    ],
    true, 2
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    '4G Solar Standalone Dual-Lens PTZ Camera',
    'Tioga Standalone Pro',
    'Zero Electricity & Zero WiFi Required — Built-in Solar & SIM Slot',
    '100% Off-Grid',
    165000, 0,
    ARRAY[
      'Integrated 20W Solar Panel + Lithium Battery',
      '4G LTE SIM Card Slot (Works on MTN/Airtel)',
      '360° Pan-Tilt-Zoom with Auto Motion Tracking',
      'Two-Way Audio Intercom & Flashing Warning Light',
      '128GB High-Speed MicroSD Included'
    ],
    true, 3
  )
ON CONFLICT (id) DO NOTHING;
