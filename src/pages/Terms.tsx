import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-display font-bold text-foreground mb-3 no-clip">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base">{children}</div>
  </div>
);

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The terms governing your use of Tioga Technologies' website and services."
      backgroundImage={bgLagosNight}
      backgroundAlt="Lagos skyline at night"
    />
    <section className="section-padding">
      <div className="section-container max-w-3xl">
        <p className="text-xs text-muted-foreground mb-8">Last updated: May 6, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using the Tioga Technologies website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </Section>

        <Section title="2. Services">
          <p>We provide solar power, smart home automation, and security solutions, including consultation, installation, and post-installation support across Nigeria. All quotes are subject to a site assessment.</p>
        </Section>

        <Section title="3. Quotes and Pricing">
          <p>All prices are quoted in Naira (NGN) and are valid for 14 days unless otherwise stated. Final pricing may vary based on site conditions, equipment availability, and selected payment plan.</p>
        </Section>

        <Section title="4. Payment Plans">
          <p>Installation requires a 30% deposit. The balance is paid in agreed installments per the selected finance plan. Late payments may attract reasonable administration fees.</p>
        </Section>

        <Section title="5. Warranty">
          <p>Products carry the original manufacturer warranty (typically 1 to 5 years) plus a 2-year workmanship warranty on installation. Damage caused by misuse or third-party modifications is not covered.</p>
        </Section>

        <Section title="6. Customer Responsibilities">
          <p>You agree to provide accurate information about your premises, grant safe access during installation, and operate the system within manufacturer guidelines.</p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>To the extent permitted by law, Tioga Technologies is not liable for indirect, incidental, or consequential damages arising from use of our services. Total liability is limited to the amount paid for the specific service.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>All website content, branding, and materials are the property of Tioga Technologies and may not be reproduced without permission.</p>
        </Section>

        <Section title="9. Governing Law">
          <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in the courts of Lagos State.</p>
        </Section>

        <Section title="10. Contact">
          <p>For questions about these terms, contact sales@tiogatechnologies.com.</p>
        </Section>
      </div>
    </section>
    <SiteFooter />
  </div>
);

export default Terms;
