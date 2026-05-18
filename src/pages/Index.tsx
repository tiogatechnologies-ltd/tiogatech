import Hero from "@/components/Hero";
import SiteHeader from "@/components/SiteHeader";
import SEO from "@/components/SEO";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";

import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import TargetUsers from "@/components/TargetUsers";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import FinalCTA from "@/components/FinalCTA";
import SiteFooter from "@/components/SiteFooter";
import { openLeadForm } from "@/components/SiteHeader";

const Index = () => {
  const open = (source: string) => openLeadForm(source);

  return (
    <div className="min-h-screen scroll-smooth">
      <SEO
        title="Tioga Technologies — Solar, Smart Locks & Home Automation in Nigeria"
        description="Reliable solar power, STAMA smart locks and full home automation across Lagos, Abuja, Port Harcourt, Jos and beyond. Browse packages or get a free quote."
        path="/"
      />
      <SiteHeader />
      <Hero onApply={() => open("hero")} />
      <ProblemSection />
      <div id="solutions">
        <SolutionSection />
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
      <FinalCTA onApply={() => open("final_cta")} />
      <SiteFooter />
    </div>
  );
};

export default Index;
