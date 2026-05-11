import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import { ArrowRight, Sun, Home, ShieldCheck, Sparkles, Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";
import featureSolar from "@/assets/feature-solar-panel.jpg";

const packages = [
  {
    icon: Sun,
    name: "Starter Solar",
    badge: "Most Popular",
    tagline: "For small homes & flats",
    priceFrom: "₦1.45M",
    points: [
      "1.5 to 2 kWp solar array",
      "3 kVA hybrid inverter",
      "5 kWh lithium battery",
      "Powers fans, TV, lights, fridge",
      "Installation + 2-year warranty",
    ],
    accent: "from-accent/20 to-accent/5",
  },
  {
    icon: Home,
    name: "Smart Home Essentials",
    badge: "Lifestyle",
    tagline: "For modern apartments",
    priceFrom: "₦950K",
    points: [
      "Smart locks (front + back door)",
      "6 smart bulbs + 2 smart switches",
      "Voice + app control",
      "Scenes for morning, away, night",
      "Tuya / HDL ecosystem",
    ],
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: ShieldCheck,
    name: "Total Security",
    badge: "Peace of Mind",
    tagline: "For homes & small offices",
    priceFrom: "₦1.2M",
    points: [
      "4-channel HD CCTV system",
      "Smart doorbell + intercom",
      "Motion alerts to your phone",
      "Cloud + 1TB on-device storage",
      "Night-vision tuned for Nigeria",
    ],
    accent: "from-secondary/20 to-secondary/5",
  },
  {
    icon: Sparkles,
    name: "Whole-Home Combo",
    badge: "Best Value",
    tagline: "Solar + Smart + Security",
    priceFrom: "₦4.8M",
    points: [
      "5 kWp hybrid solar system",
      "10 kWh lithium battery",
      "Smart lighting throughout",
      "8-channel CCTV + smart locks",
      "Single dashboard, single team",
    ],
    accent: "from-gold/25 to-primary/10",
  },
];

const Packages = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Packages"
      title="Curated bundles. No guesswork."
      subtitle="Hand-picked combinations of solar, smart and security gear for the most common Nigerian homes and businesses. Every package is installable next week."
      backgroundImage={featureSolar}
      backgroundAlt="Curated solar and smart home packages"
    >
      <button
        onClick={() => openLeadForm("packages_hero")}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
      >
        <Sparkles size={16} /> Get AI Recommendation
      </button>
      <Link
        to="/contact"
        className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
      >
        Talk to an Expert <ArrowRight size={16} />
      </Link>
    </PageHero>

    <section className="section-padding">
      <div className="section-container grid gap-6 sm:grid-cols-2">
        {packages.map((p) => (
          <div
            key={p.name}
            className="relative rounded-3xl border border-border bg-card p-7 sm:p-8 shadow-[var(--shadow-card)] hover-lift overflow-hidden"
          >
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${p.accent} blur-3xl pointer-events-none`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <p.icon className="text-primary" size={22} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">
                  {p.badge}
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">{p.tagline}</p>
              <h3 className="text-2xl font-display font-bold text-foreground mb-2 no-clip">{p.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Starting from <span className="text-foreground font-bold">{p.priceFrom}</span>
              </p>
              <ul className="space-y-2.5 mb-6">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openLeadForm(`package_${p.name}`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
              >
                Customize this package <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-card)]">
          <Zap className="text-gold mx-auto mb-3" size={28} />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3 no-clip">
            Need something different?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-7">
            Tell us your load profile and goals. Our LumiVolt AI will design a custom package just for you in under 2 minutes.
          </p>
          <button
            onClick={() => openLeadForm("packages_cta")}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
          >
            <Sparkles size={16} /> Build my custom package
          </button>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default Packages;
