import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const defaultFaqs = [
  { q: "How much does a solar system cost?", a: "A basic backup starts from ₦350,000, while full off-grid ranges from ₦1.5M–₦5M+." },
  { q: "How long does installation take?", a: "Most residential installations are completed within 1–3 days." },
  { q: "Do you offer payment plans?", a: "Yes! We offer flexible payment options including installment plans." },
  { q: "What happens if something breaks?", a: "All products come with manufacturer warranties (1–5 years) plus after-sales support." },
  { q: "Can I start with one solution and add more later?", a: "Absolutely. Our systems are modular and expandable." },
  { q: "Do you cover my area?", a: "We currently serve Lagos, Abuja, and surrounding areas." },
  { q: "Will solar work during rainy season?", a: "Yes. Battery storage keeps you powered through low-sun periods." },
  { q: "What smart home features can I control?", a: "Lights, switches, AC, curtains, fans, water heaters, gate motors, and more." },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("faq");
  const faqs = content?.items || defaultFaqs;

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className={`section-container max-w-3xl ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">Got questions? We've got answers.</h2>
          <p className="text-muted-foreground">Here are the most common things people ask before getting started.</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq: any, i: number) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground font-display font-semibold">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
