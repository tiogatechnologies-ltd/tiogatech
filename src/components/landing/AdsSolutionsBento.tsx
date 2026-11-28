import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, FileText } from "lucide-react";
import { footerLinks } from "@/lib/footerLinks";
import type { AdsServiceId } from "@/lib/adsLandingLogic";
import bgInstaller from "@/assets/bg-installer.jpg";
import bgSolarAerial from "@/assets/bg-solar-aerial.jpg";
import bgSmartlockApex from "@/assets/bg-smartlock-apex.jpg";
import catAutomation from "@/assets/cat-automation.jpg";
import featureCctv from "@/assets/feature-cctv.jpg";
import bgBusinessStorefront from "@/assets/bg-business-storefront.jpg";

interface AdsSolutionsBentoProps {
  counts: {
    solar: number;
    locks: number;
    cctv: number;
    automation: number;
    retail: number;
  };
  onQuoteService: (service: AdsServiceId) => void;
}

const SOLUTION_META: Record<
  string,
  {
    serviceId: AdsServiceId;
    image: string;
    alt: string;
    benefit: string;
    accentBadge: string;
    whatYouGet: string[];
    spanClass: string;
    stat: (c: AdsSolutionsBentoProps["counts"]) => string | null;
  }
> = {
  "/solutions": {
    serviceId: "engineering",
    image: bgInstaller,
    alt: "Tioga engineer inspecting a custom solar and IoT deployment",
    benefit: "Custom solar, commercial power backup and IoT systems designed for your facility.",
    accentBadge: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
    whatYouGet: ["Site load audit & engineering BOQ", "Commercial 3-phase & estate scaling", "Certified nationwide deployment"],
    spanClass: "lg:col-span-2",
    stat: () => "Residential · Commercial · Industrial",
  },
  "/solar-packages": {
    serviceId: "solar",
    image: bgSolarAerial,
    alt: "Rooftop solar installation powering a modern building",
    benefit: "Pre-engineered Lithium, Tubular and High-Voltage kits sized for Nigerian loads.",
    accentBadge: "border-amber-500/35 bg-amber-500/15 text-amber-300",
    whatYouGet: ["Matched inverter, LiFePO4 battery & panels", "Clear appliance & night backup specs", "Up to 5-year hardware warranty"],
    spanClass: "lg:col-span-2",
    stat: (c) => (c.solar > 0 ? `${c.solar} ready packages` : null),
  },
  "/smart-locks": {
    serviceId: "smart_locks",
    image: bgSmartlockApex,
    alt: "Biometric smart door lock installed on a residential door",
    benefit: "3D Face ID, fingerprint, PIN, RFID and hotel access control for every door type.",
    accentBadge: "border-sky-500/35 bg-sky-500/15 text-sky-300",
    whatYouGet: ["Wooden, security, aluminum & glass doors", "Remote temporary codes for guests", "Clean door mortising & setup"],
    spanClass: "lg:col-span-2",
    stat: (c) => (c.locks > 0 ? `${c.locks} lock models` : null),
  },
  "/home-automation": {
    serviceId: "automation",
    image: catAutomation,
    alt: "Smart home interior with automated lighting and wall control panel",
    benefit: "Control lights, curtains, AC and scenes from sleek touch panels or your phone.",
    accentBadge: "border-violet-500/35 bg-violet-500/15 text-violet-300",
    whatYouGet: ["Apex, Aura & Riviera curated tiers", "Local Zigbee reliability even offline", "Voice & mobile app control"],
    spanClass: "lg:col-span-2",
    stat: (c) => (c.automation > 0 ? `${c.automation} curated tiers` : null),
  },
  "/cctv": {
    serviceId: "cctv",
    image: featureCctv,
    alt: "Weatherproof AI CCTV security camera monitoring a property perimeter",
    benefit: "ColorVu night vision, AI motion alerts and off-grid 4G solar PTZ surveillance.",
    accentBadge: "border-sky-500/35 bg-sky-500/15 text-sky-300",
    whatYouGet: ["4-channel, 8-channel & solar 4G kits", "Live mobile viewing from anywhere", "Clean cabling & NVR storage setup"],
    spanClass: "lg:col-span-2",
    stat: (c) => (c.cctv > 0 ? `${c.cctv} CCTV kits` : null),
  },
  "/retail": {
    serviceId: "retail",
    image: bgBusinessStorefront,
    alt: "Tioga retail catalog hardware for solar and smart homes",
    benefit: "Shop inverters, LiFePO4 batteries, solar panels, switches and security gear directly.",
    accentBadge: "border-emerald-500/35 bg-emerald-500/15 text-emerald-300",
    whatYouGet: ["Genuine SRNE, itel, Deye & Hikvision", "Transparent naira pricing", "Fast nationwide dispatch"],
    spanClass: "lg:col-span-2",
    stat: (c) => (c.retail > 0 ? `${c.retail.toLocaleString()}+ products in store` : null),
  },
};

/**
 * Section 3 - "Our Solutions" Bento Grid, generated directly from `footerLinks.solutions`.
 */
export const AdsSolutionsBento = ({ counts, onQuoteService }: AdsSolutionsBentoProps) => {
  const reducedMotion = useReducedMotion();
  const [expandedTo, setExpandedTo] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="solutions-bento-heading"
      className="section-padding py-14 sm:py-18 bg-muted/40 dark:bg-card/40 border-b border-border/60"
    >
      <div className="section-container-wide">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary mb-2">
            Our Solutions
          </p>
          <h2
            id="solutions-bento-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight"
          >
            One engineering partner for power, security and automation
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Explore any service below or request a combined quote tailored to your property.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
          {footerLinks.solutions.map((link, idx) => {
            const meta = SOLUTION_META[link.to];
            if (!meta) return null;
            const statText = meta.stat(counts);
            const isExpanded = expandedTo === link.to;

            return (
              <motion.article
                key={link.to}
                initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, delay: reducedMotion ? 0 : idx * 0.06 }}
                onClick={() => setExpandedTo((prev) => (prev === link.to ? null : link.to))}
                className={`${meta.spanClass} group relative rounded-2xl overflow-hidden border border-border bg-midnight text-white shadow-[var(--shadow-card)] flex flex-col min-h-[320px] sm:min-h-[340px]`}
              >
                {/* Background Photo with slow zoom on hover */}
                <img
                  src={meta.image}
                  alt={meta.alt}
                  width={640}
                  height={420}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105 opacity-55"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/85 to-midnight/35"
                />

                <div className="relative z-10 p-5 sm:p-6 flex flex-col flex-1 justify-between">
                  <div className="flex items-start justify-between gap-2">
                    {statText ? (
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold drop-shadow-xs">
                        {statText}
                      </p>
                    ) : (
                      <span />
                    )}
                  </div>

                  <div className="mt-auto space-y-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white leading-snug">
                        {link.label}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
                        {meta.benefit}
                      </p>
                    </div>

                    {/* "What you get" list - visible on hover (desktop) or tap (mobile) */}
                    <ul
                      className={`space-y-1.5 pt-2 border-t border-white/15 transition-all duration-300 ${
                        isExpanded
                          ? "opacity-100 max-h-40"
                          : "opacity-90 lg:opacity-80 lg:group-hover:opacity-100 max-h-40"
                      }`}
                    >
                      {meta.whatYouGet.map((pt) => (
                        <li key={pt} className="flex items-center gap-2 text-xs text-white/90">
                          <Check size={13} className="text-gold shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className="grid grid-cols-2 gap-2 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={link.to}
                        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                      >
                        <span>Explore</span>
                        <ArrowRight size={13} />
                      </Link>
                      <motion.button
                        type="button"
                        whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                        onClick={() => onQuoteService(meta.serviceId)}
                        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-accent text-accent-foreground text-xs font-bold hover:brightness-105 transition-all"
                      >
                        <FileText size={13} />
                        <span>Quote me</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdsSolutionsBento;
