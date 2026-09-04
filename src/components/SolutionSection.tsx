import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import featureSolar from "@/assets/bg-lumivolt-rooftop.jpg";
import featureApp from "@/assets/feature-smart-automation-device.jpg";
import featureSecurity from "@/assets/feature-cctv.jpg";
import { Sun, Smartphone, ShieldCheck, ArrowUpRight } from "lucide-react";

const features = [
  { icon: Sun, title: "Solar & Storage", desc: "Panels, batteries, inverters sized to your load.", img: featureSolar, to: "/catalog" },
  { icon: Smartphone, title: "Smart Automation", desc: "Lights, climate, and energy in one app.", img: featureApp, to: "/catalog" },
  { icon: ShieldCheck, title: "Modern Security", desc: "AI cameras and smart locks, 24/7 monitored.", img: featureSecurity, to: "/catalog" },
];

const SolutionSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("solution");

  const heading = content?.heading || "One system. Everything connected.";
  const description = content?.description || "Solar, automation, and security - designed and installed end-to-end.";

  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div ref={ref} className="relative section-container">
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Solutions</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.05] mb-5 tracking-tight text-foreground">
            {heading}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Link
              to={f.to}
              key={f.title}
              className={`group relative block rounded-3xl h-80 overflow-hidden border border-border shadow-[var(--shadow-card)] hover-lift ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <img src={f.img} alt={f.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-midnight/70" />
              <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                <f.icon size={20} className="text-primary" />
              </div>
              {/* Faded white side panel */}
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 dark:bg-card/90 border border-white/50 p-5 text-foreground">
                <h3 className="text-xl font-display font-semibold tracking-tight mb-1">{f.title}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{f.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  Explore <ArrowUpRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
