import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Flame,
  GalleryHorizontal,
  Eye,
  EyeOff,
  Clock,
  Tag,
  Image as ImageIcon,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Battery,
  Sun,
  Lock,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { invalidateLandingCache } from "@/hooks/useLandingContent";
import { invalidateSettingsCache } from "@/hooks/useSiteSetting";
import { useSolarPackages } from "@/hooks/useSolarPackages";
import { useSmartLocks } from "@/hooks/useSmartLocks";
import { useHomeAutomationPackages } from "@/hooks/useHomeAutomationPackages";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { mergeProducts } from "@/lib/mergeProducts";
import { normalizeCategory } from "@/lib/productBrand";
import { resolveProductImage, getMultiAngleProductImages } from "@/lib/productImages";
import { productPath } from "@/lib/productSlug";
import bgSolarHero from "@/assets/bg-commercial-solar.jpg";
import bgInverterHero from "@/assets/bg-panel-closeup.jpg";
import bgSmartLockHero from "@/assets/bg-smartlock-apex.jpg";

type SourceType = "product" | "solar_package" | "smart_lock" | "automation_package" | "custom";

interface HeroSlide {
  id: string;
  is_active: boolean;
  source_type: SourceType;
  source_id: string | null;
  badge: string;
  headline: string;
  subheadline: string;
  highlight_text: string;
  discount_pct: number | null;
  price_ngn: number | null;
  image_url: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text: string;
  secondary_cta_link: string;
}

interface FlashDeal {
  is_active: boolean;
  headline: string;
  discount_label: string;
  discount_code: string;
  description: string;
  perk_label: string;
  ends_at: string; // ISO
}

const emptySlide = (): HeroSlide => ({
  id: crypto.randomUUID(),
  is_active: true,
  source_type: "custom",
  source_id: null,
  badge: "Official Distributor",
  headline: "",
  subheadline: "",
  highlight_text: "Up to 5-Year Warranty · Nationwide Dispatch",
  discount_pct: null,
  price_ngn: null,
  image_url: "/products/clear/inverter-deye-hybrid.webp",
  cta_text: "Shop Now",
  cta_link: "/retail",
  secondary_cta_text: "Load Sizing Calculator",
  secondary_cta_link: "/energy-calculator",
});

// Nothing invented here: an unconfigured flash deal is empty and inactive, so
// the storefront can never advertise a promotion or a coupon code that the
// business has not actually created.
const defaultFlashDeal: FlashDeal = {
  is_active: false,
  headline: "",
  discount_label: "",
  discount_code: "",
  description: "",
  perk_label: "",
  ends_at: "",
};

const naira = (n: number | null) => (n == null ? "-" : `₦${Math.round(n).toLocaleString("en-NG")}`);

const parsePriceNaira = (price?: string | null): number | null => {
  if (!price) return null;
  const digits = price.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : null;
};

const toDatetimeLocal = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Auto-fill intelligent copy & authentic images from any catalog item
const resolveDetailsFromItem = (
  type: SourceType,
  id: string,
  productsList: any[],
  solarPkgList: any[],
  smartLockList: any[],
  autoPkgList: any[]
): Partial<HeroSlide> | null => {
  if (type === "product") {
    const p = productsList.find((x: any) => x.id === id);
    if (!p) return null;
    const cat = (p.category || "").toLowerCase();
    const name = p.name || "";
    const img = resolveProductImage((p as any).image_url, p.category, p.name);
    const price = (p as any).numeric_price ?? parsePriceNaira((p as any).price);

    let badge = "Official Distributor Guarantee";
    let highlight = "5-Year Official Warranty · Nationwide Fast Dispatch";
    if (cat.includes("inverter") || name.toLowerCase().includes("inverter")) {
      badge = name.includes("Deye") ? "Official Deye Distributor" : "Tier-1 Hybrid Inverter";
      highlight = "5-Year Replacement Warranty · Same-Day Lagos Dispatch";
    } else if (cat.includes("battery") || name.toLowerCase().includes("battery") || name.toLowerCase().includes("lifepo4")) {
      badge = "Tier-1 LiFePO4 Energy Storage";
      highlight = "6,000+ Deep Cycles · Built-in Smart BMS Protection";
    } else if (cat.includes("solar") || name.toLowerCase().includes("panel") || name.toLowerCase().includes("longi") || name.toLowerCase().includes("jinko") || name.toLowerCase().includes("ja solar")) {
      badge = "Tier-1 High-Yield Solar Panels";
      highlight = "25-Year Linear Output Guarantee · High Cell Efficiency";
    } else if (cat.includes("lock") || name.toLowerCase().includes("lock")) {
      badge = "Advanced Biometric Security";
      highlight = "Tuya & TTLock Cloud Sync · Free Installation in Lagos";
    } else if (cat.includes("cctv") || cat.includes("camera")) {
      badge = "Ultra-HD Surveillance System";
      highlight = "24/7 Color Night Vision · Mobile Remote Monitoring";
    }

    const rawDesc = p.description || "";
    const cleanSub = rawDesc
      ? (rawDesc.length > 150 ? rawDesc.slice(0, 147) + "..." : rawDesc)
      : "Authentic tier-1 energy hardware pre-configured for Nigerian grid and off-grid conditions.";

    return {
      headline: p.name,
      subheadline: cleanSub,
      badge,
      highlight_text: highlight,
      image_url: img,
      price_ngn: price,
      cta_text: "Shop Now",
      cta_link: productPath(p as any),
      secondary_cta_text: (cat.includes("inverter") || cat.includes("solar") || cat.includes("battery")) ? "Load Sizing Calculator" : "Spread Payments",
      secondary_cta_link: (cat.includes("inverter") || cat.includes("solar") || cat.includes("battery")) ? "/energy-calculator" : "/finance",
    };
  }

  if (type === "solar_package") {
    const p = solarPkgList.find((x: any) => x.id === id);
    if (!p) return null;
    return {
      headline: p.inverter.toLowerCase().includes("package") ? p.inverter : `Complete ${p.inverter} Turnkey Solar System`,
      subheadline: `Matched with ${p.battery} and ${p.solar_panels || "Tier-1 high-yield solar modules"}. Zero grid transfer flicker for 24/7 power stability.`,
      badge: "Turnkey Solar Power Pack",
      highlight_text: "48h Installation · All DC Breakers Included",
      image_url: p.image,
      price_ngn: p.total_price ?? null,
      cta_text: "Shop Solar Bundle",
      cta_link: `/solar-packages?id=${p.package_number}`,
      secondary_cta_text: "Load Sizing Calculator",
      secondary_cta_link: "/energy-calculator",
    };
  }

  if (type === "smart_lock") {
    const p = smartLockList.find((x: any) => x.id === id);
    if (!p) return null;
    return {
      headline: p.name,
      subheadline: p.description || "Military-grade biometric access control with smartphone remote app sync and anti-tamper security.",
      badge: "Smart Biometric Security",
      highlight_text: "Free Expert Installation in Lagos · 2-Year Warranty",
      image_url: p.image,
      price_ngn: p.price ?? null,
      cta_text: "Shop Smart Locks",
      cta_link: `/retail?category=Smart+Locks`,
      secondary_cta_text: "Hotel Access Systems",
      secondary_cta_link: "/contact",
    };
  }

  if (type === "automation_package") {
    const p = autoPkgList.find((x: any) => x.id === id);
    if (!p) return null;
    return {
      headline: p.name,
      subheadline: p.description || "Intelligent lighting, energy automation, and security control integrated directly with your smartphone.",
      badge: "Intelligent Home Automation",
      highlight_text: "Full Smart Hub Setup · Voice Assistant Compatible",
      image_url: p.image,
      price_ngn: p.price ?? null,
      cta_text: "Explore Automation",
      cta_link: `/packages#home-automation`,
      secondary_cta_text: "Request Custom Smart Setup",
      secondary_cta_link: "/contact",
    };
  }

  return null;
};

// Preset catalog templates for 1-click addition and filling
const PRESET_TEMPLATES = [
  {
    key: "deye-5kw",
    label: "Deye 5kW Hybrid Inverter",
    short: "Deye 5kW",
    type: "product" as SourceType,
    findId: (prods: any[]) =>
      prods.find((p) => p.name?.toLowerCase().includes("deye") && p.name?.toLowerCase().includes("5k"))?.id ||
      prods.find((p) => p.name?.toLowerCase().includes("deye"))?.id,
  },
  {
    key: "deye-8kw",
    label: "Deye 8kW / 10kW Commercial",
    short: "Deye 8kW+",
    type: "product" as SourceType,
    findId: (prods: any[]) =>
      prods.find((p) => p.name?.toLowerCase().includes("deye") && (p.name?.toLowerCase().includes("8k") || p.name?.toLowerCase().includes("10k") || p.name?.toLowerCase().includes("12k")))?.id,
  },
  {
    key: "srne-battery",
    label: "SRNE 5.12kWh LiFePO4 Battery",
    short: "SRNE Battery",
    type: "product" as SourceType,
    findId: (prods: any[]) =>
      prods.find((p) => p.name?.toLowerCase().includes("srne") && (p.name?.toLowerCase().includes("5.12") || p.name?.toLowerCase().includes("eos05") || p.name?.toLowerCase().includes("se05")))?.id ||
      prods.find((p) => p.name?.toLowerCase().includes("srne") && p.category?.toLowerCase().includes("batter"))?.id,
  },
  {
    key: "srne-inv",
    label: "SRNE High-Yield Inverter",
    short: "SRNE Inverter",
    type: "product" as SourceType,
    findId: (prods: any[]) =>
      prods.find((p) => p.name?.toLowerCase().includes("srne") && p.category?.toLowerCase().includes("inverter"))?.id,
  },
  {
    key: "solar-pack-5kva",
    label: "5kVA Turnkey Solar Package",
    short: "5kVA Pack",
    type: "solar_package" as SourceType,
    findId: (_: any[], pkgs: any[]) =>
      pkgs.find((p) => p.inverter?.includes("5kVA") || p.package_number === 2)?.id || pkgs[0]?.id,
  },
  {
    key: "solar-pack-10kva",
    label: "10kVA Turnkey Solar Package",
    short: "10kVA Pack",
    type: "solar_package" as SourceType,
    findId: (_: any[], pkgs: any[]) =>
      pkgs.find((p) => p.inverter?.includes("10kVA") || p.package_number === 3)?.id || pkgs[1]?.id,
  },
  {
    key: "smart-lock-3d",
    label: "STAMA 3D Face ID Lock",
    short: "3D Smart Lock",
    type: "smart_lock" as SourceType,
    findId: (_: any[], __: any[], locks: any[]) =>
      locks.find((l) => l.name?.toLowerCase().includes("3d") || l.name?.toLowerCase().includes("face"))?.id || locks[0]?.id,
  },
  {
    key: "solar-panels-tier1",
    label: "Tier-1 Solar Panels (Longi/Jinko)",
    short: "Tier-1 Panels",
    type: "product" as SourceType,
    findId: (prods: any[]) =>
      prods.find((p) => p.category?.toLowerCase().includes("panel") || p.name?.toLowerCase().includes("longi") || p.name?.toLowerCase().includes("jinko") || p.name?.toLowerCase().includes("ja solar"))?.id,
  },
];

// Copy templates only. These deliberately carry no coupon code - the code is
// chosen from the codes that actually exist in Discounts, so a preset can never
// publish one the customer cannot redeem.
const FLASH_DEAL_PRESETS = [
  {
    label: "24h Free Expedited Dispatch",
    headline: "24-Hour Expedited Delivery Promo",
    discount_label: "Free Express Shipping",
    description: "Prioritized 24-hour dispatch and insured transit on all inverters and batteries.",
    perk_label: "24h Dispatch",
  },
  {
    label: "Clean Energy Sale",
    headline: "Clean Energy Flash Deal",
    discount_label: "Limited-Time Discount",
    description: "Verified warehouse stock and full manufacturer warranty on tier-1 hybrid inverters and lithium storage.",
    perk_label: "Official Warranty",
  },
  {
    label: "LiFePO4 Free Breaker Kit",
    headline: "LiFePO4 Battery Upgrade Special",
    discount_label: "Free Breaker Kit",
    description: "Order any lithium battery storage and receive a certified DC breaker and connection accessory pack free.",
    perk_label: "Free Kit",
  },
  {
    label: "Smart Lock Free Installation",
    headline: "STAMA Smart Security Flash Deal",
    discount_label: "Free Setup",
    description: "Complimentary on-site professional installation and smartphone sync for all biometric locks.",
    perk_label: "Free Install",
  },
];

const BADGE_SUGGESTIONS = [
  "Official Distributor",
  "Best Seller",
  "Tier-1 Quality",
  "Limited Promo",
  "5-Year Warranty",
  "Same-Day Dispatch",
  "Turnkey System",
];

const HIGHLIGHT_SUGGESTIONS = [
  "5-Year Official Replacement Warranty",
  "Same-Day Dispatch in Lagos & Abuja",
  "6,000+ Cycles · Smart BMS Protection",
  "Zero Grid Transfer Flicker",
  "Free Installation in Lagos",
  "25-Year Solar Panel Linear Warranty",
];

const CTA_TEXT_SUGGESTIONS = [
  "Shop Now",
  "Explore Inverters",
  "Shop Solar Bundles",
  "Order Now",
  "View Specifications",
];

const SECONDARY_CTA_SUGGESTIONS = [
  "Load Sizing Calculator",
  "Spread Payments in Installments",
  "Hotel Access Solutions",
  "Talk to an Engineer",
];

const AdminRetailPromotions = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [flashDeal, setFlashDeal] = useState<FlashDeal>(defaultFlashDeal);
  const [promoSettings, setPromoSettings] = useState<{
    show_compare_at_price: boolean;
    default_markup_pct: number;
    badge_format?: "save_pct" | "save_amount" | "pct_off";
    product_overrides?: Record<string, {
      compare_at_price?: number | null;
      discount_pct?: number | null;
      custom_badge?: string | null;
      exclude?: boolean;
    }>;
  }>({
    show_compare_at_price: true,
    default_markup_pct: 12,
    badge_format: "save_pct",
    product_overrides: {},
  });
  const [productPromoSearch, setProductPromoSearch] = useState("");
  const [productPromoFilter, setProductPromoFilter] = useState<"all" | "overrides" | "excluded">("all");
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingFlash, setSavingFlash] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  const { packages: solarPackages } = useSolarPackages();
  const { items: smartLocks } = useSmartLocks();
  const { packages: autoPackages } = useHomeAutomationPackages();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  // Real, currently-redeemable codes - the flash deal can only advertise one of these.
  const [liveCodes, setLiveCodes] = useState<Array<{ id: string; code: string; type: string; value: number }>>([]);
  const products = useMemo(() => {
    const staticList = STATIC_PRODUCTS.map((p) => ({ ...p, category: normalizeCategory(p.category) }));
    const dbList = dbProducts.map((p) => ({ ...p, category: normalizeCategory(p.category) }));
    return mergeProducts(staticList as any[], dbList as any[]);
  }, [dbProducts]);

  const updateProductOverride = (productId: string, patch: {
    compare_at_price?: number | null;
    discount_pct?: number | null;
    custom_badge?: string | null;
    exclude?: boolean;
  }) => {
    setPromoSettings((prev) => {
      const currentOverrides = prev.product_overrides || {};
      const currentItem = currentOverrides[productId] || {};
      const updatedItem = { ...currentItem, ...patch };

      const newOverrides = { ...currentOverrides, [productId]: updatedItem };
      return {
        ...prev,
        product_overrides: newOverrides,
      };
    });
  };

  const removeProductOverride = (productId: string) => {
    setPromoSettings((prev) => {
      const newOverrides = { ...(prev.product_overrides || {}) };
      delete newOverrides[productId];
      return {
        ...prev,
        product_overrides: newOverrides,
      };
    });
  };

  const filteredPromoProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productPromoSearch ||
        p.name.toLowerCase().includes(productPromoSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productPromoSearch.toLowerCase());

      const override = promoSettings.product_overrides?.[p.id];
      const hasCustom = !!(override?.compare_at_price || override?.discount_pct || override?.custom_badge);
      const isExcluded = !!override?.exclude;

      if (productPromoFilter === "overrides") return matchSearch && hasCustom && !isExcluded;
      if (productPromoFilter === "excluded") return matchSearch && isExcluded;
      return matchSearch;
    });
  }, [products, productPromoSearch, productPromoFilter, promoSettings.product_overrides]);

  useEffect(() => {
    const fetch = async () => {
      const [{ data }, { data: prodData }, { data: codeData }, { data: promoData }] = await Promise.all([
        supabase.from("landing_content").select("*").in("section_key", ["retail_hero", "flash_deal"]),
        supabase.from("products").select("*").eq("is_active", true),
        supabase.from("discounts").select("id, code, type, value").eq("active", true).order("code"),
        supabase.from("site_settings").select("*").eq("key", "promotions").maybeSingle(),
      ]);
      const heroRow = (data as any[])?.find((r) => r.section_key === "retail_hero");
      const flashRow = (data as any[])?.find((r) => r.section_key === "flash_deal");
      const heroContent = heroRow?.content as { slides?: HeroSlide[] } | undefined;
      const flashContent = flashRow?.content as Partial<FlashDeal> | undefined;
      setSlides(Array.isArray(heroContent?.slides) ? heroContent.slides! : []);
      setFlashDeal(flashContent ? { ...defaultFlashDeal, ...flashContent } : defaultFlashDeal);
      if (promoData?.value) {
        const val = promoData.value as any;
        setPromoSettings({
          show_compare_at_price: val.show_compare_at_price !== undefined ? !!val.show_compare_at_price : true,
          default_markup_pct: val.default_markup_pct !== undefined ? Number(val.default_markup_pct) : 12,
          badge_format: val.badge_format || "save_pct",
          product_overrides: val.product_overrides || {},
        });
      }
      setDbProducts(prodData || []);
      setLiveCodes((codeData as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const saveHero = async () => {
    setSavingHero(true);
    const { error } = await supabase.from("landing_content").upsert(
      { section_key: "retail_hero", content: { slides } as any, updated_at: new Date().toISOString() },
      { onConflict: "section_key" }
    );
    setSavingHero(false);
    if (error) { toast.error("Failed to save hero slides", { description: error.message }); return; }
    toast.success("Hero carousel updated");
    invalidateLandingCache();
  };

  const saveFlash = async () => {
    setSavingFlash(true);
    const { error } = await supabase.from("landing_content").upsert(
      { section_key: "flash_deal", content: flashDeal as any, updated_at: new Date().toISOString() },
      { onConflict: "section_key" }
    );
    setSavingFlash(false);
    if (error) { toast.error("Failed to save flash deal", { description: error.message }); return; }
    toast.success("Flash deal bar updated");
    invalidateLandingCache();
  };

  const savePromo = async () => {
    setSavingPromo(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "promotions", value: promoSettings, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSavingPromo(false);
    if (error) { toast.error("Failed to save promotional pricing", { description: error.message }); return; }
    toast.success("Promotional pricing and Save % badges updated");
    invalidateSettingsCache();
  };

  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSlide = () => setSlides((prev) => [...prev, emptySlide()]);
  const removeSlide = (id: string) => setSlides((prev) => prev.filter((s) => s.id !== id));
  const moveSlide = (id: string, dir: -1 | 1) => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  // When user picks an item from the dropdown, AUTOMATICALLY fill its product image and copy
  const handleItemSelect = (slideId: string, type: SourceType, newId: string) => {
    if (!newId) {
      updateSlide(slideId, { source_id: null });
      return;
    }
    const autoData = resolveDetailsFromItem(type, newId, products, solarPackages, smartLocks, autoPackages);
    if (autoData) {
      updateSlide(slideId, {
        source_id: newId,
        ...autoData,
      });
      toast.success("Applied real product image & specifications");
    } else {
      updateSlide(slideId, { source_id: newId });
    }
  };

  // Apply a preset template to an existing slide
  const applyPresetToSlide = (slideId: string, presetKey: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.key === presetKey);
    if (!preset) return;
    const targetId = preset.findId(products, solarPackages, smartLocks);
    if (!targetId) {
      toast.error("Matching catalog item not found in live inventory");
      return;
    }
    const autoData = resolveDetailsFromItem(preset.type, targetId, products, solarPackages, smartLocks, autoPackages);
    if (autoData) {
      updateSlide(slideId, {
        source_type: preset.type,
        source_id: targetId,
        ...autoData,
      });
      toast.success(`Applied ${preset.label} preset`);
    }
  };

  // Add a brand-new slide pre-populated from a preset
  const addSlideFromPreset = (presetKey: string) => {
    const newSlide = emptySlide();
    const preset = PRESET_TEMPLATES.find((p) => p.key === presetKey);
    if (preset) {
      const targetId = preset.findId(products, solarPackages, smartLocks);
      if (targetId) {
        const autoData = resolveDetailsFromItem(preset.type, targetId, products, solarPackages, smartLocks, autoPackages);
        if (autoData) {
          Object.assign(newSlide, {
            source_type: preset.type,
            source_id: targetId,
            ...autoData,
          });
        }
      }
    }
    setSlides((prev) => [...prev, newSlide]);
    toast.success(`Added slide from preset`);
  };

  // Manual re-sync from catalog
  const syncFromSource = (slide: HeroSlide) => {
    if (slide.source_type === "custom" || !slide.source_id) return;
    const autoData = resolveDetailsFromItem(slide.source_type, slide.source_id, products, solarPackages, smartLocks, autoPackages);
    if (autoData) {
      updateSlide(slide.id, autoData);
      toast.success("Re-synced image & details from live catalog");
    } else {
      toast.error("Catalog item not found");
    }
  };

  // Flash deal duration quick-setters
  const setDeadlineHoursFromNow = (hours: number) => {
    const d = new Date();
    d.setTime(d.getTime() + hours * 3600 * 1000);
    setFlashDeal((f) => ({ ...f, ends_at: d.toISOString() }));
    toast.success(`Deadline set to ${hours >= 24 ? `${Math.round(hours / 24)} days` : `${hours} hours`} from now`);
  };

  const setDeadlineEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    setFlashDeal((f) => ({ ...f, ends_at: end.toISOString() }));
    toast.success("Deadline set to end of the month");
  };

  const sourceOptions = (type: SourceType) => {
    if (type === "product") return products.map((p: any) => ({ id: p.id, label: `${p.name} · ${p.price ?? "-"}` }));
    if (type === "solar_package") return solarPackages.map((p) => ({ id: p.id, label: `Package #${p.package_number} - ${p.inverter} · ${naira(p.total_price)}` }));
    if (type === "smart_lock") return smartLocks.map((p) => ({ id: p.id, label: `${p.name} · ${p.price_label || naira(p.price)}` }));
    if (type === "automation_package") return autoPackages.map((p) => ({ id: p.id, label: `${p.name} · ${p.price_label || naira(p.price)}` }));
    return [];
  };

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
  const labelClass = "text-[10px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide";

  if (loading) return <AdminLayout><div className="text-center py-10 text-muted-foreground text-sm">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-foreground">Retail Store Promotions</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your retail hero carousel and top promotional countdown bar. Selecting any catalog product or package
            automatically loads its authentic photo, clean specs, pricing, and purchase links.
          </p>
        </div>

        {/* QUICK PRESETS BANNER */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                1-Click Quick Add Presets:
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Click any item below to add an instant, pre-filled hero slide using authentic catalog photos
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => addSlideFromPreset(tpl.key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-card hover:bg-primary hover:text-primary-foreground text-xs font-medium text-foreground transition-all shadow-xs"
              >
                <span>{tpl.short}</span>
                <Plus size={12} className="opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* FLASH DEAL BAR */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Flame size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground leading-tight">Flash Deals Bar</h2>
                <p className="text-xs text-muted-foreground">Top countdown announcement across store pages</p>
              </div>
            </div>
            <button
              onClick={() => setFlashDeal((f) => ({ ...f, is_active: !f.is_active }))}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                flashDeal.is_active
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {flashDeal.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
              {flashDeal.is_active ? "Visible on storefront" : "Hidden"}
            </button>
          </div>

          {/* Flash Deal Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quick Presets:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {FLASH_DEAL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    // Copy only - the existing coupon code is preserved so a
                    // preset never silently swaps in a different offer.
                    setFlashDeal((prev) => ({
                      ...prev,
                      headline: p.headline,
                      discount_label: p.discount_label,
                      description: p.description,
                      perk_label: p.perk_label,
                      is_active: true,
                    }));
                    toast.success(`Loaded preset: ${p.label}`, {
                      description: "Pick the coupon code it should advertise before saving.",
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 border border-border text-[11px] font-medium text-foreground transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className={labelClass}>Headline</label>
              <input
                className={inputClass}
                value={flashDeal.headline}
                onChange={(e) => setFlashDeal((f) => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. Mid-Month Energy Flash Deals"
              />
            </div>
            <div>
              <label className={labelClass}>Discount label (badge)</label>
              <input
                className={inputClass}
                value={flashDeal.discount_label}
                onChange={(e) => setFlashDeal((f) => ({ ...f, discount_label: e.target.value }))}
                placeholder="e.g. Up to 15% Off or Free Delivery"
              />
            </div>
            <div>
              <label className={labelClass}>Coupon code</label>
              {/* Picked from real codes in Discounts. A free-text field here let
                  the storefront advertise a code that did not exist, so the
                  customer only found out when it failed at checkout. */}
              <select
                className={`${inputClass} font-mono uppercase`}
                value={flashDeal.discount_code}
                onChange={(e) => setFlashDeal((f) => ({ ...f, discount_code: e.target.value }))}
              >
                <option value="">No code (perk only)</option>
                {liveCodes.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} — {d.type === "percent" ? `${d.value}% off` : `₦${Number(d.value).toLocaleString("en-NG")} off`}
                  </option>
                ))}
              </select>
              {flashDeal.discount_code && !liveCodes.some((d) => d.code === flashDeal.discount_code) && (
                <p className="mt-1 text-[11px] font-semibold text-destructive">
                  “{flashDeal.discount_code}” is not an active discount code. Customers who try it will be rejected at checkout —
                  create it in Discounts &amp; Promo Codes or pick another.
                </p>
              )}
              {liveCodes.length === 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No active codes yet. Create one in Discounts &amp; Promo Codes first.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Perk badge (right side)</label>
              <input
                className={inputClass}
                value={flashDeal.perk_label}
                onChange={(e) => setFlashDeal((f) => ({ ...f, perk_label: e.target.value }))}
                placeholder="e.g. 24h Dispatch"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-none`}
                value={flashDeal.description}
                onChange={(e) => setFlashDeal((f) => ({ ...f, description: e.target.value }))}
                placeholder="Explanation of the promotion shown on the announcement bar"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className={labelClass}>Deal ends at (real deadline)</label>
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <input
                  type="datetime-local"
                  className={`${inputClass} sm:w-80`}
                  value={toDatetimeLocal(flashDeal.ends_at)}
                  onChange={(e) => setFlashDeal((f) => ({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDeadlineHoursFromNow(24)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground"
                  >
                    +24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineHoursFromNow(48)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground"
                  >
                    +48 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineHoursFromNow(168)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={setDeadlineEndOfMonth}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground"
                  >
                    End of Month
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The storefront countdown counts down to this exact timestamp and auto-hides once it arrives.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={saveFlash}
              disabled={savingFlash}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={14} /> {savingFlash ? "Saving..." : "Save Flash Deal"}
            </button>
          </div>
        </section>

        {/* STOREWIDE PROMOTIONAL PRICING & "SAVE %" BADGES */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Tag size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground leading-tight">
                  Storewide Promotional Pricing &amp; "Save %" Badges
                </h2>
                <p className="text-xs text-muted-foreground">
                  Control struck-through list prices and discount badges across product listings
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setPromoSettings((p) => ({ ...p, show_compare_at_price: !p.show_compare_at_price }))
              }
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                promoSettings.show_compare_at_price
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {promoSettings.show_compare_at_price ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span>Storewide Badges Active</span>
                </>
              ) : (
                <>
                  <EyeOff size={13} />
                  <span>Disabled (Clean Real Pricing)</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Default List Price Markup (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    className={inputClass}
                    value={promoSettings.default_markup_pct}
                    onChange={(e) =>
                      setPromoSettings((p) => ({
                        ...p,
                        default_markup_pct: Math.max(0, Math.min(90, Number(e.target.value) || 0)),
                      }))
                    }
                    placeholder="e.g. 0 for none, or 12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Set to 0% to disable artificial markups. Setting to 12% previously caused all products to display "Save 11%".
                </p>
              </div>

              <div>
                <label className={labelClass}>How It Works</label>
                <div className="text-xs text-muted-foreground space-y-1 rounded-xl bg-muted/40 p-3 border border-border">
                  <p>
                    • <strong className="text-foreground">Individual Previous Price</strong>: Any product with a previous price entered in Product Catalog will always show its real discount.
                  </p>
                  <p>
                    • <strong className="text-foreground">Storewide Fallback</strong>: When enabled, this percentage is added as a fallback to items without a recorded previous price.
                  </p>
                </div>
              </div>
            </div>

            {promoSettings.show_compare_at_price && promoSettings.default_markup_pct > 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Tag size={13} />
                  Live Preview on a ₦500,000 Product:
                </p>
                <p className="text-foreground/90">
                  Selling Price: <strong>₦500,000</strong> · Struck-through:{" "}
                  <span className="line-through text-muted-foreground">
                    ₦{Math.round(500000 * (1 + promoSettings.default_markup_pct / 100)).toLocaleString("en-NG")}
                  </span>{" "}
                  · Badge:{" "}
                  <span className="inline-block px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold text-[10px]">
                    Save {Math.round((promoSettings.default_markup_pct / (100 + promoSettings.default_markup_pct)) * 100)}%
                  </span>
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>
                  Storewide markup is <strong className="text-foreground">Disabled</strong>. Products will only display a crossed-out price if you specifically assigned an authentic Previous Price to them.
                </span>
              </div>
            )}

            {/* BADGE FORMAT SELECTION */}
            <div className="pt-2 border-t border-border/60">
              <label className={labelClass}>Badge Display Format</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {[
                  { id: "save_pct", label: "Save {pct}% (e.g. Save 11%)" },
                  { id: "pct_off", label: "{pct}% OFF (e.g. 11% OFF)" },
                  { id: "save_amount", label: "Save ₦ (e.g. Save ₦60,000)" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPromoSettings((p) => ({ ...p, badge_format: f.id as any }))}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                      (promoSettings.badge_format || "save_pct") === f.id
                        ? "bg-primary/10 border-primary text-primary shadow-xs"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT-SPECIFIC PROMO OVERRIDES */}
            <div className="pt-6 border-t border-border/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Product-Specific Promo Overrides
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Customize slashed prices, percentage discounts, or promotional badges for any specific item
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setProductPromoFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      productPromoFilter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPromoFilter("overrides")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      productPromoFilter === "overrides"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Customized ({Object.values(promoSettings.product_overrides || {}).filter((o: any) => o.compare_at_price || o.discount_pct || o.custom_badge).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductPromoFilter("excluded")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      productPromoFilter === "excluded"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Excluded ({Object.values(promoSettings.product_overrides || {}).filter((o: any) => o.exclude).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={productPromoSearch}
                  onChange={(e) => setProductPromoSearch(e.target.value)}
                  placeholder="Search Deye inverters, Felicity batteries, Longi panels, Smart locks..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {productPromoSearch && (
                  <button
                    type="button"
                    onClick={() => setProductPromoSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Product Overrides List */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredPromoProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No products found matching "{productPromoSearch}"
                  </div>
                ) : (
                  filteredPromoProducts.map((p) => {
                    const price = p.numeric_price || parsePriceNaira(p.price) || 0;
                    const override = promoSettings.product_overrides?.[p.id];
                    const isExcluded = !!override?.exclude;
                    const hasCustom = !!(override?.compare_at_price || override?.discount_pct || override?.custom_badge);

                    // Effective Compare Price
                    let effCompare: number | null = null;
                    if (!isExcluded) {
                      if (override?.compare_at_price && override.compare_at_price > price) {
                        effCompare = override.compare_at_price;
                      } else if (override?.discount_pct && override.discount_pct > 0) {
                        effCompare = Math.round(price / (1 - override.discount_pct / 100));
                      } else if (promoSettings.show_compare_at_price && promoSettings.default_markup_pct > 0) {
                        effCompare = Math.round(price * (1 + promoSettings.default_markup_pct / 100));
                      }
                    }

                    const effSavingsPct = effCompare && effCompare > price ? Math.round(((effCompare - price) / effCompare) * 100) : null;

                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isExcluded
                            ? "bg-muted/30 border-dashed border-border opacity-70"
                            : hasCustom
                            ? "bg-card border-primary/40 shadow-xs"
                            : "bg-card border-border"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Product Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-muted/20 border border-border p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={resolveProductImage(p.image_url, p.category, p.name)}
                                alt={p.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-display font-bold text-xs text-foreground truncate max-w-sm">
                                  {p.name}
                                </h4>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold uppercase">
                                  {p.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                <span>Selling Price: <strong className="text-foreground">₦{price.toLocaleString("en-NG")}</strong></span>
                                {isExcluded ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">• Excluded (Normal Price)</span>
                                ) : effCompare ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                    • Strikethrough: <span className="line-through">₦{effCompare.toLocaleString("en-NG")}</span> ({effSavingsPct}% off)
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Override Inputs */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                            {/* Custom Compare At Price */}
                            <div className="w-32">
                              <input
                                type="number"
                                placeholder="Strikethrough ₦"
                                value={override?.compare_at_price || ""}
                                disabled={isExcluded}
                                onChange={(e) => {
                                  const val = e.target.value ? Number(e.target.value) : null;
                                  updateProductOverride(p.id, { compare_at_price: val, discount_pct: null });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                              />
                            </div>

                            {/* Custom Badge */}
                            <div className="w-28">
                              <input
                                type="text"
                                placeholder="Badge tag"
                                value={override?.custom_badge || ""}
                                disabled={isExcluded}
                                onChange={(e) => {
                                  updateProductOverride(p.id, { custom_badge: e.target.value || null });
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
                              />
                            </div>

                            {/* Exclude Toggle Button */}
                            <button
                              type="button"
                              onClick={() => updateProductOverride(p.id, { exclude: !isExcluded })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isExcluded
                                  ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                                  : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                              }`}
                              title={isExcluded ? "Click to include in promos" : "Click to exclude this product from discounts"}
                            >
                              {isExcluded ? "Excluded" : "Exclude"}
                            </button>

                            {/* Reset Button */}
                            {hasCustom && (
                              <button
                                type="button"
                                onClick={() => removeProductOverride(p.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Reset to storewide default"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={savePromo}
                disabled={savingPromo}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
              >
                <Save size={14} /> {savingPromo ? "Saving..." : "Save All Promotional Pricing & Overrides"}
              </button>
            </div>
          </div>
        </section>

        {/* HERO CAROUSEL */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <GalleryHorizontal size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground leading-tight">Hero Carousel Slides</h2>
                <p className="text-xs text-muted-foreground">Slides displayed at the top of /retail</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addSlide}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all shadow-xs"
              >
                <Plus size={13} /> Add Blank Slide
              </button>
            </div>
          </div>

          {slides.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3">
              <GalleryHorizontal size={28} className="mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No hero slides configured yet. When empty, the site automatically displays the honest real catalog count.
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => addSlideFromPreset("deye-5kw")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  <Plus size={12} /> Add Deye Inverter Slide
                </button>
                <button
                  type="button"
                  onClick={() => addSlideFromPreset("srne-battery")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted"
                >
                  <Plus size={12} /> Add SRNE Battery Slide
                </button>
                <button
                  type="button"
                  onClick={() => addSlideFromPreset("solar-pack-5kva")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted"
                >
                  <Plus size={12} /> Add Solar Package Slide
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {slides.map((slide, i) => (
              <div key={slide.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      Slide {i + 1}{slide.headline ? `: ${slide.headline.slice(0, 35)}...` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSlide(slide.id, -1)}
                      disabled={i === 0}
                      title="Move Up"
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSlide(slide.id, 1)}
                      disabled={i === slides.length - 1}
                      title="Move Down"
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => updateSlide(slide.id, { is_active: !slide.is_active })}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ml-1 ${
                        slide.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {slide.is_active ? <Eye size={11} /> : <EyeOff size={11} />} {slide.is_active ? "Live" : "Hidden"}
                    </button>
                    <button
                      onClick={() => removeSlide(slide.id)}
                      title="Delete Slide"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Quick Presets for this Slide */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Tag size={13} className="text-primary shrink-0" />
                    <span>Quick Templates:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.key}
                        type="button"
                        onClick={() => applyPresetToSlide(slide.id, tpl.key)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/40 text-[11px] font-medium text-foreground transition-all"
                      >
                        {tpl.short}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catalog Item Picker */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Feature Category</label>
                    <select
                      className={inputClass}
                      value={slide.source_type}
                      onChange={(e) => {
                        const newType = e.target.value as SourceType;
                        updateSlide(slide.id, { source_type: newType, source_id: null });
                      }}
                    >
                      <option value="custom">Custom Copy (No catalog link)</option>
                      <option value="product">Retail Product (Inverters, Batteries, Panels, Locks)</option>
                      <option value="solar_package">Solar Package (Turnkey Bundles)</option>
                      <option value="smart_lock">Smart Lock</option>
                      <option value="automation_package">Automation Package</option>
                    </select>
                  </div>

                  {slide.source_type !== "custom" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelClass}>Pick Catalog Item (Auto-fills Image & Details)</label>
                        {slide.source_id && (
                          <button
                            type="button"
                            onClick={() => syncFromSource(slide)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                          >
                            <RefreshCw size={10} /> Re-sync
                          </button>
                        )}
                      </div>
                      <select
                        className={inputClass}
                        value={slide.source_id || ""}
                        onChange={(e) => handleItemSelect(slide.id, slide.source_type, e.target.value)}
                      >
                        <option value="">Select an item to auto-populate...</option>
                        {sourceOptions(slide.source_type).map((o) => (
                          <option key={o.id} value={o.id}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Eyebrow Badge & Discount */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Badge (Small Eyebrow Text)</label>
                    <input
                      className={inputClass}
                      value={slide.badge}
                      onChange={(e) => updateSlide(slide.id, { badge: e.target.value })}
                      placeholder="e.g. Official Deye Distributor"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {BADGE_SUGGESTIONS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => updateSlide(slide.id, { badge: b })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                        >
                          +{b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Discount % (Optional tag on slide)</label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      className={inputClass}
                      value={slide.discount_pct ?? ""}
                      onChange={(e) => updateSlide(slide.id, { discount_pct: e.target.value ? Number(e.target.value) : null })}
                      placeholder="e.g. 10"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {[null, 5, 10, 15, 20].map((val) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => updateSlide(slide.id, { discount_pct: val })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border ${
                            slide.discount_pct === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {val == null ? "None" : `${val}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Headline & Subheadline */}
                <div>
                  <label className={labelClass}>Headline</label>
                  <input
                    className={`${inputClass} font-semibold`}
                    value={slide.headline}
                    onChange={(e) => updateSlide(slide.id, { headline: e.target.value })}
                    placeholder="e.g. Deye 5kW Pure Sine Wave Hybrid Inverter"
                  />
                </div>

                <div>
                  <label className={labelClass}>Subheadline Description</label>
                  <textarea
                    className={`${inputClass} min-h-[60px] resize-none`}
                    value={slide.subheadline}
                    onChange={(e) => updateSlide(slide.id, { subheadline: e.target.value })}
                    placeholder="Short product overview or benefit statement"
                  />
                </div>

                {/* Highlight line with suggestions */}
                <div>
                  <label className={labelClass}>Highlight Line (Guarantee / Dispatch)</label>
                  <input
                    className={inputClass}
                    value={slide.highlight_text}
                    onChange={(e) => updateSlide(slide.id, { highlight_text: e.target.value })}
                    placeholder="e.g. 5-Year Replacement Warranty · Same-Day Lagos Dispatch"
                  />
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    {HIGHLIGHT_SUGGESTIONS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => updateSlide(slide.id, { highlight_text: h })}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                      >
                        +{h.slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Section - Default Product Image Preview & Quick Overrides */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className="text-primary" />
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Slide Hero Image
                      </span>
                      {slide.price_ngn != null && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Price: {naira(slide.price_ngn)}
                        </span>
                      )}
                    </div>
                    {slide.source_id && (
                      <button
                        type="button"
                        onClick={() => syncFromSource(slide)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <RefreshCw size={11} /> Re-apply Catalog Product Photo
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 items-center">
                    {/* Thumbnail Preview */}
                    <div className="relative rounded-xl border border-border overflow-hidden bg-midnight h-28 flex items-center justify-center group/img">
                      {slide.image_url ? (
                        <img
                          src={slide.image_url}
                          alt={slide.headline || "Slide preview"}
                          className="w-full h-full object-contain p-1.5"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image set</span>
                      )}
                    </div>

                    {/* Image URL input & alternative background presets */}
                    <div className="sm:col-span-2 space-y-2">
                      <div>
                        <label className={labelClass}>Image URL (Auto-set to product photo by default)</label>
                        <input
                          className={inputClass}
                          value={slide.image_url}
                          onChange={(e) => updateSlide(slide.id, { image_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">Quick Backgrounds:</span>
                        <button
                          type="button"
                          onClick={() => updateSlide(slide.id, { image_url: bgSolarHero })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary text-foreground"
                        >
                          Commercial Solar
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSlide(slide.id, { image_url: bgInverterHero })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary text-foreground"
                        >
                          Inverter Closeup
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSlide(slide.id, { image_url: bgSmartLockHero })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border hover:border-primary text-foreground"
                        >
                          Smart Lock
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTAs and Links */}
                <div className="grid sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Primary CTA Button Text</label>
                    <input
                      className={inputClass}
                      value={slide.cta_text}
                      onChange={(e) => updateSlide(slide.id, { cta_text: e.target.value })}
                      placeholder="Shop Now"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {CTA_TEXT_SUGGESTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateSlide(slide.id, { cta_text: t })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Primary CTA Link (Auto-linked)</label>
                    <input
                      className={inputClass}
                      value={slide.cta_link}
                      onChange={(e) => updateSlide(slide.id, { cta_link: e.target.value })}
                      placeholder="/retail"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Secondary CTA Text (Optional)</label>
                    <input
                      className={inputClass}
                      value={slide.secondary_cta_text}
                      onChange={(e) => updateSlide(slide.id, { secondary_cta_text: e.target.value })}
                      placeholder="e.g. Load Sizing Calculator"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {SECONDARY_CTA_SUGGESTIONS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateSlide(slide.id, { secondary_cta_text: t })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground border border-border"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Secondary CTA Link</label>
                    <input
                      className={inputClass}
                      value={slide.secondary_cta_link}
                      onChange={(e) => updateSlide(slide.id, { secondary_cta_link: e.target.value })}
                      placeholder="/energy-calculator"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={saveHero}
              disabled={savingHero}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={14} /> {savingHero ? "Saving..." : "Save Hero Carousel"}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminRetailPromotions;
