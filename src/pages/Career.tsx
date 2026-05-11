import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import { ArrowRight, Heart, Rocket, Users, GraduationCap, Mail } from "lucide-react";
import heroSmartHome from "@/assets/hero-smart-home.jpg";

const reasons = [
  {
    icon: Rocket,
    title: "Build the future of African energy",
    desc: "Every system you ship cuts diesel use and keeps a Nigerian home or business running.",
  },
  {
    icon: GraduationCap,
    title: "Learn from senior engineers",
    desc: "Hands-on mentorship across solar, embedded systems, IoT and AI integration.",
  },
  {
    icon: Heart,
    title: "Be respected and well paid",
    desc: "Competitive Naira compensation, real ownership, and tools that don't slow you down.",
  },
];

const openRoles: { title: string; team: string; type: string; location: string }[] = [
  // No active openings — show the "send your CV" card.
];

const Career = () => (
  <div className="min-h-screen flex flex-col">
    <SiteHeader />
    <PageHero
      eyebrow="Careers"
      title="Build with the team powering Nigeria."
      subtitle="We're a small, deeply technical team in Lagos. We hire engineers, installers and operators who care about craft and about the people we serve."
      backgroundImage={heroSmartHome}
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
            <div key={r.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <r.icon className="text-primary" size={20} />
              </div>
              <h3 className="font-display font-bold text-foreground mb-1.5 text-lg">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
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
