import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Shield, Battery, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import bgSolarHero from "@/assets/bg-commercial-solar.jpg";
import bgInverterHero from "@/assets/bg-panel-closeup.jpg";
import bgSmartLockHero from "@/assets/bg-smartlock-apex.jpg";

interface Slide {
  id: string;
  badge: string;
  badgeIcon: typeof Zap;
  headline: string;
  subheadline: string;
  highlightText: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  image: string;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    id: "slide-1",
    badge: "Official Distributor Guarantee",
    badgeIcon: Award,
    headline: "Commercial & Residential Tier-1 Solar Inverters",
    subheadline: "Direct warehouse supply of Deye Hybrid Inverters, Felicity LiFePO4 Lithium Batteries, and Longi High-Efficiency Tier 1 Solar Panels with nationwide delivery.",
    highlightText: "Up to 5-Year Replacement Warranty",
    ctaText: "Explore Inverters & Batteries",
    ctaLink: "/retail?category=Inverters",
    secondaryCtaText: "LumiVolt Load Calculator",
    secondaryCtaLink: "/lumivolt",
    image: bgSolarHero,
    gradient: "bg-midnight/80",
  },
  {
    id: "slide-2",
    badge: "Flash Deal • 10% Bundle Rebate",
    badgeIcon: Zap,
    headline: "Complete 5kVA & 10kVA Turnkey Solar Power Packs",
    subheadline: "Pre-matched hybrid inverters with high-cycle lithium iron phosphate batteries. Zero grid changeover flicker for sensitive electronics and medical clinics.",
    highlightText: "Same-Day Dispatch in Lagos & Abuja",
    ctaText: "Shop Solar Bundles",
    ctaLink: "/packages",
    secondaryCtaText: "Apply for 12-Month Financing",
    secondaryCtaLink: "/finance",
    image: bgInverterHero,
    gradient: "bg-midnight/85",
  },
  {
    id: "slide-3",
    badge: "Advanced Smart Security",
    badgeIcon: Shield,
    headline: "STAMA 3D Face Recognition & Biometric Smart Locks",
    subheadline: "Military-grade encryption, Tuya & TTlock cloud sync, hidden physical key backup, and anti-tamper alarms for residences and luxury hospitality suites.",
    highlightText: "Free Expert Installation in Lagos",
    ctaText: "Shop Smart Locks",
    ctaLink: "/retail?category=Smart+Locks",
    secondaryCtaText: "Hotel Access Systems",
    secondaryCtaLink: "/contact",
    image: bgSmartLockHero,
    gradient: "bg-midnight/80",
  },
];

export const RetailHeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const nextSlide = () => {
    setAutoplay(false);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  };

  const prevSlide = () => {
    setAutoplay(false);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const slide = SLIDES[current];
  const BadgeIcon = slide.badgeIcon;

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
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover object-center"
          />
          <div className={`absolute inset-0 ${slide.gradient}`} />
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
          <p className="text-[11px] sm:text-xs font-semibold text-gold uppercase tracking-widest">
            {slide.badge}
          </p>

          <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white drop-shadow-md">
            {slide.headline}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed drop-shadow line-clamp-2 sm:line-clamp-3">
            {slide.subheadline}
          </p>

          <div className="text-xs font-medium text-emerald-400">
            <span>{slide.highlightText}</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <Link
              to={slide.ctaLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gold hover:bg-gold-light text-midnight font-bold text-xs sm:text-sm shadow-lg transition-all"
            >
              <span>{slide.ctaText}</span>
              <ArrowRight size={15} />
            </Link>

            {slide.secondaryCtaText && slide.secondaryCtaLink && (
              <Link
                to={slide.secondaryCtaLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all text-center"
              >
                <span>{slide.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Nav Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1 px-1">
          {SLIDES.map((s, idx) => (
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
    </div>
  );
};
