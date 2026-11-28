import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Loader2, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { attributionForLead, getAttribution } from "@/lib/attribution";
import { trackConversion } from "@/lib/tracking";
import { isValidNigerianPhone } from "@/lib/customerWhatsapp";
import { footerLinks } from "@/lib/footerLinks";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import AddressInput from "@/components/lead-form/AddressInput";
import tiogaLogoDark from "@/assets/tioga-logo-dark.png";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import {
  buildAdsLeadPayload,
  PROPERTY_OPTIONS,
  SERVICE_OPTIONS,
  type AdsServiceId,
  type ContactChannel,
} from "@/lib/adsLandingLogic";
import { toast } from "sonner";

export const ADS_GATE_STORAGE_KEY = "tioga_ads_lp_unlocked_session_v2";
const LEGACY_ADS_GATE_STORAGE_KEY = "tioga_ads_lp_unlocked_v1";
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const CONTACT_CHANNELS: ContactChannel[] = ["WhatsApp", "Call", "Email"];

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
}

/**
 * Mandatory Lead-Capture Gate Modal for `/get-started` and `/lp/:campaign`.
 * Must be completed and submitted before the visitor can interact with the rest of the page:
 * - No dismiss button, no backdrop click-to-close, no Escape-key close.
 * - Captures visitor details directly into `leads`, triggers `notify-new-lead`,
 *   tracks GA4 `generate_lead` + first-party `lead_submitted`, and persists unlock state
 *   in `localStorage` so returning visitors aren't blocked again.
 */
export const AdsLeadGateModal = ({
  open,
  campaignSlug,
  campaignHeadline,
  pathname,
  defaultServices,
  onUnlocked,
}: AdsLeadGateModalProps) => {
  const reducedMotion = useReducedMotion();
  const { settings: features } = useSiteSetting("features");
  const flexiblePaymentEnabled = features?.flexible_payment_enabled !== false;
  const visibleServiceOptions = flexiblePaymentEnabled
    ? SERVICE_OPTIONS
    : SERVICE_OPTIONS.filter((o) => o.id !== "finance");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("Flat");
  const [preferredContact, setPreferredContact] = useState<ContactChannel>("WhatsApp");
  const [services, setServices] = useState<AdsServiceId[]>(
    defaultServices.length > 0 ? defaultServices : ["audit"],
  );
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const privacyRoute =
    footerLinks.support.find((l) => l.to === "/privacy")?.to ?? "/privacy";
  const termsRoute =
    footerLinks.support.find((l) => l.to === "/terms")?.to ?? "/terms";

  // Keep preselected services synced if campaign param changes before unlock
  useEffect(() => {
    if (defaultServices.length > 0) {
      setServices(defaultServices);
    }
  }, [defaultServices]);

  // Lock background page scroll while mandatory modal is active
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

  if (!open) return null;

  const toggleService = (id: AdsServiceId) => {
    setErrors((e) => ({ ...e, services: "" }));
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      next.fullName = "Please enter your full name.";
    }
    if (!isValidNigerianPhone(phone)) {
      next.phone = "Enter a valid Nigerian phone number (e.g. 0803 123 4567).";
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address or leave it blank.";
    }
    if (!location.trim() || location.trim().length < 2) {
      next.location = "Enter your city or state (e.g. Abuja, Lagos, Jos).";
    }
    if (services.length === 0) {
      next.services = "Select at least one service you are interested in.";
    }
    if (!consent) {
      next.consent = "Please accept our Privacy Policy and Terms to continue.";
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
      const payload = buildAdsLeadPayload(
        {
          services,
          propertyType,
          location,
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
          fullName,
          phone,
          email,
          preferredContact,
          consent,
          extraNotes: "Submitted via mandatory entry lead gate",
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
        services,
        products: payload.products,
      });

      // GA4 generate_lead event
      type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };
      const gtagFn = typeof window !== "undefined" ? (window as GtagWindow).gtag : undefined;
      if (typeof gtagFn === "function") {
        gtagFn("event", "generate_lead", {
          event_category: "ads_landing_gate",
          event_label: campaignSlug,
          services: services.join(","),
          currency: "NGN",
        });
      }

      // Meta Pixel conversion hook (uncomment once Meta Pixel script + ID are configured):
      // if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      //   (window as any).fbq("track", "Lead", { content_name: `${campaignSlug}_gate` });
      // }

      const profile: UnlockedVisitorProfile = {
        unlocked: true,
        fullName: fullName.trim(),
        phone: payload.phone,
        email: email.trim(),
        location: location.trim(),
        propertyType,
        services: [...services],
        preferredContact,
        submittedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(ADS_GATE_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // ignore quota errors
      }

      const firstName = profile.fullName.split(/\s+/)[0] || "there";
      toast.success(`Welcome ${firstName}! Your details are saved. Explore our solutions below.`);
      onUnlocked(profile);
    } catch (err) {
      console.error("Mandatory gate lead submit failed:", err);
      setSubmitError(
        "We couldn't connect right now. Please check your internet connection and tap Continue again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-testid="ads-lead-gate-modal"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-labelledby="ads-gate-title"
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-midnight/85 backdrop-blur-md"
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          data-lenis-prevent
          className="w-full max-w-xl my-auto rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden"
        >
        {/* Top Brand Strip */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <img
                src={tiogaLogoDark}
                alt="Tioga Technologies"
                width={118}
                height={32}
                className="h-8 w-auto dark:hidden"
              />
              <img
                src={tiogaLogoLight}
                alt="Tioga Technologies"
                width={118}
                height={32}
                className="h-8 w-auto hidden dark:block"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Lock size={12} className="text-primary" />
              <span>Quick step to continue</span>
            </span>
          </div>

          <h2
            id="ads-gate-title"
            className="font-display text-xl sm:text-2xl font-extrabold text-foreground leading-tight"
          >
            Tell us what you need to unlock packages &amp; your free quote
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {campaignHeadline} Fill in your details below so a Tioga engineer can size your system and send pricing within 24 hours.
          </p>
        </div>

        {/* Mandatory Lead Form */}
        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="gate-fullname" className="block text-xs font-bold text-foreground mb-1">
                Full Name *
              </label>
              <input
                id="gate-fullname"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((er) => ({ ...er, fullName: "" }));
                }}
                placeholder="e.g. Chidi Okafor"
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.fullName && (
                <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="gate-phone" className="block text-xs font-bold text-foreground mb-1">
                Phone / WhatsApp Number *
              </label>
              <input
                id="gate-phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((er) => ({ ...er, phone: "" }));
                }}
                placeholder="e.g. 0803 123 4567"
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.phone && (
                <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="gate-email" className="block text-xs font-bold text-foreground mb-1">
                Email Address <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="gate-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((er) => ({ ...er, email: "" }));
                }}
                placeholder="you@example.com"
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && (
                <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <span className="block text-xs font-bold text-foreground mb-1">
                Preferred Contact
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {CONTACT_CHANNELS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={preferredContact === ch}
                    onClick={() => setPreferredContact(ch)}
                    className={`h-11 rounded-md border text-xs font-bold transition-colors ${
                      preferredContact === ch
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

          {/* City / Installation Location */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              City / Installation Location *
            </label>
            <AddressInput
              value={location}
              onChange={(val) => {
                setLocation(val);
                setErrors((er) => ({ ...er, location: "" }));
              }}
            />
            {errors.location && (
              <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1">
                {errors.location}
              </p>
            )}
          </div>

          {/* Services Needed */}
          <div>
            <span className="block text-xs font-bold text-foreground mb-1.5">
              What are you interested in? *
            </span>
            <div className="grid grid-cols-2 gap-2">
              {visibleServiceOptions.map((opt) => {
                const selected = services.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleService(opt.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-md border text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
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
                      {selected && <Check size={11} />}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.services && (
              <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>{errors.services}</span>
              </p>
            )}
          </div>

          {/* Property Type */}
          <div>
            <span className="block text-xs font-bold text-foreground mb-1.5">
              Property Type
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {PROPERTY_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={propertyType === p.label}
                  onClick={() => setPropertyType(p.label)}
                  className={`min-h-[40px] px-2 py-1.5 rounded-md border text-xs font-bold transition-colors ${
                    propertyType === p.label
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Required Consent */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors((er) => ({ ...er, consent: "" }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
              />
              <span>
                I agree to Tioga Technologies contacting me with my quote and accept the{" "}
                <Link
                  to={privacyRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  to={termsRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Terms of Service
                </Link>
                . *
              </span>
            </label>
            {errors.consent && (
              <p role="alert" aria-live="polite" className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
                <AlertCircle size={13} />
                <span>{errors.consent}</span>
              </p>
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2"
            >
              <RefreshCw size={14} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm hover:brightness-105 disabled:opacity-60 transition-all shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving your details…</span>
              </>
            ) : (
              <>
                <span>Continue &amp; Get My Free Quote</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
      </div>
    </div>,
    document.body,
  );
};

export default AdsLeadGateModal;
