export interface Product {
  id: string;
  name: string;
  category: string;
  series?: string;
  description: string;
  features: string[];
  best_for?: string;
  bestFor?: string;
  price?: string;
  numeric_price?: number;
  tier: "premium" | "mid" | "affordable" | "entry";
  image_url?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  stock_qty?: number;
  brand?: string;
  rating?: number;
  review_count?: number;
  stock_status?: "in_stock" | "low_stock" | "preorder";
  is_featured?: boolean;
  warranty_years?: number;
  serial_number?: string;
  sku?: string;
}

export const invertersList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    serial_number: "TG-INV-0001",
    sku: "TG-INV-0001",
    name: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)",
    category: "Inverters",
    series: "Deye SG03 Series",
    brand: "Deye",
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
    bestFor: "3-4 bedroom duplexes, executive residences, small businesses",
    price: "₦1,850,000",
    numeric_price: 1850000,
    tier: "premium",
    image_url: "/products/core/deye-5kw-hybrid.webp",
    specifications: {
      "Rated AC Output": "5,000W Continuous / 10,000W Peak Surge",
      "Nominal DC Voltage": "48Vdc (40V - 60V Range)",
      "MPPT Trackers": "2 Trackers (125V - 425V Range)",
      "Max Solar PV Input": "6,500W",
      "Switch Time": "<4ms Seamless UPS Transfer",
      "Warranty": "5-Year Manufacturer Replacement Warranty",
      "Dimensions": "330 x 580 x 232 mm (20.5 kg)"
    },
    rating: 5.0,
    review_count: 18,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "hybrid", "deye", "solar", "ups"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    serial_number: "TG-INV-0002",
    sku: "TG-INV-0002",
    name: "Deye 8kW Hybrid Inverter (SUN-8K-SG01LP1-EU)",
    category: "Inverters",
    series: "Deye SG01 Series",
    brand: "Deye",
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
    bestFor: "Large duplexes, commercial labs, penthouses, heavy HVAC setups",
    price: "₦2,650,000",
    numeric_price: 2650000,
    tier: "premium",
    image_url: "/products/core/deye-8kw-hybrid.webp",
    specifications: {
      "Rated AC Output": "8,000W Continuous / 16,000W Surge (10s)",
      "Nominal DC Voltage": "48Vdc",
      "MPPT Trackers": "2 Trackers (2+2 Strings)",
      "Max Solar PV Input": "10,400W",
      "Efficiency": "97.6% Euro Efficiency",
      "Warranty": "5-Year Official Replacement Warranty",
      "Dimensions": "420 x 670 x 233 mm (32 kg)"
    },
    rating: 5.0,
    review_count: 14,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "hybrid", "deye", "8kw", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    serial_number: "TG-INV-0003",
    sku: "TG-INV-0003",
    name: "Deye 12kW Three-Phase Hybrid Inverter (SUN-12K-SG04LP3-EU)",
    category: "Inverters",
    series: "Deye SG04 Series",
    brand: "Deye",
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
    bestFor: "Commercial plazas, manufacturing facilities, hospitals, hotels",
    price: "₦4,150,000",
    numeric_price: 4150000,
    tier: "premium",
    image_url: "/products/core/deye-12kw-three-phase.webp",
    specifications: {
      "Rated AC Output": "12,000W Three-Phase 380V/400V",
      "Nominal DC Voltage": "48Vdc (Low Voltage High-Safety Architecture)",
      "MPPT Trackers": "2 Trackers (2+1 String Inputs)",
      "Max Solar PV Input": "15,600W",
      "Parallel Capacity": "Up to 16 units stacked",
      "Warranty": "5-Year Enterprise Warranty",
      "Dimensions": "422 x 699 x 279 mm (33.6 kg)"
    },
    rating: 5.0,
    review_count: 8,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "three-phase", "deye", "12kw", "commercial"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000004",
    serial_number: "TG-INV-0004",
    sku: "TG-INV-0004",
    name: "SRNE HFP4850S80-145 5kW Parallel Hybrid Inverter",
    category: "Inverters",
    series: "SRNE Top Picks",
    brand: "SRNE",
    description: "Reliable, parallel-capable 5kW solar hybrid inverter with 80A MPPT charge controller, pure sine wave AC output, and dual BMS communication protocols.",
    features: [
      "5,000W continuous output / 10,000W motor surge",
      "Integrated 80A MPPT solar charge controller",
      "Supports parallel operation up to 6 units (30kW total)",
      "Configurable AC/Solar input priority and charging current",
      "Multi-stage battery charging for LiFePO4 and Tubular batteries"
    ],
    best_for: "Residential backup, budget-conscious solar installations",
    bestFor: "Residential backup, budget-conscious solar installations",
    price: "₦1,450,000",
    numeric_price: 1450000,
    tier: "mid",
    image_url: "/products/core/srne-5kw-hybrid.webp",
    specifications: {
      "Rated AC Output": "5,000W Pure Sine Wave",
      "Nominal DC Voltage": "48Vdc",
      "Max MPPT Voltage": "145Vdc (80A)",
      "Parallel Capability": "Up to 6 units (Single or 3-Phase)",
      "Warranty": "2-Year Comprehensive Warranty"
    },
    rating: 4.9,
    review_count: 12,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["inverter", "srne", "5kw", "parallel", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000005",
    serial_number: "TG-INV-0005",
    sku: "TG-INV-0005",
    name: "SRNE HYP4860S100-H 6kW High-Voltage Hybrid Inverter",
    category: "Inverters",
    series: "SRNE Top Picks",
    brand: "SRNE",
    description: "Next-generation high-PV-voltage hybrid inverter with 100A MPPT controller and advanced RGB status light indicator for modern energy management.",
    features: [
      "6,000W continuous AC output power",
      "High PV input voltage range (120V - 500Vdc)",
      "Dual AC output ports for smart sub-load management",
      "Lithium battery activation via solar or utility power",
      "Integrated WiFi module for mobile tracking"
    ],
    best_for: "Medium-to-large residential setups, private clinics",
    bestFor: "Medium-to-large residential setups, private clinics",
    price: "₦1,750,000",
    numeric_price: 1750000,
    tier: "premium",
    image_url: "/products/core/srne-6kw-hybrid.webp",
    specifications: {
      "Rated AC Output": "6,000W Continuous",
      "Nominal DC Voltage": "48Vdc",
      "Max Solar PV Voltage": "500Vdc (100A MPPT)",
      "Max Solar PV Input": "8,000W",
      "Warranty": "3-Year Warranty"
    },
    rating: 5.0,
    review_count: 9,
    stock_status: "in_stock",
    warranty_years: 3,
    tags: ["inverter", "srne", "6kw", "solar", "hybrid"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000006",
    serial_number: "TG-INV-0006",
    sku: "TG-INV-0006",
    name: "Growatt SPF 5000 ES Off-Grid Inverter",
    category: "Inverters",
    series: "Growatt SPF Series",
    brand: "Growatt",
    description: "Worldwide bestseller off-grid hybrid inverter with high 450V MPPT tracker, capability to run without batteries during daytime sun, and parallel support.",
    features: [
      "5,000W pure sine wave output",
      "Integrated MPPT charge controller up to 450Vdc",
      "Battery-less operation during full sunlight hours",
      "Parallel scalability up to 6 units (30kVA)",
      "Supports CAN / RS485 communication with lithium packs"
    ],
    best_for: "Remote homes, farmhouses, urban residences",
    bestFor: "Remote homes, farmhouses, urban residences",
    price: "₦1,380,000",
    numeric_price: 1380000,
    tier: "mid",
    image_url: "/products/core/growatt-5kw-spf.webp",
    specifications: {
      "Rated AC Output": "5,000W Continuous",
      "Nominal Battery Voltage": "48Vdc",
      "Max PV Open Circuit": "450Vdc",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.8,
    review_count: 15,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["inverter", "growatt", "5kw", "offgrid"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000007",
    serial_number: "TG-INV-0007",
    sku: "TG-INV-0007",
    name: "Luxpower SNA5000 Wide-Voltage Hybrid Inverter",
    category: "Inverters",
    series: "Luxpower SNA Series",
    brand: "Luxpower",
    description: "Versatile hybrid inverter engineered specifically for areas with erratic or low grid voltage. Features dual MPPT inputs and sub-10ms UPS switchover.",
    features: [
      "5,000W continuous output / 6,000W peak PV input",
      "Dual independent MPPT trackers",
      "Wide grid input voltage tolerance (90V - 280V)",
      "Free cloud monitoring via Luxpower App",
      "Fast zero-flicker UPS changeover"
    ],
    best_for: "Nigerian homes with unstable NEPA grid voltage",
    bestFor: "Nigerian homes with unstable NEPA grid voltage",
    price: "₦1,420,000",
    numeric_price: 1420000,
    tier: "mid",
    image_url: "/products/core/luxpower-5kw-sna.webp",
    specifications: {
      "Rated AC Output": "5,000W",
      "DC Battery Voltage": "48Vdc",
      "MPPT Trackers": "2 Trackers (100V - 480V)",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.9,
    review_count: 11,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["inverter", "luxpower", "5kw", "hybrid"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000080",
    serial_number: "TG-INV-0080",
    sku: "TG-INV-0080",
    name: "SRNE 5kW 48V Pure Sine Wave Solar Inverter (AFP4850S100-H)",
    category: "Inverters",
    series: "SRNE AFP Series",
    brand: "SRNE",
    description: "High-efficiency 5kW 48V solar hybrid inverter with 80A MPPT solar charge controller, 500Vdc wide PV open circuit voltage, and parallel capability for up to 6 units.",
    features: [
      "5kW 48V pure sine wave continuous AC output",
      "80A integrated high-efficiency MPPT charge controller",
      "500Vdc maximum PV open circuit voltage for flexible high-voltage stringing",
      "Parallel stacking up to 6 units for scalable 30kW single or three-phase setups",
      "Seamless UPS switchover under 10ms"
    ],
    best_for: "3-4 bedroom residences, duplexes, executive suites",
    bestFor: "3-4 bedroom residences, duplexes, executive suites",
    price: "₦549,600",
    numeric_price: 549600,
    tier: "mid",
    image_url: "/products/srne/srne-inv-afp-5kw.webp",
    specifications: {
      "Rated AC Output": "5,000W Continuous (48Vdc)",
      "MPPT Charge Current": "80A",
      "Max PV Open Circuit": "500Vdc",
      "Parallel Capability": "Up to 6 units",
      "Warranty": "2-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 22,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["inverter", "srne", "5kw", "mppt", "hybrid", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000081",
    serial_number: "TG-INV-0081",
    sku: "TG-INV-0081",
    name: "SRNE 6kW 48V IP65 Waterproof Hybrid Inverter (AEP4860S135-H)",
    category: "Inverters",
    series: "SRNE AEP Series",
    brand: "SRNE",
    description: "Outdoor-ready IP65 weatherproof 6kW 48V hybrid solar inverter with powerful 135A MPPT charger, 500Vdc PV input, and support for up to 6 units in parallel.",
    features: [
      "6kW 48V continuous power output with heavy surge tolerance",
      "135A ultra-high current MPPT charge controller",
      "IP65 waterproof and dustproof sealed enclosure for outdoor walls",
      "500Vdc max PV open circuit input voltage",
      "Parallel operation up to 6 units (up to 36kW capacity)"
    ],
    best_for: "Luxury homes, outdoor installations, light commercial loads",
    bestFor: "Luxury homes, outdoor installations, light commercial loads",
    price: "₦788,400",
    numeric_price: 788400,
    tier: "premium",
    image_url: "/products/srne/srne-inv-aep-6kw.webp",
    specifications: {
      "Rated AC Output": "6,000W Continuous (48Vdc)",
      "MPPT Charge Current": "135A",
      "Max PV Open Circuit": "500Vdc",
      "Ingress Protection": "IP65 Weatherproof",
      "Parallel Units": "Up to 6 units",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 19,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "srne", "6kw", "ip65", "waterproof", "hybrid"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000082",
    serial_number: "TG-INV-0082",
    sku: "TG-INV-0082",
    name: "SRNE 6kW 48V Grid & Off-Grid Hybrid Inverter (HESP4860S100-H)",
    category: "Inverters",
    series: "SRNE HESP Series",
    brand: "SRNE",
    description: "Grid-tied and off-grid hybrid inverter with dual-mode energy management, 100A MPPT charger, 500Vdc PV open circuit rating, and 5-year official warranty.",
    features: [
      "6kW 48V grid-interactive and pure off-grid bidirectional operation",
      "100A MPPT solar charging with peak shaving & export control",
      "Waterproof outdoor build with intelligent cooling",
      "Parallels up to 6 units for large multi-kilowatt systems",
      "5-Year manufacturer replacement warranty"
    ],
    best_for: "Hybrid solar homes seeking grid-feed and total energy autonomy",
    bestFor: "Hybrid solar homes seeking grid-feed and total energy autonomy",
    price: "₦1,269,600",
    numeric_price: 1269600,
    tier: "premium",
    image_url: "/products/srne/srne-inv-hesp-6kw.webp",
    specifications: {
      "Rated AC Output": "6,000W Grid & Off-Grid",
      "MPPT Charge Current": "100A",
      "Max PV Input": "500Vdc",
      "Protection": "Waterproof / IP65",
      "Warranty": "5-Year Manufacturer Warranty"
    },
    rating: 5.0,
    review_count: 15,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "srne", "6kw", "grid-tied", "hesp", "hybrid"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000083",
    serial_number: "TG-INV-0083",
    sku: "TG-INV-0083",
    name: "SRNE 10kW 48V Grid & Off-Grid Hybrid Inverter (ASP48100S200-H)",
    category: "Inverters",
    series: "SRNE ASP Series",
    brand: "SRNE",
    description: "Heavy-duty 10kW 48V hybrid inverter charger with dual 200A MPPT controllers, 500Vdc max PV voltage, and parallel stacking up to 6 units.",
    features: [
      "10kW 48V continuous AC output power for heavy inductive loads",
      "200A massive MPPT charge current for rapid battery replenish",
      "Handles central air conditioners, deep-well pumps and industrial machinery",
      "Parallel up to 6 units (up to 60kW single/three-phase)",
      "Grid feedback and peak tariff shaving features"
    ],
    best_for: "Commercial offices, luxury villas, supermarkets, clinics",
    bestFor: "Commercial offices, luxury villas, supermarkets, clinics",
    price: "₦1,443,600",
    numeric_price: 1443600,
    tier: "premium",
    image_url: "/products/srne/srne-inv-asp-10kw.webp",
    specifications: {
      "Rated AC Output": "10,000W Continuous (48Vdc)",
      "MPPT Charge Current": "200A",
      "Max PV Voltage": "500Vdc",
      "Parallel Units": "Up to 6 units (60kW)",
      "Warranty": "2-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 18,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["inverter", "srne", "10kw", "asp", "commercial", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000084",
    serial_number: "TG-INV-0084",
    sku: "TG-INV-0084",
    name: "SRNE 12kW 48V Grid & Off-Grid Hybrid Inverter (ASP48120S200-H)",
    category: "Inverters",
    series: "SRNE ASP Series",
    brand: "SRNE",
    description: "Industrial-grade 12kW 48V hybrid inverter charger with 200A MPPT charging capability, 500Vdc open-circuit voltage, and parallel support up to 6 units.",
    features: [
      "12kW pure sine wave continuous output",
      "200A high-capacity solar MPPT charging",
      "Powers multiple 2HP/3HP air conditioners, chillers, and industrial tools",
      "Supports parallel scaling up to 72kW (6 units)",
      "Sub-10ms zero-flicker UPS switchover"
    ],
    best_for: "Large commercial facilities, factories, estate central powerhouses",
    bestFor: "Large commercial facilities, factories, estate central powerhouses",
    price: "₦1,536,000",
    numeric_price: 1536000,
    tier: "premium",
    image_url: "/products/srne/srne-inv-asp-12kw.webp",
    specifications: {
      "Rated AC Output": "12,000W Continuous (48Vdc)",
      "MPPT Charge Current": "200A",
      "Max PV Voltage": "500Vdc",
      "Parallel Operation": "Up to 6 units",
      "Warranty": "2-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 24,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["inverter", "srne", "12kw", "asp", "heavy-duty", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000085",
    serial_number: "TG-INV-0085",
    sku: "TG-INV-0085",
    name: "SRNE 16kW 48V Hybrid Inverter Charger (ASP48160S300-H)",
    category: "Inverters",
    series: "SRNE ASP Series",
    brand: "SRNE",
    description: "Ultra high-power 16kW 48V hybrid inverter with huge 300A MPPT charging, 650Vdc PV input, and parallel scaling up to 6 units for 96kW total capacity.",
    features: [
      "16kW true continuous pure sine wave power",
      "300A monstrous MPPT charge controller",
      "650Vdc wide-range PV open circuit voltage",
      "Parallel up to 6 units for 96kW mega commercial arrays",
      "2-Year official manufacturer warranty"
    ],
    best_for: "Hospitals, manufacturing plants, high-end commercial properties",
    bestFor: "Hospitals, manufacturing plants, high-end commercial properties",
    price: "₦2,738,400",
    numeric_price: 2738400,
    tier: "premium",
    image_url: "/products/srne/srne-inv-asp-16kw.webp",
    specifications: {
      "Rated AC Output": "16,000W Continuous (48Vdc)",
      "MPPT Charge Current": "300A",
      "Max PV Voltage": "650Vdc",
      "Parallel Units": "Up to 6 units (96kW)",
      "Warranty": "2-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 14,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["inverter", "srne", "16kw", "300a", "industrial", "solar"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000086",
    serial_number: "TG-INV-0086",
    sku: "TG-INV-0086",
    name: "SRNE 20kW 48V IP65 Commercial Hybrid Inverter (HESP48200SH3)",
    category: "Inverters",
    series: "SRNE HESP Series",
    brand: "SRNE",
    description: "Flagship 20kW 48V hybrid solar inverter with dual MPPT operating voltage from 160V-800V, 350A MPPT charging, and IP65 outdoor waterproof rating.",
    features: [
      "20,000W continuous output capacity",
      "Dual MPPT trackers with ultra-wide 160V-800V operating window",
      "350A MPPT high-speed charge rate",
      "IP65 waterproof and sealed rugged chassis",
      "5-Year manufacturer replacement warranty"
    ],
    best_for: "Heavy industrial operations, schools, hotels, agricultural estates",
    bestFor: "Heavy industrial operations, schools, hotels, agricultural estates",
    price: "₦4,808,400",
    numeric_price: 4808400,
    tier: "premium",
    image_url: "/products/srne/srne-inv-hesp-20kw.webp",
    specifications: {
      "Rated AC Output": "20,000W Continuous",
      "MPPT Charge Current": "350A",
      "MPPT Voltage Range": "160V - 800V / 160V - 800V",
      "Protection Rating": "IP65 Waterproof",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 12,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["inverter", "srne", "20kw", "hesp", "ip65", "three-phase"]
  }
];

export const batteriesList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000008",
    serial_number: "TG-BAT-0001",
    sku: "TG-BAT-0001",
    name: "Felicity Solar 5.12kWh 100Ah LiFePO4 Battery (FL-LPBF48100)",
    category: "Batteries",
    series: "Felicity LPBF Series",
    brand: "Felicity",
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
    bestFor: "3kVA - 5kVA inverter setups, overnight lighting and refrigeration",
    price: "₦1,450,000",
    numeric_price: 1450000,
    tier: "premium",
    image_url: "/products/core/felicity-5kwh-lifepo4.webp",
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
    rating: 5.0,
    review_count: 22,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "lifepo4", "lithium", "felicity", "5kwh"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000009",
    serial_number: "TG-BAT-0002",
    sku: "TG-BAT-0002",
    name: "Felicity Solar 10.24kWh 200Ah LiFePO4 Battery Wall-Mount (FL-LPBF48200)",
    category: "Batteries",
    series: "Felicity LPBF Series",
    brand: "Felicity",
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
    bestFor: "5kVA - 10kVA inverters, 24/7 air conditioning and complete blackout immunity",
    price: "₦2,850,000",
    numeric_price: 2850000,
    tier: "premium",
    image_url: "/products/core/felicity-10kwh-powerwall.webp",
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
    rating: 5.0,
    review_count: 27,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "lifepo4", "lithium", "felicity", "10kwh", "powerwall"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000010",
    serial_number: "TG-BAT-0003",
    sku: "TG-BAT-0003",
    name: "Felicity Solar 15.36kWh 300Ah Commercial Storage Battery",
    category: "Batteries",
    series: "Felicity High-Cap",
    brand: "Felicity",
    description: "Commercial grade heavy-duty energy storage system with 15.36kWh capacity, dual breaker safety isolation, and high continuous discharge rating.",
    features: [
      "15,360Wh (15.36kWh) massive storage reservoir",
      "Heavy-duty copper busbars for high surge motor startups",
      "Dual circuit breaker and DC fuse protection",
      "Grade-A automotive cells certified for 6,000+ cycles",
      "Seamless communication with Deye 10kW & 12kW inverters"
    ],
    best_for: "Commercial buildings, luxury mansions, servers and medical clinics",
    bestFor: "Commercial buildings, luxury mansions, servers and medical clinics",
    price: "₦4,100,000",
    numeric_price: 4100000,
    tier: "premium",
    image_url: "/products/core/felicity-15kwh-battery.webp",
    specifications: {
      "Nominal Energy": "15.36 kWh",
      "Nominal Voltage": "51.2 Vdc",
      "Usable Capacity": "300 Ah",
      "Max Continuous Current": "200A Discharge",
      "Cycle Life": "6,000+ Cycles",
      "Warranty": "5-Year Enterprise Warranty",
      "Weight": "125 kg"
    },
    rating: 5.0,
    review_count: 6,
    stock_status: "in_stock",
    warranty_years: 5,
    tags: ["battery", "lifepo4", "15kwh", "commercial", "felicity"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000011",
    serial_number: "TG-BAT-0004",
    sku: "TG-BAT-0004",
    name: "AlpSolarr Pulse S2 Compact Energy Storage Unit",
    category: "Batteries",
    series: "AlpSolarr Systems",
    brand: "AlpSolarr",
    description: "Compact, silent residential lithium storage unit engineered for smart homes and apartment living with smartphone telemetry.",
    features: [
      "4.8kWh usable lithium iron phosphate capacity",
      "Ultra-compact footprint with silent natural convection cooling",
      "App-connected Bluetooth and Wi-Fi state of charge monitoring",
      "Plug and play installation with bracket kit included"
    ],
    best_for: "Luxury apartments, smart homes, modern offices",
    bestFor: "Luxury apartments, smart homes, modern offices",
    price: "₦1,250,000",
    numeric_price: 1250000,
    tier: "mid",
    image_url: "/products/core/alpsolar-pulse-s2.webp",
    specifications: {
      "Nominal Energy": "4.8 kWh",
      "Nominal Voltage": "48Vdc",
      "Cycle Life": "5,000+ Cycles",
      "Warranty": "3-Year Warranty"
    },
    rating: 4.8,
    review_count: 10,
    stock_status: "in_stock",
    warranty_years: 3,
    tags: ["battery", "alpsolar", "compact", "storage"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000012",
    serial_number: "TG-BAT-0005",
    sku: "TG-BAT-0005",
    name: "Itel 1000W Portable Emergency Power Station",
    category: "Batteries",
    series: "Itel Power Solutions",
    brand: "Itel",
    description: "All-in-one portable power bank with pure sine wave 1000W AC outlet, fast 100W USB-C PD charging, high-lumen LED light, and solar charging input.",
    features: [
      "1,000Wh battery capacity with pure sine wave 1000W inverter",
      "2x AC 230V outlets, 4x USB ports, 1x 100W PD Type-C port",
      "Charges from 0 to 80% in 1.5 hours via wall outlet",
      "Compatible with portable solar panels for outdoor camping and field jobs",
      "Digital LCD display showing exact remaining battery minutes"
    ],
    best_for: "Remote work, field engineers, outdoor events, emergency loadshedding",
    bestFor: "Remote work, field engineers, outdoor events, emergency loadshedding",
    price: "₦420,000",
    numeric_price: 420000,
    tier: "entry",
    image_url: "/products/core/itel-1000w-powerstation.webp",
    specifications: {
      "Capacity": "1,000Wh (270,000mAh)",
      "AC Output": "1000W Pure Sine Wave (Surge 2000W)",
      "Solar Input": "12V-24V / 200W Max",
      "Weight": "9.2 kg",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.7,
    review_count: 19,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["portable", "powerstation", "itel", "emergency", "battery"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000090",
    serial_number: "TG-BAT-0090",
    sku: "TG-BAT-0090",
    name: "SRNE 2.56kWh 12V 200Ah LiFePO4 Lithium Battery (EOS02B-12)",
    category: "Batteries",
    series: "SRNE EOS Series",
    brand: "SRNE",
    description: "Compact high-performance 12.8V 200Ah LiFePO4 lithium battery with 6,000 charge cycles, smart internal BMS, and support for up to 4 units in parallel.",
    features: [
      "2,560Wh (2.56kWh) storage capacity at 12.8V nominal voltage",
      "6,000+ deep discharge cycles for over 10 years continuous lifespan",
      "Internal smart BMS protecting against over-voltage, thermal runaway and short-circuits",
      "Supports parallel connection up to 4 units (10.24kWh total bank)",
      "5-Year official manufacturer warranty"
    ],
    best_for: "12V inverter systems, boats, campers, security systems and emergency backups",
    bestFor: "12V inverter systems, boats, campers, security systems and emergency backups",
    price: "₦639,600",
    numeric_price: 639600,
    tier: "affordable",
    image_url: "/products/srne/srne-bat-eos02b-12.webp",
    specifications: {
      "Nominal Voltage": "12.8 Vdc",
      "Capacity": "200 Ah (2.56 kWh)",
      "Cycle Life": "6,000 Cycles @ 80% DoD",
      "Parallel Limit": "Up to 4 units in parallel",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 16,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "12v", "200ah", "lifepo4", "lithium"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000091",
    serial_number: "TG-BAT-0091",
    sku: "TG-BAT-0091",
    name: "SRNE 2.56kWh 24V 100Ah LiFePO4 Lithium Battery (EOS02B-24)",
    category: "Batteries",
    series: "SRNE EOS Series",
    brand: "SRNE",
    description: "25.6V 100Ah lithium iron phosphate energy storage battery with 6,000 cycles lifespan, plug-and-play installation, and parallel support up to 4 units.",
    features: [
      "2,560Wh (2.56kWh) energy storage at 25.6V nominal voltage",
      "6,000 cycles lifecycle at 80% Depth of Discharge",
      "Built-in battery protection BMS with cell balancing",
      "Parallel up to 4 units for 10.24kWh on 24V inverters",
      "5-Year replacement warranty"
    ],
    best_for: "24V 3kVA inverter systems, residential apartments, POS and CCTV backup",
    bestFor: "24V 3kVA inverter systems, residential apartments, POS and CCTV backup",
    price: "₦756,000",
    numeric_price: 756000,
    tier: "affordable",
    image_url: "/products/srne/srne-bat-eos02b-24.webp",
    specifications: {
      "Nominal Voltage": "25.6 Vdc",
      "Capacity": "100 Ah (2.56 kWh)",
      "Cycle Life": "6,000 Cycles",
      "Parallel Limit": "Up to 4 units",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 21,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "24v", "100ah", "lifepo4", "lithium"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000092",
    serial_number: "TG-BAT-0092",
    sku: "TG-BAT-0092",
    name: "SRNE 7.16kWh 24V 280Ah LiFePO4 Lithium Battery (EOS08B-24)",
    category: "Batteries",
    series: "SRNE EOS Series",
    brand: "SRNE",
    description: "Massive capacity 24V 280Ah LiFePO4 battery pack delivering 7.16kWh of usable energy for demanding 24V solar setups. Supports up to 4 units in parallel.",
    features: [
      "7,168Wh (7.16kWh) deep storage capacity on 24V architecture",
      "280Ah Grade-A prismatic lithium cells with 6,000 cycle durability",
      "Direct CAN / RS485 communication with smart inverter protocols",
      "Parallel up to 4 units for an enormous 28.6kWh 24V system",
      "5-Year warranty with active BMS thermal protection"
    ],
    best_for: "Heavy 24V residential and commercial solar installations",
    bestFor: "Heavy 24V residential and commercial solar installations",
    price: "₦1,617,600",
    numeric_price: 1617600,
    tier: "mid",
    image_url: "/products/srne/srne-bat-eos08b-24.webp",
    specifications: {
      "Nominal Voltage": "25.6 Vdc",
      "Capacity": "280 Ah (7.16 kWh)",
      "Cycle Life": "6,000 Cycles @ 80% DoD",
      "Parallel Limit": "Up to 4 units",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 14,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "24v", "280ah", "7kwh", "lifepo4"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000093",
    serial_number: "TG-BAT-0093",
    sku: "TG-BAT-0093",
    name: "SRNE 5.12kWh 48V 100Ah Smart LiFePO4 Wall Battery (SE05B)",
    category: "Batteries",
    series: "SRNE SE Series",
    brand: "SRNE",
    description: "Sleek wall-mounted 51.2V 100Ah LiFePO4 battery with integrated WiFi & Bluetooth monitoring, 6,000 cycle lifespan, and parallel stacking up to 16 units (81.9kWh).",
    features: [
      "5,120Wh (5.12kWh) nominal capacity at 51.2V 100Ah",
      "Built-in WiFi and Bluetooth for direct real-time smartphone telemetry",
      "Stackable in parallel up to 16 units for large 81.9kWh residential banks",
      "Smart multi-protocol BMS compatible with Deye, SRNE, Growatt, Luxpower",
      "5-Year manufacturer replacement warranty"
    ],
    best_for: "Standard 5kW / 6kW / 8kW hybrid inverter installations",
    bestFor: "Standard 5kW / 6kW / 8kW hybrid inverter installations",
    price: "₦1,202,400",
    numeric_price: 1202400,
    tier: "mid",
    image_url: "/products/srne/srne-bat-se05b-wall.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "100 Ah (5.12 kWh)",
      "Cycle Life": "6,000 Cycles @ 80% DoD",
      "Connectivity": "WiFi and Bluetooth Integrated",
      "Max Parallel": "16 units (81.92 kWh)",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 31,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "48v", "5kwh", "wifi", "bluetooth", "lifepo4"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000094",
    serial_number: "TG-BAT-0094",
    sku: "TG-BAT-0094",
    name: "SRNE 10.49kWh 48V 205Ah Smart LiFePO4 Powerwall Battery (SE10B)",
    category: "Batteries",
    series: "SRNE SE Series",
    brand: "SRNE",
    description: "Large capacity 51.2V 205Ah lithium energy storage module with 10.49kWh capacity, WiFi/Bluetooth telemetry, 6,000 cycles, and parallel scaling up to 16 units.",
    features: [
      "10,490Wh (10.49kWh) massive single-unit energy storage",
      "WiFi & Bluetooth wireless status, temperature and voltage monitoring",
      "6,000+ deep discharge cycles for over 15 years lifespan",
      "Supports parallel connection up to 16 units (167.8kWh)",
      "5-Year official manufacturer warranty"
    ],
    best_for: "Duplexes, executive residences with multiple AC units, small offices",
    bestFor: "Duplexes, executive residences with multiple AC units, small offices",
    price: "₦2,164,800",
    numeric_price: 2164800,
    tier: "premium",
    image_url: "/products/srne/srne-bat-se10b-wall.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "205 Ah (10.49 kWh)",
      "Cycle Life": "6,000 Cycles",
      "Connectivity": "WiFi and Bluetooth",
      "Parallel Capability": "Up to 16 units",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 26,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "10kwh", "48v", "powerwall", "lifepo4"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000095",
    serial_number: "TG-BAT-0095",
    sku: "TG-BAT-0095",
    name: "SRNE 14.33kWh 48V 280Ah Smart LiFePO4 Storage Battery (SE15B)",
    category: "Batteries",
    series: "SRNE SE Series",
    brand: "SRNE",
    description: "High-capacity 51.2V 280Ah lithium battery pack providing 14.33kWh of usable power with wireless WiFi/Bluetooth communication and 16-unit parallel support.",
    features: [
      "14,330Wh (14.33kWh) commercial-grade residential power module",
      "280Ah Tier-1 cells with 6,000 cycles lifecycle durability",
      "Real-time cell balancing and wireless mobile app telemetry",
      "Scale up to 229kWh with 16 parallel units",
      "5-Year manufacturer replacement warranty"
    ],
    best_for: "Commercial buildings, luxury villas, cold rooms, medical clinics",
    bestFor: "Commercial buildings, luxury villas, cold rooms, medical clinics",
    price: "₦2,779,200",
    numeric_price: 2779200,
    tier: "premium",
    image_url: "/products/srne/srne-bat-se15b-tower.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "280 Ah (14.33 kWh)",
      "Cycle Life": "6,000 Cycles",
      "Wireless": "WiFi and Bluetooth",
      "Parallel Limits": "Up to 16 units",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 17,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "14kwh", "48v", "280ah", "commercial"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000096",
    serial_number: "TG-BAT-0096",
    sku: "TG-BAT-0096",
    name: "SRNE 16.07kWh 51.2V 314Ah LCD LiFePO4 Roller Battery (SE16B-Pro)",
    category: "Batteries",
    series: "SRNE Pro Series",
    brand: "SRNE",
    description: "Premium wheeled tower 51.2V 314Ah lithium battery with front LCD status screen, mobile casters, WiFi & Bluetooth connectivity, and 16.07kWh capacity.",
    features: [
      "16,070Wh (16.07kWh) high-density storage with CATL 314Ah cells",
      "High-definition LCD status screen displaying SOC, voltage and cycle count",
      "Integrated heavy-duty lockable roller wheels for easy maneuverability",
      "WiFi & Bluetooth telemetry with Tuya/Solarman cloud sync",
      "Supports 16 units in parallel for 257kWh mega storage arrays"
    ],
    best_for: "Executive mansions, data hubs, telecommunications, corporate offices",
    bestFor: "Executive mansions, data hubs, telecommunications, corporate offices",
    price: "₦3,002,400",
    numeric_price: 3002400,
    tier: "premium",
    image_url: "/products/srne/srne-bat-se16b-pro.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "314 Ah (16.07 kWh)",
      "Display": "Front Digital LCD Status Screen",
      "Mobility": "Built-in Roller Wheels with Brake",
      "Cycle Life": "6,000 Cycles",
      "Max Parallel": "16 units (257.12 kWh)",
      "Warranty": "5-Year Official Warranty"
    },
    rating: 5.0,
    review_count: 28,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 5,
    tags: ["battery", "srne", "16kwh", "314ah", "lcd", "roller", "pro"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000097",
    serial_number: "TG-BAT-0097",
    sku: "TG-BAT-0097",
    name: "SRNE 5.12kWh 51.2V 100Ah 10-Year Warranty LiFePO4 Battery (EOS05B-Pro)",
    category: "Batteries",
    series: "SRNE EOS Pro Series",
    brand: "SRNE",
    description: "Elite 10-year warranty 51.2V 100Ah LiFePO4 battery module with circular status display, 6,000 cycles, and parallel scaling up to 16 units (81.92kWh).",
    features: [
      "5,120Wh (5.12kWh) premium Grade-A lithium cells",
      "10-Year manufacturer extended replacement warranty",
      "Front circular smart telemetry LED display gauge",
      "Parallel up to 16 units for 81.92kWh continuous storage",
      "Sub-millisecond BMS safety protection"
    ],
    best_for: "High-end residences desiring maximum long-term warranty peace of mind",
    bestFor: "High-end residences desiring maximum long-term warranty peace of mind",
    price: "₦1,462,800",
    numeric_price: 1462800,
    tier: "premium",
    image_url: "/products/srne/srne-bat-eos05b-pro.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "100 Ah (5.12 kWh)",
      "Cycle Life": "6,000 Cycles @ 80% DoD",
      "Display": "Smart Circular LED Display",
      "Warranty": "10-Year Official Manufacturer Warranty"
    },
    rating: 5.0,
    review_count: 25,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 10,
    tags: ["battery", "srne", "5kwh", "10-year warranty", "eos pro"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000098",
    serial_number: "TG-BAT-0098",
    sku: "TG-BAT-0098",
    name: "SRNE 10.24kWh 51.2V 200Ah 10-Year Warranty LiFePO4 Battery (EOS10B)",
    category: "Batteries",
    series: "SRNE EOS Pro Series",
    brand: "SRNE",
    description: "Heavy-duty 10.24kWh 51.2V 200Ah lithium battery backing up major residential homes. Features 10-year official warranty and 16-unit parallel support (163.84kWh).",
    features: [
      "10,240Wh (10.24kWh) storage rated at 51.2V 200Ah",
      "Industry-leading 10-year replacement warranty",
      "Circular smart telemetry display with live SOC percent",
      "Supports parallel scaling up to 16 units (163.84kWh total bank)",
      "6,000 cycle life with advanced multi-tier BMS protection"
    ],
    best_for: "Full-day backup for 4-5 bedroom duplexes, commercial offices",
    bestFor: "Full-day backup for 4-5 bedroom duplexes, commercial offices",
    price: "₦3,206,400",
    numeric_price: 3206400,
    tier: "premium",
    image_url: "/products/srne/srne-bat-eos10b-pro.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "200 Ah (10.24 kWh)",
      "Cycle Life": "6,000 Cycles @ 80% DoD",
      "Max Parallel": "16 units (163.84 kWh)",
      "Warranty": "10-Year Official Manufacturer Warranty"
    },
    rating: 5.0,
    review_count: 20,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 10,
    tags: ["battery", "srne", "10kwh", "200ah", "10-year warranty", "eos10b"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000099",
    serial_number: "TG-BAT-0099",
    sku: "TG-BAT-0099",
    name: "SRNE 16.07kWh 51.2V 314Ah IP65 10-Year Warranty Battery (EOS15B)",
    category: "Batteries",
    series: "SRNE EOS Pro Series",
    brand: "SRNE",
    description: "Flagship 16.07kWh IP65 waterproof lithium battery storage system with 8,000 cycles life, 10-year manufacturer warranty, and parallel expansion up to 257kWh.",
    features: [
      "16,070Wh (16.07kWh) ultra-capacity storage with 314Ah cells",
      "8,000 life cycles at 80% DoD for 20+ years reliable operation",
      "IP65 waterproof and dustproof rating for exterior and plant-room installation",
      "10-Year official manufacturer replacement warranty",
      "Parallel up to 16 units for a colossal 257.12kWh energy bank"
    ],
    best_for: "Commercial buildings, luxury villas, industrial storage, agricultural estates",
    bestFor: "Commercial buildings, luxury villas, industrial storage, agricultural estates",
    price: "₦3,640,800",
    numeric_price: 3640800,
    tier: "premium",
    image_url: "/products/srne/srne-bat-eos15b-pro.webp",
    specifications: {
      "Nominal Voltage": "51.2 Vdc",
      "Capacity": "314 Ah (16.07 kWh)",
      "Cycle Life": "8,000 Cycles @ 80% DoD",
      "Protection": "IP65 Weatherproof",
      "Max Parallel": "16 units (257.12 kWh)",
      "Warranty": "10-Year Official Manufacturer Warranty"
    },
    rating: 5.0,
    review_count: 34,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 10,
    tags: ["battery", "srne", "16kwh", "ip65", "8000 cycles", "10-year warranty"]
  }
];

export const solarPanelsList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000013",
    serial_number: "TG-SOL-0001",
    sku: "TG-SOL-0001",
    name: "Longi 550W Hi-MO 5 Tier-1 Mono PERC Solar Panel",
    category: "Solar Panels",
    series: "Longi Hi-MO 5",
    brand: "Longi",
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
    bestFor: "Residential roofs, commercial rooftop solar arrays, solar farms",
    price: "₦145,000",
    numeric_price: 145000,
    tier: "premium",
    image_url: "/products/core/longi-550w-himo5.webp",
    specifications: {
      "Peak Power (Pmax)": "550 Wp",
      "Open Circuit Voltage (Voc)": "49.80 V",
      "Short Circuit Current (Isc)": "13.98 A",
      "Voltage at Pmax (Vmp)": "41.95 V",
      "Current at Pmax (Imp)": "13.12 A",
      "Module Efficiency": "21.5%",
      "Power Warranty": "25-Year Linear Power Output Warranty",
      "Dimensions": "2278 x 1134 x 35 mm (27.5 kg)"
    },
    rating: 5.0,
    review_count: 35,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 25,
    tags: ["solar panel", "longi", "550w", "mono", "tier-1"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000014",
    serial_number: "TG-SOL-0002",
    sku: "TG-SOL-0002",
    name: "Longi 600W Hi-MO 6 Explorer Bifacial Solar Panel",
    category: "Solar Panels",
    series: "Longi Hi-MO 6",
    brand: "Longi",
    description: "Ultra-high output bifacial HPBC cell solar panel with up to 22.8% front efficiency plus up to 25% extra energy harvest from backside reflected light.",
    features: [
      "600W nominal front power rating",
      "Bifacial glass-glass structure capturing ambient reflected light",
      "HPBC cell technology with zero front grid lines for maximum sunlight capture",
      "Exceptional performance during hazy Hamattan and overcast rainy days",
      "30-Year dual-glass linear power warranty"
    ],
    best_for: "Commercial installations, ground mounts, flat reflective rooftops",
    bestFor: "Commercial installations, ground mounts, flat reflective rooftops",
    price: "₦168,000",
    numeric_price: 168000,
    tier: "premium",
    image_url: "/products/core/longi-600w-himo6.webp",
    specifications: {
      "Peak Power (Pmax)": "600 Wp",
      "Module Efficiency": "22.8%",
      "Bifaciality Factor": "70% ± 5%",
      "Warranty": "30-Year Performance Warranty",
      "Dimensions": "2384 x 1134 x 35 mm (32 kg)"
    },
    rating: 5.0,
    review_count: 16,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 30,
    tags: ["solar panel", "longi", "600w", "bifacial", "tier-1"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000015",
    serial_number: "TG-SOL-0003",
    sku: "TG-SOL-0003",
    name: "Canadian Solar 550W HiKu6 Monocrystalline Panel",
    category: "Solar Panels",
    series: "Canadian Solar HiKu6",
    brand: "Canadian Solar",
    description: "Tier-1 high power mono module with comprehensive shading mitigation, low temperature coefficient, and certified wind load resistance.",
    features: [
      "550W high efficiency solar module",
      "Low temperature coefficient (-0.34% / °C) for Nigerian tropical heat",
      "Minimized micro-crack risk with multi-busbar cell design",
      "High reliability with IP68 sealed bypass diodes"
    ],
    best_for: "Residential homes, estate canopies, industrial rooftops",
    bestFor: "Residential homes, estate canopies, industrial rooftops",
    price: "₦148,000",
    numeric_price: 148000,
    tier: "premium",
    image_url: "/products/core/canadian-solar-550w.webp",
    specifications: {
      "Power Rating": "550 Wp",
      "Efficiency": "21.3%",
      "Warranty": "25-Year Power Guarantee",
      "Dimensions": "2278 x 1134 x 35 mm (27.6 kg)"
    },
    rating: 4.9,
    review_count: 18,
    stock_status: "in_stock",
    warranty_years: 25,
    tags: ["solar panel", "canadian solar", "550w", "tier-1"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000071",
    serial_number: "TG-SOL-0071",
    sku: "TG-SOL-0071",
    name: "LONGi 610W Hi-MO X6 Max Tier-1 HPBC Mono Solar Panel",
    category: "Solar Panels",
    series: "Longi Hi-MO X6 Max",
    brand: "Longi",
    description: "Flagship Bloomberg Tier-1 610W monocrystalline module featuring revolutionary HPBC busbar-free front cell architecture with 22.6% efficiency and exceptional cloudy-day energy yield.",
    features: [
      "610W nominal peak power output under standard testing conditions",
      "22.6% ultra-high module efficiency with HPBC cell design",
      "Busbar-free front surface maximizes light capture and minimizes resistive losses",
      "Superior heat and low-irradiance performance in tropical climates",
      "5400Pa front mechanical load resistance with anodized aluminum frame",
      "25-Year linear power warranty"
    ],
    best_for: "Luxury residences, commercial rooftops, high-performance solar farms",
    bestFor: "Luxury residences, commercial rooftops, high-performance solar farms",
    price: "₦168,960",
    numeric_price: 168960,
    tier: "premium",
    image_url: "/products/core/longi-610w-himo-x6.webp",
    specifications: {
      "Peak Power (Pmax)": "610 Wp",
      "Module Efficiency": "22.6%",
      "Open Circuit Voltage (Voc)": "52.42 V",
      "Voltage at Pmax (Vmp)": "44.18 V",
      "Short Circuit Current (Isc)": "14.80 A",
      "Current at Pmax (Imp)": "13.81 A",
      "Cell Type": "HPBC Monocrystalline 144 Half-Cells",
      "Warranty": "25-Year Power Performance Guarantee",
      "Dimensions": "2382 x 1134 x 30 mm (28.5 kg)"
    },
    rating: 5.0,
    review_count: 24,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 25,
    tags: ["solar panel", "longi", "610w", "himo-x6", "hpbc", "tier-1"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000072",
    serial_number: "TG-SOL-0072",
    sku: "TG-SOL-0072",
    name: "JA Solar 620W DeepBlue 4.0 Pro N-Type Bifacial Double-Glass Panel",
    category: "Solar Panels",
    series: "JA Solar DeepBlue 4.0 Pro",
    brand: "JA Solar",
    description: "Cutting-edge 620W N-type Bycium+ double-glass bifacial solar panel with 23.0% front efficiency plus up to 25% additional backside yield from ground reflection.",
    features: [
      "620W front-side peak power rating with up to 80% bifaciality factor",
      "23.0% maximum module conversion efficiency",
      "N-type MBB half-cut cells with near-zero initial Light-Induced Degradation (LID)",
      "Double-glass structural rigidity resistant to salt-mist, sand, and humidity",
      "Extremely low -0.29%/°C temperature coefficient for high Nigerian ambient temperatures",
      "30-Year dual-glass linear power warranty"
    ],
    best_for: "Commercial canopies, flat roofs, industrial rooftop installations, solar arrays",
    bestFor: "Commercial canopies, flat roofs, industrial rooftop installations, solar arrays",
    price: "₦166,320",
    numeric_price: 166320,
    tier: "premium",
    image_url: "/products/core/ja-solar-620w-deepblue.webp",
    specifications: {
      "Peak Power (Pmax)": "620 Wp",
      "Module Efficiency": "23.0%",
      "Open Circuit Voltage (Voc)": "48.50 V",
      "Voltage at Pmax (Vmp)": "40.21 V",
      "Short Circuit Current (Isc)": "16.15 A",
      "Current at Pmax (Imp)": "15.42 A",
      "Bifaciality": "80% ± 5%",
      "Warranty": "30-Year Linear Power Warranty",
      "Dimensions": "2382 x 1134 x 30 mm (33.1 kg)"
    },
    rating: 5.0,
    review_count: 27,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 30,
    tags: ["solar panel", "ja solar", "620w", "bifacial", "n-type", "tier-1"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000073",
    serial_number: "TG-SOL-0073",
    sku: "TG-SOL-0073",
    name: "JinkoSolar 630W Tiger Neo N-Type TOPCon Bifacial Solar Panel",
    category: "Solar Panels",
    series: "Jinko Tiger Neo",
    brand: "Jinko",
    description: "Industry-leading JinkoSolar 630W Tiger Neo N-type TOPCon bifacial module delivering 23.32% efficiency, optimized SMBB cell tech, and exceptional high-temperature yield.",
    features: [
      "630W high-density peak power with N-type TOPCon cell innovation",
      "23.32% high module efficiency with Super Multi-Busbar (SMBB) layout",
      "Bifacial dual-glass architecture with enhanced weak light harvesting",
      "Anti-PID guaranteed through strict quality manufacturing",
      "30-Year linear power warranty with ultra-low annual degradation (0.40%/yr)"
    ],
    best_for: "Residential duplexes, commercial shopping malls, corporate estates",
    bestFor: "Residential duplexes, commercial shopping malls, corporate estates",
    price: "₦198,000",
    numeric_price: 198000,
    tier: "premium",
    image_url: "/products/core/jinko-630w-tiger-neo.webp",
    specifications: {
      "Peak Power (Pmax)": "630 Wp",
      "Module Efficiency": "23.32%",
      "Open Circuit Voltage (Voc)": "49.48 V",
      "Voltage at Pmax (Vmp)": "41.02 V",
      "Short Circuit Current (Isc)": "16.20 A",
      "Current at Pmax (Imp)": "15.36 A",
      "Cell Type": "N-type TOPCon 132 Half-Cells",
      "Warranty": "30-Year Performance Warranty",
      "Dimensions": "2382 x 1134 x 30 mm (32.4 kg)"
    },
    rating: 5.0,
    review_count: 32,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 30,
    tags: ["solar panel", "jinko", "630w", "tiger neo", "topcon", "bifacial"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000074",
    serial_number: "TG-SOL-0074",
    sku: "TG-SOL-0074",
    name: "JinkoSolar 725W Tiger Neo N-Type High-Power Commercial Bifacial Panel",
    category: "Solar Panels",
    series: "Jinko Tiger Neo",
    brand: "Jinko",
    description: "Ultra-heavy-duty 725W commercial and utility-scale N-type TOPCon dual-glass bifacial solar panel with 23.5% efficiency, 17.69A operating current, and 30-year warranty.",
    features: [
      "725W massive single-module rated output power",
      "23.5% peak module conversion efficiency",
      "Dual-glass N-type TOPCon technology maximizing energy production per square meter",
      "Ideal for minimizing Balance of System (BOS) cabling, racking, and labor costs",
      "30-Year manufacturer linear power warranty"
    ],
    best_for: "Commercial developments, factories, hospitals, utility-scale ground mounts",
    bestFor: "Commercial developments, factories, hospitals, utility-scale ground mounts",
    price: "₦224,400",
    numeric_price: 224400,
    tier: "premium",
    image_url: "/products/core/jinko-725w-tiger-neo.webp",
    specifications: {
      "Peak Power (Pmax)": "725 Wp",
      "Module Efficiency": "23.5%",
      "Open Circuit Voltage (Voc)": "49.20 V",
      "Voltage at Pmax (Vmp)": "41.00 V",
      "Short Circuit Current (Isc)": "18.74 A",
      "Current at Pmax (Imp)": "17.69 A",
      "Cell Type": "N-type TOPCon 132 Cells",
      "Warranty": "30-Year Performance Warranty",
      "Dimensions": "2384 x 1303 x 33 mm (37.5 kg)"
    },
    rating: 5.0,
    review_count: 19,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 30,
    tags: ["solar panel", "jinko", "725w", "tiger neo", "commercial", "topcon"]
  }
];

export const smartLocksList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000016",
    serial_number: "TG-LCK-0001",
    sku: "TG-LCK-0001",
    name: "STAMA Model K209 Elite 3D Face Recognition Smart Lock",
    category: "Smart Locks",
    series: "Elite Series",
    brand: "STAMA",
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
    bestFor: "Executive mansions, luxury penthouses, main armored security doors",
    price: "₦285,000",
    numeric_price: 285000,
    tier: "premium",
    image_url: "/products/core/stama-k209-face-lock.webp",
    specifications: {
      "Unlock Methods": "3D Face, Palm Vein, Fingerprint, Passcode, RFID Card, App, Key",
      "User Capacity": "100 Faces, 100 Fingerprints, 100 Passcodes, 100 Cards",
      "Camera": "1080p HD Wide Angle with Infrared Night Vision",
      "Display": "3.5-inch Color HD Indoor Screen",
      "Door Compatibility": "Wooden, Armored, Metal doors (40mm - 120mm thickness)",
      "Battery": "5000mAh Rechargeable Lithium Pack",
      "Warranty": "2-Year Complete Hardware Warranty"
    },
    rating: 5.0,
    review_count: 31,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["smart lock", "face id", "stama", "k209", "biometric", "security"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000017",
    serial_number: "TG-LCK-0002",
    sku: "TG-LCK-0002",
    name: "STAMA Model S7 Premier-Lux Custom Israeli Edition",
    category: "Smart Locks",
    series: "Elite Series",
    brand: "STAMA",
    description: "Custom Israeli engineering edition designed for executive apartments and premium shortlets needing ultra-fast access and IP66 weatherproofing.",
    features: [
      "High-precision 3D facial recognition",
      "Semiconductor live fingerprint sensor with 360° recognition",
      "IP66 waterproof performance suited for exposed exterior doors",
      "Encrypted RFID access cards and mechanical override key",
      "Entry record and real-time smartphone notification logs"
    ],
    best_for: "Executive apartments, premium shortlets, outdoor security doors",
    bestFor: "Executive apartments, premium shortlets, outdoor security doors",
    price: "₦300,000",
    numeric_price: 300000,
    tier: "premium",
    image_url: "/products/core/stama-s7-premier.webp",
    specifications: {
      "Unlock Modes": "Face ID, Fingerprint, RFID Card, Passcode, App, Mechanical Key",
      "Waterproof Rating": "IP66 Weather-Resistant",
      "Mortise": "Stainless Steel 6068 Anti-Drill Mortise",
      "Warranty": "2-Year Warranty"
    },
    rating: 5.0,
    review_count: 17,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["smart lock", "stama", "s7", "waterproof", "face id"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000018",
    serial_number: "TG-LCK-0003",
    sku: "TG-LCK-0003",
    name: "STAMA Model D20 Apex-Lux Biometric Smart Lock",
    category: "Smart Locks",
    series: "Apex Series",
    brand: "STAMA",
    description: "Popular smart security lock for homes and apartments seeking advanced biometric access, mobile app control, and keyless convenience.",
    features: [
      "Rapid fingerprint recognition under 0.4 seconds",
      "Passcode entry with temporary visitor PIN generation",
      "Wi-Fi app control with remote unlock authorization",
      "Built-in electronic doorbell chime",
      "Sturdy zinc alloy body with scratch-resistant tempered glass keypad"
    ],
    best_for: "Family homes, apartments, executive offices",
    bestFor: "Family homes, apartments, executive offices",
    price: "₦280,000",
    numeric_price: 280000,
    tier: "mid",
    image_url: "/products/core/stama-d20-apex.webp",
    specifications: {
      "Unlock Modes": "Fingerprint, Passcode, Card, Tuya App, Physical Key",
      "Capacity": "100 Fingerprints, 50 RFID Cards",
      "Material": "High-Density Zinc Alloy",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.9,
    review_count: 24,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["smart lock", "stama", "d20", "fingerprint", "security"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000019",
    serial_number: "TG-LCK-0004",
    sku: "TG-LCK-0004",
    name: "STAMA Model H11 Apex Video Intercom Smart Lock",
    category: "Smart Locks",
    series: "Apex Series",
    brand: "STAMA",
    description: "Integrated smart lock featuring an internal video screen, automatic snapshot of visitors on doorbell press, and two-way remote smartphone intercom.",
    features: [
      "Integrated HD camera and indoor color screen",
      "Pushes photo snapshot to your smartphone whenever doorbell is rung",
      "Fingerprint, RFID card, and temporary access codes",
      "Automatic locking mechanism when door closes"
    ],
    best_for: "Modern residences, private lounges, serviced apartments",
    bestFor: "Modern residences, private lounges, serviced apartments",
    price: "₦280,000",
    numeric_price: 280000,
    tier: "mid",
    image_url: "/products/core/stama-h11-intercom.webp",
    specifications: {
      "Camera": "HD Night-Vision Camera with Two-Way Audio",
      "Screen": "Indoor Color Display",
      "Unlock": "Face, Fingerprint, Passcode, App, Card, Key",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.9,
    review_count: 19,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["smart lock", "stama", "h11", "video doorbell", "camera"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000020",
    serial_number: "TG-LCK-0005",
    sku: "TG-LCK-0005",
    name: "STAMA SL02 Slim-Profile Smart Lock for Glass & Aluminum Doors",
    category: "Smart Locks",
    series: "Pro Series",
    brand: "STAMA",
    description: "Slim 38mm profile smart lock designed specifically for modern narrow-frame aluminum doors, sliding patio doors, and wooden entryways.",
    features: [
      "Narrow European mortise fits aluminum and sliding doors",
      "Fingerprint scanner integrated directly onto handle grip",
      "TTL / Tuya mobile app control with access timestamp logs",
      "Staff attendance tracking mode for office environments"
    ],
    best_for: "Narrow aluminum frame doors, sliding patio doors, modern offices",
    bestFor: "Narrow aluminum frame doors, sliding patio doors, modern offices",
    price: "₦220,000",
    numeric_price: 220000,
    tier: "affordable",
    image_url: "/products/core/stama-sl02-aluminum.webp",
    specifications: {
      "Lock Width": "38 mm Narrow Profile",
      "Door Types": "Aluminum Profile, Sliding Doors, Wooden Doors",
      "App Control": "TTlock / Tuya App with Bluetooth & Gateway",
      "Warranty": "18-Month Warranty"
    },
    rating: 4.8,
    review_count: 14,
    stock_status: "in_stock",
    warranty_years: 1.5,
    tags: ["smart lock", "stama", "sl02", "aluminum door", "sliding door"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000021",
    serial_number: "TG-LCK-0006",
    sku: "TG-LCK-0006",
    name: "STAMA TF5 Connected Shortlet Access Smart Lock",
    category: "Smart Locks",
    series: "Pro Series",
    brand: "STAMA",
    description: "The ideal smart lock for Airbnb hosts, shortlets, and hotel operators. Generate time-limited PIN codes remotely without needing active internet at the lock.",
    features: [
      "Offline time-bound OTP passcode generation (starts & expires on check-in/out)",
      "BLE Bluetooth app control plus optional Wi-Fi bridge",
      "RFID keycards for staff and guests",
      "Audit trail logs showing exact unlock timestamp and user name"
    ],
    best_for: "Airbnb shortlets, rental apartments, boutique hotels, office rooms",
    bestFor: "Airbnb shortlets, rental apartments, boutique hotels, office rooms",
    price: "₦220,000",
    numeric_price: 220000,
    tier: "affordable",
    image_url: "/products/core/stama-tf5-shortlet.webp",
    specifications: {
      "Passcode Types": "Timed, Permanent, One-time, Cyclic, Custom",
      "Communication": "Bluetooth 5.0 BLE (Gateway compatible)",
      "Battery": "4x AA Alkaline (12-Month Battery Life)",
      "Warranty": "18-Month Warranty"
    },
    rating: 5.0,
    review_count: 26,
    stock_status: "in_stock",
    warranty_years: 1.5,
    tags: ["smart lock", "stama", "tf5", "airbnb", "shortlet", "hotel"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000022",
    serial_number: "TG-LCK-0007",
    sku: "TG-LCK-0007",
    name: "STAMA N22 Accessible Biometric Security Lock",
    category: "Smart Locks",
    series: "Pro Series",
    brand: "STAMA",
    description: "Clean, reliable smart lock with fast biometric fingerprint scanner, backlit passcode keypad, and long-lasting battery performance.",
    features: [
      "Semiconductor fingerprint sensor with 0.3s response",
      "Backlit capacitive keypad with anti-peep decoy PINs",
      "Emergency Type-C jumpstart port if batteries run flat",
      "Mechanical key backup included"
    ],
    best_for: "Bedrooms, internal master suites, private offices",
    bestFor: "Bedrooms, internal master suites, private offices",
    price: "₦180,000",
    numeric_price: 180000,
    tier: "affordable",
    image_url: "/products/core/stama-n22-security.webp",
    specifications: {
      "Fingerprint Capacity": "100 Users",
      "Card Capacity": "50 Cards",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.8,
    review_count: 11,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["smart lock", "stama", "n22", "fingerprint"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000023",
    serial_number: "TG-LCK-0008",
    sku: "TG-LCK-0008",
    name: "STAMA V80 Heavy-Duty Smart Gate & Security Lock",
    category: "Smart Locks",
    series: "Base Series",
    brand: "STAMA",
    description: "Rugged double-sided biometric lock for exterior iron gates, perimeter fences, and compound entry points with waterproof sealing.",
    features: [
      "Dual-sided fingerprint recognition (protects both entry & exit sides)",
      "Weather-sealed IP65 waterproof zinc casing",
      "Wireless remote control fob included for unlocking from car or porch",
      "Works on conventional iron gates, wooden fence doors, and security grilles"
    ],
    best_for: "Compound pedestrian gates, external metal security doors",
    bestFor: "Compound pedestrian gates, external metal security doors",
    price: "₦216,000",
    numeric_price: 216000,
    tier: "mid",
    image_url: "/products/core/stama-v80-gate.webp",
    specifications: {
      "Access Sides": "Dual Biometric (Front & Back)",
      "Waterproofing": "IP65 Outdoor Gate Ready",
      "Remote": "433MHz RF Remote Included",
      "Warranty": "18-Month Warranty"
    },
    rating: 4.9,
    review_count: 15,
    stock_status: "in_stock",
    warranty_years: 1.5,
    tags: ["smart lock", "gate lock", "stama", "v80", "waterproof", "iron gate"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000024",
    serial_number: "TG-LCK-0009",
    sku: "TG-LCK-0009",
    name: "STAMA G290 Frameless Glass Door Smart Lock",
    category: "Smart Locks",
    series: "Base Series",
    brand: "STAMA",
    description: "Clamp-on biometric lock for frameless glass office doors. Requires zero drilling or cutting into the glass panel.",
    features: [
      "Clamp-on installation with zero glass drilling required",
      "Fingerprint, passcode, and RFID card authentication",
      "Built-in doorbell and attendance logging",
      "Suitable for double or single swing glass doors"
    ],
    best_for: "Corporate offices, boardroom doors, commercial shopping plazas",
    bestFor: "Corporate offices, boardroom doors, commercial shopping plazas",
    price: "₦198,000",
    numeric_price: 198000,
    tier: "entry",
    image_url: "/products/core/stama-g290-glass.webp",
    specifications: {
      "Glass Thickness": "10mm - 12mm Frameless Glass",
      "Installation": "No Hole Drilling Clamp System",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.7,
    review_count: 9,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["smart lock", "glass door", "stama", "g290", "office"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000025",
    serial_number: "TG-LCK-0010",
    sku: "TG-LCK-0010",
    name: "STAMA KT14 Rugged Biometric Smart Padlock",
    category: "Smart Locks",
    series: "Smart Padlocks",
    brand: "STAMA",
    description: "Portable, heavy-duty smart padlock with IP67 submersible waterproof rating, 0.5s fingerprint sensor, and stainless steel shackle.",
    features: [
      "Instant 0.5s fingerprint recognition (up to 50 fingers)",
      "IP67 submersible waterproof rating for all weather use",
      "Rechargeable battery lasts up to 6 months per single charge",
      "Hardened steel shackle resists bolt cutters and sawing"
    ],
    best_for: "Solar battery cages, warehouse gates, shipping containers, tool sheds",
    bestFor: "Solar battery cages, warehouse gates, shipping containers, tool sheds",
    price: "₦80,000",
    numeric_price: 80000,
    tier: "entry",
    image_url: "/products/core/stama-kt14-padlock.webp",
    specifications: {
      "Protection": "IP67 Submersible Waterproof",
      "Material": "Zinc Alloy Body + Stainless Steel Shackle",
      "Battery": "USB Rechargeable Lithium",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.8,
    review_count: 28,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["padlock", "biometric", "stama", "kt14", "waterproof", "security"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000026",
    serial_number: "TG-LCK-0011",
    sku: "TG-LCK-0011",
    name: "STAMA Smart Hotel Access & Management Ecosystem",
    category: "Smart Locks",
    series: "Hotel Management Suite",
    brand: "STAMA",
    description: "Full turnkey hotel digital access system including smart RFID/BLE locks, USB card encoder, central web management portal, and energy-saving switches.",
    features: [
      "Centralized front-desk guest check-in and card encoding",
      "Generate digital mobile keys for guest smartphone check-in",
      "Real-time guest access logging and room occupancy status",
      "Energy-saving room power switches activate only on valid room card"
    ],
    best_for: "Hotels, guest houses, serviced apartments, resort suites",
    bestFor: "Hotels, guest houses, serviced apartments, resort suites",
    price: "₦1,450,000",
    numeric_price: 1450000,
    tier: "premium",
    image_url: "/products/core/stama-hotel-system.webp",
    specifications: {
      "System Includes": "10x Hotel Smart Locks, 1x Card Encoder, 100x RFID Cards, Management Software",
      "Software": "Windows PC Software & Cloud Web Portal",
      "Warranty": "2-Year Enterprise Warranty"
    },
    rating: 5.0,
    review_count: 5,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["hotel", "smart lock", "stama", "hospitality", "access control"]
  }
];

export const smartHomeList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000027",
    serial_number: "TG-AUT-0001",
    sku: "TG-AUT-0001",
    name: "Tioga 8-Gang WiFi & Zigbee Smart Glass Touch Wall Switch",
    category: "Home Automation",
    series: "Smart Touch Series",
    brand: "Tioga IoT",
    description: "Luxury tempered glass touch switch with 8 independent circuits, smartphone app remote control, timer automation, and Google Home/Alexa voice sync.",
    features: [
      "8 gang independent touch channels on a standard double-gang plate",
      "Scratch-resistant tempered crystal glass with subtle LED backlighting",
      "Remote control, grouping and scheduling from Tuya / SmartLife App",
      "Voice control with Amazon Alexa and Google Assistant",
      "Power status memory remembers state after power restoration"
    ],
    best_for: "Living rooms, master bedrooms, executive reception areas",
    bestFor: "Living rooms, master bedrooms, executive reception areas",
    price: "₦68,000",
    numeric_price: 68000,
    tier: "mid",
    image_url: "/products/core/tioga-8gang-switch.webp",
    specifications: {
      "Gang Channels": "8 Channels (Up to 500W per gang)",
      "Wireless Protocol": "WiFi 2.4GHz + Zigbee 3.0",
      "Material": "Flame-Retardant PC + Tempered Glass",
      "Voltage": "100V - 250V AC 50/60Hz",
      "Warranty": "2-Year Warranty"
    },
    rating: 5.0,
    review_count: 16,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["smart switch", "automation", "wifi", "zigbee", "tioga iot"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000028",
    serial_number: "TG-AUT-0002",
    sku: "TG-AUT-0002",
    name: "Tioga 4-Gang Zigbee Smart Wall Touch Switch",
    category: "Home Automation",
    series: "Smart Touch Series",
    brand: "Tioga IoT",
    description: "Modern 4-gang smart wall switch with capacitive touch sensors, customizable scene triggers, and energy consumption telemetry.",
    features: [
      "4 touch channels with smooth haptic feedback",
      "Ultra-low latency mesh networking via Zigbee hub",
      "Automation scenes (e.g., 'All Lights Off' on leaving home)",
      "Works with or without neutral wire options"
    ],
    best_for: "Bedrooms, corridors, dining rooms",
    bestFor: "Bedrooms, corridors, dining rooms",
    price: "₦48,000",
    numeric_price: 48000,
    tier: "mid",
    image_url: "/products/core/tioga-4gang-zigbee.webp",
    specifications: {
      "Channels": "4 Gangs",
      "Wireless": "Zigbee 3.0",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.9,
    review_count: 21,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["smart switch", "zigbee", "4 gang", "automation"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000029",
    serial_number: "TG-AUT-0003",
    sku: "TG-AUT-0003",
    name: "Tioga 1-Gang WiFi Smart Relay Switch (In-Wall)",
    category: "Home Automation",
    series: "Smart Switch Base",
    brand: "Tioga IoT",
    description: "Compact in-wall micro smart relay that converts any existing conventional light switch or socket into a smartphone-controlled smart device.",
    features: [
      "Hides neatly inside standard junction box behind your existing wall switch",
      "Preserves original physical switch functionality while adding phone control",
      "16A maximum load capacity suitable for lighting or appliances",
      "Timer and countdown automation"
    ],
    best_for: "Retrofitting existing home switches without replacing wall plates",
    bestFor: "Retrofitting existing home switches without replacing wall plates",
    price: "₦18,000",
    numeric_price: 18000,
    tier: "entry",
    image_url: "/products/core/tioga-1gang-relay.webp",
    specifications: {
      "Max Current": "16A (3,500W Max)",
      "Protocol": "WiFi 2.4GHz",
      "Dimensions": "41 x 41 x 20 mm",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.8,
    review_count: 34,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["relay", "smart switch", "wifi", "retrofit", "automation"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000030",
    serial_number: "TG-AUT-0004",
    sku: "TG-AUT-0004",
    name: "Tioga Granite Smart Control Panel Display with Voice",
    category: "Home Automation",
    series: "Smart Control Hubs",
    brand: "Tioga IoT",
    description: "Wall-mounted 4-inch smart touch panel with built-in Zigbee hub, ambient lighting control, HVAC thermostat integration, and voice assistant.",
    features: [
      "4-inch multi-touch IPS color touchscreen display",
      "Integrated Zigbee 3.0 mesh gateway connects up to 100 devices",
      "Control lights, curtains, music, locks, and solar inverter status from one panel",
      "Two-way intercom function between rooms"
    ],
    best_for: "Master bedrooms, living room foyers, executive offices",
    bestFor: "Master bedrooms, living room foyers, executive offices",
    price: "₦215,000",
    numeric_price: 215000,
    tier: "premium",
    image_url: "/products/core/tioga-granite-display.webp",
    specifications: {
      "Display": "4-inch IPS HD Touchscreen (480 x 480)",
      "Wireless": "WiFi + Zigbee 3.0 + Bluetooth",
      "Built-in Gateway": "Yes (Up to 100 sub-devices)",
      "Warranty": "2-Year Warranty"
    },
    rating: 5.0,
    review_count: 12,
    stock_status: "in_stock",
    is_featured: true,
    warranty_years: 2,
    tags: ["smart panel", "display", "hub", "zigbee", "automation", "tioga iot"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000031",
    serial_number: "TG-AUT-0005",
    sku: "TG-AUT-0005",
    name: "Tioga Smart WiFi Water Heater 40A Heavy-Duty Switch",
    category: "Home Automation",
    series: "High-Power Controls",
    brand: "Tioga IoT",
    description: "Heavy-duty 40A smart switch built specifically for high-wattage water heaters (boilers), air conditioners, and pumping machines.",
    features: [
      "40A / 8,000W heavy-duty load capacity",
      "Automate water heater to turn on 30 minutes before wake-up and auto-off",
      "Tempered glass touch front plate with flame retardant housing",
      "Eliminates wasted electricity from forgotten water heaters"
    ],
    best_for: "Water heaters (boilers), water pumping machines, 2HP+ AC units",
    bestFor: "Water heaters (boilers), water pumping machines, 2HP+ AC units",
    price: "₦38,000",
    numeric_price: 38000,
    tier: "entry",
    image_url: "/products/core/tioga-water-heater-40a.webp",
    specifications: {
      "Max Current": "40A Resistive Load (8,000W Max)",
      "Protocol": "WiFi 2.4GHz",
      "Warranty": "18-Month Warranty"
    },
    rating: 4.9,
    review_count: 17,
    stock_status: "in_stock",
    warranty_years: 1.5,
    tags: ["boiler switch", "water heater", "40a", "heavy duty", "automation"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000035",
    serial_number: "TG-AUT-0006",
    sku: "TG-AUT-0006",
    name: "Tioga Smart Universal WiFi IR/RF Remote Controller Hub",
    category: "Home Automation",
    series: "Smart Accessories",
    brand: "Tioga IoT",
    description: "Replaces all your physical TV, Air Conditioner, and decoder remotes with your smartphone and voice control.",
    features: [
      "360° omnidirectional infrared coverage controls ACs, TVs, soundbars",
      "433MHz RF transmitter controls motorized curtains and gate remotes",
      "Set temperature schedules so AC turns on before you arrive home",
      "Pre-loaded with 50,000+ appliance brands"
    ],
    best_for: "Automating split AC units, home entertainment systems",
    bestFor: "Automating split AC units, home entertainment systems",
    price: "₦24,000",
    numeric_price: 24000,
    tier: "entry",
    image_url: "/products/core/tioga-universal-ir-hub.webp",
    specifications: {
      "Coverage": "8m 360° IR Radius + 433MHz RF",
      "Compatibility": "Universal (LG, Samsung, Panasonic, Gree, Sony, etc.)",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.8,
    review_count: 22,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["remote hub", "ir remote", "automation", "ac control", "tioga iot"]
  }
];

export const cctvList: Product[] = [
  {
    id: "a0000000-0000-0000-0000-000000000032",
    serial_number: "TG-CAM-0001",
    sku: "TG-CAM-0001",
    name: "Tioga 1080p Smart WiFi Indoor Pan/Tilt Security Camera",
    category: "CCTV",
    series: "Smart Vision",
    brand: "Tioga CCTV",
    description: "Compact 360° pan-tilt indoor smart security camera with AI human motion tracking, infrared night vision, and two-way audio talk.",
    features: [
      "Full 1080p HD video with 355° horizontal and 90° vertical rotation",
      "AI human detection auto-tracks movement across the room",
      "Two-way audio allows talking with family or pets through smartphone",
      "Clear infrared night vision up to 10 meters in pitch darkness",
      "MicroSD card (up to 128GB) and secure encrypted cloud recording"
    ],
    best_for: "Nurseries, living rooms, shops, reception desks, pet monitoring",
    bestFor: "Nurseries, living rooms, shops, reception desks, pet monitoring",
    price: "₦35,000",
    numeric_price: 35000,
    tier: "entry",
    image_url: "/products/core/tioga-1080p-ptz-indoor.webp",
    specifications: {
      "Resolution": "1080p Full HD (1920 x 1080)",
      "FOV": "360° Panoramic View (Pan/Tilt)",
      "Night Vision": "IR LEDs up to 10m",
      "Audio": "Built-in Mic and Speaker",
      "Storage": "MicroSD slot up to 128GB + Cloud",
      "Warranty": "1-Year Warranty"
    },
    rating: 4.9,
    review_count: 29,
    stock_status: "in_stock",
    warranty_years: 1,
    tags: ["cctv", "camera", "indoor", "wifi", "ptz", "security"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000033",
    serial_number: "TG-CAM-0002",
    sku: "TG-CAM-0002",
    name: "Tioga 2K HD Outdoor Weatherproof IP66 Security Bullet Camera",
    category: "CCTV",
    series: "Pro Surveillance",
    brand: "Tioga CCTV",
    description: "Heavy-duty outdoor security camera with 2K crystal resolution, full-color spotlight night vision, deterrence siren, and IP66 weatherproof metal housing.",
    features: [
      "2K QHD (2560 x 1440) ultra-crisp resolution",
      "Full-color night vision with dual motion-activated spotlights",
      "Active deterrence with customizable strobe light and loud siren alarm",
      "IP66 aluminum weatherproof casing withstands heavy tropical downpours",
      "Dual external WiFi antennas for long-distance perimeter signal strength"
    ],
    best_for: "Compound perimeters, driveway gates, parking lots, warehouses",
    bestFor: "Compound perimeters, driveway gates, parking lots, warehouses",
    price: "₦58,000",
    numeric_price: 58000,
    tier: "mid",
    image_url: "/products/core/tioga-2k-outdoor-bullet.webp",
    specifications: {
      "Resolution": "2K QHD (4 Megapixels)",
      "Weatherproofing": "IP66 Heavy Rain & Dust Proof",
      "Night Vision": "30m Full Color Spotlight + IR",
      "Alarm": "Motion Siren & Flashing Strobe",
      "Warranty": "2-Year Warranty"
    },
    rating: 5.0,
    review_count: 21,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["cctv", "camera", "outdoor", "ip66", "2k", "bullet", "security"]
  },
  {
    id: "a0000000-0000-0000-0000-000000000034",
    serial_number: "TG-CAM-0003",
    sku: "TG-CAM-0003",
    name: "Tioga 4MP Vandal-Proof Commercial Dome Camera",
    category: "CCTV",
    series: "Pro Surveillance",
    brand: "Tioga CCTV",
    description: "IK10 vandal-proof discreet dome camera with wide-angle lens, Power over Ethernet (PoE), and high-resolution face capture.",
    features: [
      "IK10 vandal-resistant impact rated glass dome",
      "110° wide-angle lens for full room coverage with zero blind spots",
      "PoE (Power over Ethernet) support for single-cable clean installation",
      "Smart face and vehicle classification AI"
    ],
    best_for: "Retail supermarkets, office corridors, bank branches, schools",
    bestFor: "Retail supermarkets, office corridors, bank branches, schools",
    price: "₦64,000",
    numeric_price: 64000,
    tier: "mid",
    image_url: "/products/core/tioga-4mp-dome-camera.webp",
    specifications: {
      "Resolution": "4MP (2560 x 1440)",
      "Vandal Rating": "IK10 Impact Proof",
      "Power": "12Vdc / PoE (802.3af)",
      "Warranty": "2-Year Warranty"
    },
    rating: 4.9,
    review_count: 14,
    stock_status: "in_stock",
    warranty_years: 2,
    tags: ["cctv", "dome camera", "vandal proof", "commercial", "security"]
  }
];

import { MINISIM_PRODUCTS } from "./minisimProducts";

// Unified products array including solar hardware, smart locks, and complete Minisim retail catalog
export const PRODUCTS: Product[] = [
  ...invertersList,
  ...batteriesList,
  ...solarPanelsList,
  ...smartLocksList,
  ...smartHomeList,
  ...cctvList,
  ...MINISIM_PRODUCTS,
];

// Legacy backward-compatibility aliases
export const solarProducts = invertersList;
export const smartLockProducts = smartLocksList;
export const smartHomeProducts = smartHomeList;
export const cctvProducts = cctvList;

export type ProductInterest = "solar" | "panels" | "batteries" | "smarthome" | "smartlocks" | "cctv" | "full_solar" | "other";

export function getProductsForInterests(interests: ProductInterest[], budget?: string): Product[] {
  const results: Product[] = [];
  const solarInterests: ProductInterest[] = ["solar", "panels", "batteries", "full_solar"];
  if (interests.some((i) => solarInterests.includes(i))) {
    results.push(...invertersList, ...batteriesList, ...solarPanelsList);
  }
  if (interests.includes("smartlocks")) results.push(...smartLocksList);
  if (interests.includes("smarthome")) results.push(...smartHomeList);
  if (interests.includes("cctv")) results.push(...cctvList);

  return results;
}

export function groupBySeries(products: Product[]): Record<string, Product[]> {
  const groups: Record<string, Product[]> = {};
  for (const p of products) {
    const key = p.series || p.category;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

export default PRODUCTS;
