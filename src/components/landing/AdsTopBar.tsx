import { Link } from "react-router-dom";
import { Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import tiogaLogoDark from "@/assets/tioga-logo-dark.png";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { useSiteContact } from "@/hooks/useSiteContact";

interface AdsTopBarProps {
  onScrollToForm: () => void;
}

/**
 * Minimal conversion-focused top bar for `/get-started` and `/lp/:campaign`.
 * Intentionally omits `SiteHeader`, floating pill nav, and `MegaMenu` so ad traffic
 * stays focused on requesting a quote or calling directly.
 */
export const AdsTopBar = ({ onScrollToForm }: AdsTopBarProps) => {
  const { contact } = useSiteContact();
  const telHref = `tel:${contact.phone.replace(/[^\d+]/g, "")}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="section-container-wide h-16 flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Tioga Technologies home"
          className="inline-flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        >
          <img
            src={tiogaLogoDark}
            alt="Tioga Technologies"
            width={132}
            height={36}
            className="h-9 w-auto dark:hidden"
          />
          <img
            src={tiogaLogoLight}
            alt="Tioga Technologies"
            width={132}
            height={36}
            className="h-9 w-auto hidden dark:block"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.a
            whileTap={{ scale: 0.97 }}
            href={telHref}
            aria-label={`Call Tioga Technologies at ${contact.phone}`}
            className="inline-flex items-center justify-center gap-2 h-11 min-w-[44px] px-3 sm:px-3.5 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Phone size={16} className="text-primary shrink-0" />
            <span className="hidden md:inline">{contact.phone}</span>
          </motion.a>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onScrollToForm}
            className="inline-flex items-center justify-center gap-1.5 h-11 px-4 sm:px-5 rounded-md bg-accent text-accent-foreground font-display font-bold text-xs sm:text-sm hover:brightness-105 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Get My Free Quote</span>
            <ArrowRight size={15} className="shrink-0" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default AdsTopBar;
