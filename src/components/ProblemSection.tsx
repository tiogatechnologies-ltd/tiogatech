import { Zap, Fuel, ShieldAlert, TrendingDown } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultProblems = [
  { title: "Unreliable Electricity", desc: "Nigeria averages just 4 to 6 hours of grid power daily. Constant blackouts disrupt your work, spoil food, and leave families in the dark." },
  { title: "Skyrocketing Fuel Costs", desc: "Generator fuel prices keep climbing. Many homes and businesses spend ₦50,000 to ₦200,000+ monthly on diesel and petrol." },
  { title: "Outdated Security", desc: "Traditional locks and basic CCTV won't stop modern threats. Without smart monitoring and real-time alerts, your property stays vulnerable." },
  { title: "Wasted Productivity", desc: "Every power outage means lost revenue for businesses, interrupted lessons for schools, and frustration at home." },
];

const icons = [Zap, Fuel, ShieldAlert, TrendingDown];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("problems");

  const heading = content?.heading || "Sound familiar?";
  const subtitle = content?.subtitle || "Millions of Nigerians deal with these challenges daily. If any of these hit close to home, you're not alone and there's a better way.";
  const items = content?.items || defaultProblems;

  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-destructive/5 blur-3xl pointer-events-none" />
      <div ref={ref} className="relative section-container">
        <div className={`max-w-2xl mb-14 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">The Problem</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05]">{heading}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((p: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className={`group relative rounded-2xl p-6 bg-card border border-border hover:border-primary/30 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 transition-all duration-500 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="text-base font-display font-semibold text-foreground mb-2">{p.title}</h3>
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
