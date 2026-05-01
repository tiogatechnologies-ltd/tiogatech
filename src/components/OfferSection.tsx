import { Sun, Cpu, Camera, Check } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultOffers = [
  { title: "Solar Inverter Systems", desc: "Say goodbye to generator noise and fuel costs.", highlights: ["Custom-sized for your load", "Lithium battery technology", "5 to 25 year warranty options", "Starts from ₦350,000"] },
  { title: "Smart Home Automation", desc: "Transform your space into an intelligent environment.", highlights: ["Mobile and voice control", "Scene scheduling and routines", "Works with existing wiring", "Single room to full house"] },
  { title: "CCTV and Smart Security", desc: "Protect what matters with smart locks, HD cameras, and real-time alerts.", highlights: ["Smart locks with biometric access", "24/7 HD recording and cloud storage", "Motion detection alerts", "Remote viewing from anywhere"] },
];

const icons = [Sun, Cpu, Camera];

const OfferSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("offers");
  const items = content?.items || defaultOffers;

  return (
    <section className="relative py-24 bg-muted overflow-hidden">
      <div ref={ref} className="relative section-container">
        <div className={`max-w-2xl mb-14 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">What We Offer</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05]">Solutions that work for you</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">Every installation is tailored to your space, budget, and lifestyle.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {items.map((o: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className={`group relative rounded-3xl border border-border bg-card p-8 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <Icon size={26} className="text-primary-foreground" />
                </div>
                <h3 className="relative text-2xl font-display font-semibold text-card-foreground mb-3 tracking-tight">{o.title}</h3>
                <p className="relative text-muted-foreground leading-relaxed mb-6">{o.desc}</p>
                <ul className="relative mt-auto space-y-3">
                  {(o.highlights || []).map((h: string, hi: number) => (
                    <li key={hi} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-primary" />
                      </span>
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OfferSection;
