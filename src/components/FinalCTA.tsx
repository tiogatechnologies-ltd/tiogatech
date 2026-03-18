import { MessageCircle } from "lucide-react";

interface FinalCTAProps {
  onApply: () => void;
}

const FinalCTA = ({ onApply }: FinalCTAProps) => {
  return (
    <section className="py-20 bg-secondary text-secondary-foreground">
      <div className="section-container text-center max-w-2xl space-y-6">
        <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">
          Ready for uninterrupted power and{" "}
          <span className="text-accent">smarter living?</span>
        </h2>
        <p className="text-secondary-foreground/70">
          Get a personalized recommendation in under 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={onApply}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
          >
            Apply Now
          </button>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary-foreground/30 px-8 py-3.5 text-sm font-medium text-secondary-foreground hover:bg-secondary-foreground/10 transition-all"
          >
            <MessageCircle size={16} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
