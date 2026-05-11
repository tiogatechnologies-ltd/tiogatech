import { useState } from "react";
import { Zap, Fuel, ShieldAlert, TrendingDown, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";
import bgTeam from "@/assets/bg-team.jpg";

const backImages = [bgSolarField, bgLagosNight, bgTechMesh, bgTeam];

const defaultProblems = [
  {
    title: "Unreliable Electricity",
    desc: "Nigeria averages just 4 to 6 hours of grid power daily. Constant blackouts disrupt your work, spoil food, and leave families in the dark.",
    solution: "Hybrid solar + battery systems deliver 18 to 24 hours of clean power, every day.",
  },
  {
    title: "Skyrocketing Fuel Costs",
    desc: "Generator fuel prices keep climbing. Many homes and businesses spend ₦50,000 to ₦200,000+ monthly on diesel and petrol.",
    solution: "Cut generator fuel use by up to 90%. Most systems pay for themselves in 24 to 36 months.",
  },
  {
    title: "Outdated Security",
    desc: "Traditional locks and basic CCTV won't stop modern threats. Without smart monitoring and real-time alerts, your property stays vulnerable.",
    solution: "AI cameras, smart locks and live alerts on your phone, monitored 24/7 from anywhere.",
  },
  {
    title: "Wasted Productivity",
    desc: "Every power outage means lost revenue for businesses, interrupted lessons for schools, and frustration at home.",
    solution: "One unified system keeps power, security and automation running silently in the background.",
  },
];

const icons = [Zap, Fuel, ShieldAlert, TrendingDown];

const ProblemSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("problems");
  const [flipped, setFlipped] = useState<number | null>(null);

  const heading = content?.heading || "Sound familiar?";
  const subtitle = content?.subtitle || "Millions of Nigerians deal with these challenges daily. If any of these hit close to home, you're not alone and there's a better way.";
  const items = content?.items || defaultProblems;

  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-destructive/5 blur-3xl pointer-events-none" />
      <div ref={ref} className="relative section-container">
        <div className={`max-w-2xl mb-14 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">The Problem</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05] no-clip">{heading}</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" style={{ perspective: "1200px" }}>
          {items.map((p: any, i: number) => {
            const Icon = icons[i % icons.length];
            const isFlipped = flipped === i;
            const solution = p.solution || defaultProblems[i % defaultProblems.length].solution;
            return (
              <div
                key={i}
                className={`group relative h-[260px] cursor-pointer ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 100}ms`, transformStyle: "preserve-3d" }}
                onClick={() => setFlipped(isFlipped ? null : i)}
                onMouseLeave={() => setFlipped(null)}
              >
                <div
                  className="relative w-full h-full transition-transform duration-700 ease-out"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                  onMouseEnter={() => setFlipped(i)}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 rounded-2xl p-6 bg-card border border-border shadow-[var(--shadow-card)]"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <h3 className="text-base font-display font-semibold text-foreground mb-2">{p.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                    <p className="absolute bottom-4 right-5 text-[10px] uppercase tracking-widest text-primary/60 font-semibold">Tap for solution</p>
                  </div>
                  {/* Back */}
                  <div
                    className="absolute inset-0 rounded-2xl p-6 bg-midnight text-primary-foreground border border-gold/30 shadow-2xl flex flex-col"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gold/80 mb-3">Tioga Solution</p>
                    <p className="text-gold font-display text-lg font-bold leading-snug">{solution}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-xs text-primary-foreground/70">
                      Learn more <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

