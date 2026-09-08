import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";
import bgAscentia from "@/assets/bg-lagos-apartment.jpg";
import bgSprout from "@/assets/feature-smart-automation-device.jpg";
import bgIbiza from "@/assets/hero-smart-home.jpg";

const IMAGE_BY_TIER: Record<string, string> = {
  Apex: "/products/core/pkg-automation-apex.webp",
  Aura: "/products/core/pkg-automation-aura.webp",
  Riviera: "/products/core/pkg-automation-riviera.webp",
  // legacy fallbacks
  Ascentia: "/products/core/pkg-automation-apex.webp",
  Sprout: "/products/core/pkg-automation-aura.webp",
  Ibiza: "/products/core/pkg-automation-riviera.webp",
};

export type HomeAutomationPackage = {
  id: string;
  tier: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  entertainment: string[];
  price: number | null;
  price_label: string | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
  image: string;
};

import { fetchPackageImagesMap } from "@/lib/packageImages";

const decorate = (rows: any[], imgMap: Record<string, string> = {}): HomeAutomationPackage[] =>
  rows.map((p) => ({
    ...p,
    image: p.image_url || imgMap[p.id] || (IMAGE_BY_TIER[p.tier] ?? bgAscentia),
  })) as HomeAutomationPackage[];

export const useHomeAutomationPackages = () => {
  const [packages, setPackages] = useState<HomeAutomationPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async (attempt = 0): Promise<void> => {
      const [{ data, error }, imgMap] = await Promise.all([
        fetchFreshRows<any>("home_automation_packages?select=*&is_active=eq.true&order=sort_order.asc"),
        fetchPackageImagesMap(),
      ]);
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return run(attempt + 1);
      }
      if (data) {
        setPackages(decorate(data as any[], imgMap));
      }
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
