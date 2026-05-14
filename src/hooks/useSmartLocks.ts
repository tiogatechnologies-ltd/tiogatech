import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export const useSmartLocks = () => {
  const [items, setItems] = useState<SmartLock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("smart_locks" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if (!error && data) {
        setItems(
          (data as any[]).map((p) => ({
            ...p,
            image: pickImage(p),
          })) as SmartLock[]
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { items, loading };
};
