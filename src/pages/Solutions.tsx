import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import { Sun, Home, ShieldCheck, Lightbulb, Lock, Camera, Wifi, Zap, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import featureSolar from "@/assets/feature-solar-panel.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";

const solutions = [
  {
    icon: Sun,
    eyebrow: "Solar Energy",
    title: "Reliable solar power, day and night",
    desc: "Custom-sized solar systems for homes and businesses. Panels, inverters, batteries, and monitoring engineered for the Nigerian climate.",
    points: [
      "Off-grid, hybrid and grid-tie systems",
      "AI-assisted sizing with LumiVolt",
      "2-year workmanship warranty",
      "Real-time performance monitoring",
    ],
    image: featureSolar,
  },
  {
    icon: Home,
    eyebrow: "Smart Home",
    title: "An intelligent home that runs itself",
    desc: "Turn any home into a connected experience. Lighting, locks, sensors and appliances orchestrated through one app and voice control.",
    points: [
      "Smart lighting and scenes",
      "Smart locks and access control",
      "Voice assistant integration",
      "Energy-aware automation",
    ],
    image: featureApp,
  },
  {
    icon: ShieldCheck,
    eyebrow: "Security",
    title: "Round-the-clock peace of mind",
    desc: "Professional-grade cameras, alarms and intercoms with cloud recording, mobile alerts and night vision tuned for African environments.",
    points: [
      "HD and 4K IP cameras",
      "Motion alerts on your phone",
      "Cloud and on-device recording",
      "Smart doorbells and intercoms",
    ],
    image: featureSecurity,
  },
];

const features = [
  { icon: Wifi, title: "Connected", desc: "Every device links into a single dashboard." },
  { icon: Zap, title: "Energy-aware", desc: "Automations follow your solar production." },
  { icon: Lock, title: "Secure by default", desc: "Encrypted comms and role-based access." },
  { icon: Lightbulb, title: "Made for Nigeria", desc: "Designed for grid realities and weather." },
];

const Solutions = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Solutions"
      title="One company. Solar, smart home and security."
      subtitle="Tioga Technologies builds and installs the full stack of intelligent home and business infrastructure across Nigeria."
    >
      <Link
        to="/contact"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
      >
        Get a Free Quote <ArrowRight size={16} />
      </Link>
      <Link
        to="/catalog"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
      >
        Browse Products
      </Link>
    </PageHero>

    <section className="section-padding">
      <div className="section-container space-y-6">
        {solutions.map((s, i) => (
          <div
            key={s.title}
            className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden relative grid md:grid-cols-12"
          >
            {/* Image side */}
            <div className={`relative h-48 md:h-auto md:col-span-5 ${i % 2 === 1 ? "md:order-2" : ""}`}>
              <img src={s.image} alt={s.eyebrow} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-midnight/85 via-midnight/30 to-transparent" />
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-gold/90 text-midnight px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] shadow">
                <s.icon size={12} /> {s.eyebrow}
              </div>
            </div>
            {/* Content side */}
            <div className="md:col-span-7 p-6 sm:p-10 grid gap-5 md:grid-cols-7 items-center">
              <div className="md:col-span-4">
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3 no-clip">
                  {s.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
              <ul className="md:col-span-3 grid gap-2.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Why Tioga</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Engineered to work together
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <f.icon className="text-primary" size={20} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
          <Camera className="text-primary mx-auto mb-3" size={28} />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3">
            Ready to design your system?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-7">
            Tell us what you'd like to power, secure or automate. Our team will tailor the perfect setup for your space.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
            >
              Talk to an Expert <ArrowRight size={16} />
            </Link>
            <Link
              to="/finance"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
            >
              See Finance Plans
            </Link>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default Solutions;
