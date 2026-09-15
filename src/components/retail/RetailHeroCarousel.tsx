import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";

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
    "https://wa.me/2347065942426?text=Hello%20Tioga%20Technologies%2C%20I%20am%20interested%20in%20the%20SRNE%2020KW%20Three-Phase%20Inverter%20for%20my%20project.%20Kindly%20provide%20pricing%20and%20full%20specifications.",
  secondary_cta_text: "View Full Specifications",
  secondary_cta_link: "/product/srne-20kw-48v-three-phase-mppt-inverter-charger-asp48200sh3-00000110",
};

export const DEFAULT_HERO_SLIDES: HeroSlideContent[] = [
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
}

export const RetailHeroCarousel = ({ productCount = 0 }: RetailHeroCarouselProps) => {
  const { content, loading } = useLandingContent("retail_hero");
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const configuredSlides = useMemo(
    () => ((content?.slides as HeroSlideContent[]) || []).filter((s) => s.is_active && s.headline),
    [content]
  );

  const slides = useMemo(() => {
    // If no configured slides in database, start with the full default trio
    const base = configuredSlides.length > 0 ? [...configuredSlides] : [...DEFAULT_HERO_SLIDES];

    // Ensure the SRNE 20kW flagship slide is always present
    const hasSrne20kw = base.some(
      (s) =>
        s.id === FEATURED_SRNE_20KW_SLIDE.id ||
        s.headline?.toLowerCase().includes("srne 20kw") ||
        s.headline?.toLowerCase().includes("srne 20 kw")
    );
    if (!hasSrne20kw) {
      base.unshift(FEATURED_SRNE_20KW_SLIDE);
    }

    return base.filter((s) => s.is_active && s.headline);
  }, [configuredSlides]);

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

  // Autoplay with pause on hover/touch
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

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

  if (slides.length === 0) return null;
  const slide = slides[current] || slides[0];

  return (
    <div
      role="region"
      aria-label="Featured Promotions Carousel"
      className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#060913] min-h-[440px] sm:min-h-[480px] md:min-h-[520px] flex items-center mb-6 sm:mb-10 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Atmospheric Multi-Layered Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#060a17] via-[#0a1228] to-[#040711]" />

      {/* Subtle Tech Grid Texture */}
      <img
        src={bgTechMesh}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none"
      />

      {/* Dynamic Ambient Lighting Glow Orbs */}
      <div className="absolute -top-32 -left-24 w-[400px] h-[400px] rounded-full bg-amber-500/15 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full bg-gradient-to-tr from-amber-500/20 via-primary/20 to-transparent blur-[90px] pointer-events-none" />

      {/* Subtle Glass Rim Reflection */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" />

      {/* Slide Content Grid: Left Text Column + Right Floating Product Showcase */}
      <div className="relative z-10 w-full p-5 sm:p-8 md:p-12 lg:p-14 pb-16 sm:pb-12 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="md:col-span-7 space-y-3.5 sm:space-y-4 md:space-y-5 text-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${slide.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-3 sm:space-y-4"
              >
                {/* Eyebrow & Promotion Label */}
                {(slide.badge || (slide.discount_pct != null && slide.discount_pct > 0)) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {slide.badge && (
                      <span className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wider text-amber-400 uppercase">
                        {slide.badge}
                      </span>
                    )}
                    {slide.discount_pct != null && slide.discount_pct > 0 && (
                      <span className="text-xs sm:text-sm font-bold text-amber-300">
                        {slide.badge ? "· " : ""}Save {slide.discount_pct}%
                      </span>
                    )}
                  </div>
                )}

                {/* Headline */}
                <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-[1.18] tracking-tight text-white drop-shadow-md">
                  {slide.headline}
                </h1>

                {/* Subheadline */}
                {slide.subheadline && (
                  <p className="text-xs sm:text-sm md:text-base text-gray-300/90 leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-4 md:line-clamp-none">
                    {slide.subheadline}
                  </p>
                )}

                {/* Highlight line */}
                {slide.highlight_text && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-medium">
                    <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
                    <span>{slide.highlight_text}</span>
                  </div>
                )}

                {/* CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {slide.cta_link?.startsWith("http") ? (
                    <a
                      href={slide.cta_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight size={15} />
                    </a>
                  ) : (
                    <Link
                      to={slide.cta_link}
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <span>{slide.cta_text}</span>
                      <ArrowRight size={15} />
                    </Link>
                  )}

                  {slide.secondary_cta_text && slide.secondary_cta_link && (
                    slide.secondary_cta_link.startsWith("http") ? (
                      <a
                        href={slide.secondary_cta_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 active:scale-95 transition-all text-center"
                      >
                        <span>{slide.secondary_cta_text}</span>
                      </a>
                    ) : (
                      <Link
                        to={slide.secondary_cta_link}
                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 active:scale-95 transition-all text-center"
                      >
                        <span>{slide.secondary_cta_text}</span>
                      </Link>
                    )
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Floating Product Showcase */}
          <div className="md:col-span-5 flex items-center justify-center relative min-h-[200px] sm:min-h-[260px] md:min-h-[320px] lg:min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`showcase-${slide.id}`}
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative flex items-center justify-center w-full max-w-[320px] sm:max-w-[400px]"
              >
                {/* Glowing Circular Halo & Glass Pedestal */}
                <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl pointer-events-none" />
                <div className="absolute w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-amber-500/15 via-primary/20 to-transparent blur-xl pointer-events-none" />

                {/* Floating Product Image Container */}
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 w-full h-[190px] sm:h-[250px] md:h-[280px] lg:h-[320px] flex items-center justify-center p-2"
                >
                  <img
                    src={slide.image_url}
                    alt={slide.headline}
                    loading="eager"
                    decoding="async"
                    className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] filter transition-transform duration-500 hover:scale-105"
                  />
                </motion.div>

                {/* Soft ground shadow beneath the floating product */}
                <div className="absolute -bottom-4 w-40 sm:w-52 h-5 bg-black/60 rounded-full blur-xl pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nav Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="grid place-items-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/15 active:scale-95 transition-all shadow-md"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1} of ${slides.length}`}
                aria-current={idx === current ? "true" : undefined}
                className="grid place-items-center h-9 w-5 sm:h-10 sm:w-6 group"
              >
                <span
                  className={`block h-1.5 sm:h-2 rounded-full transition-all ${
                    idx === current ? "w-5 sm:w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "w-1.5 sm:w-2 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="grid place-items-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/15 active:scale-95 transition-all shadow-md"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RetailHeroCarousel;
