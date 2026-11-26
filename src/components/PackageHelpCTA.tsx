import { ArrowRight, Phone } from "lucide-react";
import { openLeadForm } from "@/components/SiteHeader";
import { useSiteContact } from "@/hooks/useSiteContact";

export interface PackageHelpCTAProps {
  /** Tracking source passed to `openLeadForm(source)`. */
  source: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  callLabel?: string;
}

/**
 * WS2 — Lighter, translucent "Need help choosing the right package?" banner.
 * Shared across SolarPackageDetail, SmartLockDetail, and AutomationPackageDetail
 * to replace the solid dark-green banner with a refined translucent card that
 * reads cleanly in both light and dark modes (WCAG AA >= 4.5:1 on all buttons).
 */
const PackageHelpCTA = ({
  source,
  title = "Need help choosing the right package?",
  description = "Our energy engineers will size the perfect system for your load profile - free of charge.",
  primaryLabel = "Get AI Recommendation",
  callLabel = "Call Us",
}: PackageHelpCTAProps) => {
  const { contact } = useSiteContact();

  return (
    <section className="section-padding py-10">
      <div className="section-container">
        <div className="relative overflow-hidden rounded-2xl bg-primary/[0.07] dark:bg-primary/[0.12] border border-primary/20 backdrop-blur-sm px-6 py-8 sm:px-10 sm:py-9 text-center shadow-[0_8px_30px_-12px_rgba(16,185,129,0.16)]">
          {/* Subtle top-left emerald ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/15 dark:bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-accent/15 dark:bg-accent/10 blur-3xl"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 no-clip">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openLeadForm(source)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
              >
                <span>{primaryLabel}</span>
                <ArrowRight size={15} />
              </button>
              <a
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-background/70 dark:bg-background/30 hover:bg-primary/10 px-6 py-3 text-sm font-semibold text-primary hover:border-primary/60 active:scale-[0.98] transition-all"
              >
                <Phone size={15} />
                <span>{callLabel}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackageHelpCTA;
