import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import bgAutomation from "@/assets/bg-voltai-ai.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";
import { Lock, Lightbulb, Camera, Wifi, Cpu, Mic, Smartphone, Zap, Shield, ArrowRight, CheckCircle2, Sparkles, Download } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";

const pillars = [
  { icon: Lock, title: "Smart Locks & Access", desc: "Keyless entry, fingerprint and remote unlock for doors, gates and offices." },
  { icon: Lightbulb, title: "Smart Lighting", desc: "Scenes, schedules and motion-aware lights that match how you actually live." },
  { icon: Camera, title: "Cameras & Sensors", desc: "AI cameras, motion and door sensors with instant phone alerts." },
  { icon: Mic, title: "Voice & App Control", desc: "Run your home from one app, plus Alexa and Google Assistant routines." },
];

const features = [
  { icon: Wifi, title: "One Connected Hub", desc: "All your devices speak the same language through a single VoltAi hub." },
  { icon: Smartphone, title: "Control From Anywhere", desc: "iOS and Android apps with biometric lock and household sharing." },
  { icon: Zap, title: "Energy-Aware Scenes", desc: "Pairs with LumiVolt solar to dim, switch and prioritize devices automatically." },
  { icon: Shield, title: "Privacy First", desc: "Local processing where possible, encrypted streams, no data resold." },
];

const useCases = [
  "Wake-up scenes that raise lights and disarm cameras",
  "Auto-lock doors at night and on departure",
  "Notify your phone when the gate opens",
  "Cut non-essential loads when grid drops to battery",
  "Family profiles with personalized access codes",
  "Voice routines for cinema, dinner and goodnight",
];

const VoltAi = () => {
  const { content: cms } = useLandingContent("page_voltai");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="VoltAi — Smart Home Automation by Tioga" description="Smart locks, lights, cameras and sensors orchestrated through one app. AI-powered home automation by Tioga Technologies, built for Nigeria." path="/voltai" />
      <SiteHeader />

      <PageHero
        eyebrow={c.eyebrow || "A Tioga Sub-brand · Smart Automation"}
        title={c.title || "VoltAi — your home, intelligently automated"}
        subtitle={c.subtitle || "Locks, lights, cameras and sensors orchestrated through one app. Built to work seamlessly with LumiVolt solar."}
        backgroundImage={bgAutomation}
        backgroundAlt="Hand interacting with futuristic smart home control interface"
      >
        <Link
          to="/coming-soon"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 ios-press shadow-md shadow-primary/20"
        >
          <Download size={16} /> Download App
        </Link>
      </PageHero>

      {/* Pillars */}
      <section className="section-padding">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">What VoltAi Controls</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">Everything in your home, in one app</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6 ios-card">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                  <p.icon className="text-accent-foreground" size={22} />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual showcase */}
      <section className="relative section-padding overflow-hidden bg-midnight">
        <img src={bgTechMesh} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-25"  loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight/90 to-primary/30" />
        <div className="relative section-container grid gap-10 lg:grid-cols-2 items-center">
          <div className="text-primary-foreground">
            <p className="text-xs sm:text-sm font-semibold text-gold uppercase tracking-[0.2em] mb-3">The VoltAi Hub</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight no-clip mb-4">One brain. Every device.</h2>
            <p className="text-primary-foreground/75 leading-relaxed mb-6">
              VoltAi unifies door locks, lighting, cameras and sensors into a single experience. Set scenes once, then let your home anticipate the rest.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 p-4 ios-card">
                  <f.icon className="text-gold mb-2" size={20} />
                  <p className="font-display font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-primary-foreground/70 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={featureApp}
              alt="VoltAi smart automation app on phone"
              loading="lazy"
              className="rounded-3xl shadow-2xl border border-primary-foreground/15 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section-padding">
        <div className="section-container">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Everyday Scenes</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip mb-5">
                What VoltAi feels like, day to day
              </h2>
              <ul className="space-y-3">
                {useCases.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
            <img
              src={featureSecurity}
              alt="Smart home camera and security setup"
              loading="lazy"
              className="rounded-3xl shadow-[var(--shadow-card)] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-muted">
        <div className="section-container">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] text-center">
            <Cpu className="text-primary mx-auto mb-3" size={28} />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight mb-3">
              Ready to automate your home?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Tell us your space and we will design a VoltAi setup that fits, then install and tune it for you.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/coming-soon"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 ios-press shadow-md shadow-primary/20"
              >
                <Download size={16} /> Download App
              </Link>
              <Link
                to="/lumivolt"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted ios-press"
              >
                <Sparkles size={15} /> Pair with LumiVolt Solar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default VoltAi;
