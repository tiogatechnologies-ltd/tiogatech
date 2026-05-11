import { Award, Users, Banknote, Clock } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultReasons = [
  { title: "Certified Products Only", desc: "Brands like Deye, Growatt, Tuya." },
  { title: "Trained Technicians", desc: "In-house certified professionals." },
  { title: "Transparent Pricing", desc: "No hidden fees. Flexible payment plans." },
  { title: "Ongoing Maintenance", desc: "Post-installation support and fast response." },
];

const icons = [Award, Users, Banknote, Clock];

const TrustSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("trust");
  const items = content?.items || defaultReasons;

  return (
    <section id="trust" className="section-padding bg-muted">
      <div ref={ref} className={`section-container ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Why Tioga</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">You're in safe hands</h2>
          <p className="text-muted-foreground">We're not just selling products. We're building long-term relationships.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((r: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand carousel — grayscale -> full color on hover */}
        <div className="mt-16">
          <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            Powered by industry-leading brands
          </p>
          <div
            className="relative overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="flex gap-12 animate-marquee whitespace-nowrap w-max">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex gap-12 items-center">
                  {[
                    "TUYA", "AlpSolarr", "ITEL", "SRNE", "Hikvision", "Tiandy",
                    "Dahua", "HDL", "Lux Power", "Bread", "Tiaco", "Fireman",
                    "LifeSmart", "Dawnice",
                  ].map((b) => (
                    <span
                      key={`${dup}-${b}`}
                      className="font-display font-bold text-lg sm:text-xl tracking-tight text-foreground/35 grayscale hover:grayscale-0 hover:text-foreground transition-all duration-300"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

