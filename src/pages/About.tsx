import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroSmartHome from "@/assets/hero-smart-home.jpg";
import bgTechMesh from "@/assets/bg-tech-mesh.jpg";
import bgSolarField from "@/assets/bg-solar-field.jpg";
import bgLagosNight from "@/assets/bg-lagos-night.jpg";
import bgTeam from "@/assets/bg-team.jpg";
import { Target, Eye, Wifi, Cpu, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  {
    icon: Wifi,
    title: "IoT Infrastructure",
    desc: "Robust, scalable IoT infrastructure connecting renewable energy systems with real-time monitoring, data collection, and intelligent decision-making capabilities.",
    bg: bgTechMesh,
  },
  {
    icon: Cpu,
    title: "Embedded Systems",
    desc: "Custom embedded systems for energy management. Monitoring devices, control systems, and intelligent sensors optimized for reliability in diverse environments.",
    bg: bgLagosNight,
  },
  {
    icon: Zap,
    title: "Energy Platforms",
    desc: "Next-generation platforms managing renewable resources, optimizing distribution, predicting demand, and ensuring reliable power supply across Africa.",
    bg: bgSolarField,
  },
];

const About = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="About"
      title="Building Africa's clean energy future"
      subtitle="Tioga Technologies is an IoT infrastructure and embedded systems company developing intelligent renewable energy solutions for homes, businesses, and communities."
      backgroundImage={heroSmartHome}
      backgroundAlt="Modern smart home with rooftop solar at golden hour"
    />

    <section className="section-padding">
      <div className="section-container grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] hover-lift">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Target className="text-primary" size={22} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Accelerate Africa's transition to clean, renewable energy through innovative IoT infrastructure and intelligent energy management solutions.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] hover-lift">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Eye className="text-primary" size={22} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Our Vision</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every community across Africa with access to reliable, clean, and intelligent energy systems managed through world-class infrastructure.
          </p>
        </div>
      </div>
    </section>

    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">What we do</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">Three Pillars of Innovation</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="group relative rounded-2xl border border-border overflow-hidden hover-lift min-h-[280px]">
              <img src={p.bg} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/95 via-midnight/80 to-midnight/60" />
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
          <div className="absolute inset-0 bg-gradient-to-r from-midnight/85 via-midnight/40 to-transparent" />
          <div className="relative h-full p-7 sm:p-10 flex flex-col justify-center max-w-md text-primary-foreground">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold mb-2 font-bold">Our People</p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold leading-tight no-clip">A team obsessed with reliability and craft.</h3>
          </div>
        </div>
      </div>
    </section>

    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)]">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Our Impact</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight mb-5">
            Building Africa's Sustainable Future
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our platforms enable more efficient use of renewable resources, reduce energy waste, and support the continent's transition away from fossil fuels.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-7">
            We work with energy providers, governments, and organizations to deploy intelligent systems making clean energy accessible and cost-effective.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
          >
            Get in Touch <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default About;
