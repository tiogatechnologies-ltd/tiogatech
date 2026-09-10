import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";

/**
 * Shared source for CCTV packages.
 *
 * The /cctv listing previously fetched and shape-mapped these inline, and the
 * detail page did not exist at all. Both now read through here so the listing,
 * the detail page and the sitemap agree on one shape and one fallback.
 */

export type CctvPackage = {
  id: string;
  name: string;
  brand: string;
  tagline: string | null;
  badge: string | null;
  price: number | null;
  channels: number;
  specs: string[];
  features?: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  /** Always populated - DB image when set, otherwise a matching stock render. */
  image: string;
};

/**
 * Static fallback matching the seeded rows, so the page always has content even
 * if the table is unreachable. Ids match the seeded uuids' trailing segment
 * where possible so links stay stable.
 */
export const CCTV_FALLBACK: Omit<CctvPackage, "image">[] = [
  {
    id: "cctv-4ch",
    name: "4-Channel Smart AI CCTV Kit",
    brand: "Hikvision / Dahua Tier-1",
    tagline: "Ideal for 3-4 Bedroom Residences & Retail Stores",
    badge: "Most Popular",
    price: 480_000,
    channels: 4,
    specs: [
      "4x 5MP ColorVu Full-Color Cameras",
      "1TB Surveillance Hard Drive (30 Days)",
      "AI Human & Vehicle Motion Filtering",
      "4K PoE NVR with Remote Phone Streaming",
      "Complete Cabling & In-House Installation",
    ],
    image_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: "cctv-8ch",
    name: "8-Channel Perimeter Surveillance System",
    brand: "Hikvision Pro Series",
    tagline: "Full Perimeter Coverage for Duplexes & Commercial Offices",
    badge: "Commercial Grade",
    price: 920_000,
    channels: 8,
    specs: [
      "8x 5MP Audio-Enabled Weatherproof IP Cameras",
      "2TB High-Endurance NVR Storage",
      "Perimeter Tripwire & Intrusion Siren",
      "Night Vision up to 40 meters",
      "Free Expert Setup & Mobile App Onboarding",
    ],
    image_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    id: "cctv-solar-ptz",
    name: "4G Solar Standalone Dual-Lens PTZ Camera",
    brand: "Tioga Standalone Pro",
    tagline: "Zero Electricity & Zero WiFi Required - Built-in Solar & SIM Slot",
    badge: "100% Off-Grid",
    price: 165_000,
    channels: 0,
    specs: [
      "Integrated 20W Solar Panel + Lithium Battery",
      "4G LTE SIM Card Slot (Works on MTN/Airtel)",
      "360° Pan-Tilt-Zoom with Auto Motion Tracking",
      "Two-Way Audio Intercom & Flashing Warning Light",
      "128GB High-Speed MicroSD Included",
    ],
    image_url: null,
    is_active: true,
    sort_order: 3,
  },
];

/** Prefers the DB image, else a render matching the kit type. */
export const resolveCctvImage = (pkg: { id: string; image_url: string | null; channels?: number }, idx = 0) => {
  if (pkg.image_url) return pkg.image_url;
  if (pkg.id.includes("solar") || pkg.channels === 0) return "/products/core/pkg-cctv-solar-ptz.webp";
  if (pkg.id.includes("8ch") || (pkg.channels ?? 0) >= 8) return "/products/core/pkg-cctv-8ch-kit.webp";
  if (pkg.id.includes("4ch") || (pkg.channels ?? 0) > 0) return "/products/core/pkg-cctv-4ch-kit.webp";
  return idx % 2 === 0 ? "/products/core/pkg-cctv-4ch-kit.webp" : "/products/core/pkg-cctv-8ch-kit.webp";
};

const decorate = (rows: any[]): CctvPackage[] =>
  rows.map((p, idx) => ({
    ...p,
    specs: Array.isArray(p.specs) ? p.specs : [],
    features: Array.isArray(p.features) ? p.features : [],
    image: resolveCctvImage(p, idx),
  })) as CctvPackage[];

export const useCctvPackages = () => {
  const [packages, setPackages] = useState<CctvPackage[]>(() => decorate(CCTV_FALLBACK as any[]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await fetchFreshRows<any>(
        "cctv_packages?select=*&is_active=eq.true&order=sort_order.asc",
      );
      if (!active) return;
      // On error or an empty table the static fallback stays in place.
      if (!error && data && (data as any[]).length > 0) {
        setPackages(decorate(data as any[]));
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
