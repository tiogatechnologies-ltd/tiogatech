import { Home, Building2, GraduationCap, Briefcase } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultUsers = [
  { label: "Homes", desc: "Uninterrupted power and smart living." },
  { label: "Businesses", desc: "Lower energy costs, protected assets." },
  { label: "Schools", desc: "Powered classrooms, secure campuses." },
  { label: "Offices", desc: "Reliable power and modern security." },
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
                className={`group rounded-3xl bg-card border border-border p-6 sm:p-8 text-center card-hover hover:border-primary/40 ${isVisible ? "animate-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-105">
                    <Icon size={28} className="text-primary" />
                  </div>
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
