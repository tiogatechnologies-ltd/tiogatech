import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheKey } from "@/lib/cache";
import bgElite from "@/assets/bg-smartlock-elite.jpg";
import bgApex from "@/assets/bg-smartlock-apex.jpg";
import bgPro from "@/assets/bg-smartlock-pro.jpg";
import bgBase from "@/assets/bg-smartlock-base.jpg";
import bgHotel from "@/assets/bg-smartlock-hotel.jpg";
import bgAccessory from "@/assets/bg-smartlock-accessory.jpg";

export type SmartLock = {
  id: string;
  category: "lock" | "accessory" | "hotel";
  series: string;
  model: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number | null;
  price_label: string | null;
  features: string[];
  power_system: string;
  ideal_for: string;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
  image: string;
};

const pickImage = (item: { category: string; series: string }) => {
  if (item.category === "hotel") return bgHotel;
  if (item.category === "accessory") return bgAccessory;
  const s = item.series.toLowerCase();
  if (s.includes("elite")) return bgElite;
  if (s.includes("apex")) return bgApex;
  if (s.includes("pro")) return bgPro;
  return bgBase;
};

const CACHE_KEY = cacheKey("smart_locks");

export const useSmartLocks = () => {
  const [items, setItems] = useState<SmartLock[]>(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((p: any) => ({ ...p, image: pickImage(p) })) as SmartLock[];
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => items.length === 0);

  useEffect(() => {
    let active = true;
    const run = async (attempt = 0): Promise<void> => {
      const { data, error } = await supabase
        .from("smart_locks" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return run(attempt + 1);
      }
      if (data) {
        setItems((data as any[]).map((p) => ({ ...p, image: pickImage(p) })) as SmartLock[]);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
      }
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, []);

  return { items, loading };
};
