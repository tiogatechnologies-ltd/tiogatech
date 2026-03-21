import { useScrollReveal } from "@/hooks/useScrollReveal";

const stats = [
  { value: "100+", label: "Happy Customers" },
  { value: "250+", label: "Installations Completed" },
  { value: "₦0", label: "Monthly Fuel Cost After Solar" },
  { value: "24/7", label: "Support & Monitoring" },
];

const StatsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-12 bg-primary text-primary-foreground">
      <div ref={ref} className="section-container">
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-8 text-center ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
          {stats.map((s) => (
            <div key={s.label}>
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
