import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadFormData, initialFormData, budgetOptions, FlowCategory } from "./lead-form/types";
import { inputClass, selectBtnClass } from "./lead-form/StepUI";
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
  const [step, setStep] = useState(-1); // -1 = category select
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const update = (partial: Partial<LeadFormData>) => setData((d) => ({ ...d, ...partial }));

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
      const { error } = await supabase.from("leads").insert({
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
      });
      if (error) throw error;

      const fullName = data.fullName.trim();
      const budget = data.budget;
      handleReset();
      onClose();
      navigate("/catalog", { state: { products, budget, fullName } });
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

    // Common steps
    if (currentStepKey === "budget") return !!data.budget;
    if (currentStepKey === "contact") return !!(data.fullName.trim() && data.phone.trim());
    if (currentStepKey === "final") return data.consent;

    // Category-specific
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

    // Common steps
    if (currentStepKey === "budget") {
      return (
        <div className="space-y-5">
          <h3 className="text-xl font-display font-bold text-card-foreground">What's your budget?</h3>
          <div className="space-y-2">
            {budgetOptions.map((o) => (
              <button key={o} onClick={() => update({ budget: o })} className={`w-full ${selectBtnClass(data.budget === o)}`}>
                {o}
              </button>
            ))}
          </div>
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
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
                <input className={inputClass} placeholder="e.g. Ikeja, Lagos" value={data.location} onChange={(e) => update({ location: e.target.value })} />
              </div>
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
                placeholder="Anything else you'd like us to know..."
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
              <span className="text-sm text-foreground">✅ I agree to be contacted about my enquiry</span>
            </label>
          </div>
        </div>
      );
    }

    // Category-specific
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {step >= 0 ? `Step ${step + 1} of ${totalSteps}` : "Get Started"}
          </span>
          <button onClick={() => { handleReset(); onClose(); }} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        {step >= 0 && (
          <div className="mx-6 h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Content */}
        <div key={step} className={`px-6 py-6 ${step >= 0 ? animClass : ""}`}>
          {step === -1 ? (
            <CategorySelect onSelect={selectCategory} />
          ) : (
            renderCurrentStep()
          )}
        </div>

        {/* Navigation */}
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
      </div>
    </div>
  );
};

export default LeadForm;
