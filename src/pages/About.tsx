import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroSmartHome from "@/assets/bg-about-hero.jpg";
import bgTechMesh from "@/assets/bg-topo-lines.jpg";
import bgSolarField from "@/assets/bg-solar-aerial.jpg";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";
import bgTeam from "@/assets/bg-team.jpg";
import { Target, Eye, Wifi, Cpu, Zap, ArrowRight, Globe2, Sparkles, Shield, Leaf, Users, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";

const pillars = [
  {
    icon: Wifi,
    title: "IoT Infrastructure Development",
    desc: "We build robust, scalable IoT infrastructure that connects renewable energy systems, enabling real-time monitoring, data collection, and intelligent decision-making. Our infrastructure solutions are designed to handle the unique challenges of renewable energy distribution in Africa.",
    bg: bgTechMesh,
  },
  {
    icon: Cpu,
    title: "Embedded Systems Engineering",
    desc: "Our team develops custom embedded systems for energy management applications, including monitoring devices, control systems, and intelligent sensors. These systems are optimized for reliability, efficiency, and long-term operation in diverse environmental conditions.",
    bg: bgLagosNight,
  },
  {
    icon: Zap,
    title: "Renewable Energy Management Platforms",
    desc: "We create next-generation platforms for managing renewable energy resources, optimizing distribution, predicting demand, and ensuring reliable power supply. Our intelligent systems help maximize the efficiency and reliability of clean energy infrastructure.",
    bg: bgSolarField,
  },
];

const values = [
  { icon: Shield, title: "Reliability First", desc: "Every system we ship is engineered for harsh African conditions, with redundancy and remote diagnostics built in from day one." },
  { icon: Leaf, title: "Sustainable by Design", desc: "Clean energy is the goal, not just a feature. We optimize every kilowatt to displace fossil-fuel generation." },
  { icon: Users, title: "African Talent", desc: "Built by Nigerian engineers for African realities. We invest in local skills and long-term capability." },
  { icon: Sparkles, title: "Intelligent Software", desc: "Our platforms turn raw sensor data into decisions: predictive maintenance, demand forecasting, and adaptive control." },
];

const partners = [
  { icon: Zap, label: "Energy Providers" },
  { icon: Building2, label: "Governments" },
  { icon: Users, label: "Communities" },
  { icon: Globe2, label: "NGOs & Operators" },
];

const About = () => {
  const { content: cms } = useLandingContent("page_about");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  return (
  <div className="min-h-screen flex flex-col">
   <SEO
     title="About Tioga Technologies"
     description="Tioga Technologies builds IoT infrastructure, embedded systems and renewable energy management platforms across Africa, from Jos to Lagos and beyond."
     path="/about"
   />
   <SiteHeader />
    <PageHero
      eyebrow={c.eyebrow || "About Tioga Technologies"}
      title={c.title || "Powering Africa's clean energy transition"}
      subtitle={c.subtitle || "Tioga Technologies Ltd is an IoT infrastructure and embedded systems company building the intelligent backbone of Africa's renewable energy future."}
      backgroundImage={heroSmartHome}
      backgroundAlt="Modern smart home with rooftop solar at golden hour"
    />

    {/* Intro */}
    <section className="section-padding">
      <div className="section-container max-w-4xl">
        <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Who we are</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-5 no-clip">
          Engineering the infrastructure behind clean energy
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-base sm:text-lg">
          <p>
            Tioga Technologies Ltd is an IoT infrastructure and embedded systems company specializing in the development of core infrastructure around IoT, embedded systems, and intelligent renewable energy solutions.
          </p>
          <p>
            We are at the forefront of cutting-edge next-generation renewable energy management platforms designed to power Africa's clean energy transition, from individual homes in Lagos to grid-scale operators across the continent.
          </p>
        </div>
      </div>
    </section>

    {/* Mission + Vision */}
    <section className="section-padding bg-muted pt-0">
      <div className="section-container grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] hover-lift">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="text-primary" size={22} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            To accelerate Africa's transition to clean, renewable energy through innovative IoT infrastructure and intelligent energy management solutions. We develop scalable, reliable systems that enable efficient distribution and management of renewable energy resources across the continent.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] hover-lift">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Eye className="text-primary" size={22} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every community across Africa with access to reliable, clean, and intelligent energy systems, managed through world-class infrastructure built on the continent, for the continent.
          </p>
        </div>
      </div>
    </section>

    {/* What we do — Pillars */}
    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">What we do</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">Three Pillars of Innovation</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            From silicon to software, we cover the full stack required to make renewable energy reliable at scale.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="group relative rounded-2xl border border-border overflow-hidden hover-lift min-h-[320px]">
              <img src={p.bg} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/85 to-midnight/60" />
              <div className="relative p-6 sm:p-7 h-full flex flex-col justify-end text-primary-foreground">
                <div className="w-12 h-12 rounded-xl bg-gold text-midnight flex items-center justify-center shadow-lg mb-4">
                  <p.icon size={22} />
                </div>
                <h3 className="text-lg font-display font-bold mb-1.5 no-clip">{p.title}</h3>
                <p className="text-primary-foreground/80 leading-relaxed text-sm">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Team imagery */}
        <div className="mt-10 relative rounded-3xl overflow-hidden border border-border h-56 sm:h-72">
          <img src={bgTeam} alt="Tioga Technologies team" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/90 via-midnight/50 to-transparent" />
          <div className="relative h-full p-7 sm:p-10 flex flex-col justify-center max-w-md text-primary-foreground">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold mb-2 font-bold">Our People</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold leading-tight no-clip">A team obsessed with reliability and craft.</h3>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Engineers, installers, and product builders united by one goal: keeping the lights on, cleanly.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="section-padding">
      <div className="section-container">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">What we stand for</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">Our Values</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <v.icon className="text-primary" size={20} />
              </div>
              <h3 className="text-base font-display font-bold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Impact */}
    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="grid gap-8 lg:grid-cols-5 items-start">
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)]">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Our Impact</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-5 no-clip">
              Building Africa's Sustainable Future
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                By developing cutting-edge technology solutions for renewable energy management, Tioga Technologies is contributing to Africa's sustainable future. Our platforms enable more efficient use of renewable resources, reduce energy waste, and support the continent's transition away from fossil fuels.
              </p>
              <p>
                We work with energy providers, governments, and organizations across Africa to deploy intelligent energy management systems that make clean energy more accessible, reliable, and cost-effective for communities and businesses.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="#" onClick={(e) => { e.preventDefault(); openLeadForm("page_cta"); }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
              >
                Get in Touch <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
              >
                Visit Contact Page
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Who we work with</p>
            <ul className="space-y-3">
              {partners.map((p) => (
                <li key={p.label} className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                    <p.icon size={18} />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{p.label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
              Partners across the continent rely on Tioga to deploy intelligent systems that make clean energy accessible and cost-effective.
            </p>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default About;
