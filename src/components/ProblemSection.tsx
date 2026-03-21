import { Zap, Fuel, ShieldAlert, TrendingDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const problems = [
  {
    icon: Zap,
    title: "Unreliable Electricity",
    desc: "Nigeria averages just 4–6 hours of grid power daily. Constant blackouts disrupt your work, spoil food, and leave families in the dark — costing you time and money every single day.",
  },
  {
    icon: Fuel,
    title: "Skyrocketing Fuel Costs",
    desc: "Generator fuel prices keep climbing. Many homes and businesses spend ₦50,000–₦200,000+ monthly on diesel and petrol just to keep the lights on. That's money you could be saving or investing.",
  },
  {
    icon: ShieldAlert,
    title: "Outdated Security",
    desc: "Traditional locks and basic CCTV won't stop modern threats. Without smart monitoring, remote access, and real-time alerts, your property stays vulnerable — especially when you're away.",
  },
  {
    icon: TrendingDown,
    title: "Wasted Productivity",
    desc: "Every power outage means lost revenue for businesses, interrupted lessons for schools, and frustration at home. Unreliable power isn't just inconvenient — it holds you back from growing.",
  },
];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">The Problem</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4 max-w-lg">
          Sound familiar?
        </h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Millions of Nigerians deal with these challenges daily. If any of these hit close to home, you're not alone — and there's a better way.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
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
