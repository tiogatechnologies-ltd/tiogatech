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
  Home,
  ShieldCheck,
  Check,
  ArrowRight,
  Calculator,
  RotateCcw,
  Sliders,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import { supabase } from "@/integrations/supabase/client";
import { calcPlan, formatNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { getDefaultPackageImage } from "@/lib/packageImages";
import { getSolarPackageImage } from "@/hooks/useSolarPackages";

const steps = [
  { n: 1, icon: MessageCircle, title: "Free Consultation", desc: "Talk to our experts about your energy needs and get a personalized assessment." },
  { n: 2, icon: FileText, title: "Custom Quote", desc: "Receive a detailed quote with system specs, pricing breakdown, and projected savings." },
  { n: 3, icon: CreditCard, title: "30% Deposit", desc: "Secure your installation with just 30% upfront. The remaining balance is financed by our bank partner." },
  { n: 4, icon: Wrench, title: "Professional Installation", desc: "Our certified technicians install your system within 2 to 5 working days." },
  { n: 5, icon: Home, title: "Monthly Repayments", desc: "Pick 3, 6, 12 or 24 fixed monthly installments. Zero hidden fees." },
];

const eligibility = [
  "Valid government-issued ID (NIN, voter's card, driver's license, or passport)",
  "Verifiable Nigerian address (utility bill, rental agreement, or LGA letter)",
  "Recent bank statements (last 3 months)",
  "Employment letter or registered business / income verification",
  "BVN / NIN verification",
  "Guarantor information (where applicable)",
];

const imperiumRequirements = [
  "Completed Imperium Lease-to-Own application form",
  "Valid government-issued ID (NIN, passport, driver's license or voter's card)",
  "Two recent passport photographs",
  "Proof of address (utility bill, rental agreement or LGA letter - not older than 3 months)",
  "6 months personal bank statement",
  "Employment / income letter, or evidence of steady income for self-employed applicants",
  "One credible guarantor with a valid ID and proof of address",
  "30% deposit on the total system cost",
];

const smeRequirements = [
  "Completed Easy Flex SME application form",
  "CAC certificate of incorporation and Memart",
  "Board resolution / partners' consent authorising the facility",
  "6 months corporate bank statement",
  "Valid ID of the two signatories / directors and proof of business address",
  "Company profile and last 12 months management accounts (where available)",
  "Personal guarantee of a director or a corporate guarantor",
  "30% deposit on the total system cost",
];

const faqs = [
  { q: "How is interest calculated?", a: "Interest is set by our bank partner using three loan tiers: 9% (₦1m to ₦5m), 15% (₦5m to ₦7.5m), and 25% (above ₦7.5m). A 2% insurance fee and 1% management fee are added on top." },
  { q: "Which plan length should I choose?", a: "3 and 6 month plans clear faster with lower total cost. 12 and 24 month plans give you the smallest monthly payment. Pick whichever fits your cash flow." },
  { q: "What happens if I miss a payment?", a: "We send a reminder 3 days before each due date. If a payment is missed, our team reaches out to arrange a flexible solution before any penalties apply." },
  { q: "Can I pay off early without penalty?", a: "Yes. You can settle the remaining balance any time at no extra cost." },
  { q: "What is included in the quoted price?", a: "Equipment, VAT, installation, configuration, testing, and a 2-year workmanship warranty. No hidden fees." },
  { q: "How long does approval take?", a: "Decision within 24 hours of submitting your application and documents. Equipment procurement takes 3 to 5 working days." },
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
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
        >
          <Calculator size={16} />
          {hasItem ? "View Monthly Breakdown" : "Calculate Repayment"}
        </a>
        <Link
          to={hasItem ? applyUrlForMonths(selectedMonths) : "/finance/apply"}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
        >
          Apply for Financing <ArrowRight size={16} />
        </Link>
      </PageHero>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CASE A: NAVIGATED FROM EASY FLEX / ITEM SPECIFIED              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {hasItem && (
        <section id="item-breakdown" className="section-padding bg-muted/20 border-b border-border scroll-mt-16">
          <div className="section-container">
            {/* Context Header with Clear Button */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-8 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Tailored Product Plan
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  · Viewing pre-calculated lease-to-own breakdown
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearItem}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                title="Return to general finance calculator"
              >
                <RotateCcw size={12} />
                Switch to general calculator
              </button>
            </div>

            {/* Split Showcase: Left = Product Card, Right = Monthly Price Breakdown */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-12">
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
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md border border-border/80 text-[10px] font-bold text-foreground uppercase tracking-wider shadow-sm">
                      {rawType}
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
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
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
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
                    <span>Bank-partner review within 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>COREN-supervised professional installation included</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>2% insurance &amp; comprehensive warranty included</span>
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
                    Select your preferred tenure to see exact monthly repayments and fee breakdown for this system.
                  </p>
                </div>

                {/* Tenure Selector Tabs */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-2">
                    Choose Repayment Period
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {plans.map((p) => {
                      const isActive = selectedMonths === p.tenure_months;
                      return (
                        <button
                          key={p.tenure_months}
                          type="button"
                          onClick={() => setSelectedMonths(p.tenure_months)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
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
                        {selectedMonths}-Month Installment Plan
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
                    <Row label="Facility Management Fee (1%)" value={formatNGN(activePlan.management_fee)} muted />
                    <div className="pt-2 border-t border-border/80 space-y-2">
                      <Row label={`Total Repayments (${selectedMonths} × monthly)`} value={formatNGN(activePlan.total_repayment)} bold />
                      <Row label="Total Overall Cost (Deposit + Repayments)" value={formatNGN(activePlan.deposit + activePlan.total_repayment)} bold />
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-1">
                  <Link
                    to={applyUrlForMonths(selectedMonths)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 px-6 text-sm sm:text-base font-bold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
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
        <section id="calculator" className="section-padding bg-muted/30 scroll-mt-20">
          <div className="section-container">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
                <Calculator size={22} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Easy Flex repayment calculator</h2>
              <p className="mt-3 text-muted-foreground">
                Enter any project cost to see your deposit, interest tier, and monthly payment across all 4 plan lengths.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_2fr] gap-4 sm:gap-6">
              <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">System cost (NGN)</label>
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
                  <Row label="30% Deposit" value={formatNGN(primary.deposit)} />
                  <Row label="Financed (70%)" value={formatNGN(primary.financed)} />
                  <Row label={`Interest tier (${(primary.interest_rate * 100).toFixed(0)}%)`} value={formatNGN(primary.interest_amount)} muted />
                  <Row label="Insurance (2%)" value={formatNGN(primary.insurance_fee)} muted />
                  <Row label="Management (1%)" value={formatNGN(primary.management_fee)} muted />
                  <div className="pt-2 border-t border-border space-y-2">
                    <Row label="Total repayment" value={formatNGN(primary.total_repayment)} bold />
                    <Row label="Total cost (deposit + repayment)" value={formatNGN(primary.deposit + primary.total_repayment)} bold />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {plans.map((p, i) => {
                  const popular = i === plans.length - 1; // longest tenure = smallest monthly
                  return (
                    <div
                      key={p.tenure_months}
                      className={`rounded-3xl border p-4 sm:p-5 bg-card relative ${
                        popular ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border"
                      }`}
                    >
                      {popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
                          Lowest monthly
                        </span>
                      )}
                      <h3 className="font-display font-bold">{p.tenure_months}-Month Plan</h3>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        {(p.interest_rate * 100).toFixed(0)}% interest · 2% insurance · 1% mgmt
                      </p>
                      <p className="text-xl sm:text-2xl font-display font-bold text-primary tabular-nums break-words">
                        {formatNGN(p.monthly_payment)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mb-3">per month × {p.tenure_months}</p>
                      <ul className="space-y-1 text-xs">
                        <li className="flex items-start gap-1.5">
                          <Check className="text-primary mt-0.5 shrink-0" size={12} />
                          Deposit: {formatNGN(p.deposit)}
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="text-primary mt-0.5 shrink-0" size={12} />
                          Total: {formatNGN(p.total_repayment)}
                        </li>
                      </ul>
                      <Link
                        to={`/finance/apply?item=Easy%20Flex%20Plan&amount=${amount}&months=${p.tenure_months}`}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                      >
                        Apply <ArrowRight size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
                Talk to an expert
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* VISUAL BAND */}
      <section className="section-padding">
        <div className="section-container">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { img: imgFamilyHome, title: "Power your home", desc: "Lease-to-own systems sized for Nigerian family homes." },
              { img: imgLagosApartment, title: "Run your business", desc: "Keep shops, salons and offices open through every outage." },
              { img: imgBattery, title: "Backup that lasts", desc: "Lithium battery banks built for daily cycling, not just outages." },
            ].map((card) => (
              <div key={card.title} className="group relative rounded-3xl overflow-hidden border border-border bg-card hover-lift">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={card.img} alt={card.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-padding bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <img src={imgRooftopInstall} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="section-container max-w-3xl relative">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">Five simple steps from consultation to switching on.</p>
          </div>
          <ol className="relative border-l border-border ml-3 space-y-8">
            {steps.map((s) => (
              <li key={s.n} className="pl-8 relative">
                <span className="absolute -left-[19px] top-0 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center">
                  <s.icon className="text-primary" size={18} />
                </span>
                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">Step {s.n}</p>
                <h3 className="text-lg font-display font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-display font-bold mb-2 text-center">Eligibility</h2>
          <p className="text-muted-foreground text-center mb-8">Have these ready and your application moves fast.</p>
          <ul className="space-y-3">
            {eligibility.map((e) => (
              <li key={e} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <Check className="text-primary mt-0.5 shrink-0" size={18} />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* REQUIREMENTS: Imperium + SMEs */}
      <section className="section-padding">
        <div className="section-container max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold">Application requirements</h2>
            <p className="text-muted-foreground mt-2">Pick the track that matches you and have these ready.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-1">Track 1</p>
              <h3 className="text-xl font-display font-bold mb-4">Imperium Lease-to-Own customers</h3>
              <ul className="space-y-2.5 text-sm">
                {imperiumRequirements.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-bold mb-1">Track 2</p>
              <h3 className="text-xl font-display font-bold mb-4">SMEs</h3>
              <ul className="space-y-2.5 text-sm">
                {smeRequirements.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="section-padding">
        <div className="section-container">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
            <img src={imgInstaller} alt="Certified Tioga installer on rooftop" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-midnight/90" />
            <div className="relative p-8 sm:p-14 max-w-2xl text-primary-foreground">
              <ShieldCheck className="text-gold mb-4" size={36} />
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">Your investment is protected</h2>
              <p className="opacity-90 leading-relaxed">
                Every Easy Flex plan includes 2% insurance, professional installation, and ongoing maintenance. Your system is covered for the full repayment period and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-muted/30">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-center mb-10">Easy Flex FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-[var(--shadow-card)]">
                <summary className="flex justify-between items-center cursor-pointer list-none font-display font-semibold">
                  {f.q}
                  <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
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
