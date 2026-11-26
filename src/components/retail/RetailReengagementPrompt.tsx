import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X, MessageCircle, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContact, whatsappDigits } from "@/hooks/useSiteContact";
import { supabase } from "@/integrations/supabase/client";
import {
  getShopperTrail,
  saveShopperTrail,
  identifyShopper,
  submitReengagementFeedback,
  REENGAGEMENT_REASONS,
} from "@/lib/shopperIntelligence";
import { toast } from "sonner";

const DISMISS_SESSION_KEY = "tioga_retail_reengage_dismissed_v1";

/**
 * Handles two core e-commerce lead & re-engagement flows on /retail:
 * 1. If the user arrives via a 1-click email link (`?reengage_feedback=...`), logs
 *    their reason, alerts the sales team, and offers instant WhatsApp engineer help.
 * 2. If a shopper (signed-in without a purchase, or a high-intent browser who viewed
 *    3+ products / added to cart) is about to leave or pauses after browsing, displays
 *    a non-intrusive slide-up card to capture why they haven't checked out (or capture
 *    their contact details if anonymous).
 */
export const RetailReengagementPrompt = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { contact } = useSiteContact();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"feedback" | "lead_capture">("feedback");
  const [submitted, setSubmitted] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("need_sizing_help");
  const [customNote, setCustomNote] = useState("");
  const [leadForm, setLeadForm] = useState({ full_name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  // 1) Handle incoming 1-click `?reengage_feedback=` link from re-engagement emails
  useEffect(() => {
    const fb = searchParams.get("reengage_feedback");
    const emailParam = searchParams.get("email") || undefined;
    if (!fb) return;

    const reasonObj = REENGAGEMENT_REASONS[fb];
    submitReengagementFeedback({
      reasonKey: fb,
      email: emailParam || user?.email || undefined,
      fullName: profile?.full_name || user?.user_metadata?.full_name || undefined,
      phone: profile?.phone || user?.phone || undefined,
    });

    toast.success("Thanks for letting us know!", {
      description: reasonObj?.reply || "Our engineering & sales team has been notified to assist you.",
      duration: 7000,
    });

    // Clean URL param so refreshing doesn't re-trigger
    const next = new URLSearchParams(searchParams);
    next.delete("reengage_feedback");
    next.delete("email");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, user, profile]);

  // 2) Trigger exit-intent / high-intent re-engagement card once per session
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") return;

    const checkAndShow = (fromExitIntent = false) => {
      if (sessionStorage.getItem(DISMISS_SESSION_KEY) === "1") return;
      const trail = getShopperTrail();
      if (trail.has_ordered) return;

      const viewedCount = trail.viewed_products.length;
      const cartCount = trail.cart_items.length;
      const isSignedIn = Boolean(user?.email || trail.identity?.email);

      if (isSignedIn && (viewedCount >= 2 || cartCount >= 1 || fromExitIntent)) {
        setMode("feedback");
        setOpen(true);
        sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
      } else if (!isSignedIn && (viewedCount >= 3 || cartCount >= 1 || (fromExitIntent && viewedCount >= 1))) {
        setMode("lead_capture");
        setOpen(true);
        sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
      }
    };

    // Timer trigger after 55 seconds of active browsing on /retail
    const timer = window.setTimeout(() => checkAndShow(false), 55_000);

    // Desktop mouse-leave exit-intent trigger
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        checkAndShow(true);
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    setOpen(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submitReengagementFeedback({
      reasonKey: selectedReason,
      customNote: customNote.trim() || undefined,
      email: user?.email || undefined,
      fullName: profile?.full_name || user?.user_metadata?.full_name || undefined,
      phone: profile?.phone || user?.phone || undefined,
    });
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Feedback received! Our team is on it.");
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.full_name.trim() || (!leadForm.phone.trim() && !leadForm.email.trim())) {
      toast.error("Please enter your name and phone number or email");
      return;
    }
    setSubmitting(true);
    const trail = getShopperTrail();
    const viewedNames = trail.viewed_products.map((p) => p.name);
    const reasonLabel = REENGAGEMENT_REASONS[selectedReason]?.label || selectedReason;

    await identifyShopper(
      {
        full_name: leadForm.full_name.trim(),
        phone: leadForm.phone.trim(),
        email: leadForm.email.trim(),
      },
      { is_signup: false }
    );

    try {
      await supabase.from("leads").insert({
        full_name: leadForm.full_name.trim(),
        phone: leadForm.phone.trim() || "Email Lead",
        email: leadForm.email.trim() || null,
        location: "Retail Storefront",
        products: viewedNames.length > 0 ? viewedNames.slice(0, 5) : ["Retail Catalog Enquiry"],
        budget: reasonLabel,
        notes: `Captured via Retail Browse Assistant.\nReason / Interest: ${reasonLabel}${
          customNote.trim() ? `\nNote: ${customNote.trim()}` : ""
        }`,
        status: "new",
        source: "retail_exit_intent",
      } as any);
    } catch {
      // non-fatal
    }

    try {
      await supabase.functions.invoke("notify-new-lead", {
        body: {
          source: "retail_exit_intent",
          full_name: leadForm.full_name.trim(),
          phone: leadForm.phone.trim() || "Not provided",
          email: leadForm.email.trim(),
          location: "Retail Storefront (/retail)",
          budget: reasonLabel,
          products: viewedNames.length > 0 ? viewedNames.slice(0, 6) : ["Retail Store Browsing"],
          summary: `Retail visitor shared their contact details & interest: "${reasonLabel}".${
            customNote.trim() ? ` Note: "${customNote.trim()}".` : ""
          }`,
        },
      });
    } catch {
      // non-fatal
    }

    trail.reengagement_prompt_shown = true;
    saveShopperTrail(trail);
    setSubmitting(false);
    setSubmitted(true);
    toast.success("Sent! Our team will reach out shortly.");
  };

  if (!open) return null;

  const trail = getShopperTrail();
  const lastViewed = trail.viewed_products[0]?.name;
  const waMsg = encodeURIComponent(
    `Hi Tioga Technologies, I was browsing ${lastViewed ? `"${lastViewed}" on ` : ""}your retail store and have a quick question: ${
      REENGAGEMENT_REASONS[selectedReason]?.label || ""
    }`
  );
  const waUrl = `https://wa.me/${whatsappDigits(contact)}?text=${waMsg}`;

  return (
    <div
      data-testid="retail-reengagement-prompt"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[400px] z-40 rounded-2xl bg-card border-2 border-primary/35 shadow-2xl p-4 sm:p-5 animate-fade-up"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <X size={15} />
      </button>

      {submitted ? (
        <div className="text-center py-3 space-y-3">
          <CheckCircle2 size={36} className="text-primary mx-auto" />
          <h3 className="font-display font-bold text-base text-foreground">
            We've Notified Our Engineering Desk!
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {REENGAGEMENT_REASONS[selectedReason]?.reply}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-sm"
            >
              <MessageCircle size={14} />
              <span>Chat on WhatsApp Now</span>
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : mode === "feedback" ? (
        <form onSubmit={handleFeedbackSubmit} className="space-y-3">
          <div className="flex items-start gap-2.5 pr-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground leading-snug">
                Need a hand before you leave?
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lastViewed
                  ? `We noticed you checked out ${lastViewed}. Let us know how we can help complete your setup:`
                  : "Tell us what you need so our engineers can assist you right away:"}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {Object.entries(REENGAGEMENT_REASONS).map(([key, item]) => (
              <label
                key={key}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === key
                    ? "border-primary bg-primary/10 font-semibold text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="reengage_reason"
                  value={key}
                  checked={selectedReason === key}
                  onChange={() => setSelectedReason(key)}
                  className="accent-primary"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Optional: any specific question or target price?"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
            >
              <span>{submitting ? "Sending…" : "Notify Our Team"}</span>
              <ArrowRight size={13} />
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all shrink-0"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>
          </div>
        </form>
      ) : (
        <form onSubmit={handleLeadSubmit} className="space-y-2.5">
          <div className="flex items-start gap-2.5 pr-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-foreground leading-snug">
                Get Our Official Deal Sheet &amp; Engineer Help
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Leave your WhatsApp or email to get instant sizing help or our best quote on the hardware you viewed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              required
              value={leadForm.full_name}
              onChange={(e) => setLeadForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Your Name *"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={leadForm.phone}
                onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="WhatsApp Phone *"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
              />
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email (optional)"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
              />
            </div>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              {Object.entries(REENGAGEMENT_REASONS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
            >
              <span>{submitting ? "Sending…" : "Send Me Details"}</span>
              <ArrowRight size={13} />
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all shrink-0"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>
          </div>
        </form>
      )}
    </div>
  );
};

export default RetailReengagementPrompt;
