import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How much does a solar system cost?",
    a: "It depends on your power needs. A basic backup system for lights and fans starts from around ₦350,000, while a full off-grid system for ACs and heavy appliances ranges from ₦1.5M–₦5M+. We'll design the best option for your budget after understanding your needs.",
  },
  {
    q: "How long does installation take?",
    a: "Most residential installations are completed within 1–3 days. Larger commercial projects may take up to a week. We handle everything from delivery to final testing.",
  },
  {
    q: "Do you offer payment plans or financing?",
    a: "Yes! We offer flexible payment options including installment plans on select packages. Reach out to our sales team for details on available financing.",
  },
  {
    q: "What happens if something breaks or stops working?",
    a: "All our products come with manufacturer warranties (typically 1–5 years depending on the product). We also provide after-sales support and maintenance services to keep your system running perfectly.",
  },
  {
    q: "Can I start with one solution and add more later?",
    a: "Absolutely. Many customers start with solar and later add smart home automation or security. Our systems are designed to be modular and expandable.",
  },
  {
    q: "Do you cover my area?",
    a: "We currently serve Lagos, Abuja, and surrounding areas, with plans to expand nationwide. Enter your location in the form and we'll confirm coverage for you.",
  },
  {
    q: "Will solar work during rainy season?",
    a: "Yes. While solar panels produce less energy on cloudy days, our systems include battery storage that keeps you powered through the night and low-sun periods. We size your battery bank to handle Nigeria's weather patterns.",
  },
  {
    q: "What smart home features can I control from my phone?",
    a: "Lights, switches, AC, curtains, fans, water heaters, gate motors, and more. You can create schedules, set scenes (e.g. 'Good Night' turns off all lights), and control everything remotely from anywhere in the world.",
  },
];

const FAQSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className={`section-container max-w-3xl ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Got questions? We've got answers.
          </h2>
          <p className="text-muted-foreground">
            Here are the most common things people ask before getting started.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground font-display font-semibold">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
