import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import tiogaLogoDark from "@/assets/tioga-logo-dark.png";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Solutions", to: "/solutions" },
  { label: "Products", to: "/catalog" },
  { label: "LumiVolt AI", to: "/lumivolt-ai" },
  { label: "Finance", to: "/finance" },
  { label: "Contact", to: "/contact" },
];

const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  // Transparent over the dark hero at top; solid light when scrolled.
  const onDark = !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-all duration-300",
        onDark
          ? "bg-transparent border-b border-transparent"
          : "bg-background/90 backdrop-blur-md border-b border-border shadow-sm",
      )}
    >
      <div className="section-container flex items-center justify-between py-3 sm:py-4">
        <Link to="/" className="flex items-center">
          <img
            src={onDark ? tiogaLogoLight : tiogaLogoDark}
            alt="Tioga Technologies"
            className="h-9 sm:h-10 w-auto"
          />
        </Link>

        <nav
          className={cn(
            "hidden lg:flex items-center gap-1 rounded-full px-2 py-1.5 transition-colors",
            onDark
              ? "border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur-md"
              : "",
          )}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                  onDark
                    ? isActive
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    : isActive
                      ? "text-primary"
                      : "text-foreground/70 hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/contact"
            className={cn(
              "hidden sm:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] shadow-md",
              onDark
                ? "bg-accent text-accent-foreground hover:brightness-110 shadow-accent/30"
                : "bg-primary text-primary-foreground hover:brightness-110 shadow-primary/20",
            )}
          >
            Get Started
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "lg:hidden p-2 rounded-md transition-colors",
              onDark
                ? "text-primary-foreground hover:bg-primary-foreground/10"
                : "text-foreground hover:bg-muted",
            )}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-up">
          <nav className="section-container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-3 rounded-lg text-sm font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Get Started
            </Link>
            <a
              href="https://wa.me/2348178000023"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
