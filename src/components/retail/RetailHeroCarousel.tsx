import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Tag, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgSolarHero from "@/assets/bg-commercial-solar.jpg";

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

  // No admin-configured slide yet: show one honest, non-promotional slide built
  // from the real catalog size already loaded on this page - never fake copy.
  const fallbackSlide: HeroSlideContent | null = loading
    ? null
    : {
        id: "fallback",
        is_active: true,
        badge: "Tioga Retail Store",
        headline: productCount > 0 ? `${productCount} Products In Stock` : "Shop the Full Catalog",
        subheadline: "Solar inverters, lithium batteries, panels, smart locks and home automation hardware — in stock and ready to ship nationwide.",
        highlight_text: "",
        discount_pct: null,
        image_url: bgSolarHero,
        cta_text: "Browse Catalog",
        cta_link: "/retail",
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
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-border/60 bg-midnight min-h-[380px] sm:min-h-[460px] md:min-h-[500px] flex items-center mb-6 sm:mb-10 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={slide.image_url}
            alt={slide.headline}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-midnight/80" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content */}
      <div className="relative z-10 p-5 sm:p-8 md:p-12 lg:p-16 max-w-2xl text-white">
        <motion.div
          key={`content-${slide.id}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {slide.badge && (
              <p className="text-[11px] sm:text-xs font-semibold text-gold uppercase tracking-widest">
                {slide.badge}
              </p>
            )}
            {slide.discount_pct != null && slide.discount_pct > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-midnight text-[10px] font-extrabold uppercase tracking-wider">
                <Tag size={10} /> Save {slide.discount_pct}%
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white drop-shadow-md">
            {slide.headline}
          </h1>

          {slide.subheadline && (
            <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-3">
              {slide.subheadline}
            </p>
          )}

          {slide.highlight_text && (
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <Package size={13} />
              <span>{slide.highlight_text}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <Link
              to={slide.cta_link}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gold hover:bg-gold-light text-midnight font-bold text-xs sm:text-sm shadow-lg transition-all"
            >
              <span>{slide.cta_text}</span>
              <ArrowRight size={15} />
            </Link>

            {slide.secondary_cta_text && slide.secondary_cta_link && (
              <Link
                to={slide.secondary_cta_link}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all text-center"
              >
                <span>{slide.secondary_cta_text}</span>
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Nav Controls */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1 px-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => { setAutoplay(false); setCurrent(idx); }}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  idx === current ? "w-5 sm:w-6 bg-gold" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
