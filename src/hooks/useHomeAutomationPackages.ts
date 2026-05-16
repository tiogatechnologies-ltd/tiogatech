import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export const useHomeAutomationPackages = () => {
  const [packages, setPackages] = useState<HomeAutomationPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("home_automation_packages" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if (!error && data) {
        setPackages(
          (data as any[]).map((p) => ({
            ...p,
            image: IMAGE_BY_TIER[p.tier] ?? bgAscentia,
          })) as HomeAutomationPackage[]
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { packages, loading };
};
