import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="py-12 bg-secondary text-secondary-foreground/70 border-t border-secondary-foreground/10">
    <div className="section-container">
      <div className="flex flex-col sm:flex-row justify-between gap-8">
        <div>
          <span className="font-display text-xl font-bold text-secondary-foreground tracking-tight">
            Tioga<span className="text-accent">.</span>
          </span>
          <p className="mt-2 text-sm max-w-xs">Solar power, smart home automation, and security solutions across Nigeria.</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2"><Phone size={14} /> +234 800 000 0000</div>
          <div className="flex items-center gap-2"><Mail size={14} /> hello@tiogatech.com</div>
          <div className="flex items-center gap-2"><MapPin size={14} /> Lagos, Nigeria</div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-secondary-foreground/10 text-xs text-center">
        © {new Date().getFullYear()} Tioga Technologies. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
