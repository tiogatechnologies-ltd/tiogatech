import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingContent } from "@/hooks/useLandingContent";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import {
  BLACK_FRIDAY_END_ISO,
  resolveCampaignEndsAt,
  useSharedCountdown,
  type CountdownParts,
} from "@/lib/countdownTicker";

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
  ends_at: BLACK_FRIDAY_END_ISO,
};

/**
 * @deprecated Legacy helper retained only for backward test compatibility.
 * Live countdowns MUST NOT reset every Friday - they use explicit `ends_at`
 * timestamps via `useSharedCountdown` and hide cleanly once expired.
 */
export const getNextFridayMidnight = (now = new Date()): number => {
  const day = now.getDay();
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
 * Resolves the honest countdown end timestamp:
 * - Uses an explicit configured `endsAt` when provided.
 * - Does NOT invent a rolling "next Friday" reset when absent or expired.
 */
export const useCountdown = (endsAt?: string | null): CountdownParts => {
  return useSharedCountdown(endsAt);
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

  const rawHeadline = (rawDeal.headline || "").replace(/\s*\u2014\s*/g, " · ");
  const rawDescription = (rawDeal.description || "")
    .replace(/\s*\u2014\s*/g, " - ")
    .replace(/\s*Official 5-Year Warranty.*$/i, "")
    .trim();

  const effectiveEndsAt = resolveCampaignEndsAt(rawDeal.ends_at) || "";

  const deal: FlashDealContent = {
    ...DEFAULT_FLASH_DEAL,
    ...rawDeal,
    headline: isLegacyHeadline ? DEFAULT_FLASH_DEAL.headline : rawHeadline,
    discount_label: isLegacyHeadline ? DEFAULT_FLASH_DEAL.discount_label : (rawDeal.discount_label || DEFAULT_FLASH_DEAL.discount_label),
    description: isLegacyHeadline ? DEFAULT_FLASH_DEAL.description : (rawDescription || DEFAULT_FLASH_DEAL.description),
    perk_label: DEFAULT_FLASH_DEAL.perk_label,
    ends_at: effectiveEndsAt,
  };

  // Hooks must run on every render regardless of is_active
  const timeLeft = useCountdown(deal.ends_at);
  const format = (n: number) => n.toString().padStart(2, "0");

  // If admin explicitly disabled the flash deal, respect that choice
  if (promos?.show_flash_deals_bar === false || (content && content.is_active === false)) {
    return null;
  }

  // Honesty rule (WS5): when the campaign end date has passed, hide the flash deal banner completely
  if (!timeLeft.active) {
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
      className="relative rounded-2xl bg-[#0c100e] border border-white/10 p-4 sm:p-6 md:p-7 mb-6 sm:mb-8 shadow-sm transition-all text-white overflow-hidden"
    >
      <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        {/* Left: Clean Black Friday Announcement */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm sm:text-base md:text-lg font-display font-extrabold uppercase tracking-wide text-[#00e640] leading-snug">
              {deal.headline}
            </span>
            {deal.discount_label && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                {deal.discount_label}
              </span>
            )}
          </div>
          {deal.description && (
            <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 leading-relaxed max-w-3xl">
              {deal.discount_code && (
                <>
                  Apply code{" "}
                  <strong className="text-[#00e640] font-mono bg-[#00e640]/15 border border-[#00e640]/30 px-2 py-0.5 rounded-md font-bold">
                    {deal.discount_code}
                  </strong>{" "}
                </>
              )}
              {deal.description}
            </p>
          )}
        </div>

        {/* Right Section: Honest Campaign Countdown & Smart Lock Perk */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-6 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 pt-3.5 xl:pt-0 border-white/10 shrink-0">
          <div
            role="timer"
            aria-live="off"
            aria-label="Black Friday deals countdown"
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <span className="font-bold tracking-wider uppercase text-[11px] text-neutral-400">
              Deals end in:
            </span>
            <div className="flex items-center gap-1 font-mono tabular-nums text-xs sm:text-sm font-bold">
              <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                {format(timeLeft.d)}
                <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">d</span>
              </div>
              <span className="text-neutral-500 font-bold">:</span>
              <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                {format(timeLeft.h)}
                <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">h</span>
              </div>
              <span className="text-neutral-500 font-bold">:</span>
              <div className="px-2 py-1 rounded-md bg-white/[0.08] border border-white/15 text-white">
                {format(timeLeft.m)}
                <span className="text-[10px] text-neutral-400 font-sans ml-0.5 font-normal">m</span>
              </div>
              <span className="text-neutral-500 font-bold">:</span>
              <div className="px-2 py-1 rounded-md bg-red-600/20 border border-red-500/40 text-red-200">
                {format(timeLeft.s)}
                <span className="text-[10px] text-red-300 font-sans ml-0.5 font-normal">s</span>
              </div>
            </div>
          </div>

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

      {/* Dual Official Black Friday Visual Banner Cards */}
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
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#00e640] text-slate-950 text-xs font-bold group-hover:bg-emerald-400 transition-colors shrink-0">
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
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-red-600 text-white text-xs font-bold group-hover:bg-red-500 transition-colors shrink-0">
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
