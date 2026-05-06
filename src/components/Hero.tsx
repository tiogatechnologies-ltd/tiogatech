import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldCheck, Sun, Zap, Home, Camera, ArrowRight, Cpu } from "lucide-react";
import heroSmartHome from "@/assets/hero-smart-home.jpg";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { trackConversion } from "@/lib/tracking";

interface HeroProps {
  onApply: () => void;
}

const navLinks = [
  { label: "About", to: "/about" },
  { label: "Products", to: "/catalog" },
  { label: "LumiVolt AI", to: "/lumivolt-ai" },
  { label: "Finance", to: "/finance" },
  { label: "Contact", to: "/contact" },
];

const Typewriter = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[index];
    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), 1400);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(() => {
      setText((prev) =>
        deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)
      );
    }, deleting ? 40 : 75);
    return () => clearTimeout(t);
  }, [text, deleting, index, words]);

  return <span>{text || "\u00A0"}</span>;
};

const Hero = ({ onApply }: HeroProps) => {
  const whatsappUrl = "https://wa.me/2348178000023";
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  // iPhone-like parallax — subtle, smooth, easeOutQuart
  const parallaxBg = scrollY * 0.35;
  const parallaxFg = scrollY * 0.15;
  const heroOpacity = Math.max(0, 1 - scrollY / 600);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-[100vh] flex items-center overflow-hidden bg-secondary"
    >
      {/* Parallax background image */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${parallaxBg}px, 0) scale(${1 + scrollY * 0.0004})`,
        }}
      >
        <img
          src={heroSmartHome}
          alt="Modern smart home with rooftop solar at golden hour"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 via-secondary/70 to-primary/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent" />
      </div>

      {/* Animated gradient orbs (clean tech motif) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full bg-primary/25 blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
      </div>


      {/* Nav */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-8 py-5">
        <img src={tiogaLogoLight} alt="Tioga Technologies" className="h-8 sm:h-10 w-auto" />
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur-md px-2 py-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all px-4 py-1.5 rounded-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackConversion("whatsapp_click", { source: "header" })}
          className="flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-md px-4 py-2 text-primary-foreground/90 hover:bg-primary-foreground/15 transition-all text-sm font-medium"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>

      {/* Main content with parallax */}
      <div
        className="relative z-10 section-container w-full pt-24 pb-24 sm:pt-28 sm:pb-20"
        style={{
          transform: `translate3d(0, ${-parallaxFg}px, 0)`,
          opacity: heroOpacity,
        }}
      >
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-7">
            <div
              className={`inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 px-3 py-1.5 text-[11px] sm:text-sm text-primary-foreground/90 ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.1s" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <ShieldCheck size={14} />
              <span>Trusted by 100+ Nigerian homes & businesses</span>
            </div>

            <h1
              className={`text-[1.75rem] xs:text-[2rem] sm:text-[2.75rem] md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-primary-foreground leading-[1.08] tracking-[-0.02em] ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.25s" }}
            >
              <span className="block">Powering Nigerian</span>
              <span className="block">homes with</span>
              <span className="relative inline-flex items-center mt-1 sm:mt-2 min-h-[1.15em]">
                <span className="bg-gradient-to-r from-accent via-accent to-yellow-300 bg-clip-text text-transparent">
                  <Typewriter
                    words={[
                      "solar energy.",
                      "smart automation.",
                      "smart locks.",
                      "smart lighting.",
                      "security cameras.",
                      "intelligent living.",
                    ]}
                  />
                </span>
                <span
                  aria-hidden
                  className="ml-1 inline-block w-[3px] sm:w-1 h-[0.85em] bg-accent rounded-sm animate-caret-blink align-middle"
                />
                <span className="hidden sm:inline-flex absolute -top-3 -right-12 items-center justify-center w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 backdrop-blur-md animate-float-slow">
                  <Cpu className="text-accent w-5 h-5" />
                </span>
              </span>
            </h1>

            <p
              className={`text-base sm:text-lg lg:text-xl text-primary-foreground/75 max-w-xl leading-relaxed ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.4s" }}
            >
              Solar, smart automation, and security, engineered into one seamless system for homes and businesses across Nigeria.
            </p>

            <div
              className={`flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2 ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.55s" }}
            >
              <button
                onClick={onApply}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 sm:px-8 py-3 sm:py-4 text-[13px] sm:text-sm font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-2xl shadow-accent/30 hover:shadow-accent/50"
              >
                Get My Personalized Quote
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion("whatsapp_click", { source: "hero" })}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/5 backdrop-blur-md px-5 sm:px-8 py-3 sm:py-4 text-[13px] sm:text-sm font-medium text-primary-foreground hover:bg-primary-foreground/15 active:scale-[0.97] transition-all"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp
              </a>
            </div>

            {/* Mini stat strip */}
            <div
              className={`flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 ${mounted ? "animate-fade-up" : "opacity-0"}`}
              style={{ animationDelay: "0.7s" }}
            >
              {[
                { v: "250+", l: "Installations" },
                { v: "24/7", l: "Monitoring" },
                { v: "2yrs", l: "Warranty" },
              ].map((s) => (
                <div key={s.l} className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-primary-foreground">{s.v}</span>
                  <span className="text-xs uppercase tracking-wider text-primary-foreground/60">{s.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating glass cards (hidden on small) */}
          <div className="lg:col-span-5 relative hidden lg:block h-[520px]">
            {/* Card 1 — Solar */}
            <div
              className={`absolute top-0 right-0 w-64 rounded-2xl bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/20 p-5 shadow-2xl animate-float-slow ${mounted ? "animate-scale-in" : "opacity-0"}`}
              style={{ animationDelay: "0.5s" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Sun className="text-accent" size={20} />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60 uppercase tracking-wider">Solar Output</p>
                  <p className="text-lg font-display font-bold text-primary-foreground">5.2 kW</p>
                </div>
              </div>
              <div className="h-1.5 bg-primary-foreground/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-yellow-300 rounded-full" style={{ width: "78%" }} />
              </div>
              <p className="text-xs text-primary-foreground/60 mt-2">Generating now · Sunny</p>
            </div>

            {/* Card 2 — Smart Home */}
            <div
              className={`absolute top-44 left-0 w-72 rounded-2xl bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/20 p-5 shadow-2xl animate-float-slower ${mounted ? "animate-scale-in" : "opacity-0"}`}
              style={{ animationDelay: "0.7s" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Home className="text-primary-foreground" size={18} />
                  <p className="text-sm font-semibold text-primary-foreground">Smart Home</p>
                </div>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-medium">ONLINE</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Sun, label: "Lights" },
                  { icon: Camera, label: "Cameras" },
                  { icon: Zap, label: "Power" },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-primary-foreground/5 p-3 text-center border border-primary-foreground/10">
                    <item.icon size={16} className="mx-auto text-accent mb-1" />
                    <p className="text-[10px] text-primary-foreground/70">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Savings */}
            <div
              className={`absolute bottom-0 right-8 w-60 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 backdrop-blur-xl border border-accent/30 p-5 shadow-2xl animate-float-slow ${mounted ? "animate-scale-in" : "opacity-0"}`}
              style={{ animationDelay: "0.9s", animationDuration: "7s" }}
            >
              <p className="text-xs text-primary-foreground/70 uppercase tracking-wider mb-1">Monthly Savings</p>
              <p className="text-3xl font-display font-bold text-primary-foreground">₦185k</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-300 text-xs">
                <TrendingUpIcon />
                <span>vs generator fuel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom brand strip — label sits above marquee so it's never covered */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-primary-foreground/10 bg-secondary/50 backdrop-blur-md py-4">
        <div className="section-container">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary-foreground/50 text-center mb-3">
            Trusted brands we install
          </p>
          <div
            className="relative overflow-hidden"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            }}
          >
            <div className="flex gap-14 animate-marquee whitespace-nowrap w-max">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-14 items-center">
                  {["SRNE", "AlpSolarr", "Itel", "Hikvision", "Tuya"].map((b) => (
                    <span key={b} className="text-primary-foreground/70 font-display font-semibold text-base sm:text-lg tracking-tight">
                      {b}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TrendingUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export default Hero;
