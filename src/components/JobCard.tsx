import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Sparkles } from "lucide-react";

export type Job = {
  title: string;
  location: string;
  summary: string;
  highlights: string[];
  requirements: string;
  emailSubject: string;
  deadline?: string;
};

const DEFAULT_DEADLINE = "30th May, 2026";

const JobCard = ({ job, index }: { job: Job; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      rx: -py * 6,
      ry: px * 8,
      mx: ((e.clientX - r.left) / r.width) * 100,
      my: ((e.clientY - r.top) / r.height) * 100,
    });
  };
  const reset = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50 });

  const mailto = `mailto:careers@tiogatechnologies.com?subject=${encodeURIComponent(
    job.emailSubject || `Application - ${job.title}`
  )}&body=${encodeURIComponent(
    `Hello Tioga Technologies team,\n\nI'd like to apply for the ${job.title} role.\n\nName:\nLocation:\nYears of experience:\n\nA short note about why I'm a great fit:\n\n[Attach your CV before sending]\n\nThank you.`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.12 }}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 200ms ease-out",
        transformStyle: "preserve-3d",
      }}
      className="group relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-midnight/85 to-midnight/70 border border-emerald-500/25 shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:border-emerald-400/70 hover:shadow-[0_0_50px_rgba(16,185,129,0.28)] overflow-hidden flex flex-col"
    >
      {/* Cursor-tracking sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at ${tilt.mx}% ${tilt.my}%, rgba(16,185,129,0.18), transparent 55%)`,
        }}
      />
      {/* Top emerald hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
      {/* Glow accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/15 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Header strip */}
      <div className="relative px-6 sm:px-7 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1">
            <Sparkles size={10} /> Now Hiring
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1">
            <Calendar size={10} className="text-emerald-300" /> Closes {job.deadline || DEFAULT_DEADLINE}
          </span>
        </div>
        <h3 className="text-xl sm:text-[22px] font-display font-bold text-white leading-snug">
          {job.title}
        </h3>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/70">
          <MapPin size={12} className="text-emerald-400" /> {job.location}
        </div>
      </div>

      {/* Body */}
      <div className="relative px-6 sm:px-7 py-5 flex flex-col flex-1">
        <p className="text-sm text-white/80 leading-relaxed mb-4">{job.summary}</p>

        {job.highlights.length > 0 && (
          <ul className="space-y-2 mb-5">
            {job.highlights.map((h) => (
              <li key={h} className="text-[13px] text-white/80 flex items-start gap-2.5">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {job.requirements && (
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5 mb-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-semibold mb-1">Requirements</p>
            <p className="text-xs text-white/75 leading-relaxed">{job.requirements}</p>
          </div>
        )}

        <a
          href={mailto}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-midnight px-5 py-3 text-sm font-bold tracking-wide transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_28px_rgba(16,185,129,0.7)] active:scale-[0.97] relative z-10"
        >
          Quick Apply <ArrowRight size={14} />
        </a>
      </div>
    </motion.div>
  );
};

export default JobCard;
