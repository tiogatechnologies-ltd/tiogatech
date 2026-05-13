import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import JobCard, { type Job } from "@/components/JobCard";
import { ArrowRight, Heart, Rocket, Users, GraduationCap, Mail, Sparkles, Wrench, Sun, Cpu, Quote, Compass, ShieldCheck, Phone, Linkedin } from "lucide-react";
import bgTeam from "@/assets/bg-team-meeting.jpg";
import bgTechMesh from "@/assets/bg-fluid-wave.jpg";
import bgSolarField from "@/assets/bg-commercial-solar.jpg";
import bgLagosNight from "@/assets/bg-lagos-apartment.jpg";

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
    desc: "Competitive Naira compensation, real ownership, and tools that don't slow you down.",
    bg: bgLagosNight,
  },
];

const openRoles: Job[] = [
  {
    title: "Call for Partnership — Nationwide Installers",
    location: "Nationwide, Nigeria",
    summary: "Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions — integrated inverters and lithium battery systems — that reduce grid dependence.",
    highlights: ["Attractive commission structure", "Reduce client grid dependence", "Access to premium hardware stack"],
    requirements: "Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.",
    emailSubject: "Application - Partnership (Nationwide Installer)",
  },
  {
    title: "Engineering Force — Project Engineers & Solar Installers",
    location: "Lagos | Abuja | Jos",
    summary: "Contract-based roles for engineers who can design, install and commission PV and ESS storage systems at scale.",
    highlights: ["2 to 5 years in Renewable Energy or Electrical Engineering", "PV, ESS Storage and commissioning experience", "Field-ready, safety-first mindset"],
    requirements: "HND / B.Eng in Electrical Engineering or related field. COREN / NSE certification is an advantage.",
    emailSubject: "Application - Project Engineer / Solar Installer",
  },
  {
    title: "Admin / Sales Representative",
    location: "Jos",
    summary: "Front-line role supporting customers, coordinating quotes and keeping the Jos office running smoothly.",
    highlights: ["1 to 3 years in Admin or Sales", "Strong multitasking and customer service skills", "Comfortable with CRM and basic reporting"],
    requirements: "Minimum OND / HND / B.Sc in any related discipline.",
    emailSubject: "Application - Admin/Sales Representative (Jos)",
  },
  {
    title: "Business Development Manager",
    location: "Abuja | Jos",
    summary: "Drive strategic growth across enterprise, SME and residential segments. Own pipeline, partnerships and regional expansion.",
    highlights: ["3 to 6 years in business development", "Strategic growth and partnership focus", "Renewable Energy background is an advantage"],
    requirements: "Bachelor's degree in Business, Engineering or a related field.",
    emailSubject: "Application - Business Development Manager",
  },
];

const Career = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Careers"
      title="Build with the team powering Nigeria."
      subtitle="We're a small, deeply technical team in Lagos. We hire engineers, installers and operators who care about craft and about the people we serve."
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
            { icon: ShieldCheck, title: "Reliability first", desc: "We over-engineer for Nigerian conditions. If it can't survive a brownout, it doesn't ship." },
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
            We hire continuously
          </h2>
        </div>

        {openRoles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <Users className="text-primary mx-auto mb-3" size={28} />
            <h3 className="text-xl font-display font-bold text-foreground mb-2 no-clip">
              No live openings right now
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We're always meeting strong solar engineers, embedded developers, automation installers and ops leaders. Send your CV and a short note about what excites you.
            </p>
            <a
              href="mailto:careers@tiogatechnologies.com?subject=Application%20to%20Tioga"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
            >
              <Mail size={16} /> careers@tiogatechnologies.com
            </a>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl mx-auto">
            {openRoles.map((r) => (
              <div key={r.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover-lift">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">{r.team}</p>
                  <h3 className="text-lg font-display font-bold text-foreground mt-0.5">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.type} · {r.location}</p>
                </div>
                <a
                  href={`mailto:careers@tiogatechnologies.com?subject=${encodeURIComponent(r.title)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all shadow-md shadow-primary/20 self-start sm:self-auto"
                >
                  Apply <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    <SiteFooter />
  </div>
);

export default Career;
