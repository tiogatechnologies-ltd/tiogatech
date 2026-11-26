import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MessageCircle, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { toast } from "@/components/ui/sonner";
import SocialLinks from "@/components/SocialLinks";
import { supabase } from "@/integrations/supabase/client";
import { TELEGRAM_COMMUNITY_URL } from "@/components/TelegramWidget";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";
import { useSiteSetting } from "@/hooks/useSiteSetting";
import { footerLinks } from "@/lib/footerLinks";

const { company, solutions, support } = footerLinks;

interface SiteFooterProps {
  phoneOverride?: string;
}

const SiteFooter = ({ phoneOverride }: SiteFooterProps = {}) => {
  const { contact } = useSiteContact();
  const displayPhone = phoneOverride || contact.phone;
  const { settings: features } = useSiteSetting("features");
  const flexiblePaymentEnabled = features?.flexible_payment_enabled !== false;
  const visibleSupport = flexiblePaymentEnabled
    ? support
    : support.filter((l) => l.to !== "/finance");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email, source: "footer" },
      });
      if (error) throw error;
      toast.success(
        data?.pending_confirmation
          ? "Almost there - check your inbox to confirm."
          : "You're already subscribed. Thanks!"
      );
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Could not subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative isolate overflow-hidden bg-midnight text-primary-foreground">
      {/* Top transition seam: 1px gold gradient hairline + subtle top-center emerald glow (clearly visible in Dark Mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-48 -z-10"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, hsla(152, 85%, 45%, 0.11) 0%, transparent 75%)",
        }}
      />
      {/* Lazy-loaded atmospheric solar background texture blended cleanly over midnight dark */}
      <img
        src="/footer-bg.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-center -z-20 opacity-[0.12] dark:opacity-[0.18] mix-blend-luminosity"
      />
      {/* Top-to-bottom dark fade so bottom links & copyright remain >= WCAG AA contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-midnight/70 via-midnight/90 to-midnight"
      />
      <div className="section-container-wide py-14 relative z-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 2xl:gap-14">
          <div>
            <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-10 w-auto" />
            <p className="mt-4 text-sm text-primary-foreground/65 max-w-xs leading-relaxed">
              IoT infrastructure and embedded systems company powering Africa's clean energy transition.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-gold shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-gold transition-colors">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-gold shrink-0" />
                <a href={whatsappLink(contact)} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  {contact.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-gold shrink-0" />
                <a href={`tel:${displayPhone.replace(/[^\d+]/g, "")}`} className="hover:text-gold transition-colors">
                  {displayPhone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-gold shrink-0 mt-0.5" />
                <span className="text-primary-foreground/85 leading-relaxed">
                  {contact.address}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold shrink-0" />
                <span className="text-primary-foreground/85">{contact.business_hours}</span>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/45 mb-2">Follow Us</p>
              <SocialLinks variant="light" size="sm" />
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/45 mb-4">Company</p>
            <ul className="space-y-3 text-sm">
              {company.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-primary-foreground/85 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/45 mb-4">Solutions</p>
            <ul className="space-y-3 text-sm">
              {solutions.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-primary-foreground/85 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary-foreground/45 mb-4">Support</p>
            <ul className="space-y-3 text-sm mb-6">
              {visibleSupport.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-primary-foreground/85 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl bg-primary-foreground/5 border border-primary-foreground/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-gold/80 mb-1">Newsletter</p>
              <p className="text-xs text-primary-foreground/70 mb-3 leading-snug">
                Energy tips, package launches and grid alerts.
              </p>
              <form onSubmit={onSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-lg bg-primary-foreground/10 border border-primary-foreground/15 px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-gold/60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-midnight hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-60"
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Subscribing</> : <>Subscribe <ArrowUpRight size={14} /></>}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
          <p className="text-xs text-primary-foreground/55">
            © {new Date().getFullYear()} Tioga Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
