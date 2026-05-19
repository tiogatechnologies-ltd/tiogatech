import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgTechMesh from "@/assets/bg-circuit.jpg";
import SEO from "@/components/SEO";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-display font-bold text-foreground mb-3 no-clip">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base">{children}</div>
  </div>
);

const Privacy = () => (
  <div className="min-h-screen flex flex-col">
    <SEO title="Privacy Policy" description="How Tioga Technologies collects, uses and protects your information across our solar, smart lock and home automation services." path="/privacy" />
    <SiteHeader />
    <PageHero
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How Tioga Technologies collects, uses, and protects your information."
      backgroundImage={bgTechMesh}
      backgroundAlt="Abstract technology mesh"
    />
    <section className="section-padding">
      <div className="section-container max-w-3xl">
        <p className="text-xs text-muted-foreground mb-8">Last updated: May 6, 2026</p>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly, such as your name, phone number, email address, location, and project details when you submit a quote request, contact form, or interact with our team.</p>
          <p>We also automatically collect basic usage data such as pages visited, device type, and referrer to improve our services.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>Your information is used to respond to your inquiries, prepare quotes, schedule installations, send service updates, and improve our offerings. We may also use it to send relevant product news where you have given consent.</p>
        </Section>

        <Section title="3. Sharing of Information">
          <p>We do not sell your personal information. We may share limited data with trusted partners (installers, payment processors, communication providers) strictly to deliver the service you requested.</p>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>Your data is stored on secure infrastructure with industry-standard encryption in transit and at rest. Access is restricted to authorized staff only.</p>
        </Section>

        <Section title="5. Your Rights">
          <p>You may request access, correction, or deletion of your personal information at any time by emailing sales@tiogatechnologies.com.</p>
        </Section>

        <Section title="6. Cookies">
          <p>We use minimal cookies and similar technologies to maintain sessions and measure aggregate site performance. You can disable cookies in your browser at any time.</p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>We may update this policy from time to time. Material changes will be posted here with an updated revision date.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>For privacy questions, contact us at sales@tiogatechnologies.com or +234 817 800 0023.</p>
        </Section>
      </div>
    </section>
    <SiteFooter />
  </div>
);

export default Privacy;
