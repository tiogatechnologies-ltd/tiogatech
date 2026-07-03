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

const decorate = (data: any[]): SolarPackage[] =>
  data.map((p, i) => ({ ...p, image: IMAGES[i % IMAGES.length] })) as SolarPackage[];

export const useSolarPackages = () => {
  const [packages, setPackages] = useState<SolarPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchOnce = async (attempt = 0): Promise<void> => {
      const { data, error } = await fetchFreshRows<any>(
        "solar_packages?select=*&is_active=eq.true&order=sort_order.asc",
      );
      if (!active) return;
      if ((error || !data) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        return fetchOnce(attempt + 1);
      }
      if (data) {
        setPackages(decorate(data as any[]));
      }
      setLoading(false);
    };
    fetchOnce();
    return () => { active = false; };
  }, []);

  return { packages, loading };
};
