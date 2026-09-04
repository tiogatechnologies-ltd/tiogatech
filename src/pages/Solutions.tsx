import { Link } from "react-router-dom";
import { Sun, Home, Shield, Cpu, Zap, ArrowRight, CheckCircle2, ShoppingBag, Calculator, Layers, Award, HardHat } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import bgTechMesh from "@/assets/bg-topo-lines.jpg";
import bgResidential from "@/assets/bg-lumivolt-residential.jpg";
import bgAutomation from "@/assets/bg-voltai-ai.jpg";
import featureCctv from "@/assets/feature-cctv.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";

const SOLUTIONS = [
  {
    id: "solar-energy",
    title: "Clean Solar Energy & Storage",
    brand: "LumiVolt",
    desc: "Tier-1 Deye hybrid inverters, Felicity LiFePO4 batteries, and Longi high-yield solar arrays engineered for uninterrupted 24/7 power.",
    link: "/solar-packages",
    image: bgResidential,
    highlights: ["0-millisecond UPS grid transfer", "Up to 5-year replacement warranty", "Over 90% fuel expense reduction", "Free professional load sizing"],
  },
  {
    id: "smart-automation",
    title: "Smart Home IoT & Voice Automation",
    brand: "VoltAi",
    desc: "Intelligent scene controllers, smart lighting glass switches, automated motorized curtain tracks, and climate management in one app.",
    link: "/home-automation",
    image: bgAutomation,
    highlights: ["Local offline execution", "Tuya, Alexa, Google Home integration", "Motion-activated welcome scenes", "Energy-prioritized load shedding"],
  },
  {
    id: "smart-security",
    title: "Biometric Smart Locks & AI CCTV",
    brand: "STAMA & Security",
    desc: "3D structured-light facial recognition locks, biometric semiconductors, and 24/7 ColorVu perimeter security cameras.",
    link: "/smart-locks",
    image: featureCctv,
    highlights: ["Anti-tamper cloud phone alerts", "Remote OTP & visitor log sync", "Full-color night vision cameras", "Bank-grade data encryption"],
  },
];

export const Solutions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Engineering Solutions - Solar, IoT Automation & Biometric Security"
        description="Explore Tioga's complete ecosystem of renewable solar energy, smart home automation, and security infrastructure built for Nigerian living."
        path="/solutions"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Solutions", path: "/solutions" }]),
          serviceJsonLd({
            name: "Tioga Integrated Engineering Solutions",
            description: "Turnkey renewable energy, home IoT, and biometric security infrastructure.",
            path: "/solutions",
            serviceType: "Smart Living and Renewable Energy Engineering",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Integrated Engineering Ecosystem"
        title="Complete Solutions for Smarter, Powered Living"
        subtitle="We engineer the three vital pillars of modern living: clean continuous solar energy, intelligent home automation, and military-grade biometric access control."
        backgroundImage={bgTechMesh}
        backgroundAlt="High tech topology visualization representing Tioga integrated infrastructure"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("solutions_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
          >
            Request Complete System Consultation
          </button>
          <Link
            to="/retail"
            className="inline-flex items-center gap-2 rounded-full bg-midnight/70 backdrop-blur-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-midnight/90 hover:border-white/50 shadow-lg shadow-black/20 transition-all"
          >
            <ShoppingBag size={16} /> Explore Retail Hardware
          </Link>
        </div>
      </PageHero>

      {/* 3 Core Pillars Showcase */}
      <main className="flex-1 section-padding py-16">
        <div className="section-container space-y-16">
          {SOLUTIONS.map((sol, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={sol.id}
                className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 rounded-3xl bg-card border border-border/80 shadow-[var(--shadow-card)]"
              >
                <div className={`lg:col-span-6 space-y-5 ${isEven ? "order-1" : "order-1 lg:order-2"}`}>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {sol.brand}
                  </span>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
                    {sol.title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {sol.desc}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 py-2">
                    {sol.highlights.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/90 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <Link
                      to={sol.link}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                    >
                      <span>Explore {sol.brand}</span>
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => openLeadForm(`solution_${sol.id}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                    >
                      <span>Book Survey</span>
                    </button>
                  </div>
                </div>

                <div className={`lg:col-span-6 ${isEven ? "order-2" : "order-2 lg:order-1"}`}>
                  <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] border border-border shadow-lg">
                    <img
                      src={sol.image}
                      alt={sol.title}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Solutions;
