import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Trash2, ChevronUp, ChevronDown, RefreshCw, Flame, GalleryHorizontal, Eye, EyeOff } from "lucide-react";
import { invalidateLandingCache } from "@/hooks/useLandingContent";
import { useSolarPackages } from "@/hooks/useSolarPackages";
import { useSmartLocks } from "@/hooks/useSmartLocks";
import { useHomeAutomationPackages } from "@/hooks/useHomeAutomationPackages";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";
import { mergeProducts } from "@/lib/mergeProducts";
import { normalizeCategory } from "@/lib/productBrand";
import { resolveProductImage } from "@/lib/productImages";
import { productPath } from "@/lib/productSlug";

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
  badge: "",
  headline: "",
  subheadline: "",
  highlight_text: "",
  discount_pct: null,
  price_ngn: null,
  image_url: "",
  cta_text: "Shop Now",
  cta_link: "/retail",
  secondary_cta_text: "",
  secondary_cta_link: "",
});

const defaultFlashDeal: FlashDeal = {
  is_active: false,
  headline: "Mid-Month Energy Flash Deals",
  discount_label: "Up to 15% Off",
  discount_code: "TIOGA2026",
  description: "Apply this code at checkout for free 24-hour expedited dispatch on all inverter and battery storage orders.",
  perk_label: "24h Dispatch",
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

const AdminRetailPromotions = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [flashDeal, setFlashDeal] = useState<FlashDeal>(defaultFlashDeal);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingFlash, setSavingFlash] = useState(false);

  const { packages: solarPackages } = useSolarPackages();
  const { items: smartLocks } = useSmartLocks();
  const { packages: autoPackages } = useHomeAutomationPackages();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const products = useMemo(() => {
    const staticList = STATIC_PRODUCTS.map((p) => ({ ...p, category: normalizeCategory(p.category) }));
    const dbList = dbProducts.map((p) => ({ ...p, category: normalizeCategory(p.category) }));
    return mergeProducts(staticList as any[], dbList as any[]);
  }, [dbProducts]);

  useEffect(() => {
    const fetch = async () => {
      const [{ data }, { data: prodData }] = await Promise.all([
        supabase.from("landing_content").select("*").in("section_key", ["retail_hero", "flash_deal"]),
        supabase.from("products").select("*").eq("is_active", true),
      ]);
      const heroRow = (data as any[])?.find((r) => r.section_key === "retail_hero");
      const flashRow = (data as any[])?.find((r) => r.section_key === "flash_deal");
      const heroContent = heroRow?.content as { slides?: HeroSlide[] } | undefined;
      const flashContent = flashRow?.content as Partial<FlashDeal> | undefined;
      setSlides(Array.isArray(heroContent?.slides) ? heroContent.slides! : []);
      setFlashDeal(flashContent ? { ...defaultFlashDeal, ...flashContent } : defaultFlashDeal);
      setDbProducts(prodData || []);
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

  // Resolve badge/headline/image/price/link from a picked real product or package
  const syncFromSource = (slide: HeroSlide) => {
    if (slide.source_type === "custom" || !slide.source_id) return;
    if (slide.source_type === "product") {
      const p = products.find((x: any) => x.id === slide.source_id);
      if (!p) return toast.error("Product not found");
      updateSlide(slide.id, {
        headline: p.name,
        image_url: resolveProductImage((p as any).image_url, p.category, p.name),
        price_ngn: (p as any).numeric_price ?? parsePriceNaira((p as any).price),
        cta_link: productPath(p as any),
      });
    } else if (slide.source_type === "solar_package") {
      const p = solarPackages.find((x) => x.id === slide.source_id);
      if (!p) return toast.error("Solar package not found");
      updateSlide(slide.id, {
        headline: p.inverter,
        image_url: p.image,
        price_ngn: p.total_price ?? null,
        cta_link: `/packages/solar/${p.id}`,
      });
    } else if (slide.source_type === "smart_lock") {
      const p = smartLocks.find((x) => x.id === slide.source_id);
      if (!p) return toast.error("Smart lock not found");
      updateSlide(slide.id, {
        headline: p.name,
        image_url: p.image,
        price_ngn: p.price ?? null,
        cta_link: `/packages/locks/${p.id}`,
      });
    } else if (slide.source_type === "automation_package") {
      const p = autoPackages.find((x) => x.id === slide.source_id);
      if (!p) return toast.error("Automation package not found");
      updateSlide(slide.id, {
        headline: p.name,
        image_url: p.image,
        price_ngn: p.price ?? null,
        cta_link: `/packages/automation/${p.id}`,
      });
    }
    toast.success("Synced from live catalog");
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
          <h1 className="font-display text-xl font-bold text-foreground">Retail Store Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control exactly what shows in the /retail hero carousel and the flash-deals bar. Every slide pulls its name,
            image and price from a real product or package in your catalog - nothing here is placeholder content.
          </p>
        </div>

        {/* FLASH DEAL BAR */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-500" />
              <h2 className="font-display text-lg font-bold text-foreground">Flash Deals Bar</h2>
            </div>
            <button
              onClick={() => setFlashDeal((f) => ({ ...f, is_active: !f.is_active }))}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${flashDeal.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {flashDeal.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
              {flashDeal.is_active ? "Visible on site" : "Hidden"}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className={labelClass}>Headline</label>
              <input className={inputClass} value={flashDeal.headline} onChange={(e) => setFlashDeal((f) => ({ ...f, headline: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Discount label (badge)</label>
              <input className={inputClass} value={flashDeal.discount_label} onChange={(e) => setFlashDeal((f) => ({ ...f, discount_label: e.target.value }))} placeholder="e.g. Up to 15% Off" />
            </div>
            <div>
              <label className={labelClass}>Coupon code</label>
              <input className={`${inputClass} font-mono uppercase`} value={flashDeal.discount_code} onChange={(e) => setFlashDeal((f) => ({ ...f, discount_code: e.target.value.toUpperCase() }))} placeholder="e.g. TIOGA2026" />
            </div>
            <div>
              <label className={labelClass}>Perk badge (right side)</label>
              <input className={inputClass} value={flashDeal.perk_label} onChange={(e) => setFlashDeal((f) => ({ ...f, perk_label: e.target.value }))} placeholder="e.g. 24h Dispatch" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea className={`${inputClass} min-h-[60px] resize-none`} value={flashDeal.description} onChange={(e) => setFlashDeal((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Deal ends at (real deadline)</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={toDatetimeLocal(flashDeal.ends_at)}
                onChange={(e) => setFlashDeal((f) => ({ ...f, ends_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
              />
              <p className="text-[11px] text-muted-foreground mt-1">The countdown on the site counts down to this exact moment, then the bar hides itself automatically.</p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button onClick={saveFlash} disabled={savingFlash} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
              <Save size={14} /> {savingFlash ? "Saving..." : "Save Flash Deal"}
            </button>
          </div>
        </section>

        {/* HERO CAROUSEL */}
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <GalleryHorizontal size={18} className="text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Hero Carousel Slides</h2>
            </div>
            <button onClick={addSlide} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              <Plus size={12} /> Add Slide
            </button>
          </div>

          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No slides yet. Add one and pick a real product or package to feature.</p>
          )}

          <div className="space-y-4">
            {slides.map((slide, i) => (
              <div key={slide.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Slide {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSlide(slide.id, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"><ChevronUp size={13} /></button>
                    <button onClick={() => moveSlide(slide.id, 1)} disabled={i === slides.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"><ChevronDown size={13} /></button>
                    <button
                      onClick={() => updateSlide(slide.id, { is_active: !slide.is_active })}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ml-1 ${slide.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {slide.is_active ? <Eye size={10} /> : <EyeOff size={10} />} {slide.is_active ? "Live" : "Hidden"}
                    </button>
                    <button onClick={() => removeSlide(slide.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Feature</label>
                    <select
                      className={inputClass}
                      value={slide.source_type}
                      onChange={(e) => updateSlide(slide.id, { source_type: e.target.value as SourceType, source_id: null })}
                    >
                      <option value="custom">Custom (no real item linked)</option>
                      <option value="product">Retail Product</option>
                      <option value="solar_package">Solar Package</option>
                      <option value="smart_lock">Smart Lock</option>
                      <option value="automation_package">Automation Package</option>
                    </select>
                  </div>
                  {slide.source_type !== "custom" && (
                    <div>
                      <label className={labelClass}>Pick real item</label>
                      <div className="flex gap-2">
                        <select
                          className={inputClass}
                          value={slide.source_id || ""}
                          onChange={(e) => updateSlide(slide.id, { source_id: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {sourceOptions(slide.source_type).map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => syncFromSource(slide)}
                          disabled={!slide.source_id}
                          title="Pull current name, image and price from this item"
                          className="shrink-0 p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-40 text-foreground"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Badge (small eyebrow text)</label>
                    <input className={inputClass} value={slide.badge} onChange={(e) => updateSlide(slide.id, { badge: e.target.value })} placeholder="e.g. Flash Deal · 10% Off" />
                  </div>
                  <div>
                    <label className={labelClass}>Real discount % (optional, honest only)</label>
                    <input type="number" min={0} max={90} className={inputClass} value={slide.discount_pct ?? ""} onChange={(e) => updateSlide(slide.id, { discount_pct: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 10" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Headline</label>
                  <input className={inputClass} value={slide.headline} onChange={(e) => updateSlide(slide.id, { headline: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Subheadline</label>
                  <textarea className={`${inputClass} min-h-[55px] resize-none`} value={slide.subheadline} onChange={(e) => updateSlide(slide.id, { subheadline: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Highlight line (e.g. warranty, dispatch time)</label>
                  <input className={inputClass} value={slide.highlight_text} onChange={(e) => updateSlide(slide.id, { highlight_text: e.target.value })} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Image URL {slide.price_ngn != null && <span className="normal-case text-primary font-semibold">· current price {naira(slide.price_ngn)}</span>}</label>
                    <input className={inputClass} value={slide.image_url} onChange={(e) => updateSlide(slide.id, { image_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>CTA link</label>
                    <input className={inputClass} value={slide.cta_link} onChange={(e) => updateSlide(slide.id, { cta_link: e.target.value })} placeholder="/retail" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>CTA button text</label>
                    <input className={inputClass} value={slide.cta_text} onChange={(e) => updateSlide(slide.id, { cta_text: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Secondary CTA text (optional)</label>
                    <input className={inputClass} value={slide.secondary_cta_text} onChange={(e) => updateSlide(slide.id, { secondary_cta_text: e.target.value })} />
                  </div>
                </div>
                {slide.secondary_cta_text && (
                  <div>
                    <label className={labelClass}>Secondary CTA link</label>
                    <input className={inputClass} value={slide.secondary_cta_link} onChange={(e) => updateSlide(slide.id, { secondary_cta_link: e.target.value })} placeholder="/finance" />
                  </div>
                )}

                {slide.image_url && (
                  <div className="rounded-lg overflow-hidden border border-border h-24 bg-muted">
                    <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <button onClick={saveHero} disabled={savingHero} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
              <Save size={14} /> {savingHero ? "Saving..." : "Save Hero Carousel"}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminRetailPromotions;
