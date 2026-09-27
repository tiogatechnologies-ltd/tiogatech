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
  BadgeCheck,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  HelpCircle,
  Info,
  Lock,
  Zap,
  Percent,
  FileCheck,
  Briefcase,
  Layers,
  ChevronDown,
  CheckCircle2,
  TrendingDown,
  AlertCircle,
  FileSpreadsheet,
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

// 6-stage approval and installation roadmap
const approvalRoadmap = [
  {
    n: 1,
    icon: FileText,
    title: "1. Apply Online & Select Tenure",
    timeframe: "Takes ~5 minutes",
    desc: "Pick your preferred product and tenure (3, 6, 12, or 24 months), fill in your basic personal or business details, and upload preliminary KYC documents.",
  },
  {
    n: 2,
    icon: UserCheck,
    title: "2. Bank Credit Underwriting",
    timeframe: "Decision within 24 hours",
    desc: "Our accredited banking partners (including Sterling Bank Imperium) verify your BVN, income capacity, and bank statement. Fast digital assessment with no bureaucratic delays.",
  },
  {
    n: 3,
    icon: CreditCard,
    title: "3. Offer Letter & 30% Down Payment",
    timeframe: "Same business day",
    desc: "Review your transparent term sheet. Fund your 30% initial deposit into a dedicated partner escrow account—funds are held securely until installation sign-off.",
  },
  {
    n: 4,
    icon: Wrench,
    title: "4. Engineering Site Survey & Dispatch",
    timeframe: "Within 24 to 48 hours",
    desc: "A certified Tioga solar engineer visits your premises to inspect roof orientation, breaker boards, and load circuits, followed by equipment dispatch.",
  },
  {
    n: 5,
    icon: Zap,
    title: "5. COREN Installation & Commissioning",
    timeframe: "2 to 5 business days",
    desc: "Our COREN-certified technicians complete full system mounting, lithium battery configuration, inverter synchronization, and mobile monitoring app setup.",
  },
  {
    n: 6,
    icon: BadgeCheck,
    title: "6. Handover & Full Title Transfer",
    timeframe: "End of tenure",
    desc: "Enjoy 24/7 uninterrupted clean power backed by 2-year warranty and insurance. Upon your final monthly payment, receive your 100% unencumbered Title Deed & Ownership Certificate.",
  },
];

// 4 core eligibility pillars
const eligibilityPillars = [
  {
    title: "1. Qualifying Applicant Profiles",
    icon: UserCheck,
    points: [
      "Salary Earners: Employed for at least 6 months with verified monthly salary paid directly into a commercial bank account.",
      "SMEs & Registered Businesses: Registered with CAC (RC or BN), operating actively for at least 12 months with consistent monthly cashflow.",
      "Self-Employed Professionals: Consistent verifiable freelance or professional income stream with 6 months of active bank statements.",
      "Property Owners & Long-Term Tenants: Homeowners with title documents, or tenants with a lease agreement covering the financing period.",
    ],
  },
  {
    title: "2. Income & Debt-to-Income (DTI) Threshold",
    icon: Percent,
    points: [
      "Affordability Benchmark: Monthly installment should not exceed 33% to 40% of verifiable net monthly earnings or business profit.",
      "Minimum Project Size: Eligible for systems and equipment packages starting from ₦1,000,000 upwards.",
      "Combined Household Income: Working spouses or business partners may combine bank statements to meet qualification thresholds.",
      "Steady Inflows: Demonstrable consistent inflows over the preceding 6 consecutive months.",
    ],
  },
  {
    title: "3. Age & Legal Identity",
    icon: BadgeCheck,
    points: [
      "Age Requirement: 21 to 60 years old at time of application (or up to statutory retirement age for civil service applicants).",
      "Valid Government Identification: NIN Slip / Card, International Passport, Driver's License, or Permanent Voter's Card (PVC).",
      "BVN / NIN Verification: Active Bank Verification Number matching legal name and phone records for identity and anti-fraud checks.",
      "Credit Standing: Clean credit bureau record (CRC, CreditRegistry, or FirstCentral) with no unresolved default balances.",
    ],
  },
  {
    title: "4. Premises & Location Eligibility",
    icon: Building2,
    points: [
      "Service Coverage: Properties located within Tioga installation states (Lagos, Abuja FCT, Rivers, Oyo, Ogun, Edo, Delta, etc.).",
      "Physical Address Verification: Verified via utility bill (electricity, water, or waste) dated within the last 3 months, or stamped tenancy agreement.",
      "Installation Suitability: Structurally sound roof (corrugated, stone-coated, or slab) or dedicated ground mounting area with clear sun exposure.",
      "Landlord Consent: Simple written installation consent required for leased residential or rented commercial spaces.",
    ],
  },
];

// Document requirements by applicant track
const requirementTracks = [
  {
    id: "salaried",
    tag: "Track 1",
    title: "Salaried Employees & Civil Servants",
    badge: "Most Popular for Homes",
    desc: "For corporate employees, tech professionals, and public sector workers seeking lease-to-own home solar systems.",
    items: [
      "Completed Easy Flex Lease-to-Own online application form",
      "Valid Government ID (NIN, International Passport, Driver's License, or Voter's Card)",
      "6 months stamped personal bank statements showing regular salary credits",
      "Official Letter of Employment, Confirmation Letter, or valid Staff ID",
      "Recent Utility Bill (NEPA/IKEDC/EKEDC/Water bill not older than 3 months)",
      "One credible guarantor with a valid ID, proof of income, and passport photograph",
      "30% initial deposit (funded upon formal pre-approval offer)",
    ],
  },
  {
    id: "sme",
    tag: "Track 2",
    title: "SMEs & Registered Businesses",
    badge: "Commercial Power",
    desc: "For shops, clinics, offices, hotels, schools, and factories seeking to eliminate high diesel expenses.",
    items: [
      "Completed Easy Flex SME facility application form",
      "CAC Certificate of Incorporation / Registration & Status Report / MEMART",
      "6 to 12 months corporate bank statements showing steady operational turnover",
      "Board Resolution or Partners' Consent approving the Easy Flex lease-to-own facility",
      "Valid Government IDs and proof of residential address for 2 principal directors/signatories",
      "Company Profile and recent 12-month management accounts (or audited financials)",
      "Personal guarantee of a company director or corporate cross-guarantee",
      "30% initial deposit (funded upon formal credit committee approval)",
    ],
  },
  {
    id: "property",
    tag: "Track 3",
    title: "Property Owners & Real Estate Developers",
    badge: "Residential Estates & Landlords",
    desc: "For landlords and estate developers outfitting rental units, duplexes, or residential clusters with solar amenities.",
    items: [
      "Proof of property ownership (Certificate of Occupancy, Deed of Assignment, or Governor's Consent)",
      "Building electrical schematic or single-line diagram (for multi-unit or commercial installations)",
      "6 months personal or corporate bank statements demonstrating property rental income",
      "Valid Government ID and passport photograph of the title holder",
      "Site access authorization for Tioga engineering survey and structural roof load assessment",
      "30% initial deposit on the approved turnkey procurement and installation invoice",
    ],
  },
];

// 6 Core Financial Pillars & Fee Disclosures
const financialDisclosures = [
  {
    title: "30% Initial Equity Deposit",
    icon: CreditCard,
    highlight: "Required Upfront",
    desc: "You contribute 30% of the total system cost once your application receives credit pre-approval.",
    details: "Your deposit is held in a secure partner escrow account and is only released after our engineering team completes installation and you sign off on commissioning.",
  },
  {
    title: "70% Financed Balance",
    icon: Building2,
    highlight: "Bank Partnered",
    desc: "The remaining 70% balance is financed over 3, 6, 12, or 24 months through commercial banking partners.",
    details: "Repayments are completely fixed throughout your chosen tenure. No floating currency risks or surprise indexations.",
  },
  {
    title: "Tenure-Scaled Interest Rates",
    icon: TrendingDown,
    highlight: "Shorter = Cheaper",
    desc: "Annual interest rates scale directly with your tenure duration (Months ÷ 12).",
    details: "Choose a 3-month tenure and pay only 25% of the annual rate. A 6-month tenure pays only 50%. You are never penalized with flat annual charges on short tenures.",
  },
  {
    title: "2% Comprehensive All-Risk Insurance",
    icon: ShieldCheck,
    highlight: "Full Protection Included",
    desc: "Every Easy Flex installation includes 2% all-risk insurance coverage across the entire repayment tenure.",
    details: "Protects equipment against fire, lightning surges, accidental damage, burglary, and natural storm hazards. Full component replacement with zero out-of-pocket costs.",
  },
  {
    title: "1% Facility Processing & Management",
    icon: FileCheck,
    highlight: "One-Time Facility Fee",
    desc: "A nominal 1% administrative fee covering credit underwriting, legal stamping, and asset registry.",
    details: "Amortized transparently into your monthly installment schedule. There are zero account maintenance fees or hidden ledger charges.",
  },
  {
    title: "0% Early Prepayment Penalty",
    icon: BadgeCheck,
    highlight: "Total Flexibility",
    desc: "Pay off your outstanding balance at any time during your repayment period with zero liquidation penalties.",
    details: "When you liquidate early, all future unaccrued interest charges are immediately waived. You only pay for the financing duration you actually used.",
  },
];

// Interest Tier Reference Matrix
const interestTiersMatrix = [
  {
    bracket: "₦1,000,000 – ₦5,000,000",
    name: "Tier 1: Standard Residential",
    baseRate: 0.09,
    rates: { 3: 0.0225, 6: 0.045, 12: 0.09, 24: 0.18 },
    suitability: "Apartments, small homes, 3.5kVA–5kVA hybrid systems, and smart automation packages.",
  },
  {
    bracket: "₦5,000,000 – ₦7,500,000",
    name: "Tier 2: Mid-Range & Large Homes",
    baseRate: 0.15,
    rates: { 3: 0.0375, 6: 0.075, 12: 0.15, 24: 0.30 },
    suitability: "Duplexes, small commercial clinics, 7.5kVA–10kVA solar systems with high-capacity lithium banks.",
  },
  {
    bracket: "Above ₦7,500,000",
    name: "Tier 3: Commercial & Enterprise",
    baseRate: 0.25,
    rates: { 3: 0.0625, 6: 0.125, 12: 0.25, 24: 0.50 },
    suitability: "Offices, factories, hotels, schools, 15kVA–50kVA three-phase solar systems and mini-grids.",
  },
];

const faqs = [
  {
    q: "How does the Easy Flex lease-to-own model work?",
    a: "Easy Flex allows you to acquire Tier-1 solar and automation equipment with just 30% down payment. Our banking partner finances the remaining 70%, which you pay back in fixed monthly installments over 3, 6, 12, or 24 months. Once the final payment is made, full unencumbered legal ownership transfers to you.",
  },
  {
    q: "How is the bank interest calculated across different tenures?",
    a: "Interest is based on the financed balance and is prorated according to the length of your repayment period: 3 months pays 25% of annual interest, 6 months pays 50%, 12 months pays 100%, and 24 months pays 200%. Shorter tenures have significantly lower total interest costs.",
  },
  {
    q: "What does the 2% all-risk insurance fee cover?",
    a: "The 2% insurance fee provides complete coverage throughout your repayment tenure against fire, power/lightning surges, theft, vandalism, and storm damage. In the unlikely event of damage or loss, repairs or component replacements are carried out at zero extra cost to you.",
  },
  {
    q: "Can I pay off my remaining balance early without penalty?",
    a: "Yes! There are 0% early liquidation penalties. You can settle your outstanding loan balance at any point (e.g. Month 4 of a 12-month plan), and all future unaccrued bank interest is waived.",
  },
  {
    q: "What are the payment methods and when is my monthly installment due?",
    a: "Repayments are automated via Direct Debit mandate (Remita, NIBSS, or Paystack) or monthly bank transfer. Your debit date is typically aligned with your salary or business cashflow cycle (e.g., 25th or 30th of each month). We send automated SMS and email reminders 3 days before each due date, plus a 5-day grace period.",
  },
  {
    q: "Who is eligible to apply for Easy Flex?",
    a: "Nigerian salary earners (minimum 6 months at current job), registered business owners and SMEs (minimum 12 months in operation), self-employed professionals, and property owners. Applicants must be between 21 and 60 years old with a verifiable physical address, clean credit bureau record, and a monthly repayment that does not exceed 33% to 40% of net monthly income.",
  },
  {
    q: "How long does approval and installation take?",
    a: "Digital credit review and pre-approval are completed within 24 hours of receiving your application and documents. Once the 30% down payment is received, our certified engineering team carries out the on-site survey and completes turnkey installation within 2 to 5 business days.",
  },
  {
    q: "What warranties are included with my system?",
    a: "All Easy Flex systems come with Tier-1 manufacturer warranties: 25 years on solar panels, 5 to 10 years on lithium LiFePO4 batteries (6,000+ deep cycles), 2 to 5 years on pure sine wave inverters, and a 2-year Tioga COREN-certified workmanship and installation guarantee.",
  },
  {
    q: "What happens if I relocate before my repayment period ends?",
    a: "If you relocate within our service coverage areas, our certified engineering team can professionally decommission, safely transport, and reinstall your solar system at your new premises for a standardized relocation fee.",
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
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
        >
          <Calculator size={16} />
          {hasItem ? "View Monthly Breakdown" : "Calculate Repayment"}
        </a>
        <a
          href="#financial-terms"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
        >
          <Info size={16} />
          Full Terms &amp; Eligibility
        </a>
      </PageHero>

      {/* QUICK JUMP SUB-NAVIGATION BAR */}
      <nav aria-label="Finance Page Sections" className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="section-container flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5 no-scrollbar text-xs sm:text-sm font-medium">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 hidden md:inline">
            Quick Jump:
          </span>
          <a
            href={hasItem ? "#item-breakdown" : "#calculator"}
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            {hasItem ? "Item Breakdown" : "Calculator"}
          </a>
          <a
            href="#financial-terms"
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            Financial Terms &amp; Rates
          </a>
          <a
            href="#eligibility"
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            Eligibility Criteria
          </a>
          <a
            href="#requirements"
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            Required Documents
          </a>
          <a
            href="#process"
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            Approval Roadmap
          </a>
          <a
            href="#faq"
            className="px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-foreground"
          >
            FAQ &amp; Warranties
          </a>
        </div>
      </nav>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CASE A: NAVIGATED FROM EASY FLEX / ITEM SPECIFIED              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {hasItem && (
        <section id="item-breakdown" className="section-padding bg-muted/20 border-b border-border scroll-mt-28">
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
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
                title="Return to general finance calculator"
              >
                <RotateCcw size={12} />
                Switch to general calculator
              </button>
            </div>

            {/* Split Showcase: Left = Product Card, Right = Monthly Price Breakdown */}
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
              {/* LEFT: Product Card */}
              <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] space-y-5 lg:sticky lg:top-28">
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
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
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

                {/* Contextual Affordability Indicator */}
                <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-start gap-3 text-xs">
                  <Info size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground block">
                      Recommended Net Monthly Income: ~{formatNGN(activePlan.monthly_payment * 3)}/mo
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      To meet bank credit committee guidelines, your monthly installment of {formatNGN(activePlan.monthly_payment)} should not exceed 33% to 40% of your verifiable monthly take-home salary or net business cashflow.
                    </p>
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
        <section id="calculator" className="section-padding bg-muted/30 border-b border-border scroll-mt-28">
          <div className="section-container">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
                <Calculator size={22} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Easy Flex Repayment Calculator</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Enter any solar or automation project cost to view your 30% deposit, interest tier, and monthly installment across all 4 plan lengths.
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
                  <Row label="Financed Principal (70%)" value={formatNGN(primary.financed)} />
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
                  const popular = i === plans.length - 1; // 24-month tenure = lowest monthly
                  return (
                    <div
                      key={p.tenure_months}
                      className={`rounded-3xl border p-4 sm:p-5 bg-card relative flex flex-col justify-between ${
                        popular ? "border-primary shadow-[var(--shadow-elevated)] ring-2 ring-primary/20" : "border-border"
                      }`}
                    >
                      {popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-sm">
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
      {/* SECTION 1: COMPLETE FINANCIAL TERMS & TRANSPARENT FEE STRUCTURE*/}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="financial-terms" className="section-padding bg-background border-b border-border scroll-mt-28">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck size={14} /> Full Financial Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Complete Financial Terms &amp; Fee Structure
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Everything you need to know about your Easy Flex lease-to-own plan: zero hidden fees, escrow deposit security, comprehensive insurance, and full ownership transfer.
            </p>
          </div>

          {/* 6 Core Financial Pillars Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {financialDisclosures.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <item.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      {item.highlight}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm font-medium text-foreground mb-2">{item.desc}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.details}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interest Rate Tier Matrix Table */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                  Annualized Bank Interest Rate Matrix
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Rates are set by our bank partner according to project capital cost and prorated by your exact repayment duration.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 text-primary shrink-0 self-start md:self-center">
                Formula: Annual Tier Rate × (Tenure Months ÷ 12)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Capital Bracket</th>
                    <th className="py-3 px-4 font-semibold">Tier Category</th>
                    <th className="py-3 px-4 font-semibold">Base Annual</th>
                    <th className="py-3 px-4 font-semibold">3-Mo Rate</th>
                    <th className="py-3 px-4 font-semibold">6-Mo Rate</th>
                    <th className="py-3 px-4 font-semibold">12-Mo Rate</th>
                    <th className="py-3 px-4 font-semibold">24-Mo Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs sm:text-sm">
                  {interestTiersMatrix.map((tier) => {
                    const isActive =
                      (tier.baseRate === 0.09 && amount < 5000000) ||
                      (tier.baseRate === 0.15 && amount >= 5000000 && amount <= 7500000) ||
                      (tier.baseRate === 0.25 && amount > 7500000);

                    return (
                      <tr
                        key={tier.bracket}
                        className={`transition-colors ${
                          isActive ? "bg-primary/5 font-semibold text-primary" : "text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <td className="py-4 px-4 font-display font-bold">
                          <div className="flex items-center gap-2">
                            <span>{tier.bracket}</span>
                            {isActive && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Active Bracket
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-normal text-muted-foreground block mt-0.5">
                            {tier.suitability}
                          </span>
                        </td>
                        <td className="py-4 px-4">{tier.name}</td>
                        <td className="py-4 px-4">{(tier.baseRate * 100).toFixed(0)}% p.a.</td>
                        <td className="py-4 px-4">{(tier.rates[3] * 100).toFixed(2)}%</td>
                        <td className="py-4 px-4">{(tier.rates[6] * 100).toFixed(2)}%</td>
                        <td className="py-4 px-4">{(tier.rates[12] * 100).toFixed(2)}%</td>
                        <td className="py-4 px-4">{(tier.rates[24] * 100).toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-border grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>2% Insurance Protection:</strong> Adds comprehensive equipment damage, storm, lightning surge, and theft replacement.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>1% Facility Administration:</strong> One-off documentation and underwriting fee spread across tenure.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>0% Prepayment Penalty:</strong> Pay off the principal at any time with all future unaccrued interest eliminated.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2: FULL ELIGIBILITY & QUALIFICATION CRITERIA          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="eligibility" className="section-padding bg-muted/30 border-b border-border scroll-mt-28">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <UserCheck size={14} /> Qualification Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Full Eligibility &amp; Underwriting Criteria
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Easy Flex is structured to empower Nigerian households, professionals, and registered businesses with accessible clean energy financing. Review the 4 eligibility pillars below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {eligibilityPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-[var(--shadow-card)] space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <pillar.icon size={22} />
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                    {pillar.title}
                  </h3>
                </div>
                <ul className="space-y-3 pt-2 border-t border-border">
                  {pillar.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                      <Check className="text-primary mt-0.5 shrink-0" size={16} />
                      <span className="leading-relaxed">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Affordability Calculator Guide Box */}
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h4 className="text-lg sm:text-xl font-display font-bold text-foreground">
                How does the bank assess your income affordability?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Under CBN regulatory lending best practices, monthly debt service should not exceed 33%–40% of your verifiable net monthly income. For example, a ₦150,000 monthly solar repayment comfortably matches an applicant with a net income of ₦450,000 or higher.
              </p>
            </div>
            <Link
              to={hasItem ? applyUrlForMonths(selectedMonths) : "/finance/apply"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:brightness-110 shrink-0 shadow-md transition-all"
            >
              Check My Pre-Approval <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 3: APPLICATION REQUIREMENTS & DOCUMENT CHECKLIST     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="requirements" className="section-padding bg-background border-b border-border scroll-mt-28">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <FileSpreadsheet size={14} /> Documentation Checklist
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Application Documents by Category
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Select your track below to view the exact documents required for rapid 24-hour credit committee approval.
            </p>
          </div>

          {/* Track Selector Buttons */}
          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {requirementTracks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrack(t.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTrack === t.id
                    ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Active Track Detailed Card */}
          {(() => {
            const currentTrack = requirementTracks.find((t) => t.id === activeTrack) || requirementTracks[0];
            return (
              <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-[var(--shadow-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary block mb-1">
                      {currentTrack.tag}
                    </span>
                    <h3 className="text-2xl font-display font-bold text-foreground">
                      {currentTrack.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {currentTrack.desc}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider self-start sm:self-center shrink-0">
                    {currentTrack.badge}
                  </span>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    Required Checklist for Submission
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                    {currentTrack.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 text-xs sm:text-sm text-foreground"
                      >
                        <Check className="text-primary mt-0.5 shrink-0" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground">
                    <span>Questions on document formats or guarantor requirements?</span>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                  >
                    <MessageCircle size={14} className="text-emerald-500" />
                    Speak with an Underwriting Officer on WhatsApp
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 4: 6-STAGE APPROVAL & INSTALLATION ROADMAP            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="process" className="section-padding bg-muted/30 border-b border-border scroll-mt-28">
        <div className="section-container max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <Clock size={14} /> Turnaround Timelines
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              6-Stage Approval &amp; Installation Roadmap
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              From online application to flipping the switch: clear milestones, transparent underwriting, and guaranteed turnaround times.
            </p>
          </div>

          <ol className="relative border-l border-border ml-4 sm:ml-6 space-y-8">
            {approvalRoadmap.map((s) => (
              <li key={s.n} className="pl-8 sm:pl-10 relative">
                <span className="absolute -left-[19px] sm:-left-[21px] top-0 w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center shadow-xs">
                  <s.icon className="text-primary" size={18} />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">
                    {s.title}
                  </h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full w-fit">
                    {s.timeframe}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 5: TRUST, WARRANTIES & ASSET PROTECTION               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="section-padding bg-background border-b border-border">
        <div className="section-container">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-[var(--shadow-card)]">
            <img src={imgInstaller} alt="Certified Tioga installer on rooftop" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-midnight/90" />
            <div className="relative p-8 sm:p-14 max-w-3xl text-primary-foreground space-y-4">
              <ShieldCheck className="text-gold" size={40} />
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
                Your investment is 100% protected from Day One
              </h2>
              <p className="opacity-90 leading-relaxed text-sm sm:text-base">
                Every Easy Flex plan includes 2% all-risk equipment insurance, 25-year solar panel performance warranty, 5–10 year lithium battery replacement warranty, and COREN-supervised engineering installation. Your system is fully covered for the entire lease-to-own tenure and decades beyond.
              </p>
              <div className="pt-4 grid sm:grid-cols-3 gap-3 border-t border-white/10 text-xs">
                <div>
                  <span className="font-bold block text-white">25-Year Panel Output</span>
                  <span className="opacity-80">Tier-1 monocrystalline panels</span>
                </div>
                <div>
                  <span className="font-bold block text-white">5–10 Year Battery</span>
                  <span className="opacity-80">6,000+ deep LiFePO4 cycles</span>
                </div>
                <div>
                  <span className="font-bold block text-white">Full Title Deed</span>
                  <span className="opacity-80">Transferred upon final payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 6: FREQUENTLY ASKED QUESTIONS                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-padding bg-muted/30 scroll-mt-28">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle size={14} /> Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Easy Flex Financing FAQ
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Clear answers to the most common questions about payments, interest rates, early liquidation, and title transfer.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-[var(--shadow-card)] transition-all">
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

          <div className="mt-10 p-6 rounded-3xl border border-border bg-card text-center space-y-3">
            <h3 className="font-display font-bold text-lg">Still have questions about financing?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Our finance specialists are available to walk you through documentation, pre-approval checks, and custom package quotes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-sm"
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
