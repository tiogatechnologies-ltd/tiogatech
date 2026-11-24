import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { attributionForLead, getAttribution } from "@/lib/attribution";
import { trackConversion } from "@/lib/tracking";
import { isValidNigerianPhone } from "@/lib/customerWhatsapp";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { footerLinks } from "@/lib/footerLinks";
import AddressInput from "@/components/lead-form/AddressInput";
import { budgetOptions } from "@/components/lead-form/types";
import { selectBtnClass, toggleList } from "@/components/lead-form/StepUI";
import {
  buildAdsLeadPayload,
  PROPERTY_OPTIONS,
  SERVICE_OPTIONS,
  type AdsLeadFormInput,
  type AdsServiceId,
  type ContactChannel,
} from "@/lib/adsLandingLogic";

const DRAFT_KEY = "tioga_ads_lp_draft_v1";
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

// Reused option sets from SolarFlow, SecurityFlow & AutomationFlow
const SOLAR_DURATIONS = ["3 to 5 hours", "6 to 10 hours", "10 to 24 hours"];
const SOLAR_SYSTEM_TYPES = [
  "Full Off-Grid (no reliance on NEPA)",
  "Backup System (only when light goes off)",
  "Not sure (recommend for me)",
];
const SECURITY_ACCESS_TYPES = ["Fingerprint", "Face recognition", "Passcode", "App control"];
const CCTV_COVERAGE_OPTIONS = ["Indoor", "Outdoor", "Full property"];
const AUTOMATE_WHAT_OPTIONS = ["Lights", "Switches", "Entire home", "Specific rooms"];
const AUTOMATION_CONTROLS = ["Mobile app", "Voice control", "Both"];
const AUTOMATION_SCALES = ["Single room", "Multiple rooms", "Full house"];
const CONTACT_CHANNELS: ContactChannel[] = ["WhatsApp", "Call", "Email"];

export interface AdsLeadExternalPrefill {
  version: number;
  services?: AdsServiceId[];
  propertyType?: string;
  location?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  preferredContact?: ContactChannel;
  appliances?: string[];
  estimatedWatts?: number;
  matchedSummary?: string[];
}

interface AdsLeadCaptureFormProps {
  formRef: React.RefObject<HTMLElement>;
  campaignSlug: string;
  pathname: string;
  defaultServices: AdsServiceId[];
  externalPrefill: AdsLeadExternalPrefill | null;
}

const DEFAULT_FORM: AdsLeadFormInput = {
  services: ["audit"],
  propertyType: "Flat",
  location: "",
  budget: "",
  systemType: "",
  usageDuration: "",
  appliances: [],
  estimatedWatts: 0,
  accessTypes: [],
  cctvCoverage: [],
  automateWhat: [],
  controlPreference: "",
  automationScale: "",
  fullName: "",
  phone: "",
  email: "",
  preferredContact: "WhatsApp",
  consent: false,
  extraNotes: "",
  matchedSummary: [],
};

function loadDraft(fallbackServices: AdsServiceId[]): { step: number; data: AdsLeadFormInput } {
  if (typeof window === "undefined") {
    return { step: 0, data: { ...DEFAULT_FORM, services: fallbackServices } };
  }
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { step: 0, data: { ...DEFAULT_FORM, services: fallbackServices } };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { step: 0, data: { ...DEFAULT_FORM, services: fallbackServices } };
    }
    const merged: AdsLeadFormInput = {
      ...DEFAULT_FORM,
      ...(parsed.data || {}),
      services:
        Array.isArray(parsed.data?.services) && parsed.data.services.length > 0
          ? parsed.data.services
          : fallbackServices,
    };
    const step = typeof parsed.step === "number" ? Math.min(2, Math.max(0, parsed.step)) : 0;
    return { step, data: merged };
  } catch {
    return { step: 0, data: { ...DEFAULT_FORM, services: fallbackServices } };
  }
}

const CONFETTI_PIECES = [
  { x: -90, y: -65, r: 25, bg: "bg-gold" },
  { x: -45, y: -95, r: -40, bg: "bg-emerald-400" },
  { x: 0, y: -110, r: 15, bg: "bg-sky-400" },
  { x: 48, y: -90, r: 50, bg: "bg-gold" },
  { x: 95, y: -60, r: -30, bg: "bg-violet-400" },
  { x: -70, y: -30, r: 70, bg: "bg-emerald-500" },
  { x: 75, y: -25, r: -55, bg: "bg-amber-400" },
  { x: 18, y: -75, r: 35, bg: "bg-primary" },
];

/**
 * Section 11 — `#get-quote` 3-Step Lead Capture Form.
 * Reuses Tioga's exact `leads` table schema, `AddressInput`, Nigerian phone validation,
 * UTM attribution, `notify-new-lead`, GA4 `generate_lead`, and localStorage draft resume.
 */
export const AdsLeadCaptureForm = ({
  formRef,
  campaignSlug,
  pathname,
  defaultServices,
  externalPrefill,
}: AdsLeadCaptureFormProps) => {
  const reducedMotion = useReducedMotion();
  const { contact } = useSiteContact();

  const initial = useRef(loadDraft(defaultServices));
  const [step, setStep] = useState<number>(initial.current.step);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [form, setForm] = useState<AdsLeadFormInput>(initial.current.data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [submittedState, setSubmittedState] = useState<{
    firstName: string;
    services: AdsServiceId[];
    whatsappUrl: string;
  } | null>(null);

  const privacyRoute =
    footerLinks.support.find((l) => l.to === "/privacy")?.to ?? "/privacy";
  const termsRoute =
    footerLinks.support.find((l) => l.to === "/terms")?.to ?? "/terms";
  const trackRoute =
    footerLinks.support.find((l) => l.to === "/track")?.to ?? "/track";

  // Persist draft to localStorage so returning visitors resume cleanly
  useEffect(() => {
    if (submittedState) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, data: form }));
    } catch {
      // ignore quota errors
    }
  }, [step, form, submittedState]);

  // Apply external pre-fills (gate modal capture, CTA clicks, solution cards, or configurator transfer)
  useEffect(() => {
    if (!externalPrefill) return;
    setSubmittedState(null);
    setForm((prev) => ({
      ...prev,
      services:
        externalPrefill.services && externalPrefill.services.length > 0
          ? Array.from(new Set([...externalPrefill.services]))
          : prev.services,
      propertyType: externalPrefill.propertyType || prev.propertyType,
      location: externalPrefill.location || prev.location,
      fullName: externalPrefill.fullName || prev.fullName,
      phone: externalPrefill.phone || prev.phone,
      email: externalPrefill.email ?? prev.email,
      preferredContact: externalPrefill.preferredContact || prev.preferredContact,
      appliances: externalPrefill.appliances ?? prev.appliances,
      estimatedWatts: externalPrefill.estimatedWatts ?? prev.estimatedWatts,
      matchedSummary: externalPrefill.matchedSummary ?? prev.matchedSummary,
    }));
    // If coming from configurator with matches, jump straight to Step 2 for faster completion
    if (externalPrefill.matchedSummary && externalPrefill.matchedSummary.length > 0) {
      setStep(1);
    } else if (!externalPrefill.fullName) {
      setStep(0);
    }
  }, [externalPrefill]);

  const update = (patch: Partial<AdsLeadFormInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSubmitError(null);
  };

  const toggleService = (id: AdsServiceId) => {
    setErrors((e) => ({ ...e, services: "" }));
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));
  };

  const wantsSolar = form.services.includes("solar") || form.services.includes("audit");
  const wantsLocks = form.services.includes("smart_locks");
  const wantsCctv = form.services.includes("cctv");
  const wantsAutomation = form.services.includes("automation");

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0) {
      if (form.services.length === 0) {
        nextErrors.services = "Please select at least one service so we can prepare the right quote.";
      }
    }
    if (targetStep === 1) {
      if (!form.location.trim() || form.location.trim().length < 2) {
        nextErrors.location = "Please enter your city or installation area (e.g. Abuja, Lagos, Jos).";
      }
      if (!form.budget) {
        nextErrors.budget = "Please select an approximate budget range.";
      }
    }
    if (targetStep === 2) {
      if (!form.fullName.trim() || form.fullName.trim().length < 2) {
        nextErrors.fullName = "Please enter your full name.";
      }
      if (!isValidNigerianPhone(form.phone)) {
        nextErrors.phone = "Enter a valid Nigerian phone number (e.g. 0803 123 4567 or +234 803 123 4567).";
      }
      if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
        nextErrors.email = "Please enter a valid email address or leave it blank.";
      }
      if (!form.consent) {
        nextErrors.consent = "Please accept our Privacy Policy and Terms so our engineers can contact you.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => Math.min(2, s + 1));
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return; // Block double submit synchronously
    if (!validateStep(2)) return;

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const fullAttr = { ...getAttribution(), ...attributionForLead() };
      const payload = buildAdsLeadPayload(form, {
        pathname,
        campaign: campaignSlug,
        attribution: fullAttr,
      });

      const { error } = await supabase.from("leads").insert(payload as never);
      if (error) throw error;

      // Fire-and-forget internal sales notification
      supabase.functions.invoke("notify-new-lead", { body: payload }).catch(console.error);

      // First-party conversion tracking
      trackConversion("lead_submitted", {
        source: "ads_landing",
        campaign: campaignSlug,
        services: form.services,
        products: payload.products,
        budget: form.budget,
      });

      // GA4 generate_lead event (gtag is already loaded in index.html)
      type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };
      const gtagFn = typeof window !== "undefined" ? (window as GtagWindow).gtag : undefined;
      if (typeof gtagFn === "function") {
        gtagFn("event", "generate_lead", {
          event_category: "ads_landing",
          event_label: campaignSlug,
          services: form.services.join(","),
          currency: "NGN",
        });
      }

      // Meta Pixel conversion hook (uncomment once Meta Pixel script + ID are configured):
      // if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      //   (window as any).fbq("track", "Lead", { content_name: campaignSlug, content_category: form.services.join(",") });
      // }

      const firstName = form.fullName.trim().split(/\s+/)[0] || "there";
      const serviceLabels = form.services
        .map((id) => SERVICE_OPTIONS.find((o) => o.id === id)?.label || id)
        .join(", ");
      const waMsg = [
        `Hi Tioga Technologies! I just requested a quote on your website.`,
        `• Name: ${form.fullName.trim()}`,
        `• Services: ${serviceLabels}`,
        form.propertyType ? `• Property: ${form.propertyType}` : "",
        form.location ? `• Location: ${form.location.trim()}` : "",
        form.matchedSummary.length > 0 ? `• Matched items: ${form.matchedSummary.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }

      setSubmittedState({
        firstName,
        services: [...form.services],
        whatsappUrl: whatsappLink(contact, waMsg),
      });
    } catch (err) {
      console.error("Ads landing lead submit failed:", err);
      setSubmitError(
        "We couldn't reach our server right now — your details are safely kept below. Please check your connection and tap Submit again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const progressPct = ((step + 1) / 3) * 100;

  return (
    <section
      id="get-quote"
      ref={formRef}
      aria-labelledby="lead-form-heading"
      className="section-padding py-14 sm:py-20 bg-background border-b border-border/60 scroll-mt-20"
    >
      <div className="section-container max-w-3xl">
        <div className="text-center mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary mb-2">
            Free Energy Audit &amp; Personalised Quote
          </p>
          <h2
            id="lead-form-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight"
          >
            Get your tailored quote in 24 hours
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Three short steps. No spam — a certified Tioga engineer reviews your exact requirements and sends a clear breakdown.
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/95 backdrop-blur-md p-5 sm:p-8 shadow-xl">
          {submittedState ? (
            /* Success State with lightweight CSS/framer confetti burst */
            <div className="relative py-6 text-center space-y-5" role="status" aria-live="polite">
              {!reducedMotion && (
                <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10">
                  {CONFETTI_PIECES.map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                      animate={{ x: c.x, y: c.y, opacity: 0, scale: 1.1, rotate: c.r }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className={`absolute h-2.5 w-2.5 rounded-sm ${c.bg}`}
                    />
                  ))}
                </div>
              )}

              <div className="mx-auto h-14 w-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 grid place-items-center">
                <CheckCircle2 size={28} />
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-foreground">
                  Thanks {submittedState.firstName}! Our team will contact you within 24 hours.
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  We&apos;ve logged your request for our engineering desk. Need an instant answer right now? Message us directly on WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                <a
                  href={submittedState.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Chat on WhatsApp now</span>
                </a>

                {submittedState.services.includes("retail") && (
                  <Link
                    to={trackRoute}
                    className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-border bg-background hover:bg-muted text-foreground font-semibold text-sm transition-colors"
                  >
                    <PackageSearch size={16} className="text-primary" />
                    <span>Track Your Order</span>
                  </Link>
                )}
              </div>

              {/* Relevant Footer Explore Links for the services they chose */}
              <div className="pt-5 border-t border-border/70">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Explore while you wait
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from(
                    new Map(
                      submittedState.services
                        .map((id) => SERVICE_OPTIONS.find((o) => o.id === id))
                        .filter((o): o is NonNullable<typeof o> => Boolean(o))
                        .map((o) => [o.footerRoute, o]),
                    ).values(),
                  ).map((opt) => (
                    <Link
                      key={opt.footerRoute}
                      to={opt.footerRoute}
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border bg-muted/40 hover:border-primary hover:text-primary text-xs font-semibold text-foreground transition-colors"
                    >
                      <span>{opt.label}</span>
                      <ArrowRight size={12} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Step Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-primary">Step {step + 1} of 3</span>
                  <span className="text-muted-foreground">
                    {step === 0
                      ? "Choose services"
                      : step === 1
                        ? "Property & requirements"
                        : "Contact details"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-sm bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Animated Step Panels */}
              <AnimatePresence mode="wait" initial={false}>
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    initial={reducedMotion ? false : { opacity: 0, x: direction * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, x: direction * -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                        What do you need?
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Select all services you&apos;d like included in your free quote.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {SERVICE_OPTIONS.map((opt) => {
                        const selected = form.services.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleService(opt.id)}
                            className={`min-h-[56px] p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              selected
                                ? "border-primary bg-primary/[0.08] dark:bg-primary/15"
                                : "border-border bg-background hover:bg-muted/50"
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="block text-sm font-bold text-foreground leading-tight">
                                {opt.label}
                              </span>
                              <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                {opt.shortDesc}
                              </span>
                            </div>
                            <span
                              className={`h-5 w-5 rounded-sm border shrink-0 grid place-items-center ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card"
                              }`}
                            >
                              {selected && <Check size={12} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {errors.services && (
                      <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{errors.services}</span>
                      </p>
                    )}
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={reducedMotion ? false : { opacity: 0, x: direction * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, x: direction * -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                        Tell us a bit more
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Asked once across all your selected services.
                      </p>
                    </div>

                    {/* Editable Configurator Summary (if transferred from Section 4) */}
                    {(form.matchedSummary.length > 0 || form.estimatedWatts > 0) && (
                      <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                            Selected from Configurator
                          </span>
                          {form.estimatedWatts > 0 && (
                            <span className="text-xs font-bold text-foreground tabular-nums">
                              ~{form.estimatedWatts.toLocaleString()}W load
                            </span>
                          )}
                        </div>
                        {form.matchedSummary.length > 0 && (
                          <ul className="space-y-1">
                            {form.matchedSummary.map((item) => (
                              <li
                                key={item}
                                className="flex items-center justify-between gap-2 text-xs font-semibold text-foreground"
                              >
                                <span className="truncate">• {item}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${item}`}
                                  onClick={() =>
                                    update({
                                      matchedSummary: form.matchedSummary.filter((m) => m !== item),
                                    })
                                  }
                                  className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                                >
                                  <X size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Property Type (asked once) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Property Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {PROPERTY_OPTIONS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => update({ propertyType: p.label })}
                            className={`min-h-[42px] px-2.5 py-2 rounded-md border text-xs font-bold transition-colors ${
                              form.propertyType === p.label
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:bg-muted"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location (reusing existing AddressInput) */}
                    <div>
                      <label htmlFor="ads-lp-location" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Installation Location / City *
                      </label>
                      <AddressInput
                        value={form.location}
                        onChange={(location) => {
                          update({ location });
                          setErrors((e) => ({ ...e, location: "" }));
                        }}
                      />
                      {errors.location && (
                        <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1.5 flex items-center gap-1">
                          <AlertCircle size={13} />
                          <span>{errors.location}</span>
                        </p>
                      )}
                    </div>

                    {/* Budget Range (asked once, reusing budgetOptions) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Approximate Budget Range *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {budgetOptions.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              update({ budget: b });
                              setErrors((e) => ({ ...e, budget: "" }));
                            }}
                            className={selectBtnClass(form.budget === b)}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                      {errors.budget && (
                        <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1.5 flex items-center gap-1">
                          <AlertCircle size={13} />
                          <span>{errors.budget}</span>
                        </p>
                      )}
                    </div>

                    {/* Conditional: SolarFlow questions */}
                    {wantsSolar && (
                      <div className="pt-4 border-t border-border/70 space-y-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Solar &amp; Power Preferences
                        </p>
                        <div>
                          <span className="block text-xs font-semibold text-foreground mb-2">
                            Preferred system type
                          </span>
                          <div className="space-y-1.5">
                            {SOLAR_SYSTEM_TYPES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => update({ systemType: s })}
                                className={`w-full ${selectBtnClass(form.systemType === s)}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-foreground mb-2">
                            Daily backup hours needed
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {SOLAR_DURATIONS.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => update({ usageDuration: d })}
                                className={selectBtnClass(form.usageDuration === d)}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional: SecurityFlow (Smart Locks) */}
                    {wantsLocks && (
                      <div className="pt-4 border-t border-border/70 space-y-2.5">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          Smart Lock Access Types
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {SECURITY_ACCESS_TYPES.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => update({ accessTypes: toggleList(form.accessTypes, a) })}
                              className={selectBtnClass(form.accessTypes.includes(a))}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conditional: SecurityFlow (CCTV) */}
                    {wantsCctv && (
                      <div className="pt-4 border-t border-border/70 space-y-2.5">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          CCTV Coverage Needed
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {CCTV_COVERAGE_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => update({ cctvCoverage: toggleList(form.cctvCoverage, c) })}
                              className={selectBtnClass(form.cctvCoverage.includes(c))}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conditional: AutomationFlow */}
                    {wantsAutomation && (
                      <div className="pt-4 border-t border-border/70 space-y-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          Home Automation Scope
                        </p>
                        <div>
                          <span className="block text-xs font-semibold text-foreground mb-2">
                            What do you want to automate?
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {AUTOMATE_WHAT_OPTIONS.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => update({ automateWhat: toggleList(form.automateWhat, a) })}
                                className={selectBtnClass(form.automateWhat.includes(a))}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="block text-xs font-semibold text-foreground mb-2">
                              Control preference
                            </span>
                            <div className="space-y-1.5">
                              {AUTOMATION_CONTROLS.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => update({ controlPreference: c })}
                                  className={`w-full ${selectBtnClass(form.controlPreference === c)}`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-foreground mb-2">
                              Scale
                            </span>
                            <div className="space-y-1.5">
                              {AUTOMATION_SCALES.map((sc) => (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => update({ automationScale: sc })}
                                  className={`w-full ${selectBtnClass(form.automationScale === sc)}`}
                                >
                                  {sc}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={reducedMotion ? false : { opacity: 0, x: direction * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, x: direction * -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                        Where do we send your quote?
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        A Tioga engineer will respond within 24 hours via your preferred channel.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="ads-lp-fullname" className="block text-xs font-bold text-foreground mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="ads-lp-fullname"
                          type="text"
                          autoComplete="name"
                          required
                          value={form.fullName}
                          onChange={(e) => {
                            update({ fullName: e.target.value });
                            setErrors((er) => ({ ...er, fullName: "" }));
                          }}
                          placeholder="e.g. Chidi Okafor"
                          className="w-full h-11 rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.fullName && (
                          <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="ads-lp-phone" className="block text-xs font-bold text-foreground mb-1.5">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          id="ads-lp-phone"
                          type="tel"
                          autoComplete="tel"
                          required
                          value={form.phone}
                          onChange={(e) => {
                            update({ phone: e.target.value });
                            setErrors((er) => ({ ...er, phone: "" }));
                          }}
                          placeholder="e.g. 0803 123 4567"
                          className="w-full h-11 rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.phone && (
                          <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="ads-lp-email" className="block text-xs font-bold text-foreground mb-1.5">
                          Email Address <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <input
                          id="ads-lp-email"
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(e) => {
                            update({ email: e.target.value });
                            setErrors((er) => ({ ...er, email: "" }));
                          }}
                          placeholder="you@example.com"
                          className="w-full h-11 rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {errors.email && (
                          <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-foreground mb-1.5">
                          Preferred Contact Method
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {CONTACT_CHANNELS.map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              aria-pressed={form.preferredContact === ch}
                              onClick={() => update({ preferredContact: ch })}
                              className={`h-11 rounded-md border text-xs font-bold transition-colors ${
                                form.preferredContact === ch
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-background text-foreground hover:bg-muted"
                              }`}
                            >
                              {ch}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="ads-lp-notes" className="block text-xs font-bold text-foreground mb-1.5">
                        Anything else our engineer should know?{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <textarea
                        id="ads-lp-notes"
                        rows={2}
                        value={form.extraNotes}
                        onChange={(e) => update({ extraNotes: e.target.value })}
                        placeholder="e.g. Number of doors, current generator size, or target install week"
                        className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Required Consent Checkbox linking to /privacy and /terms */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-relaxed">
                        <input
                          type="checkbox"
                          checked={form.consent}
                          onChange={(e) => {
                            update({ consent: e.target.checked });
                            setErrors((er) => ({ ...er, consent: "" }));
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                        />
                        <span>
                          I agree to Tioga Technologies contacting me about my quote and accept the{" "}
                          <Link to={privacyRoute} className="text-primary font-semibold hover:underline">
                            Privacy Policy
                          </Link>{" "}
                          and{" "}
                          <Link to={termsRoute} className="text-primary font-semibold hover:underline">
                            Terms of Service
                          </Link>
                          . *
                        </span>
                      </label>
                      {errors.consent && (
                        <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1.5 flex items-center gap-1">
                          <AlertCircle size={13} />
                          <span>{errors.consent}</span>
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
                      >
                        <RefreshCw size={15} className="shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step Navigation Footer */}
              <div className="mt-6 pt-5 border-t border-border/70 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="min-h-[46px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-border bg-background hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Takes under 90 seconds
                  </span>
                )}

                {step < 2 ? (
                  <motion.button
                    type="button"
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    onClick={handleNext}
                    className="min-h-[46px] inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:brightness-105 transition-all"
                  >
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:brightness-105 disabled:opacity-60 transition-all shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending request…</span>
                      </>
                    ) : (
                      <>
                        <span>Get My Free Quote</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdsLeadCaptureForm;
