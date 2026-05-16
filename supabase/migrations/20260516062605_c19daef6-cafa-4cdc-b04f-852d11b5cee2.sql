-- Rename home automation tiers
UPDATE public.home_automation_packages SET tier = 'Apex', name = 'Apex' WHERE tier = 'Ascentia';
UPDATE public.home_automation_packages SET tier = 'Aura', name = 'Aura' WHERE tier = 'Sprout';
UPDATE public.home_automation_packages SET tier = 'Riviera', name = 'Riviera' WHERE tier = 'Ibiza';

-- Replace smart locks catalog with the correct STAMA lineup from the technical document
DELETE FROM public.smart_locks;

INSERT INTO public.smart_locks (category, series, model, name, tagline, description, price, price_label, features, power_system, ideal_for, badge, sort_order, is_active) VALUES
-- ELITE
('lock','Elite Series','K209','Elite Series A — Premier-Lux K209','Black & Gold · 1-year warranty','Flagship biometric lock with facial, palm-vein, fingerprint and Wi-Fi app control.',285000,'₦285,000',
 ARRAY['Facial Recognition','Palm-Vein Authentication','Fingerprint (up to 100 users)','RFID Card (up to 50)','Secure Passcode + Wi-Fi App','Mechanical Override Key','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Luxury homes · executive apartments · premium shortlets','Flagship',10,true),

('lock','Elite Series','S7','Elite Series B — Premier-Lux S7','Custom Israeli edition · Black & Silver','Premium Israeli-built door variant with full biometric stack and entry logs.',300000,'₦300,000',
 ARRAY['Facial Recognition','Palm-Vein Authentication','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode + Wi-Fi App','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern residence · executive apartments · Israeli-built doors','Israeli Edition',20,true),

-- APEX
('lock','Apex Series','D20','Apex Series A — E-Pro D20','Grey · 1-year warranty','Reliable smart access for homes and apartments with face, fingerprint and remote unlock.',280000,'₦280,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Remote Control','IP66 Waterproof','Anti-Pry Alarm','Video Intercom Viewer'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern homes · apartments · rental units',NULL,30,true),

('lock','Apex Series','H11','Apex Series B — H11','1-year warranty','Smart entry with integrated doorbell and full biometric unlock methods.',280000,'₦280,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm','Video Intercom Viewer','Integrated Doorbell','Entry Record & Access Logs'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern home · private & commercial space · rental apartments',NULL,40,true),

('lock','Apex Series','F27','Apex Series — Apex-Lux F27 Wi-Fi','Grey · 1-year warranty','Wi-Fi enabled biometric lock with video intercom for modern homes and lounges.',350000,'₦350,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App (Wi-Fi)','Mechanical Key','Anti-Pry Alarm','Video Intercom Viewer','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Modern home · private & commercial space · rental apartments','Wi-Fi',50,true),

('lock','Apex Series','T8','Apex Custom Israeli — T8','Black · 1-year warranty','Premium custom-Israeli lock with camera, video intercom and full biometric access.',450000,'₦450,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Anti-Pry Alarm','Camera & Video Intercom','Record Query'],
 '7.4V Rechargeable Lithium · 6–12 months per charge','Premium homes · Israeli-built doors','Top Tier',60,true),

-- PRO
('lock','Pro Series','SL02','Pro Series A — Wi-Fi SL02','Black · 1-year warranty','Wi-Fi enabled smart lock with built-in security camera and staff clock-in.',220000,'₦220,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (Wi-Fi & TTL)','Mechanical Key','Built-in Security Camera','Anti-Pry Alarm','Entry Record & Access Logs','Time Attendance (Clock-in)'],
 'AA Batteries · easy replacement','Homes · offices · hotels',NULL,70,true),

('lock','Pro Series','TFS','Pro Series B — BLE TFS','Black · 1-year warranty','Bluetooth-enabled pro lock for residential and small business doors.',220000,'₦220,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (BLE)','Mechanical Override'],
 'AA Batteries · low maintenance','Residential apartments · private homes · offices · shortlets',NULL,80,true),

('lock','Pro Series','N14','Pro Series D — Standard-Pro N14 BLE','Black · 1-year warranty','Smart control with business intelligence for homes, offices and hospitality.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode + Remote Control','Mobile App (BLE)','Mechanical Key','Optional Remote','Anti-Pry Alarm','Entry Record & Access Logs','Time Attendance (Clock-in)','Record Query'],
 '8 × AA Batteries','Homes · offices · hospitality',NULL,90,true),

('lock','Pro Series','N22','Pro Series — N22','Black · 1-year warranty','Affordable BLE-enabled smart lock with strong daily-use feature set.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode','Mobile App (BLE)','Mechanical Override','Anti-Pry Alarm'],
 '8 × AA Batteries','Residential apartments · offices',NULL,100,true),

('lock','Pro Series','X04','Pro Series — X04','Black · 1-year warranty','Budget-friendly Pro variant with the essentials covered.',160000,'₦160,000',
 ARRAY['Fingerprint (up to 50)','RFID Card (up to 50)','Passcode','Mobile App (BLE)','Mechanical Override'],
 'AA Batteries','Residential · offices · budget-conscious deployments','Best Value',110,true),

('lock','Pro Series','B16','Basic-Pro — B16','Black · 1-year warranty','Reliable pro-grade lock with camera and video intercom on AA batteries.',180000,'₦180,000',
 ARRAY['Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Key','Anti-Pry Alarm','Camera & Video Intercom','Record Query'],
 '4 × AA Batteries','Homes · offices',NULL,120,true),

-- BASE / SPECIALTY
('lock','Base Series','G290','Base Series — G290 (Glass Doors)','1-year warranty','Engineered for modern home & office glass doors with full biometric unlock.',198000,'₦198,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm'],
 '4 × AA Batteries · 6–12 months','Glass doors · modern homes & offices',NULL,130,true),

('lock','Base Series','V80','Base Series — V80 (Conventional Doors & Gates)','1-year warranty','Smart way to secure conventional doors and gates with biometric access.',216000,'₦216,000',
 ARRAY['Facial Recognition','Fingerprint (up to 100)','RFID Card (up to 50)','Passcode','Mobile App','Mechanical Override','Anti-Pry Alarm'],
 '3.7V Rechargeable Lithium · 6–12 months','Conventional doors · gates',NULL,140,true),

('lock','Base Series','KT14','Smart Padlock — D20 KT14','Black · 1-year warranty · IP67','Rugged biometric smart padlock for gates, sheds and outdoor assets.',80000,'₦80,000',
 ARRAY['Fingerprint (up to 50)','Mobile App (BLE)','Mechanical Key','Remote Control','IP67 Waterproof','Anti-Pry Alarm','Time Attendance','Entry Record & Access Logs'],
 '3.7V Built-in Rechargeable Battery','Gates · outdoor assets · staff clock-in',NULL,150,true),

-- ACCESSORIES
('accessory','Accessories','BATTERY','Replacement Lithium Battery','1-year warranty','Genuine STAMA replacement battery for rechargeable lock series.',45000,'₦45,000',
 ARRAY['Plug-and-play replacement','For Elite/Apex/Pro lithium locks'],'','All rechargeable STAMA locks',NULL,200,true),

('accessory','Accessories','REMOTE','Wireless Remote','1-year warranty','Handheld remote for compatible STAMA smart locks.',30000,'₦30,000',
 ARRAY['One-touch unlock','Range up to 30m'],'','Apex/Pro/Base lock owners',NULL,210,true),

('accessory','Accessories','GATEWAY','Wi-Fi Gateway','1-year warranty','Bridges BLE locks to Wi-Fi for remote control and logs.',42000,'₦42,000',
 ARRAY['BLE → Wi-Fi bridge','Remote unlock & monitoring','Multiple locks per gateway'],'','BLE Pro/Base lock owners','Recommended',220,true),

('accessory','Accessories','RFID','RFID Access Card','1-year warranty','Spare RFID access card for staff, family or guest entry.',7000,'₦7,000',
 ARRAY['Compatible with all STAMA locks','Add up to 50 per lock'],'','All STAMA lock owners',NULL,230,true),

-- HOTEL
('hotel','Hotel Ecosystem','HOTEL','STAMA Smart Hotel Ecosystem','Centralized · App + PC dashboard','Intelligent ecosystem for hotels, guest houses, serviced apartments and shortlets. Manage access, security and operations from one dashboard.',NULL,'On request',
 ARRAY['Seamless guest check-in & check-out','RFID cards · passcodes · mobile app · e-Key','Smart locks + Gateway + Router','PC management system','Card encoder + RFID cards','Energy-saving switch integration','Real-time entry logs & analytics'],
 'Per-room rechargeable + central gateway','Hotels · guest houses · serviced apartments · shortlets','Enterprise',300,true);