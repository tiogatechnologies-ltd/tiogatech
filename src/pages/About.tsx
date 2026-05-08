import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import heroSmartHome from "@/assets/hero-smart-home.jpg";
import { Target, Eye, Wifi, Cpu, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  {
    icon: Wifi,
    title: "IoT Infrastructure",
    desc: "Robust, scalable IoT infrastructure connecting renewable energy systems with real-time monitoring, data collection, and intelligent decision-making capabilities.",
  },
  {
    icon: Cpu,
    title: "Embedded Systems",
    desc: "Custom embedded systems for energy management. Monitoring devices, control systems, and intelligent sensors optimized for reliability in diverse environments.",
  },
  {
    icon: Zap,
    title: "Energy Platforms",
    desc: "Next-generation platforms managing renewable resources, optimizing distribution, predicting demand, and ensuring reliable power supply across Africa.",
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
        <div className="grid gap-5">
          {pillars.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-6 sm:p-7 hover-lift">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <p.icon className="text-primary" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-foreground mb-1.5">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
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
