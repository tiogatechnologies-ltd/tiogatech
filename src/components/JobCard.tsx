import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Briefcase,
  Globe,
  CheckCircle2,
  Building2,
  Sparkles,
  Eye,
  Linkedin,
  Mail,
  Clock,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import tiogaLogo from "@/assets/tioga-logo-light.png";

export type Job = {
  id?: string;
  title: string;
  company?: string;
  location: string;
  workplaceType?: "Remote" | "Hybrid" | "On-site";
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Partnership";
  experienceLevel?: string;
  department?: string;
  postedAt?: string;
  applicantsText?: string;
  activelyRecruiting?: boolean;
  easyApply?: boolean;
  summary: string;
  aboutRole?: string;
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  skills?: string[];
  highlights: string[];
  requirements: string;
  emailSubject: string;
  deadline?: string;
  backgroundImage?: string;
};

const DEFAULT_DEADLINE = "30th May, 2026";

const JobCard = ({
  job,
  index,
  onApply,
}: {
  job: Job;
  index: number;
  onApply: (job: Job) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const companyName = job.company || "Tioga Technologies";
  const hasExtendedDetails = Boolean(
    job.aboutRole ||
      (job.responsibilities && job.responsibilities.length > 0) ||
      (job.qualifications && job.qualifications.length > 0) ||
      (job.benefits && job.benefits.length > 0)
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.12 }}
        ref={ref}
        className="group relative rounded-2xl bg-midnight border border-primary/25 shadow-lg hover:border-accent/80 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col min-h-[620px]"
      >
        {job.backgroundImage && (
          <img
            src={job.backgroundImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-[0.85] transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-midnight/80" />
        {/* Top emerald hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-accent/40" />
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-accent/15 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Header strip — LinkedIn style */}
        <div className="relative px-6 sm:px-7 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] uppercase tracking-[0.16em] font-semibold px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {job.activelyRecruiting ? "Actively Recruiting" : "Now Hiring"}
            </span>
            {job.easyApply && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0A66C2]/25 border border-[#0A66C2]/50 text-sky-300 text-[10px] uppercase tracking-[0.14em] font-semibold px-2.5 py-1">
                <Linkedin size={10} className="text-sky-400" /> Easy Apply
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] uppercase tracking-[0.14em] font-semibold px-2.5 py-1">
              <Calendar size={10} className="text-accent" />{" "}
              {job.deadline ? `Closes ${job.deadline}` : `Closes ${DEFAULT_DEADLINE}`}
            </span>
          </div>

          {/* Company Logo + Title */}
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
              <img
                src={tiogaLogo}
                alt={companyName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl sm:text-[22px] font-display font-bold text-white leading-snug group-hover:text-accent transition-colors">
                {job.title}
              </h3>
              <p className="text-xs font-medium text-white/80 flex items-center gap-1.5 mt-0.5">
                <Building2 size={12} className="text-accent shrink-0" />
                <span>{companyName}</span>
                {job.postedAt && (
                  <span className="text-white/50">· {job.postedAt}</span>
                )}
              </p>
            </div>
          </div>

          {/* LinkedIn-style Workplace & Employment Type Pills */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1">
              <MapPin size={12} className="text-accent shrink-0" /> {job.location}
            </span>
            {job.workplaceType && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold px-2.5 py-1">
                <Globe size={12} className="text-emerald-400 shrink-0" /> {job.workplaceType}
              </span>
            )}
            {job.employmentType && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold px-2.5 py-1">
                <Briefcase size={12} className="text-amber-400 shrink-0" /> {job.employmentType}
              </span>
            )}
            {job.experienceLevel && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/75 px-2.5 py-1">
                <Layers size={12} className="text-accent shrink-0" /> {job.experienceLevel}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="relative px-6 sm:px-7 py-5 flex flex-col flex-1">
          <p className="text-sm text-white/85 leading-relaxed mb-4">{job.summary}</p>

          {job.highlights.length > 0 && (
            <ul className="space-y-2 mb-5">
              {job.highlights.map((h) => (
                <li key={h} className="text-[13px] text-white/80 flex items-start gap-2.5">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent shrink-0 shadow-[0_0_8px_hsl(var(--accent)/0.75)]" />
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* LinkedIn-style Skills Match Tags */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-semibold mb-2 flex items-center gap-1.5">
                <Sparkles size={11} className="text-accent" /> Skills & Tools
              </p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="text-[11px] rounded-full bg-white/[0.06] border border-white/10 text-white/85 px-2.5 py-0.5"
                  >
                    {skill}
                  </span>
                ))}
                {job.skills.length > 6 && (
                  <span className="text-[11px] rounded-full bg-accent/15 border border-accent/30 text-accent px-2.5 py-0.5 font-medium">
                    +{job.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {job.requirements && (
            <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5 mb-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1">
                Requirements
              </p>
              <p className="text-xs text-white/75 leading-relaxed">{job.requirements}</p>
            </div>
          )}

          <div className="mt-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10 pt-2">
            <button
              type="button"
              onClick={() => onApply(job)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-accent hover:brightness-110 text-accent-foreground px-5 py-3 text-sm font-bold tracking-wide transition-all shadow-[0_4px_16px_hsl(var(--accent)/0.35)] group-hover:shadow-[0_0_28px_hsl(var(--accent)/0.6)] active:scale-[0.97]"
            >
              {job.easyApply ? "Easy Apply" : "Quick Apply"} <ArrowRight size={14} />
            </button>
            {hasExtendedDetails && (
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white px-4 py-3 text-xs font-semibold transition-all active:scale-[0.97]"
              >
                <Eye size={14} /> Job Details
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* LinkedIn-Style Full Job Description Modal */}
      {hasExtendedDetails && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-card">
            {/* Top Banner */}
            <div className="p-6 sm:p-8 border-b border-border bg-muted/40">
              <DialogHeader className="text-left space-y-3">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-midnight border border-border flex items-center justify-center p-2 shrink-0">
                    <img
                      src={tiogaLogo}
                      alt={companyName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {job.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-semibold text-foreground">{companyName}</span>
                      <span>·</span>
                      <span>{job.location}</span>
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
                    </DialogDescription>
                  </div>
                </div>

                {/* LinkedIn Pill Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {job.workplaceType && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1">
                      <Globe size={13} /> {job.workplaceType}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1">
                      <Briefcase size={13} /> {job.employmentType}
                    </span>
                  )}
                  {job.experienceLevel && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted border border-border text-foreground/80 text-xs font-medium px-3 py-1">
                      <Layers size={13} /> {job.experienceLevel}
                    </span>
                  )}
                  {job.department && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted border border-border text-foreground/80 text-xs font-medium px-3 py-1">
                      <Clock size={13} /> {job.department}
                    </span>
                  )}
                  {job.activelyRecruiting && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-3 py-1">
                      <CheckCircle2 size={13} /> Actively recruiting
                    </span>
                  )}
                </div>

                {/* Primary Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsOpen(false);
                      onApply(job);
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-accent hover:brightness-110 text-accent-foreground px-6 py-2.5 text-sm font-bold transition-all shadow-md"
                  >
                    <Linkedin size={15} /> Easy Apply Now <ArrowRight size={15} />
                  </button>
                  <a
                    href={`mailto:careers@tiogatechnologies.com?subject=${encodeURIComponent(
                      job.emailSubject
                    )}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background hover:bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-all"
                  >
                    <Mail size={15} /> Apply via Email
                  </a>
                </div>
              </DialogHeader>
            </div>

            {/* Job Description Content */}
            <div className="p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground/90">
              {/* About the job */}
              <div>
                <h4 className="text-base font-display font-bold text-foreground mb-2">
                  About the job
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {job.aboutRole || job.summary}
                </p>
              </div>

              {/* Key Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-base font-display font-bold text-foreground mb-2.5">
                    What You’ll Do (Key Responsibilities)
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    {job.responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Qualifications */}
              {job.qualifications && job.qualifications.length > 0 && (
                <div>
                  <h4 className="text-base font-display font-bold text-foreground mb-2.5">
                    Qualifications & Requirements
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    {job.qualifications.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div>
                  <h4 className="text-base font-display font-bold text-foreground mb-2.5">
                    Skills & Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-muted border border-border px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h4 className="text-base font-display font-bold text-foreground mb-2.5">
                    Benefits & Perks
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    {job.benefits.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* About the Company Box (LinkedIn Footer Card) */}
              <div className="rounded-2xl border border-border bg-muted/40 p-5 mt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-midnight border border-border flex items-center justify-center p-1.5">
                      <img
                        src={tiogaLogo}
                        alt={companyName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-foreground">{companyName}</h5>
                      <p className="text-xs text-muted-foreground">
                        Clean Energy · Smart Security · Home Automation · Lagos & Jos, Nigeria
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://www.linkedin.com/company/tiogatechnologies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Linkedin size={13} /> Follow on LinkedIn
                  </a>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tioga Technologies designs, distributes, and installs Tier-1 solar energy storage systems, hybrid inverters, lithium batteries, smart locks, and intelligent home automation across Nigeria.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default JobCard;
