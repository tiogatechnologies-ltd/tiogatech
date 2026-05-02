import { MessageCircle, ArrowRight, Sun, Cpu, ShieldCheck } from "lucide-react";
import { trackConversion } from "@/lib/tracking";

interface FinalCTAProps {
  onApply: () => void;
}

const FinalCTA = ({ onApply }: FinalCTAProps) => {
  return (
    <section className="relative py-24 bg-secondary text-secondary-foreground overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: "5s" }} />

      <div className="relative section-container">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary-foreground/10 backdrop-blur-md border border-secondary-foreground/20 px-4 py-1.5 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Free consultation, no obligations
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-[1.05] tracking-tight">
            Ready for uninterrupted power and{" "}
            <span className="bg-gradient-to-r from-accent via-accent to-yellow-300 bg-clip-text text-transparent">smarter living?</span>
          </h2>

          <p className="text-secondary-foreground/75 text-lg leading-relaxed max-w-2xl mx-auto">
            Join 100+ homes and businesses already enjoying reliable solar power, smart automation, and modern security. Get a personalized recommendation in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={onApply}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-2xl shadow-accent/30 hover:shadow-accent/50"
            >
              Get My Personalized Quote
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://wa.me/2348178000023"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("whatsapp_click", { source: "final_cta" })}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-secondary-foreground/30 bg-secondary-foreground/5 backdrop-blur-md px-8 py-4 text-sm font-medium text-secondary-foreground hover:bg-secondary-foreground/15 active:scale-[0.97] transition-all"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
          </div>

          {/* Quick benefits */}
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-xl mx-auto">
            {[
              { icon: Sun, label: "Solar" },
              { icon: Cpu, label: "Smart Home" },
              { icon: ShieldCheck, label: "Security" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-secondary-foreground/5 backdrop-blur-md border border-secondary-foreground/10 py-4">
                <b.icon size={20} className="text-accent" />
                <span className="text-xs font-medium text-secondary-foreground/80">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
