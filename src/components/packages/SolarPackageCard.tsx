import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Battery,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Heart,
  MinusCircle,
  ShoppingCart,
  Sun,
  Tag,
  TrendingDown,
  XCircle,
  Zap,
} from "lucide-react";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { type SolarPackage, getSolarPackageImage } from "@/hooks/useSolarPackages";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import { trackConversion } from "@/lib/tracking";
import {
  savingsPct,
  wasPrice as calcWasPrice,
  savedAmount as calcSavedAmount,
  resolveCompareAt,
} from "@/lib/promoDisplay";
import { applianceCategoryIcon } from "@/lib/applianceIcons";
import {
  CARD_HEAVY_LOAD_KEYS,
  canRun,
  getPackagePowerSummary,
  HEAVY_LOAD_CHECKS,
} from "@/lib/packageAppliances";

const fmtPrice = (n: number | null) =>
  n == null ? "Price on Request" : `₦${Math.round(n).toLocaleString("en-NG")}`;

export interface SolarPackageCardProps {
  pkg: SolarPackage;
  trackingSource?: string;
}

/**
 * Unified Solar Package Card (WS3 + WS4).
 * Replaces truncated single-line `Powers:` chip with:
 * - Structured 2-column icon + text appliance grid (top 4 + inline "+N more" toggle)
 * - Capacity & night backup summary line ("Runs up to X kW at once · ~Y hrs night backup")
 * - 3-item heavy-load indicator row (1.5HP AC · Fridge · Pump) with tick / care / cross
 * - Squared `rounded-md` promo labels (no pill-shaped badges)
 */
export const SolarPackageCard = ({
  pkg,
  trackingSource = "solar_package",
}: SolarPackageCardProps) => {
  const { add } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { settings: promos } = useSiteSetting("promotions");
  const { settings: features } = useSiteSetting("features");

  const [isHovered, setIsHovered] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const [showAllAppliances, setShowAllAppliances] = useState(false);

  const isSaved = isInWishlist(pkg.id);

  const compareAt = resolveCompareAt(pkg.total_price, (pkg as any).compare_at_price, promos, pkg.id);
  const pct = savingsPct(pkg.total_price, compareAt);
  const wasPriceVal = calcWasPrice(pkg.total_price, compareAt);
  const savedAmount = calcSavedAmount(pkg.total_price, compareAt);
  const monthlyEst = pkg.total_price ? Math.round(pkg.total_price / 3) : null;

  const powerSummary = useMemo(() => getPackagePowerSummary(pkg), [pkg]);
  const heavyChecks = useMemo(
    () =>
      CARD_HEAVY_LOAD_KEYS.map((key) => {
        const spec = HEAVY_LOAD_CHECKS.find((c) => c.key === key)!;
        const result = canRun(pkg, key);
        return { key, shortLabel: spec.shortLabel, status: result.status, reason: result.reason };
      }),
    [pkg],
  );

  const displayTitle = pkg.name
    ? `${pkg.name} · ${pkg.brand || ""} ${pkg.inverter.split("(")[0].replace(/^(SRNE|itel)\s+/i, "").trim()}`
    : pkg.inverter;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    add({
      refId: pkg.id,
      type: "package",
      name: pkg.code
        ? `Lithium ${pkg.code} (${pkg.name}) - ${pkg.inverter}`
        : `Solar Package #${pkg.package_number} - ${pkg.inverter}`,
      price: fmtPrice(pkg.total_price),
      numericPrice: pkg.total_price,
      image: pkg.image,
      category: "solar",
    });
    trackConversion("cart_add", { source: trackingSource, id: pkg.package_number });
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(
      pkg.id,
      pkg.code
        ? `Lithium ${pkg.code} (${pkg.name})`
        : `Solar Package #${pkg.package_number} - ${pkg.inverter}`,
    );
  };

  const visibleAppliances = showAllAppliances
    ? powerSummary.parsed
    : powerSummary.parsed.slice(0, 4);
  const remainingApplianceCount = Math.max(0, powerSummary.parsed.length - 4);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="group relative rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`pkg-${pkg.package_number}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/15 flex items-center justify-center">
        <Link
          to={`/packages/solar/${pkg.id}`}
          className="block w-full h-full p-3 sm:p-4 flex items-center justify-center"
        >
          <img
            src={pkg.image}
            alt={pkg.inverter}
            loading="lazy"
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = getSolarPackageImage(pkg);
            }}
          />
        </Link>

        {/* Top-left Promo Labels (Squared rounded-md, NO pills) */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex flex-col gap-1">
          {promos?.show_black_friday_badges !== false && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-950/95 text-white border border-emerald-400/50 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm w-fit">
              BLACK FRIDAY
            </span>
          )}
          {pct ? (
            <span className="px-2 py-0.5 rounded-md bg-red-600/95 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit">
              <TrendingDown size={11} /> {`${pct}% OFF`}
            </span>
          ) : null}
        </div>

        {/* Floating Action Buttons (top-right) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`h-9 w-9 grid place-items-center rounded-md border backdrop-blur-md transition-all shadow-sm ${
              isSaved
                ? "bg-red-500 border-red-500 text-white"
                : "bg-background/85 border-border/80 hover:bg-background text-muted-foreground hover:text-red-500"
            }`}
          >
            <Heart size={15} fill={isSaved ? "currentColor" : "none"} />
          </button>

          <Link
            to={`/packages/solar/${pkg.id}`}
            aria-label="View Details"
            className="h-9 w-9 grid place-items-center rounded-md border border-border/80 bg-background/85 hover:bg-background text-muted-foreground hover:text-foreground backdrop-blur-md transition-all shadow-sm"
          >
            <Eye size={15} />
          </Link>
        </div>

        {/* Quick Add Overlay on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            type="button"
            onClick={handleAdd}
            className={`w-full py-2.5 px-4 rounded-md font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
              addedAnim
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {addedAnim ? (
              <>
                <Check size={14} />
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                <span>Quick Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category & Tier */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1 gap-2">
          <span className="uppercase tracking-wider font-extrabold text-[10px] text-primary truncate">
            {pkg.code && pkg.tier
              ? `${pkg.tier.toUpperCase()} ${pkg.code} · ${pkg.brand || "Lithium"}`
              : `Package #${pkg.package_number}${pkg.badge ? ` · ${pkg.badge}` : ""}`}
          </span>
        </div>

        {/* Product Title */}
        <Link
          to={`/packages/solar/${pkg.id}`}
          className="font-display font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug mb-1"
        >
          {displayTitle}
        </Link>

        {pkg.best_for && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2.5">
            Best for: <span className="text-foreground/90 font-medium">{pkg.best_for}</span>
          </p>
        )}

        {/* Core Hardware Specs (compact squared rows) */}
        <div className="space-y-1 text-[11px] text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Cpu size={12} className="text-primary shrink-0" />
            <span className="truncate">
              Inverter: <strong className="text-foreground font-semibold">{(pkg.inverter?.split("(") || [])[0]?.trim()}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Battery size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Battery: <strong className="text-foreground font-semibold">{(pkg.battery?.split("(") || [])[0]?.trim() || "Compatible Battery"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Sun size={12} className="text-amber-500 shrink-0" />
            <span className="truncate">
              Panels: <strong className="text-foreground font-semibold">{(pkg.solar_panels?.split("+") || [])[0]?.trim() || "Solar Panels"}</strong>
            </span>
          </div>
        </div>

        {/* WS3: Structured "What This Powers" Block */}
        <div className="rounded-lg border border-border/80 bg-muted/30 p-3 mb-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1">
              <Zap size={11} className="text-primary" />
              What it powers
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              Up to {powerSummary.capacityKw} kW · {powerSummary.nightBackupShort}
            </span>
          </div>

          {/* 2-Column Icon + Text Appliance Grid */}
          {visibleAppliances.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5">
              {visibleAppliances.map((item, idx) => {
                const Icon = applianceCategoryIcon[item.category];
                return (
                  <div
                    key={`${item.key}-${idx}`}
                    className="flex items-center gap-1.5 text-[11px] text-foreground/90 min-w-0"
                    title={item.raw}
                  >
                    <Icon size={12} className="text-primary/80 shrink-0" />
                    <span className="truncate">
                      {item.qty > 1 ? <strong className="font-bold">{item.qty}× </strong> : null}
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Essential household lighting, fans & electronics</p>
          )}

          {remainingApplianceCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllAppliances((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              {showAllAppliances ? (
                <>
                  <span>Show less</span>
                  <ChevronUp size={12} />
                </>
              ) : (
                <>
                  <span>+{remainingApplianceCount} more appliances</span>
                  <ChevronDown size={12} />
                </>
              )}
            </button>
          )}

          {/* 3-Item Heavy-Load Capability Row: 1.5HP AC · Fridge · Pump */}
          <div className="pt-2 border-t border-border/70 grid grid-cols-3 gap-1.5">
            {heavyChecks.map((chk) => (
              <div
                key={chk.key}
                title={`${chk.shortLabel}: ${chk.reason}`}
                className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-md border text-[10px] font-semibold leading-none ${
                  chk.status === "yes"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : chk.status === "limited"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-border bg-background/60 text-muted-foreground/80"
                }`}
              >
                {chk.status === "yes" ? (
                  <Check size={11} className="shrink-0 stroke-[2.75]" />
                ) : chk.status === "limited" ? (
                  <MinusCircle size={11} className="shrink-0" />
                ) : (
                  <XCircle size={11} className="shrink-0 opacity-70" />
                )}
                <span className="truncate">{chk.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Financing */}
        <div className="mt-auto pt-3 border-t border-border/60">
          <div className="flex items-start justify-between gap-1.5 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="text-base sm:text-lg font-display font-bold text-foreground leading-tight tabular-nums">
                {fmtPrice(pkg.total_price)}
              </p>
              {wasPriceVal && savedAmount && (
                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    {fmtPrice(wasPriceVal)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 whitespace-nowrap">
                    <Tag size={9} /> Save {fmtPrice(savedAmount)}
                  </span>
                </div>
              )}
              {pkg.battery_type === "lithium" && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Equipment price · Mounting, cabling & installation priced on survey
                </p>
              )}
              {features?.flexible_payment_enabled !== false && monthlyEst && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Or from <strong className="text-primary">₦{monthlyEst.toLocaleString()}/mo</strong>
                </p>
              )}
            </div>
          </div>

          {pkg.addon_battery && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/15 text-[10px] text-muted-foreground leading-snug">
              <strong className="text-foreground">Larger Battery Add-On:</strong>{" "}
              {pkg.addon_battery.split("(")[0].trim()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              to={`/packages/solar/${pkg.id}`}
              className="py-2 px-2.5 sm:px-3 rounded-md font-semibold text-xs border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center gap-1 transition-all text-center"
            >
              <span className="truncate">View Details</span> <ArrowRight size={12} className="shrink-0" />
            </Link>
            <button
              type="button"
              onClick={handleAdd}
              className={`py-2 px-2.5 sm:px-3 rounded-md font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-all ${
                addedAnim
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {addedAnim ? (
                <>
                  <Check size={12} className="shrink-0" /> <span className="truncate">Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={12} className="shrink-0" />{" "}
                  <span className="truncate">Add to Cart</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2">
            <FlexiblePaymentButton
              itemName={`Solar Package #${pkg.package_number}`}
              itemType="package"
              itemId={pkg.id}
              itemImage={pkg.image || getSolarPackageImage(pkg)}
              price={pkg.total_price}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SolarPackageCard;
