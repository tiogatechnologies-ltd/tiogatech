import { MessageSquare, ClipboardCheck, Wrench, Headphones } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultSteps = [
  { title: "Tell us what you need", desc: "Answer a few quick questions about your power usage, automation goals, or security needs." },
  { title: "Get a custom recommendation", desc: "Our team designs a solution tailored to your property, budget, and lifestyle." },
  { title: "Professional installation", desc: "Our certified technicians handle everything, from wiring and panel mounting to smart device setup." },
  { title: "Ongoing support", desc: "Dedicated support, system monitoring, and maintenance to keep everything running smoothly." },
];

const icons = [MessageSquare, ClipboardCheck, Wrench, Headphones];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("how_it_works");
  const items = content?.items || defaultSteps;

  return (
    <section id="how-it-works" className="relative py-24 bg-background overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block" />
      <div ref={ref} className="relative section-container">
        <div className={`max-w-2xl mb-14 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05]">From inquiry to installation in 4 simple steps</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">We've made the process as smooth as possible.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((s: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className={`relative group ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="relative rounded-2xl bg-card border border-border p-6 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <Icon size={20} className="text-primary-foreground" />
                    </div>
                    <span className="text-4xl font-display font-bold text-primary/15 leading-none">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < items.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-primary/40 to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
