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
import LumiVoltSizer from "@/components/LumiVoltSizer";
import { Calculator, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";

const Index = () => {
  const open = (source: string) => openLeadForm(source);

  const faqs = [
    { q: "How much does a solar system cost?", a: "A basic backup starts from ₦400,000, while full off-grid ranges from ₦1.8M to ₦5M+." },
    { q: "How long does installation take?", a: "Most residential installations are completed within 1 to 3 days." },
    { q: "Do you offer payment plans?", a: "Yes! We offer flexible payment options including installment plans." },
    { q: "What happens if something breaks?", a: "All products come with manufacturer warranties (1 to 5 years) plus after-sales support." },
    { q: "Can I start with one solution and add more later?", a: "Absolutely. Our systems are modular and expandable." },
    { q: "Do you cover my area?", a: "We currently serve Lagos, Abuja, and Port Harcourt and other surrounding regions." },
    { q: "Will solar work during rainy season?", a: "Yes. Battery storage keeps you powered through low-sun periods." },
    { q: "What smart home features can I control?", a: "Lights, switches, AC, curtains, fans, water heaters, gate motors, and more." },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen scroll-smooth">
      <SEO
        title="Tioga Technologies — Solar & Smart Home in Nigeria"
        description="Reliable solar, STAMA smart locks and home automation across Lagos, Abuja, Port Harcourt and Jos. Browse packages or get a free quote."
        path="/"
        jsonLd={faqJsonLd}
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

      {/* Calculate your power needs */}
      <section id="power-calculator" className="section-padding bg-muted/30 scroll-mt-24">
        <div className="section-container">
          <div className="text-center mb-8">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3 inline-flex items-center gap-2 justify-center">
              <Calculator size={14} /> Free Tool
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              Calculate your power needs
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Add your appliances to instantly see your total wattage and the recommended inverter size. No sign-up required.
            </p>
          </div>
          <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-[var(--shadow-card)]">
            <LumiVoltSizer />
          </div>
          <div className="mt-6 text-center">
            <Link to="/lumivolt#power-calculator" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Explore LumiVolt residential solar <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

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
