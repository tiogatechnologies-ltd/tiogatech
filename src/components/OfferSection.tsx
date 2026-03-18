import { Sun, Cpu, Camera } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const offers = [
  { icon: Sun, title: "Solar Inverter Systems", desc: "Complete solar power solutions tailored to your energy needs." },
  { icon: Cpu, title: "Smart Home Automation", desc: "Control your lights, AC, and appliances from your phone." },
  { icon: Camera, title: "CCTV & Smart Security", desc: "24/7 monitoring with intelligent alert systems." },
];

const OfferSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">What We Offer</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-12">
          Solutions that work for you
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {offers.map((o, i) => (
            <div
              key={o.title}
              className={`group rounded-2xl border border-border bg-card p-8 hover:shadow-[var(--shadow-elevated)] transition-shadow duration-300 ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <o.icon size={26} className="text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-card-foreground mb-2">{o.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferSection;
