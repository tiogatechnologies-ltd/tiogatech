import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CreditCard,
  FileSpreadsheet,
  Package,
  ShoppingBag,
} from "lucide-react";
import { footerLinks } from "@/lib/footerLinks";

interface AdsHighlightOffersProps {
  onBookAudit: () => void;
  onGetQuote: () => void;
}

const solarPackagesRoute =
  footerLinks.solutions.find((l) => l.to === "/solar-packages")?.to ?? "/solar-packages";
const retailRoute =
  footerLinks.solutions.find((l) => l.to === "/retail")?.to ?? "/retail";
const financeRoute =
  footerLinks.support.find((l) => l.to === "/finance")?.to ?? "/finance";

const OFFERS = [
  {
    id: "audit",
    title: "Free Energy Audit",
    benefit: "An engineer sizes your power needs for free.",
    bullets: [
      "Appliance load & surge calculation",
      "Honest inverter & battery sizing",
      "Zero obligation, ready in 24 hours",
    ],
    cta: "Book Free Audit",
    action: "audit" as const,
    icon: CalendarCheck,
    accentClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  },
  {
    id: "quote",
    title: "Personalised Quote",
    benefit: "Tailored pricing for solar, security, smart home or engineering.",
    bullets: [
      "Combine multiple services in one BOQ",
      "Matched to your exact property type",
      "Transparent equipment & install lines",
    ],
    cta: "Get My Quote",
    action: "quote" as const,
    icon: FileSpreadsheet,
    accentClass: "text-primary bg-primary/10 border-primary/25",
  },
  {
    id: "packages",
    title: "Ready-Made Packages",
    benefit: "Pre-engineered solar systems, smart lock series, CCTV & automation.",
    bullets: [
      "SRNE & itel Lithium solar bundles",
      "Biometric & Face ID smart lock lines",
      "Apex, Aura & Riviera automation tiers",
    ],
    cta: "View Packages",
    to: solarPackagesRoute,
    icon: Package,
    accentClass: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25",
  },
  {
    id: "retail",
    title: "Retail Store",
    benefit: "Genuine inverters, batteries, panels, CCTV and smart devices.",
    bullets: [
      "Authorized distributor hardware stock",
      "Fast Lagos, Abuja & nationwide dispatch",
      "Direct manufacturer warranty support",
    ],
    cta: "Shop Now",
    to: retailRoute,
    icon: ShoppingBag,
    accentClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  },
  {
    id: "finance",
    title: "Flexible Payment",
    benefit: "Spread the cost of any solution and pay small-small.",
    bullets: [
      "3, 6, 12 or 24-month payment plans",
      "Covers solar, security & smart home",
      "Clear monthly breakdown upfront",
    ],
    cta: "See Finance Options",
    to: financeRoute,
    icon: CreditCard,
    accentClass: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
];

/**
 * Section 2 — Highlight Offers.
 * 5 interactive cards: grid on desktop (with subtle hover lift/glow), horizontal snap carousel on mobile.
 */
export const AdsHighlightOffers = ({ onBookAudit, onGetQuote }: AdsHighlightOffersProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="highlight-offers-heading"
      className="section-padding py-12 sm:py-16 bg-background border-b border-border/60"
    >
      <div className="section-container-wide">
        <div className="max-w-2xl mb-7 sm:mb-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary mb-2">
            Start Where You Need
          </p>
          <h2
            id="highlight-offers-heading"
            className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight"
          >
            Five straightforward ways to get started with Tioga
          </h2>
        </div>

        {/* Horizontal snap-scroll carousel on mobile, 5-card grid on xl / 3+2 on md */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          {OFFERS.map((offer, idx) => {
            const Icon = offer.icon;
            return (
              <motion.article
                key={offer.id}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: reducedMotion ? 0 : idx * 0.06 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                className="snap-start shrink-0 w-[280px] sm:w-[300px] md:w-auto rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] hover:border-primary/40 hover:shadow-lg transition-all flex flex-col"
              >
                <div
                  className={`h-10 w-10 rounded-md border grid place-items-center mb-4 ${offer.accentClass}`}
                >
                  <Icon size={19} />
                </div>

                <h3 className="font-display text-base font-bold text-foreground mb-1">
                  {offer.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {offer.benefit}
                </p>

                <ul className="space-y-2 mb-5 flex-1">
                  {offer.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-foreground/85">
                      <Check size={13} className="text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>

                {"to" in offer && offer.to ? (
                  <Link
                    to={offer.to}
                    className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md border border-border bg-muted/40 hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold text-foreground transition-colors"
                  >
                    <span>{offer.cta}</span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    onClick={offer.action === "audit" ? onBookAudit : onGetQuote}
                    className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md bg-accent text-accent-foreground text-xs font-bold hover:brightness-105 transition-all"
                  >
                    <span>{offer.cta}</span>
                    <ArrowRight size={14} />
                  </motion.button>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdsHighlightOffers;
