import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLandingContent } from "@/hooks/useLandingContent";

const defaultStats = [
  { value: "100+", label: "Happy Customers" },
  { value: "250+", label: "Installations Completed" },
  { value: "₦0", label: "Monthly Fuel Cost After Solar" },
  { value: "24/7", label: "Support & Monitoring" },
];

const StatsSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { content } = useLandingContent("stats");
  const items = content?.items || defaultStats;

  return (
    <section className="py-12 bg-primary text-primary-foreground">
      <div ref={ref} className="section-container">
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-8 text-center ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
          {items.map((s: any, i: number) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-display font-bold">{s.value}</div>
              <div className="text-sm text-primary-foreground/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
