import { Sun, Cpu, Camera } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const offers = [
  {
    icon: Sun,
    title: "Solar Inverter Systems",
    desc: "Say goodbye to generator noise and fuel costs. Our solar systems are designed to power your entire home or business — from lights and fans to ACs, fridges, and water pumps. We offer full off-grid, hybrid, and backup solutions with top-tier lithium batteries and panels built for Nigeria's climate.",
    highlights: ["Custom-sized for your load", "Lithium battery technology", "5–25 year warranty options", "Starts from ₦350,000"],
  },
  {
    icon: Cpu,
    title: "Smart Home Automation",
    desc: "Transform your space into an intelligent environment. Control your lights, switches, AC, curtains, and appliances from your phone or with voice commands — whether you're at home or anywhere in the world. Perfect for modern homes, shortlets, and offices.",
    highlights: ["Mobile & voice control", "Scene scheduling & routines", "Works with existing wiring", "Single room to full house"],
  },
  {
    icon: Camera,
    title: "CCTV & Smart Security",
    desc: "Protect what matters with smart locks, HD cameras, and real-time alerts. Our security systems feature fingerprint, face recognition, and app-controlled access — so you always know who's at your door. Ideal for homes, offices, Airbnbs, and hotels.",
    highlights: ["Smart locks with biometric access", "24/7 HD recording & cloud storage", "Motion detection alerts", "Remote viewing from anywhere"],
  },
];

const OfferSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">What We Offer</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
          Solutions that work for you
        </h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Every installation is tailored to your space, budget, and lifestyle. Here's what we bring to the table.
        </p>
        <div className="grid lg:grid-cols-3 gap-6">
          {offers.map((o, i) => (
            <div
              key={o.title}
              className={`group rounded-2xl border border-border bg-card p-8 hover:shadow-[var(--shadow-elevated)] transition-shadow duration-300 flex flex-col ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <o.icon size={26} className="text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-card-foreground mb-3">{o.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{o.desc}</p>
              <ul className="mt-auto space-y-2">
                {o.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferSection;
