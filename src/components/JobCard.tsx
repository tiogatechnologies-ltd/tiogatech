import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

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
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 8, ry: px * 10 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0 });

  const mailto = `mailto:careers@tiogatechnologies.com?subject=${encodeURIComponent(job.emailSubject)}`;

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
      }}
      className="group relative rounded-2xl p-6 sm:p-7 backdrop-blur-xl bg-midnight/70 border border-emerald-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:border-emerald-400/70 hover:shadow-[0_0_40px_rgba(16,185,129,0.25)] overflow-hidden"
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">Role {String.fromCharCode(65 + index)}</p>
            <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1 leading-tight">{job.title}</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/70 mb-4">
          <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {job.location}</span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={12} className="text-emerald-400" /> Deadline: {job.deadline || DEFAULT_DEADLINE}</span>
        </div>

        <p className="text-sm text-white/80 leading-relaxed mb-4">{job.summary}</p>

        <ul className="space-y-1.5 mb-4">
          {job.highlights.map((h) => (
            <li key={h} className="text-xs text-white/75 flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/60 mb-5 leading-relaxed">
          <span className="text-emerald-300 font-semibold">Requirements: </span>{job.requirements}
        </p>

        <a
          href={mailto}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-midnight px-5 py-2.5 text-sm font-semibold transition-all shadow-[0_0_0_rgba(16,185,129,0)] group-hover:shadow-[0_0_24px_rgba(16,185,129,0.6)] active:scale-[0.97]"
        >
          Quick Apply <ArrowRight size={14} />
        </a>
      </div>
    </motion.div>
  );
};

export default JobCard;
