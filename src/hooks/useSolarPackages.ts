import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";
import { getCached, setCached, getOrCreateInflight, invalidateCached } from "@/lib/sessionDataCache";
import { fetchPackageImagesMap } from "@/lib/packageImages";

export type SolarPackageBoqItem = {
  component: string;
  item: string;
  spec: string;
  sku: string;
  qty: number;
  unit_price: number;
  line_total: number;
  warranty: string;
};

export type SolarPackage = {
  id: string;
  package_number: number;
  battery_type: "lithium" | "tubular" | "high_voltage";
  code?: string;
  name?: string;
  tier?: "Essential" | "Core" | "Pro";
  brand?: "SRNE" | "itel";
  best_for?: string;
  inverter: string;
  inverter_price: number | null;
  solar_panels: string;
  solar_panels_price: number | null;
  battery: string;
  battery_price: number | null;
  charge_controller: string;
  charge_controller_price: number | null;
  accessories_price: number | null;
  setup_fee: number | null;
  total_price: number;
  appliances: string;
  tagline: string | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
  image: string;
  largest_load_kw?: number;
  solar_per_day_kwh?: number;
  usable_battery_kwh?: number;
  daily_use_kwh?: number;
  night_backup_hours?: string;
  addon_battery?: string;
  grows_into?: string;
  boq_items?: SolarPackageBoqItem[];
};

const LITHIUM_CODE_TO_IMAGE: Record<string, string> = {
  E1: "/products/packages/lithium-e1.webp",
  E2: "/products/packages/lithium-e2.webp",
  E3: "/products/packages/lithium-e3.webp",
  C1: "/products/packages/lithium-c1.webp",
  C2: "/products/packages/lithium-c2.webp",
  C3: "/products/packages/lithium-c3.webp",
  C4: "/products/packages/lithium-c4.webp",
  P1: "/products/packages/lithium-p1.webp",
  P2: "/products/packages/lithium-p2.webp",
  P3: "/products/packages/lithium-p3.webp",
  P4: "/products/packages/lithium-p4.webp",
  P5: "/products/packages/lithium-p5.webp",
};

/**
 * The 12 official Tioga Solar Lithium Packages (Black Friday 2026 Master Catalog)
 * grouped into three clear tiers: Essential (1.5kW–3kW), Core (4kW–8kW), and Pro (12kW–24kW & 3-Phase).
 * Every package pairs itel or SRNE inverters and LiFePO4 batteries from the same brand with Sungene monocrystalline panels.
 */
export const OFFICIAL_LITHIUM_PACKAGES: SolarPackage[] = [
  {
    id: "ba0bd7f7-f19c-4919-8385-5317e20aa989",
    package_number: 1,
    code: "E1",
    name: "Essential 1.5",
    tier: "Essential",
    brand: "SRNE",
    best_for: "Studio, 1-bedroom flat, small shop or kiosk",
    battery_type: "lithium",
    inverter: "SRNE HF1215S60-108 1.5kW 12V Single-Phase Inverter (60A MPPT)",
    inverter_price: 345800,
    battery: "SRNE EOS02B-12 2.56kWh 12V 200Ah LiFePO4 Battery (6000 cycles)",
    battery_price: 548600,
    solar_panels: "3 × Sungene 330W Monocrystalline Panel (0.99kWp)",
    solar_panels_price: 170100,
    charge_controller: "Built-in 60A MPPT (Max PV Voc 100Vdc)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 1064500,
    appliances: "8 LED bulbs, 2 fans, 1 TV, 1 laptop",
    tagline: "Studio, 1-bedroom flat, small shop or kiosk · ~6 hrs night backup at 320W",
    badge: "BLACK FRIDAY ENTRY",
    is_active: true,
    sort_order: 1,
    image: "/products/packages/lithium-e1.webp",
    largest_load_kw: 1.5,
    solar_per_day_kwh: 3.6,
    usable_battery_kwh: 2.0,
    daily_use_kwh: 2.6,
    night_backup_hours: "~6 hours (at 320W)",
    addon_battery: "+2.56kWh for ₦704,600 (1 × EOS02B-12 ₦548,600 + 1 × DCB-2 ₦156,000; usable rises to 4.1 kWh)",
    grows_into: "Battery bank grows to 4 units (10.24kWh). The 12V inverter does not parallel, so a growing user moves up a tier.",
    boq_items: [
      {
        component: "Inverter",
        item: "SRNE HF1215S60-108",
        spec: "1.5kW 12V single-phase, 60A MPPT, max PV Voc 100Vdc",
        sku: "INV-005",
        qty: 1,
        unit_price: 345800,
        line_total: 345800,
        warranty: "2 yrs",
      },
      {
        component: "Battery",
        item: "SRNE EOS02B-12",
        spec: "2.56kWh 12V 200Ah LiFePO4, 6000 cycles @ 80% DOD",
        sku: "BAT-006",
        qty: 1,
        unit_price: 548600,
        line_total: 548600,
        warranty: "5 yrs",
      },
      {
        component: "Solar Panels",
        item: "Sungene 330W Panel",
        spec: "0.99kWp array (3 × 330W)",
        sku: "PNL-004",
        qty: 3,
        unit_price: 56700,
        line_total: 170100,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "ff732da5-777d-4dc6-a5f4-99b6a47126d3",
    package_number: 2,
    code: "E2",
    name: "Essential 3",
    tier: "Essential",
    brand: "itel",
    best_for: "1 to 2-bedroom flat, shop or small office",
    battery_type: "lithium",
    inverter: "itel IPV-3K24UPRO 3kW 24V Single-Phase Off-Grid Hybrid Inverter (IP54)",
    inverter_price: 328900,
    battery: "itel IPW-25100 2.5kWh 24V 100Ah Wall-Mount LiFePO4 Battery (6000+ cycles)",
    battery_price: 601700,
    solar_panels: "2 × Sungene 650W Monocrystalline Panel (1.30kWp)",
    solar_panels_price: 288000,
    charge_controller: "Built-in 99.9% MPPT Solar Controller",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 1218600,
    appliances: "10 LED bulbs, 3 fans, 1 TV, 2 laptops",
    tagline: "1 to 2-bedroom flat, shop or small office · ~5 hrs night backup at 400W",
    badge: null,
    is_active: true,
    sort_order: 2,
    image: "/products/packages/lithium-e2.webp",
    largest_load_kw: 3,
    solar_per_day_kwh: 4.7,
    usable_battery_kwh: 2.0,
    daily_use_kwh: 3.7,
    night_backup_hours: "~5 hours (at 400W)",
    addon_battery: "+2.5kWh for ₦757,700 (1 × itel IPW-25100 ₦601,700 + 1 × DCB-2 ₦156,000; usable rises to 4.0 kWh)",
    grows_into: "Battery bank grows to 15 units. Not listed as parallel-capable.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-3K24UPRO",
        spec: "3kW 24V single-phase off-grid hybrid, IP54, 99.9% MPPT",
        sku: "INV-015",
        qty: 1,
        unit_price: 328900,
        line_total: 328900,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPW-25100",
        spec: "2.5kWh 24V 100Ah wall-mount LiFePO4, 6000+ cycles",
        sku: "BAT-005",
        qty: 1,
        unit_price: 601700,
        line_total: 601700,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "1.30kWp array (2 × 650W)",
        sku: "PNL-017",
        qty: 2,
        unit_price: 144000,
        line_total: 288000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "3e4d7ab2-302d-4c8d-b2bd-e1a666564564",
    package_number: 3,
    code: "E3",
    name: "Essential 3 Plus",
    tier: "Essential",
    brand: "itel",
    best_for: "2-bedroom flat with a fridge",
    battery_type: "lithium",
    inverter: "itel IPV-3K24UPRO 3kW 24V Single-Phase Off-Grid Hybrid Inverter (IP54)",
    inverter_price: 328900,
    battery: "itel IPL-25200X 5kWh 24V 200Ah Wall-Mount LiFePO4 Battery (6000+ cycles)",
    battery_price: 1037300,
    solar_panels: "3 × Sungene 650W Monocrystalline Panel (1.95kWp)",
    solar_panels_price: 432000,
    charge_controller: "Built-in 99.9% MPPT Solar Controller",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 1798200,
    appliances: "12 LED bulbs, 3 fans, 2 TVs, 2 laptops, 1 fridge",
    tagline: "2-bedroom flat with a fridge · ~7 hrs night backup at 590W",
    badge: "FRIDGE READY",
    is_active: true,
    sort_order: 3,
    image: "/products/packages/lithium-e3.webp",
    largest_load_kw: 3,
    solar_per_day_kwh: 7.0,
    usable_battery_kwh: 4.0,
    daily_use_kwh: 5.8,
    night_backup_hours: "~7 hours (at 590W)",
    addon_battery: "+5kWh for ₦1,193,300 (1 × itel IPL-25200X ₦1,037,300 + 1 × DCB-2 ₦156,000; usable rises to 8.0 kWh)",
    grows_into: "Same inverter as Essential 3 with twice the battery. Battery bank grows to 15 units.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-3K24UPRO",
        spec: "3kW 24V single-phase off-grid hybrid, IP54, 99.9% MPPT",
        sku: "INV-015",
        qty: 1,
        unit_price: 328900,
        line_total: 328900,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-25200X",
        spec: "5kWh 24V 200Ah wall-mount LiFePO4, 6000+ cycles",
        sku: "BAT-015",
        qty: 1,
        unit_price: 1037300,
        line_total: 1037300,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "1.95kWp array (3 × 650W)",
        sku: "PNL-017",
        qty: 3,
        unit_price: 144000,
        line_total: 432000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "db9963dc-6a18-4526-845f-c98f3fb5c28e",
    package_number: 4,
    code: "C1",
    name: "Core 4",
    tier: "Core",
    brand: "itel",
    best_for: "2 to 3-bedroom apartment",
    battery_type: "lithium",
    inverter: "itel IPV-4K24UPRO 4kW 24V Single-Phase Hybrid Inverter (WiFi, Dual Output, 120A MPPT)",
    inverter_price: 416900,
    battery: "itel IPL-25200X 5kWh 24V 200Ah Wall-Mount LiFePO4 Battery (6000+ cycles)",
    battery_price: 1037300,
    solar_panels: "4 × Sungene 650W Monocrystalline Panel (2.60kWp)",
    solar_panels_price: 576000,
    charge_controller: "Built-in 120A MPPT (Up to 6kW PV Input)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 2030200,
    appliances: "15 LED bulbs, 4 fans, 2 TVs, 2 laptops, 1 fridge, 1 water pump",
    tagline: "2 to 3-bedroom apartment · ~6 hrs night backup at 680W",
    badge: null,
    is_active: true,
    sort_order: 4,
    image: "/products/packages/lithium-c1.webp",
    largest_load_kw: 4,
    solar_per_day_kwh: 9.4,
    usable_battery_kwh: 4.0,
    daily_use_kwh: 6.8,
    night_backup_hours: "~6 hours (at 680W)",
    addon_battery: "+5kWh for ₦1,193,300 (1 × itel IPL-25200X ₦1,037,300 + 1 × DCB-2 ₦156,000; usable rises to 8.0 kWh)",
    grows_into: "Battery bank grows to 15 units. The 4kW inverter is not listed as parallel-capable and its 24V battery does not carry over to 48V packages.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-4K24UPRO",
        spec: "4kW 24V single-phase hybrid, IP54, WiFi, dual output, 6kW PV, 120A MPPT",
        sku: "INV-025",
        qty: 1,
        unit_price: 416900,
        line_total: 416900,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-25200X",
        spec: "5kWh 24V 200Ah wall-mount LiFePO4, 6000+ cycles",
        sku: "BAT-015",
        qty: 1,
        unit_price: 1037300,
        line_total: 1037300,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "2.60kWp array (4 × 650W)",
        sku: "PNL-017",
        qty: 4,
        unit_price: 144000,
        line_total: 576000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "8bc5e8ee-5622-415d-a316-148112cdbf0c",
    package_number: 5,
    code: "C2",
    name: "Core 5",
    tier: "Core",
    brand: "SRNE",
    best_for: "3-bedroom apartment, shop or small office",
    battery_type: "lithium",
    inverter: "SRNE AFP4850S100-H 5kW 48V Single-Phase Hybrid Inverter (80A MPPT, Parallel up to 6)",
    inverter_price: 595400,
    battery: "SRNE SE05B 5.12kWh 48V 100Ah LiFePO4 Battery (WiFi & Bluetooth, 6000 cycles)",
    battery_price: 1238900,
    solar_panels: "6 × Sungene 650W Monocrystalline Panel (3.90kWp)",
    solar_panels_price: 864000,
    charge_controller: "Built-in 80A MPPT (Max PV Voc 500Vdc)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 2698300,
    appliances: "15 LED bulbs, 4 fans, 3 TVs, 3 laptops, 1 fridge, 1 freezer, 1 water pump",
    tagline: "3-bedroom apartment, shop or small office · Parallels up to 30kW",
    badge: "PARALLELS TO 30KW",
    is_active: true,
    sort_order: 5,
    image: "/products/packages/lithium-c2.webp",
    largest_load_kw: 5,
    solar_per_day_kwh: 14.0,
    usable_battery_kwh: 4.1,
    daily_use_kwh: 9.5,
    night_backup_hours: "~5 hours (at 863W)",
    addon_battery: "+5.12kWh for ₦1,394,900 (1 × SE05B ₦1,238,900 + 1 × DCB-2 ₦156,000; usable rises to 8.2 kWh)",
    grows_into: "Parallels up to 6 units (30kW). Battery bank grows to 16 units (81.92kWh). The best Core package for a business that will grow.",
    boq_items: [
      {
        component: "Inverter",
        item: "SRNE AFP4850S100-H",
        spec: "5kW 48V single-phase hybrid, 80A MPPT, parallel up to 6 units, max PV Voc 500Vdc",
        sku: "INV-035",
        qty: 1,
        unit_price: 595400,
        line_total: 595400,
        warranty: "2 yrs",
      },
      {
        component: "Battery",
        item: "SRNE SE05B",
        spec: "5.12kWh 48V 100Ah LiFePO4, WiFi & Bluetooth, up to 16 parallel, 6000 cycles",
        sku: "BAT-040",
        qty: 1,
        unit_price: 1238900,
        line_total: 1238900,
        warranty: "5 yrs",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "3.90kWp array (6 × 650W)",
        sku: "PNL-017",
        qty: 6,
        unit_price: 144000,
        line_total: 864000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "8d51c85d-2222-46c9-a21c-7e5c5556e393",
    package_number: 6,
    code: "C3",
    name: "Core 6",
    tier: "Core",
    brand: "itel",
    best_for: "3-bedroom apartment or flat with a freezer",
    battery_type: "lithium",
    inverter: "itel IPV-6K48UPRO 6kW 48V Single-Phase Hybrid Inverter (IP54, WiFi, 120A MPPT)",
    inverter_price: 561000,
    battery: "itel IPL-51200H 10kWh 48V 200Ah Standing LiFePO4 Battery (3A Active Balancing)",
    battery_price: 1903000,
    solar_panels: "6 × Sungene 650W Monocrystalline Panel (3.90kWp)",
    solar_panels_price: 864000,
    charge_controller: "Built-in 120A MPPT (Up to 8kW PV Input)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 3328000,
    appliances: "20 LED bulbs, 5 fans, 3 TVs, 3 laptops, 1 fridge, 1 freezer, 1 water pump",
    tagline: "3-bedroom apartment or flat with a freezer · ~8 hrs night backup at 973W",
    badge: null,
    is_active: true,
    sort_order: 6,
    image: "/products/packages/lithium-c3.webp",
    largest_load_kw: 6,
    solar_per_day_kwh: 14.0,
    usable_battery_kwh: 8.0,
    daily_use_kwh: 10.3,
    night_backup_hours: "~8 hours (at 973W)",
    addon_battery: "+10kWh for ₦2,059,000 (1 × itel IPL-51200H ₦1,903,000 + 1 × DCB-2 ₦156,000; usable rises to 16.0 kWh)",
    grows_into: "Solar can grow to 8kW on the same inverter. Not listed as parallel-capable; for growth beyond 6kW move to Core 8.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-6K48UPRO",
        spec: "6kW 48V single-phase hybrid, IP54, WiFi, dual output, 8kW PV, 120A MPPT",
        sku: "INV-053",
        qty: 1,
        unit_price: 561000,
        line_total: 561000,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-51200H",
        spec: "10kWh 48V 200Ah standing LiFePO4, 3A active balancing, 6000+ cycles",
        sku: "BAT-055",
        qty: 1,
        unit_price: 1903000,
        line_total: 1903000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "3.90kWp array (6 × 650W)",
        sku: "PNL-017",
        qty: 6,
        unit_price: 144000,
        line_total: 864000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "be31f24b-45c5-4bf2-9bd0-d9a959710df3",
    package_number: 7,
    code: "C4",
    name: "Core 8",
    tier: "Core",
    brand: "itel",
    best_for: "3-bedroom apartment with one AC, small office",
    battery_type: "lithium",
    inverter: "itel IPV-8K48U 8kW 48V Single-Phase Hybrid Inverter (16kW PV, 160A MPPT, Parallel up to 12)",
    inverter_price: 784300,
    battery: "itel IPL-51200H 10kWh 48V 200Ah Standing LiFePO4 Battery (3A Active Balancing)",
    battery_price: 1903000,
    solar_panels: "8 × Sungene 650W Monocrystalline Panel (5.20kWp)",
    solar_panels_price: 1152000,
    charge_controller: "Built-in 160A MPPT (Up to 16kW PV Input)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 3839300,
    appliances: "20 LED bulbs, 5 fans, 3 TVs, 3 laptops, 1 fridge, 1 freezer, 1 × 1HP inverter AC (daytime), 1 water pump",
    tagline: "3-bedroom apartment with one AC, small office · ~8 hrs night backup at 973W",
    badge: "POWERS 1HP AC",
    is_active: true,
    sort_order: 7,
    image: "/products/packages/lithium-c4.webp",
    largest_load_kw: 8,
    solar_per_day_kwh: 18.7,
    usable_battery_kwh: 8.0,
    daily_use_kwh: 15.7,
    night_backup_hours: "~8 hours (at 973W)",
    addon_battery: "+10kWh for ₦2,059,000 (1 × itel IPL-51200H ₦1,903,000 + 1 × DCB-2 ₦156,000; usable rises to 16.0 kWh)",
    grows_into: "Parallels up to 12 units. Solar grows to 16kW per inverter, batteries to 15 units.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-8K48U",
        spec: "8kW 48V single-phase hybrid, IP54, WiFi, 16kW PV, 160A MPPT, up to 12 in parallel",
        sku: "INV-066",
        qty: 1,
        unit_price: 784300,
        line_total: 784300,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-51200H",
        spec: "10kWh 48V 200Ah standing LiFePO4, 3A active balancing, 6000+ cycles",
        sku: "BAT-055",
        qty: 1,
        unit_price: 1903000,
        line_total: 1903000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "5.20kWp array (8 × 650W)",
        sku: "PNL-017",
        qty: 8,
        unit_price: 144000,
        line_total: 1152000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "c167d700-9f50-480b-a534-2b7a982e8e26",
    package_number: 8,
    code: "P1",
    name: "Pro 12",
    tier: "Pro",
    brand: "itel",
    best_for: "4 to 5-bedroom house, clinic or office",
    battery_type: "lithium",
    inverter: "itel IPV-12K48U 12kW 48V Single-Phase Hybrid Inverter (16kW PV, 210A MPPT, Parallel up to 12)",
    inverter_price: 1089000,
    battery: "itel IPL-51314H 16kWh 48V 300Ah Standing IP21 LiFePO4 Battery (3A Active Balancing)",
    battery_price: 2244000,
    solar_panels: "16 × Sungene 650W Monocrystalline Panel (10.40kWp)",
    solar_panels_price: 2304000,
    charge_controller: "Built-in 210A MPPT (Up to 16kW PV Input)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 5637000,
    appliances: "30 LED bulbs, 6 fans, 4 TVs, 4 laptops, 2 fridges, 1 freezer, 2 × 1HP inverter ACs (daytime), 1 borehole pump",
    tagline: "4 to 5-bedroom house, clinic or office · ~10 hrs night backup at 1,303W",
    badge: "BEST VALUE PER KWH",
    is_active: true,
    sort_order: 8,
    image: "/products/packages/lithium-p1.webp",
    largest_load_kw: 12,
    solar_per_day_kwh: 37.4,
    usable_battery_kwh: 12.8,
    daily_use_kwh: 25.7,
    night_backup_hours: "~10 hours (at 1,303W)",
    addon_battery: "+16kWh for ₦2,400,000 (1 × itel IPL-51314H ₦2,244,000 + 1 × DCB-2 ₦156,000; usable rises to 25.6 kWh)",
    grows_into: "Parallels up to 12 units. Solar grows to 16kW per inverter, batteries to 15 units.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-12K48U",
        spec: "12kW 48V single-phase hybrid, IP54, 16kW PV, 210A MPPT, up to 12 in parallel",
        sku: "INV-096",
        qty: 1,
        unit_price: 1089000,
        line_total: 1089000,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-51314H",
        spec: "16kWh 48V 300Ah standing IP21 LiFePO4, 3A active balancing, 6000+ cycles",
        sku: "BAT-091",
        qty: 1,
        unit_price: 2244000,
        line_total: 2244000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "10.40kWp array (16 × 650W)",
        sku: "PNL-017",
        qty: 16,
        unit_price: 144000,
        line_total: 2304000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "lithium-p2-srne-12kw",
    package_number: 20,
    code: "P2",
    name: "Pro 12 SRNE",
    tier: "Pro",
    brand: "SRNE",
    best_for: "4 to 5-bedroom house, clinic or office",
    battery_type: "lithium",
    inverter: "SRNE ASP48120S200-H 12kW 48V Single-Phase Grid/Off-Grid Hybrid Inverter (200A MPPT)",
    inverter_price: 1664000,
    battery: "SRNE SE15B 14.33kWh 51.2V 314Ah IP65 LiFePO4 Battery (WiFi & Bluetooth)",
    battery_price: 2848300,
    solar_panels: "16 × Sungene 650W Monocrystalline Panel (10.40kWp)",
    solar_panels_price: 2304000,
    charge_controller: "Built-in 200A MPPT (Max PV Voc 500Vdc)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 6816300,
    appliances: "30 LED bulbs, 6 fans, 4 TVs, 4 laptops, 2 fridges, 1 freezer, 2 × 1HP inverter ACs (daytime), 1 borehole pump",
    tagline: "4 to 5-bedroom house, clinic or office · IP65 battery & 200A MPPT",
    badge: "IP65 WEATHERPROOF BATTERY",
    is_active: true,
    sort_order: 8.1,
    image: "/products/packages/lithium-p2.webp",
    largest_load_kw: 12,
    solar_per_day_kwh: 37.4,
    usable_battery_kwh: 11.5,
    daily_use_kwh: 25.7,
    night_backup_hours: "~9 hours (at 1,303W)",
    addon_battery: "+14.33kWh for ₦3,004,300 (1 × SE15B ₦2,848,300 + 1 × DCB-2 ₦156,000; usable rises to 22.9 kWh)",
    grows_into: "Parallels up to 6 units (72kW). Battery bank grows to 16 units.",
    boq_items: [
      {
        component: "Inverter",
        item: "SRNE ASP48120S200-H",
        spec: "12kW 48V single-phase grid/off-grid hybrid, 200A MPPT, parallel up to 6 units, max PV Voc 500Vdc",
        sku: "INV-092",
        qty: 1,
        unit_price: 1664000,
        line_total: 1664000,
        warranty: "2 yrs",
      },
      {
        component: "Battery",
        item: "SRNE SE15B",
        spec: "14.33kWh 51.2V 314Ah LiFePO4, IP65, WiFi & Bluetooth, up to 16 parallel, 6000 cycles",
        sku: "BAT-070",
        qty: 1,
        unit_price: 2848300,
        line_total: 2848300,
        warranty: "5 yrs",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "10.40kWp array (16 × 650W)",
        sku: "PNL-017",
        qty: 16,
        unit_price: 144000,
        line_total: 2304000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "lithium-p3-itel-24kw",
    package_number: 21,
    code: "P3",
    name: "Pro 24",
    tier: "Pro",
    brand: "itel",
    best_for: "Large home or business, single-phase",
    battery_type: "lithium",
    inverter: "2 × itel IPV-12K48U 12kW 48V Single-Phase Hybrid Inverters (24kW Total, 210A MPPT each)",
    inverter_price: 2178000,
    battery: "2 × itel IPL-51314H 16kWh 48V 300Ah Standing LiFePO4 Batteries (32kWh Total)",
    battery_price: 4488000,
    solar_panels: "32 × Sungene 650W Monocrystalline Panel (20.80kWp)",
    solar_panels_price: 4608000,
    charge_controller: "Dual 210A MPPT + 1 × SRNE DCB-1 800A Battery Busbar Box (4-in / 4-out)",
    charge_controller_price: 148200,
    accessories_price: 148200,
    setup_fee: null,
    total_price: 11422200,
    appliances: "50 LED bulbs, 10 fans, 6 TVs, 8 laptops, 3 fridges, 2 freezers, 5 × 1HP inverter ACs (daytime), 1 borehole pump",
    tagline: "Large home or business, single-phase · 24kW output + 32kWh storage",
    badge: "24KW DUAL INVERTER",
    is_active: true,
    sort_order: 8.2,
    image: "/products/packages/lithium-p3.webp",
    largest_load_kw: 24,
    solar_per_day_kwh: 74.9,
    usable_battery_kwh: 25.6,
    daily_use_kwh: 51.1,
    night_backup_hours: "~12 hours (at 2,096W)",
    addon_battery: "+16kWh for ₦2,244,000 (1 × itel IPL-51314H ₦2,244,000; usable rises to 38.4 kWh)",
    grows_into: "Two 12kW inverters in parallel; up to 12 are supported. Each inverter takes up to 16kW of solar.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IPV-12K48U",
        spec: "24kW total (2 × 12kW 48V single-phase hybrid, IP54, 16kW PV each, 210A MPPT)",
        sku: "INV-096",
        qty: 2,
        unit_price: 1089000,
        line_total: 2178000,
        warranty: "3 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-51314H",
        spec: "32kWh total (2 × 16kWh 48V 300Ah standing IP21 LiFePO4)",
        sku: "BAT-091",
        qty: 2,
        unit_price: 2244000,
        line_total: 4488000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Busbar",
        item: "SRNE DCB-1",
        spec: "800A battery busbar box, 4-in / 4-out",
        sku: "ACC-010",
        qty: 1,
        unit_price: 148200,
        line_total: 148200,
        warranty: "1 yr",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "20.80kWp array (32 × 650W)",
        sku: "PNL-017",
        qty: 32,
        unit_price: 144000,
        line_total: 4608000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "lithium-p4-itel-12kw-3p",
    package_number: 22,
    code: "P4",
    name: "Pro 12 Three-Phase",
    tier: "Pro",
    brand: "itel",
    best_for: "Large house, school or business on a three-phase supply",
    battery_type: "lithium",
    inverter: "itel IHY-12KL3 12kW 48V Three-Phase Hybrid Inverter (IP66, 24kW PV, 150% Unbalanced Output)",
    inverter_price: 2574000,
    battery: "itel IPL-51314H 16kWh 48V 300Ah Standing IP21 LiFePO4 Battery (3A Active Balancing)",
    battery_price: 2244000,
    solar_panels: "16 × Sungene 650W Monocrystalline Panel (10.40kWp)",
    solar_panels_price: 2304000,
    charge_controller: "Built-in Dual MPPT (Up to 24kW PV Input)",
    charge_controller_price: null,
    accessories_price: null,
    setup_fee: null,
    total_price: 7122000,
    appliances: "30 LED bulbs, 6 fans, 4 TVs, 4 laptops, 2 fridges, 1 freezer, 2 × 1HP inverter ACs (daytime), 1 borehole pump",
    tagline: "Large house, school or business on a three-phase supply · 5-Yr Inverter & Battery Replacement Warranty",
    badge: "THREE-PHASE 12KW",
    is_active: true,
    sort_order: 8.3,
    image: "/products/packages/lithium-p4.webp",
    largest_load_kw: 12,
    solar_per_day_kwh: 37.4,
    usable_battery_kwh: 12.8,
    daily_use_kwh: 25.7,
    night_backup_hours: "~10 hours (at 1,303W)",
    addon_battery: "+16kWh for ₦2,400,000 (1 × itel IPL-51314H ₦2,244,000 + 1 × DCB-2 ₦156,000; usable rises to 25.6 kWh)",
    grows_into: "Parallels up to 12 units. Solar can grow to 24kW on this inverter.",
    boq_items: [
      {
        component: "Inverter",
        item: "itel IHY-12KL3",
        spec: "12kW 48V 3-phase hybrid, IP66, MPPT, 24kW PV, 150% unbalanced 3-phase output",
        sku: "INV-113",
        qty: 1,
        unit_price: 2574000,
        line_total: 2574000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Battery",
        item: "itel IPL-51314H",
        spec: "16kWh 48V 300Ah standing IP21 LiFePO4, 3A active balancing, 6000+ cycles",
        sku: "BAT-091",
        qty: 1,
        unit_price: 2244000,
        line_total: 2244000,
        warranty: "5 yrs replacement",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "10.40kWp array (16 × 650W)",
        sku: "PNL-017",
        qty: 16,
        unit_price: 144000,
        line_total: 2304000,
        warranty: "25 yrs",
      },
    ],
  },
  {
    id: "lithium-p5-srne-20kw-3p",
    package_number: 23,
    code: "P5",
    name: "Pro 20 Three-Phase",
    tier: "Pro",
    brand: "SRNE",
    best_for: "Office block, school, hotel or factory on three-phase",
    battery_type: "lithium",
    inverter: "SRNE ASP48200SH3 20kW 48V Three-Phase Hybrid Inverter (360A MPPT, 160–800V MPPT Range)",
    inverter_price: 3517800,
    battery: "2 × SRNE SE15B 14.33kWh 51.2V 314Ah IP65 LiFePO4 Batteries (28.66kWh Total)",
    battery_price: 5696600,
    solar_panels: "24 × Sungene 650W Monocrystalline Panel (15.60kWp)",
    solar_panels_price: 3456000,
    charge_controller: "Built-in 360A MPPT + 1 × SRNE DCB-1 800A Battery Busbar Box (4-in / 4-out)",
    charge_controller_price: 148200,
    accessories_price: 148200,
    setup_fee: null,
    total_price: 12818600,
    appliances: "40 LED bulbs, 10 fans, 6 TVs, 8 laptops, 2 fridges, 2 freezers, 4 × 1HP inverter ACs (daytime), 1 borehole pump",
    tagline: "Office block, school, hotel or factory on three-phase · 20kW 3-Phase + 28.66kWh IP65 Storage",
    badge: "COMMERCIAL 3-PHASE",
    is_active: true,
    sort_order: 8.4,
    image: "/products/packages/lithium-p5.webp",
    largest_load_kw: 20,
    solar_per_day_kwh: 56.2,
    usable_battery_kwh: 22.9,
    daily_use_kwh: 43.9,
    night_backup_hours: "~12 hours (at 1,946W)",
    addon_battery: "+14.33kWh for ₦2,848,300 (1 × SE15B ₦2,848,300; usable rises to 34.4 kWh)",
    grows_into: "Pairs with the SRNE ATS380S63-S3 three-phase transfer switch (ACC-016). For loads above 20kW, add units or move to a C&I design.",
    boq_items: [
      {
        component: "Inverter",
        item: "SRNE ASP48200SH3",
        spec: "20kW 48V three-phase hybrid, 360A MPPT, MPPT range 160–800V",
        sku: "INV-121",
        qty: 1,
        unit_price: 3517800,
        line_total: 3517800,
        warranty: "2 yrs",
      },
      {
        component: "Battery",
        item: "SRNE SE15B",
        spec: "28.66kWh total (2 × 14.33kWh 51.2V 314Ah LiFePO4, IP65, WiFi & Bluetooth)",
        sku: "BAT-070",
        qty: 2,
        unit_price: 2848300,
        line_total: 5696600,
        warranty: "5 yrs",
      },
      {
        component: "Busbar",
        item: "SRNE DCB-1",
        spec: "800A battery busbar box, 4-in / 4-out",
        sku: "ACC-010",
        qty: 1,
        unit_price: 148200,
        line_total: 148200,
        warranty: "1 yr",
      },
      {
        component: "Solar Panels",
        item: "Sungene 650W Panel",
        spec: "15.60kWp array (24 × 650W)",
        sku: "PNL-017",
        qty: 24,
        unit_price: 144000,
        line_total: 3456000,
        warranty: "25 yrs",
      },
    ],
  },
];

export function getSolarPackageImage(p: {
  package_number?: number;
  code?: string;
  inverter?: string;
  battery?: string;
  image?: string;
}): string {
  if (p.code && LITHIUM_CODE_TO_IMAGE[p.code.toUpperCase()]) {
    return LITHIUM_CODE_TO_IMAGE[p.code.toUpperCase()];
  }
  const num = p.package_number || 0;
  if (num >= 1 && num <= 19) {
    return `/products/packages/pkg-solar-${num}.webp`;
  }
  if (num === 20) return "/products/packages/lithium-p2.webp";
  if (num === 21) return "/products/packages/lithium-p3.webp";
  if (num === 22) return "/products/packages/lithium-p4.webp";
  if (num === 23) return "/products/packages/lithium-p5.webp";

  const inv = (p.inverter || "").toLowerCase();
  // Fallbacks by capacity if package_number is unassigned
  if (inv.includes("40kva") || inv.includes("36kw")) return "/products/packages/pkg-solar-17.webp";
  if (inv.includes("30kva")) return "/products/packages/pkg-solar-8.webp";
  if (inv.includes("20kva")) return "/products/packages/pkg-solar-7.webp";
  if (inv.includes("3 phase") || inv.includes("3-phase")) return "/products/packages/pkg-solar-5.webp";
  if (inv.includes("10kva")) return "/products/packages/pkg-solar-4.webp";
  if (inv.includes("7.5kva")) return "/products/packages/pkg-solar-3.webp";
  if (inv.includes("5kva") || inv.includes("5kw")) return "/products/packages/pkg-solar-2.webp";
  if (inv.includes("3.5kva") || inv.includes("3kva") || inv.includes("2.5kva")) return "/products/packages/pkg-solar-1.webp";
  if (inv.includes("1kva") || inv.includes("1.5kva")) return "/products/packages/pkg-solar-9.webp";

  return "/products/packages/pkg-solar-1.webp";
}

const decorate = (data: any[], imgMap: Record<string, string> = {}): SolarPackage[] => {
  // Replace outdated generic lithium rows with the 12 official Tioga Lithium Packages
  // (Essential E1-E3, Complete C1-C4, Pro P1-P5) while keeping tubular and high_voltage rows intact.
  const nonLithiumRows = data
    .filter((p) => p.battery_type !== "lithium")
    .map((p) => ({
      ...p,
      image:
        p.image_url && !p.image_url.startsWith("/products/minisim/")
          ? p.image_url
          : imgMap[p.id] || getSolarPackageImage(p),
    })) as SolarPackage[];

  const officialLithiumRows = OFFICIAL_LITHIUM_PACKAGES.map((pkg) => ({
    ...pkg,
    image:
      imgMap[pkg.id] && imgMap[pkg.id].startsWith("/products/packages/lithium-")
        ? imgMap[pkg.id]
        : pkg.image,
  }));

  return [...officialLithiumRows, ...nonLithiumRows];
};

const CACHE_KEY = "solar_packages_v3_lithium_core_bf2026";

/** Called by Admin > Solar Packages after a save so this tab's cache doesn't hide the edit. */
export function invalidateSolarPackagesCache() {
  invalidateCached(CACHE_KEY);
}

export const useSolarPackages = () => {
  const [packages, setPackages] = useState<SolarPackage[]>(
    () => getCached<SolarPackage[]>(CACHE_KEY) ?? OFFICIAL_LITHIUM_PACKAGES
  );
  const [loading, setLoading] = useState(() => !getCached<SolarPackage[]>(CACHE_KEY));

  useEffect(() => {
    const hit = getCached<SolarPackage[]>(CACHE_KEY);
    if (hit) {
      setPackages(hit);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchOnce = async (attempt = 0): Promise<SolarPackage[] | null> => {
      const [{ data, error }, imgMap] = await Promise.all([
        fetchFreshRows<any>("solar_packages?select=*&is_active=eq.true&order=sort_order.asc"),
        fetchPackageImagesMap(),
      ]);
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return fetchOnce(attempt + 1);
      }
      return data ? decorate(data as any[], imgMap) : OFFICIAL_LITHIUM_PACKAGES;
    };

    getOrCreateInflight(CACHE_KEY, async () => {
      const result = await fetchOnce();
      if (result) setCached(CACHE_KEY, result);
      return result;
    }).then((result) => {
      if (!active) return;
      if (result) setPackages(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { packages, loading };
};
