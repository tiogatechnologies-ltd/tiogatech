import { Phone, Mail, MapPin } from "lucide-react";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";

const Footer = () => (
  <footer className="py-12 bg-secondary text-secondary-foreground/70 border-t border-secondary-foreground/10">
    <div className="section-container">
      <div className="flex flex-col sm:flex-row justify-between gap-8">
        <div>
          <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-10 w-auto" />
          <p className="mt-2 text-sm max-w-xs">Solar power, smart home automation, and security solutions across Nigeria.</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2"><Phone size={14} /> +234 817 800 0023</div>
          <div className="flex items-center gap-2"><Mail size={14} /> sales@tiogatechnologies.com</div>
          <div className="flex items-center gap-2"><MapPin size={14} /> Ikeja, Lagos, Nigeria</div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-secondary-foreground/10 text-xs text-center">
        © {new Date().getFullYear()} Tioga Technologies. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
