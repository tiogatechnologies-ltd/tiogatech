import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheKey } from "@/lib/cache";
import bgAscentia from "@/assets/feature-control-panel.jpg";
import bgSprout from "@/assets/offer-automation.jpg";
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

const CACHE_KEY = cacheKey("home_automation");
const decorate = (rows: any[]): HomeAutomationPackage[] =>
  rows.map((p) => ({ ...p, image: IMAGE_BY_TIER[p.tier] ?? bgAscentia })) as HomeAutomationPackage[];

export const useHomeAutomationPackages = () => {
  const [packages, setPackages] = useState<HomeAutomationPackage[]>(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return decorate(parsed);
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => packages.length === 0);

  useEffect(() => {
    let active = true;
    const run = async (attempt = 0): Promise<void> => {
      const { data, error } = await supabase
        .from("home_automation_packages" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return run(attempt + 1);
      }
      if (data) {
        setPackages(decorate(data as any[]));
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      }
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
