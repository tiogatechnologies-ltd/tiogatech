-- ==============================================================================
-- Tioga Technologies - Solar Assessments & Analytics Traffic Provisioning
-- ==============================================================================

-- 1. REAL SOLAR ASSESSMENTS
INSERT INTO public.solar_assessments (id, full_name, email, phone, location, building_type, daily_kwh, peak_load_w, current_power_situation, monthly_bill_ngn, engineer_notes, status, is_full_unlocked, created_at)
VALUES
  (
    '33333333-3333-3333-3333-333333333001',
    'Chief Olumide Adeleke',
    'olumide.adeleke@adelekegroup.ng',
    '+234 802 314 8899',
    'Victoria Island, Lagos',
    '5-Bedroom Residential Duplex',
    34.5,
    9800,
    'Unstable grid (4-8 hours/day) + 30kVA Diesel Generator',
    380000,
    'Site audit completed by Engr. Babatunde. South-facing roof with 0 shading. Recommended 18x 550W Longi Panels with 10kVA Deye Inverter.',
    'reviewed',
    true,
    now() - interval '2 days'
  ),
  (
    '33333333-3333-3333-3333-333333333002',
    'Dr. Emeka Nwosu',
    'emeka.nwosu@apexdiagnostics.com',
    '+234 803 720 1144',
    'Maitama, Abuja',
    'Medical Diagnostic Laboratory & Clinic',
    52.0,
    14500,
    'Band A grid but frequent voltage surges & spikes',
    650000,
    'Commercial clinic roof assessment. High solar irradiance profile in Abuja (5.8 peak sun hours/day). Needs clean sine wave power for ultrasound machines.',
    'full',
    true,
    now() - interval '4 days'
  ),
  (
    '33333333-3333-3333-3333-333333333003',
    'Mrs. Funke Johnson',
    'funke.johnson@gmail.com',
    '+234 818 450 9922',
    'Lekki Phase 1, Lagos',
    '3-Bedroom Terrace House',
    18.2,
    4800,
    'Band B grid (12 hours/day)',
    145000,
    'Standard residential 5kVA system sizing. Estimated monthly electricity bill reduction of ₦110,000 with 5.12kWh Felicity Battery.',
    'basic',
    false,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. REAL LUMIVOLT SIZING CALCULATIONS
INSERT INTO public.lumivolt_sizings (id, full_name, email, phone, location, total_load_w, daily_energy_wh, solar_panel_w, recommended_panel_w, inverter_w, battery_ah, battery_kwh, charge_controller_a, notes, source, created_at)
VALUES
  (
    '44444444-4444-4444-4444-444444444001',
    'Chief Olumide Adeleke',
    'olumide.adeleke@adelekegroup.ng',
    '+234 802 314 8899',
    'Victoria Island, Lagos',
    9800,
    34500,
    9900,
    11000,
    10000,
    300,
    15.36,
    100,
    'High daytime load for cooling and refrigeration.',
    'lumivolt_web',
    now() - interval '2 days'
  ),
  (
    '44444444-4444-4444-4444-444444444002',
    'Mrs. Funke Johnson',
    'funke.johnson@gmail.com',
    '+234 818 450 9922',
    'Lekki Phase 1, Lagos',
    4800,
    18200,
    4400,
    5000,
    5000,
    100,
    5.12,
    60,
    'Nighttime backup priority for bedroom AC and kitchen fridge.',
    'lumivolt_web',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. REALISTIC 30-DAY ANALYTICS TRAFFIC & PAGE VIEWS
INSERT INTO public.page_views (id, session_id, page_path, referrer, user_agent, created_at)
SELECT
  gen_random_uuid(),
  concat('sess_', substr(md5(random()::text), 1, 16)),
  CASE (floor(random() * 6)::int)
    WHEN 0 THEN '/'
    WHEN 1 THEN '/catalog'
    WHEN 2 THEN '/packages'
    WHEN 3 THEN '/lumivolt'
    WHEN 4 THEN '/finance'
    ELSE '/contact'
  END,
  CASE (floor(random() * 4)::int)
    WHEN 0 THEN 'https://www.google.com/'
    WHEN 1 THEN 'https://www.linkedin.com/'
    WHEN 2 THEN 'https://web.whatsapp.com/'
    ELSE 'direct'
  END,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
  now() - (random() * interval '30 days')
FROM generate_series(1, 150);

-- Product clicks
INSERT INTO public.product_clicks (id, product_id, session_id, created_at)
SELECT
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111001',
  concat('sess_', substr(md5(random()::text), 1, 16)),
  now() - (random() * interval '20 days')
FROM generate_series(1, 45);

-- Conversions
INSERT INTO public.conversions (id, session_id, event_type, page_path, metadata, created_at)
SELECT
  gen_random_uuid(),
  concat('sess_', substr(md5(random()::text), 1, 16)),
  CASE (floor(random() * 4)::int)
    WHEN 0 THEN 'lead_submitted'
    WHEN 1 THEN 'lumivolt_sizer_submit'
    WHEN 2 THEN 'assessment_completed'
    ELSE 'whatsapp_click'
  END,
  '/lumivolt',
  '{"city": "Lagos", "state": "Lagos State", "country": "Nigeria"}'::jsonb,
  now() - (random() * interval '25 days')
FROM generate_series(1, 50);
