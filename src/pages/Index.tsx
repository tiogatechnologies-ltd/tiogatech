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
