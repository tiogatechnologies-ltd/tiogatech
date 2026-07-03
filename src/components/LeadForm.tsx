import { useState, useEffect } from "react";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackConversion } from "@/lib/tracking";
import { attributionForLead } from "@/lib/attribution";
import { LeadFormData, initialFormData, budgetOptions, FlowCategory } from "./lead-form/types";
import { inputClass, selectBtnClass } from "./lead-form/StepUI";
import AddressInput from "./lead-form/AddressInput";
import CategorySelect from "./lead-form/CategorySelect";
import { solarStepKeys, renderSolarStep, canProceedSolar } from "./lead-form/SolarFlow";
import { automationStepKeys, renderAutomationStep, canProceedAutomation } from "./lead-form/AutomationFlow";
import { renderSecurityStep, canProceedSecurity, getSecuritySteps } from "./lead-form/SecurityFlow";

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
}

const commonSteps = ["budget", "contact", "final"];

function getCategorySteps(category: FlowCategory, data: LeadFormData): string[] {
  switch (category) {
    case "solar": return [...solarStepKeys, ...commonSteps];
    case "automation": return [...automationStepKeys, ...commonSteps];
    case "security": return [...getSecuritySteps(data), ...commonSteps];
  }
}

function mapCategoryToProducts(cat: FlowCategory, data: LeadFormData): string[] {
  switch (cat) {
    case "solar": return ["solar", "panels", "batteries", "full_solar"];
    case "automation": return ["smarthome"];
    case "security": {
      const needs = data.securityNeeds;
      if (needs.includes("Both")) return ["smartlocks", "cctv"];
      if (needs.includes("Smart Locks")) return ["smartlocks"];
      if (needs.includes("CCTV Cameras")) return ["cctv"];
      return ["smartlocks", "cctv"];
    }
  }
}

const LeadForm = ({ open, onClose }: LeadFormProps) => {
  const navigate = useNavigate();
  const [data, setData] = useState<LeadFormData>({ ...initialFormData });
  const [step, setStep] = useState(-1);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) trackConversion("lead_form_started", {});
  }, [open]);

  if (!open) return null;

  const update = (partial: Partial<LeadFormData>) => setData((d) => ({ ...d, ...partial }));

  const buildWhatsAppUrl = () => {
    const lines = [
      "Hi Tioga! I would like a personalized recommendation.",
      data.category ? `• Interested in: ${data.category}` : "",
      data.fullName ? `• Name: ${data.fullName}` : "",
      data.location ? `• Location: ${data.location}` : "",
      data.budget ? `• Budget: ${data.budget}` : "",
      data.totalWatts ? `• Estimated load: ${data.totalWatts}W` : "",
    ].filter(Boolean).join("\n");
    return `https://wa.me/2348178000023?text=${encodeURIComponent(lines)}`;
  };

  const steps = data.category ? getCategorySteps(data.category, data) : [];
  const totalSteps = steps.length;
  const currentStepKey = step >= 0 ? steps[step] : null;
  const progress = step >= 0 ? ((step + 1) / totalSteps) * 100 : 0;

  const handleReset = () => {
    setData({ ...initialFormData });
    setStep(-1);
  };

  const handleSubmit = async () => {
    if (!data.category) return;
    setSubmitting(true);
    try {
      const products = mapCategoryToProducts(data.category, data);
      const leadPayload = {
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || null,
        location: data.location.trim(),
        products,
        has_electricity: data.category === "solar" ? data.systemType : null,
        main_goal: data.category === "solar" ? data.usageDuration : data.category === "automation" ? data.controlPreference : data.securityNeeds.join(", "),
        appliances: data.category === "solar" ? data.solarAppliances : [],
        budget: data.budget,
        timeline: null,
        notes: data.notes.trim() || null,
        consent: data.consent,
        ...attributionForLead(),
      };
      const { error } = await supabase.from("leads").insert(leadPayload as any);
      if (error) throw error;

      trackConversion("lead_submitted", {
        category: data.category,
        budget: data.budget,
        products,
      });

      supabase.functions.invoke("notify-new-lead", { body: leadPayload }).catch(console.error);

      const fullName = data.fullName.trim();
      const budget = data.budget;
      const totalWatts = data.totalWatts;
      const category = data.category;
      const selectedAppliances = data.selectedAppliances.map(a => ({
        name: a.name,
        quantity: a.quantity,
        avgWatts: a.info.avgWatts,
      }));
      // Collect category-specific context for AI
      const formContext = {
        category,
        systemType: data.systemType,
        propertyType: data.propertyType || data.automationPropertyType || data.securityPropertyType,
        usageDuration: data.usageDuration,
        automateWhat: data.automateWhat,
        controlPreference: data.controlPreference,
        automationScale: data.automationScale,
        securityNeeds: data.securityNeeds,
        accessType: data.accessType,
        cctvCoverage: data.cctvCoverage,
      };
      handleReset();
      onClose();
      navigate("/catalog", { state: { products, budget, fullName, totalWatts, selectedAppliances, formContext } });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    if (!currentStepKey) return false;
    if (!data.category) return false;

    if (currentStepKey === "budget") return !!data.budget;
    if (currentStepKey === "contact") return !!(data.fullName.trim() && data.phone.trim());
    if (currentStepKey === "final") return data.consent;

    switch (data.category) {
      case "solar": return canProceedSolar(currentStepKey, data);
      case "automation": return canProceedAutomation(currentStepKey, data);
      case "security": return canProceedSecurity(currentStepKey, data);
    }
  };

  const goNext = () => {
    if (step < totalSteps - 1) {
      setDirection("left");
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection("right");
      setStep((s) => s - 1);
    } else if (step === 0) {
      setDirection("right");
      setStep(-1);
      setData((d) => ({ ...d, category: null }));
    }
  };

  const selectCategory = (cat: FlowCategory) => {
    update({ category: cat });
    setDirection("left");
    setStep(0);
  };

  const renderCurrentStep = () => {
    if (!currentStepKey || !data.category) return null;

    if (currentStepKey === "budget") {
      const wattsWarning = data.category === "solar" && data.totalWatts > 0;
      const getMinPrice = (w: number) => {
        if (w <= 1000) return 1125200;
        if (w <= 1500) return 1519500;
        if (w <= 2500) return 2216000;
        if (w <= 3500) return 4024000;
        if (w <= 5000) return 4775940;
        if (w <= 7500) return 7253000;
        if (w <= 10000) return 10828800;
        return 20808000;
      };
      const minNeeded = wattsWarning ? getMinPrice(data.totalWatts) : 0;
      const getBudgetMax = (b: string) => {
        if (b === "Below ₦500k") return 500000;
        if (b === "₦500k to ₦1M") return 1000000;
        if (b === "₦1M to ₦3M") return 3000000;
        return Infinity;
      };

      return (
        <div className="space-y-5">
          <h3 className="text-xl font-display font-bold text-card-foreground">What is your budget?</h3>
          {wattsWarning && (
            <p className="text-xs text-muted-foreground">Based on your appliances ({data.totalWatts.toLocaleString()}W), packages start from ₦{(minNeeded / 1000000).toFixed(1)}M</p>
          )}
          <div className="space-y-2">
            {budgetOptions.map((o) => {
              const budgetMax = getBudgetMax(o);
              const tooLow = wattsWarning && budgetMax < minNeeded;
              return (
                <div key={o}>
                  <button
                    onClick={() => update({ budget: o })}
                    className={`w-full ${selectBtnClass(data.budget === o)} ${tooLow ? "opacity-60" : ""}`}
                  >
                    {o}
                    {tooLow && <span className="text-[10px] ml-2 text-destructive">May not cover your needs</span>}
                  </button>
                </div>
              );
            })}
          </div>
          {data.budget && wattsWarning && getBudgetMax(data.budget) < minNeeded && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3">
              <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                Your selected appliances may require a higher budget. You can still proceed and we will recommend the closest option within your range.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentStepKey === "contact") {
      return (
        <div className="space-y-5">
          <h3 className="text-xl font-display font-bold text-card-foreground">Your Contact Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
              <input className={inputClass} placeholder="Your full name" value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
              <input className={inputClass} placeholder="Phone number" type="tel" value={data.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email (Optional)</label>
              <input className={inputClass} placeholder="email@example.com" type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} />
            </div>
            {data.category !== "solar" && (
              <AddressInput value={data.location} onChange={(location) => update({ location })} />
            )}
          </div>
        </div>
      );
    }

    if (currentStepKey === "final") {
      return (
        <div className="space-y-5">
          <h3 className="text-xl font-display font-bold text-card-foreground">Almost done!</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Any notes? (Optional)</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-none`}
                placeholder="Anything else you would like us to know..."
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
                maxLength={500}
              />
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.consent}
                onChange={(e) => update({ consent: e.target.checked })}
                className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-primary/30 accent-primary"
              />
              <span className="text-sm text-foreground">I agree to be contacted about my enquiry</span>
            </label>
          </div>
        </div>
      );
    }

    switch (data.category) {
      case "solar": return renderSolarStep(currentStepKey, data, update);
      case "automation": return renderAutomationStep(currentStepKey, data, update);
      case "security": return renderSecurityStep(currentStepKey, data, update);
    }
  };

  const animClass = direction === "left" ? "animate-slide-left" : "animate-slide-right";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {step >= 0 ? `Step ${step + 1} of ${totalSteps}` : "Get Started"}
          </span>
          <button onClick={() => { handleReset(); onClose(); }} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {step >= 0 && (
          <div className="mx-6 h-2 rounded-full bg-muted overflow-hidden relative">
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, hsl(var(--solar-gold)) 0%, hsl(var(--primary)) 100%)",
                transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* liquid shimmer */}
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: "linear-gradient(90deg, transparent, hsla(0,0%,100%,0.55), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.4s linear infinite",
                }}
              />
            </div>
          </div>
        )}

        <div key={step} className={`px-6 py-6 ${step >= 0 ? animClass : ""}`}>
          {step === -1 ? (
            <CategorySelect onSelect={selectCategory} />
          ) : (
            renderCurrentStep()
          )}
        </div>

        {step >= 0 && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canProceed() || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : step === totalSteps - 1 ? "See My Recommendations" : "Continue"}
              {step < totalSteps - 1 && !submitting && <ArrowRight size={16} />}
            </button>
          </div>
        )}

        <div className="px-6 pb-6 -mt-2">
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackConversion("whatsapp_click", { source: "lead_form", category: data.category })}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98] transition-all"
          >
            <MessageCircle size={16} />
            Prefer to chat? Continue on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
