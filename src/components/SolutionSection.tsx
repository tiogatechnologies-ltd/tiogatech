import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import featureSolar from "@/assets/bg-lumivolt-rooftop.jpg";
import featureApp from "@/assets/feature-battery.jpg";
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
  const description = content?.description || "Solar, automation, and security — designed and installed end-to-end.";

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
              className={`flip-card block rounded-3xl h-80 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flip-card-inner rounded-3xl shadow-[var(--shadow-card)]">
                {/* Front */}
                <div className="flip-face rounded-3xl bg-card border border-border">
                  <img src={f.img} alt={f.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/30 to-transparent" />
                  <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <f.icon size={20} className="text-primary" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
                    <h3 className="text-2xl font-display font-semibold tracking-tight">{f.title}</h3>
                    <span className="text-xs uppercase tracking-widest text-primary-foreground/70 mt-1 block">Hover to learn more</span>
                  </div>
                </div>
                {/* Back */}
                <div className="flip-face flip-back rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 flex items-center justify-center mb-4">
                      <f.icon size={22} className="text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-display font-semibold mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-primary-foreground/90 leading-relaxed">{f.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    Explore <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
