import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";
import { getCached, setCached, getOrCreateInflight, invalidateCached } from "@/lib/sessionDataCache";
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

import { fetchPackageImagesMap } from "@/lib/packageImages";

export function getSmartLockImage(item: { id?: string; category?: string; series?: string; model?: string; name?: string; image_url?: string | null }): string {
  const m = `${item.model || ""} ${item.name || ""}`.toLowerCase();
  const s = (item.series || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  // Accessories
  if (cat === "accessory" || s.includes("access")) {
    if (m.includes("battery")) return "/products/core/stama-lock-battery.webp";
    if (m.includes("remote")) return "/products/core/stama-lock-remote.webp";
    if (m.includes("gateway")) return "/products/core/stama-lock-gateway.webp";
    if (m.includes("card") || m.includes("rfid")) return "/products/core/stama-rfid-card.webp";
  }

  // Model-specific authentic matching
  if (m.includes("k209")) return "/products/core/stama-k209-face-lock.webp";
  if (m.includes("s7") || m.includes("premier")) return "/products/core/stama-s7-premier.webp";
  if (m.includes("f27")) return "/products/core/stama-f27-wifi.webp";
  if (m.includes("t8")) return "/products/core/stama-t8-israeli.webp";
  if (m.includes("h11")) return "/products/core/stama-h11-intercom.webp";
  if (m.includes("d20") && !m.includes("kt14")) return "/products/core/stama-d20-apex.webp";
  if (m.includes("sl02")) return "/products/core/stama-sl02-aluminum.webp";
  if (m.includes("n14")) return "/products/core/stama-n14-pro.webp";
  if (m.includes("n22")) return "/products/core/stama-n22-security.webp";
  if (m.includes("x04")) return "/products/core/stama-x04-budget.webp";
  if (m.includes("b16")) return "/products/core/stama-b16-camera.webp";
  if (m.includes("tfs") || m.includes("tf5")) return "/products/core/stama-tf5-shortlet.webp";
  if (m.includes("g290") || m.includes("glass")) return "/products/core/stama-g290-glass.webp";
  if (m.includes("v80") || (m.includes("gate") && !m.includes("gateway")) || m.includes("conventional")) return "/products/core/stama-v80-gate.webp";
  if (m.includes("kt14") || m.includes("padlock")) return "/products/core/stama-kt14-padlock.webp";
  if (cat === "hotel" || m.includes("hotel")) return "/products/core/stama-hotel-system.webp";

  // Fallbacks by series
  if (s.includes("elite")) return "/products/core/stama-s7-premier.webp";
  if (s.includes("apex")) return "/products/core/stama-d20-apex.webp";
  if (s.includes("pro")) return "/products/core/stama-sl02-aluminum.webp";
  return "/products/clear/lock-fingerprint-handle.webp";
}

const pickImage = (item: { id: string; category: string; series: string; model?: string; name?: string; image_url?: string | null }, imgMap: Record<string, string> = {}) => {
  if (item.image_url && typeof item.image_url === "string" && item.image_url.trim().length > 0 && !item.image_url.startsWith("/products/minisim/")) {
    return item.image_url;
  }
  if (imgMap[item.id]) return imgMap[item.id];
  return getSmartLockImage(item);
};

const CACHE_KEY = "smart_locks";

/** Called by Admin > Smart Locks after a save so this tab's cache doesn't hide the edit. */
export function invalidateSmartLocksCache() {
  invalidateCached(CACHE_KEY);
}

export const useSmartLocks = () => {
  const [items, setItems] = useState<SmartLock[]>(() => getCached<SmartLock[]>(CACHE_KEY) ?? []);
  const [loading, setLoading] = useState(() => !getCached<SmartLock[]>(CACHE_KEY));

  useEffect(() => {
    const hit = getCached<SmartLock[]>(CACHE_KEY);
    if (hit) {
      setItems(hit);
      setLoading(false);
      return;
    }

    let active = true;
    const run = async (attempt = 0): Promise<SmartLock[] | null> => {
      const [{ data, error }, imgMap] = await Promise.all([
        fetchFreshRows<any>("smart_locks?select=*&is_active=eq.true&order=sort_order.asc"),
        fetchPackageImagesMap(),
      ]);
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return run(attempt + 1);
      }
      return data ? ((data as any[]).map((p) => ({ ...p, image: pickImage(p, imgMap) })) as SmartLock[]) : null;
    };

    getOrCreateInflight(CACHE_KEY, async () => {
      const result = await run();
      if (result) setCached(CACHE_KEY, result);
      return result;
    }).then((result) => {
      if (!active) return;
      if (result) setItems(result);
      setLoading(false);
    });

    return () => { active = false; };
  }, []);

  return { items, loading };
};
