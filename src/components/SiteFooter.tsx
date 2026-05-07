import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";

const company = [
  { label: "About", to: "/about" },
  { label: "Solutions", to: "/solutions" },
  { label: "Products", to: "/catalog" },
  { label: "LumiVolt AI", to: "/lumivolt-ai" },
  { label: "Finance", to: "/finance" },
  { label: "Contact", to: "/contact" },
];

const legal = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const SiteFooter = () => (
  <footer className="bg-secondary text-secondary-foreground">
    <div className="section-container py-14">
      <div className="grid gap-10 md:grid-cols-3">
        <div>
          <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-10 w-auto" />
          <p className="mt-4 text-sm text-secondary-foreground/70 max-w-xs leading-relaxed">
            IoT infrastructure and embedded systems company developing intelligent renewable energy solutions. Powering Africa's clean energy transition.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-secondary-foreground/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            All Systems Operational
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-secondary-foreground/50 mb-4">Company</p>
          <ul className="space-y-3 text-sm">
            {company.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-secondary-foreground/85 hover:text-primary transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-secondary-foreground/50 mb-4">Get in touch</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-primary" />
              <a href="mailto:sales@tiogatechnologies.com" className="hover:text-primary transition-colors">
                sales@tiogatechnologies.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle size={14} className="text-primary" />
              <a href="https://wa.me/2348178000023" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                WhatsApp: +234 817 800 0023
              </a>
            </li>
            <li className="text-secondary-foreground/70">
              Monday to Friday<br />9:00 AM to 6:00 PM WAT
            </li>
            <li>
              <Link to="/contact" className="inline-flex items-center gap-1 text-primary hover:brightness-125 font-medium">
                Start a project <ArrowUpRight size={14} />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-secondary-foreground/10 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
        <p className="text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} Tioga Technologies. All rights reserved.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {legal.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-secondary-foreground/70 hover:text-primary transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
