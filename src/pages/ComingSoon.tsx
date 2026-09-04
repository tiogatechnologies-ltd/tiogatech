import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag, Calculator, Wallet, Package } from "lucide-react";
import bgComingSoon from "@/assets/bg-coming-soon.jpg";

const ComingSoon = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Tioga Retail - Coming Soon"
        description="The Tioga online retail store is launching soon. Meanwhile, size your system with our Energy Calculator or spread payments with Flexible Payment."
        path="/coming-soon"
      />
      <SiteHeader />
      <section className="relative flex-1 flex items-center overflow-hidden">
        <img
          src={bgComingSoon}
          alt="Tioga retail store launching soon"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-midnight/95" />
        <div className="relative section-container py-20 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/40 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-gold font-semibold mb-6">
            Retail Store - Coming Soon
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight mb-4 no-clip">
            Our Online Store Is On The Way
          </h1>
          <p className="max-w-xl mx-auto text-primary-foreground/80 text-lg leading-relaxed mb-10">
            We are building a beautiful shopping experience for solar kits, smart locks and home automation gear. In the meantime, explore our newest tools and browse the current catalog.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <Link
              to="/energy-calculator"
              className="group rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 p-5 hover:bg-primary-foreground/15 transition-all"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/20 text-gold mb-3">
                <Calculator size={20} />
              </span>
              <p className="font-display font-bold text-lg leading-tight mb-1">Energy Calculator</p>
              <p className="text-sm text-primary-foreground/75 leading-snug mb-3">
                Size the right solar system for your home or business in under 60 seconds.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                Try it now <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link
              to="/finance"
              className="group rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 p-5 hover:bg-primary-foreground/15 transition-all"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/20 text-gold mb-3">
                <Wallet size={20} />
              </span>
              <p className="font-display font-bold text-lg leading-tight mb-1">Flexible Payment</p>
              <p className="text-sm text-primary-foreground/75 leading-snug mb-3">
                Pay 30% now, spread the rest over 3, 6, 12 or 24 months - Easy Flex.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                See plans <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 rounded-full bg-gold text-midnight px-6 py-3 text-sm font-bold hover:brightness-110 shadow-md shadow-gold/30 transition-all"
            >
              <Package size={16} /> Browse Packages
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 text-xs text-primary-foreground/65">
            <ShoppingBag size={14} /> Full retail checkout launching soon
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default ComingSoon;
