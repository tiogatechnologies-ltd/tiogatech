import { MessageCircle } from "lucide-react";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";

interface StickyCTAProps {
  onApply: () => void;
}

const StickyCTA = ({ onApply }: StickyCTAProps) => {
  const { contact } = useSiteContact();
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border py-3 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex gap-3">
        <button
          onClick={onApply}
          className="flex-1 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Get Started
        </button>
        <a
          href={whatsappLink(contact)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
        >
          <MessageCircle size={16} />
          WhatsApp
        </a>
      </div>
    </div>
  );
};

export default StickyCTA;
