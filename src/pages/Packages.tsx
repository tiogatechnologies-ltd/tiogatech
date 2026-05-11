import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import { ArrowRight, Sun, Home, ShieldCheck, Sparkles, Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { openLeadForm } from "@/components/SiteHeader";
import featureSolar from "@/assets/feature-solar-panel.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";

import bgLagosNight from "@/assets/bg-lagos-night.jpg";

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
    bg: bgSolarField,
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
    bg: featureApp,
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
    bg: featureSecurity,
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
    bg: bgLagosNight,
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
            className="group relative rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col"
          >
            {/* Image header */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={p.bg}
                alt=""
                aria-hidden
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/55 to-midnight/20" />
              <div className="absolute inset-0 flex items-end justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gold/95 flex items-center justify-center shadow-lg">
                    <p.icon className="text-midnight" size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/75">{p.tagline}</p>
                    <h3 className="text-xl font-display font-bold text-primary-foreground no-clip leading-tight">{p.name}</h3>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-midnight bg-gold px-2.5 py-1 rounded-full shadow">
                  {p.badge}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 flex flex-col flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Starting from <span className="text-foreground font-bold text-base">{p.priceFrom}</span>
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
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
