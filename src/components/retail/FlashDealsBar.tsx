import { useState, useEffect } from "react";
import { Flame, Clock, Wrench, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import { useSiteSetting } from "@/hooks/useSiteSetting";

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
  headline: "BLACK FRIDAY MEGA SALE · DEALS UP TO 50% OFF",
  discount_label: "UP TO 50% OFF",
  discount_code: "",
  description:
    "Massive Black Friday markdowns on all Solar Panels, Hybrid Inverters, LiFePO4 Lithium Batteries & Smart Home Automation.",
  perk_label: "Free Installation for all Smart Locks Products",
  ends_at: "",
};

/**
 * Returns the timestamp (ms) for 12:00 AM (00:00:00.000) on the upcoming Friday,
 * when the 50% OFF Black Friday deal unlocks.
 */
export const getNextFridayMidnight = (now = new Date()): number => {
  const day = now.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilFriday,
    0,
    0,
    0,
    0,
  );
  return target.getTime();
};

/**
 * Counts down to 12:00 AM on Friday (when the 50% OFF deal drops).
 * If a valid future endsAt is explicitly configured, uses that; otherwise targets 12:00 AM Friday.
 */
const useCountdown = (endsAt: string | undefined) => {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number }>({
    d: 2,
    h: 5,
    m: 0,
    s: 0,
  });

  useEffect(() => {
    const tick = () => {
      let targetTime = 0;
      if (endsAt) {
        const parsed = new Date(endsAt).getTime();
        if (!Number.isNaN(parsed) && parsed > Date.now()) {
          targetTime = parsed;
        }
      }

      // Default to 12:00 AM on Friday
      if (!targetTime) {
        targetTime = getNextFridayMidnight(new Date());
      }

      const diff = Math.max(0, targetTime - Date.now());
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLeft({ d, h, m, s });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return left;
};

interface FlashDealsBarProps {
  onSelectCategory?: (category: string) => void;
}

export const FlashDealsBar = ({ onSelectCategory }: FlashDealsBarProps) => {
  const { content } = useLandingContent("flash_deal");
  const { settings: promos } = useSiteSetting("promotions");

  // Merge loaded content with default fallback so the bar is always complete and working
  const rawDeal = (content as Partial<FlashDealContent>) || {};
  const isLegacyHeadline =
    !rawDeal.headline ||
    !/black\s*friday/i.test(rawDeal.headline);

  const rawHeadline = (rawDeal.headline || "").replace(/\s*—\s*/g, " · ");
  const rawDescription = (rawDeal.description || "")
    .replace(/\s*—\s*/g, " - ")
    .replace(/\s*Official 5-Year Warranty.*$/i, "")
    .trim();

  const deal: FlashDealContent = {
    ...DEFAULT_FLASH_DEAL,
    ...rawDeal,
    headline: isLegacyHeadline ? DEFAULT_FLASH_DEAL.headline : rawHeadline,
    discount_label: isLegacyHeadline ? DEFAULT_FLASH_DEAL.discount_label : (rawDeal.discount_label || DEFAULT_FLASH_DEAL.discount_label),
    description: isLegacyHeadline ? DEFAULT_FLASH_DEAL.description : (rawDescription || DEFAULT_FLASH_DEAL.description),
    perk_label: DEFAULT_FLASH_DEAL.perk_label,
  };

  // Hooks must run on every render regardless of is_active, or React throws
  // "Rendered fewer hooks than expected" the moment content finishes loading
  // with is_active: false.
  const timeLeft = useCountdown(deal.ends_at);
  const format = (n: number) => n.toString().padStart(2, "0");

  // If admin explicitly disabled the flash deal, respect that choice
  if (promos?.show_flash_deals_bar === false || (content && content.is_active === false)) {
    return null;
  }

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(category);
    }
  };

  return (
    <aside
      aria-label="Black Friday Promotional Banner"
      data-testid="black-friday-promo-bar"
      className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#070a09] via-[#0b1810] to-[#070a09] border-2 border-[#00e640]/45 p-3.5 sm:p-6 mb-6 sm:mb-8 shadow-[0_14px_40px_-10px_rgba(0,230,64,0.28)] ring-1 ring-[#00e640]/20 transition-all text-white overflow-hidden"
    >
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#00e640]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-red-600/15 blur-3xl" />

      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3.5 sm:gap-4">
        {/* Left: Highlight Flame & Black Friday Announcement (no extra Black Friday pill) */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#00e640] text-slate-950 font-bold shadow-md shadow-[#00e640]/30 shrink-0">
            <Flame size={20} className="fill-slate-950 text-slate-950 sm:w-[22px] sm:h-[22px]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm md:text-base font-display font-extrabold uppercase tracking-wider text-[#00e640] leading-snug">
                {deal.headline}
              </span>
              {deal.discount_label && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                  <Tag size={10} /> {deal.discount_label}
                </span>
              )}
            </div>
            {deal.description && (
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 sm:mt-1.5 leading-relaxed max-w-3xl">
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

        {/* Right Section: Countdown to Friday & Free Smart Locks Installation */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5 sm:gap-5 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-3 xl:pt-0 border-white/10 shrink-0">
          {/* Live Countdown Timer to Friday */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1 text-[#00e640]">
              <Clock size={14} className="animate-spin-slow shrink-0" />
              <span className="font-bold tracking-wide uppercase text-[11px]">Friday:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-extrabold">
              {timeLeft.d > 0 && (
                <>
                  <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                    {format(timeLeft.d)}
                    <span className="text-[9px] text-slate-300 font-sans ml-0.5 font-normal">d</span>
                  </div>
                  <span className="text-[#00e640] font-bold animate-pulse">:</span>
                </>
              )}
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                {format(timeLeft.h)}
                <span className="text-[9px] text-slate-300 font-sans ml-0.5 font-normal">h</span>
              </div>
              <span className="text-[#00e640] font-bold animate-pulse">:</span>
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 text-white shadow-xs">
                {format(timeLeft.m)}
                <span className="text-[9px] text-slate-300 font-sans ml-0.5 font-normal">m</span>
              </div>
              <span className="text-[#00e640] font-bold animate-pulse">:</span>
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-red-600/25 border border-red-500/50 text-red-300 shadow-xs">
                {format(timeLeft.s)}
                <span className="text-[9px] text-red-200 font-sans ml-0.5 font-normal">s</span>
              </div>
            </div>
          </div>

          {/* Free Installation for all Smart Locks Products (inline text, not a pill) */}
          {deal.perk_label && (
            <Link
              to="/retail?category=Smart%20Door%20Locks#catalog-grid-top"
              onClick={(e) => handleCategoryClick(e, "Smart Door Locks")}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#00e640] hover:text-emerald-300 transition-colors"
            >
              <Wrench size={13} className="shrink-0" />
              <span>{deal.perk_label}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Dual Official Black Friday Visual Banner Cards (buttons open their respective categories) */}
      {promos?.show_flash_deal_cards !== false && (
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-white/10">
        <Link
          to="/retail?category=Smart%20Home%20%26%20Locks#catalog-grid-top"
          onClick={(e) => handleCategoryClick(e, "Smart Home & Locks")}
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-[#00e640]/70 bg-black/60 flex items-center justify-between transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(0,230,64,0.35)]"
        >
          <img
            src="/banners/black-friday-sales.webp"
            alt="Tioga Technologies Black Friday - Smart Home Automation & Smart Door Locks"
            className="w-full h-40 sm:h-44 object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col sm:flex-row items-start sm:items-end justify-end sm:justify-between p-3 sm:p-4 gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-display font-bold text-white leading-snug">
                Smart Home Automation & Smart Door Locks · Up to 50% OFF
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/15 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold group-hover:bg-[#00e640] group-hover:text-slate-950 transition-colors shrink-0">
              Shop Smart Home & Locks <ArrowRight size={13} />
            </span>
          </div>
        </Link>

        <Link
          to="/retail?category=Solar%2C%20Inverters%20%26%20Batteries#catalog-grid-top"
          onClick={(e) => handleCategoryClick(e, "Solar, Inverters & Batteries")}
          className="group relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-red-500/70 bg-white/95 flex items-center justify-between transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(220,38,38,0.35)]"
        >
          <img
            src="/banners/black-friday-solar-offer.webp"
            alt="Tioga Black Friday 50% OFF Offer - Solar Panels, Hybrid Inverters & Lithium Batteries"
            className="w-full h-40 sm:h-44 object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col sm:flex-row items-start sm:items-end justify-end sm:justify-between p-3 sm:p-4 gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-display font-bold text-white leading-snug">
                Solar Panels, Hybrid Inverters & Lithium Batteries · Up to 50% OFF
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-600 text-white text-[11px] sm:text-xs font-bold group-hover:bg-red-500 transition-colors shrink-0">
              Shop Solar & Batteries <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      </div>
      )}
    </aside>
  );
};

export default FlashDealsBar;
