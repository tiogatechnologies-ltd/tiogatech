import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
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
export const useCountdown = (endsAt?: string) => {
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
      className="relative rounded-2xl sm:rounded-3xl bg-[#0c100e] border border-white/10 p-4 sm:p-6 md:p-7 mb-6 sm:mb-8 shadow-sm transition-all text-white overflow-hidden"
    >
      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Left: Clean Black Friday Announcement (no icon/emoji beside headline) */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg font-display font-extrabold uppercase tracking-wide text-[#00e640] leading-snug">
              {deal.headline}
            </span>
            {deal.discount_label && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                {deal.discount_label}
              </span>
            )}
          </div>
          {deal.description && (
            <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 leading-relaxed max-w-3xl">
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

        {/* Right Section: Countdown to Friday & Free Smart Locks Installation */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-6 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-3.5 xl:pt-0 border-white/10 shrink-0">
          {/* Live Countdown Timer to Friday */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="font-bold tracking-wider uppercase text-xs text-neutral-300">Friday:</span>
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold">
              {timeLeft.d > 0 && (
                <>
                  <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                    {format(timeLeft.d)}
                    <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">d</span>
                  </div>
                  <span className="text-neutral-400 font-bold">:</span>
                </>
              )}
              <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                {format(timeLeft.h)}
                <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">h</span>
              </div>
              <span className="text-neutral-400 font-bold">:</span>
              <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                {format(timeLeft.m)}
                <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">m</span>
              </div>
              <span className="text-neutral-400 font-bold">:</span>
              <div className="px-2 py-1 rounded-md bg-red-600/20 border border-red-500/40 text-red-200">
                {format(timeLeft.s)}
                <span className="text-[10px] text-red-300 font-sans ml-0.5 font-normal">s</span>
              </div>
            </div>
          </div>

          {/* Free Installation for all Smart Locks Products (clean inline text, not a pill) */}
          {deal.perk_label && (
            <Link
              to="/retail?category=Smart%20Door%20Locks#catalog-grid-top"
              onClick={(e) => handleCategoryClick(e, "Smart Door Locks")}
              className="inline-flex items-center text-xs sm:text-sm font-semibold text-[#00e640] hover:text-emerald-300 transition-colors"
            >
              <span>{deal.perk_label}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Dual Official Black Friday Visual Banner Cards (tall, uncropped, non-AI presentation) */}
      {promos?.show_flash_deal_cards !== false && (
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-5 pt-5 border-t border-white/10">
        <Link
          to="/retail?category=Smart%20Home%20%26%20Locks#catalog-grid-top"
          onClick={(e) => handleCategoryClick(e, "Smart Home & Locks")}
          className="group flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-white/30 bg-[#051a08] transition-all duration-300"
        >
          <div className="relative w-full h-72 sm:h-80 md:h-[360px] lg:h-[420px] xl:h-[450px] bg-[#051a08] flex items-center justify-center overflow-hidden">
            <img
              src="/banners/black-friday-sales.webp"
              alt="Tioga Technologies Black Friday - Smart Home Automation & Smart Door Locks"
              className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
              loading="eager"
            />
          </div>
          <div className="bg-[#111714] border-t border-white/10 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <p className="text-xs sm:text-sm md:text-base font-display font-bold text-white leading-snug">
              Smart Home Automation & Smart Door Locks · Up to 50% OFF
            </p>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00e640] text-slate-950 text-xs font-bold group-hover:bg-emerald-400 transition-colors shrink-0">
              Shop Smart Home & Locks <ArrowRight size={14} />
            </span>
          </div>
        </Link>

        <Link
          to="/retail?category=Solar%2C%20Inverters%20%26%20Batteries#catalog-grid-top"
          onClick={(e) => handleCategoryClick(e, "Solar, Inverters & Batteries")}
          className="group flex flex-col rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 hover:border-white/30 bg-white transition-all duration-300"
        >
          <div className="relative w-full h-72 sm:h-80 md:h-[360px] lg:h-[420px] xl:h-[450px] bg-gradient-to-b from-white via-white to-[#2b2d2e] flex items-center justify-center overflow-hidden">
            <img
              src="/banners/black-friday-solar-offer.webp"
              alt="Tioga Black Friday 50% OFF Offer - Solar Panels, Hybrid Inverters & Lithium Batteries"
              className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
              loading="eager"
            />
          </div>
          <div className="bg-[#111714] border-t border-white/10 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <p className="text-xs sm:text-sm md:text-base font-display font-bold text-white leading-snug">
              Solar Panels, Hybrid Inverters & Lithium Batteries · Up to 50% OFF
            </p>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-bold group-hover:bg-red-500 transition-colors shrink-0">
              Shop Solar & Batteries <ArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>
      )}
    </aside>
  );
};

export default FlashDealsBar;
