import { useEffect, useState } from "react";
import { fetchFreshRows } from "@/lib/freshContent";
import bgSolarRoof from "@/assets/feature-solar-roof.jpg";
import bgPanelCloseup from "@/assets/bg-panel-closeup.jpg";
import bgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgSolarAerial from "@/assets/bg-solar-aerial.jpg";
import bgCommercial from "@/assets/bg-commercial-solar.jpg";
import bgLumivoltRoof from "@/assets/bg-lumivolt-rooftop.jpg";
import featureBattery from "@/assets/feature-battery.jpg";
import featureSolarPanel from "@/assets/feature-solar-panel.jpg";
import offerSolar from "@/assets/offer-solar.jpg";

const IMAGES = [
  bgSolarRoof,
  bgPanelCloseup,
  bgRooftopInstall,
  bgSolarField,
  bgSolarAerial,
  bgCommercial,
  bgLumivoltRoof,
  featureBattery,
  featureSolarPanel,
  offerSolar,
];

export type SolarPackage = {
  id: string;
  package_number: number;
  battery_type: "lithium" | "tubular" | "high_voltage";
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
};

import { fetchPackageImagesMap } from "@/lib/packageImages";

export function getSolarPackageImage(p: { package_number?: number; inverter?: string; battery?: string }): string {
  const num = p.package_number || 0;
  if (num >= 1 && num <= 19) {
    return `/products/packages/pkg-solar-${num}.webp`;
  }

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

const decorate = (data: any[], imgMap: Record<string, string> = {}): SolarPackage[] =>
  data.map((p) => ({
    ...p,
    image: (p.image_url && !p.image_url.startsWith("/products/minisim/")) 
      ? p.image_url 
      : (imgMap[p.id] || getSolarPackageImage(p)),
  })) as SolarPackage[];

export const useSolarPackages = () => {
  const [packages, setPackages] = useState<SolarPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchOnce = async (attempt = 0): Promise<void> => {
      const [{ data, error }, imgMap] = await Promise.all([
        fetchFreshRows<any>("solar_packages?select=*&is_active=eq.true&order=sort_order.asc"),
        fetchPackageImagesMap(),
      ]);
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return fetchOnce(attempt + 1);
      }
      if (data) {
        setPackages(decorate(data as any[], imgMap));
      }
      setLoading(false);
    };
    fetchOnce();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
