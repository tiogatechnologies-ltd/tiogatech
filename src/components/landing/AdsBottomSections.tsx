import { useEffect, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { useRegisterBottomBar } from "@/lib/floatingLayers";

interface AdsBottomSectionsProps {
  heroRef: React.RefObject<HTMLElement>;
  formRef: React.RefObject<HTMLElement>;
  onScrollToForm: () => void;
}

/**
 * Mobile Sticky Bottom Bar synced with F1 (`--bottom-bar-h`).
 * Appears on mobile once the visitor scrolls past the hero and hides when the quote form is in view.
 */
export const AdsBottomSections = ({
  heroRef,
  formRef,
  onScrollToForm,
}: AdsBottomSectionsProps) => {
  const { contact } = useSiteContact();
  const [heroOut, setHeroOut] = useState(false);
  const [formInView, setFormInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const hEl = heroRef.current;
    const fEl = formRef.current;

    const hObs = hEl
      ? new IntersectionObserver(([entry]) => setHeroOut(!entry.isIntersecting), { threshold: 0.05 })
      : null;
    const fObs = fEl
      ? new IntersectionObserver(([entry]) => setFormInView(entry.isIntersecting), { threshold: 0.1 })
      : null;

    if (hEl && hObs) hObs.observe(hEl);
    if (fEl && fObs) fObs.observe(fEl);

    return () => {
      hObs?.disconnect();
      fObs?.disconnect();
    };
  }, [heroRef, formRef]);

  const showMobileBar = heroOut && !formInView;

  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useRegisterBottomBar("ads_lp_mobile_bar", showMobileBar && !isDesktop, 68);

  const waHref = whatsappLink(
    contact,
    "Hi Tioga Technologies, I'd like a free personalised quote for my property.",
  );

  return (
    <div
      data-testid="ads-mobile-sticky-bar"
      aria-hidden={!showMobileBar}
      className={`fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.14)] transition-transform duration-250 ${
        showMobileBar ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-3.5 rounded-md bg-[#25D366] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          <MessageCircle size={15} />
          <span>WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={onScrollToForm}
          className="flex-1 min-h-[44px] px-4 rounded-md bg-accent text-accent-foreground font-display font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>Get My Free Quote</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AdsBottomSections;
