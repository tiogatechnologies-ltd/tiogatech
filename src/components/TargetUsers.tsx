import { Home, Building2, GraduationCap, Briefcase } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import imgHomes from "@/assets/bg-lagos-apartment.jpg";
import imgBusiness from "@/assets/bg-office.jpg";
import imgSchools from "@/assets/bg-team-meeting.jpg";
import imgOffices from "@/assets/bg-dashboard.jpg";

const defaultUsers = [
  { label: "Homes", desc: "Apartments, bungalows, and duplexes enjoying uninterrupted power and smart living." },
  { label: "Businesses", desc: "Lower energy costs and protected assets, around the clock." },
  { label: "Schools", desc: "Powered classrooms and secure campuses, every day." },
  { label: "Offices", desc: "Reliable power and modern security for productive teams." },
];

const icons = [Home, Building2, GraduationCap, Briefcase];
const images = [imgHomes, imgBusiness, imgSchools, imgOffices];

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
          <p className="text-muted-foreground text-lg leading-relaxed">A solution that fits, from a single room to a multi-story building.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((u: any, i: number) => {
            const Icon = icons[i % icons.length];
            const img = images[i % images.length];
            const isHomes = (u.label || "").toLowerCase() === "homes";
            return (
              <div
                key={i}
                className={`flip-card h-64 rounded-3xl ${isVisible ? (isHomes ? "animate-bounce-flip" : "animate-fade-up") : "opacity-0"}`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flip-card-inner rounded-3xl shadow-[var(--shadow-card)]">
                  {/* Front: image */}
                  <div className="flip-face rounded-3xl border border-border bg-card">
                    <img src={img} alt={u.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/20 to-transparent" />
                    <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-card/90 backdrop-blur flex items-center justify-center">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="block font-display font-semibold text-primary-foreground text-lg">{u.label}</span>
                    </div>
                  </div>
                  {/* Back: zoom-in description */}
                  <div className="flip-face flip-back rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mb-3">
                      <Icon size={22} className="text-primary-foreground" />
                    </div>
                    <span className="block font-display font-semibold text-lg mb-2">{u.label}</span>
                    <p className="text-primary-foreground/90 text-sm leading-relaxed">{u.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TargetUsers;
