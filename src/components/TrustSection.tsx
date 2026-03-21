import { Check, Award, Clock, Banknote, Users } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const reasons = [
  {
    icon: Award,
    title: "Certified Products Only",
    desc: "We use globally certified solar panels, inverters, batteries, and smart devices from brands like Deye, Growatt, Tuya, and more.",
  },
  {
    icon: Users,
    title: "Trained Technicians",
    desc: "Every installation is handled by our in-house team of trained and certified professionals — not outsourced contractors.",
  },
  {
    icon: Banknote,
    title: "Transparent Pricing",
    desc: "No hidden fees, no surprise charges. You'll see the full cost breakdown before you commit. We also offer flexible payment plans.",
  },
  {
    icon: Clock,
    title: "Ongoing Maintenance",
    desc: "We provide post-installation support, routine checkups, and fast response times if anything needs attention.",
  },
];

const TrustSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="section-padding bg-muted">
      <div ref={ref} className={`section-container ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-2">Why Tioga</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            You're in safe hands
          </h2>
          <p className="text-muted-foreground">
            We're not just selling products — we're building long-term relationships. Here's why over 100 customers trust us.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <r.icon size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground mb-1">{r.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
