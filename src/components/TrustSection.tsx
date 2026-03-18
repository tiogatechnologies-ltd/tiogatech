import { Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  "Reliable, certified products",
  "Professional installation by trained technicians",
  "Ongoing maintenance and support",
  "Transparent pricing — no hidden fees",
];

const TrustSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-muted">
      <div ref={ref} className={`section-container max-w-2xl ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Why Tioga</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          You're in safe hands
        </h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check size={14} className="text-primary" />
              </div>
              <span className="text-foreground font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default TrustSection;
