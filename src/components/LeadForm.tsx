import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadFormProps {
  open: boolean;
  onClose: () => void;
}

type ProductInterest = "solar" | "panels" | "batteries" | "smarthome" | "smartlocks" | "cctv" | "full_solar" | "other";

const productOptions: { value: ProductInterest; label: string }[] = [
  { value: "solar", label: "Solar Inverter / Power Station" },
  { value: "panels", label: "Solar Panels" },
  { value: "batteries", label: "Batteries" },
  { value: "smarthome", label: "Smart Home Automation" },
  { value: "smartlocks", label: "Smart Locks" },
  { value: "cctv", label: "CCTV / Security Systems" },
  { value: "full_solar", label: "Full Solar Installation" },
  { value: "other", label: "Other" },
];

const solarAppliances = ["Lights", "Fan", "TV", "Fridge", "AC", "Other"];
const budgetOptions = ["Below ₦500k", "₦500k – ₦1M", "₦1M – ₦3M", "₦3M+"];
const timelineOptions = ["Urgent", "1–2 weeks", "Just checking"];
const electricityOptions = ["Yes", "No", "Sometimes"];
const goalOptions = ["Backup power", "Reduce fuel cost", "Full solar setup"];

const isSolarRelated = (products: ProductInterest[]) =>
  products.some((p) => ["solar", "panels", "batteries", "full_solar"].includes(p));

const LeadForm = ({ open, onClose }: LeadFormProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [products, setProducts] = useState<ProductInterest[]>([]);
  const [electricity, setElectricity] = useState("");
  const [goal, setGoal] = useState("");
  const [appliances, setAppliances] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  if (!open) return null;

  const showAppliances = isSolarRelated(products);

  const steps = [
    "info",
    "products",
    "needs",
    ...(showAppliances ? ["appliances"] : []),
    "budget",
    "timeline",
    "final",
  ];

  const totalSteps = steps.length;
  const currentStepKey = steps[step];
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        location: location.trim(),
        products: products as string[],
        has_electricity: electricity,
        main_goal: goal,
        appliances,
        budget,
        timeline,
        notes: notes.trim() || null,
        consent,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
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
    }
  };

  const toggleProduct = (v: ProductInterest) =>
    setProducts((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleAppliance = (v: string) =>
    setAppliances((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const canProceed = () => {
    switch (currentStepKey) {
      case "info":
        return fullName.trim() && phone.trim() && location.trim();
      case "products":
        return products.length > 0;
      case "needs":
        return electricity && goal;
      case "appliances":
        return appliances.length > 0;
      case "budget":
        return !!budget;
      case "timeline":
        return !!timeline;
      case "final":
        return consent;
      default:
        return true;
    }
  };

  const handleReset = () => {
    setStep(0);
    setSubmitted(false);
    setFullName("");
    setPhone("");
    setEmail("");
    setLocation("");
    setProducts([]);
    setElectricity("");
    setGoal("");
    setAppliances([]);
    setBudget("");
    setTimeline("");
    setNotes("");
    setConsent(false);
    onClose();
  };

  const animClass = direction === "left" ? "animate-slide-left" : "animate-slide-right";

  const inputClass =
    "w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground";

  const selectBtnClass = (selected: boolean) =>
    `rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all ${
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-foreground hover:border-primary/30"
    }`;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
        <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5 animate-slide-up">
          <CheckCircle2 size={56} className="text-primary mx-auto" />
          <h2 className="text-2xl font-display font-bold text-card-foreground">Application Received 🎉</h2>
          <p className="text-muted-foreground text-sm">We'll review your needs and get back to you shortly.</p>
          <div className="flex flex-col gap-3 pt-2">
            <a
              href="https://wa.me/2348178000023"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Step {step + 1} of {totalSteps}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress */}
        <div className="mx-6 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div key={currentStepKey} className={`px-6 py-6 space-y-5 ${animClass}`}>
          {currentStepKey === "info" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">Contact Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name *</label>
                  <input className={inputClass} placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number *</label>
                  <input className={inputClass} placeholder="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Address (Optional)</label>
                  <input className={inputClass} placeholder="email@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Location (City/State) *</label>
                  <input className={inputClass} placeholder="e.g. Lagos, Abuja" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {currentStepKey === "products" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">What do you need?</h3>
              <p className="text-sm text-muted-foreground">Select one or more</p>
              <div className="grid grid-cols-2 gap-3">
                {productOptions.map((o) => (
                  <button key={o.value} onClick={() => toggleProduct(o.value)} className={selectBtnClass(products.includes(o.value))}>
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStepKey === "needs" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">Power Needs</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Do you have electricity?</p>
                  <div className="flex gap-2">
                    {electricityOptions.map((o) => (
                      <button key={o} onClick={() => setElectricity(o)} className={`flex-1 text-center ${selectBtnClass(electricity === o)}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Main goal</p>
                  <div className="space-y-2">
                    {goalOptions.map((o) => (
                      <button key={o} onClick={() => setGoal(o)} className={`w-full ${selectBtnClass(goal === o)}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStepKey === "appliances" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">Select key appliances</h3>
              <div className="grid grid-cols-2 gap-3">
                {solarAppliances.map((a) => (
                  <button key={a} onClick={() => toggleAppliance(a)} className={selectBtnClass(appliances.includes(a))}>
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStepKey === "budget" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">What's your budget?</h3>
              <div className="space-y-2">
                {budgetOptions.map((o) => (
                  <button key={o} onClick={() => setBudget(o)} className={`w-full ${selectBtnClass(budget === o)}`}>
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStepKey === "timeline" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">When do you need this?</h3>
              <div className="space-y-2">
                {timelineOptions.map((o) => (
                  <button key={o} onClick={() => setTimeline(o)} className={`w-full ${selectBtnClass(timeline === o)}`}>
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStepKey === "final" && (
            <>
              <h3 className="text-xl font-display font-bold text-card-foreground">Almost done!</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Any notes? (Optional)</label>
                  <textarea
                    className={`${inputClass} min-h-[80px] resize-none`}
                    placeholder="Anything else you'd like us to know..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-primary/30 accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    ✅ I agree to be contacted about my enquiry
                  </span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-1 rounded-xl border border-border px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canProceed() || submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : step === totalSteps - 1 ? "Submit Application" : "Continue"}
            {step < totalSteps - 1 && !submitting && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
