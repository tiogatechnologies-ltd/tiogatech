import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { formatRetailPrice, masterPriceFor } from "@/lib/retailPricing";
import { resolveProductImage, handleProductImageError } from "@/lib/productImages";
import { resolveCampaignEndsAt, useSharedCountdown } from "@/lib/countdownTicker";

export interface HeroSlideContent {
  id: string;
  is_active: boolean;
  badge: string;
  headline: string;
  subheadline: string;
  highlight_text: string;
  discount_pct: number | null;
  image_url: string;
  cta_text: string;
  cta_link: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  price_ngn?: number;
  promo_price_ngn?: number;
}

export const FEATURED_SRNE_20KW_SLIDE: HeroSlideContent = {
  id: "srne-20kw-commercial",
  is_active: true,
  badge: "Commercial & Industrial Grade",
  headline: "Meet the SRNE 20KW Three-Phase Inverter",
  subheadline:
    "Built for large homes, offices, hotels, workshops, and commercial applications. With 30KW PV input, 360A battery charge/discharge, dual MPPTs, 1,000V max PV voltage, and up to 120KW parallel capacity, it’s designed to handle serious power demands.",
  highlight_text: "Distributors & Installers: High capacity project? Let’s talk · DM for price & full specifications",
  discount_pct: null,
  image_url: "/products/srne/srne-inv-asp-20kw.png",
  cta_text: "DM for Price & Specs",
  cta_link:
    "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20am%20interested%20in%20the%20SRNE%2020KW%20Three-Phase%20Inverter%20for%20my%20project.%20Kindly%20provide%20pricing%20and%20full%20specifications.",
  secondary_cta_text: "View Full Specifications",
  secondary_cta_link: "/product/srne-20kw-48v-three-phase-mppt-inverter-charger-asp48200sh3-00000110",
};

export const FEATURED_ECOFLOW_SLIDES: HeroSlideContent[] = [
  {
    id: "ecoflow-delta-3-air-2000",
    is_active: true,
    badge: "Special Promo · EcoFlow Authorized",
    headline: "EcoFlow DELTA 3 AIR 2000",
    subheadline:
      "AC output: 2000W (Surge 2400W) · Capacity: 1920Wh · 13 Output ports (AC × 4) · Weight: 23Kg · Recharge Time: 81 Mins (2300W Wall Charge).",
    highlight_text: "Promo Price: ₦959,400 (Retail: ₦1,066,000) · 10% OFF · Official Warranty",
    discount_pct: 10,
    price_ngn: 1066000,
    promo_price_ngn: 959400,
    image_url: "/products/ecoflow/ecoflow-delta-3-air-2000.png",
    cta_text: "Claim Promo Price",
    cta_link:
      "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20want%20to%20order%20the%20EcoFlow%20DELTA%203%20AIR%202000%20at%20the%20Promo%20Price%20of%20%E2%82%A6959%2C400.",
    secondary_cta_text: "View EcoFlow Catalog",
    secondary_cta_link: "/retail?brand=EcoFlow",
  },
  {
    id: "ecoflow-delta-3-max",
    is_active: true,
    badge: "Special Promo · Heavy-Duty Backup",
    headline: "EcoFlow DELTA 3 Max",
    subheadline:
      "AC output: 2400W (Surge 4800W) · Capacity: 2048Wh · 13 Output ports (AC × 4) · Weight: 23Kg · Recharge Time: 81 Mins (2300W Wall Charge).",
    highlight_text: "Promo Price: ₦1,404,000 (Retail: ₦1,560,000) · 10% OFF · Official Warranty",
    discount_pct: 10,
    price_ngn: 1560000,
    promo_price_ngn: 1404000,
    image_url: "/products/ecoflow/ecoflow-delta-3-max.png",
    cta_text: "Claim Promo Price",
    cta_link:
      "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20want%20to%20order%20the%20EcoFlow%20DELTA%203%20Max%20at%20the%20Promo%20Price%20of%20%E2%82%A61%2C404%2C000.",
    secondary_cta_text: "View EcoFlow Catalog",
    secondary_cta_link: "/retail?brand=EcoFlow",
  },
  {
    id: "ecoflow-river-3-max-plus",
    is_active: true,
    badge: "Special Promo · Expandable Capacity",
    headline: "EcoFlow RIVER 3 Max Plus",
    subheadline:
      "AC output: 500W (Surge 650W) · Capacity: 858Wh · 9 Output ports + wireless port · Weight: 10Kg · Recharge Time: 0-100% in 1.8 Hr.",
    highlight_text: "Promo Price: ₦594,945 (Retail: ₦661,050) · 10% OFF · Official Warranty",
    discount_pct: 10,
    price_ngn: 661050,
    promo_price_ngn: 594945,
    image_url: "/products/ecoflow/ecoflow-river-3-max-plus.png",
    cta_text: "Claim Promo Price",
    cta_link:
      "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20want%20to%20order%20the%20EcoFlow%20RIVER%203%20Max%20Plus%20at%20the%20Promo%20Price%20of%20%E2%82%A6594%2C945.",
    secondary_cta_text: "View EcoFlow Catalog",
    secondary_cta_link: "/retail?brand=EcoFlow",
  },
  {
    id: "ecoflow-river-3-max",
    is_active: true,
    badge: "Special Promo · Compact & Portable",
    headline: "EcoFlow RIVER 3 Max",
    subheadline:
      "AC output: 500W (Surge 650W) · Capacity: 572Wh · 8 Output ports · Weight: 8.4Kg · Recharge Time: 0-100% in 1-3 Hr.",
    highlight_text: "Promo Price: ₦491,400 (Retail: ₦546,000) · 10% OFF · Official Warranty",
    discount_pct: 10,
    price_ngn: 546000,
    promo_price_ngn: 491400,
    image_url: "/products/ecoflow/ecoflow-river-3-max.png",
    cta_text: "Claim Promo Price",
    cta_link:
      "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20want%20to%20order%20the%20EcoFlow%20RIVER%203%20Max%20at%20the%20Promo%20Price%20of%20%E2%82%A6491%2C400.",
    secondary_cta_text: "View EcoFlow Catalog",
    secondary_cta_link: "/retail?brand=EcoFlow",
  },
  {
    id: "ecoflow-e980",
    is_active: true,
    badge: "Special Promo · Fast Recharge Powerhouse",
    headline: "EcoFlow E980",
    subheadline:
      "AC output: 500W (Surge 650W) X-Boost to 650W · Capacity: 980Wh · 13 Output ports · Weight: 13Kg · Recharge Time: 0-100% in 2 Hr.",
    highlight_text: "Promo Price: ₦527,670 (Retail: ₦586,300) · 10% OFF · Official Warranty",
    discount_pct: 10,
    price_ngn: 586300,
    promo_price_ngn: 527670,
    image_url: "/products/ecoflow/ecoflow-e980.png",
    cta_text: "Claim Promo Price",
    cta_link:
      "https://wa.me/2348178000023?text=Hello%20Tioga%20Technologies%2C%20I%20want%20to%20order%20the%20EcoFlow%20E980%20at%20the%20Promo%20Price%20of%20%E2%82%A6527%2C670.",
    secondary_cta_text: "View EcoFlow Catalog",
    secondary_cta_link: "/retail?brand=EcoFlow",
  },
];

export const FEATURED_BLACK_FRIDAY_SLIDES: HeroSlideContent[] = [
  {
    id: "black-friday-mega-sale",
    is_active: true,
    badge: "BLACK FRIDAY",
    headline: "Our biggest sale of the year.",
    subheadline:
      "23rd - 29th November 2026. Deals on smart locks, CCTV, smart home switches, hybrid inverters, lithium batteries and solar packages.",
    highlight_text: "Up to 50% OFF Storewide · Free Installation for all Smart Locks Products",
    discount_pct: 50,
    image_url: "/banners/black-friday-sales.webp",
    cta_text: "Shop Black Friday deals",
    cta_link: "/retail?category=Smart%20Home%20%26%20Locks#catalog-grid-top",
    secondary_cta_text: "View Solar Packages",
    secondary_cta_link: "/packages",
  },
  {
    id: "black-friday-solar-offer",
    is_active: true,
    badge: "BLACK FRIDAY · SOLAR & STORAGE",
    headline: "Up to 50% OFF Solar Panels, Inverters & LiFePO4 Batteries",
    subheadline:
      "23rd - 29th November 2026. Power your home or business 24/7 with Tier-1 SRNE, itel, Deye & Luxpower hybrid inverters and Grade-A lithium storage.",
    highlight_text: "Zero-Flicker UPS · 6,000+ Cycle LiFePO4 · Nationwide Dispatch",
    discount_pct: 50,
    image_url: "/banners/black-friday-solar-offer.webp",
    cta_text: "Shop Solar & Batteries",
    cta_link: "/retail?category=Solar%2C%20Inverters%20%26%20Batteries#catalog-grid-top",
    secondary_cta_text: "Spread Payments",
    secondary_cta_link: "/finance/apply",
  },
];

export const SRNE_BF_CAROUSEL_IMAGES: readonly string[] = [
  "/banners/bf-srne-carousel-1.webp",
  "/banners/bf-srne-carousel-2.webp",
  "/banners/bf-srne-carousel-3.webp",
];

export const FEATURED_SRNE_BF_CAROUSEL_SLIDE: HeroSlideContent = {
  id: "bf-srne-carousel",
  is_active: true,
  badge: "BLACK FRIDAY · SRNE 5KW SOLAR",
  headline: "Your whole house can stay on for 5 hours after NEPA takes light.",
  subheadline:
    "5kW SRNE Hybrid Inverter + 5.12kWh LiFePO4 Battery with 30kW room to grow. Runs lights, fans, TVs, laptops, fridge, freezer and water pump seamlessly. Up to 50% OFF through Black Friday.",
  highlight_text: "5kW Load · 5.12kWh Storage · 5hrs Night Backup · Up to 50% OFF",
  discount_pct: 50,
  image_url: "/banners/bf-srne-carousel-1.webp",
  cta_text: "View Core 5 Package",
  cta_link: "/packages/solar/8bc5e8ee-5622-415d-a316-148112cdbf0c",
  secondary_cta_text: "Shop SRNE Deals",
  secondary_cta_link: "/retail?brand=SRNE#catalog-grid-top",
};

export const DEFAULT_HERO_SLIDES: HeroSlideContent[] = [
  ...FEATURED_BLACK_FRIDAY_SLIDES,
  FEATURED_SRNE_BF_CAROUSEL_SLIDE,
  FEATURED_SRNE_20KW_SLIDE,
  {
    id: "felicity-5kwh-lifepo4-featured",
    is_active: true,
    badge: "Tier-1 LiFePO4 Energy Storage",
    headline: "Felicity Solar 5.12kWh 100Ah LiFePO4 Battery (FL-LPBF48100)",
    subheadline:
      "Tier-1 Grade-A Lithium Iron Phosphate (LiFePO4) battery module with 6,000+ deep cycles, built-in intelligent battery management system (BMS), and parallel expansion up to 15 units.",
    highlight_text: "6,000+ Deep Cycles · Built-in Smart BMS Protection",
    discount_pct: 5,
    image_url: "/products/core/felicity-5kwh-lifepo4.webp",
    cta_text: "Shop Now",
    cta_link: "/product/felicity-solar-5-12kwh-100ah-lifepo4-battery-fl-lpbf48100-00000008",
    secondary_cta_text: "Spread Payments",
    secondary_cta_link: "/finance/apply",
  },
  {
    id: "deye-5kw-hybrid-featured",
    is_active: true,
    badge: "Official Deye Distributor",
    headline: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)",
    subheadline:
      "Pure sine wave low-voltage single-phase hybrid solar inverter with dual MPPT tracker, color touch LCD screen, generator auto-start compatibility, and zero-flicker UPS transfer.",
    highlight_text: "5-Year Replacement Warranty · Same-Day Lagos & Abuja Dispatch",
    discount_pct: 5,
    image_url: "/products/core/deye-5kw-hybrid.webp",
    cta_text: "Shop Now",
    cta_link: "/product/deye-5kw-hybrid-inverter-sun-5k-sg03lp1-eu-11111001",
    secondary_cta_text: "Load Sizing Calculator",
    secondary_cta_link: "/energy-calculator",
  },
];

interface RetailHeroCarouselProps {
  /** Real, currently-loaded catalog size - used only for the honest fallback slide below. */
  productCount?: number;
  onSelectCategory?: (category: string) => void;
}

// Banner prices must use the same quote column as the catalogue. These used
// to apply an extra 10% discount which is absent from the master sheet.
export function priceHeroSlide(slide: HeroSlideContent): HeroSlideContent {
  const cleanSlide: HeroSlideContent = {
    ...slide,
    headline: (slide.headline || "").replace(/\s*\u2014\s*/g, " · "),
    subheadline: (slide.subheadline || "").replace(/\s*\u2014\s*/g, " - "),
    badge: (slide.badge || "").replace(/\s*\u2014\s*/g, " · "),
    highlight_text: (slide.highlight_text || "").replace(/\s*\u2014\s*/g, " · "),
  };
  const sourceIds: Record<string, string> = {
    "ecoflow-river-3-max-plus": "PPS-019", "ecoflow-river-3-max": "PPS-016", "ecoflow-e980": "PPS-020",
    "srne-20kw-commercial": "INV-120",
  };
  const sku = sourceIds[cleanSlide.id];
  const price = masterPriceFor({ name: cleanSlide.headline, sku });
  if (price === undefined) return cleanSlide;
  const ecoflow = cleanSlide.id.startsWith("ecoflow-");
  return { ...cleanSlide, badge: ecoflow ? "EcoFlow Authorized" : cleanSlide.badge, discount_pct: null, price_ngn: undefined, promo_price_ngn: price ?? undefined,
    highlight_text: price === null ? "Contact us for a current quote" : `Price: ${formatRetailPrice(price)}${ecoflow ? " · Official Warranty" : ""}`, cta_text: price === null ? "Request a Quote" : "Order Now",
    cta_link: cleanSlide.cta_link.includes("wa.me/") ? `https://wa.me/2348178000023?text=${encodeURIComponent(`Hello Tioga Technologies, I want to order the ${cleanSlide.headline}${price === null ? ". Please send a quote" : ` at ${formatRetailPrice(price)}`}.`)}` : cleanSlide.cta_link };
}

export const RetailHeroCarousel = ({ productCount = 0, onSelectCategory }: RetailHeroCarouselProps) => {
  const { content, loading } = useLandingContent("retail_hero");
  const { content: flashDealContent } = useLandingContent("flash_deal");
  const { settings: promos } = useSiteSetting("promotions");
  const { settings: features } = useSiteSetting("features");
  const flexiblePaymentEnabled = features?.flexible_payment_enabled !== false;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const rawEndsAt = (flashDealContent as any)?.ends_at;
  const campaignEndsAt = resolveCampaignEndsAt(rawEndsAt);
  const heroCountdown = useSharedCountdown(campaignEndsAt);
  const isFlashDealDisabled = flashDealContent && (flashDealContent as any).is_active === false;

  const rawConfiguredSlides = useMemo(
    () => (Array.isArray(content?.slides) ? (content.slides as HeroSlideContent[]) : []),
    [content]
  );

  const hiddenSlideIds = useMemo(
    () => new Set(rawConfiguredSlides.filter((s) => s.is_active === false).map((s) => s.id)),
    [rawConfiguredSlides]
  );

  const configuredSlides = useMemo(
    () => rawConfiguredSlides.filter((s) => s.is_active && s.headline),
    [rawConfiguredSlides]
  );

  const showBfBadges = promos?.show_black_friday_badges !== false;

  const slides = useMemo(() => {
    // If admin explicitly saved a slides array and hid all of them, return empty
    if (Array.isArray(content?.slides) && content.slides.length > 0 && configuredSlides.length === 0) {
      return [];
    }

    // If no configured slides in database, start with the full default list
    const base = configuredSlides.length > 0 ? [...configuredSlides] : [...DEFAULT_HERO_SLIDES];

    // Filter out EcoFlow slides from the hero carousel
    const ecoflowIds = new Set(FEATURED_ECOFLOW_SLIDES.map((s) => s.id));
    const withoutEcoflow = base.filter(
      (s) => !ecoflowIds.has(s.id) && !s.id?.startsWith("ecoflow-") && !/ecoflow/i.test(s.headline || "")
    );

    // Include Black Friday flagship banners + combined SRNE Black Friday panoramic carousel when active
    const bfSlidesPool = [...FEATURED_BLACK_FRIDAY_SLIDES, FEATURED_SRNE_BF_CAROUSEL_SLIDE];
    const bfIds = new Set(bfSlidesPool.map((s) => s.id));
    const withoutBf = withoutEcoflow.filter(
      (s) => !bfIds.has(s.id) && !s.id?.startsWith("bf-srne-carousel"),
    );
    const activeBfSlides = showBfBadges
      ? bfSlidesPool.filter((s) => !hiddenSlideIds.has(s.id))
      : [];
    const ordered = [...activeBfSlides, ...withoutBf];

    // Ensure the SRNE 20kW flagship slide is present unless explicitly hidden by admin
    const hasSrne20kw = ordered.some(
      (s) =>
        s.id === FEATURED_SRNE_20KW_SLIDE.id ||
        s.headline?.toLowerCase().includes("srne 20kw") ||
        s.headline?.toLowerCase().includes("srne 20 kw")
    );
    if (!hasSrne20kw && !hiddenSlideIds.has(FEATURED_SRNE_20KW_SLIDE.id)) {
      ordered.push(FEATURED_SRNE_20KW_SLIDE);
    }

    return ordered.filter((s) => s.is_active && s.headline && !hiddenSlideIds.has(s.id)).map(priceHeroSlide);
  }, [content?.slides, configuredSlides, hiddenSlideIds, showBfBadges]);

  const totalSlides = slides.length;

  // Keep current slide within bounds
  useEffect(() => {
    if (current >= totalSlides) setCurrent(0);
  }, [totalSlides, current]);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay with pause on hover/touch (give the panoramic scrolling SRNE carousel extra time)
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const activeSlideId = slides[current]?.id;
    const delayMs = activeSlideId === FEATURED_SRNE_BF_CAROUSEL_SLIDE.id ? 14000 : 6000;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [isPaused, totalSlides, current, slides]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (promos?.show_hero_banner === false || (content && content.is_active === false) || slides.length === 0) {
    return null;
  }
  const slide = slides[current] || slides[0];

  return (
    <div
      role="region"
      aria-label="Featured Promotions Carousel"
      className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-emerald-500/15 bg-[#07110b] min-h-[380px] sm:min-h-[420px] md:min-h-[440px] flex items-center mb-6 sm:mb-7 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Clean Architectural Dark Emerald Backdrop (Intavalto-inspired) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 85% at 72% 55%, rgba(22, 163, 74, 0.22) 0%, rgba(7, 17, 11, 0.92) 60%, #060d08 100%)",
        }}
      />

      {/* Slide Content Grid: Left Text + Countdown + CTA | Right Floating Hardware Collage */}
      <div className="relative z-10 w-full px-5 py-6 sm:px-8 sm:py-8 md:px-11 md:py-9 pb-14 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: Tag, Headline, Dates, 4-Box Countdown & CTA */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3.5 text-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${slide.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="space-y-3.5"
              >
                {/* Eyebrow Squared Label (NO pills) */}
                <div className="flex items-center gap-2 flex-wrap">
                  {showBfBadges && (
                    <span
                      data-testid="hero-black-friday-badge"
                      className="inline-flex items-center px-3 py-1 rounded-md bg-[#16a34a] text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest shadow-xs"
                    >
                      BLACK FRIDAY
                    </span>
                  )}
                  {slide.badge && (!showBfBadges || !slide.badge.toLowerCase().includes("black friday")) && (
                    <span className="text-[11px] font-semibold tracking-wider text-neutral-300 uppercase">
                      {showBfBadges ? `· ${slide.badge}` : slide.badge}
                    </span>
                  )}
                </div>

                {/* Headline with crisp emerald accent on Black Friday flagship */}
                <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-display font-extrabold leading-[1.12] tracking-tight text-white">
                  {slide.id === "black-friday-mega-sale" ? (
                    <>
                      Our biggest sale{" "}
                      <span className="text-[#22c55e]">of the year.</span>
                    </>
                  ) : (
                    slide.headline
                  )}
                </h1>

                {/* Promotional & Retail Pricing Block (for product-specific slides) */}
                {(slide.promo_price_ngn != null || slide.price_ngn != null) && (
                  <div className="flex items-baseline flex-wrap gap-2.5 sm:gap-3.5 pt-0.5">
                    {slide.promo_price_ngn != null ? (
                      <>
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#22c55e] tracking-tight tabular-nums">
                          ₦{slide.promo_price_ngn.toLocaleString()}
                        </span>
                        {slide.price_ngn != null && (
                          <span className="text-xs sm:text-sm text-neutral-400 line-through tabular-nums">
                            ₦{slide.price_ngn.toLocaleString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#22c55e] tracking-tight tabular-nums">
                        ₦{slide.price_ngn!.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Subheadline */}
                {slide.subheadline && (
                  <p className="text-xs sm:text-sm text-neutral-300/95 leading-relaxed max-w-md">
                    {slide.subheadline}
                  </p>
                )}

                {/* WS5: Intavalto-style 4-Box Honest Countdown ("DEALS END IN") */}
                {showBfBadges && heroCountdown.active && !isFlashDealDisabled && (
                  <div
                    role="timer"
                    aria-live="off"
                    aria-label="Black Friday deals countdown"
                    data-testid="hero-bf-countdown"
                    className="pt-1"
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">
                      Deals end in
                    </span>
                    <div className="inline-grid grid-cols-4 gap-2 tabular-nums">
                      {[
                        { val: heroCountdown.d, label: "DAYS" },
                        { val: heroCountdown.h, label: "HRS" },
                        { val: heroCountdown.m, label: "MINS" },
                        { val: heroCountdown.s, label: "SECS" },
                      ].map((unit) => (
                        <div
                          key={unit.label}
                          className="min-w-[54px] sm:min-w-[60px] rounded-md bg-white/[0.08] border border-white/15 px-2.5 py-2 text-center backdrop-blur-sm shadow-inner"
                        >
                          <span className="block font-mono text-lg sm:text-xl font-extrabold text-white leading-none">
                            {String(unit.val).padStart(2, "0")}
                          </span>
                          <span className="block text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1 leading-none">
                            {unit.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTAs (Squared rounded-md buttons matching Intavalto) */}
                <div className="pt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {slide.cta_link?.startsWith("http") ? (
                    <a
                      href={slide.cta_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm transition-colors shadow-md shadow-emerald-950/50"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight size={15} />
                    </a>
                  ) : slide.cta_link?.includes("category=") || slide.cta_link?.includes("#catalog-grid-top") ? (
                    <Link
                      to={slide.cta_link}
                      onClick={(e) => {
                        if (onSelectCategory) {
                          const match = slide.cta_link.match(/[?&]category=([^&#]+)/);
                          const cat = match ? decodeURIComponent(match[1]) : "all";
                          e.preventDefault();
                          onSelectCategory(cat);
                        } else {
                          setTimeout(() => {
                            document.getElementById("catalog-grid-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 50);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-md shadow-emerald-950/50"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <Link
                      to={slide.cta_link}
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-md bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm transition-colors shadow-md shadow-emerald-950/50"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight size={15} />
                    </Link>
                  )}

                  {slide.secondary_cta_text &&
                    slide.secondary_cta_link &&
                    (flexiblePaymentEnabled || !slide.secondary_cta_link.includes("/finance")) && (
                    slide.secondary_cta_link.startsWith("http") ? (
                      <a
                        href={slide.secondary_cta_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs sm:text-sm border border-white/15 transition-colors text-center"
                      >
                        <span>{slide.secondary_cta_text}</span>
                      </a>
                    ) : (
                      <Link
                        to={slide.secondary_cta_link}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs sm:text-sm border border-white/15 transition-colors text-center"
                      >
                        <span>{slide.secondary_cta_text}</span>
                      </Link>
                    )
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Clean Floating Hardware Composition (Intavalto-inspired, no boxy white frame) */}
          <div className="md:col-span-6 lg:col-span-7 flex items-center justify-center relative min-h-[240px] sm:min-h-[300px] md:min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`showcase-${slide.id}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.32, ease: "easeOut" }}
                className="relative flex items-center justify-center w-full"
              >
                {slide.id === "black-friday-mega-sale" ? (
                  /* Floating Real Tioga Hardware Group (Smart Locks, CCTV, Switches, Solar Inverter & LiFePO4 Battery) */
                  <div className="relative w-full max-w-[540px] h-[250px] sm:h-[310px] md:h-[340px] flex items-end justify-center">
                    {/* Back layer: Solar Panels + Hybrid Inverter + LiFePO4 Battery */}
                    <img
                      src="/products/categories/cat-solar-panels.png"
                      alt="Solar Panels"
                      loading="eager"
                      className="absolute left-[42%] top-[4%] h-[58%] w-auto object-contain opacity-90 drop-shadow-[0_18px_32px_rgba(0,0,0,0.65)]"
                    />
                    <img
                      src="/products/categories/cat-inverters.png"
                      alt="Hybrid Solar Inverter"
                      loading="eager"
                      className="absolute right-[10%] bottom-[6%] h-[78%] w-auto object-contain z-10 drop-shadow-[0_22px_36px_rgba(0,0,0,0.75)]"
                    />
                    <img
                      src="/products/categories/cat-batteries.png"
                      alt="LiFePO4 Battery Storage"
                      loading="eager"
                      className="absolute right-0 bottom-[4%] h-[52%] w-auto object-contain z-20 drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]"
                    />
                    {/* Mid-left layer: Control Panel + Smart Door Lock */}
                    <img
                      src="/products/categories/cat-control-panels.png"
                      alt="Smart Control Panel"
                      loading="eager"
                      className="absolute left-[4%] bottom-[16%] h-[54%] w-auto object-contain z-10 drop-shadow-[0_18px_30px_rgba(0,0,0,0.7)]"
                    />
                    <img
                      src="/products/categories/cat-smart-locks.png"
                      alt="Biometric Smart Door Lock"
                      loading="eager"
                      className="absolute left-[29%] bottom-[8%] h-[74%] w-auto object-contain z-20 drop-shadow-[0_22px_34px_rgba(0,0,0,0.8)]"
                    />
                    {/* Front-left highlight: Smart CCTV Camera */}
                    <img
                      src="/products/categories/cat-cctv.png"
                      alt="Smart Security Camera"
                      loading="eager"
                      className="absolute left-[14%] bottom-[4%] h-[48%] w-auto object-contain z-30 drop-shadow-[0_16px_26px_rgba(0,0,0,0.85)]"
                    />
                  </div>
                ) : slide.id === FEATURED_SRNE_BF_CAROUSEL_SLIDE.id ? (
                  /* Seamless 3-panel panoramic SRNE Black Friday carousel slowly scrolling inside the image box */
                  <div
                    data-testid="srne-bf-panoramic-carousel"
                    className="relative w-full h-[270px] sm:h-[320px] md:h-[350px] rounded-xl overflow-hidden border border-white/15 bg-[#050806] shadow-2xl"
                  >
                    <div className="flex h-full w-max items-stretch animate-tioga-carousel-scroll">
                      {[...SRNE_BF_CAROUSEL_IMAGES, ...SRNE_BF_CAROUSEL_IMAGES].map((src, idx) => (
                        <img
                          key={`${src}-${idx}`}
                          src={src}
                          alt={`Tioga SRNE Black Friday 5kW Solar Offer - Panel ${(idx % SRNE_BF_CAROUSEL_IMAGES.length) + 1}`}
                          loading="eager"
                          decoding="async"
                          draggable={false}
                          className="h-full w-auto max-w-none shrink-0 block select-none object-contain"
                        />
                      ))}
                    </div>
                    {/* Subtle edge vignettes so panels enter and exit cleanly */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#050806]/70 to-transparent"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#050806]/70 to-transparent"
                    />
                  </div>
                ) : slide.image_url?.startsWith("/banners/") ? (
                  <div className="relative w-full h-[250px] sm:h-[310px] md:h-[340px] rounded-xl overflow-hidden border border-white/15 bg-black/30 flex items-center justify-center p-3">
                    <img
                      src={slide.image_url}
                      alt={slide.headline}
                      loading="eager"
                      decoding="async"
                      className="max-w-full max-h-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.6)]"
                    />
                  </div>
                ) : (
                  <div className="relative z-10 w-full h-[240px] sm:h-[300px] md:h-[340px] flex items-center justify-center p-4">
                    <img
                      src={resolveProductImage(slide.image_url)}
                      onError={handleProductImageError}
                      alt={slide.headline}
                      loading="eager"
                      decoding="async"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_22px_36px_rgba(0,0,0,0.75)]"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom-left Slide Indicators + Bottom-right Prev/Next Controls */}
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-3.5 left-5 sm:left-8 md:left-11 z-20 flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1} of ${slides.length}`}
                aria-current={idx === current ? "true" : undefined}
                className="py-2 flex items-center"
              >
                <span
                  className={`block h-1.5 rounded-sm transition-all ${
                    idx === current
                      ? "w-6 bg-[#22c55e]"
                      : "w-1.5 bg-white/35 hover:bg-white/65"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-5 z-20 flex items-center gap-1.5">
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="grid place-items-center h-8 w-8 rounded-md bg-white/[0.08] hover:bg-white/[0.16] text-white border border-white/15 active:scale-95 transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="grid place-items-center h-8 w-8 rounded-md bg-white/[0.08] hover:bg-white/[0.16] text-white border border-white/15 active:scale-95 transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RetailHeroCarousel;
