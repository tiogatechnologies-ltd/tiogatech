import { MessageCircle, ShieldCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";

interface HeroProps {
  onApply: () => void;
}

const navLinks = [
  { label: "Solutions", href: "#solutions" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Us", href: "#trust" },
];

const Hero = ({ onApply }: HeroProps) => {
  const whatsappUrl = "https://wa.me/2348178000023";

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center overflow-hidden">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />

      {/* Nav */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 py-5">
        <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-8 sm:h-10 w-auto" />
        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>

      {/* Content */}
      <div className="relative z-10 section-container w-full pt-24 pb-16">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-4 py-1.5 text-sm text-primary-foreground/90">
            <ShieldCheck size={14} />
            Trusted by 100+ customers
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-[1.1] tracking-tight">
            Reliable Power.{" "}
            <span className="text-accent">Smarter Living.</span>
          </h1>

          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Solar, smart home, and security solutions for homes and businesses across Nigeria.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onApply}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
            >
              Get Started
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/30 px-8 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 transition-all"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
