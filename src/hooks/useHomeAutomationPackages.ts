import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";
import bgAscentia from "@/assets/bg-lagos-apartment.jpg";
import bgSprout from "@/assets/feature-smart-automation-device.jpg";
import bgIbiza from "@/assets/hero-smart-home.jpg";

const IMAGE_BY_TIER: Record<string, string> = {
  Apex: bgAscentia,
  Aura: bgSprout,
  Riviera: bgIbiza,
  // legacy fallbacks
  Ascentia: bgAscentia,
  Sprout: bgSprout,
  Ibiza: bgIbiza,
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

const decorate = (rows: any[]): HomeAutomationPackage[] =>
  rows.map((p) => ({ ...p, image: IMAGE_BY_TIER[p.tier] ?? bgAscentia })) as HomeAutomationPackage[];

export const useHomeAutomationPackages = () => {
  const [packages, setPackages] = useState<HomeAutomationPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async (attempt = 0): Promise<void> => {
      const { data, error } = await fetchFreshRows<any>(
        "home_automation_packages?select=*&is_active=eq.true&order=sort_order.asc",
      );
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return run(attempt + 1);
      }
      if (data) {
        setPackages(decorate(data as any[]));
      }
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
