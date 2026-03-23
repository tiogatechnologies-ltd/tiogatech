import { Home, Building2, GraduationCap, Briefcase } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultUsers = [
  { label: "Homes", desc: "Apartments, bungalows, duplexes — enjoy uninterrupted power and smart living." },
  { label: "Businesses", desc: "Shops, warehouses, restaurants — cut energy costs and protect your assets." },
  { label: "Schools", desc: "Keep classrooms powered, secure campuses, and reduce running costs." },
  { label: "Offices", desc: "Stay productive with reliable power, smart controls, and modern security." },
];

const icons = [Home, Building2, GraduationCap, Briefcase];

const TargetUsers = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("target_users");
  const items = content?.items || defaultUsers;

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Who We Serve</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">Built for every space</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">Whether it's a single room or a multi-story building, we have a solution that fits.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {items.map((u: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className={`glass-card rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-elevated)] transition-shadow ${isVisible ? "animate-slide-up" : "opacity-0"}`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon size={26} className="text-primary" />
                </div>
                <span className="font-display font-semibold text-foreground">{u.label}</span>
                <p className="text-muted-foreground text-xs leading-relaxed">{u.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;
