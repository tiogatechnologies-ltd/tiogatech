import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";

interface HeroSlideContent {
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

interface RetailHeroCarouselProps {
  /** Real, currently-loaded catalog size - used only for the honest fallback slide below. */
  productCount?: number;
}

export const RetailHeroCarousel = ({ productCount = 0 }: RetailHeroCarouselProps) => {
  const { content, loading } = useLandingContent("retail_hero");
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const configuredSlides = useMemo(
    () => ((content?.slides as HeroSlideContent[]) || []).filter((s) => s.is_active && s.headline),
    [content]
  );

  // Honest fallback slide when admin hasn't configured custom slides yet
  const fallbackSlide: HeroSlideContent | null = loading
    ? null
    : {
        id: "fallback",
        is_active: true,
        badge: "Official Distributor Guarantee",
        headline: productCount > 0 ? `${productCount} Tier-1 Hardware Products In Stock` : "Shop the Full Catalog",
        subheadline: "Solar inverters, lithium batteries, Tier-1 panels, smart locks and home automation hardware — in stock and ready to ship nationwide.",
        highlight_text: "Official Manufacturer Warranties · Nationwide Delivery",
        discount_pct: null,
        image_url: "/products/clear/inverter-deye-hybrid.webp",
        cta_text: "Browse Catalog",
        cta_link: "/retail",
        secondary_cta_text: "Load Sizing Calculator",
        secondary_cta_link: "/energy-calculator",
      };

  const slides = configuredSlides.length > 0 ? configuredSlides : fallbackSlide ? [fallbackSlide] : [];

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, slides.length]);

  const nextSlide = () => { setAutoplay(false); setCurrent((prev) => (prev + 1) % slides.length); };
  const prevSlide = () => { setAutoplay(false); setCurrent((prev) => (prev - 1 + slides.length) % slides.length); };

  if (slides.length === 0) return null;
  const slide = slides[current] || slides[0];

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#060913] min-h-[420px] sm:min-h-[480px] md:min-h-[520px] flex items-center mb-6 sm:mb-10 group">
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
      <div className="relative z-10 w-full p-6 sm:p-10 md:p-12 lg:p-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="md:col-span-7 space-y-4 sm:space-y-5 text-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${slide.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-3 sm:space-y-4"
              >
                {/* Eyebrow & Promotion Label */}
                {(slide.badge || (slide.discount_pct != null && slide.discount_pct > 0)) && (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {slide.badge && (
                      <span className="text-xs sm:text-sm font-semibold tracking-wider text-amber-400 uppercase">
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-[1.15] tracking-tight text-white drop-shadow-md">
                  {slide.headline}
                </h1>

                {/* Subheadline */}
                {slide.subheadline && (
                  <p className="text-xs sm:text-sm md:text-base text-gray-300/90 leading-relaxed max-w-xl line-clamp-3">
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
                  <Link
                    to={slide.cta_link}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-midnight font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <span>{slide.cta_text}</span>
                    <ArrowRight size={15} />
                  </Link>

                  {slide.secondary_cta_text && slide.secondary_cta_link && (
                    <Link
                      to={slide.secondary_cta_link}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 active:scale-95 transition-all text-center"
                    >
                      <span>{slide.secondary_cta_text}</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Floating Product Showcase */}
          <div className="md:col-span-5 flex items-center justify-center relative min-h-[260px] sm:min-h-[300px] md:min-h-[340px] lg:min-h-[380px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`showcase-${slide.id}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px]"
              >
                {/* Glowing Circular Halo & Glass Pedestal */}
                <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl pointer-events-none" />
                <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-500/15 via-primary/20 to-transparent blur-xl pointer-events-none" />

                {/* Floating Product Image Container */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 w-full h-[230px] sm:h-[280px] lg:h-[330px] flex items-center justify-center p-2"
                >
                  <img
                    src={slide.image_url}
                    alt={slide.headline}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] filter transition-transform duration-500 hover:scale-105"
                  />
                </motion.div>


                {/* Soft ground shadow beneath the floating product */}
                <div className="absolute -bottom-4 w-44 sm:w-56 h-5 bg-black/60 rounded-full blur-xl pointer-events-none" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nav Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="grid place-items-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center px-1">
            {slides.map((s, idx) => (
              // The visible dot stays small, but the button itself is a full
              // touch target - the pill alone was only 6px tall, far below the
              // ~44px minimum, so it was very hard to tap on a phone.
              <button
                key={s.id}
                onClick={() => { setAutoplay(false); setCurrent(idx); }}
                aria-label={`Go to slide ${idx + 1} of ${slides.length}`}
                aria-current={idx === current ? "true" : undefined}
                className="grid place-items-center h-10 w-5 sm:h-11 sm:w-6 group"
              >
                <span
                  className={`block h-1.5 sm:h-2 rounded-full transition-all ${
                    idx === current ? "w-5 sm:w-6 bg-amber-400" : "w-1.5 sm:w-2 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="grid place-items-center h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RetailHeroCarousel;
