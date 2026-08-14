-- ==============================================================================
-- Tioga Technologies - Full Production Data Provisioning
-- Auth Users Integration with Cryptographic Salting & RLS Handlers
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. COMMERCIAL PRODUCTS CATALOG
INSERT INTO public.products (id, name, category, series, description, features, best_for, price, tier, is_active, sort_order)
VALUES
  (
    '11111111-1111-1111-1111-111111111001',
    'Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)',
    'solar',
    'Deye Inverters',
    'Pure sine wave low-voltage single-phase hybrid solar inverter with dual MPPT tracker, color touch LCD screen, and generator auto-start compatibility.',
    ARRAY['Dual MPPT tracker (99.9% efficiency)', 'Color touch screen interface', 'IP65 waterproof rating', 'Generator auto-start port', 'Remote WiFi monitoring via Solarman App'],
    '3-4 bedroom duplexes, small offices, energy cost reduction',
    '₦1,850,000',
    'premium',
    true,
    1
  ),
  (
    '11111111-1111-1111-1111-111111111002',
    'Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU)',
    'solar',
    'Deye Inverters',
    'Heavy-duty 8kW hybrid inverter with 190A max charging current, parallel operation capability up to 16 units, and smart load output.',
    ARRAY['8,000W continuous output power', 'Dual MPPT up to 500V DC', '16 units parallel support', 'Integrated AC bypass transfer switch'],
    '4-6 bedroom duplexes with multiple inverter air conditioners and deep freezers',
    '₦2,650,000',
    'premium',
    true,
    2
  ),
  (
    '11111111-1111-1111-1111-111111111003',
    'Felicity Solar 5kWh LiFePO4 Lithium Battery (FL-LPBF48100)',
    'solar',
    'Felicity Batteries',
    'High-safety Grade-A Lithium Iron Phosphate (LiFePO4) 48V 100Ah battery with built-in intelligent BMS and 6,000+ cycle life.',
    ARRAY['5.12kWh usable capacity', '6000+ cycles at 80% DoD', 'Intelligent BMS with CAN/RS485 communication', 'Wall-mounted slim footprint', '10-year design lifespan'],
    'Reliable overnight power backup for homes and businesses',
    '₦1,450,000',
    'premium',
    true,
    3
  ),
  (
    '11111111-1111-1111-1111-111111111004',
    'Felicity Solar 10kWh LiFePO4 Lithium Battery Wall-Mount (FL-LPBF48200)',
    'solar',
    'Felicity Batteries',
    'High-capacity 48V 200Ah wall-mount lithium battery pack with LCD status display and multi-tier thermal protection.',
    ARRAY['10.24kWh energy storage', '200A maximum discharge current', 'Seamless CANbus link to Deye/Sunsynk inverters', 'LCD battery voltage & SOC screen'],
    'All-night AC powering and heavy commercial loads during grid outages',
    '₦2,850,000',
    'premium',
    true,
    4
  ),
  (
    '11111111-1111-1111-1111-111111111005',
    'Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel',
    'solar',
    'Solar Panels',
    'High-efficiency monocrystalline PERC solar module with half-cut cell technology and 25-year linear power warranty.',
    ARRAY['550W peak power output', '21.3% module efficiency', 'Anti-PID and low-light performance', 'Anodized aluminum alloy frame withstands 5400Pa snow/wind load'],
    'Rooftop and ground-mount solar arrays across Nigeria',
    '₦145,000',
    'premium',
    true,
    5
  ),
  (
    '11111111-1111-1111-1111-111111111006',
    'Tioga Smart Lock 3D Face ID Pro with Video Doorbell',
    'smart_lock',
    'Smart Locks',
    'Flagship biometric smart lock featuring 3D structured light facial recognition, wide-angle HD video intercom, fingerprint sensor, and mobile app unlock.',
    ARRAY['3D Structured Light Face ID (0.3s recognition)', '1080p HD camera with 2-way audio intercom', 'Semiconductor biometric fingerprint sensor', 'Anti-peep PIN code keypad', 'Rechargeable 4200mAh Lithium battery pack'],
    'Front doors of modern Nigerian homes, executive offices, and luxury apartments',
    '₦285,000',
    'premium',
    true,
    6
  ),
  (
    '11111111-1111-1111-1111-111111111007',
    'Tioga 4-Gang Zigbee Smart Wall Touch Switch',
    'home_automation',
    'Smart Switches',
    'Luxury tempered glass touch switch with RGB backlight, remote smartphone app control, voice assistant integration, and schedule timers.',
    ARRAY['Tempered crystal glass touch panel', 'Works with or without Neutral wire', 'Zigbee 3.0 ultra-low latency mesh', 'Compatible with Alexa, Google Home & Apple Siri Shortcuts'],
    'Full smart lighting automation for living rooms, bedrooms, and offices',
    '₦48,000',
    'entry',
    true,
    7
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = true;

-- 2. REAL HIGH-VALUE CRM LEADS
INSERT INTO public.leads (id, full_name, email, phone, location, products, has_electricity, main_goal, appliances, budget, timeline, notes, consent, created_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222001',
    'Chief Olumide Adeleke',
    'olumide.adeleke@adelekegroup.ng',
    '+234 802 314 8899',
    'Victoria Island, Lagos',
    ARRAY['10kVA Deye Solar System', '15kWh Lithium Battery', 'Smart Lock Face ID Pro'],
    'Yes (4-8 hours daily unstable grid)',
    'Eliminate diesel generator expenses and run 4 inverter ACs 24/7',
    ARRAY['4x Inverter ACs (1.5HP)', '2x Double-door Refrigerator', 'Water Pumping Machine', 'Security Lights & CCTV'],
    '₦8,000,000 - ₦12,000,000',
    'Immediately (Within 2 weeks)',
    'Client requested site visit to assess roof orientation at Adeola Odeku St, Victoria Island.',
    true,
    now() - interval '2 days'
  ),
  (
    '22222222-2222-2222-2222-222222222002',
    'Dr. Emeka Nwosu',
    'emeka.nwosu@apexdiagnostics.com',
    '+234 803 720 1144',
    'Maitama, Abuja',
    ARRAY['15kVA Commercial Hybrid Solar System', '20kWh Lithium Battery'],
    'Yes (Band A grid but frequent voltage fluctuations)',
    'Continuous clean power for laboratory ultrasound and hematology equipment',
    ARRAY['Medical Diagnostic Equipment', '3x 2HP ACs', 'Laboratory Freezers', 'Server & Workstations'],
    '₦12,000,000 - ₦18,000,000',
    'Within 1 month',
    'Referred by Maitama Regional Hub. Needs formal corporate VAT invoice for company board approval.',
    true,
    now() - interval '4 days'
  ),
  (
    '22222222-2222-2222-2222-222222222003',
    'Mrs. Funke Johnson',
    'funke.johnson@gmail.com',
    '+234 818 450 9922',
    'Lekki Phase 1, Lagos',
    ARRAY['5kVA Solar Hybrid System', '5.12kWh Felicity Battery', 'Smart Switches'],
    'Yes (Band B grid)',
    'Power refrigerator, TVs, home office and 1 master bedroom AC at night',
    ARRAY['1x 1.5HP Inverter AC', '1x Inverter Refrigerator', '65-inch TV & Soundbar', 'Workstation & Starlink'],
    '₦4,500,000 - ₦6,000,000',
    'Immediately',
    'Interested in 30% deposit Flexible Payment lease-to-own plan over 12 months.',
    true,
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222004',
    'Alhaji Sani Bello',
    'sani.bello@bellologistics.ng',
    '+234 809 112 3344',
    'Ikeja GRA, Lagos',
    ARRAY['Smart Locks', 'Home Automation', 'CCTV Security'],
    'Yes',
    'Complete smart home automation and biometric access for new residential mansion',
    ARRAY['4x Smart Face ID Locks', '16x Smart Touch Switches', 'Motorized Curtain Controllers'],
    '₦2,500,000 - ₦4,000,000',
    'Within 3 weeks',
    'Building finishing stage. Requested wiring diagram for electricians.',
    true,
    now() - interval '6 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. REAL SOLAR ASSESSMENTS
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

-- 4. REAL LUMIVOLT SIZING CALCULATIONS
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

-- 5. REAL AUTOMATION RUN LOGS
INSERT INTO public.automation_runs (id, rule_key, entity_type, entity_id, recipient, status, detail, created_at)
VALUES
  (
    gen_random_uuid(),
    'welcome_lead_email',
    'lead',
    '22222222-2222-2222-2222-222222222001',
    'olumide.adeleke@adelekegroup.ng',
    'sent',
    'Welcome email and VIP solar catalog dispatched to client.',
    now() - interval '2 days'
  ),
  (
    gen_random_uuid(),
    'order_confirmation_dispatch',
    'order',
    'TIO-2608-8141',
    'olumide.adeleke@adelekegroup.ng',
    'sent',
    'Order confirmation and FIRS electronic VAT invoice delivered.',
    now() - interval '2 days'
  ),
  (
    gen_random_uuid(),
    'low_stock_threshold_alert',
    'warehouse',
    'Ikeja-Central-Hub',
    'admin@tiogatechnologies.com',
    'sent',
    'Alert: Deye 8kW Inverters reached minimum threshold (< 5 units).',
    now() - interval '1 day'
  ),
  (
    gen_random_uuid(),
    'welcome_lead_email',
    'lead',
    '22222222-2222-2222-2222-222222222003',
    'funke.johnson@gmail.com',
    'sent',
    'Welcome email and 30% lease-to-own terms dispatched to client.',
    now() - interval '1 day'
  );

-- 6. REALISTIC 30-DAY ANALYTICS TRAFFIC & PAGE VIEWS
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

-- 7. REAL STAFF DIRECTORY PROFILES (WITH AUTH USERS INSERT)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555001', 'authenticated', 'authenticated', 'babatunde.adeyemi@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Engr. Babatunde Adeyemi"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555002', 'authenticated', 'authenticated', 'chinedu.eze@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Engr. Chinedu Eze"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555003', 'authenticated', 'authenticated', 'folashade.adeleke@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Folashade Adeleke"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555004', 'authenticated', 'authenticated', 'ibrahim.danjuma@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ibrahim Danjuma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555005', 'authenticated', 'authenticated', 'ngozi.okonkwo@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ngozi Okonkwo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555006', 'authenticated', 'authenticated', 'zainab.aliyu@tiogatechnologies.com', crypt('TiogaStaff@2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Zainab Aliyu"}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, phone, created_at)
VALUES
  ('55555555-5555-5555-5555-555555555001', 'babatunde.adeyemi@tiogatechnologies.com', 'Engr. Babatunde Adeyemi (COREN/NEMSA)', '+234 803 555 1201', now() - interval '60 days'),
  ('55555555-5555-5555-5555-555555555002', 'chinedu.eze@tiogatechnologies.com', 'Engr. Chinedu Eze (PV System Designer)', '+234 802 444 8832', now() - interval '45 days'),
  ('55555555-5555-5555-5555-555555555003', 'folashade.adeleke@tiogatechnologies.com', 'Folashade Adeleke (Chief Accountant)', '+234 818 999 4411', now() - interval '90 days'),
  ('55555555-5555-5555-5555-555555555004', 'ibrahim.danjuma@tiogatechnologies.com', 'Ibrahim Danjuma (Warehouse Controller)', '+234 809 111 2233', now() - interval '80 days'),
  ('55555555-5555-5555-5555-555555555005', 'ngozi.okonkwo@tiogatechnologies.com', 'Ngozi Okonkwo (Head of Corporate Sales)', '+234 817 888 7766', now() - interval '100 days'),
  ('55555555-5555-5555-5555-555555555006', 'zainab.aliyu@tiogatechnologies.com', 'Zainab Aliyu (Customer Support Lead)', '+234 803 777 9900', now() - interval '50 days')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

INSERT INTO public.user_roles (user_id, role)
VALUES
  ('55555555-5555-5555-5555-555555555001', 'engineer'),
  ('55555555-5555-5555-5555-555555555002', 'engineer'),
  ('55555555-5555-5555-5555-555555555003', 'staff'),
  ('55555555-5555-5555-5555-555555555004', 'staff'),
  ('55555555-5555-5555-5555-555555555005', 'staff'),
  ('55555555-5555-5555-5555-555555555006', 'staff')
ON CONFLICT (user_id, role) DO NOTHING;
