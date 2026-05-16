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
import logoTuya from "@/assets/brands/tuya.png";
import logoLifesmart from "@/assets/brands/lifesmart.png";
import logoLuxpower from "@/assets/brands/luxpower.jpg";
import logoHdl from "@/assets/brands/hdl.jpg";

const brands = [
  { name: "Tuya", src: logoTuya },
  { name: "Growatt", src: logoGrowatt },
  { name: "Hikvision", src: logoHikvision },
  { name: "Deye", src: logoDeye },
  { name: "Dahua", src: logoDahua },
  { name: "LuxPower", src: logoLuxpower },
  { name: "HDL", src: logoHdl },
  { name: "LifeSmart", src: logoLifesmart },
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
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">You are in safe hands</h2>
          <p className="text-muted-foreground">We are not just selling products. We are building long-term relationships.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((r: any, i: number) => {
            const Icon = icons[i % icons.length];
            return (
              <div
                key={i}
                className="transient-gradient group relative flex items-start gap-4 rounded-2xl border border-border p-6 overflow-hidden"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 45%, hsl(var(--primary) / 0.10) 70%, hsl(var(--accent) / 0.18) 100%)",
                }}
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
                <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-colors duration-500 group-hover:bg-primary/20">
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
            className="relative overflow-hidden marquee-pause"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="flex animate-marquee whitespace-nowrap w-max will-change-transform">
              {[...brands, ...brands].map((b, i) => (
                <div
                  key={i}
                  className="mx-2 flex items-center justify-center min-w-[110px] h-12 px-4 rounded-lg bg-card border border-border grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-500"
                >
                  <img
                    src={b.src}
                    alt={`${b.name} logo`}
                    loading="lazy"
                    className="max-h-7 max-w-[88px] object-contain"
                  />
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

