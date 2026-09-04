import { useState, useEffect } from "react";
import { Flame, Clock, Truck, Tag } from "lucide-react";

export const FlashDealsBar = () => {
  // 48-hour cyclical countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-amber-500/[0.07] dark:bg-amber-500/[0.08] border-2 border-amber-500/40 dark:border-amber-400/40 p-4 sm:p-5 mb-6 sm:mb-8 shadow-[0_0_35px_-8px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/20">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Highlight Flame & Promo Announcement */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-midnight font-bold shadow-md shadow-amber-500/30 shrink-0">
            <Flame size={20} className="fill-midnight" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Mid-Month Energy Flash Deals
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-midnight text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <Tag size={10} /> Up to 15% Off
              </span>
            </div>
            <p className="text-xs text-foreground/80 mt-1">
              Apply code{" "}
              <strong className="text-amber-600 dark:text-amber-400 font-mono bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                TIOGA2026
              </strong>{" "}
              at checkout for free 24-hour expedited dispatch on all inverter and battery storage orders.
            </p>
          </div>
        </div>

        {/* Right Section: Standout Countdown & Fast Delivery */}
        <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-amber-500/20">
          {/* Live Countdown Timer */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock size={14} />
              <span className="font-bold">Ends In:</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-sm font-bold">
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                {format(timeLeft.hours)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5">h</span>
              </div>
              <span className="text-amber-500 font-bold">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/35 text-foreground shadow-xs">
                {format(timeLeft.minutes)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5">m</span>
              </div>
              <span className="text-amber-500 font-bold">:</span>
              <div className="px-2.5 py-1 rounded-xl bg-card border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-xs">
                {format(timeLeft.seconds)}
                <span className="text-[9px] text-muted-foreground font-sans ml-0.5">s</span>
              </div>
            </div>
          </div>

          {/* Value Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
            <Truck size={14} />
            <span>24h Dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashDealsBar;
