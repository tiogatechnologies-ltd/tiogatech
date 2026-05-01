import { Home, Building2, GraduationCap, Briefcase } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultUsers = [
  { label: "Homes", desc: "Apartments, bungalows, and duplexes enjoying uninterrupted power and smart living." },
  { label: "Businesses", desc: "Shops, warehouses, and restaurants cutting energy costs and protecting assets." },
  { label: "Schools", desc: "Powered classrooms, secure campuses, and lower running costs." },
  { label: "Offices", desc: "Reliable power, smart controls, and modern security for productive teams." },
];

const icons = [Home, Building2, GraduationCap, Briefcase];

const TargetUsers = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("target_users");
  const items = content?.items || defaultUsers;

  return (
    <section className="relative py-24 bg-muted overflow-hidden">
      <div ref={ref} className="relative section-container">
        <div className={`max-w-2xl mx-auto text-center mb-14 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Who We Serve</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4 tracking-tight leading-[1.05]">Built for every space</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">From a single room to a multi-story building, we have a solution that fits.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((u: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className={`group rounded-3xl bg-card border border-border p-6 sm:p-8 text-center hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-2 transition-all duration-500 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <Icon size={28} className="text-primary" />
                </div>
                <span className="block font-display font-semibold text-foreground text-lg mb-2">{u.label}</span>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{u.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;
