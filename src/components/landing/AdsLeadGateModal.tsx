import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Loader2,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { attributionForLead, getAttribution } from "@/lib/attribution";
import { trackConversion } from "@/lib/tracking";
import { isValidNigerianPhone } from "@/lib/customerWhatsapp";
import { footerLinks } from "@/lib/footerLinks";
import tiogaLogoDark from "@/assets/tioga-logo-dark.png";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import {
  buildAdsLeadPayload,
  type AdsServiceId,
  type ContactChannel,
} from "@/lib/adsLandingLogic";
import { toast } from "sonner";

export const ADS_GATE_STORAGE_KEY = "tioga_ads_lp_unlocked_session_v2";
const LEGACY_ADS_GATE_STORAGE_KEY = "tioga_ads_lp_unlocked_v1";
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const WHATSAPP_NUMBER = "2348178000023";
const WHATSAPP_DISPLAY = "+234 8178 000 023";

const QUICK_SERVICES: Array<{ id: AdsServiceId; label: string }> = [
  { id: "solar", label: "Solar & Power" },
  { id: "smart_locks", label: "Smart Locks" },
  { id: "cctv", label: "CCTV Security" },
  { id: "automation", label: "Smart Home / Shop" },
];

export interface UnlockedVisitorProfile {
  unlocked: true;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  propertyType: string;
  services: AdsServiceId[];
  preferredContact: ContactChannel;
  submittedAt: string;
}

export function getUnlockedVisitorProfile(): UnlockedVisitorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    // Clean up legacy permanent localStorage unlock key so returning visitors see the lead popup on new visits
    localStorage.removeItem(LEGACY_ADS_GATE_STORAGE_KEY);
    const params = new URLSearchParams(window.location.search);
    if (params.get("gate") === "1" || params.get("reset") === "1") {
      sessionStorage.removeItem(ADS_GATE_STORAGE_KEY);
      return null;
    }
    const raw = sessionStorage.getItem(ADS_GATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UnlockedVisitorProfile>;
    if (parsed && parsed.unlocked === true && typeof parsed.fullName === "string" && parsed.fullName.trim()) {
      return parsed as UnlockedVisitorProfile;
    }
    return null;
  } catch {
    return null;
  }
}

interface AdsLeadGateModalProps {
  open: boolean;
  campaignSlug: string;
  campaignHeadline: string;
  pathname: string;
  defaultServices: AdsServiceId[];
  onUnlocked: (profile: UnlockedVisitorProfile) => void;
  onDismiss?: () => void;
}

/**
 * Streamlined 10-Second Mobile-First Lead Popup for `/get-started` and `/lp/:campaign`.
 * - Portaled directly into `document.body` so RouteFade CSS transforms never displace it.
 * - Fits cleanly above the fold on mobile phones and laptops with only 3 fast fields
 *   (Name, WhatsApp/Phone, City/State) + 1-tap service chips + instant WhatsApp option.
 * - Tracks `lead_form_started`, `whatsapp_click`, and `lead_submitted` for full funnel visibility.
 */
export const AdsLeadGateModal = ({
  open,
  campaignSlug,
  pathname,
  defaultServices,
  onUnlocked,
  onDismiss,
}: AdsLeadGateModalProps) => {
  const reducedMotion = useReducedMotion();
  const initialService: AdsServiceId[] = (() => {
    const validQuick = defaultServices.filter((s) =>
      QUICK_SERVICES.some((q) => q.id === s),
    );
    return validQuick.length > 0 ? validQuick : ["solar"];
  })();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [services, setServices] = useState<AdsServiceId[]>(initialService);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const startedTrackedRef = useRef(false);

  const privacyRoute =
    footerLinks.support.find((l) => l.to === "/privacy")?.to ?? "/privacy";
  const termsRoute =
    footerLinks.support.find((l) => l.to === "/terms")?.to ?? "/terms";

  // Lock background page scroll while modal is active
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const markFormStarted = () => {
    if (startedTrackedRef.current) return;
    startedTrackedRef.current = true;
    trackConversion("lead_form_started", {
      source: "ads_landing_gate",
      campaign: campaignSlug,
    });
  };

  const toggleService = (id: AdsServiceId) => {
    markFormStarted();
    setErrors((e) => ({ ...e, services: "" }));
    setServices((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((s) => s !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      next.fullName = "Please enter your name.";
    }
    if (!isValidNigerianPhone(phone)) {
      next.phone = "Enter a valid Nigerian phone number (e.g. 0803 123 4567).";
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!location.trim() || location.trim().length < 2) {
      next.location = "Enter your city or state (e.g. Lagos, Abuja, Jos).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const fullAttr = { ...getAttribution(), ...attributionForLead() };
      const selectedServices: AdsServiceId[] =
        services.length > 0 ? services : ["solar"];
      const payload = buildAdsLeadPayload(
        {
          services: selectedServices,
          propertyType: "Not specified",
          location: location.trim(),
          budget: "Not specified",
          systemType: "",
          usageDuration: "",
          appliances: [],
          estimatedWatts: 0,
          accessTypes: [],
          cctvCoverage: [],
          automateWhat: [],
          controlPreference: "",
          automationScale: "",
          fullName: fullName.trim(),
          phone,
          email: email.trim(),
          preferredContact: "WhatsApp",
          consent: true,
          extraNotes: "Submitted via quick entry popup on /get-started",
          matchedSummary: [],
        },
        {
          pathname,
          campaign: campaignSlug,
          attribution: fullAttr,
        },
      );

      const { error } = await supabase.from("leads").insert(payload as never);
      if (error) throw error;

      // Fire-and-forget sales desk notification
      supabase.functions.invoke("notify-new-lead", { body: payload }).catch(console.error);

      trackConversion("lead_submitted", {
        source: "ads_landing_gate",
        campaign: campaignSlug,
        services: selectedServices,
        products: payload.products,
      });

      // GA4 generate_lead event
      type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };
      const gtagFn = typeof window !== "undefined" ? (window as GtagWindow).gtag : undefined;
      if (typeof gtagFn === "function") {
        gtagFn("event", "generate_lead", {
          event_category: "ads_landing_gate",
          event_label: campaignSlug,
          services: selectedServices.join(","),
          currency: "NGN",
        });
      }

      const profile: UnlockedVisitorProfile = {
        unlocked: true,
        fullName: fullName.trim(),
        phone: payload.phone,
        email: email.trim(),
        location: location.trim(),
        propertyType: "Flat",
        services: selectedServices,
        preferredContact: "WhatsApp",
        submittedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(ADS_GATE_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // ignore quota errors
      }

      const firstName = profile.fullName.split(/\s+/)[0] || "there";
      toast.success(`Thanks ${firstName}! Our engineer will reach out shortly.`);
      onUnlocked(profile);
    } catch (err) {
      console.error("Quick lead popup submit failed:", err);
      setSubmitError(
        "Could not connect right now. Check your network and tap Continue again, or chat with us on WhatsApp below.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const selectedServiceLabels = services
    .map((id) => QUICK_SERVICES.find((q) => q.id === id)?.label || id)
    .join(", ");
  const waMessage = [
    "Hi Tioga Technologies, I saw your ad and would like a free quote & Black Friday prices.",
    selectedServiceLabels ? `Interested in: ${selectedServiceLabels}` : "",
    fullName.trim() ? `Name: ${fullName.trim()}` : "",
    location.trim() ? `Location: ${location.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  return createPortal(
    <div
      data-testid="ads-lead-gate-modal"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-labelledby="ads-gate-title"
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-midnight/85 backdrop-blur-md"
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          data-lenis-prevent
          className="w-full max-w-md my-auto rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden"
        >
          {/* Compact Top Brand Header */}
          <div className="px-5 pt-4 pb-3.5 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div>
                <img
                  src={tiogaLogoDark}
                  alt="Tioga Technologies"
                  width={108}
                  height={28}
                  className="h-7 w-auto dark:hidden"
                />
                <img
                  src={tiogaLogoLight}
                  alt="Tioga Technologies"
                  width={108}
                  height={28}
                  className="h-7 w-auto hidden dark:block"
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Free Quote · 10 Secs
              </span>
            </div>

            <h2
              id="ads-gate-title"
              className="font-display text-lg sm:text-xl font-extrabold text-foreground leading-snug"
            >
              Get Your Free Quote &amp; Black Friday Prices
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Drop your WhatsApp number below and a Tioga engineer will send matching package prices fast.
            </p>
          </div>

          {/* Ultra-Short 3-Field Form */}
          <form onSubmit={handleSubmit} noValidate className="p-5 space-y-3.5">
            {/* 1-Tap Service Selector */}
            <div>
              <span className="block text-xs font-bold text-foreground mb-1.5">
                What are you interested in?
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_SERVICES.map((opt) => {
                  const selected = services.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleService(opt.id)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-md border text-left text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      <span
                        className={`h-4 w-4 rounded-sm border shrink-0 grid place-items-center ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                      >
                        {selected && <Check size={10} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fields 1 & 2: Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="gate-fullname" className="block text-xs font-bold text-foreground mb-1">
                  Your Name *
                </label>
                <input
                  id="gate-fullname"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onFocus={markFormStarted}
                  onChange={(e) => {
                    markFormStarted();
                    setFullName(e.target.value);
                    setErrors((er) => ({ ...er, fullName: "" }));
                  }}
                  placeholder="e.g. Chidi Okafor"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.fullName && (
                  <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gate-phone" className="block text-xs font-bold text-foreground mb-1">
                  WhatsApp / Phone *
                </label>
                <input
                  id="gate-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onFocus={markFormStarted}
                  onChange={(e) => {
                    markFormStarted();
                    setPhone(e.target.value);
                    setErrors((er) => ({ ...er, phone: "" }));
                  }}
                  placeholder="0803 123 4567"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.phone && (
                  <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Fields 3 & 4: Email + City/State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="gate-email" className="block text-xs font-bold text-foreground mb-1">
                  Email Address
                </label>
                <input
                  id="gate-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onFocus={markFormStarted}
                  onChange={(e) => {
                    markFormStarted();
                    setEmail(e.target.value);
                    setErrors((er) => ({ ...er, email: "" }));
                  }}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.email && (
                  <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gate-location" className="block text-xs font-bold text-foreground mb-1">
                  City / State *
                </label>
                <input
                  id="gate-location"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={location}
                  onFocus={markFormStarted}
                  onChange={(e) => {
                    markFormStarted();
                    setLocation(e.target.value);
                    setErrors((er) => ({ ...er, location: "" }));
                  }}
                  placeholder="e.g. Lagos, Abuja, Jos"
                  className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.location && (
                  <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.location}</span>
                  </p>
                )}
              </div>
            </div>

            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-start gap-2"
              >
                <RefreshCw size={14} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Primary Submit CTA */}
            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:brightness-105 disabled:opacity-60 transition-all shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Continue &amp; See Prices</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>

            {/* Instant 1-Tap WhatsApp Shortcut */}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackConversion("whatsapp_click", {
                  source: "ads_landing_gate",
                  campaign: campaignSlug,
                  services,
                });
              }}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/15 text-foreground font-semibold text-xs transition-colors"
            >
              <MessageCircle size={15} className="text-[#25D366] shrink-0" />
              <span>Or Chat Instantly on WhatsApp ({WHATSAPP_DISPLAY})</span>
            </a>

            {/* Compact Legal Note + Low-Key Browse Option */}
            <div className="pt-0.5 text-center space-y-1.5">
              <p className="text-[11px] text-muted-foreground leading-snug">
                By continuing, you agree to our{" "}
                <Link
                  to={privacyRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  to={termsRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms
                </Link>
                .
              </p>

              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                >
                  Just browsing? View packages first
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>,
    document.body,
  );
};

export default AdsLeadGateModal;
