import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgOffice from "@/assets/bg-office.jpg";
import SEO from "@/components/SEO";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-display font-bold text-foreground mb-3 no-clip">{title}</h2>
    <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base">{children}</div>
  </div>
);

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <SEO title="Terms of Service" description="The terms governing your use of Tioga Technologies' website, products and installation services." path="/terms" />
    <SiteHeader />
    <PageHero
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The terms governing your use of Tioga Technologies' website and services."
      backgroundImage={bgOffice}
      backgroundAlt="Modern Lagos office at dusk"
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

        <Section title="8. Installment Payments & Direct Debit Authorization">
          <p><strong>8.1</strong> Installment plans ("Flexible Payment") are offered subject to eligibility review by Tioga Technologies and/or its finance partner.</p>
          <p><strong>8.2</strong> A non-refundable deposit (typically 30% of the total amount) is required before installation or delivery of financed assets.</p>
          <p><strong>8.3</strong> The customer authorizes Tioga Technologies to collect scheduled installments on the agreed due dates for the agreed amounts and duration.</p>
          <p><strong>8.4</strong> Where the customer elects auto-debit, card details are stored by our payment processor (Paystack), a PCI-DSS Level 1 certified provider. Tioga Technologies does not store card numbers, CVVs or expiry dates.</p>
          <p><strong>8.5</strong> Each auto-debit charge will equal the installment amount displayed at the time of enrollment. A reminder will be sent by email approximately 24 hours before every scheduled charge.</p>
          <p><strong>8.6</strong> If a card cannot be silently charged (for example because it requires bank OTP authentication or is not enrolled for recurring debits), Tioga Technologies will automatically send a manual payment link for that installment instead of retrying silently.</p>
          <p><strong>8.7</strong> Failed charges may be retried up to three (3) times. After three failed attempts on any installment, the installment will be marked overdue and a manual payment link will be issued.</p>
          <p><strong>8.8</strong> Late payments may attract reasonable administration fees. Persistent default may result in referral to collections and/or repossession of financed assets to the extent permitted by law.</p>
          <p><strong>8.9</strong> The customer may cancel future auto-debits at any time by writing to <a className="underline" href="mailto:tiogatechnologies@gmail.com">tiogatechnologies@gmail.com</a>. Cancelling auto-debit does not cancel the underlying obligation to pay outstanding installments; the customer remains responsible for settling the balance manually.</p>
          <p><strong>8.10</strong> Refunds and chargebacks are processed in accordance with our Refund Policy and Paystack's rules. Where a successful installment is refunded, the corresponding installment will be reopened.</p>
          <p><strong>8.11 Early liquidation.</strong> The customer may liquidate (pay off in full) any active asset-financing loan at any time. The liquidation amount equals the outstanding principal balance plus the interest attributable to the current month only. No prepayment penalty applies. Upon successful liquidation the loan is marked complete and no further installments are due.</p>
        </Section>

        <Section title="9. Intellectual Property">
          <p>All website content, branding, and materials are the property of Tioga Technologies and may not be reproduced without permission.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in the courts of Lagos State.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these terms, contact sales@tiogatechnologies.com.</p>
        </Section>
      </div>
    </section>
    <SiteFooter />
  </div>
);

export default Terms;
