import { useState } from "react";
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
import Footer from "@/components/Footer";
import LeadForm from "@/components/LeadForm";
import { trackConversion } from "@/lib/tracking";

const Index = () => {
  const [formOpen, setFormOpen] = useState(false);

  const openForm = (source: string) => {
    trackConversion("cta_click", { source });
    trackConversion("lead_form_opened", { source });
    setFormOpen(true);
  };

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
      <Footer />
      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};

export default Index;
