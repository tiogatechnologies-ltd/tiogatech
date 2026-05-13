import { Award, Users, Banknote, Clock } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgTechMesh from "@/assets/bg-polygons.jpg";
import logoGrowatt from "@/assets/brands/growatt.png";
import logoHikvision from "@/assets/brands/hikvision.png";
import logoDeye from "@/assets/brands/deye.png";
import logoItel from "@/assets/brands/itel.png";
import logoSrne from "@/assets/brands/srne.png";
import logoTiandy from "@/assets/brands/tiandy.png";
import logoAlpsolar from "@/assets/brands/alpsolar.jpeg";
import logoDahua from "@/assets/brands/dahua.png";

const brands = [
  { name: "Growatt", src: logoGrowatt },
  { name: "Hikvision", src: logoHikvision },
  { name: "Deye", src: logoDeye },
  { name: "Dahua", src: logoDahua },
  { name: "Tiandy", src: logoTiandy },
  { name: "SRNE", src: logoSrne },
  { name: "AlpSolar", src: logoAlpsolar },
  { name: "itel", src: logoItel },
];

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
              <div
                key={i}
                className="relative flex items-start gap-4 rounded-2xl border border-border bg-card p-6 overflow-hidden hover-lift"
              >
                {/* Subtle tech-mesh accent */}
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: `url(${bgTechMesh})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                <div className="relative">
                  <h3 className="font-display font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Brand carousel — logo-style tiles, grayscale -> color on hover */}
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
            <div className="flex gap-6 animate-marquee whitespace-nowrap w-max will-change-transform">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex gap-6 items-center">
                  {brands.map((b) => (
                    <div
                      key={`${dup}-${b.name}`}
                      className="group/logo flex items-center justify-center min-w-[160px] h-20 px-6 rounded-xl bg-card border border-border grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:border-primary/40 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all duration-500"
                    >
                      <img
                        src={b.src}
                        alt={`${b.name} logo`}
                        loading="lazy"
                        className="max-h-12 max-w-[130px] object-contain"
                      />
                    </div>
                  ))}
                </div>
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

