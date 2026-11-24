import { describe, it, expect } from "vitest";
import { footerLinks } from "@/lib/footerLinks";
import {
  buildAdsLeadPayload,
  calculateConfiguratorWatts,
  mapGoalsToServices,
  mapServicesToProducts,
  matchAutomationPackage,
  matchCctvPackage,
  matchSmartLocks,
  recommendSolarPackage,
  resolveCampaignConfig,
} from "@/lib/adsLandingLogic";
import { OFFICIAL_LITHIUM_PACKAGES } from "@/hooks/useSolarPackages";
import { CCTV_FALLBACK, type CctvPackage } from "@/hooks/useCctvPackages";
import type { SmartLock } from "@/hooks/useSmartLocks";
import type { HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";

const SAMPLE_LOCKS: SmartLock[] = [
  {
    id: "lock-base",
    category: "lock",
    series: "Base",
    model: "X04",
    name: "X04 Budget WiFi Lock",
    tagline: "Smart apartment lock",
    description: "Great for 1-2 bedroom flats and shortlets",
    price: 185000,
    price_label: "₦185,000",
    features: ["Fingerprint", "PIN", "App"],
    power_system: "4x AA",
    ideal_for: "Apartment, Flat, Shortlet",
    badge: null,
    is_active: true,
    sort_order: 1,
    image: "/products/core/stama-x04-budget.webp",
  },
  {
    id: "lock-pro-glass",
    category: "lock",
    series: "Pro",
    model: "G290",
    name: "G290 Frameless Glass Office Lock",
    tagline: "Office glass door access",
    description: "Designed for commercial glass and aluminum office doors",
    price: 260000,
    price_label: "₦260,000",
    features: ["Fingerprint", "RFID", "PIN"],
    power_system: "4x AA",
    ideal_for: "Office, Commercial Glass Door",
    badge: null,
    is_active: true,
    sort_order: 2,
    image: "/products/core/stama-g290-glass.webp",
  },
  {
    id: "lock-elite",
    category: "lock",
    series: "Elite",
    model: "K209",
    name: "K209 3D Face ID Video Intercom Lock",
    tagline: "Flagship biometric security",
    description: "3D Face recognition with built-in intercom for duplex entrances",
    price: 540000,
    price_label: "₦540,000",
    features: ["3D Face ID", "Video Intercom", "Fingerprint"],
    power_system: "Lithium rechargeable",
    ideal_for: "Duplex, Luxury Residence",
    badge: "Flagship",
    is_active: true,
    sort_order: 3,
    image: "/products/core/stama-k209-face-lock.webp",
  },
  {
    id: "lock-hotel",
    category: "hotel",
    series: "Hotel",
    model: "HT01",
    name: "Centralized Hotel Card Lock System",
    tagline: "Hospitality access",
    description: "Full hotel and estate management software with RFID cards",
    price: 195000,
    price_label: "₦195,000",
    features: ["RFID Management", "Audit Trail"],
    power_system: "4x AA",
    ideal_for: "Hotel, Estate, Shortlet",
    badge: null,
    is_active: true,
    sort_order: 4,
    image: "/products/core/stama-hotel-system.webp",
  },
  {
    id: "lock-acc",
    category: "accessory",
    series: "Accessories",
    model: "GW1",
    name: "WiFi Gateway",
    tagline: null,
    description: "Gateway bridge",
    price: 45000,
    price_label: "₦45,000",
    features: ["Remote unlock"],
    power_system: "USB",
    ideal_for: "All locks",
    badge: null,
    is_active: true,
    sort_order: 5,
    image: "/products/core/stama-lock-gateway.webp",
  },
];

const SAMPLE_CCTV: CctvPackage[] = CCTV_FALLBACK.map((c) => ({
  ...c,
  image: "/products/categories/cat-cctv.png",
}));

const SAMPLE_AUTOMATION: HomeAutomationPackage[] = [
  {
    id: "auto-apex",
    tier: "Apex",
    name: "Apex Smart Essentials",
    tagline: "Smart lighting & switches for apartments",
    description: "Entry whole-home automation",
    features: ["Smart Touch Switches", "Mobile App"],
    entertainment: [],
    price: 1_500_000,
    price_label: "From ₦1.5M",
    badge: null,
    is_active: true,
    sort_order: 1,
    image: "/products/core/pkg-automation-apex.webp",
  },
  {
    id: "auto-aura",
    tier: "Aura",
    name: "Aura Living Automation",
    tagline: "Curtains, climate & lighting for duplexes",
    description: "Mid-tier automation",
    features: ["Motorized Curtains", "Voice Control", "Climate"],
    entertainment: [],
    price: 3_500_000,
    price_label: "From ₦3.5M",
    badge: "Popular",
    is_active: true,
    sort_order: 2,
    image: "/products/core/pkg-automation-aura.webp",
  },
  {
    id: "auto-riviera",
    tier: "Riviera",
    name: "Riviera Estate Automation",
    tagline: "Flagship luxury estate & hotel control",
    description: "Flagship tier",
    features: ["Multi-Zone Audio", "Full Security", "Wall Panels"],
    entertainment: [],
    price: 7_500_000,
    price_label: "From ₦7.5M",
    badge: "Flagship",
    is_active: true,
    sort_order: 3,
    image: "/products/core/pkg-automation-riviera.webp",
  },
];

describe("Tioga Ads Landing Page (/get-started & /lp/:campaign)", () => {
  it("exports all footer link columns from one source of truth including /get-started in Support", () => {
    expect(footerLinks.company.map((l) => l.to)).toEqual([
      "/about",
      "/career",
      "/blog",
      "/contact",
      "/lumi",
      "/voltai",
    ]);
    expect(footerLinks.solutions.map((l) => l.to)).toEqual([
      "/solutions",
      "/solar-packages",
      "/smart-locks",
      "/home-automation",
      "/cctv",
      "/retail",
    ]);
    expect(footerLinks.support.some((l) => l.to === "/get-started" && l.label === "Get a Free Quote")).toBe(true);
    expect(footerLinks.support.some((l) => l.to === "/finance")).toBe(true);
    expect(footerLinks.support.some((l) => l.to === "/privacy")).toBe(true);
    expect(footerLinks.support.some((l) => l.to === "/terms")).toBe(true);
  });

  it("resolves known campaigns and falls back unknown campaigns to general", () => {
    expect(resolveCampaignConfig(undefined).slug).toBe("general");
    expect(resolveCampaignConfig("security").defaultServices).toEqual(["smart_locks", "cctv"]);
    expect(resolveCampaignConfig("smarthome").defaultServices).toEqual(["automation"]);
    expect(resolveCampaignConfig("energy").defaultServices).toEqual(["audit", "solar"]);
    expect(resolveCampaignConfig("bf26").slug).toBe("blackfriday");
    expect(resolveCampaignConfig("unknown-ad-set-99").slug).toBe("general");
  });

  it("recommends the smallest real solar package covering the appliance load with 25% headroom", () => {
    // 900W load -> 900 * 1.25 = 1.125kW -> Essential 1.5 (1.5kW)
    const small = recommendSolarPackage(OFFICIAL_LITHIUM_PACKAGES, 900, "flat");
    expect(small?.code).toBe("E1");
    expect(small?.total_price).toBe(1_064_500); // exact stored price, never multiplied

    // 2,200W load -> 2,200 * 1.25 = 2.75kW -> Essential 3 (3kW)
    const medium = recommendSolarPackage(OFFICIAL_LITHIUM_PACKAGES, 2200, "flat");
    expect(medium?.largest_load_kw).toBe(3);

    // 9,500W load -> 9,500 * 1.25 = 11.875kW -> 12kW Pro package
    const large = recommendSolarPackage(OFFICIAL_LITHIUM_PACKAGES, 9500, "office");
    expect(large?.largest_load_kw).toBe(12);

    // Empty catalogue returns null (no placeholders)
    expect(recommendSolarPackage([], 1500, "flat")).toBeNull();
  });

  it("matches smart locks, CCTV and automation tiers accurately by property type", () => {
    const hotelLocks = matchSmartLocks(SAMPLE_LOCKS, "estate_hotel", 2);
    expect(hotelLocks[0].id).toBe("lock-hotel");
    expect(hotelLocks.every((l) => l.category !== "accessory")).toBe(true);

    const officeLocks = matchSmartLocks(SAMPLE_LOCKS, "office", 2);
    expect(officeLocks[0].id).toBe("lock-pro-glass");

    expect(matchCctvPackage(SAMPLE_CCTV, "flat")?.channels).toBe(4);
    expect(matchCctvPackage(SAMPLE_CCTV, "duplex")?.channels).toBe(8);
    expect(matchCctvPackage([], "duplex")).toBeNull();

    expect(matchAutomationPackage(SAMPLE_AUTOMATION, "flat")?.tier).toBe("Apex");
    expect(matchAutomationPackage(SAMPLE_AUTOMATION, "duplex")?.tier).toBe("Aura");
    expect(matchAutomationPackage(SAMPLE_AUTOMATION, "estate_hotel")?.tier).toBe("Riviera");
    expect(matchAutomationPackage([], "duplex")).toBeNull();
  });

  it("calculates configurator watts and maps goals to services and product unions", () => {
    const watts = calculateConfiguratorWatts({ led_bulb: 10, fan: 2, fridge: 1 });
    expect(watts).toBe(10 * 10 + 2 * 75 + 200);

    const services = mapGoalsToServices(["backup_power", "secure_doors", "watch_property", "automate"]);
    expect(services).toEqual(expect.arrayContaining(["solar", "audit", "smart_locks", "cctv", "automation"]));

    const products = mapServicesToProducts(services);
    expect(products).toEqual(expect.arrayContaining(["solar", "panels", "batteries", "full_solar", "smartlocks", "cctv", "smarthome"]));
  });

  it("builds a complete LeadForm-compatible payload with normalized phone, UTM fields and structured notes", () => {
    const payload = buildAdsLeadPayload(
      {
        services: ["smart_locks", "cctv"],
        propertyType: "Duplex",
        location: "Wuse 2, Abuja",
        budget: "₦1M to ₦3M",
        systemType: "",
        usageDuration: "",
        appliances: [],
        estimatedWatts: 0,
        accessTypes: ["Fingerprint", "Face recognition"],
        cctvCoverage: ["Outdoor", "Full property"],
        automateWhat: [],
        controlPreference: "",
        automationScale: "",
        fullName: "Adaeze Nwosu",
        phone: "0803 123 4567",
        email: "adaeze@example.com",
        preferredContact: "WhatsApp",
        consent: true,
        extraNotes: "Front & back doors plus perimeter",
        matchedSummary: ["K209 3D Face ID Video Intercom Lock", "8-Channel Perimeter Surveillance System"],
      },
      {
        pathname: "/lp/security",
        campaign: "security",
        attribution: {
          utm_source: "facebook",
          utm_campaign: "bf26",
          utm_medium: "paid_social",
          fbclid: "fb_click_12345",
        },
      },
    );

    expect(payload.full_name).toBe("Adaeze Nwosu");
    expect(payload.phone).toBe("+2348031234567");
    expect(payload.products).toEqual(["smartlocks", "cctv"]);
    expect(payload.utm_source).toBe("facebook");
    expect(payload.utm_campaign).toBe("bf26");
    expect(payload.consent).toBe(true);
    expect(payload.notes).toContain("[Ads LP: /lp/security]");
    expect(payload.notes).toContain("Services: Smart Locks, CCTV & Security");
    expect(payload.notes).toContain("Property: Duplex");
    expect(payload.notes).toContain("Preferred: WhatsApp");
    expect(payload.notes).toContain("Matches: K209 3D Face ID Video Intercom Lock, 8-Channel Perimeter Surveillance System");
    expect(payload.notes).toContain("fbclid: fb_click_12345");
  });
});
