-- ==============================================================================
-- Tioga Technologies - Clean All Synthetic / Dummy Data
-- Leaves ONLY 100% Genuine Platform Data
-- ==============================================================================

-- 1. Remove synthetic page views, clicks, and conversion events
DELETE FROM public.page_views WHERE session_id LIKE 'sess_%' OR user_agent LIKE '%generate_series%';
DELETE FROM public.product_clicks WHERE session_id LIKE 'sess_%';
DELETE FROM public.conversions WHERE session_id LIKE 'sess_%';

-- 2. Remove automated QA test leads & dummy submissions
DELETE FROM public.leads WHERE full_name LIKE '%(Automated QA)%' OR email LIKE '%test.customer%' OR email LIKE '%test.lead%';
DELETE FROM public.solar_assessments WHERE id IN ('33333333-3333-3333-3333-333333333001', '33333333-3333-3333-3333-333333333002', '33333333-3333-3333-3333-333333333003');
DELETE FROM public.lumivolt_sizings WHERE id IN ('44444444-4444-4444-4444-444444444001', '44444444-4444-4444-4444-444444444002');
DELETE FROM public.automation_runs WHERE entity_id LIKE '22222222%' OR entity_id = 'TIO-2608-8141' OR entity_id = 'Ikeja-Central-Hub';

-- 3. Remove synthetic staff placeholders (leaves your genuine admin and team accounts intact)
DELETE FROM public.user_roles WHERE user_id IN (
  '55555555-5555-5555-5555-555555555001',
  '55555555-5555-5555-5555-555555555002',
  '55555555-5555-5555-5555-555555555003',
  '55555555-5555-5555-5555-555555555004',
  '55555555-5555-5555-5555-555555555005',
  '55555555-5555-5555-5555-555555555006'
);

DELETE FROM public.profiles WHERE id IN (
  '55555555-5555-5555-5555-555555555001',
  '55555555-5555-5555-5555-555555555002',
  '55555555-5555-5555-5555-555555555003',
  '55555555-5555-5555-5555-555555555004',
  '55555555-5555-5555-5555-555555555005',
  '55555555-5555-5555-5555-555555555006'
);

DELETE FROM auth.users WHERE id IN (
  '55555555-5555-5555-5555-555555555001',
  '55555555-5555-5555-5555-555555555002',
  '55555555-5555-5555-5555-555555555003',
  '55555555-5555-5555-5555-555555555004',
  '55555555-5555-5555-5555-555555555005',
  '55555555-5555-5555-5555-555555555006'
);
