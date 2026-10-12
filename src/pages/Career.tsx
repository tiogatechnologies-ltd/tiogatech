import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import JobCard, { type Job } from "@/components/JobCard";
import CareerApplicationDialog from "@/components/CareerApplicationDialog";
import AffiliateApplicationDialog from "@/components/AffiliateApplicationDialog";
import { useCareers, FEATURED_GRAPHICS_DESIGNER_JOB } from "@/hooks/useCareers";
import {
  ArrowRight,
  Heart,
  Rocket,
  Users,
  GraduationCap,
  Mail,
  Gem,
  Wrench,
  Sun,
  Cpu,
  Quote,
  Compass,
  ShieldCheck,
  Phone,
  Linkedin,
  Share2,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Briefcase,
  Globe,
  MapPin,
  CheckCircle2,
  Sparkles,
  Building2,
  Layers,
  Palette,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import bgTeam from "@/assets/bg-team-meeting.jpg";
import bgTechMesh from "@/assets/bg-fluid-wave.jpg";
import bgSolarField from "@/assets/bg-commercial-solar.jpg";
import bgLagosNight from "@/assets/bg-lagos-apartment.jpg";
import tiogaLogo from "@/assets/tioga-logo-light.png";
import SEO from "@/components/SEO";
import { useLandingContent } from "@/hooks/useLandingContent";
import { breadcrumbJsonLd } from "@/lib/seoSchema";
import { useSiteContact } from "@/hooks/useSiteContact";

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

const LinkedInFeaturedRoleSpotlight = ({
  job,
  onApply,
}: {
  job: Job;
  onApply: (job: Job) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const companyName = job.company || "Tioga Technologies";

  return (
    <div className="mb-12 rounded-3xl border border-primary/30 bg-card shadow-xl overflow-hidden">
      {/* Top LinkedIn-style Accent Strip */}
      <div className="bg-gradient-to-r from-[#0A66C2]/90 via-primary to-emerald-600 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 text-white text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Linkedin size={14} className="shrink-0" />
          <span className="uppercase tracking-wider text-[11px] font-bold">
            Featured Remote Opening · Tioga Technologies
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
          Actively recruiting · Easy Apply
        </span>
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {/* Job Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-midnight border border-border flex items-center justify-center p-2.5 shrink-0 shadow-md">
              <img
                src={tiogaLogo}
                alt={companyName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                  {job.title}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-0.5">
                  <CheckCircle2 size={12} /> Verified Role
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground inline-flex items-center gap-1">
                  <Building2 size={14} className="text-primary" /> {companyName}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} className="text-primary" /> {job.location}
                </span>
                {job.postedAt && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {job.postedAt}
                    </span>
                  </>
                )}
                {job.applicantsText && (
                  <>
                    <span>·</span>
                    <span>{job.applicantsText}</span>
                  </>
                )}
              </div>

              {/* LinkedIn Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {job.workplaceType && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1">
                    <Globe size={13} /> {job.workplaceType}
                  </span>
                )}
                {job.employmentType && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1">
                    <Briefcase size={13} /> {job.employmentType}
                  </span>
                )}
                {job.experienceLevel && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted border border-border text-foreground/80 text-xs font-medium px-3 py-1">
                    <Layers size={13} /> {job.experienceLevel}
                  </span>
                )}
                {job.department && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted border border-border text-foreground/80 text-xs font-medium px-3 py-1">
                    <Palette size={13} /> {job.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LinkedIn Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onApply(job)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white px-6 py-3 text-sm font-bold transition-all shadow-md active:scale-95"
            >
              <Linkedin size={16} /> Easy Apply <ArrowRight size={15} />
            </button>
            <a
              href={`mailto:careers@tiogatechnologies.com?subject=${encodeURIComponent(
                job.emailSubject
              )}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background hover:bg-muted px-5 py-3 text-sm font-semibold text-foreground transition-all"
            >
              <Mail size={15} /> Apply via Email
            </a>
          </div>
        </div>

        {/* Skills Strip */}
        {job.skills && job.skills.length > 0 && (
          <div className="py-4 border-b border-border flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mr-1">
              <Sparkles size={13} className="text-primary" /> Skills:
            </span>
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-muted/80 border border-border px-3 py-1 text-xs font-medium text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* About the job & Structured Details */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-display font-bold text-foreground">
              About the job
            </h4>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Read full job description <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {job.aboutRole || job.summary}
          </p>

          {expanded && (
            <div className="grid gap-6 lg:grid-cols-2 pt-2">
              {/* Key Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
                  <h5 className="font-display font-bold text-foreground mb-3 text-base">
                    What You’ll Do (Responsibilities)
                  </h5>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {job.responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Qualifications & Benefits */}
              <div className="space-y-6">
                {job.qualifications && job.qualifications.length > 0 && (
                  <div className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
                    <h5 className="font-display font-bold text-foreground mb-3 text-base">
                      Qualifications & Requirements
                    </h5>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                      {job.qualifications.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.benefits && job.benefits.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 sm:p-6">
                    <h5 className="font-display font-bold text-foreground mb-3 text-base">
                      What We Offer (Perks & Benefits)
                    </h5>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {job.benefits.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 shrink-0 mt-0.5"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Career = () => {
  const { contact } = useSiteContact();
  const { jobs: openRoles } = useCareers();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [affiliateOpen, setAffiliateOpen] = useState(false);
  const { content: cms } = useLandingContent("page_career");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };

  const graphicsDesignerJob =
    openRoles.find((j) => j.title.toLowerCase().includes("graphic")) ||
    FEATURED_GRAPHICS_DESIGNER_JOB;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Careers at Tioga Technologies"
        description="Join the team building Nigeria's clean energy and smart automation infrastructure. Full-time remote Graphics Designer, engineering, installation and operations roles."
        path="/career"
        jsonLd={breadcrumbJsonLd([{ name: "Careers", path: "/career" }])}
      />
      <SiteHeader />
      <PageHero
        eyebrow={c.eyebrow || "Careers"}
        title={c.title || "Build with the team powering Nigeria."}
        subtitle={
          c.subtitle ||
          "We are a deeply technical and creative team building clean energy and smart living across Nigeria. Explore remote and on-site openings across design, engineering, installation, and operations."
        }
        backgroundImage={bgTeam}
        backgroundAlt="Tioga Technologies team and installations"
      >
        <a
          href="mailto:careers@tiogatechnologies.com?subject=Application%20to%20Tioga"
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 backdrop-blur-xl border border-accent/60 border-t-white/50 px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(245,158,11,0.35)]"
        >
          <Mail size={16} /> Send us your CV
        </a>
        <a
          href="#open-roles"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 border-t-white/40 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-white/40 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(0,0,0,0.25)]"
        >
          See open roles <ArrowRight size={16} />
        </a>
        <a
          href="#affiliate"
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 border-t-white/40 bg-gold/15 hover:bg-gold/25 backdrop-blur-2xl backdrop-saturate-150 px-6 py-3 text-sm font-medium text-white hover:border-gold/60 active:scale-[0.98] transition-all shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.3),0_8px_24px_rgba(245,158,11,0.2)]"
        >
          <Share2 size={16} /> Become an affiliate
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
                {/* Translucent so the photo still reads while keeping white text legible */}
                <div className="absolute inset-0 bg-midnight/70" />
                <div className="relative z-10 p-6 flex flex-col justify-end text-primary-foreground">
                  <r.icon className="text-gold mb-3 shrink-0" size={28} />
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
              { icon: Gem, title: "Bias for craft", desc: "Clean cabling, neat installs, sharp design, well-named code. The details matter." },
              { icon: Heart, title: "People over titles", desc: "Best idea wins. Designers and engineers ship real work from week one." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
                <v.icon className="text-primary mb-3 shrink-0" size={24} />
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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: Palette, title: "Creative & Design", desc: "Remote graphic design, brand storytelling, product visuals, and campaign creatives." },
              { icon: Sun, title: "Solar Engineering", desc: "Sizing, design and commissioning of inverter and battery systems." },
              { icon: Wrench, title: "Field Installation", desc: "Hands-on installers and electricians who take pride in clean work." },
              { icon: Cpu, title: "Embedded & IoT", desc: "Firmware, telemetry, and hardware integration for energy hardware." },
              { icon: Users, title: "Sales & Operations", desc: "Customer success, logistics and project coordination across Nigeria." },
            ].map((t) => (
              <div key={t.title} className="rounded-2xl border border-border bg-card p-6 hover-lift">
                <t.icon className="text-gold mb-3 shrink-0" size={24} />
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
            <div className="absolute inset-0 bg-midnight/70" />
            <div className="relative h-full p-8 sm:p-12 lg:p-16 flex flex-col justify-center max-w-xl text-primary-foreground">
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold mb-3 font-bold">Life at Tioga</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight no-clip mb-4">
                A small team. Real work. Real ownership.
              </h2>
              <p className="text-primary-foreground/85 leading-relaxed mb-6">
                We operate across Lagos, Abuja, Jos, and remotely across Nigeria. Mornings are focused. Afternoons are field visits, creative reviews, and hands-on builds. We celebrate every campaign and install that goes live, and we pay people what they are worth.
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
            <p className="mt-3 text-muted-foreground">
              Explore our active remote and on-site roles at Tioga Technologies.
            </p>
          </div>

          {/* LinkedIn-Style Featured Role Spotlight for Full-Time Remote Graphics Designer */}
          <LinkedInFeaturedRoleSpotlight
            job={graphicsDesignerJob}
            onApply={setSelectedJob}
          />

          <FeaturedRoles openRoles={openRoles} onApply={setSelectedJob} />
        </div>
      </section>

      <CareerApplicationDialog job={selectedJob} open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)} />
      <AffiliateApplicationDialog open={affiliateOpen} onOpenChange={setAffiliateOpen} />

      {/* Affiliate program */}
      <section id="affiliate" className="section-padding">
        <div className="section-container max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-primary/10 p-8 sm:p-12">
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
                  <Share2 size={14} className="text-primary" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">New - Affiliate Program</span>
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
                    <TrendingUp className="text-primary mb-2" size={18} />
                    <p className="text-xs font-bold text-foreground">60-day window</p>
                    <p className="text-[11px] text-muted-foreground">long attribution</p>
                  </div>
                </div>
                <button
                  onClick={() => setAffiliateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
                >
                  Apply to become an affiliate
                </button>
              </div>
              <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">How it works</p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">1</span>
                    <span className="text-foreground/90">Apply with your audience details - takes 2 minutes.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">2</span>
                    <span className="text-foreground/90">Get approved and receive your unique referral code & tracked link.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">3</span>
                    <span className="text-foreground/90">Share it anywhere - every lead is attributed back to you for 60 days.</span>
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
                href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                className="group rounded-2xl border border-border bg-background p-5 hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] transition-all"
              >
                <Phone className="text-emerald-500 mb-2" size={20} />
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Call</p>
                <p className="text-sm font-semibold text-foreground">{contact.phone}</p>
                <p className="text-sm font-semibold text-foreground">{contact.whatsapp}</p>
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

const FeaturedRoles = ({ openRoles, onApply }: { openRoles: Job[]; onApply: (job: Job) => void }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? openRoles : openRoles.slice(0, 3);
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((job, i) => (
          <JobCard key={job.id || job.title} job={job} index={i} onApply={onApply} />
        ))}
      </div>
      {openRoles.length > 3 && !showAll && (
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20"
          >
            See more openings <ArrowRight size={16} />
          </button>
        </div>
      )}
    </>
  );
};

export default Career;
