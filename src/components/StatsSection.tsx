import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";
import bgTexture from "@/assets/bg-tech-mesh.jpg";

const defaultStats = [
  { value: "100+", label: "Happy Customers", suffix: "+", num: 100 },
  { value: "250+", label: "Installations Completed", suffix: "+", num: 250 },
  { value: "₦0", label: "Monthly Fuel Cost After Solar", prefix: "₦", num: 0 },
  { value: "24/7", label: "Support & Monitoring", num: null },
];

const Counter = ({ target, prefix = "", suffix = "", display }: { target: number | null; prefix?: string; suffix?: string; display: string }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === null) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          // easeOutExpo - iPhone-like
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setVal(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
      {target === null ? display : `${prefix}${val.toLocaleString()}${suffix}`}
    </div>
  );
};

const StatsSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("stats");
  const items = content?.items || defaultStats;

  return (
    <section className="relative py-20 bg-primary text-primary-foreground overflow-hidden">
      {/* Texture overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url(${bgTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
      {/* Decorative orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />

      <div ref={ref} className="relative section-container">
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-8 ${isVisible ? "animate-fade-up" : "opacity-0"}`}>
          {items.map((s: any, i: number) => {
            // Only animate a counter when the value is a pure number string (allowing one trailing prefix/suffix
            // handled separately). Anything containing slashes, currency, or extra letters renders literally.
            const isCountable = typeof s.value === "string" && /^[₦$€]?\d[\d,]*[+%]?$/.test(s.value);
            const num = typeof s.num === "number"
              ? s.num
              : (isCountable && s.value?.match(/\d+/) ? parseInt(s.value.match(/\d+/)[0]) : null);
            const display = s.value;
            return (
              <div
                key={i}
                className="text-center sm:text-left p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-all hover:-translate-y-1 duration-500"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Counter target={num} display={display} prefix={s.prefix || ""} suffix={s.suffix || ""} />
                <div className="text-sm text-primary-foreground/70 mt-2 leading-snug">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
