import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgTechMesh from "@/assets/bg-circuit.jpg";
import SEO from "@/components/SEO";
import { useSiteContact } from "@/hooks/useSiteContact";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-display font-bold text-foreground mb-3 no-clip">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base">{children}</div>
  </div>
);

const Privacy = () => {
  const { contact } = useSiteContact();
  return (
  <div className="min-h-screen flex flex-col">
    <SEO title="Privacy Policy" description="How Tioga Technologies collects, uses and protects your information across our solar, smart lock and home automation services." path="/privacy" />
    <SiteHeader />
    <PageHero
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How Tioga Technologies collects, uses, and protects your information."
      backgroundImage={bgTechMesh}
      backgroundAlt="Abstract technology mesh"
    >
      <Link
        to="/contact"
        className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
      >
        Contact Legal & Support
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
      >
        Back to Home
      </Link>
    </PageHero>
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
          <p>You may request access, correction, or deletion of your personal information at any time by emailing {contact.email}.</p>
        </Section>

        <Section title="6. Cookies">
          <p>We use minimal cookies and similar technologies to maintain sessions and measure aggregate site performance. You can disable cookies in your browser at any time.</p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>We may update this policy from time to time. Material changes will be posted here with an updated revision date.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>For privacy questions, contact us at {contact.email} or {contact.phone}.</p>
        </Section>
      </div>
    </section>
    <SiteFooter />
  </div>
  );
};

export default Privacy;
