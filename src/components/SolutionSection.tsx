import { useScrollReveal } from "@/hooks/useScrollReveal";

const SolutionSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-16 bg-secondary text-secondary-foreground">
      <div ref={ref} className={`section-container text-center max-w-2xl ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Our Solution</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">
          Stable power, smart automation, and security —{" "}
          <span className="text-accent">all in one system.</span>
        </h2>
      </div>
    </section>
  );
};

export default SolutionSection;
