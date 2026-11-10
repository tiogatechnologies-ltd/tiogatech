import { useState, useEffect } from "react";
import { Flame, Clock, Truck, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";

export interface FlashDealContent {
  is_active: boolean;
  headline: string;
  discount_label: string;
  discount_code: string;
  description: string;
  perk_label: string;
  ends_at: string; // ISO
}

export const DEFAULT_FLASH_DEAL: FlashDealContent = {
  is_active: true,
  headline: "BLACK FRIDAY MEGA SALE — DEALS UP TO 50% OFF",
  discount_label: "UP TO 50% OFF",
  discount_code: "",
  description:
    "Massive Black Friday markdowns on all Solar Panels, Hybrid Inverters, LiFePO4 Lithium Batteries & Smart Home Automation. Official 5-Year Warranty & 24h Nationwide Dispatch.",
  perk_label: "24h Priority Dispatch",
  ends_at: "",
};

/**
 * Calculates countdown timer.
 * If endsAt is provided and in the future, counts down to endsAt.
 * If endsAt is empty or past, provides a dynamic rolling countdown to midnight
 * so the storefront always has an active, urgent ticking timer.
 */
const useCountdown = (endsAt: string | undefined) => {
  const [left, setLeft] = useState<{ h: number; m: number; s: number }>({ h: 12, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      let targetTime = 0;
      if (endsAt) {
        const parsed = new Date(endsAt).getTime();
        if (!Number.isNaN(parsed) && parsed > Date.now()) {
          targetTime = parsed;
        }
      }

      // If no valid future deadline was provided, roll over to midnight tonight
      if (!targetTime) {
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        targetTime = endOfDay.getTime();
      }

      const diff = Math.max(0, targetTime - Date.now());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLeft({ h, m, s });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return left;
};

export const FlashDealsBar = () => {
  const { content } = useLandingContent("flash_deal");

  // Merge loaded content with default fallback so the bar is always complete and working
  const rawDeal = (content as Partial<FlashDealContent>) || {};
  const isLegacyHeadline =
    !rawDeal.headline ||
    !/black\s*friday/i.test(rawDeal.headline);

  const deal: FlashDealContent = {
    ...DEFAULT_FLASH_DEAL,
    ...rawDeal,
    headline: isLegacyHeadline ? DEFAULT_FLASH_DEAL.headline : rawDeal.headline!,
    discount_label: isLegacyHeadline ? DEFAULT_FLASH_DEAL.discount_label : (rawDeal.discount_label || DEFAULT_FLASH_DEAL.discount_label),
    description: isLegacyHeadline ? DEFAULT_FLASH_DEAL.description : (rawDeal.description || DEFAULT_FLASH_DEAL.description),
  };

  // Hooks must run on every render regardless of is_active, or React throws
  // "Rendered fewer hooks than expected" the moment content finishes loading
  // with is_active: false.
  const timeLeft = useCountdown(deal.ends_at);
  const format = (n: number) => n.toString().padStart(2, "0");

  // If admin explicitly disabled the flash deal, respect that choice
  if (content && content.is_active === false) {
    return null;
  }

  return (
    <aside
      aria-label="Black Friday Promotional Banner"
      data-testid="black-friday-promo-bar"
      className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#070a09] via-[#0b1810] to-[#070a09] border-2 border-[#00e640]/45 p-4 sm:p-6 mb-6 sm:mb-8 shadow-[0_14px_40px_-10px_rgba(0,230,64,0.28)] ring-1 ring-[#00e640]/20 transition-all text-white overflow-hidden"
    >
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#00e640]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-red-600/15 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Highlight Flame & Black Friday Announcement */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#00e640] text-slate-950 font-bold shadow-md shadow-[#00e640]/30 shrink-0">
            <Flame size={22} className="fill-slate-950 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-black border border-[#00e640]/60 text-[10px] font-extrabold uppercase tracking-widest text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e640] animate-pulse" />
                BLACK FRIDAY
              </span>
              <span className="text-xs sm:text-sm md:text-base font-display font-extrabold uppercase tracking-wider text-[#00e640]">
                {deal.headline}
              </span>
              {deal.discount_label && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  <Tag size={10} /> {deal.discount_label}
                </span>
              )}
            </div>
            {deal.description && (
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                {deal.discount_code && (
                  <>
                    Apply code{" "}
                    <strong className="text-[#00e640] font-mono bg-[#00e640]/15 border border-[#00e640]/30 px-2 py-0.5 rounded font-bold">
                      {deal.discount_code}
                    </strong>{" "}
                  </>
                )}
                {deal.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Standout Countdown & Fast Delivery */}
        <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-white/10 shrink-0">
          {/* Live Countdown Timer */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1 text-[#00e640]">
              <Clock size={15} className="animate-spin-slow" />
              <span className="font-bold tracking-wide uppercase text-[11px]">Deal Ends:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm font-extrabold">
              <div className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                {format(timeLeft.h)}
                <span className="text-[9px] text-slate-300 font-sans ml-0.5 font-normal">h</span>
              </div>
              <span className="text-[#00e640] font-bold animate-pulse">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                {format(timeLeft.m)}
                <span className="text-[9px] text-slate-300 font-sans ml-0.5 font-normal">m</span>
              </div>
              <span className="text-[#00e640] font-bold animate-pulse">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-red-600/25 border border-red-500/50 text-red-300 shadow-xs">
                {format(timeLeft.s)}
                <span className="text-[9px] text-red-200 font-sans ml-0.5 font-normal">s</span>
              </div>
            </div>
          </div>

          {/* Value Badge */}
          {deal.perk_label && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#00e640] bg-[#00e640]/10 border border-[#00e640]/30 px-3 py-1 rounded-xl shadow-xs">
              <Truck size={14} />
              <span>{deal.perk_label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dual Official Black Friday Visual Banner Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 mt-4 pt-4 border-t border-white/10">
        <a
          href="#catalog-grid-top"
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-[#00e640]/70 bg-black/60 flex items-center justify-between transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(0,230,64,0.35)]"
        >
          <img
            src="/banners/black-friday-sales.webp"
            alt="Tioga Technologies Black Friday Mega Sale - Up to 50% OFF"
            className="w-full h-36 sm:h-44 object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end justify-between p-3.5 sm:p-4">
            <div>
              <span className="inline-block px-2 py-0.5 rounded bg-[#00e640] text-slate-950 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                SITEWIDE BLACK FRIDAY
              </span>
              <p className="text-xs sm:text-sm font-display font-bold text-white">
                Smart Home, Solar & Power Backup — Up to 50% OFF
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white text-xs font-bold group-hover:bg-[#00e640] group-hover:text-slate-950 transition-colors shrink-0">
              Shop Deals <ArrowRight size={13} />
            </span>
          </div>
        </a>

        <Link
          to="/retail?category=Inverters"
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-red-500/70 bg-white/95 flex items-center justify-between transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(220,38,38,0.35)]"
        >
          <img
            src="/banners/black-friday-solar-offer.webp"
            alt="Tioga Black Friday 50% OFF Offer - Deye Hybrid Inverter, LiFePO4 Lithium Battery & Solar Panels"
            className="w-full h-36 sm:h-44 object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3.5 sm:p-4">
            <div>
              <span className="inline-block px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1">
                50% OFF SOLAR & INVERTER STACK
              </span>
              <p className="text-xs sm:text-sm font-display font-bold text-white">
                Deye Hybrid Inverters, LiFePO4 Batteries & Tier-1 Panels
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold group-hover:bg-red-500 transition-colors shrink-0">
              Explore 50% Off <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default FlashDealsBar;
