import { useState } from "react";
import Hero from "@/components/Hero";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
import OfferSection from "@/components/OfferSection";
import HowItWorks from "@/components/HowItWorks";
import TargetUsers from "@/components/TargetUsers";
import TrustSection from "@/components/TrustSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyCTA from "@/components/StickyCTA";
import LeadForm from "@/components/LeadForm";

const Index = () => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen scroll-smooth pb-16">
      <Hero onApply={() => setFormOpen(true)} />
      <ProblemSection />
      <div id="solutions">
        <SolutionSection />
        <OfferSection />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <TargetUsers />
      <div id="trust">
        <TrustSection />
      </div>
      <FinalCTA onApply={() => setFormOpen(true)} />
      <Footer />
      <StickyCTA onApply={() => setFormOpen(true)} />
      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
};

export default Index;
