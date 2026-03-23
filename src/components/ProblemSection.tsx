import { Zap, Fuel, ShieldAlert, TrendingDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultProblems = [
  { title: "Unreliable Electricity", desc: "Nigeria averages just 4–6 hours of grid power daily. Constant blackouts disrupt your work, spoil food, and leave families in the dark — costing you time and money every single day." },
  { title: "Skyrocketing Fuel Costs", desc: "Generator fuel prices keep climbing. Many homes and businesses spend ₦50,000–₦200,000+ monthly on diesel and petrol just to keep the lights on." },
  { title: "Outdated Security", desc: "Traditional locks and basic CCTV won't stop modern threats. Without smart monitoring, remote access, and real-time alerts, your property stays vulnerable." },
  { title: "Wasted Productivity", desc: "Every power outage means lost revenue for businesses, interrupted lessons for schools, and frustration at home." },
];

const icons = [Zap, Fuel, ShieldAlert, TrendingDown];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("problems");

  const heading = content?.heading || "Sound familiar?";
  const subtitle = content?.subtitle || "Millions of Nigerians deal with these challenges daily. If any of these hit close to home, you're not alone — and there's a better way.";
  const items = content?.items || defaultProblems;

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">The Problem</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4 max-w-lg">{heading}</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">{subtitle}</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((p: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className={`glass-card rounded-2xl p-6 space-y-4 ${isVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
