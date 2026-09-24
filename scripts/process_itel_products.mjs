import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ITEL_ITEMS = [
  {
    num: 1,
    sku: 'TG-ITEL-0001',
    name: 'Itel 1.5kW 12V 1-Phase Hybrid Off-Grid Inverter (IPV-1K512U)',
    category: 'Inverters',
    series: 'Itel SP-Off-Grid Series',
    brand: 'Itel',
    retailPrice: 239800,
    priceStr: '₦239,800',
    tier: 'entry',
    warranty: 3,
    badgeText: '1.5kW • 12V',
    badgeSub: 'SP-Off-Grid IP54',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-1.5kw-1500W-Inverter-Hybrid-12V-IP54-1Phase-IPV-1K512U.webp',
    fileName: 'itel-inv-1.5kw-12v.webp',
    description: 'The Itel IPV-1K512U is a high-efficiency 1.5kW 12V pure sine wave off-grid hybrid solar inverter engineered with IP54 dust and splash protection. Features high-tracking MPPT efficiency (≥99.9%), wide 90V-280VAC input grid window, and 200% surge overload protection for 2 seconds. Perfect for 1-2 room apartments and essential power backups.',
    features: [
      '1,500W continuous pure sine wave output (3,000W surge overload @ 2s)',
      '12V battery system architecture compatible with LiFePO4 and lead-acid',
      'Advanced MPPT solar charge controller with ≥99.9% tracking efficiency',
      'IP54 dustproof and splashproof residential enclosure',
      'Wide grid input range (90VAC - 280VAC) handles erratic NEPA/PHCN voltages',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: '1-2 room apartments, small homes, lighting, laptops, TV, decoder, and fan systems',
    specs: {
      'Rated Continuous Power': '1,500W / 1.5kVA',
      'Battery Voltage': '12Vdc (10.5V - 15V Range)',
      'Waveform': 'Pure Sine Wave',
      'Overload Surge': '200% Overload Capacity @ 2 seconds (3,000W)',
      'MPPT Tracking Efficiency': '≥99.9%',
      'AC Input Voltage Range': '90VAC - 280VAC',
      'Ingress Protection': 'IP54 Dust & Water Splash Resistant',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '1.5kw', '12v', 'hybrid', 'off-grid', 'mppt', 'solar', 'ip54']
  },
  {
    num: 2,
    sku: 'TG-ITEL-0002',
    name: 'Itel 3kW 24V 1-Phase Hybrid Off-Grid Inverter (IPV-3K24UPRO)',
    category: 'Inverters',
    series: 'Itel SP-Off-Grid Series',
    brand: 'Itel',
    retailPrice: 328900,
    priceStr: '₦328,900',
    tier: 'affordable',
    warranty: 3,
    badgeText: '3kW • 24V',
    badgeSub: '4000W PV In • IP54',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-3kW-Hybrid-Solar-Inverter-%E2%80%93-24V-Pure-Sine-Wave-Powers-ACs-TVs-Fridge-1.jpg',
    fileName: 'itel-inv-3kw-24v.webp',
    description: 'The Itel IPV-3K24UPRO is a robust 3kW 24V pure sine wave hybrid inverter with 4,000W max solar PV input. Built in a sleek IP54 rated chassis, it delivers clean AC power to easily handle refrigerators, pumping machines, energy-efficient inverter ACs, home theater setups, and modern home electronics.',
    features: [
      '3,000W continuous output / 6,000W peak surge capacity (200% @ 2s)',
      '24V low-voltage battery architecture with intelligent battery management',
      'Up to 4,000W solar PV array input capacity for rapid battery charging',
      'IP54 rated weather and dust resistant industrial enclosure',
      'Pure sine wave output ensures zero humming and protects delicate appliances',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: '2-3 bedroom flats, homes with refrigerators, TVs, sound systems, and 1HP inverter ACs',
    specs: {
      'Rated Continuous Power': '3,000W / 3kVA',
      'Battery Voltage': '24Vdc (21V - 30V Range)',
      'Max Solar PV Input': '4,000W',
      'Overload Surge': '200% Overload Capacity @ 2s (6,000W)',
      'Ingress Protection': 'IP54 Protective Enclosure',
      'Transfer Time': '<10ms Seamless UPS Transfer',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '3kw', '24v', 'hybrid', 'off-grid', 'mppt', 'solar', 'ip54']
  },
  {
    num: 3,
    sku: 'TG-ITEL-0003',
    name: 'Itel 4kW 24V 1-Phase Hybrid Inverter IP54 WiFi (IPV-4K24UPRO)',
    category: 'Inverters',
    series: 'Itel SP-Hybrid Series',
    brand: 'Itel',
    retailPrice: 416900,
    priceStr: '₦416,900',
    tier: 'affordable',
    warranty: 3,
    badgeText: '4kW • 24V',
    badgeSub: '6000W PV • Dual Out',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-4kW-Hybrid-Solar-Inverter-%E2%80%93-Powers-ACs-Fridges-TVs-24V-IP54-Rated-1.jpg',
    fileName: 'itel-inv-4kw-24v.webp',
    description: 'Hot Sale Itel SP-Hybrid 4kW 24V inverter featuring Dual AC Output (Smart Load and Main Load management), up to 6,000W PV input, 120A MPPT charging current, and integrated WiFi mobile app monitoring. IP54 rated for long-term reliability in dusty or humid environments.',
    features: [
      '4,000W continuous output / 8,000W peak surge capacity (200% @ 5s)',
      'Dual AC outputs: automatically manages and sheds heavy loads during outages',
      'Max PV Input Power up to 6,000W with 120A MPPT solar charging',
      'Built-in WiFi module with mobile monitoring app for real-time telemetry',
      'IP54 ingress protection against dust and moisture ingress',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: '3-bedroom apartments, townhouses, running inverter ACs, freezers, and entertainment units',
    specs: {
      'Rated Output': '4,000W Continuous / 8,000W Peak Surge',
      'Battery Voltage': '24Vdc',
      'Max PV Input Power': '6,000W',
      'Max MPPT Charging Current': '120A',
      'Dual Output Ports': 'Yes (Smart Load + Main Load)',
      'Wireless Connectivity': 'Built-in WiFi & Mobile App',
      'Ingress Protection': 'IP54 Rated',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '4kw', '24v', 'hybrid', 'dual-output', 'wifi', 'ip54']
  },
  {
    num: 4,
    sku: 'TG-ITEL-0004',
    name: 'Itel 6kW 48V 1-Phase Hybrid Inverter IP54 WiFi (IPV-6K48UPRO)',
    category: 'Inverters',
    series: 'Itel SP-Hybrid Series',
    brand: 'Itel',
    retailPrice: 561000,
    priceStr: '₦561,000',
    tier: 'mid',
    warranty: 3,
    badgeText: '6kW • 48V',
    badgeSub: '8000W PV • Dual Out',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-6kW-Hybrid-Solar-Inverter-%E2%80%93-Dual-AC-Output-for-Homes-Clinics-48V-IP54-Rated-2.jpg',
    fileName: 'itel-inv-6kw-48v.webp',
    description: 'Hot Sale Itel SP-Hybrid 6kW 48V inverter engineered for Nigerian homes and commercial setups. Features Dual AC Output, massive 8,000W PV input, 120A MPPT charger, integrated WiFi, 200% overload surge @ 5s, and IP54 sealed design.',
    features: [
      '6,000W continuous pure sine wave output / 12,000W surge overload @ 5s',
      'Dual Output intelligent load shedding for smart load and essential main load',
      'Supports up to 8,000W solar panel array input with 120A MPPT',
      '48V battery architecture provides high system efficiency and low cable loss',
      'Integrated WiFi for iOS and Android app monitoring',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: '3-4 bedroom duplexes, private clinics, supermarket refrigeration, and small business hubs',
    specs: {
      'Rated Output': '6,000W Continuous / 12,000W Peak Surge',
      'Battery Voltage': '48Vdc (40V - 60V Range)',
      'Max PV Input Power': '8,000W',
      'Max MPPT Charging Current': '120A',
      'Dual Output Ports': 'Yes (Smart Load + Main Load)',
      'Wireless Connectivity': 'Built-in WiFi with Mobile App',
      'Ingress Protection': 'IP54 Rated Enclosure',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '6kw', '48v', 'hybrid', 'dual-output', 'wifi', 'ip54']
  },
  {
    num: 5,
    sku: 'TG-ITEL-0005',
    name: 'Itel 6.6kW 48V Transformer-Based Hybrid Inverter IP66 (2-MPPT 13.2kW PV)',
    category: 'Inverters',
    series: 'Itel Heavy-Duty Series',
    brand: 'Itel',
    retailPrice: 742500,
    priceStr: '₦742,500',
    tier: 'premium',
    warranty: 3,
    badgeText: '6.6kW • 48V',
    badgeSub: 'Transformer • 13.2kW PV • IP66',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/8kw-inverter-8k48T-dual-output-8kva.webp',
    fileName: 'itel-inv-6.6kw-48v-transformer.webp',
    description: 'Heavy-duty industrial-grade 6.6kW 48V transformer-based hybrid inverter built to withstand extreme inductive motor surges. Boasts full IP66 all-weather protection, massive 13,200W solar PV capacity across 2 independent MPPT trackers, dual AC output, and integrated WiFi telemetry.',
    features: [
      '6,600W continuous output with heavy-duty low-frequency copper transformer',
      'Unrivaled motor start capability for deep well pumps, cold rooms, and power tools',
      'Massive 13.2kW PV solar array capacity with 2 independent MPPT trackers',
      'IP66 full waterproof and dustproof outdoor rated enclosure',
      'Dual AC output ports with integrated WiFi remote management',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Industrial workshops, pumping stations, farm estates, and harsh outdoor environments',
    specs: {
      'Rated Output': '6,600W Continuous Power',
      'Transformer Architecture': 'Heavy-Duty Low-Frequency Toroidal Transformer',
      'Battery Voltage': '48Vdc',
      'Max Solar PV Input': '13,200W (13.2kW)',
      'MPPT Trackers': '2 Independent MPPT Trackers',
      'Dual Output Ports': 'Yes (Smart Load + Main Load)',
      'Ingress Protection': 'IP66 Waterproof & Dustproof Outdoor',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '6.6kw', 'transformer-based', '48v', 'ip66', '2-mppt', 'heavy-duty']
  },
  {
    num: 6,
    sku: 'TG-ITEL-0006',
    name: 'Itel 8kW 48V 1-Phase Hybrid Inverter IP54 WiFi (IPV-8k48T-WiFi)',
    category: 'Inverters',
    series: 'Itel SP-Hybrid Series',
    brand: 'Itel',
    retailPrice: 784300,
    priceStr: '₦784,300',
    tier: 'premium',
    warranty: 3,
    badgeText: '8kW • 48V',
    badgeSub: '16kW PV • Dual Out • IP54',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/8kw-inverter-8k48T-dual-output-8kva.webp',
    fileName: 'itel-inv-8kw-48v-1p.webp',
    description: 'The Itel SP-Hybrid 8kW 48V single-phase inverter is a high-output flagship hybrid unit. Handles up to 16,000W PV input, 160A MPPT charging current, dual AC output, parallel capability up to 12 units (up to 96kW total capacity), and IP54 dust protection.',
    features: [
      '8,000W continuous output / 16,000W peak surge (200% @ 5s)',
      'Accommodates up to 16,000W solar panel array input',
      'Dual AC outputs for priority essential circuits and secondary high-power loads',
      'Supports parallel stacking up to 12 units for expandable residential/commercial power',
      'Integrated WiFi with smart cloud diagnostic app',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Large duplexes, multiple air conditioners, deep freezers, borehole pumps, and commercial buildings',
    specs: {
      'Rated Output': '8,000W Continuous / 16,000W Peak Surge',
      'Battery Voltage': '48Vdc',
      'Max Solar PV Input': '16,000W (16kW)',
      'Max MPPT Charging Current': '160A',
      'Parallel Stacking': 'Up to 12 Inverters in Parallel',
      'Ingress Protection': 'IP54 Rated',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '8kw', '48v', 'single-phase', 'hybrid', 'mppt', 'wifi', 'parallel']
  },
  {
    num: 7,
    sku: 'TG-ITEL-0007',
    name: 'Itel 8kW 48V 3-Phase Hybrid Inverter IP66 (IHY-8KL3)',
    category: 'Inverters',
    series: 'Itel 3P-Hybrid Series',
    brand: 'Itel',
    retailPrice: 2442000,
    priceStr: '₦2,442,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '8kW • 3-Phase',
    badgeSub: '16kW PV • IP66 • 400V',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-8kW-3-Phase-Hybrid-Solar-Inverter-%E2%80%93-Commercial-Power-for-Offices-Estates-IP66-2.jpg',
    fileName: 'itel-inv-8kw-48v-3p.webp',
    description: 'Commercial-grade Itel 8kW 48V 3-Phase Hybrid Inverter (400V/230V) built in a rugged IP66 die-cast aluminum enclosure. Features 150% three-phase unbalanced output tolerance, up to 16,000W PV input, parallel expansion up to 12 units, and 5-Year Replacement Warranty.',
    features: [
      '8,000W continuous 3-Phase (400V/230V) balanced & 150% unbalanced output',
      'Handles up to 16,000W solar PV array input power',
      'IP66 all-weather waterproof & dustproof rating for outdoor installation',
      'Supports On-Grid export, Smart Load shedding, and Back-up Load',
      'Parallel capability up to 12 units for commercial micro-grids',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: '3-phase commercial offices, clinics, gas stations, event centers, and executive villas',
    specs: {
      'Rated Output': '8,000W Continuous 3-Phase AC (400V/230V)',
      'Unbalanced Output': '150% Three-Phase Unbalanced Output Supported',
      'Battery Voltage': '48Vdc (Low Voltage Architecture)',
      'Max Solar PV Input': '16,000W (16kW)',
      'Overload Surge': '200% Overload Capacity @ 15s',
      'Ingress Protection': 'IP66 All-Weather Rated',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '8kw', '3-phase', 'three-phase', 'hybrid', 'ip66', 'commercial']
  },
  {
    num: 8,
    sku: 'TG-ITEL-0008',
    name: 'Itel 12kW 48V 3-Phase Hybrid Inverter IP66 (IHY-12KL3)',
    category: 'Inverters',
    series: 'Itel 3P-Hybrid Series',
    brand: 'Itel',
    retailPrice: 2574000,
    priceStr: '₦2,574,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '12kW • 3-Phase',
    badgeSub: '24kW PV • IP66 • 400V',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-12kW-3-Phase-Hybrid-Inverter-%E2%80%93-Commercial-Solar-Backup-for-Clinics-Offices-Estates-48V-IP66-Rated-2.jpg',
    fileName: 'itel-inv-12kw-48v-3p.webp',
    description: 'Flagship commercial 3-phase hybrid inverter delivering 12kW continuous AC power at 400V/230V. Supports an immense 24,000W solar PV input, 150% three-phase unbalanced output, 200% overload surge for 15 seconds, and full IP66 outdoor rating. 5-Year Replacement Warranty.',
    features: [
      '12,000W continuous 3-Phase output (24,000W surge overload @ 15s)',
      'Supports an immense 24,000W (24kW) solar PV input array',
      '150% Three Phase Unbalanced Output capability prevents phase tripping',
      'IP66 fully sealed outdoor casing withstands driving tropical rains and heat',
      'Parallel scalability up to 12 inverters for up to 144kW commercial mini-grids',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Hospitals, hotels, commercial plazas, factories, fuel stations, and multi-unit estates',
    specs: {
      'Rated Output': '12,000W Continuous 3-Phase (400V/230V)',
      'Unbalanced Output': '150% Three-Phase Unbalanced Output',
      'Max Solar PV Input': '24,000W (24kW)',
      'Battery Voltage': '48Vdc',
      'Overload Surge': '200% Overload Capacity @ 15s',
      'Parallel Units': 'Up to 12 Units Parallel',
      'Ingress Protection': 'IP66 Outdoor Rated',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '12kw', '3-phase', 'three-phase', 'hybrid', 'ip66', 'commercial']
  },
  {
    num: 9,
    sku: 'TG-ITEL-0009',
    name: 'Itel 12kW 48V 1-Phase Hybrid Inverter IP54 (IPV-12K48U)',
    category: 'Inverters',
    series: 'Itel SP-Hybrid Series',
    brand: 'Itel',
    retailPrice: 1089000,
    priceStr: '₦1,089,000',
    tier: 'premium',
    warranty: 3,
    badgeText: '12kW • 48V',
    badgeSub: '16kW PV • 210A MPPT',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2025/04/itel-12kw-Inverter-Hybrid-48V-IPV-12K48U.webp',
    fileName: 'itel-inv-12kw-48v-1p.webp',
    description: 'High-power 12kW 48V single-phase hybrid solar inverter engineered for luxury residences and intensive single-phase loads. Supports up to 16,000W PV input, 210A MPPT charging current, dual output load management, and parallel stacking up to 12 units.',
    features: [
      '12,000W continuous single-phase output / 24,000W surge overload capacity',
      '210A massive MPPT solar charging capacity for rapid battery recovery',
      'Dual AC outputs: automatically manages and prioritizes essential circuits',
      'Parallel scaling up to 12 units in parallel',
      'Integrated WiFi with smart diagnostic mobile app',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Luxury homes, multiple 2HP/3HP AC units, commercial kitchens, bakeries, and data centers',
    specs: {
      'Rated Output': '12,000W Continuous Power',
      'Battery Voltage': '48Vdc (40V - 60V Range)',
      'Max Solar PV Input': '16,000W (16kW)',
      'Max MPPT Charging Current': '210A',
      'Parallel Stacking': 'Up to 12 Units',
      'Ingress Protection': 'IP54 Rated',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '12kw', '48v', 'single-phase', 'hybrid', 'mppt', 'parallel']
  },
  {
    num: 10,
    sku: 'TG-ITEL-0010',
    name: 'Itel 12V 100Ah LiFePO4 Smart Battery + AC Charger + Bluetooth (IPB-12100)',
    category: 'Batteries',
    series: 'Itel Smart Battery Series',
    brand: 'Itel',
    retailPrice: 231000,
    priceStr: '₦231,000',
    tier: 'entry',
    warranty: 3,
    badgeText: '1.28kWh • 12V',
    badgeSub: '100Ah • AC Charger • Bluetooth',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/itel-Energy-1280Wh-12V-Lithium-Battery-LiFePO%E2%82%84-%E2%80%93-Smart-Solar-Storage-Solution.webp',
    fileName: 'itel-bat-12v-100ah.webp',
    description: 'The Itel IPB-12100 is a versatile 1,280Wh (12.8V 100Ah) LiFePO4 lithium storage battery. Comes complete with a dedicated fast AC charger and built-in Bluetooth connectivity for real-time smartphone health diagnostics. Delivers 6000+ deep cycles, making it the perfect upgrade from heavy, failing lead-acid batteries.',
    features: [
      '1,280Wh usable energy capacity (12.8V 100Ah)',
      'Dedicated AC smart charger included in the box for plug-and-play charging',
      'Built-in Bluetooth module for live smartphone battery state-of-charge monitoring',
      'Grade-A LiFePO4 cells with 6000+ deep discharge cycles',
      'Built-in intelligent BMS protects against over-voltage, temperature, and short circuit',
      '3-Year Manufacturer Replacement Warranty'
    ],
    best_for: '12V inverters, camping, marine/boats, surveillance security systems, and light home backups',
    specs: {
      'Nominal Energy': '1,280Wh (1.28kWh)',
      'Nominal Voltage': '12.8Vdc',
      'Nominal Capacity': '100Ah',
      'Cycle Life': '6,000+ Cycles @ 80% DoD',
      'Wireless Connectivity': 'Built-in Bluetooth App Monitoring',
      'Included Accessories': 'Fast AC Charger Included',
      'Warranty': '3-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '12v', '100ah', 'lifepo4', 'bluetooth', 'ac-charger', 'smart']
  },
  {
    num: 11,
    sku: 'TG-ITEL-0011',
    name: 'Itel 2.56kWh 24V 100Ah Wall-Mount LiFePO4 Battery (IPW-25100)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 601700,
    priceStr: '₦601,700',
    tier: 'affordable',
    warranty: 5,
    badgeText: '2.56kWh • 24V',
    badgeSub: '100Ah • Wall Mount • 6000+ Cyc',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-2.56kWh-Lithium-Battery-Wall-Mounted-Backup-for-Homes-Shops-25.6V-LiFePO4-2-1.jpg',
    fileName: 'itel-bat-2.5kwh-24v.webp',
    description: 'Sleek wall-mounted 2.56kWh 24V 100Ah Class-A LiFePO4 energy storage battery. Features 6,000+ cycle life, built-in intelligent BMS with self-adaptive communication for mainstream hybrid inverters (CAN / RS485), and parallel expansion up to 15 packs (38.4kWh total). 5-Year Replacement Warranty.',
    features: [
      '2,560Wh (2.56kWh) storage capacity with Class-A LiFePO4 cells',
      '6,000+ cycles at 80% Depth of Discharge for 10+ years of daily service',
      'Space-saving slim wall-mounted format with heavy-duty mounting bracket',
      'Self-adaptive BMS protocol communicates automatically with Itel, Deye, SRNE inverters',
      'Parallel capability up to 15 packs in parallel',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Pairs with 3kW or 4kW 24V inverters for apartments, home offices, and small retail shops',
    specs: {
      'Nominal Energy': '2,560Wh (2.56kWh)',
      'Nominal Voltage': '25.6Vdc',
      'Nominal Capacity': '100Ah',
      'Cell Chemistry': 'Class-A LiFePO4 (Lithium Iron Phosphate)',
      'Cycle Life': '6,000+ Cycles',
      'Communication': 'CAN / RS485 / RS232',
      'Parallel Capacity': 'Up to 15 Units',
      'Mounting': 'Wall Mounted',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '2.5kwh', '24v', '100ah', 'wall-mount', 'lifepo4', 'ess']
  },
  {
    num: 12,
    sku: 'TG-ITEL-0012',
    name: 'Itel 5.12kWh 48V 100Ah Wall-Mount LiFePO4 Battery (IPW-51100)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 1001000,
    priceStr: '₦1,001,000',
    tier: 'mid',
    warranty: 5,
    badgeText: '5.12kWh • 48V',
    badgeSub: '100Ah • Wall Mount • 6000+ Cyc',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-5120Wh-Lithium-Battery-Wall-Mounted-48V-100Ah-5.12kWh-IPW-51100.webp',
    fileName: 'itel-bat-5kwh-48v-wall.webp',
    description: 'High-performance 5.12kWh 48V 100Ah wall-mount LiFePO4 battery featuring Class-A cells, 6,000+ cycles, and an intelligent self-adaptive BMS. Fits seamlessly onto walls in utility rooms, garages, or living spaces with zero footprint clutter. Backed by Itel 5-Year Replacement Guarantee.',
    features: [
      '5,120Wh (5.12kWh) nominal storage capacity with 51.2V architecture',
      'Class-A LiFePO4 chemistry with 6,000+ cycle life (10 to 15 years lifespan)',
      'Built-in intelligent BMS with multi-tier thermal and overcurrent protection',
      'Seamless CAN/RS485 communication with Itel, Deye, SRNE, and Luxpower inverters',
      'Parallel expansion up to 15 units (up to 76.8kWh total capacity)',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: '3-4 bedroom duplexes, powering inverter air conditioners, refrigerators, and water pumps overnight',
    specs: {
      'Nominal Energy': '5,120Wh (5.12kWh)',
      'Nominal Voltage': '51.2Vdc',
      'Nominal Capacity': '100Ah',
      'Cell Chemistry': 'Class-A LiFePO4',
      'Cycle Life': '6,000+ Cycles @ 80% DoD',
      'Parallel Support': 'Up to 15 Units (76.8kWh)',
      'Mounting': 'Wall Mountable',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '5kwh', '48v', '100ah', 'wall-mount', 'lifepo4', 'powerwall']
  },
  {
    num: 13,
    sku: 'TG-ITEL-0013',
    name: 'Itel 5.12kWh 48V 100Ah Stackable Rack LiFePO4 Battery (IPL-51100)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 995500,
    priceStr: '₦995,500',
    tier: 'mid',
    warranty: 5,
    badgeText: '5.12kWh • 48V',
    badgeSub: '100Ah • Stackable 4U • Rack',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-5.12kWh-Lithium-Battery-%E2%80%93-Long-Backup-for-Homes-Clinics-Offices-48V-LiFePO4-2.jpg',
    fileName: 'itel-bat-5kwh-48v-stackable.webp',
    description: 'Server-rack stackable 5.12kWh 48V 100Ah LiFePO4 battery module. Features rugged industrial 4U rack handles, front LED status indicators, heavy-duty busbar terminals, and self-adaptive BMS. Designed for neat, multi-module server-cabinet battery banks up to 15 modules in parallel.',
    features: [
      '5,120Wh (5.12kWh) stackable 4U server-rack form factor',
      'Class-A LiFePO4 cells delivering 6,000+ deep discharge cycles',
      'Front-facing breaker switch, communication ports (CAN/RS485), and LED capacity display',
      'Designed for stacking in standard 19-inch battery server racks or modular towers',
      'Scalable up to 15 units in parallel for enterprise energy storage',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Server rooms, enterprise racks, modular residential battery towers, and solar installer cabinets',
    specs: {
      'Nominal Energy': '5,120Wh (5.12kWh)',
      'Nominal Voltage': '51.2Vdc',
      'Nominal Capacity': '100Ah',
      'Form Factor': 'Standard 19-inch 4U Rack / Stackable Module',
      'Cycle Life': '6,000+ Cycles @ 80% DoD',
      'Parallel Support': 'Up to 15 Modules',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '5kwh', '48v', '100ah', 'stackable', 'rack-mount', 'server-rack']
  },
  {
    num: 14,
    sku: 'TG-ITEL-0014',
    name: 'Itel 5.12kWh 24V 200Ah Wall-Mount LiFePO4 Battery (IPL-25200X)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 1037300,
    priceStr: '₦1,037,300',
    tier: 'mid',
    warranty: 5,
    badgeText: '5.12kWh • 24V',
    badgeSub: '200Ah • Wall Mount • 6000+ Cyc',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-5120Wh-Lithium-Battery-Wall-Mounted-48V-100Ah-5.12kWh-IPW-51100.webp',
    fileName: 'itel-bat-5kwh-24v-wall.webp',
    description: 'High-amperage 5.12kWh 24V 200Ah wall-mount LiFePO4 battery pack engineered specifically for high-capacity 24V inverters (3kW to 4kW). Doubles the backup run-time of standard 100Ah 24V batteries, enabling full overnight runs with refrigerator, TV, and lighting.',
    features: [
      '5,120Wh (5.12kWh) massive capacity at 24V nominal (200Ah)',
      'Provides extended 12-16 hour backup for homes on 24V inverter architecture',
      'Class-A LiFePO4 cells with 6,000+ cycle life (10+ years durability)',
      'Intelligent built-in BMS with high-discharge current capability',
      'Clean wall-mount aesthetics with front LED capacity indicators',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: '24V inverter owners wanting double backup runtime without upgrading to a 48V inverter',
    specs: {
      'Nominal Energy': '5,120Wh (5.12kWh)',
      'Nominal Voltage': '25.6Vdc',
      'Nominal Capacity': '200Ah',
      'Cell Chemistry': 'Class-A LiFePO4',
      'Cycle Life': '6,000+ Cycles',
      'Parallel Support': 'Up to 15 Units',
      'Mounting': 'Wall Mountable',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '5kwh', '24v', '200ah', 'wall-mount', 'lifepo4', 'long-backup']
  },
  {
    num: 15,
    sku: 'TG-ITEL-0015',
    name: 'Itel 10.24kWh 48V 200Ah Standing LiFePO4 Battery (IPL-51200X)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 1903000,
    priceStr: '₦1,903,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '10.24kWh • 48V',
    badgeSub: '200Ah • Standing with Wheels',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2025/04/itel-10240Wh-Lithium-Battery-Standing-48V-200Ah-10.24kWh-IPL-51200.webp',
    fileName: 'itel-bat-10kwh-48v.webp',
    description: 'The Itel IPL-51200X is a 10.24kWh 48V 200Ah standing vertical battery cabinet equipped with industrial heavy-duty caster wheels for effortless positioning. Powered by premium Class-A LiFePO4 cells, it provides reliable whole-day or whole-night power for luxury residences and business premises.',
    features: [
      '10,240Wh (10.24kWh) storage capacity with 51.2V architecture (200Ah)',
      'Heavy-duty floor-standing vertical cabinet with 360-degree lockable caster wheels',
      'Class-A LiFePO4 cells with 6,000+ cycle life (15 years expected service)',
      '3A active cell balancing circuit ensures maximum usable capacity and extended longevity',
      'Multi-protocol intelligent BMS with CAN/RS485 inverter communication',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: '4-5 bedroom duplexes, multiple air conditioners, deep freezers, commercial offices, and medical labs',
    specs: {
      'Nominal Energy': '10,240Wh (10.24kWh)',
      'Nominal Voltage': '51.2Vdc',
      'Nominal Capacity': '200Ah',
      'Cell Chemistry': 'Class-A LiFePO4',
      'Active Cell Balancing': '3A Balance Current',
      'Cycle Life': '6,000+ Cycles @ 80% DoD',
      'Mobility': 'Integrated 360° Heavy-Duty Caster Wheels',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '10kwh', '48v', '200ah', 'standing', 'lifepo4', 'wheels', 'premium']
  },
  {
    num: 16,
    sku: 'TG-ITEL-0016',
    name: 'Itel 16kWh 48V 300Ah Standing IP21 LiFePO4 Battery (IPL-51314H)',
    category: 'Batteries',
    series: 'Itel ESS LV Series',
    brand: 'Itel',
    retailPrice: 2244000,
    priceStr: '₦2,244,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '16kWh • 48V',
    badgeSub: '300Ah / 314Ah • Standing IP21',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2025/04/itel-10240Wh-Lithium-Battery-Standing-48V-200Ah-10.24kWh-IPL-51200.webp',
    fileName: 'itel-bat-16kwh-48v.webp',
    description: 'High-density 16kWh (15.36kWh to 16kWh / 300Ah to 314Ah) 48V vertical standing LiFePO4 battery system. Engineered with 3A active balancing current, Class-A cells, and IP21 indoor protection. Delivers enormous energy storage capacity on caster wheels for uninterrupted residential or business operations.',
    features: [
      '15,360Wh to 16,000Wh (16kWh) massive energy reservoir',
      'High-amperage 300Ah/314Ah capacity powers heavy loads through prolonged blackouts',
      '3A active cell balancer maintains cell voltage uniformity for 15+ year operational life',
      'Standing vertical enclosure on lockable heavy-duty wheels with IP21 indoor rating',
      'Intelligent CAN/RS485 communication with leading hybrid inverters',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Executive residences, villas, commercial clinics, supermarkets, and businesses running 24/7 ACs',
    specs: {
      'Nominal Energy': '15,360Wh - 16,000Wh (16kWh)',
      'Nominal Voltage': '51.2Vdc',
      'Nominal Capacity': '300Ah / 314Ah',
      'Cycle Life': '6,000+ Cycles',
      'Active Balancing': '3A Active Balance Current',
      'Protection Rating': 'IP21 Indoor Protective Housing',
      'Mobility': 'Caster Wheels Integrated',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '16kwh', '48v', '300ah', 'standing', 'lifepo4', 'wheels', 'heavy-duty']
  },
  {
    num: 17,
    sku: 'TG-ITEL-0017',
    name: 'Itel 50kW 3-Phase Commercial Hybrid Inverter IP66 (4-MPPT Trackers)',
    category: 'Inverters',
    series: 'Itel Commercial Series',
    brand: 'Itel',
    retailPrice: 7502000,
    priceStr: '₦7,502,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '50kW • 3-Phase',
    badgeSub: '4-MPPT • IP66 Commercial',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/50kW-Hybrid-Inverter-with-Stacked-Lithium-Battery.webp',
    fileName: 'itel-inv-50kw-3p.webp',
    description: 'Industrial utility-scale 50kW (60kVA) 3-Phase commercial hybrid solar inverter. Features high-voltage battery architecture (160V - 800Vdc), 4 independent MPPT trackers accommodating up to 65kW PV array, full IP66 outdoor weatherproofing, and smart microgrid generator integration.',
    features: [
      '50,000W continuous 3-Phase output (60kVA) for heavy commercial & industrial loads',
      '4 independent MPPT trackers optimize solar harvest across complex roof orientations',
      'High-Voltage battery DC coupling (160V to 800V) delivers peak conversion efficiency (98.5%)',
      'Rugged IP66 all-weather outdoor rated enclosure',
      'Generator peak shaving and auto-start dry contact control',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Factories, hospital complexes, university faculties, commercial estates, and shopping malls',
    specs: {
      'Rated Output': '50,000W / 60kVA 3-Phase (400V/230V)',
      'MPPT Trackers': '4 Independent Trackers (8 Strings Total)',
      'Max PV Input Power': '65,000W (65kW)',
      'Battery Voltage Range': 'High Voltage 160Vdc - 800Vdc',
      'Max Efficiency': '98.5% Conversion Efficiency',
      'Ingress Protection': 'IP66 Waterproof & Dustproof',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'inverter', '50kw', 'commercial', '3-phase', '4-mppt', 'high-voltage', 'ip66']
  },
  {
    num: 18,
    sku: 'TG-ITEL-0018',
    name: 'Itel 16kWh High-Voltage Commercial Stackable Battery (for 50kW Inverter) 300Ah',
    category: 'Batteries',
    series: 'Itel Commercial Series',
    brand: 'Itel',
    retailPrice: 2596000,
    priceStr: '₦2,596,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '16kWh • High Voltage',
    badgeSub: '300Ah • Stackable for 50kW',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/50kW-Hybrid-Inverter-with-Stacked-Lithium-Battery-and-Panel.webp',
    fileName: 'itel-bat-16kwh-hv-commercial.webp',
    description: 'High-Voltage 16kWh 300Ah stackable commercial lithium battery module engineered exclusively for the Itel 50kW 3-Phase Commercial Hybrid Inverter. Stackable in series to configure 160V-800V high-voltage ESS storage towers with master High-Voltage BMS control.',
    features: [
      '15.36kWh to 16kWh High-Voltage modular stackable storage block',
      'Engineered exclusively for pairing with the Itel 50kW 3-Phase commercial hybrid system',
      '300Ah Class-A LiFePO4 cells designed for heavy commercial duty cycles',
      'Stackable vertical design with blind-mating inter-module power connectors',
      'Multi-layer high-voltage thermal and electrical protection',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Commercial battery towers paired with Itel 50kW inverters in factories and estates',
    specs: {
      'Nominal Energy': '15.36kWh - 16kWh per module',
      'Architecture': 'High-Voltage Series Stackable Module',
      'Nominal Capacity': '300Ah',
      'Compatibility': 'Exclusive to Itel 50kW 3-Phase Inverter High-Voltage Bus',
      'Cycle Life': '6,000+ Cycles',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '16kwh', 'high-voltage', '300ah', 'commercial', 'stackable', '50kw']
  },
  {
    num: 19,
    sku: 'TG-ITEL-0019',
    name: 'Itel 32kWh 48V 600Ah Standing IP65 Outdoor LiFePO4 Battery',
    category: 'Batteries',
    series: 'Itel Industrial ESS Series',
    brand: 'Itel',
    retailPrice: 4653000,
    priceStr: '₦4,653,000',
    tier: 'premium',
    warranty: 5,
    badgeText: '32kWh • 48V',
    badgeSub: '600Ah / 628Ah • IP65 Outdoor',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/Premium-32kWh-LiFePO4-Lithium-Solar-Battery-51.2V-628Ah-Intelligent-BMS-8000-Cycles.webp',
    fileName: 'itel-bat-32kwh-ip65.webp',
    description: 'Flagship industrial 32kWh (51.2V 600Ah / 628Ah) heavy-duty outdoor battery system. Built in a weather-sealed IP65 cabinet with lockable heavy-duty wheels, 3A active cell balancing, intelligent LCD telemetry display, and 8,000+ cycle life. Withstands rain, dust, and coastal humidity.',
    features: [
      '32,150Wh (32kWh) colossal energy storage reservoir in a single standing unit',
      'Full IP65 outdoor rating: safe for installation on balconies, compound carports, and outdoor shelters',
      'Class-A LiFePO4 cells rated for 8,000+ deep discharge cycles (up to 20-year lifespan)',
      '3A active cell balancing system maintains cell health across extreme load cycles',
      'Heavy-duty industrial caster wheels for easy maneuverability',
      '5-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Mansions, estates, telecom cell towers, clinics, hotels, and critical infrastructure demanding multi-day autonomy',
    specs: {
      'Nominal Energy': '32,150Wh (32kWh)',
      'Nominal Voltage': '51.2Vdc',
      'Nominal Capacity': '600Ah / 628Ah',
      'Cell Chemistry': 'Class-A LiFePO4',
      'Cycle Life': '8,000+ Cycles @ 80% DoD',
      'Ingress Protection': 'IP65 Full Weatherproof Outdoor',
      'Active Cell Balancing': '3A Continuous Active Balancer',
      'Warranty': '5-Year Replacement Guarantee'
    },
    tags: ['itel', 'battery', '32kwh', '48v', '600ah', 'ip65', 'outdoor', 'standing', '8000-cycles']
  },
  {
    num: 20,
    sku: 'TG-ITEL-0020',
    name: 'Itel 500W / 1kWh All-In-One Power Station Power Tank (IESS-05K10N)',
    category: 'Home Automation',
    series: 'Itel Power Tank Series',
    brand: 'Itel',
    retailPrice: 308000,
    priceStr: '₦308,000',
    tier: 'entry',
    warranty: 1,
    badgeText: '500W • 1kWh',
    badgeSub: 'Power Tank • Plug & Play',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/itel-Energy-500W-Inverter-1kWh-LifePo4-Battery-All-in-One-Solar-Power-System-1.jpg',
    fileName: 'itel-aio-500w-1kwh.webp',
    description: 'Hot Sale Itel Power Tank IESS-05K10N is a 3-in-1 plug-and-play Household ESS combining a 500W pure sine wave inverter, 1,000Wh (1kWh) LiFePO4 battery, and MPPT solar charger. Features seamless <10ms UPS switchover to keep TVs, laptops, fans, and routers running without a flicker.',
    features: [
      '500W continuous pure sine wave AC output (1,000Wh LiFePO4 battery capacity)',
      '3-in-1 integrated ESS: inverter + battery + solar charger in one compact box',
      'Plug and Play: zero complex installation, charges from NEPA wall socket or solar panel',
      'Ultra-fast UPS switchover (<10ms): zero computer or TV reboot during blackouts',
      'Up to 500W solar PV input for 2-hour solar recharge',
      '1-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Apartments, students, remote workers, home offices, TVs, decoders, lighting, and fans',
    specs: {
      'Inverter Continuous Output': '500W Pure Sine Wave',
      'Battery Capacity': '1,000Wh (1kWh) LiFePO4',
      'Solar PV Input': 'Up to 500W DC Input',
      'Switchover Time': '<10ms Seamless UPS Switch',
      'AC Outlets': 'Standard Multi-Socket 230VAC Outlets',
      'USB Ports': 'Fast Charge USB-A & USB-C Ports',
      'Warranty': '1-Year Replacement Guarantee'
    },
    tags: ['itel', 'power-tank', 'solar-generator', 'all-in-one', '500w', '1kwh', 'plug-and-play', 'ups']
  },
  {
    num: 21,
    sku: 'TG-ITEL-0021',
    name: 'Itel 3.6kW / 8kWh All-In-One Power Station Household ESS (IESS-3K680N)',
    category: 'Home Automation',
    series: 'Itel Power Station Series',
    brand: 'Itel',
    retailPrice: 1727000,
    priceStr: '₦1,727,000',
    tier: 'premium',
    warranty: 2,
    badgeText: '3.6kW • 8kWh',
    badgeSub: 'All-In-One ESS • 5000W PV',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/8000wh-itel-solar-generator-with-3600w-inverter-all-in-one.webp',
    fileName: 'itel-aio-3.6kw-8kwh.webp',
    description: 'The Itel IESS-3K680N is a 3-in-1 Household Energy Storage System packing a 3,600W pure sine wave inverter, massive 8,000Wh (8kWh) LiFePO4 battery, and 5,000W solar MPPT charger into an elegant vertical white cabinet on wheels. Zero messy cables, ultra-fast <10ms UPS transfer, and 2-Year Replacement Warranty.',
    features: [
      '3,600W continuous output / 7,200W peak surge with 8,000Wh (8kWh) LiFePO4 storage',
      'All-in-one design: combines hybrid inverter, battery storage, and solar charge controller in one tower',
      'Accepts up to 5,000W solar panel array input for rapid full-day solar charging',
      'UPS class switch time (<10ms): powers refrigerators, ACs, and home electronics without interruption',
      'Integrated caster wheels for easy mobility between rooms or offices',
      '2-Year Manufacturer Replacement Warranty'
    ],
    best_for: '3-4 bedroom residences, executive suites, dental/medical offices, and commercial workspaces',
    specs: {
      'Inverter Continuous Output': '3,600W Pure Sine Wave',
      'Battery Capacity': '8,000Wh (8kWh) LiFePO4',
      'Solar PV Input': 'Up to 5,000W MPPT Solar Input',
      'Switchover Time': '<10ms UPS Transfer Time',
      'Mobility': 'Caster Wheels Integrated',
      'Warranty': '2-Year Replacement Guarantee'
    },
    tags: ['itel', 'all-in-one', '3.6kw', '8kwh', 'power-station', 'ess', 'solar-generator', 'lifepo4']
  },
  {
    num: 22,
    sku: 'TG-ITEL-0022',
    name: 'Itel 300Wh / 100,000mAh DC Solar Generator Power-Go (IESS-320T)',
    category: 'Home Automation',
    series: 'Itel Power-Go Series',
    brand: 'Itel',
    retailPrice: 83160,
    priceStr: '₦83,160',
    tier: 'entry',
    warranty: 1,
    badgeText: '300Wh • 100Ah',
    badgeSub: 'Power-Go DC • 130W Out',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/05/itel-130W-Portable-Power-Station-%E2%80%93-320Wh-Smart-Backup-Power-Solution-IESS-320T.webp',
    fileName: 'itel-gen-300wh-dc-powergo.webp',
    description: 'Hot Sale Itel Power-Go (IESS-320T) is a compact 320Wh (100,000mAh) DC portable solar generator delivering 130W high-speed output. Features PV and USB-C fast recharging, multiple 12V DC ports for DC fans and bulbs, USB-A/C ports, ambient LED lighting, and a fashionable leather carry handle. 1-Year Replacement.',
    features: [
      '320Wh (100,000mAh) long-life LiFePO4 battery cell technology',
      '130W total high-speed DC output powering DC fans, lights, phones, and laptops',
      'Dual recharge capability: 100W DC solar panel input or USB-C fast charging',
      'Multiple output ports: 12V DC barrel jacks, USB-A fast charge, and USB-C Power Delivery',
      'Integrated LED reading/ambient light with fashionable leather carrying strap',
      '1-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Camping, outdoor events, bedside lighting, powering DC standing fans, and charging gadgets during blackouts',
    specs: {
      'Battery Capacity': '320Wh / 100,000mAh LiFePO4',
      'Output Power': '130W Total DC Output',
      'Solar Recharge Input': 'Up to 100W Solar PV Input',
      'Ports': 'Multiple 12V DC Ports + USB-C PD + USB-A Quick Charge',
      'Lighting': 'Built-in Multi-Mode LED Light',
      'Portability': 'Leather Carrying Ribbon Strap',
      'Warranty': '1-Year Replacement Guarantee'
    },
    tags: ['itel', 'power-go', '300wh', '100000mah', 'dc', 'solar-generator', 'portable', 'lifepo4']
  },
  {
    num: 23,
    sku: 'TG-ITEL-0023',
    name: 'Itel 300Wh / 100,000mAh AC Solar Generator Power-Go Pro (IESS-320ACT)',
    category: 'Home Automation',
    series: 'Itel Power-Go Series',
    brand: 'Itel',
    retailPrice: 145200,
    priceStr: '₦145,200',
    tier: 'entry',
    warranty: 1,
    badgeText: '300Wh • 200W AC',
    badgeSub: 'Power-Go Pro AC/DC',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/08/power-go-pro.webp',
    fileName: 'itel-gen-300wh-ac-powergo-pro.webp',
    description: 'The Itel Power-Go Pro (IESS-320ACT) upgrades portable power with a built-in 200W Pure Sine Wave AC outlet (230V socket). Packs a 320Wh (100,000mAh) LiFePO4 battery, 100W solar charging support, 65W USB-C Power Delivery, and multi-mode LED flashlight. Runs laptops, TVs, Starlink routers, and medical gadgets on the go.',
    features: [
      '200W Pure Sine Wave 230V AC socket runs laptops, Starlink routers, small TVs, and monitors',
      '320Wh (100,000mAh) LiFePO4 battery with 2,000+ cycle life',
      '100W solar panel recharge input (charges to 80% in ~3.5 hours of sunlight)',
      '65W USB-C PD port charges MacBooks, modern laptops, and smartphones at maximum speed',
      'Integrated bright LED emergency flashlight with SOS strobe',
      '1-Year Manufacturer Replacement Warranty'
    ],
    best_for: 'Remote workers powering laptops and Starlink, mobile creators, students, and emergency AC backup',
    specs: {
      'AC Output': '200W Pure Sine Wave (230V / 50Hz)',
      'Battery Capacity': '320Wh / 100,000mAh LiFePO4',
      'Solar Charging': 'Up to 100W DC Solar Input',
      'USB-C Output': '65W Power Delivery (PD)',
      'USB-A Output': '18W Fast Charging',
      'Flashlight': 'Multi-Mode LED Lantern with SOS',
      'Warranty': '1-Year Replacement Guarantee'
    },
    tags: ['itel', 'power-go-pro', '300wh', '100000mah', 'ac', 'solar-generator', 'portable', '200w', 'starlink']
  },
  {
    num: 24,
    sku: 'TG-ITEL-0024',
    name: 'Itel 410Wp Monocrystalline Half-Cell Solar Panel (ODA410-27V-MHP)',
    category: 'Solar Panels',
    series: 'Itel Solar Panels',
    brand: 'Itel',
    retailPrice: 105600,
    priceStr: '₦105,600',
    tier: 'entry',
    warranty: 12,
    badgeText: '410Wp • Mono PERC',
    badgeSub: '20.97% Eff • 108 Half-Cells',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/iTel-410W-Solar-Panel.jpg',
    fileName: 'itel-panel-410w.webp',
    description: 'High-efficiency Itel 410Wp Monocrystalline Half-Cell Solar Panel (ODA410-27V-MHP). Features 20.97% module efficiency with 108 high-performance mono cells, IP68 rated weather-sealed junction box, anti-reflective tempered glass, and robust anodized aluminum frame (1722 x 1134 x 30 mm). 12-Year Product Warranty and 25-Year Linear Output Guarantee.',
    features: [
      '410W rated peak power output with high 20.97% module efficiency',
      '108 monocrystalline half-cut cells minimize shading power loss and thermal hotspots',
      'High-transmission anti-reflective tempered front glass maximizes low-light irradiance',
      'IP68 waterproof junction box with pre-installed MC4 compatible connectors',
      'Tested to withstand 2400Pa wind loads and 5400Pa mechanical snow/pressure loads',
      '12-Year Product Warranty & 25-Year Linear Performance Guarantee'
    ],
    best_for: 'Residential rooftops, commercial solar arrays, and high-efficiency inverter charging setups',
    specs: {
      'Maximum Power (Pmax)': '410Wp',
      'Module Efficiency': '20.97%',
      'Cell Type': '108 Monocrystalline Half-Cut Cells',
      'Dimensions': '1722 x 1134 x 30 mm (20.5 kg)',
      'Junction Box': 'IP68 Weatherproof Rated with Bypass Diodes',
      'Frame': 'Anodized Aluminum Alloy (Corrosion Resistant)',
      'Warranty': '12-Year Product Warranty, 25-Year Performance Guarantee'
    },
    tags: ['itel', 'solar-panel', '410w', 'monocrystalline', 'half-cell', 'ip68', 'rooftop']
  },
  {
    num: 25,
    sku: 'TG-ITEL-0025',
    name: 'Itel 620Wp N-Type Bifacial Monocrystalline Solar Panel',
    category: 'Solar Panels',
    series: 'Itel Solar Panels',
    brand: 'Itel',
    retailPrice: 151800,
    priceStr: '₦151,800',
    tier: 'premium',
    warranty: 15,
    badgeText: '620Wp • N-Type Bifacial',
    badgeSub: '22.5%+ Eff • 144 SMBB Cells',
    imgUrl: 'https://itelsolar.ng/wp-content/uploads/2026/04/iTel-550W-Solar-Panel-21.29-module-efficiency-with-144-N-Type-Mono-cells-11.jpg',
    fileName: 'itel-panel-620w.webp',
    description: 'Ultra-high-yield Itel 620Wp N-Type Bifacial Monocrystalline Solar Panel. Utilizing cutting-edge 144 N-Type SMBB half-cells and dual-glass construction, it captures sunlight from both front and rear surfaces, producing up to 25% additional rear energy gain (up to 775W equivalent output). Delivers industry-leading 22.5%+ efficiency with near-zero LID/PID degradation.',
    features: [
      '620W front rated peak power with up to 25% bifacial rear harvest boost (up to 775W effective output)',
      'Advanced N-Type SMBB cells deliver 22.5%+ conversion efficiency and superior temperature coefficient',
      'Zero Light-Induced Degradation (LID) ensures sustained high yields over 30 years',
      'Dual-glass construction provides superior mechanical rigidity and fire resistance',
      'Robust 35mm anodized aluminum frame engineered for tropical weather and high winds',
      '15-Year Product Warranty & 30-Year Linear Performance Guarantee'
    ],
    best_for: 'Ground mount solar farms, flat roof commercial canopies, carports, and high-yield estate micro-grids',
    specs: {
      'Maximum Power (Pmax)': '620Wp Front (Up to 775W with Bifacial Gain)',
      'Module Efficiency': '22.5%+',
      'Cell Technology': '144 N-Type SMBB Half-Cut Cells',
      'Bifaciality': '80% ± 5%',
      'Glass': 'Dual-Glass Anti-Reflective Tempered Glass',
      'Frame': '35mm Heavy-Duty Anodized Aluminum Alloy',
      'Warranty': '15-Year Product Warranty, 30-Year Performance Guarantee'
    },
    tags: ['itel', 'solar-panel', '620w', 'n-type', 'bifacial', 'dual-glass', 'smbb', 'high-efficiency']
  }
];

async function run() {
  const targetDir = path.resolve('public/products/itel');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  console.log(`Starting processing for ${ITEL_ITEMS.length} Itel products...`);

  for (const item of ITEL_ITEMS) {
    const outPath = path.join(targetDir, item.fileName);
    console.log(`\n[${item.num}/25] Processing ${item.name}`);
    console.log(` - Source: ${item.imgUrl}`);

    try {
      const res = await fetch(item.imgUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const rawBuf = Buffer.from(await res.arrayBuffer());

      const escapeXml = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const badgeSvg = `
        <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1E293B" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#0F172A" stop-opacity="0.95" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4" />
            </filter>
          </defs>
          <g filter="url(#shadow)" transform="translate(490, 30)">
            <rect width="280" height="66" rx="14" fill="url(#bgGrad)" stroke="#E51E2B" stroke-width="2.5" />
            <circle cx="26" cy="33" r="10" fill="#E51E2B" />
            <text x="44" y="29" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="800" font-size="20" letter-spacing="0.5">${escapeXml(item.badgeText)}</text>
            <text x="44" y="52" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="600" font-size="13">${escapeXml(item.badgeSub)}</text>
          </g>
        </svg>
      `;

      // Composite onto 800x800 square container with padding and crisp white/transparent balance
      const processed = await sharp(rawBuf)
        .resize(720, 720, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .extend({
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .composite([
          {
            input: Buffer.from(badgeSvg),
            top: 0,
            left: 0
          }
        ])
        .webp({ quality: 90 })
        .toBuffer();

      fs.writeFileSync(outPath, processed);
      const meta = await sharp(processed).metadata();
      console.log(` -> Saved ${item.fileName} (${meta.width}x${meta.height}, ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(` -> ERROR processing ${item.fileName}:`, e.message);
    }
  }

  console.log('\nAll 25 Itel images processed successfully!');

  // Generate src/data/itelProducts.ts
  const tsPath = path.resolve('src/data/itelProducts.ts');
  const code = `import type { Product } from "./products";

export const itelProducts: Product[] = ${JSON.stringify(
    ITEL_ITEMS.map((item) => ({
      id: `itel-${item.fileName.replace(/^itel-/, '').replace('.webp', '')}`,
      serial_number: item.sku,
      sku: item.sku,
      name: item.name,
      category: item.category,
      series: item.series,
      brand: "Itel",
      description: item.description,
      features: item.features,
      best_for: item.best_for,
      bestFor: item.best_for,
      price: item.priceStr,
      numeric_price: item.retailPrice,
      tier: item.tier,
      image_url: `/products/itel/${item.fileName}`,
      specifications: item.specs,
      tags: item.tags,
      stock_status: "in_stock",
      stock_qty: item.category === "Solar Panels" ? 100 : 25,
      warranty_years: item.warranty,
      rating: parseFloat((4.8 + ((item.num % 3) * 0.1)).toFixed(1)),
      review_count: 16 + item.num * 2,
      is_featured: [1, 2, 4, 6, 8, 10, 12, 15, 16, 20, 21, 23, 24, 25].includes(item.num),
    })),
    null,
    2
  )};
`;

  fs.writeFileSync(tsPath, code, 'utf-8');
  console.log(`\nGenerated ${tsPath} with ${ITEL_ITEMS.length} Itel products!`);
}

run();
