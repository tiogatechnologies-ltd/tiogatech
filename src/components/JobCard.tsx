import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Sparkles } from "lucide-react";

export type Job = {
  id?: string;
  title: string;
  location: string;
  summary: string;
  highlights: string[];
  requirements: string;
  emailSubject: string;
  deadline?: string;
  backgroundImage?: string;
};

const DEFAULT_DEADLINE = "30th May, 2026";

const JobCard = ({ job, index, onApply }: { job: Job; index: number; onApply: (job: Job) => void }) => {
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
      className="group relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-midnight/90 to-midnight/75 border border-primary/25 shadow-[0_10px_40px_hsl(var(--foreground)/0.35)] hover:border-accent/80 hover:shadow-[0_0_46px_hsl(var(--accent)/0.22)] overflow-hidden flex flex-col min-h-[620px]"
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-midnight/70 via-midnight/88 to-midnight/95" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-midnight/95 via-midnight/45 to-midnight/80" />
      {/* Cursor-tracking sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(420px circle at ${tilt.mx}% ${tilt.my}%, hsl(var(--accent) / 0.16), transparent 55%)`,
        }}
      />
      {/* Top emerald hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent" />
      {/* Glow accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 rounded-full bg-accent/15 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Header strip */}
      <div className="relative px-6 sm:px-7 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/40 text-accent text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1">
            <Sparkles size={10} /> Now Hiring
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1">
            <Calendar size={10} className="text-accent" /> Closes {job.deadline || DEFAULT_DEADLINE}
          </span>
        </div>
        <h3 className="text-xl sm:text-[22px] font-display font-bold text-white leading-snug">
          {job.title}
        </h3>
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/70">
          <MapPin size={12} className="text-accent" /> {job.location}
        </div>
      </div>

      {/* Body */}
      <div className="relative px-6 sm:px-7 py-5 flex flex-col flex-1">
        <p className="text-sm text-white/80 leading-relaxed mb-4">{job.summary}</p>

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

        {job.requirements && (
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3.5 mb-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-semibold mb-1">Requirements</p>
            <p className="text-xs text-white/75 leading-relaxed">{job.requirements}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onApply(job)}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-accent hover:brightness-110 text-accent-foreground px-5 py-3 text-sm font-bold tracking-wide transition-all shadow-[0_4px_16px_hsl(var(--accent)/0.35)] group-hover:shadow-[0_0_28px_hsl(var(--accent)/0.6)] active:scale-[0.97] relative z-10"
        >
          Quick Apply <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default JobCard;
