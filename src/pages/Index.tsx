import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import SiteHeader from "@/components/SiteHeader";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import OfferSection from "@/components/OfferSection";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import TargetUsers from "@/components/TargetUsers";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import FinalCTA from "@/components/FinalCTA";
import SiteFooter from "@/components/SiteFooter";
import LeadForm from "@/components/LeadForm";
import { trackConversion } from "@/lib/tracking";

const Index = () => {
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const openForm = (source: string) => {
    trackConversion("cta_click", { source });
    trackConversion("lead_form_opened", { source });
    setFormOpen(true);
  };

  // Listen for AI badge clicks from anywhere in the app
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      openForm(detail.source || "ai_badge");
    };
    window.addEventListener("tioga:open-lead-form", handler);
    return () => window.removeEventListener("tioga:open-lead-form", handler);
  }, []);

  // Auto-open when navigated with ?lead=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("lead") === "1") {
      openForm("ai_badge_redirect");
      params.delete("lead");
      navigate({ pathname: "/", search: params.toString() }, { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen scroll-smooth">
      <SiteHeader />
      <Hero onApply={() => openForm("hero")} />
      <ProblemSection />
      <div id="solutions">
        <SolutionSection />
        <OfferSection />
      </div>
      <StatsSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <TargetUsers />
      <div id="trust">
        <TrustSection />
      </div>
      <FAQSection />
      <FinalCTA onApply={() => openForm("final_cta")} />
      <SiteFooter />
      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};

export default Index;
