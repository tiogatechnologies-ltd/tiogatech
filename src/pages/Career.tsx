import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import JobCard, { type Job } from "@/components/JobCard";
import CareerApplicationDialog from "@/components/CareerApplicationDialog";
import AffiliateApplicationDialog from "@/components/AffiliateApplicationDialog";
import { useCareers } from "@/hooks/useCareers";
import { ArrowRight, Heart, Rocket, Users, GraduationCap, Mail, Sparkles, Wrench, Sun, Cpu, Quote, Compass, ShieldCheck, Phone, Linkedin, Share2, DollarSign, TrendingUp, Link as LinkIcon } from "lucide-react";
import bgTeam from "@/assets/bg-team-meeting.jpg";
import bgTechMesh from "@/assets/bg-fluid-wave.jpg";
import bgSolarField from "@/assets/bg-commercial-solar.jpg";
import bgLagosNight from "@/assets/bg-lagos-apartment.jpg";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";

const reasons = [
  {
    icon: Rocket,
    title: "Build the future of African energy",
    desc: "Every system you ship cuts diesel use and keeps a Nigerian home or business running.",
    bg: bgSolarField,
  },
  {
    icon: GraduationCap,
    title: "Learn from senior engineers",
    desc: "Hands-on mentorship across solar, embedded systems, IoT and AI integration.",
    bg: bgTechMesh,
  },
  {
    icon: Heart,
    title: "Be respected and well paid",
    desc: "Competitive Naira compensation, real ownership, and tools that do not slow you down.",
    bg: bgLagosNight,
  },
];

const Career = () => {
  const { jobs: openRoles } = useCareers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const { content: cms } = useLandingContent("page_career");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };
  return (
  <div className="min-h-screen flex flex-col">
    <SEO title="Careers at Tioga Technologies" description="Join the team building Nigeria's clean energy and smart automation infrastructure. Engineering, installation and operations roles in Jos and Lagos." path="/career" />
    <SiteHeader />
    <PageHero
      eyebrow={c.eyebrow || "Careers"}
      title={c.title || "Build with the team powering Nigeria."}
      subtitle={c.subtitle || "We are a small, deeply technical team in Lagos. We hire engineers, installers and operators who care about craft and about the people we serve."}
      backgroundImage={bgTeam}
      backgroundAlt="Tioga Technologies team and installations"
    >
      <a
        href="mailto:careers@tiogatechnologies.com?subject=Application%20to%20Tioga"
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
      >
        <Mail size={16} /> Send us your CV
      </a>
      <a
        href="#open-roles"
        className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
      >
        See open roles <ArrowRight size={16} />
      </a>
    </PageHero>

    <section className="section-padding">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Why Tioga</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            A serious shop for serious builders
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="group relative rounded-2xl overflow-hidden hover-lift min-h-[260px] flex"
            >
              <img
                src={r.bg}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* High-contrast overlay so text remains very visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/85 to-midnight/40" />
              <div className="relative z-10 p-6 flex flex-col justify-end text-primary-foreground">
                <div className="w-11 h-11 rounded-xl bg-gold/95 flex items-center justify-center mb-3 shadow-lg">
                  <r.icon className="text-midnight" size={20} />
                </div>
                <h3 className="font-display font-bold text-primary-foreground mb-1.5 text-lg no-clip">{r.title}</h3>
                <p className="text-sm text-primary-foreground/85 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">How we work</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            The values that hold the team together
          </h2>
          <p className="mt-3 text-muted-foreground">No politics. No vanity work. Just craft and care.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Reliability first", desc: "We over-engineer for Nigerian conditions. If it cannot survive a brownout, it does not ship." },
            { icon: Compass, title: "Customer obsession", desc: "Every system is somebody's home or business. We act like it." },
            { icon: Sparkles, title: "Bias for craft", desc: "Clean cabling, neat installs, well-named code. The boring details matter." },
            { icon: Heart, title: "People over titles", desc: "Best idea wins. Junior engineers ship to production from week one." },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="text-primary" size={18} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1.5 text-lg no-clip">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Teams we hire */}
    <section className="section-padding">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Teams we hire</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Where you might fit
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sun, title: "Solar Engineering", desc: "Sizing, design and commissioning of inverter and battery systems." },
            { icon: Wrench, title: "Field Installation", desc: "Hands-on installers and electricians who take pride in clean work." },
            { icon: Cpu, title: "Embedded & IoT", desc: "Firmware, telemetry, and hardware integration for energy hardware." },
            { icon: Users, title: "Sales & Operations", desc: "Customer success, logistics and project coordination across Nigeria." },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center mb-3">
                <t.icon className="text-gold" size={18} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1.5 text-lg no-clip">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Life at Tioga */}
    <section className="section-padding">
      <div className="section-container">
        <div className="relative rounded-3xl overflow-hidden border border-border min-h-[320px] sm:min-h-[400px]">
          <img src={bgTeam} alt="Tioga Technologies team in Lagos" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/85 to-midnight/40" />
          <div className="relative h-full p-8 sm:p-12 lg:p-16 flex flex-col justify-center max-w-xl text-primary-foreground">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold mb-3 font-bold">Life at Tioga</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight no-clip mb-4">
              A small team. Real work. Real ownership.
            </h2>
            <p className="text-primary-foreground/85 leading-relaxed mb-6">
              We work out of Ikeja, Lagos. Mornings are quiet. Afternoons are field visits, code reviews, and hands-on builds. We celebrate every install that goes live, and we pay people what they are worth.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <p className="text-3xl font-display font-bold text-gold">7+</p>
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Years operating</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-gold">100%</p>
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wider">Naira salaries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Testimonial */}
    <section className="section-padding bg-muted">
      <div className="section-container max-w-3xl">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] text-center">
          <Quote className="text-primary mx-auto mb-4" size={32} />
          <p className="text-lg sm:text-xl text-foreground font-display leading-relaxed mb-6">
            "I joined as a junior installer. Within a year I was leading commissioning visits and learning embedded systems on the side. The team actually invests in you."
          </p>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Tunde A.</p>
            <p className="text-muted-foreground">Solar Lead Installer</p>
          </div>
        </div>
      </div>
    </section>

    <section id="open-roles" className="section-padding bg-muted">
      <div className="section-container">
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Open Roles</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
            Featured openings
          </h2>
          <p className="mt-3 text-muted-foreground">A snapshot of our most-needed roles right now.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {openRoles.slice(0, 2).map((job, i) => (
            <JobCard key={job.id || job.title} job={job} index={i} onApply={setSelectedJob} />
          ))}
        </div>

        {openRoles.length > 2 && (
          <div className="text-center mt-10">
            <Link
              to="/careers/jobs"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
            >
              See more <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>

    <CareerApplicationDialog job={selectedJob} open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)} />
    <AffiliateApplicationDialog open={affiliateOpen} onOpenChange={setAffiliateOpen} />

    {/* Affiliate program */}
    <section id="affiliate" className="section-padding">
      <div className="section-container max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-8 sm:p-12">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 mb-4">
                <Share2 size={14} className="text-gold" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">New — Affiliate Program</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip mb-4">
                Refer customers. Earn naira.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Join the Tioga Affiliate Program and earn commission every time someone you refer installs a solar system, smart lock, or home automation package. Built for content creators, energy consultants, installers, estate managers and anyone with an audience.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-2xl bg-card/60 backdrop-blur p-4 border border-border">
                  <DollarSign className="text-emerald-500 mb-2" size={18} />
                  <p className="text-xs font-bold text-foreground">Up to 10% commission</p>
                  <p className="text-[11px] text-muted-foreground">on confirmed installs</p>
                </div>
                <div className="rounded-2xl bg-card/60 backdrop-blur p-4 border border-border">
                  <LinkIcon className="text-primary mb-2" size={18} />
                  <p className="text-xs font-bold text-foreground">Tracked links</p>
                  <p className="text-[11px] text-muted-foreground">unique code + UTM</p>
                </div>
                <div className="rounded-2xl bg-card/60 backdrop-blur p-4 border border-border">
                  <TrendingUp className="text-gold mb-2" size={18} />
                  <p className="text-xs font-bold text-foreground">60-day window</p>
                  <p className="text-[11px] text-muted-foreground">long attribution</p>
                </div>
              </div>
              <button
                onClick={() => setAffiliateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
              >
                <Sparkles size={16} /> Apply to become an affiliate
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">How it works</p>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">1</span>
                  <span className="text-foreground/90">Apply with your audience details — takes 2 minutes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">2</span>
                  <span className="text-foreground/90">Get approved and receive your unique referral code & tracked link.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">3</span>
                  <span className="text-foreground/90">Share it anywhere — every lead is attributed back to you for 60 days.</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">4</span>
                  <span className="text-foreground/90">Get paid in naira once the install is confirmed.</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How to Apply / Contact */}
    <section className="section-padding">
      <div className="section-container max-w-4xl">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)]">
          <div className="text-center mb-8">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">How to Apply</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight no-clip">
              Send your CV and a short note
            </h2>
            <p className="mt-3 text-muted-foreground">Tell us which role you are applying for and why you are a great fit. We respond to every serious application.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <a
              href="mailto:careers@tiogatechnologies.com"
              className="group rounded-2xl border border-border bg-background p-5 hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all"
            >
              <Mail className="text-emerald-500 mb-2" size={20} />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-foreground break-all">careers@tiogatechnologies.com</p>
            </a>
            <a
              href="tel:+2349035966388"
              className="group rounded-2xl border border-border bg-background p-5 hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all"
            >
              <Phone className="text-emerald-500 mb-2" size={20} />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Call</p>
              <p className="text-sm font-semibold text-foreground">0903 596 6388</p>
              <p className="text-sm font-semibold text-foreground">0817 800 0023</p>
            </a>
            <a
              href="https://www.linkedin.com/company/tiogatechnologies"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border bg-background p-5 hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all"
            >
              <Linkedin className="text-emerald-500 mb-2 transition-transform duration-300 group-hover:scale-125" size={20} />
              <p className="text-xs uppercase tracking-wider text-muted-foreground">LinkedIn</p>
              <p className="text-sm font-semibold text-foreground">@tiogatechnologies</p>
            </a>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
  );
};

export default Career;
