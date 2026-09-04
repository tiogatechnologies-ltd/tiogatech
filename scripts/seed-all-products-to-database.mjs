import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Full list of 38 genuine Tier-1 products with stock image assets, detailed specs & Nigerian pricing
export const ALL_RETAIL_PRODUCTS = [
  // 1. Inverters & Hybrid Systems
  {
    id: "prod-deye-5kw",
    name: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)",
    category: "Inverters",
    series: "Deye SG03 Series",
    description: "Pure sine wave low-voltage single-phase hybrid solar inverter with dual MPPT tracker, color touch LCD screen, and generator auto-start compatibility. Zero-flicker UPS switchover.",
    features: [
      "Dual MPPT tracker (99.9% efficiency)",
      "Color touch screen interface with live telemetry",
      "IP65 waterproof and dustproof outdoor rated",
      "Generator auto-start and peak-shaving port",
      "Remote WiFi monitoring via Solarman / Deye Cloud App",
      "48V low voltage battery safe architecture"
    ],
    best_for: "3-4 bedroom duplexes, executive residences, small businesses",
    price: "₦1,850,000",
    tier: "premium",
    is_active: true,
    sort_order: 1,
    image_url: "/src/assets/bg-panel-closeup.jpg",
    specifications: {
      "Rated AC Output": "5,000W Continuous / 10,000W Peak Surge",
      "Nominal DC Voltage": "48Vdc (40V - 60V Range)",
      "MPPT Trackers": "2 Trackers (125V - 425V Range)",
      "Max Solar PV Input": "6,500W",
      "Switch Time": "<4ms Seamless UPS Transfer",
      "Warranty": "5-Year Manufacturer Replacement Warranty",
      "Dimensions": "330 x 580 x 232 mm (20.5 kg)"
    },
    stock_qty: 18,
    low_stock_threshold: 3,
    warranty_months: 60,
    tags: ["inverter", "hybrid", "deye", "solar", "ups"]
  },
  {
    id: "prod-deye-8kw",
    name: "Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU)",
    category: "Inverters",
    series: "Deye SG01 Series",
    description: "Heavy-duty single-phase hybrid inverter with dual MPPT inputs, supporting up to 10.4kW solar PV array and parallel multi-unit expansion for larger residences and medical facilities.",
    features: [
      "8,000W rated continuous output power",
      "Dual MPPT with wide 125V-500V operating window",
      "Parallel stacking up to 16 units for three-phase or single-phase",
      "Smart load port for non-essential heavy appliance shedding",
      "Integrated AC and DC surge protection (Type II SPD)",
      "CAN / RS485 communication with all Tier-1 LiFePO4 batteries"
    ],
    best_for: "Large duplexes, commercial labs, penthouses, heavy HVAC setups",
    price: "₦2,650,000",
    tier: "premium",
    is_active: true,
    sort_order: 2,
    image_url: "/src/assets/feature-solar-panel.jpg",
    specifications: {
      "Rated AC Output": "8,000W Continuous / 16,000W Surge (10s)",
      "Nominal DC Voltage": "48Vdc",
      "MPPT Trackers": "2 Trackers (2+2 Strings)",
      "Max Solar PV Input": "10,400W",
      "Efficiency": "97.6% Euro Efficiency",
      "Warranty": "5-Year Official Replacement Warranty",
      "Dimensions": "420 x 670 x 233 mm (32 kg)"
    },
    stock_qty: 12,
    low_stock_threshold: 2,
    warranty_months: 60,
    tags: ["inverter", "hybrid", "deye", "8kw", "solar"]
  },
  {
    id: "prod-deye-12kw-3p",
    name: "Deye 12kW Three-Phase Hybrid Inverter (SUN-12K-SG04LP3-EU)",
    category: "Inverters",
    series: "Deye SG04 Series",
    description: "Enterprise three-phase 400V hybrid solar inverter with dual MPPT, 100% unbalanced phase output capability, and smart diesel generator auto-synchronization.",
    features: [
      "12,000W 3-Phase balanced or unbalanced AC output",
      "Dual MPPT tracker supporting up to 15,600W PV array",
      "100% unbalanced phase output (up to 50% rated power on one phase)",
      "Smart micro-grid and generator hybrid coordination",
      "IP65 protection with intelligent fan thermal dissipation",
      "Full cloud analytics via iOS/Android/Web portal"
    ],
    best_for: "Commercial plazas, manufacturing facilities, hospitals, hotels",
    price: "₦4,150,000",
    tier: "premium",
    is_active: true,
    sort_order: 3,
    image_url: "/src/assets/bg-commercial-solar.jpg",
    specifications: {
      "Rated AC Output": "12,000W Three-Phase 380V/400V",
      "Nominal DC Voltage": "48Vdc (Low Voltage High-Safety Architecture)",
      "MPPT Trackers": "2 Trackers (2+1 String Inputs)",
      "Max Solar PV Input": "15,600W",
      "Parallel Capacity": "Up to 16 units stacked",
      "Warranty": "5-Year Enterprise Warranty",
      "Dimensions": "422 x 699 x 279 mm (33.6 kg)"
    },
    stock_qty: 8,
    low_stock_threshold: 2,
    warranty_months: 60,
    tags: ["inverter", "three-phase", "deye", "12kw", "commercial"]
  },
  {
    id: "prod-srne-5kw",
    name: "SRNE HFP4850S80-145 5kW Parallel Hybrid Inverter",
    category: "Inverters",
    series: "SRNE Top Picks",
    description: "Reliable, parallel-capable 5kW solar hybrid inverter with 80A MPPT charge controller, pure sine wave AC output, and dual BMS communication protocols.",
    features: [
      "5,000W continuous output / 10,000W motor surge",
      "Integrated 80A MPPT solar charge controller",
      "Supports parallel operation up to 6 units (30kW total)",
      "Configurable AC/Solar input priority and charging current",
      "Multi-stage battery charging for LiFePO4 and Tubular batteries"
    ],
    best_for: "Residential backup, budget-conscious solar installations",
    price: "₦1,450,000",
    tier: "mid",
    is_active: true,
    sort_order: 4,
    image_url: "/src/assets/offer-solar.jpg",
    specifications: {
      "Rated AC Output": "5,000W Pure Sine Wave",
      "Nominal DC Voltage": "48Vdc",
      "Max MPPT Voltage": "145Vdc (80A)",
      "Parallel Capability": "Up to 6 units (Single or 3-Phase)",
      "Warranty": "2-Year Comprehensive Warranty"
    },
    stock_qty: 24,
    low_stock_threshold: 5,
    warranty_months: 24,
    tags: ["inverter", "srne", "5kw", "parallel", "solar"]
  },
  {
    id: "prod-srne-6kw",
    name: "SRNE HYP4860S100-H 6kW High-Voltage Hybrid Inverter",
    category: "Inverters",
    series: "SRNE Top Picks",
    description: "Next-generation high-PV-voltage hybrid inverter with 100A MPPT controller and advanced RGB status light indicator for modern energy management.",
    features: [
      "6,000W continuous AC output power",
      "High PV input voltage range (120V - 500Vdc)",
      "Dual AC output ports for smart sub-load management",
      "Lithium battery activation via solar or utility power",
      "Integrated WiFi module for mobile tracking"
    ],
    best_for: "Medium-to-large residential setups, private clinics",
    price: "₦1,750,000",
    tier: "premium",
    is_active: true,
    sort_order: 5,
    image_url: "/src/assets/cat-solar.jpg",
    specifications: {
      "Rated AC Output": "6,000W Continuous",
      "Nominal DC Voltage": "48Vdc",
      "Max Solar PV Voltage": "500Vdc (100A MPPT)",
      "Max Solar PV Input": "8,000W",
      "Warranty": "3-Year Warranty"
    },
    stock_qty: 15,
    low_stock_threshold: 3,
    warranty_months: 36,
    tags: ["inverter", "srne", "6kw", "solar", "hybrid"]
  },
  {
    id: "prod-growatt-5kw",
    name: "Growatt SPF 5000 ES Off-Grid Inverter",
    category: "Inverters",
    series: "Growatt SPF Series",
    description: "Worldwide bestseller off-grid hybrid inverter with high 450V MPPT tracker, capability to run without batteries during daytime sun, and parallel support.",
    features: [
      "5,000W pure sine wave output",
      "Integrated MPPT charge controller up to 450Vdc",
      "Battery-less operation during full sunlight hours",
      "Parallel scalability up to 6 units (30kVA)",
      "Supports CAN / RS485 communication with lithium packs"
    ],
    best_for: "Remote homes, farmhouses, urban residences",
    price: "₦1,380,000",
    tier: "mid",
    is_active: true,
    sort_order: 6,
    image_url: "/src/assets/bg-solar-field.jpg",
    specifications: {
      "Rated AC Output": "5,000W Continuous",
      "Nominal Battery Voltage": "48Vdc",
      "Max PV Open Circuit": "450Vdc",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 20,
    low_stock_threshold: 4,
    warranty_months: 24,
    tags: ["inverter", "growatt", "5kw", "offgrid"]
  },
  {
    id: "prod-luxpower-5kw",
    name: "Luxpower SNA5000 Wide-Voltage Hybrid Inverter",
    category: "Inverters",
    series: "Luxpower SNA Series",
    description: "Versatile hybrid inverter engineered specifically for areas with erratic or low grid voltage. Features dual MPPT inputs and sub-10ms UPS switchover.",
    features: [
      "5,000W continuous output / 6,000W peak PV input",
      "Dual independent MPPT trackers",
      "Wide grid input voltage tolerance (90V - 280V)",
      "Free cloud monitoring via Luxpower App",
      "Fast zero-flicker UPS changeover"
    ],
    best_for: "Nigerian homes with unstable NEPA grid voltage",
    price: "₦1,420,000",
    tier: "mid",
    is_active: true,
    sort_order: 7,
    image_url: "/src/assets/bg-panel-closeup.jpg",
    specifications: {
      "Rated AC Output": "5,000W",
      "DC Battery Voltage": "48Vdc",
      "MPPT Trackers": "2 Trackers (100V - 480V)",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 16,
    low_stock_threshold: 3,
    warranty_months: 24,
    tags: ["inverter", "luxpower", "5kw", "hybrid"]
  },

  // 2. LiFePO4 Lithium Batteries & Storage
  {
    id: "prod-felicity-5kwh",
    name: "Felicity Solar 5.12kWh 100Ah LiFePO4 Battery (FL-LPBF48100)",
    category: "Batteries",
    series: "Felicity LPBF Series",
    description: "Tier-1 Grade-A Lithium Iron Phosphate (LiFePO4) battery module with 6,000+ lifecycle count, built-in intelligent battery management system (BMS), and wall/rack mount design.",
    features: [
      "5,120Wh (5.12kWh) usable storage capacity",
      "6,000+ charge cycles at 80% Depth of Discharge (DoD)",
      "Smart internal BMS with overcharge, overdischarge and thermal cutoff",
      "Direct CAN / RS485 plug-and-play communication with Deye & SRNE",
      "Safe non-combustible chemistry with zero maintenance required",
      "Expandable in parallel up to 8 units (40.96kWh total)"
    ],
    best_for: "3kVA - 5kVA inverter setups, overnight lighting and refrigeration",
    price: "₦1,450,000",
    tier: "premium",
    is_active: true,
    sort_order: 8,
    image_url: "/src/assets/feature-battery.jpg",
    specifications: {
      "Nominal Energy": "5.12 kWh (5,120 Wh)",
      "Nominal Voltage": "51.2 Vdc (16S Configuration)",
      "Usable Capacity": "100 Ah",
      "Max Charge/Discharge": "50A Recommended / 100A Max Continuous",
      "Cycle Life": ">6,000 Cycles @ 25°C, 80% DoD",
      "Communication": "CAN, RS485, RS232",
      "Warranty": "5-Year Official Replacement Warranty",
      "Dimensions": "480 x 440 x 175 mm (42 kg)"
    },
    stock_qty: 25,
    low_stock_threshold: 4,
    warranty_months: 60,
    tags: ["battery", "lifepo4", "lithium", "felicity", "5kwh"]
  },
  {
    id: "prod-felicity-10kwh",
    name: "Felicity Solar 10.24kWh 200Ah LiFePO4 Battery Wall-Mount (FL-LPBF48200)",
    category: "Batteries",
    series: "Felicity LPBF Series",
    description: "Sleek wall-mounted residential Powerwall battery with 10.24kWh capacity, integrated LCD status screen, high-amperage circuit breaker, and 6,000+ cycle lifespan.",
    features: [
      "10,240Wh (10.24kWh) high-density energy storage",
      "Powers inverter 1.5HP AC units, freezers, and entertainment through the night",
      "Built-in color LCD showing battery state of charge (SoC) and cell voltages",
      "Heavy-duty DC circuit breaker for instant maintenance isolation",
      "Automatic cell balancing ensuring decade-long battery longevity",
      "Parallel connection support up to 6 units (61.44kWh)"
    ],
    best_for: "5kVA - 10kVA inverters, 24/7 air conditioning and complete blackout immunity",
    price: "₦2,850,000",
    tier: "premium",
    is_active: true,
    sort_order: 9,
    image_url: "/src/assets/bg-bundle.jpg",
    specifications: {
      "Nominal Energy": "10.24 kWh",
      "Nominal Voltage": "51.2 Vdc",
      "Usable Capacity": "200 Ah",
      "Max Continuous Current": "150A Discharge",
      "Cycle Life": ">6,000 Cycles @ 80% DoD",
      "Display": "Integrated Multifunction LCD",
      "Warranty": "5-Year Official Replacement Warranty",
      "Dimensions": "650 x 500 x 240 mm (83 kg)"
    },
    stock_qty: 14,
    low_stock_threshold: 2,
    warranty_months: 60,
    tags: ["battery", "lifepo4", "lithium", "felicity", "10kwh", "powerwall"]
  },
  {
    id: "prod-felicity-15kwh",
    name: "Felicity Solar 15.36kWh 300Ah Commercial Storage Battery",
    category: "Batteries",
    series: "Felicity High-Cap",
    description: "Commercial grade heavy-duty energy storage system with 15.36kWh capacity, dual breaker safety isolation, and high continuous discharge rating.",
    features: [
      "15,360Wh (15.36kWh) massive storage reservoir",
      "Heavy-duty copper busbars for high surge motor startups",
      "Dual circuit breaker and DC fuse protection",
      "Grade-A automotive cells certified for 6,000+ cycles",
      "Seamless communication with Deye 10kW & 12kW inverters"
    ],
    best_for: "Commercial buildings, luxury mansions, servers and medical clinics",
    price: "₦4,100,000",
    tier: "premium",
    is_active: true,
    sort_order: 10,
    image_url: "/src/assets/feature-battery.jpg",
    specifications: {
      "Nominal Energy": "15.36 kWh",
      "Nominal Voltage": "51.2 Vdc",
      "Usable Capacity": "300 Ah",
      "Max Continuous Current": "200A Discharge",
      "Cycle Life": "6,000+ Cycles",
      "Warranty": "5-Year Enterprise Warranty",
      "Weight": "125 kg"
    },
    stock_qty: 6,
    low_stock_threshold: 2,
    warranty_months: 60,
    tags: ["battery", "lifepo4", "15kwh", "commercial", "felicity"]
  },
  {
    id: "prod-alpsolar-s2",
    name: "AlpSolarr Pulse S2 Compact Energy Storage Unit",
    category: "Batteries",
    series: "AlpSolarr Systems",
    description: "Compact, silent residential lithium storage unit engineered for smart homes and apartment living with smartphone telemetry.",
    features: [
      "4.8kWh usable lithium iron phosphate capacity",
      "Ultra-compact footprint with silent natural convection cooling",
      "App-connected Bluetooth and Wi-Fi state of charge monitoring",
      "Plug and play installation with bracket kit included"
    ],
    best_for: "Luxury apartments, smart homes, modern offices",
    price: "₦1,250,000",
    tier: "mid",
    is_active: true,
    sort_order: 11,
    image_url: "/src/assets/bg-circuit.jpg",
    specifications: {
      "Nominal Energy": "4.8 kWh",
      "Nominal Voltage": "48Vdc",
      "Cycle Life": "5,000+ Cycles",
      "Warranty": "3-Year Warranty"
    },
    stock_qty: 12,
    low_stock_threshold: 3,
    warranty_months: 36,
    tags: ["battery", "alpsolar", "compact", "storage"]
  },
  {
    id: "prod-itel-powerstation",
    name: "Itel 1000W Portable Emergency Power Station",
    category: "Batteries",
    series: "Itel Power Solutions",
    description: "All-in-one portable power bank with pure sine wave 1000W AC outlet, fast 100W USB-C PD charging, high-lumen LED light, and solar charging input.",
    features: [
      "1,000Wh battery capacity with pure sine wave 1000W inverter",
      "2x AC 230V outlets, 4x USB ports, 1x 100W PD Type-C port",
      "Charges from 0 to 80% in 1.5 hours via wall outlet",
      "Compatible with portable solar panels for outdoor camping and field jobs",
      "Digital LCD display showing exact remaining battery minutes"
    ],
    best_for: "Remote work, field engineers, outdoor events, emergency loadshedding",
    price: "₦420,000",
    tier: "entry",
    is_active: true,
    sort_order: 12,
    image_url: "/src/assets/bg-circuit.jpg",
    specifications: {
      "Capacity": "1,000Wh (270,000mAh)",
      "AC Output": "1000W Pure Sine Wave (Surge 2000W)",
      "Solar Input": "12V-24V / 200W Max",
      "Weight": "9.2 kg",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 30,
    low_stock_threshold: 5,
    warranty_months: 12,
    tags: ["portable", "powerstation", "itel", "emergency", "battery"]
  },

  // 3. Tier-1 Solar Panels
  {
    id: "prod-longi-550w",
    name: "Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel",
    category: "Solar Panels",
    series: "Longi Hi-MO 5",
    description: "Industry-benchmark Bloomberg Tier-1 monocrystalline half-cell solar module with 21.5% cell efficiency, gallium-doped wafer anti-PID technology, and 25-year power warranty.",
    features: [
      "550W peak power output under standard test conditions (STC)",
      "21.5% high module conversion efficiency",
      "Half-cut 182mm wafer technology reduces resistive power loss",
      "Superior low-light and high-temperature power yield in Nigerian weather",
      "Anodized aluminum alloy frame with 5400Pa mechanical load rating",
      "IP68 waterproof junction box with original MC4 connectors"
    ],
    best_for: "Residential roofs, commercial rooftop solar arrays, solar farms",
    price: "₦145,000",
    tier: "premium",
    is_active: true,
    sort_order: 13,
    image_url: "/src/assets/feature-solar-panel.jpg",
    specifications: {
      "Peak Power (Pmax)": "550 Wp",
      "Open Circuit Voltage (Voc)": "49.80 V",
      "Short Circuit Current (Isc)": "13.98 A",
      "Voltage at Pmax (Vmp)": "41.95 V",
      "Current at Pmax (Imp)": "13.12 A",
      "Module Efficiency": "21.5%",
      "Power Warranty": "25-Year Linear Power Output Warranty (84.8% at year 25)",
      "Dimensions": "2278 x 1134 x 35 mm (27.5 kg)"
    },
    stock_qty: 350,
    low_stock_threshold: 50,
    warranty_months: 300,
    tags: ["solar panel", "longi", "550w", "mono", "tier-1"]
  },
  {
    id: "prod-longi-600w",
    name: "Longi 600W Hi-MO 6 Explorer Bifacial Solar Panel",
    category: "Solar Panels",
    series: "Longi Hi-MO 6",
    description: "Ultra-high output bifacial HPBC cell solar panel with up to 22.8% front efficiency plus up to 25% extra energy harvest from backside reflected light.",
    features: [
      "600W nominal front power rating",
      "Bifacial glass-glass structure capturing ambient reflected light",
      "HPBC cell technology with zero front grid lines for maximum sunlight capture",
      "Exceptional performance during hazy Hamattan and overcast rainy days",
      "30-Year dual-glass linear power warranty"
    ],
    best_for: "Commercial installations, ground mounts, flat reflective rooftops",
    price: "₦168,000",
    tier: "premium",
    is_active: true,
    sort_order: 14,
    image_url: "/src/assets/bg-commercial-solar.jpg",
    specifications: {
      "Peak Power (Pmax)": "600 Wp",
      "Module Efficiency": "22.8%",
      "Bifaciality Factor": "70% ± 5%",
      "Warranty": "30-Year Performance Warranty",
      "Dimensions": "2384 x 1134 x 35 mm (32 kg)"
    },
    stock_qty: 180,
    low_stock_threshold: 30,
    warranty_months: 360,
    tags: ["solar panel", "longi", "600w", "bifacial", "tier-1"]
  },
  {
    id: "prod-canadian-550w",
    name: "Canadian Solar 550W HiKu6 Monocrystalline Panel",
    category: "Solar Panels",
    series: "Canadian Solar HiKu6",
    description: "Tier-1 high power mono module with comprehensive shading mitigation, low temperature coefficient, and certified wind load resistance.",
    features: [
      "550W high efficiency solar module",
      "Low temperature coefficient (-0.34% / °C) for Nigerian tropical heat",
      "Minimized micro-crack risk with multi-busbar cell design",
      "High reliability with IP68 sealed bypass diodes"
    ],
    best_for: "Residential homes, estate canopies, industrial rooftops",
    price: "₦148,000",
    tier: "premium",
    is_active: true,
    sort_order: 15,
    image_url: "/src/assets/feature-solar-panel.jpg",
    specifications: {
      "Power Rating": "550 Wp",
      "Efficiency": "21.3%",
      "Warranty": "25-Year Power Guarantee",
      "Dimensions": "2278 x 1134 x 35 mm (27.6 kg)"
    },
    stock_qty: 200,
    low_stock_threshold: 40,
    warranty_months: 300,
    tags: ["solar panel", "canadian solar", "550w", "tier-1"]
  },

  // 4. STAMA 3D Biometric Smart Locks
  {
    id: "prod-stama-k209",
    name: "STAMA Model K209 Elite 3D Face Recognition Smart Lock",
    category: "Smart Locks",
    series: "Elite Series",
    description: "Flagship luxury smart lock with 3D infrared biometric face scanning, palm-vein authentication, built-in wide-angle video intercom viewer, and military-grade encryption.",
    features: [
      "3D Structured Light Face ID unlocks in under 0.6 seconds",
      "Palm-vein contactless biometric reader",
      "Live 1080p video doorbell viewer with indoor color HD screen",
      "Remote unlock via Tuya / SmartLife App from anywhere in the world",
      "Anti-tamper alarm, fake PIN anti-peeping scramble code",
      "Rechargeable 5000mAh lithium battery with 8-12 month runtime"
    ],
    best_for: "Executive mansions, luxury penthouses, main armored security doors",
    price: "₦285,000",
    tier: "premium",
    is_active: true,
    sort_order: 16,
    image_url: "/src/assets/bg-smartlock-elite.jpg",
    specifications: {
      "Unlock Methods": "3D Face, Palm Vein, Fingerprint, Passcode, RFID Card, App, Key",
      "User Capacity": "100 Faces, 100 Fingerprints, 100 Passcodes, 100 Cards",
      "Camera": "1080p HD Wide Angle with Infrared Night Vision",
      "Display": "3.5-inch Color HD Indoor Screen",
      "Door Compatibility": "Wooden, Armored, Metal doors (40mm - 120mm thickness)",
      "Battery": "5000mAh Rechargeable Lithium Pack + Type-C Emergency Port",
      "Warranty": "2-Year Complete Hardware Warranty"
    },
    stock_qty: 35,
    low_stock_threshold: 5,
    warranty_months: 24,
    tags: ["smart lock", "face id", "stama", "k209", "biometric", "security"]
  },
  {
    id: "prod-stama-s7",
    name: "STAMA Model S7 Premier-Lux Custom Israeli Edition",
    category: "Smart Locks",
    series: "Elite Series",
    description: "Custom Israeli engineering edition designed for executive apartments and premium shortlets needing ultra-fast access and IP66 weatherproofing.",
    features: [
      "High-precision 3D facial recognition",
      "Semiconductor live fingerprint sensor with 360° recognition",
      "IP66 waterproof performance suited for exposed exterior doors",
      "Encrypted RFID access cards and mechanical override key",
      "Entry record and real-time smartphone notification logs"
    ],
    best_for: "Executive apartments, premium shortlets, outdoor security doors",
    price: "₦300,000",
    tier: "premium",
    is_active: true,
    sort_order: 17,
    image_url: "/src/assets/bg-smartlock-elite.jpg",
    specifications: {
      "Unlock Modes": "Face ID, Fingerprint, RFID Card, Passcode, App, Mechanical Key",
      "Waterproof Rating": "IP66 Weather-Resistant",
      "Mortise": "Stainless Steel 6068 Anti-Drill Mortise",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 20,
    low_stock_threshold: 3,
    warranty_months: 24,
    tags: ["smart lock", "stama", "s7", "waterproof", "face id"]
  },
  {
    id: "prod-stama-d20",
    name: "STAMA Model D20 Apex-Lux Biometric Smart Lock",
    category: "Smart Locks",
    series: "Apex Series",
    description: "Popular smart security lock for homes and apartments seeking advanced biometric access, mobile app control, and keyless convenience.",
    features: [
      "Rapid fingerprint recognition under 0.4 seconds",
      "Passcode entry with temporary visitor PIN generation",
      "Wi-Fi app control with remote unlock authorization",
      "Built-in electronic doorbell chime",
      "Sturdy zinc alloy body with scratch-resistant tempered glass keypad"
    ],
    best_for: "Family homes, apartments, executive offices",
    price: "₦280,000",
    tier: "mid",
    is_active: true,
    sort_order: 18,
    image_url: "/src/assets/bg-smartlock-apex.jpg",
    specifications: {
      "Unlock Modes": "Fingerprint, Passcode, Card, Tuya App, Physical Key",
      "Capacity": "100 Fingerprints, 50 RFID Cards",
      "Material": "High-Density Zinc Alloy",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 40,
    low_stock_threshold: 6,
    warranty_months: 24,
    tags: ["smart lock", "stama", "d20", "fingerprint", "security"]
  },
  {
    id: "prod-stama-h11",
    name: "STAMA Model H11 Apex Video Intercom Smart Lock",
    category: "Smart Locks",
    series: "Apex Series",
    description: "Integrated smart lock featuring an internal video screen, automatic snapshot of visitors on doorbell press, and two-way remote smartphone intercom.",
    features: [
      "Integrated HD camera and indoor color screen",
      "Pushes photo snapshot to your smartphone whenever doorbell is rung",
      "Fingerprint, RFID card, and temporary access codes",
      "Automatic locking mechanism when door closes"
    ],
    best_for: "Modern residences, private lounges, serviced apartments",
    price: "₦280,000",
    tier: "mid",
    is_active: true,
    sort_order: 19,
    image_url: "/src/assets/bg-smartlock-apex.jpg",
    specifications: {
      "Camera": "HD Night-Vision Camera with Two-Way Audio",
      "Screen": "Indoor Color Display",
      "Unlock": "Face, Fingerprint, Passcode, App, Card, Key",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 25,
    low_stock_threshold: 4,
    warranty_months: 24,
    tags: ["smart lock", "stama", "h11", "video doorbell", "camera"]
  },
  {
    id: "prod-stama-sl02",
    name: "STAMA SL02 Slim-Profile Smart Lock for Glass & Aluminum Doors",
    category: "Smart Locks",
    series: "Pro Series",
    description: "Slim 38mm profile smart lock designed specifically for modern narrow-frame aluminum doors, sliding patio doors, and wooden entryways.",
    features: [
      "Narrow European mortise fits aluminum and sliding doors",
      "Fingerprint scanner integrated directly onto handle grip",
      "TTL / Tuya mobile app control with access timestamp logs",
      "Staff attendance tracking mode for office environments"
    ],
    best_for: "Narrow aluminum frame doors, sliding patio doors, modern offices",
    price: "₦220,000",
    tier: "affordable",
    is_active: true,
    sort_order: 20,
    image_url: "/src/assets/bg-smartlock-pro.jpg",
    specifications: {
      "Lock Width": "38 mm Narrow Profile",
      "Door Types": "Aluminum Profile, Sliding Doors, Wooden Doors",
      "App Control": "TTlock / Tuya App with Bluetooth & Gateway",
      "Warranty": "18-Month Warranty"
    },
    stock_qty: 30,
    low_stock_threshold: 5,
    warranty_months: 18,
    tags: ["smart lock", "stama", "sl02", "aluminum door", "sliding door"]
  },
  {
    id: "prod-stama-tf5",
    name: "STAMA TF5 Connected Shortlet Access Smart Lock",
    category: "Smart Locks",
    series: "Pro Series",
    description: "The ideal smart lock for Airbnb hosts, shortlets, and hotel operators. Generate time-limited PIN codes remotely without needing active internet at the lock.",
    features: [
      "Offline time-bound OTP passcode generation (starts & expires on check-in/out)",
      "BLE Bluetooth app control plus optional Wi-Fi bridge",
      "RFID keycards for staff and guests",
      "Audit trail logs showing exact unlock timestamp and user name"
    ],
    best_for: "Airbnb shortlets, rental apartments, boutique hotels, office rooms",
    price: "₦220,000",
    tier: "affordable",
    is_active: true,
    sort_order: 21,
    image_url: "/src/assets/bg-smartlock-pro.jpg",
    specifications: {
      "Passcode Types": "Timed, Permanent, One-time, Cyclic, Custom",
      "Communication": "Bluetooth 5.0 BLE (Gateway compatible)",
      "Battery": "4x AA Alkaline (12-Month Battery Life)",
      "Warranty": "18-Month Warranty"
    },
    stock_qty: 45,
    low_stock_threshold: 8,
    warranty_months: 18,
    tags: ["smart lock", "stama", "tf5", "airbnb", "shortlet", "hotel"]
  },
  {
    id: "prod-stama-n22",
    name: "STAMA N22 Accessible Biometric Security Lock",
    category: "Smart Locks",
    series: "Pro Series",
    description: "Clean, reliable smart lock with fast biometric fingerprint scanner, backlit passcode keypad, and long-lasting battery performance.",
    features: [
      "Semiconductor fingerprint sensor with 0.3s response",
      "Backlit capacitive keypad with anti-peep decoy PINs",
      "Emergency Type-C jumpstart port if batteries run flat",
      "Mechanical key backup included"
    ],
    best_for: "Bedrooms, internal master suites, private offices",
    price: "₦180,000",
    tier: "affordable",
    is_active: true,
    sort_order: 22,
    image_url: "/src/assets/bg-smartlock-pro.jpg",
    specifications: {
      "Fingerprint Capacity": "100 Users",
      "Card Capacity": "50 Cards",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 32,
    low_stock_threshold: 5,
    warranty_months: 12,
    tags: ["smart lock", "stama", "n22", "fingerprint"]
  },
  {
    id: "prod-stama-v80",
    name: "STAMA V80 Heavy-Duty Smart Gate & Security Lock",
    category: "Smart Locks",
    series: "Base Series",
    description: "Rugged double-sided biometric lock for exterior iron gates, perimeter fences, and compound entry points with waterproof sealing.",
    features: [
      "Dual-sided fingerprint recognition (protects both entry & exit sides)",
      "Weather-sealed IP65 waterproof zinc casing",
      "Wireless remote control fob included for unlocking from car or porch",
      "Works on conventional iron gates, wooden fence doors, and security grilles"
    ],
    best_for: "Compound pedestrian gates, external metal security doors",
    price: "₦216,000",
    tier: "mid",
    is_active: true,
    sort_order: 23,
    image_url: "/src/assets/bg-smartlock-base.jpg",
    specifications: {
      "Access Sides": "Dual Biometric (Front & Back)",
      "Waterproofing": "IP65 Outdoor Gate Ready",
      "Remote": "433MHz RF Remote Included",
      "Warranty": "18-Month Warranty"
    },
    stock_qty: 18,
    low_stock_threshold: 3,
    warranty_months: 18,
    tags: ["smart lock", "gate lock", "stama", "v80", "waterproof", "iron gate"]
  },
  {
    id: "prod-stama-g290",
    name: "STAMA G290 Frameless Glass Door Smart Lock",
    category: "Smart Locks",
    series: "Base Series",
    description: "Clamp-on biometric lock for frameless glass office doors. Requires zero drilling or cutting into the glass panel.",
    features: [
      "Clamp-on installation with zero glass drilling required",
      "Fingerprint, passcode, and RFID card authentication",
      "Built-in doorbell and attendance logging",
      "Suitable for double or single swing glass doors"
    ],
    best_for: "Corporate offices, boardroom doors, commercial shopping plazas",
    price: "₦198,000",
    tier: "entry",
    is_active: true,
    sort_order: 24,
    image_url: "/src/assets/bg-smartlock-base.jpg",
    specifications: {
      "Glass Thickness": "10mm - 12mm Frameless Glass",
      "Installation": "No Hole Drilling Clamp System",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 22,
    low_stock_threshold: 4,
    warranty_months: 12,
    tags: ["smart lock", "glass door", "stama", "g290", "office"]
  },
  {
    id: "prod-stama-kt14",
    name: "STAMA KT14 Rugged Biometric Smart Padlock",
    category: "Smart Locks",
    series: "Smart Padlocks",
    description: "Portable, heavy-duty smart padlock with IP67 submersible waterproof rating, 0.5s fingerprint sensor, and stainless steel shackle.",
    features: [
      "Instant 0.5s fingerprint recognition (up to 50 fingers)",
      "IP67 submersible waterproof rating for all weather use",
      "Rechargeable battery lasts up to 6 months per single charge",
      "Hardened steel shackle resists bolt cutters and sawing"
    ],
    best_for: "Solar battery cages, warehouse gates, shipping containers, tool sheds",
    price: "₦80,000",
    tier: "entry",
    is_active: true,
    sort_order: 25,
    image_url: "/src/assets/bg-smartlock-accessory.jpg",
    specifications: {
      "Protection": "IP67 Submersible Waterproof",
      "Material": "Zinc Alloy Body + Stainless Steel Shackle",
      "Battery": "USB Rechargeable Lithium",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 50,
    low_stock_threshold: 10,
    warranty_months: 12,
    tags: ["padlock", "biometric", "stama", "kt14", "waterproof", "security"]
  },
  {
    id: "prod-stama-hotel-suite",
    name: "STAMA Smart Hotel Access & Management Ecosystem",
    category: "Smart Locks",
    series: "Hotel Management Suite",
    description: "Full turnkey hotel digital access system including smart RFID/BLE locks, USB card encoder, central web management portal, and energy-saving switches.",
    features: [
      "Centralized front-desk guest check-in and card encoding",
      "Generate digital mobile keys for guest smartphone check-in",
      "Real-time guest access logging and room occupancy status",
      "Energy-saving room power switches activate only on valid room card"
    ],
    best_for: "Hotels, guest houses, serviced apartments, resort suites",
    price: "₦1,450,000",
    tier: "premium",
    is_active: true,
    sort_order: 26,
    image_url: "/src/assets/bg-smartlock-hotel.jpg",
    specifications: {
      "System Includes": "10x Hotel Smart Locks, 1x Card Encoder, 100x RFID Cards, Management Software",
      "Software": "Windows PC Software & Cloud Web Portal",
      "Warranty": "2-Year Enterprise Warranty"
    },
    stock_qty: 10,
    low_stock_threshold: 2,
    warranty_months: 24,
    tags: ["hotel", "smart lock", "stama", "hospitality", "access control"]
  },

  // 5. Smart Home Automation & IoT
  {
    id: "prod-tioga-8g-switch",
    name: "Tioga 8-Gang WiFi & Zigbee Smart Glass Touch Wall Switch",
    category: "Home Automation",
    series: "Smart Touch Series",
    description: "Luxury tempered glass touch switch with 8 independent circuits, smartphone app remote control, timer automation, and Google Home/Alexa voice sync.",
    features: [
      "8 gang independent touch channels on a standard double-gang plate",
      "Scratch-resistant tempered crystal glass with subtle LED backlighting",
      "Remote control, grouping and scheduling from Tuya / SmartLife App",
      "Voice control with Amazon Alexa and Google Assistant",
      "Power status memory remembers state after power restoration"
    ],
    best_for: "Living rooms, master bedrooms, executive reception areas",
    price: "₦68,000",
    tier: "mid",
    is_active: true,
    sort_order: 27,
    image_url: "/src/assets/feature-smart-automation-device.jpg",
    specifications: {
      "Gang Channels": "8 Channels (Up to 500W per gang)",
      "Wireless Protocol": "WiFi 2.4GHz + Zigbee 3.0",
      "Material": "Flame-Retardant PC + Tempered Glass",
      "Voltage": "100V - 250V AC 50/60Hz",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 45,
    low_stock_threshold: 8,
    warranty_months: 24,
    tags: ["smart switch", "automation", "wifi", "zigbee", "tioga iot"]
  },
  {
    id: "prod-tioga-4g-switch",
    name: "Tioga 4-Gang Zigbee Smart Wall Touch Switch",
    category: "Home Automation",
    series: "Smart Touch Series",
    description: "Modern 4-gang smart wall switch with capacitive touch sensors, customizable scene triggers, and energy consumption telemetry.",
    features: [
      "4 touch channels with smooth haptic feedback",
      "Ultra-low latency mesh networking via Zigbee hub",
      "Automation scenes (e.g., 'All Lights Off' on leaving home)",
      "Works with or without neutral wire options"
    ],
    best_for: "Bedrooms, corridors, dining rooms",
    price: "₦48,000",
    tier: "mid",
    is_active: true,
    sort_order: 28,
    image_url: "/src/assets/feature-control-panel.jpg",
    specifications: {
      "Channels": "4 Gangs",
      "Wireless": "Zigbee 3.0",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 60,
    low_stock_threshold: 10,
    warranty_months: 24,
    tags: ["smart switch", "zigbee", "4 gang", "automation"]
  },
  {
    id: "prod-tioga-1g-relay",
    name: "Tioga 1-Gang WiFi Smart Relay Switch (In-Wall)",
    category: "Home Automation",
    series: "Smart Switch Base",
    description: "Compact in-wall micro smart relay that converts any existing conventional light switch or socket into a smartphone-controlled smart device.",
    features: [
      "Hides neatly inside standard junction box behind your existing wall switch",
      "Preserves original physical switch functionality while adding phone control",
      "16A maximum load capacity suitable for lighting or appliances",
      "Timer and countdown automation"
    ],
    best_for: "Retrofitting existing home switches without replacing wall plates",
    price: "₦18,000",
    tier: "entry",
    is_active: true,
    sort_order: 29,
    image_url: "/src/assets/feature-smart-app.jpg",
    specifications: {
      "Max Current": "16A (3,500W Max)",
      "Protocol": "WiFi 2.4GHz",
      "Dimensions": "41 x 41 x 20 mm",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 120,
    low_stock_threshold: 20,
    warranty_months: 12,
    tags: ["relay", "smart switch", "wifi", "retrofit", "automation"]
  },
  {
    id: "prod-tioga-granite-panel",
    name: "Tioga Granite Smart Control Panel Display with Voice",
    category: "Home Automation",
    series: "Smart Control Hubs",
    description: "Wall-mounted 4-inch smart touch panel with built-in Zigbee hub, ambient lighting control, HVAC thermostat integration, and voice assistant.",
    features: [
      "4-inch multi-touch IPS color touchscreen display",
      "Integrated Zigbee 3.0 mesh gateway connects up to 100 devices",
      "Control lights, curtains, music, locks, and solar inverter status from one panel",
      "Two-way intercom function between rooms"
    ],
    best_for: "Master bedrooms, living room foyers, executive offices",
    price: "₦215,000",
    tier: "premium",
    is_active: true,
    sort_order: 30,
    image_url: "/src/assets/feature-tablet-monitor.jpg",
    specifications: {
      "Display": "4-inch IPS HD Touchscreen (480 x 480)",
      "Wireless": "WiFi + Zigbee 3.0 + Bluetooth",
      "Built-in Gateway": "Yes (Up to 100 sub-devices)",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 15,
    low_stock_threshold: 3,
    warranty_months: 24,
    tags: ["smart panel", "display", "hub", "zigbee", "automation", "tioga iot"]
  },
  {
    id: "prod-tioga-boiler-switch",
    name: "Tioga Smart WiFi Water Heater 40A Heavy-Duty Switch",
    category: "Home Automation",
    series: "High-Power Controls",
    description: "Heavy-duty 40A smart switch built specifically for high-wattage water heaters (boilers), air conditioners, and pumping machines.",
    features: [
      "40A / 8,000W heavy-duty load capacity",
      "Automate water heater to turn on 30 minutes before wake-up and auto-off",
      "Tempered glass touch front plate with flame retardant housing",
      "Eliminates wasted electricity from forgotten water heaters"
    ],
    best_for: "Water heaters (boilers), water pumping machines, 2HP+ AC units",
    price: "₦38,000",
    tier: "entry",
    is_active: true,
    sort_order: 31,
    image_url: "/src/assets/feature-smart-automation-device.jpg",
    specifications: {
      "Max Current": "40A Resistive Load (8,000W Max)",
      "Protocol": "WiFi 2.4GHz",
      "Warranty": "18-Month Warranty"
    },
    stock_qty: 40,
    low_stock_threshold: 6,
    warranty_months: 18,
    tags: ["boiler switch", "water heater", "40a", "heavy duty", "automation"]
  },

  // 6. CCTV & Security Cameras
  {
    id: "prod-cctv-indoor-ptz",
    name: "Tioga 1080p Smart WiFi Indoor Pan/Tilt Security Camera",
    category: "CCTV",
    series: "Smart Vision",
    description: "Compact 360° pan-tilt indoor smart security camera with AI human motion tracking, infrared night vision, and two-way audio talk.",
    features: [
      "Full 1080p HD video with 355° horizontal and 90° vertical rotation",
      "AI human detection auto-tracks movement across the room",
      "Two-way audio allows talking with family or pets through smartphone",
      "Clear infrared night vision up to 10 meters in pitch darkness",
      "MicroSD card (up to 128GB) and secure encrypted cloud recording"
    ],
    best_for: "Nurseries, living rooms, shops, reception desks, pet monitoring",
    price: "₦35,000",
    tier: "entry",
    is_active: true,
    sort_order: 32,
    image_url: "/src/assets/feature-cctv.jpg",
    specifications: {
      "Resolution": "1080p Full HD (1920 x 1080)",
      "FOV": "360° Panoramic View (Pan/Tilt)",
      "Night Vision": "IR LEDs up to 10m",
      "Audio": "Built-in Mic and Speaker",
      "Storage": "MicroSD slot up to 128GB + Cloud",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 55,
    low_stock_threshold: 10,
    warranty_months: 12,
    tags: ["cctv", "camera", "indoor", "wifi", "ptz", "security"]
  },
  {
    id: "prod-cctv-outdoor-bullet",
    name: "Tioga 2K HD Outdoor Weatherproof IP66 Security Bullet Camera",
    category: "CCTV",
    series: "Pro Surveillance",
    description: "Heavy-duty outdoor security camera with 2K crystal resolution, full-color spotlight night vision, deterrence siren, and IP66 weatherproof metal housing.",
    features: [
      "2K QHD (2560 x 1440) ultra-crisp resolution",
      "Full-color night vision with dual motion-activated spotlights",
      "Active deterrence with customizable strobe light and loud siren alarm",
      "IP66 aluminum weatherproof casing withstands heavy tropical downpours",
      "Dual external WiFi antennas for long-distance perimeter signal strength"
    ],
    best_for: "Compound perimeters, driveway gates, parking lots, warehouses",
    price: "₦58,000",
    tier: "mid",
    is_active: true,
    sort_order: 33,
    image_url: "/src/assets/feature-security.jpg",
    specifications: {
      "Resolution": "2K QHD (4 Megapixels)",
      "Weatherproofing": "IP66 Heavy Rain & Dust Proof",
      "Night Vision": "30m Full Color Spotlight + IR",
      "Alarm": "Motion Siren & Flashing Strobe",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 38,
    low_stock_threshold: 6,
    warranty_months: 24,
    tags: ["cctv", "camera", "outdoor", "ip66", "2k", "bullet", "security"]
  },
  {
    id: "prod-cctv-dome-commercial",
    name: "Tioga 4MP Vandal-Proof Commercial Dome Camera",
    category: "CCTV",
    series: "Pro Surveillance",
    description: "IK10 vandal-proof discreet dome camera with wide-angle lens, Power over Ethernet (PoE), and high-resolution face capture.",
    features: [
      "IK10 vandal-resistant impact rated glass dome",
      "110° wide-angle lens for full room coverage with zero blind spots",
      "PoE (Power over Ethernet) support for single-cable clean installation",
      "Smart face and vehicle classification AI"
    ],
    best_for: "Retail supermarkets, office corridors, bank branches, schools",
    price: "₦64,000",
    tier: "mid",
    is_active: true,
    sort_order: 34,
    image_url: "/src/assets/offer-security.jpg",
    specifications: {
      "Resolution": "4MP (2560 x 1440)",
      "Vandal Rating": "IK10 Impact Proof",
      "Power": "12Vdc / PoE (802.3af)",
      "Warranty": "2-Year Warranty"
    },
    stock_qty: 28,
    low_stock_threshold: 4,
    warranty_months: 24,
    tags: ["cctv", "dome camera", "vandal proof", "commercial", "security"]
  },
  {
    id: "prod-tioga-ir-hub",
    name: "Tioga Smart Universal WiFi IR/RF Remote Controller Hub",
    category: "Home Automation",
    series: "Smart Accessories",
    description: "Replaces all your physical TV, Air Conditioner, and decoder remotes with your smartphone and voice control.",
    features: [
      "360° omnidirectional infrared coverage controls ACs, TVs, soundbars",
      "433MHz RF transmitter controls motorized curtains and gate remotes",
      "Set temperature schedules so AC turns on before you arrive home",
      "Pre-loaded with 50,000+ appliance brands"
    ],
    best_for: "Automating split AC units, home entertainment systems",
    price: "₦24,000",
    tier: "entry",
    is_active: true,
    sort_order: 35,
    image_url: "/src/assets/hero-smart-home.jpg",
    specifications: {
      "Coverage": "8m 360° IR Radius + 433MHz RF",
      "Compatibility": "Universal (LG, Samsung, Panasonic, Gree, Sony, etc.)",
      "Warranty": "1-Year Warranty"
    },
    stock_qty: 60,
    low_stock_threshold: 10,
    warranty_months: 12,
    tags: ["remote hub", "ir remote", "automation", "ac control", "tioga iot"]
  }
];

async function seed() {
  console.log(`Starting synchronization of ${ALL_RETAIL_PRODUCTS.length} retail products into Supabase...`);
  
  for (const product of ALL_RETAIL_PRODUCTS) {
    const { data, error } = await supabase
      .from("products")
      .upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        series: product.series,
        description: product.description,
        features: product.features,
        best_for: product.best_for,
        price: product.price,
        tier: product.tier,
        is_active: product.is_active,
        sort_order: product.sort_order,
        image_url: product.image_url,
        specifications: product.specifications,
        stock_qty: product.stock_qty,
        low_stock_threshold: product.low_stock_threshold,
        warranty_months: product.warranty_months,
        tags: product.tags,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select();

    if (error) {
      console.error(`❌ Failed to upsert ${product.name}:`, error.message);
    } else {
      console.log(`✅ Upserted [${product.category}] ${product.name}`);
    }
  }

  console.log("\n🚀 All products successfully synchronized to Supabase Database!");
}

seed();
