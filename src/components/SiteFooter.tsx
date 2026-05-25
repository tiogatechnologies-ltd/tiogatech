import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MessageCircle, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { toast } from "@/components/ui/sonner";
import SocialLinks from "@/components/SocialLinks";
import { supabase } from "@/integrations/supabase/client";
import { TELEGRAM_COMMUNITY_URL } from "@/components/TelegramWidget";

const company = [
  { label: "About", to: "/about" },
  { label: "Career", to: "/career" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
  { label: "LumiVolt — Residential", to: "/lumivolt" },
  { label: "VoltAi — Smart Automation", to: "/voltai" },
];

const solutions = [
  { label: "Packages", to: "/packages" },
  { label: "Solar Inverters", to: "/catalog?cat=inverter" },
  { label: "Solar Panels", to: "/catalog?cat=panels" },
  { label: "Smart Locks", to: "/catalog?cat=smart-lock" },
  { label: "CCTV", to: "/catalog?cat=cctv" },
  { label: "Smart Lights", to: "/catalog?cat=smart-lights" },
];

const support = [
  { label: "How It Works", to: "/#how-it-works" },
  { label: "FAQs", to: "/#faq" },
  { label: "Finance", to: "/finance" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const SiteFooter = () => {
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
      const { error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: { email, source: "footer" },
      });
      if (error) throw error;
      toast.success("Subscribed! Check your inbox for a welcome message.");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Could not subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-midnight text-primary-foreground">
      <div className="section-container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-10 w-auto" />
            <p className="mt-4 text-sm text-primary-foreground/65 max-w-xs leading-relaxed">
              IoT infrastructure and embedded systems company powering Africa's clean energy transition.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-primary-foreground/65">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              All Systems Operational
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-gold shrink-0" />
                <a href="mailto:sales@tiogatechnologies.com" className="hover:text-gold transition-colors">
                  sales@tiogatechnologies.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-gold shrink-0" />
                <a href="https://wa.me/2348178000023" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  +234 817 800 0023
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-gold shrink-0" />
                <a href="tel:+2349035966388" className="hover:text-gold transition-colors">
                  0903 596 6388
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-gold shrink-0 mt-0.5" />
                <span className="text-primary-foreground/85 leading-relaxed">
                  No 7, Commercial Layout, Abattoir Rd, LGA, behind Airforce Primary School, Jos 930103, Plateau State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold shrink-0" />
                <span className="text-primary-foreground/85">Mon to Fri · 10am to 6pm</span>
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
              {support.map((l) => (
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-midnight hover:brightness-110 active:scale-[0.97] transition-all"
                >
                  Subscribe <ArrowUpRight size={14} />
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
