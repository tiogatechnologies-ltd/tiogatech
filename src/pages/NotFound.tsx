import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Mail, Package, Phone, Newspaper, ShoppingBag } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

const SUGGESTIONS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/packages", label: "Solar Packages", icon: Package },
  { to: "/catalog", label: "Product Catalog", icon: ShoppingBag },
  { to: "/blog", label: "Blog", icon: Newspaper },
  { to: "/contact", label: "Contact", icon: Phone },
  { to: "/newsletter/confirm", label: "Newsletter", icon: Mail },
];

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Page not found (404)" description="The page you're looking for doesn't exist." path={location.pathname} />
      <SiteHeader />
      <main className="flex-1 pt-28 sm:pt-32 pb-20">
        <div className="section-container max-w-2xl text-center">
          <p className="font-display text-7xl sm:text-8xl font-bold text-primary tracking-tight">404</p>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl font-bold no-clip">We couldn't find that page</h1>
          <p className="mt-3 text-muted-foreground">
            The page <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> may have moved, or never existed. Try one of these instead:
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUGGESTIONS.map((s) => (
              <Link key={s.to} to={s.to} className="group rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-md transition-all">
                <s.icon size={18} className="text-primary mx-auto" />
                <p className="mt-2 text-sm font-semibold group-hover:text-primary">{s.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
