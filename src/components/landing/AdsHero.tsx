import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Home,
  MapPin,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Wrench,
} from "lucide-react";
import type { CampaignConfig, HeroServiceKey } from "@/lib/adsLandingLogic";
import { useSiteSetting } from "@/hooks/useSiteSetting";

interface AdsHeroProps {
  campaign: CampaignConfig;
  heroRef: React.RefObject<HTMLElement>;
  onGetQuote: () => void;
  onBookAudit: () => void;
  onSelectHeroService?: (service: HeroServiceKey) => void;
}

const SERVICE_TABS: Array<{
  key: HeroServiceKey;
  label: string;
  hotspotLabel: string;
  caption: string;
  icon: typeof Sun;
  accentText: string;
  accentBg: string;
  accentBorder: string;
}> = [
  {
    key: "energy",
    label: "Energy",
    hotspotLabel: "Roof Solar & LiFePO4 Battery",
    caption: "Hybrid inverters, solar panels & lithium storage sized for 24/7 Nigerian loads.",
    icon: Sun,
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/15",
    accentBorder: "border-amber-400/50",
  },
  {
    key: "security",
    label: "Security",
    hotspotLabel: "Biometric Smart Lock & AI CCTV",
    caption: "3D Face ID front-door locks + ColorVu perimeter CCTV with mobile alerts.",
    icon: Shield,
    accentText: "text-sky-400",
    accentBg: "bg-sky-500/15",
    accentBorder: "border-sky-400/50",
  },
  {
    key: "smarthome",
    label: "Smart Home",
    hotspotLabel: "Smart Lighting, Curtains & Climate",
    caption: "Control rooms, motorized curtains, scenes & AC from one touch panel or app.",
    icon: Home,
    accentText: "text-violet-400",
    accentBg: "bg-violet-500/15",
    accentBorder: "border-violet-400/50",
  },
  {
    key: "shop",
    label: "Shop",
    hotspotLabel: "Genuine Retail Hardware",
    caption: "Order Tier-1 inverters, batteries, cameras & smart locks with nationwide dispatch.",
    icon: ShoppingBag,
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/15",
    accentBorder: "border-emerald-400/50",
  },
];

const TRUST_CLAIMS = [
  { key: "warranty", icon: ShieldCheck, text: "Up to 5-yr warranty" },
  { key: "dispatch", icon: Wrench, text: "48-72h engineer dispatch" },
  { key: "nationwide", icon: MapPin, text: "Nationwide installation" },
  { key: "finance", icon: CreditCard, text: "Flexible payment" },
];

/**
 * Pure HTML + SVG + framer-motion Hero section (zero image LCP dependency for <2.5s mobile LCP).
 * Features an interactive SVG house with 4 keyboard-operable glowing hotspots and an auto-rotating
 * service switcher that pauses on user interaction and respects `prefers-reduced-motion`.
 */
export const AdsHero = ({
  campaign,
  heroRef,
  onGetQuote,
  onBookAudit,
  onSelectHeroService,
}: AdsHeroProps) => {
  const reducedMotion = useReducedMotion();
  const { settings: features } = useSiteSetting("features");
  const flexiblePaymentEnabled = features?.flexible_payment_enabled !== false;
  const visibleTrustClaims = flexiblePaymentEnabled
    ? TRUST_CLAIMS
    : TRUST_CLAIMS.filter((c) => c.key !== "finance");
  const [activeService, setActiveService] = useState<HeroServiceKey>(campaign.defaultHeroService);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActiveService(campaign.defaultHeroService);
  }, [campaign.defaultHeroService]);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const keys: HeroServiceKey[] = ["energy", "security", "smarthome", "shop"];
    const id = window.setInterval(() => {
      setActiveService((prev) => keys[(keys.indexOf(prev) + 1) % keys.length]);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused]);

  const selectService = (key: HeroServiceKey) => {
    setPaused(true);
    setActiveService(key);
    onSelectHeroService?.(key);
  };

  const activeMeta = SERVICE_TABS.find((t) => t.key === activeService) || SERVICE_TABS[0];
  const isEnergy = activeService === "energy" || activeService === "shop";
  const isSecurity = activeService === "security";
  const isSmart = activeService === "smarthome";

  return (
    <section
      ref={heroRef}
      aria-label="Hero"
      className="relative isolate overflow-hidden bg-midnight text-white border-b border-white/10"
    >
      {/* Subtle architectural radial glow - pure CSS, zero external image wait for LCP */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 78% 35%, hsla(152, 85%, 36%, 0.22) 0%, transparent 62%), radial-gradient(45% 55% at 15% 80%, hsla(51, 100%, 50%, 0.10) 0%, transparent 65%)",
        }}
      />

      <div className="section-container-wide py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Campaign Headline, CTAs & Trust Row */}
          <div className="lg:col-span-6 space-y-5">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight leading-[1.12] text-white">
              {campaign.headline}{" "}
              <span className="text-emerald-400">{campaign.headlineAccent}</span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
              {campaign.subline}
            </p>

            {/* Primary & Secondary CTAs (min 44px tap targets, squared rounded-md) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                onClick={onGetQuote}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:brightness-105 transition-all shadow-lg shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <span>Get My Free Personalised Quote</span>
                <ArrowRight size={16} />
              </motion.button>

              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                onClick={onBookAudit}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 rounded-md border border-white/25 bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CalendarCheck size={16} className="text-emerald-400 shrink-0" />
                <span>Book a Free Energy Audit</span>
              </motion.button>
            </div>

            {/* Trust Row - icon + text only, zero pill badges */}
            <div
              className={`pt-3 border-t border-white/10 grid grid-cols-2 ${
                visibleTrustClaims.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
              } gap-3`}
            >
              {visibleTrustClaims.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-white/85">
                  <Icon size={15} className="text-gold shrink-0" />
                  <span className="leading-tight font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive SVG Smart House + Service Switcher */}
          <div
            className="lg:col-span-6 space-y-4"
            onPointerEnter={() => setPaused(true)}
            onTouchStart={() => setPaused(true)}
          >
            {/* Service Switcher (Energy · Security · Smart Home · Shop) */}
            <div
              role="tablist"
              aria-label="Explore Tioga services on the interactive house"
              className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-white/[0.06] border border-white/12"
            >
              {SERVICE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeService === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectService(tab.key)}
                    className={`relative min-h-[44px] px-2 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      active ? "text-white" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="hero-service-tab-bg"
                        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                        className={`absolute inset-0 rounded-md border ${tab.accentBg} ${tab.accentBorder}`}
                      />
                    )}
                    <Icon size={14} className={`relative z-10 shrink-0 ${active ? tab.accentText : ""}`} />
                    <span className="relative z-10 truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive SVG House Canvas */}
            <div className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900/90 to-[#06111e] p-3 sm:p-5 shadow-2xl">
              <svg
                viewBox="0 0 600 360"
                className="w-full h-auto block"
                role="img"
                aria-label="Interactive Tioga smart home diagram showing roof solar panels, front door smart lock, perimeter CCTV camera, and automated lights and curtains"
              >
                <defs>
                  <linearGradient id="tiogaSkyGlow" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0f2942" />
                    <stop offset="100%" stopColor="#071321" />
                  </linearGradient>
                  <linearGradient id="tiogaSolarGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1e3a5f" />
                    <stop offset="50%" stopColor="#0f6b47" />
                    <stop offset="100%" stopColor="#172554" />
                  </linearGradient>
                  <linearGradient id="tiogaWindowWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.65" />
                  </linearGradient>
                  <linearGradient id="tiogaCctvCone" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Backdrop & Ground */}
                <rect x="0" y="0" width="600" height="360" rx="16" fill="url(#tiogaSkyGlow)" />
                <ellipse cx="300" cy="316" rx="255" ry="18" fill="#040b14" opacity="0.7" />
                <line x1="40" y1="312" x2="560" y2="312" stroke="#1e3a5f" strokeWidth="2" />

                {/* Sun Glow (brightens when Energy is active) */}
                <motion.circle
                  cx="515"
                  cy="64"
                  r="26"
                  fill="#facc15"
                  animate={{ opacity: isEnergy ? 0.95 : 0.35, scale: isEnergy && !reducedMotion ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 2.6, repeat: isEnergy && !reducedMotion ? Infinity : 0 }}
                />
                <circle cx="515" cy="64" r="44" fill="#facc15" opacity={isEnergy ? 0.14 : 0.05} />

                {/* Modern House Main Structure */}
                <rect x="115" y="154" width="350" height="158" rx="6" fill="#132236" stroke="#2c4463" strokeWidth="2" />
                {/* Upper architectural overhang */}
                <polygon points="88,158 300,72 498,158" fill="#1b2f4a" stroke="#36547a" strokeWidth="2" />
                <rect x="106" y="150" width="372" height="10" rx="3" fill="#243c5c" />

                {/* 1. ROOF SOLAR PANELS (Hotspot: Energy) */}
                <g>
                  <polygon
                    points="210,136 300,98 418,144 334,144"
                    fill="url(#tiogaSolarGrad)"
                    stroke={isEnergy ? "#facc15" : "#47698f"}
                    strokeWidth={isEnergy ? 2.5 : 1.5}
                  />
                  {/* Panel grid lines */}
                  <line x1="255" y1="118" x2="368" y2="144" stroke="#6ee7b7" strokeOpacity="0.45" strokeWidth="1" />
                  <line x1="278" y1="108" x2="394" y2="144" stroke="#6ee7b7" strokeOpacity="0.45" strokeWidth="1" />
                  <line x1="245" y1="138" x2="328" y2="110" stroke="#6ee7b7" strokeOpacity="0.45" strokeWidth="1" />
                  <line x1="290" y1="142" x2="365" y2="124" stroke="#6ee7b7" strokeOpacity="0.45" strokeWidth="1" />

                  {/* Shimmer sweep across roof panels */}
                  {isEnergy && !reducedMotion && (
                    <motion.rect
                      x="220"
                      y="102"
                      width="24"
                      height="44"
                      fill="#fde047"
                      opacity="0.35"
                      transform="skewX(-25)"
                      animate={{ x: [220, 410] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  {/* Energy conduit line from roof to wall LiFePO4 battery */}
                  <path
                    d="M 380 144 L 380 198 L 430 198 L 430 236"
                    fill="none"
                    stroke={isEnergy ? "#facc15" : "#334155"}
                    strokeWidth="3"
                    strokeDasharray="7 6"
                  >
                    {isEnergy && !reducedMotion && (
                      <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1.1s" repeatCount="indefinite" />
                    )}
                  </path>

                  {/* Wall-mounted Inverter & LiFePO4 Battery Unit */}
                  <rect
                    x="412"
                    y="236"
                    width="38"
                    height="56"
                    rx="4"
                    fill="#0f172a"
                    stroke={isEnergy ? "#22c55e" : "#475569"}
                    strokeWidth="2"
                  />
                  <rect x="418" y="244" width="26" height="12" rx="2" fill={isEnergy ? "#22c55e" : "#334155"} opacity="0.85" />
                  <rect x="418" y="262" width="26" height="5" rx="1" fill="#22c55e" opacity={isEnergy ? 1 : 0.3} />
                  <rect x="418" y="271" width="20" height="5" rx="1" fill="#facc15" opacity={isEnergy ? 1 : 0.3} />
                  <rect x="418" y="280" width="26" height="5" rx="1" fill="#22c55e" opacity={isEnergy ? 1 : 0.3} />
                </g>

                {/* 2. SMART WINDOWS + MOTORIZED CURTAINS (Hotspot: Smart Home) */}
                <g>
                  {/* Left Living Room Window */}
                  <rect
                    x="140"
                    y="186"
                    width="96"
                    height="74"
                    rx="4"
                    fill={isSmart ? "url(#tiogaWindowWarm)" : "#1e324a"}
                    stroke={isSmart ? "#c084fc" : "#3b5878"}
                    strokeWidth={isSmart ? 2.5 : 1.5}
                  />
                  {/* Sliding curtain panels */}
                  <motion.rect
                    x="140"
                    y="186"
                    height="74"
                    rx="2"
                    fill="#2e1065"
                    opacity="0.72"
                    animate={{ width: isSmart ? 16 : 42 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
                  />
                  <motion.rect
                    y="186"
                    height="74"
                    rx="2"
                    fill="#2e1065"
                    opacity="0.72"
                    animate={{
                      x: isSmart ? 220 : 194,
                      width: isSmart ? 16 : 42,
                    }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
                  />

                  {/* Right Smart Room Window */}
                  <rect
                    x="332"
                    y="186"
                    width="64"
                    height="64"
                    rx="4"
                    fill={isSmart ? "url(#tiogaWindowWarm)" : "#1e324a"}
                    stroke={isSmart ? "#c084fc" : "#3b5878"}
                    strokeWidth={isSmart ? 2.5 : 1.5}
                  />
                  <line x1="364" y1="186" x2="364" y2="250" stroke="#132236" strokeWidth="2" />
                  <line x1="332" y1="218" x2="396" y2="218" stroke="#132236" strokeWidth="2" />
                </g>

                {/* 3. FRONT DOOR & BIOMETRIC SMART LOCK (Hotspot: Security) */}
                <g>
                  <rect
                    x="256"
                    y="204"
                    width="58"
                    height="108"
                    rx="4"
                    fill="#1e293b"
                    stroke={isSecurity ? "#38bdf8" : "#475569"}
                    strokeWidth={isSecurity ? 2.5 : 1.8}
                  />
                  {/* Smart Lock Keypad Body */}
                  <rect
                    x="297"
                    y="240"
                    width="12"
                    height="28"
                    rx="2"
                    fill="#0f172a"
                    stroke={isSecurity ? "#38bdf8" : "#94a3b8"}
                    strokeWidth="1.5"
                  />
                  {/* Keypad indicator dot */}
                  <motion.circle
                    cx="303"
                    cy="249"
                    r="2.5"
                    fill={isSecurity ? "#22c55e" : "#64748b"}
                    animate={isSecurity && !reducedMotion ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                  {/* Animated unlocked status icon */}
                  <motion.g
                    animate={{
                      y: isSecurity ? -2 : 0,
                      opacity: isSecurity ? 1 : 0.45,
                    }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
                  >
                    <circle cx="285" cy="224" r="10" fill={isSecurity ? "#0284c7" : "#334155"} />
                    <path
                      d="M 281 224 L 284 227 L 290 221"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </g>

                {/* 4. EXTERIOR AI CCTV CAMERA + SCANNING CONE (Hotspot: Security) */}
                <g transform="translate(116, 160)">
                  {/* Scanning Cone */}
                  <motion.polygon
                    points="0,6 -70,76 -16,96"
                    fill="url(#tiogaCctvCone)"
                    style={{ transformOrigin: "0px 6px" }}
                    animate={
                      isSecurity && !reducedMotion
                        ? { rotate: [-10, 14, -10], opacity: [0.35, 0.75, 0.35] }
                        : { rotate: 0, opacity: isSecurity ? 0.6 : 0.15 }
                    }
                    transition={{ duration: 3.4, repeat: isSecurity && !reducedMotion ? Infinity : 0, ease: "easeInOut" }}
                  />
                  {/* Camera Bracket & Housing */}
                  <rect x="-4" y="0" width="12" height="6" rx="2" fill="#94a3b8" />
                  <motion.g
                    style={{ transformOrigin: "0px 6px" }}
                    animate={isSecurity && !reducedMotion ? { rotate: [-10, 14, -10] } : { rotate: 0 }}
                    transition={{ duration: 3.4, repeat: isSecurity && !reducedMotion ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <rect x="-20" y="2" width="18" height="10" rx="3" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
                    <circle cx="-18" cy="7" r="2.2" fill={isSecurity ? "#38bdf8" : "#64748b"} />
                  </motion.g>
                </g>
              </svg>

              {/* 4 Accessible Keyboard-Operable Hotspot Markers positioned cleanly over the SVG (no pill frames) */}
              {[
                {
                  key: "energy" as HeroServiceKey,
                  label: "Roof Solar & Battery hotspot",
                  tag: "Solar",
                  pos: "top-[28%] left-[52%]",
                  dotClass: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]",
                  textClass: "text-amber-300",
                },
                {
                  key: "security" as HeroServiceKey,
                  label: "Perimeter CCTV Camera hotspot",
                  tag: "CCTV",
                  pos: "top-[40%] left-[12%]",
                  dotClass: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]",
                  textClass: "text-sky-300",
                },
                {
                  key: "security" as HeroServiceKey,
                  label: "Front Door Biometric Smart Lock hotspot",
                  tag: "Smart Lock",
                  pos: "top-[64%] left-[44%]",
                  dotClass: "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]",
                  textClass: "text-sky-300",
                },
                {
                  key: "smarthome" as HeroServiceKey,
                  label: "Smart Lights and Motorized Curtains hotspot",
                  tag: "Automation",
                  pos: "top-[54%] left-[21%]",
                  dotClass: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]",
                  textClass: "text-violet-300",
                },
              ].map((spot) => {
                const isSelected = activeService === spot.key;
                return (
                  <button
                    key={spot.label}
                    type="button"
                    aria-label={spot.label}
                    onClick={() => selectService(spot.key)}
                    className={`absolute ${spot.pos} -translate-x-1/2 -translate-y-1/2 inline-flex flex-col items-center gap-1 p-1 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md ${
                      isSelected ? "scale-110" : "opacity-85 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ring-4 ring-white/15 ${spot.dotClass}`} />
                    <span
                      className={`text-[10px] font-bold tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] ${
                        isSelected ? spot.textClass : "text-white/90"
                      }`}
                    >
                      {spot.tag}
                    </span>
                  </button>
                );
              })}

              {/* Active Service Live Caption Bar */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMeta.key}
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="min-w-0"
                  >
                    <p className={`text-[11px] font-extrabold uppercase tracking-wider ${activeMeta.accentText}`}>
                      {activeMeta.hotspotLabel}
                    </p>
                    <p className="text-xs text-white/80 leading-snug mt-0.5">
                      {activeMeta.caption}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <button
                  type="button"
                  onClick={onGetQuote}
                  className="shrink-0 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white transition-colors"
                >
                  Quote this
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdsHero;
