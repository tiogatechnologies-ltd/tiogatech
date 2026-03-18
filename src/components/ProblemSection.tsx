import { Zap, Fuel, ShieldAlert } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const problems = [
  { icon: Zap, title: "Unreliable Electricity", desc: "Constant power outages disrupting your daily life and work." },
  { icon: Fuel, title: "High Fuel Costs", desc: "Generator fuel bills eating into your income every month." },
  { icon: ShieldAlert, title: "Poor Security", desc: "Outdated security leaving your property vulnerable." },
];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">The Problem</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-12 max-w-lg">
          Are you dealing with any of these?
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className={`glass-card rounded-2xl p-6 space-y-4 ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <p.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">{p.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
