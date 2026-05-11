import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import featureSolar from "@/assets/feature-solar-panel.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import { Sun, Smartphone, ShieldCheck, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Sun,
    title: "Solar & Storage",
    desc: "High-efficiency panels, lithium batteries, and inverters sized to your exact load.",
    img: featureSolar,
    accent: "from-amber-400/30 to-yellow-300/10",
    to: "/catalog",
  },
  {
    icon: Smartphone,
    title: "Smart Automation",
    desc: "Control lights, climate, and energy from one app, anywhere in the world.",
    img: featureApp,
    accent: "from-primary/40 to-primary/10",
    to: "/catalog",
  },
  {
    icon: ShieldCheck,
    title: "Modern Security",
    desc: "AI cameras, smart locks, and 24/7 monitoring that keep your property safe.",
    img: featureSecurity,
    accent: "from-blue-500/30 to-blue-400/10",
    to: "/catalog",
  },
];

const SolutionSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("solution");

  const heading = content?.heading || "One system. Everything connected.";
  const description = content?.description || "Tioga combines solar energy, intelligent home automation, and modern security into a seamless experience — designed, installed, and supported end-to-end.";

  return (
    <section className="relative py-24 bg-background overflow-hidden">
      {/* Subtle decorative gradient */}
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
              className={`group relative block rounded-3xl overflow-hidden bg-card border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] hover:-translate-y-2 transition-all duration-500 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={f.img}
                  alt={f.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${f.accent} mix-blend-overlay`} />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <f.icon size={20} className="text-primary" />
                </div>
                {/* Sliding "Learn More" overlay */}
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out bg-midnight/85 backdrop-blur-sm py-3 px-5 flex items-center justify-between text-primary-foreground">
                  <span className="text-sm font-semibold">Learn More</span>
                  <ArrowUpRight size={16} className="text-gold" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-display font-semibold text-foreground">{f.title}</h3>
                  <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:rotate-12 transition-all flex-shrink-0 mt-1" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
