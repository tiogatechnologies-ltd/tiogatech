import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Compass,
  HelpCircle,
  Layers,
  MessageCircle,
} from "lucide-react";
import { footerLinks } from "@/lib/footerLinks";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { useRegisterBottomBar } from "@/lib/floatingLayers";

interface AdsBottomSectionsProps {
  heroRef: React.RefObject<HTMLElement>;
  formRef: React.RefObject<HTMLElement>;
  onScrollToForm: () => void;
}

/**
 * Compact Explore Tioga Link Hub (generated from `footerLinks`, excluding Privacy & Terms)
 * + Mobile Sticky Bottom Bar synced with F1 (`--bottom-bar-h`).
 */
export const AdsBottomSections = ({
  heroRef,
  formRef,
  onScrollToForm,
}: AdsBottomSectionsProps) => {
  const reducedMotion = useReducedMotion();
  const { contact } = useSiteContact();
  const [heroOut, setHeroOut] = useState(false);
  const [formInView, setFormInView] = useState(false);

  const supportHubLinks = footerLinks.support.filter(
    (l) => l.to !== "/privacy" && l.to !== "/terms" && l.to !== "/get-started",
  );

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
    <>
      {/* Compact "Explore Tioga" Link Hub (from footerLinks) */}
      <section
        aria-labelledby="explore-tioga-heading"
        className="section-padding py-12 sm:py-14 bg-muted/40 dark:bg-card/40 border-b border-border/60"
      >
        <div className="section-container-wide">
          <div className="max-w-2xl mb-7">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary mb-1.5 flex items-center gap-1.5">
              <Compass size={13} />
              <span>Explore Tioga</span>
            </p>
            <h2
              id="explore-tioga-heading"
              className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-tight"
            >
              Jump directly to any service or resource
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[
              { title: "Company", icon: Building2, items: footerLinks.company },
              { title: "Solutions", icon: Layers, items: footerLinks.solutions },
              { title: "Support", icon: HelpCircle, items: supportHubLinks },
            ].map((col, colIdx) => {
              const ColIcon = col.icon;
              return (
                <motion.div
                  key={col.title}
                  initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.3, delay: reducedMotion ? 0 : colIdx * 0.06 }}
                  className="space-y-2.5"
                >
                  <h3 className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border">
                    <ColIcon size={14} className="text-primary" />
                    <span>{col.title}</span>
                  </h3>

                  <div className="space-y-1.5">
                    {col.items.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-all"
                      >
                        <div className="min-w-0">
                          <span className="block text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors">
                            {link.label}
                          </span>
                          <span className="block text-xs text-muted-foreground line-clamp-1">
                            {link.description}
                          </span>
                        </div>
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-muted-foreground group-hover:text-primary transition-transform motion-safe:group-hover:translate-x-1"
                        />
                      </Link>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile Sticky Bottom Bar */}
      <div
        data-testid="ads-mobile-sticky-bar"
        aria-hidden={!showMobileBar}
        className={`fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.14)] transition-transform duration-250 ${
          showMobileBar ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onScrollToForm}
            className="flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-accent text-accent-foreground font-display font-bold text-sm shadow-xs"
          >
            <span>Get Free Quote</span>
            <ArrowRight size={15} />
          </button>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="h-[46px] w-[46px] shrink-0 rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-white grid place-items-center shadow-xs"
          >
            <MessageCircle size={20} />
          </a>
        </div>
      </div>
    </>
  );
};

export default AdsBottomSections;
