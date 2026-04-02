import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const SolutionSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("solution");

  const heading = content?.heading || "Stable power, smart automation, and security, all in one system.";
  const description = content?.description || "Tioga combines solar energy, intelligent home automation, and modern security into a seamless experience. No more juggling multiple vendors or dealing with unreliable systems. We design, install, and support everything so you can focus on what matters most.";

  return (
    <section className="py-16 bg-secondary text-secondary-foreground">
      <div ref={ref} className={`section-container text-center max-w-3xl ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-2">Our Solution</p>
        <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight mb-4">
          {heading}
        </h2>
        <p className="text-secondary-foreground/70 text-lg leading-relaxed">{description}</p>
      </div>
    </section>
  );
};

export default SolutionSection;
