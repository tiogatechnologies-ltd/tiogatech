import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, Sparkles, ChevronDown } from "lucide-react";
import tiogaLogoDark from "@/assets/tioga-logo-dark.png";
import tiogaLogoLight from "@/assets/tioga-logo-light.png";
import { cn } from "@/lib/utils";
import MegaMenu from "@/components/MegaMenu";
import CartButton from "@/components/CartButton";
import AccountButton from "@/components/AccountButton";

// Sub-brands now live inside the Products mega-menu (see MegaMenu.tsx).
const brandLinks: { label: string; to: string }[] = [
  { label: "LumiVolt", to: "/lumivolt" },
];

// Secondary links shown after the merged Products mega-menu.
const secondaryLinks = [
  { label: "Finance", to: "/finance" },
  { label: "Career", to: "/career" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const productSubLinks = [
  { label: "Packages", to: "/packages" },
  { label: "Retail", to: "/catalog" },
  { label: "VoltAi", to: "/voltai" },
];

// Open the lead form anywhere on the site by dispatching this event.
export const openLeadForm = (source = "ai_badge") => {
  window.dispatchEvent(new CustomEvent("tioga:open-lead-form", { detail: { source } }));
};

const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [productsDesktopOpen, setProductsDesktopOpen] = useState(false);
  const productsWrapRef = useRef<HTMLDivElement>(null);
  const productsBtnRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setProductsDesktopOpen(false);
  }, [location.pathname]);

  // Close desktop dropdown on outside click + Escape
  useEffect(() => {
    if (!productsDesktopOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!productsWrapRef.current?.contains(e.target as Node)) {
        setProductsDesktopOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProductsDesktopOpen(false);
        productsBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [productsDesktopOpen]);

  const openProducts = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setProductsDesktopOpen(true);
  };
  const scheduleCloseProducts = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setProductsDesktopOpen(false), 140);
  };

  const onDark = !scrolled && !open;

  const handleAiClick = () => { openLeadForm("ai_badge"); };

  return (
    <header
      className={cn(
        "fixed top-0 z-40 w-full transition-all duration-300",
        onDark
          ? "bg-transparent border-b border-transparent"
          : "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm",
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
            "hidden lg:flex items-center gap-0.5 rounded-full px-2 py-1.5 transition-colors",
            onDark
              ? "border border-primary-foreground/15 bg-primary-foreground/5 backdrop-blur-md"
              : "",
          )}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
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
            Home
          </NavLink>



          {/* Merged Products mega-menu */}
          <div
            ref={productsWrapRef}
            className="relative"
            onMouseEnter={openProducts}
            onMouseLeave={scheduleCloseProducts}
          >
            <button
              ref={productsBtnRef}
              type="button"
              onClick={() => setProductsDesktopOpen((v) => !v)}
              onFocus={openProducts}
              className={cn(
                "px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors inline-flex items-center gap-1",
                onDark
                  ? productsDesktopOpen
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  : productsDesktopOpen
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground",
              )}
              aria-haspopup="menu"
              aria-expanded={productsDesktopOpen}
              aria-controls="products-mega-menu"
            >
              Products{" "}
              <ChevronDown
                size={14}
                className={cn("opacity-70 transition-transform", productsDesktopOpen && "rotate-180")}
              />
            </button>
            <div id="products-mega-menu">
              <MegaMenu
                onDark={onDark}
                open={productsDesktopOpen}
                onClose={() => setProductsDesktopOpen(false)}
              />
            </div>
          </div>

          {[...brandLinks, ...secondaryLinks].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
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
          <CartButton onDark={onDark} />
          <AccountButton onDark={onDark} />
          {/* AI Recommendation badge — always high-contrast */}
          <button
            type="button"
            onClick={handleAiClick}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97] animate-ai-glow",
              "bg-gold text-midnight border-2 border-gold hover:brightness-110 shadow-lg shadow-gold/40",
            )}
            aria-label="Open AI recommendation"
          >
            <Sparkles size={13} className="fill-midnight" />
            <span className="hidden xs:inline sm:inline">AI Recommend</span>
            <span className="xs:hidden sm:hidden">AI</span>
          </button>

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
        <div className="lg:hidden border-t border-border bg-background animate-fade-up max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="section-container py-4 flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn("px-3 py-3 rounded-lg text-sm font-medium",
                  isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted")
              }
            >
              Home
            </NavLink>



            {/* Mobile Products accordion */}
            <button
              type="button"
              onClick={() => setProductsOpen((v) => !v)}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:bg-muted"
              aria-expanded={productsOpen}
            >
              Products
              <ChevronDown size={16} className={cn("transition-transform", productsOpen && "rotate-180")} />
            </button>
            {productsOpen && (
              <div className="ml-3 pl-3 border-l border-border flex flex-col gap-0.5 mb-1">
                {productSubLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="px-3 py-2 text-sm text-foreground/75 hover:text-primary">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}

            {[...brandLinks, ...secondaryLinks].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn("px-3 py-3 rounded-lg text-sm font-medium",
                    isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted")
                }
              >
                {l.label}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={handleAiClick}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-midnight shadow-md shadow-gold/40"
            >
              <Sparkles size={14} className="fill-midnight" /> AI Recommend
            </button>
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
