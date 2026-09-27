import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroFinance from "@/assets/feature-tablet-monitor.jpg";
import imgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import imgLagosApartment from "@/assets/bg-lagos-apartment.jpg";
import imgFamilyHome from "@/assets/feature-solar-roof.jpg";
import imgInstaller from "@/assets/bg-installer.jpg";
import imgBattery from "@/assets/feature-battery.jpg";

import {
  MessageCircle,
  FileText,
  CreditCard,
  Wrench,
  ShieldCheck,
  Check,
  ArrowRight,
  Calculator,
  RotateCcw,
  Sliders,
  Clock,
  HelpCircle,
  Zap,
  TrendingDown,
  FileCheck,
  UserCheck,
  Building2,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import { supabase } from "@/integrations/supabase/client";
import {
  calcPlan,
  formatNGN,
  lookupInterest,
  DEFAULT_FINANCE_CONFIG,
  normalizeFinanceConfig,
  type FinanceConfig,
} from "@/lib/financeCalc";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { getDefaultPackageImage } from "@/lib/packageImages";
import { getSolarPackageImage } from "@/hooks/useSolarPackages";

// 4 simple, welcoming steps
const simpleSteps = [
  {
    n: 1,
    icon: Calculator,
    title: "1. Choose Your Plan",
    desc: "Pick the system you need and select a repayment period (3, 6, 12, or 24 months) that comfortably fits your monthly budget.",
  },
  {
    n: 2,
    icon: FileText,
    title: "2. Quick 3-Minute Application",
    desc: "Submit your basic contact details online along with a valid government ID and your recent bank statement.",
  },
  {
    n: 3,
    icon: CreditCard,
    title: "3. Fast 24-Hour Review & 30% Deposit",
    desc: "Receive pre-approval within 24 hours. Pay your 30% initial deposit to confirm your installation date.",
  },
  {
    n: 4,
    icon: Zap,
    title: "4. Installation & Power On",
    desc: "Certified engineers install and test your system within 2 to 5 working days. Enjoy clean 24/7 power right away.",
  },
];

// Simple, clear financing benefits
const financeBenefits = [
  {
    title: "30% Initial Deposit",
    icon: CreditCard,
    desc: "Pay only after your application is reviewed and approved. No upfront commitments before pre-approval.",
  },
  {
    title: "Fixed Monthly Repayments",
    icon: Clock,
    desc: "Predictable, transparent installments spread across 3, 6, 12, or 24 months. Zero hidden fees or surprise charges.",
  },
  {
    title: "Cheaper on Shorter Tenures",
    icon: TrendingDown,
    desc: "Interest scales directly with your plan length. Settle in 3 or 6 months to pay significantly less in total interest.",
  },
  {
    title: "2% Insurance Included",
    icon: ShieldCheck,
    desc: "Comprehensive equipment protection covering accidental damage, lightning surges, fire, and theft throughout your plan.",
  },
  {
    title: "0% Early Payoff Penalty",
    icon: FileCheck,
    desc: "Clear your balance whenever you want with zero extra fees. Any remaining future interest is immediately waived.",
  },
  {
    title: "100% Full Ownership",
    icon: Zap,
    desc: "Once your final monthly installment is made, the entire system and all manufacturer warranties belong fully to you.",
  },
];

// Simple interest tier overview
const simpleInterestTiers = [
  {
    bracket: "₦1,000,000 - ₦5,000,000",
    baseRate: "9% annual base",
    shortRate: "2.25% on 3 months",
    note: "Great for apartments, homes, and 3.5kVA - 5kVA solar systems.",
  },
  {
    bracket: "₦5,000,000 - ₦7,500,000",
    baseRate: "15% annual base",
    shortRate: "3.75% on 3 months",
    note: "Popular for larger homes, duplexes, and 7.5kVA - 10kVA setups.",
  },
  {
    bracket: "Above ₦7,500,000",
    baseRate: "25% annual base",
    shortRate: "6.25% on 3 months",
    note: "Ideal for commercial offices, clinics, schools, and mini-grids.",
  },
];

const faqs = [
  {
    q: "How does the Easy Flex lease-to-own plan work?",
    a: "Easy Flex allows you to get your solar system installed with a 30% initial deposit. The remaining 70% is spread over 3, 6, 12, or 24 fixed monthly payments. Once you make the final payment, the system is 100% yours.",
  },
  {
    q: "Who is eligible to apply for Easy Flex?",
    a: "Anyone with a steady verifiable income can apply: salaried employees, business owners, merchants, self-employed professionals, and homeowners or tenants with landlord consent. The process is straightforward with fast 24-hour review.",
  },
  {
    q: "What documents do I need to provide?",
    a: "Just three simple items: a valid government ID (NIN, driver's license, voter's card, or passport), your last 3 to 6 months bank statement showing regular earnings, and a recent utility bill for the installation address. Registered businesses also include their CAC certificate.",
  },
  {
    q: "Can I pay off my remaining balance early?",
    a: "Yes. There are 0% early settlement fees. You can pay off your remaining balance at any time, and any future unaccrued bank interest is waived.",
  },
  {
    q: "What does the 2% insurance fee cover?",
    a: "The 2% insurance protects your solar equipment against fire, power and lightning surges, theft, and storm damage throughout your repayment period. Any damaged covered components are repaired or replaced at no extra cost.",
  },
  {
    q: "How long does approval and installation take?",
    a: "Your application is reviewed within 24 hours. Once your 30% deposit is paid, our certified engineering team completes the site survey and installs your system within 2 to 5 working days.",
  },
  {
    q: "What warranties are included?",
    a: "All equipment comes with full manufacturer warranties: 25 years on solar panels, 5 to 10 years on lithium batteries, 2 to 5 years on inverters, plus a 2-year Tioga certified workmanship guarantee.",
  },
];

const Finance = () => {
  const { content: cms } = useLandingContent("page_finance");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  const { contact } = useSiteContact();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const locState = (location.state || {}) as {
    itemName?: string;
    amount?: number;
    months?: number;
    itemImage?: string;
    itemId?: string;
    itemType?: string;
  };

  const rawItemName = params.get("item") || locState.itemName || "";
  const presetAmount = Number(params.get("amount") || locState.amount || 0);
  const presetMonths = Number(params.get("months") || locState.months || 0);
  const rawImage = params.get("image") || locState.itemImage || "";
  const rawId = params.get("id") || locState.itemId || "";
  const rawType = params.get("type") || locState.itemType || "";
  const presetPackage = params.get("package") || "";

  // Dedicated item mode is active when user arrived with a specific item or package
  const hasItem = Boolean(rawItemName || presetPackage || (rawId && rawType));

  const [config, setConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);
  const [amount, setAmount] = useState<number>(presetAmount > 0 ? presetAmount : 3000000);
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [activeTrack, setActiveTrack] = useState<"salaried" | "sme" | "property">("salaried");

  const initialTenure = [3, 6, 12, 24].includes(presetMonths) ? presetMonths : 12;
  const [selectedMonths, setSelectedMonths] = useState<number>(initialTenure);

  useEffect(() => {
    if (presetAmount > 0) setAmount(presetAmount);
  }, [presetAmount]);

  useEffect(() => {
    if ([3, 6, 12, 24].includes(presetMonths)) {
      setSelectedMonths(presetMonths);
    }
  }, [presetMonths]);

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (settings?.value) setConfig(normalizeFinanceConfig(settings.value as any));
    })();
  }, []);

  // Resolve item image with fallback
  const itemImage = useMemo(() => {
    if (rawImage) return rawImage;
    if (rawType && (rawId || rawItemName)) {
      return getDefaultPackageImage(rawType as any, rawId || rawItemName);
    }
    const lower = rawItemName.toLowerCase();
    if (lower.includes("solar") || presetPackage) {
      return getSolarPackageImage({ inverter: rawItemName });
    }
    if (lower.includes("lock")) {
      return getDefaultPackageImage("lock", rawItemName);
    }
    if (lower.includes("automation")) {
      return getDefaultPackageImage("automation", rawItemName);
    }
    if (lower.includes("cctv") || lower.includes("camera")) {
      return getDefaultPackageImage("cctv", rawItemName);
    }
    return "";
  }, [rawImage, rawType, rawId, rawItemName, presetPackage]);

  const tenures = config.tenures_months?.length ? config.tenures_months : [3, 6, 12, 24];
  const plans = useMemo(() => tenures.map((t) => calcPlan(amount, t, config)), [amount, tenures, config]);
  const primary = plans[0];

  // Active plan for selected tenure
  const activePlan = useMemo(() => {
    return plans.find((p) => p.tenure_months === selectedMonths) || plans[plans.length - 1] || primary;
  }, [plans, selectedMonths, primary]);

  // Active interest tier for current amount
  const activeTier = useMemo(() => lookupInterest(amount, config), [amount, config]);

  const handleClearItem = () => {
    navigate("/finance", { replace: true, state: {} });
    setAmount(3000000);
  };

  const applyUrlForMonths = (m: number) => {
    const q = new URLSearchParams();
    q.set("item", rawItemName || "Easy Flex Plan");
    q.set("amount", String(amount));
    q.set("months", String(m));
    if (itemImage) q.set("image", itemImage);
    if (rawId) q.set("id", rawId);
    if (rawType) q.set("type", rawType);
    if (presetPackage) q.set("package", presetPackage);
    return `/finance/apply?${q.toString()}`;
  };

  const waMessage = `Hello Tioga, I'm reviewing Easy Flex financing for "${rawItemName || "solar equipment"}" (System cost: ${formatNGN(amount)}, ${selectedMonths}-month plan at ${formatNGN(activePlan.monthly_payment)}/mo). Please advise on approval timeline.`;
  const waUrl = whatsappLink(contact, waMessage);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={hasItem ? `Easy Flex Financing for ${rawItemName}` : "Lease-to-Own Solar Financing in Nigeria"}
        description="Own your solar system with 30% down and flexible 3, 6, 12 or 24 month monthly repayments. Bank-partner financing for homes and businesses across Nigeria."
        path="/finance"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Easy Flex Financing", path: "/finance" }]),
          serviceJsonLd({
            name: "Tioga Easy Flex Solar Financing",
            description: "Lease-to-own solar financing in Nigeria: 30% deposit, then 3, 6, 12 or 24 fixed monthly repayments with installation and insurance included.",
            path: "/finance",
            serviceType: "Solar equipment financing",
          }),
        ]}
      />
      <SiteHeader />

      {/* HERO SECTION */}
      <PageHero
        eyebrow={hasItem ? "Personalized Financing Plan" : c.eyebrow || "Tioga Easy Flex"}
        title={hasItem ? `Finance: ${rawItemName}` : c.title || "Own your solar system without paying upfront"}
        subtitle={
          hasItem
            ? `Spread the investment for ${rawItemName} over 3, 6, 12 or 24 months with 30% initial deposit. Full breakdown and installment schedule below.`
            : c.subtitle || "Start with 30% deposit, then spread the rest over 3, 6, 12 or 24 fixed monthly payments. Bank-partner financing, professional installation, and insurance included."
        }
        backgroundImage={heroFinance}
        backgroundAlt="Solar panels powering a Nigerian home"
      >
        <a
          href={hasItem ? "#item-breakdown" : "#calculator"}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
        >
          <Calculator size={16} />
          {hasItem ? "View Monthly Breakdown" : "Calculate Repayment"}
        </a>
        <a
          href="#how-it-works"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
        >
          How Easy Flex Works
        </a>
      </PageHero>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CASE A: NAVIGATED FROM EASY FLEX / ITEM SPECIFIED              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {hasItem && (
        <section id="item-breakdown" className="section-padding bg-muted/20 border-b border-border scroll-mt-20">
          <div className="section-container">
            {/* Context Header with Clear Button */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-8 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Tailored Product Plan
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · Pre-calculated monthly breakdown for this system
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearItem}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
                title="Return to general finance calculator"
              >
                <RotateCcw size={12} />
                Switch to general calculator
              </button>
            </div>

            {/* Split Showcase: Left = Product Card, Right = Monthly Price Breakdown */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
              {/* LEFT: Product Card */}
              <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-5 lg:sticky lg:top-24">
                {/* Product Image */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted/30 border border-border/80 flex items-center justify-center p-3">
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={rawItemName}
                      className="max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-2">
                        <CreditCard size={26} />
                      </div>
                      <p className="text-xs text-muted-foreground">Equipment package photo</p>
                    </div>
                  )}

                  {rawType && (
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-background/90 backdrop-blur-md border border-border/80 text-[10px] font-bold text-foreground uppercase tracking-wider shadow-xs">
                      {rawType}
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold shadow-sm">
                    30% Upfront
                  </span>
                </div>

                {/* Product Title & Price */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                    Selected equipment
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground leading-tight">
                    {rawItemName || (presetPackage ? `Solar Package #${presetPackage}` : "Easy Flex System")}
                  </h3>
                  <div className="mt-3 p-3.5 rounded-2xl bg-muted/40 border border-border flex items-baseline justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">System cost (NGN)</span>
                      <span className="text-xl sm:text-2xl font-display font-extrabold text-foreground">
                        {formatNGN(amount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdjuster(!showAdjuster)}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      <Sliders size={13} />
                      {showAdjuster ? "Hide adjuster" : "Adjust cost"}
                    </button>
                  </div>
                </div>

                {/* Optional Expandable Cost Adjuster */}
                {showAdjuster && (
                  <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Fine-tune system cost
                    </label>
                    <input
                      type="number"
                      min={1000000}
                      step={50000}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-bold font-display"
                    />
                    <input
                      type="range"
                      min={1000000}
                      max={20000000}
                      step={50000}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">Adjust if adding extra panels, batteries, or custom wiring.</p>
                  </div>
                )}

                {/* Guarantee Checklist */}
                <div className="pt-2 border-t border-border space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>30% initial deposit ({formatNGN(activePlan.deposit)})</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>Quick approval review within 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>Professional certified installation included</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>2% insurance and 2-year warranty included</span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Monthly Price Breakdown */}
              <div className="lg:col-span-7 rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-[var(--shadow-card)] space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                    Monthly Price Breakdown
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Choose the repayment period that best fits your monthly cashflow.
                  </p>
                </div>

                {/* Tenure Selector Tabs */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                    Select Plan Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {plans.map((p) => {
                      const isActive = selectedMonths === p.tenure_months;
                      return (
                        <button
                          key={p.tenure_months}
                          type="button"
                          onClick={() => setSelectedMonths(p.tenure_months)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20"
                              : "border-border bg-muted/20 hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="block text-xs font-bold uppercase tracking-wider">{p.tenure_months} Months</span>
                          <span className="block text-sm sm:text-base font-display font-bold mt-1 tabular-nums">
                            {formatNGN(p.monthly_payment)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">per month</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Highlight Callout Box for Selected Tenure */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pb-3 border-b border-primary/20">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary font-bold">
                        {selectedMonths}-Month Plan
                      </span>
                      <div className="text-2xl sm:text-3xl font-display font-extrabold text-primary tabular-nums mt-0.5">
                        {formatNGN(activePlan.monthly_payment)}
                        <span className="text-xs sm:text-sm font-normal text-muted-foreground"> / month</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground sm:text-right">
                      Fixed rate across {selectedMonths} monthly payments
                    </span>
                  </div>

                  {/* Comprehensive Financial Breakdown Rows */}
                  <div className="mt-4 space-y-2 text-xs sm:text-sm">
                    <Row label="Initial 30% Down Payment" value={formatNGN(activePlan.deposit)} bold />
                    <Row label="Financed Principal (70%)" value={formatNGN(activePlan.financed)} />
                    <Row
                      label={`Bank Interest (${parseFloat((activePlan.interest_rate * 100).toFixed(2))}%)`}
                      value={formatNGN(activePlan.interest_amount)}
                      muted
                    />
                    <Row label="Insurance Protection (2%)" value={formatNGN(activePlan.insurance_fee)} muted />
                    <Row label="Facility Management (1%)" value={formatNGN(activePlan.management_fee)} muted />
                    <div className="pt-2 border-t border-border/80 space-y-2">
                      <Row label={`Total Repayments (${selectedMonths} × monthly)`} value={formatNGN(activePlan.total_repayment)} bold />
                      <Row label="Total Overall Cost (Deposit + Repayments)" value={formatNGN(activePlan.deposit + activePlan.total_repayment)} bold />
                    </div>
                  </div>
                </div>

                {/* Reassuring Confidence Strip */}
                <div className="rounded-2xl border border-border bg-muted/30 p-3.5 flex flex-wrap items-center justify-around gap-2 text-xs text-muted-foreground">
                  <span>Fast 24-hour review</span>
                  <span>•</span>
                  <span>0% early payoff penalty</span>
                  <span>•</span>
                  <span>100% full ownership transfer</span>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-1">
                  <Link
                    to={applyUrlForMonths(selectedMonths)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 text-sm sm:text-base font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-md"
                  >
                    Apply for this {selectedMonths}-Month Plan <ArrowRight size={16} />
                  </Link>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-muted py-3 px-6 text-xs sm:text-sm font-semibold text-foreground transition-all"
                  >
                    <MessageCircle size={15} className="text-emerald-500 shrink-0" />
                    Chat with a Finance Specialist on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CASE B: DIRECT NAVIGATION / GENERAL CALCULATOR                */}
      {/* (Only rendered when hasItem is false)                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!hasItem && (
        <section id="calculator" className="section-padding bg-muted/30 border-b border-border scroll-mt-20">
          <div className="section-container">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
                <Calculator size={22} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Easy Flex Repayment Calculator</h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Enter any system cost to see your 30% deposit and fixed monthly payments across all 4 plans.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6">
              <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">System cost (NGN)</label>
                <input
                  type="number"
                  min={1000000}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full mt-2 rounded-xl border border-border bg-background px-3 sm:px-4 py-3 text-xl sm:text-2xl font-display font-bold"
                />
                <input
                  type="range"
                  min={1000000}
                  max={20000000}
                  step={50000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-3 accent-primary"
                />
                <div className="mt-5 space-y-2 text-xs sm:text-sm border-t border-border pt-4">
                  <Row label="30% Upfront Deposit" value={formatNGN(primary.deposit)} bold />
                  <Row label="Financed Balance (70%)" value={formatNGN(primary.financed)} />
                  <Row
                    label={`Annual Interest Tier (${(activeTier.rate * 100).toFixed(0)}% base)`}
                    value={formatNGN(primary.interest_amount)}
                    muted
                  />
                  <Row label="Insurance (2%)" value={formatNGN(primary.insurance_fee)} muted />
                  <Row label="Management Fee (1%)" value={formatNGN(primary.management_fee)} muted />
                  <div className="pt-2 border-t border-border space-y-2">
                    <Row label="Total Repayments" value={formatNGN(primary.total_repayment)} bold />
                    <Row label="Total Overall Cost" value={formatNGN(primary.deposit + primary.total_repayment)} bold />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {plans.map((p, i) => {
                  const isLowest = i === plans.length - 1; // 24-month tenure
                  return (
                    <div
                      key={p.tenure_months}
                      className={`rounded-3xl border p-4 sm:p-5 bg-card relative flex flex-col justify-between ${
                        isLowest ? "border-primary shadow-sm ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      {isLowest && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-2.5 py-0.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-xs">
                          Lowest monthly
                        </span>
                      )}
                      <div>
                        <h3 className="font-display font-bold text-lg">{p.tenure_months}-Month Plan</h3>
                        <p className="text-[11px] text-muted-foreground mb-3">
                          {parseFloat((p.interest_rate * 100).toFixed(2))}% effective interest · 2% ins · 1% mgmt
                        </p>
                        <p className="text-xl sm:text-2xl font-display font-bold text-primary tabular-nums break-words">
                          {formatNGN(p.monthly_payment)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mb-3">per month × {p.tenure_months}</p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                          <li className="flex justify-between">
                            <span>Upfront deposit:</span>
                            <strong className="text-foreground">{formatNGN(p.deposit)}</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>Financed:</span>
                            <span>{formatNGN(p.financed)}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Total repayment:</span>
                            <strong className="text-foreground">{formatNGN(p.total_repayment)}</strong>
                          </li>
                        </ul>
                      </div>
                      <Link
                        to={`/finance/apply?item=Easy%20Flex%20Plan&amount=${amount}&months=${p.tenure_months}`}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all"
                      >
                        Apply {p.tenure_months} mo <ArrowRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1: HOW EASY FLEX WORKS (4 SIMPLE STEPS)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-padding bg-background border-b border-border scroll-mt-20">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Simple 4-Step Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              How Easy Flex Works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Getting started is quick and stress-free. No unnecessary paperwork or complicated procedures.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {simpleSteps.map((step) => (
              <div
                key={step.n}
                className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <step.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2: SIMPLE ELIGIBILITY & DOCUMENT CHECKLIST             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="eligibility" className="section-padding bg-muted/30 border-b border-border scroll-mt-20">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Straightforward Qualification
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Eligibility &amp; What You Need
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Designed to be accessible for individuals, professionals, and registered businesses across Nigeria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Card 1: Who Can Apply */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">Who Can Apply</h3>
                  <p className="text-xs text-muted-foreground">Anyone with steady verifiable income</p>
                </div>
              </div>
              <ul className="space-y-3 pt-3 border-t border-border text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Salaried employees or civil servants with regular monthly pay</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Registered business owners, merchants, and SMEs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Self-employed professionals with regular bank deposits</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Residential homeowners or tenants (with landlord permission)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Ready with the 30% initial deposit once approved</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Simple Document Checklist */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCheck size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">What You Need</h3>
                  <p className="text-xs text-muted-foreground">Just the essentials for fast verification</p>
                </div>
              </div>
              <ul className="space-y-3 pt-3 border-t border-border text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Valid ID (NIN slip, driver's license, voter's card, or passport)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Last 3 to 6 months bank statement showing regular earnings</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Recent utility bill for the installation premises</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>(For registered businesses: CAC registration document)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="text-primary mt-0.5 shrink-0" size={16} />
                  <span>Active phone number linked to your BVN for identity safety</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <span className="font-display font-bold text-foreground text-sm sm:text-base block">
                Fast review within 24 hours
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                No long queues or endless paperwork. Submit online and get approved quickly.
              </p>
            </div>
            <Link
              to={hasItem ? applyUrlForMonths(selectedMonths) : "/finance/apply"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:brightness-110 shrink-0 transition-all shadow-xs"
            >
              Start Application <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 3: TRANSPARENT TERMS & BENEFITS                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="terms" className="section-padding bg-background border-b border-border scroll-mt-20">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Transparent Terms
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Key Terms You Can Trust
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Every Easy Flex plan is built with honest pricing, flexible durations, and complete protection.
            </p>
          </div>

          {/* 6 Key Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {financeBenefits.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <item.icon size={20} />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Interest Overview Cards */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="mb-6 pb-4 border-b border-border">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Interest Tiers Overview
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Rates are determined by system size and prorated by your chosen tenure. Shorter plans clear faster with lower interest.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {simpleInterestTiers.map((tier) => (
                <div key={tier.bracket} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                    {tier.bracket}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-display font-bold text-foreground">{tier.baseRate}</span>
                    <span className="text-xs text-muted-foreground">({tier.shortRate})</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tier.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 4: TRUST & WARRANTIES                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-muted/20 border-b border-border">
        <div className="section-container">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
            <img src={imgInstaller} alt="Certified Tioga installer on rooftop" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-midnight/90" />
            <div className="relative p-8 sm:p-12 max-w-2xl text-primary-foreground space-y-3">
              <ShieldCheck className="text-gold" size={38} />
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                Your investment is protected from Day One
              </h2>
              <p className="opacity-90 leading-relaxed text-xs sm:text-sm">
                Every Easy Flex plan includes 2% all-risk equipment insurance, professional installation, and ongoing maintenance. Your system is fully covered for the entire repayment period and beyond.
              </p>
              <div className="pt-3 grid sm:grid-cols-3 gap-3 border-t border-white/10 text-xs">
                <div>
                  <span className="font-bold block text-white">25-Year Panel Output</span>
                  <span className="opacity-80">Tier-1 monocrystalline panels</span>
                </div>
                <div>
                  <span className="font-bold block text-white">5-10 Year Battery</span>
                  <span className="opacity-80">LiFePO4 deep cycle technology</span>
                </div>
                <div>
                  <span className="font-bold block text-white">100% Full Ownership</span>
                  <span className="opacity-80">Transferred upon final payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 5: FREQUENTLY ASKED QUESTIONS                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-padding bg-background scroll-mt-20">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Got Questions?
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Easy Flex FAQ
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Clear answers to the most common questions about payments, interest rates, and early payoff.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-xs transition-all">
                <summary className="flex justify-between items-center cursor-pointer list-none font-display font-semibold text-sm sm:text-base text-foreground">
                  {f.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {f.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-3xl border border-border bg-muted/30 text-center space-y-3">
            <h3 className="font-display font-bold text-lg">Have more questions about financing?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Our finance team is ready to assist you with quick pre-approval checks and custom package advice.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-xs"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-muted"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

const Row = ({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) => (
  <div className="flex justify-between items-baseline gap-2">
    <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
    <span className={`tabular-nums ${bold ? "font-display text-base font-bold text-foreground" : "font-semibold text-foreground"}`}>
      {value}
    </span>
  </div>
);

export default Finance;
