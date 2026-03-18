import { Home, Building2, GraduationCap, Briefcase } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const users = [
  { icon: Home, label: "Homes" },
  { icon: Building2, label: "Businesses" },
  { icon: GraduationCap, label: "Schools" },
  { icon: Briefcase, label: "Offices" },
];

const TargetUsers = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-background">
      <div ref={ref} className="section-container text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Who We Serve</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-12">Built for every space</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {users.map((u, i) => (
            <div
              key={u.label}
              className={`glass-card rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-[var(--shadow-elevated)] transition-shadow ${isVisible ? "animate-slide-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <u.icon size={26} className="text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">{u.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;
