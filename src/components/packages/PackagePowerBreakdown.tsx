import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Battery,
  Calculator,
  CheckCircle2,
  Gauge,
  Moon,
  XCircle,
  Zap,
} from "lucide-react";
import type { SolarPackage } from "@/hooks/useSolarPackages";
import { applianceCategoryIcon } from "@/lib/applianceIcons";
import {
  canRun,
  getPackagePowerSummary,
  HEAVY_LOAD_CHECKS,
} from "@/lib/packageAppliances";

interface PackagePowerBreakdownProps {
  pkg: SolarPackage;
}

/**
 * WS3c — "What This System Can Power" detail-page section.
 * Gives Nigerian home & business buyers crystal-clear visibility into:
 * 1. Full appliance grid with quantities & wattage estimates
 * 2. Visual Load Meter bar (typical running watts vs inverter rated capacity)
 * 3. Night backup runtime callout
 * 4. "Can it run my…?" 10-appliance heavy-load checklist (Yes / With care / No + reason)
 * 5. Prefilled Energy Calculator CTA
 */
export const PackagePowerBreakdown = ({ pkg }: PackagePowerBreakdownProps) => {
  const summary = useMemo(() => getPackagePowerSummary(pkg), [pkg]);

  const heavyChecklist = useMemo(
    () =>
      HEAVY_LOAD_CHECKS.map((spec) => ({
        ...spec,
        result: canRun(pkg, spec.key),
      })),
    [pkg],
  );

  const calculatorHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from_package", String(pkg.package_number));
    if (pkg.appliances) params.set("appliances", pkg.appliances);
    return `/energy-calculator?${params.toString()}`;
  }, [pkg.package_number, pkg.appliances]);

  const meterColor =
    summary.loadPercent >= 85
      ? "bg-amber-500"
      : summary.loadPercent >= 65
        ? "bg-primary"
        : "bg-emerald-500";

  return (
    <section
      id="what-it-powers"
      data-testid="package-power-breakdown"
      className="section-padding py-12 border-t border-border/60"
    >
      <div className="section-container space-y-8">
        {/* Heading + Calculator CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary mb-1.5">
              Real-World Load Guide
            </p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground no-clip">
              What This System Can Power
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Sized for Nigerian household & commercial load profiles — see the typical appliances included, load headroom, and heavy-appliance compatibility.
            </p>
          </div>
          <Link
            to={calculatorHref}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            <Calculator size={15} />
            <span>Not sure? Calculate your exact load</span>
          </Link>
        </div>

        {/* Load Meter + Night Backup Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Visual Load Meter */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-primary" />
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                  Inverter Load Headroom
                </h3>
              </div>
              <span className="text-xs font-bold text-foreground tabular-nums">
                Max continuous output: <span className="text-primary">{summary.capacityKw} kW</span> ({summary.capacityWatts.toLocaleString()}W)
              </span>
            </div>

            <div className="h-3 w-full rounded-md bg-muted overflow-hidden border border-border/60">
              <div
                className={`h-full ${meterColor} transition-all duration-500`}
                style={{ width: `${summary.loadPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Connected appliance list: ~<strong className="text-foreground">{summary.totalApplianceWatts.toLocaleString()}W</strong> total (~{summary.loadPercent}% typical simultaneous utilization)
              </span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Healthy surge reserve for motor startup
              </span>
            </div>
          </div>

          {/* Night Backup Box */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Moon size={18} />
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                Overnight Backup Estimate
              </h3>
            </div>
            <div>
              <p className="text-2xl font-display font-extrabold text-foreground leading-tight">
                {summary.nightBackupShort}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {summary.nightBackupFull !== summary.nightBackupShort
                  ? `Estimated at ${summary.nightBackupFull}`
                  : "Estimated overnight runtime on battery at typical evening load."}
              </p>
            </div>
            {pkg.usable_battery_kwh != null && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-border/60">
                <Battery size={13} />
                <span>Usable storage: {pkg.usable_battery_kwh} kWh · Solar yield: ~{pkg.solar_per_day_kwh ?? "-"} kWh/day</span>
              </div>
            )}
          </div>
        </div>

        {/* Full Appliance Grid */}
        {summary.parsed.length > 0 && (
          <div>
            <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap size={14} className="text-primary" />
              Typical Appliances Covered ({summary.parsed.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {summary.parsed.map((item, idx) => {
                const Icon = applianceCategoryIcon[item.category];
                return (
                  <div
                    key={`${item.key}-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {item.qty > 1 ? `${item.qty}× ` : ""}
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        ~{item.totalWatts.toLocaleString()}W est.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* "Can it run my…?" 10-Appliance Checklist */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
                Can this package run my…?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conservative engineering check based on {summary.capacityKw} kW inverter output & compressor/motor startup surge.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={13} /> Yes
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <AlertCircle size={13} /> With care
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <XCircle size={13} /> No
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {heavyChecklist.map((item) => {
              const status = item.result.status;
              return (
                <div
                  key={item.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    status === "yes"
                      ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                      : status === "limited"
                        ? "border-amber-500/25 bg-amber-500/[0.04]"
                        : "border-border bg-muted/20"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {status === "yes" ? (
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    ) : status === "limited" ? (
                      <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
                    ) : (
                      <XCircle size={16} className="text-muted-foreground/70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {item.label}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                          status === "yes"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : status === "limited"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {status === "yes" ? "Yes" : status === "limited" ? "With care" : "No"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {item.result.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackagePowerBreakdown;
