import { MessageSquare, ClipboardCheck, Wrench } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: MessageSquare, title: "Tell us what you need", desc: "Answer a few quick questions about your power and security needs." },
  { icon: ClipboardCheck, title: "Get a custom recommendation", desc: "We design a solution tailored to your budget and property." },
  { icon: Wrench, title: "Installation & setup", desc: "Professional installation with ongoing support included." },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-muted">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">How It Works</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-12">
          Three simple steps
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`flex flex-col items-start ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <s.icon size={20} className="text-primary-foreground" />
                </div>
                <span className="text-3xl font-display font-bold text-primary/20">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
