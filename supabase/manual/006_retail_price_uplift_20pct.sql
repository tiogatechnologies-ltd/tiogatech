-- ==============================================================================
-- 006_retail_price_uplift_20pct.sql
-- Raises every LIVE customer-facing price by 20% (wholesaler price -> Tioga retail
-- price) in the tables that override the static catalog: products, solar_packages,
-- smart_locks, home_automation_packages, cctv_packages.
--
-- Safe to run more than once: each UPDATE only fires while the row still holds the
-- exact old value it was generated from, so a second run changes nothing and a price
-- someone edited by hand in the meantime is never overwritten.
-- Run in the Supabase SQL editor. The whole script is one transaction.
-- ==============================================================================

BEGIN;

-- products (price is a display string; numeric price comes from the static catalog)
UPDATE public.products SET price = '₦2,220,000' WHERE id = '11111111-1111-1111-1111-111111111001' AND price = '₦1,850,000'; -- Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)
UPDATE public.products SET price = '₦3,180,000' WHERE id = '11111111-1111-1111-1111-111111111002' AND price = '₦2,650,000'; -- Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU)
UPDATE public.products SET price = '₦1,740,000' WHERE id = '11111111-1111-1111-1111-111111111003' AND price = '₦1,450,000'; -- Felicity Solar 5kWh LiFePO4 Lithium Battery (FL-LPBF48100)
UPDATE public.products SET price = '₦3,420,000' WHERE id = '11111111-1111-1111-1111-111111111004' AND price = '₦2,850,000'; -- Felicity Solar 10kWh LiFePO4 Lithium Battery Wall-Mount (FL-LPBF48200)
UPDATE public.products SET price = '₦174,000' WHERE id = '11111111-1111-1111-1111-111111111005' AND price = '₦145,000'; -- Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel
UPDATE public.products SET price = '₦342,000' WHERE id = '11111111-1111-1111-1111-111111111006' AND price = '₦285,000'; -- Tioga Smart Lock 3D Face ID Pro with Video Doorbell
UPDATE public.products SET price = '₦57,600' WHERE id = '11111111-1111-1111-1111-111111111007' AND price = '₦48,000'; -- Tioga 4-Gang Zigbee Smart Wall Touch Switch

-- solar_packages (components, setup fee and total)
UPDATE public.solar_packages SET inverter_price = 780000, solar_panels_price = 1267200, battery_price = 1980000, charge_controller_price = 237600, accessories_price = 189600, setup_fee = 374640, total_price = 4828800 WHERE id = 'b8962479-9b75-45ea-94a1-28d6c3ea36a9' AND total_price = 4024000; -- package #1
UPDATE public.solar_packages SET inverter_price = 1326000, solar_panels_price = 1900800, battery_price = 2340000, accessories_price = 268800, setup_fee = 583560, total_price = 6419160 WHERE id = '81195c36-8b46-4135-9dd3-6b562de21646' AND total_price = 5349300; -- package #2
UPDATE public.solar_packages SET inverter_price = 1404000, solar_panels_price = 2851200, battery_price = 3276000, accessories_price = 475200, setup_fee = 800640, total_price = 8807040 WHERE id = '6eb052c8-d4fd-43cb-b41e-e73ae56c9adf' AND total_price = 7339200; -- package #3
UPDATE public.solar_packages SET inverter_price = 2028000, solar_panels_price = 3801600, battery_price = 4992000, charge_controller_price = 417600, accessories_price = 612000, setup_fee = 1143360, total_price = 12994560 WHERE id = '767502ca-16f5-480a-94cd-caeb70671943' AND total_price = 10828800; -- package #4
UPDATE public.solar_packages SET inverter_price = 2028000, solar_panels_price = 3801600, battery_price = 6240000, charge_controller_price = 417600, accessories_price = 806400, setup_fee = 1329360, total_price = 14622960 WHERE id = '75465f2b-824c-48cf-af34-0ee8d3f1ba0f' AND total_price = 12185800; -- package #5
UPDATE public.solar_packages SET inverter_price = 2028000, solar_panels_price = 4435200, battery_price = 6552000, charge_controller_price = 417600, accessories_price = 806400, setup_fee = 1423920, total_price = 15663120 WHERE id = '484a97f7-fa20-4715-87f8-91681c1cf7b2' AND total_price = 13052600; -- package #6
UPDATE public.solar_packages SET inverter_price = 4056000, solar_panels_price = 6451200, battery_price = 9984000, charge_controller_price = 835200, accessories_price = 1411200, setup_fee = 2232000, total_price = 24969600 WHERE id = 'ee8834e8-55f3-4060-9c7b-5ca9288dfc27' AND total_price = 20808000; -- package #7
UPDATE public.solar_packages SET inverter_price = 6084000, solar_panels_price = 9676800, battery_price = 24960000, charge_controller_price = 1252800, accessories_price = 2217600, setup_fee = 4419360, total_price = 48610560 WHERE id = '467b4a1f-633c-4ce7-b828-88c8f4b56cbd' AND total_price = 40508800; -- package #8
UPDATE public.solar_packages SET inverter_price = 273600, solar_panels_price = 265200, battery_price = 338400, charge_controller_price = 237600, accessories_price = 108000, setup_fee = 127440, total_price = 1350240 WHERE id = '9942e9f5-fd5d-4d2f-ab54-9c813c78f005' AND total_price = 1125200; -- package #9
UPDATE public.solar_packages SET inverter_price = 296400, solar_panels_price = 265200, battery_price = 676800, charge_controller_price = 237600, accessories_price = 144000, setup_fee = 203400, total_price = 1823400 WHERE id = '22587e07-b6fa-4243-826b-d3eaa2e25564' AND total_price = 1519500; -- package #10
UPDATE public.solar_packages SET inverter_price = 672000, solar_panels_price = 636000, battery_price = 655200, charge_controller_price = 237600, accessories_price = 158400, setup_fee = 300960, total_price = 2659200 WHERE id = 'fabdca79-ba04-4d8c-81d9-cb4b3eb7c4c0' AND total_price = 2216000; -- package #11
UPDATE public.solar_packages SET inverter_price = 708000, solar_panels_price = 1267200, battery_price = 1353600, charge_controller_price = 237600, accessories_price = 189600, setup_fee = 374640, total_price = 4130640 WHERE id = '8c49b984-2db6-4e9a-a982-b02c175f9f5e' AND total_price = 3442200; -- package #12
UPDATE public.solar_packages SET inverter_price = 1326000, solar_panels_price = 1900800, battery_price = 2030400, charge_controller_price = 288600, accessories_price = 268800, setup_fee = 540528, total_price = 6355128 WHERE id = 'a2a1d914-f489-406c-b1ec-7aae14d02357' AND total_price = 5295940; -- package #13
UPDATE public.solar_packages SET inverter_price = 702000, solar_panels_price = 1900800, battery_price = 2030400, charge_controller_price = 288600, accessories_price = 268800, setup_fee = 540528, total_price = 5731128 WHERE id = 'c9bdcdcd-c4fe-454c-a23f-8d1d76a5a040' AND total_price = 4775940; -- package #14
UPDATE public.solar_packages SET inverter_price = 1482000, solar_panels_price = 2851200, battery_price = 2707200, charge_controller_price = 374400, accessories_price = 475200, setup_fee = 813600, total_price = 8703600 WHERE id = 'bba2d60b-7464-40cc-97b9-448562ae9e15' AND total_price = 7253000; -- package #15
UPDATE public.solar_packages SET inverter_price = 2028000, solar_panels_price = 3801600, battery_price = 5414400, charge_controller_price = 450000, accessories_price = 612000, setup_fee = 1234800, total_price = 13540800 WHERE id = '23c40867-42dc-4ac9-871d-385ae5569db2' AND total_price = 11284000; -- package #16
UPDATE public.solar_packages SET total_price = 30480000 WHERE id = '2aca2488-d763-49db-a428-75e284fe1387' AND total_price = 25400000; -- package #17
UPDATE public.solar_packages SET total_price = 38232000 WHERE id = 'c4112425-44d2-46c5-868e-05dec7e571b4' AND total_price = 31860000; -- package #18
UPDATE public.solar_packages SET total_price = 55920000 WHERE id = 'c7aaee72-c42a-49ac-933f-b92869500a61' AND total_price = 46600000; -- package #19

-- smart_locks (price + label)
UPDATE public.smart_locks SET price = 342000, price_label = '₦342,000' WHERE id = 'a675c7f5-0559-448e-b4e9-d5d36ddcc410' AND price = 285000; -- Elite Series A — Premier-Lux K209
UPDATE public.smart_locks SET price = 360000, price_label = '₦360,000' WHERE id = '4d625a79-4fa0-4740-9e06-4e497a06b925' AND price = 300000; -- Elite Series B — Premier-Lux S7
UPDATE public.smart_locks SET price = 336000, price_label = '₦336,000' WHERE id = 'c1ef6177-ac0d-4e77-a45f-a5e47dae9589' AND price = 280000; -- Apex Series A — E-Pro D20
UPDATE public.smart_locks SET price = 336000, price_label = '₦336,000' WHERE id = '43034c3c-eac9-4515-8167-76cb9c1d7466' AND price = 280000; -- Apex Series B — H11
UPDATE public.smart_locks SET price = 420000, price_label = '₦420,000' WHERE id = 'c7404393-c2a3-4eab-8766-90a475b62777' AND price = 350000; -- Apex Series — Apex-Lux F27 Wi-Fi
UPDATE public.smart_locks SET price = 540000, price_label = '₦540,000' WHERE id = '8cc60a5d-6219-4b81-a8b2-0b874bad0718' AND price = 450000; -- Apex Custom Israeli — T8
UPDATE public.smart_locks SET price = 264000, price_label = '₦264,000' WHERE id = '007222e3-d1eb-42b9-bef5-a29a16d81abc' AND price = 220000; -- Pro Series A — Wi-Fi SL02
UPDATE public.smart_locks SET price = 264000, price_label = '₦264,000' WHERE id = 'c6d3515b-9ece-4b9c-bcef-5737883d771c' AND price = 220000; -- Pro Series B — BLE TFS
UPDATE public.smart_locks SET price = 216000, price_label = '₦216,000' WHERE id = '84aaf55d-1a79-4d1c-96fa-6b8a492d8515' AND price = 180000; -- Pro Series D — Standard-Pro N14 BLE
UPDATE public.smart_locks SET price = 216000, price_label = '₦216,000' WHERE id = '5cbc875e-e05f-4d0e-94a8-2c2bfcdac8c3' AND price = 180000; -- Pro Series — N22
UPDATE public.smart_locks SET price = 192000, price_label = '₦192,000' WHERE id = '4815d720-b419-4d3c-a20f-65e9dc91deb0' AND price = 160000; -- Pro Series — X04
UPDATE public.smart_locks SET price = 216000, price_label = '₦216,000' WHERE id = '4bb6ad7e-1211-4636-a9f3-28739b35c8cb' AND price = 180000; -- Basic-Pro — B16
UPDATE public.smart_locks SET price = 237600, price_label = '₦237,600' WHERE id = 'a3638bdd-7d2c-4068-b686-1e4ef2805429' AND price = 198000; -- Base Series — G290 (Glass Doors)
UPDATE public.smart_locks SET price = 259200, price_label = '₦259,200' WHERE id = 'fabb953b-47ac-470b-8606-dfc865701214' AND price = 216000; -- Base Series — V80 (Conventional Doors & Gates)
UPDATE public.smart_locks SET price = 96000, price_label = '₦96,000' WHERE id = '9d7d8a1c-3436-4d7b-8919-0e86f1be0671' AND price = 80000; -- Smart Padlock — D20 KT14
UPDATE public.smart_locks SET price = 54000, price_label = '₦54,000' WHERE id = '91c614ec-ed64-4ffe-8a9c-d3399d2d5627' AND price = 45000; -- Replacement Lithium Battery
UPDATE public.smart_locks SET price = 36000, price_label = '₦36,000' WHERE id = 'e2e55423-7197-450e-ad0e-29a4aa5f69f5' AND price = 30000; -- Wireless Remote
UPDATE public.smart_locks SET price = 50400, price_label = '₦50,400' WHERE id = 'f0ed1a4f-b7a6-4d62-b32e-a96bbe67ce0d' AND price = 42000; -- Wi-Fi Gateway
UPDATE public.smart_locks SET price = 8400, price_label = '₦8,400' WHERE id = '23c81576-f60a-40ae-8c6e-e9761c822445' AND price = 7000; -- RFID Access Card

-- home_automation_packages (price + 'From ₦X.XM' label)
UPDATE public.home_automation_packages SET price = 5880000, price_label = 'From ₦5.88M' WHERE id = '952bfde3-04a9-4875-89fe-759a83a82d69' AND price = 4900000; -- Apex
UPDATE public.home_automation_packages SET price = 13080000, price_label = 'From ₦13.08M' WHERE id = '19ad5e30-7747-4a24-8a14-d25c34fe0f76' AND price = 10900000; -- Aura
UPDATE public.home_automation_packages SET price = 22680000, price_label = 'From ₦22.68M' WHERE id = '3c41ffa2-26c5-40a9-90fb-0f0ed06e2c00' AND price = 18900000; -- Riviera

-- cctv_packages
UPDATE public.cctv_packages SET price = 576000 WHERE id = 'a1b2c3d4-0001-0001-0001-000000000001' AND price = 480000; -- 4-Channel Smart AI CCTV Kit
UPDATE public.cctv_packages SET price = 1104000 WHERE id = 'a1b2c3d4-0002-0002-0002-000000000002' AND price = 920000; -- 8-Channel Perimeter Surveillance System
UPDATE public.cctv_packages SET price = 198000 WHERE id = 'a1b2c3d4-0003-0003-0003-000000000003' AND price = 165000; -- 4G Solar Standalone Dual-Lens PTZ Camera

COMMIT;
