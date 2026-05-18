import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import AppWaitlistForm from "@/components/AppWaitlistForm";
import { Link } from "react-router-dom";
import { ArrowLeft, Smartphone, Sparkles } from "lucide-react";
import bgComingSoon from "@/assets/bg-coming-soon.jpg";

const ComingSoon = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Tioga App — Coming Soon"
        description="Join the waitlist for the Tioga mobile app. Control your solar power, smart locks and home automation from one place."
        path="/coming-soon"
      />
      <SiteHeader />
      <section className="relative flex-1 flex items-center overflow-hidden">
        <img
          src={bgComingSoon}
          alt="Tioga mobile app coming soon"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-midnight/95 via-midnight/85 to-midnight/70" />
        <div className="relative section-container py-20 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/40 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-gold font-semibold mb-6">
            <Sparkles size={14} /> Coming Soon
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight mb-4 no-clip">
            Our App Is On The Way
          </h1>
          <p className="max-w-xl mx-auto text-primary-foreground/80 text-lg leading-relaxed mb-8">
            We are crafting a beautiful mobile experience to control your solar power, smart locks and home automation, all in one place. Join the waitlist to be first to know.
          </p>

          <AppWaitlistForm />

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15 transition-all"
            >
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 text-xs text-primary-foreground/65">
            <Smartphone size={14} /> iOS and Android, free download
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default ComingSoon;
