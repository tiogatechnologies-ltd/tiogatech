import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Lightbulb, Smartphone, Music, Wifi, Check, ShoppingBag, Eye, ShieldCheck, Cpu, Sliders, Zap } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useHomeAutomationPackages, type HomeAutomationPackage } from "@/hooks/useHomeAutomationPackages";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import bgAutomation from "@/assets/bg-voltai-ai.jpg";
import featureApp from "@/assets/feature-smart-app.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";

const fmt = (p: HomeAutomationPackage) =>
  p.price_label ?? (p.price ? `From ₦${(p.price / 1_000_000).toFixed(1)}M` : "Custom Quote");

export const HomeAutomation = () => {
  const { items, loading } = useHomeAutomationPackages();
  const { add } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Smart Home Automation - Intelligent Lighting, Curtains & Climate in Nigeria"
        description="Experience luxury smart home living with VoltAi automated lighting, voice control, smart curtain tracks, and multi-room audio installed across Nigeria."
        path="/home-automation"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Home Automation", path: "/home-automation" }]),
          serviceJsonLd({
            name: "Tioga Home Automation Systems",
            description: "Smart lighting, climate control, automated curtains, and voice integration designed for Nigerian homes.",
            path: "/home-automation",
            serviceType: "Smart Home & IoT System Installation",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="Intelligent Home IoT · VoltAi"
        title="One Touch. Complete Home Orchestration."
        subtitle="Transform your residence with intelligent scene lighting, motorized curtain automation, smart air-conditioning controls, and voice-assisted living designed for Nigeria."
        backgroundImage={bgAutomation}
        backgroundAlt="Modern luxury living room with ambient smart lighting and digital interface"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("home_automation_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
          >
            Request Custom Automation Plan
          </button>
          <Link
            to="/retail?category=Home+Automation"
            className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all"
          >
            <ShoppingBag size={16} /> Shop IoT Switches & Modules
          </Link>
        </div>
      </PageHero>

      {/* Feature Capabilities Grid */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              What Tioga Smart Automation Unifies
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              All sub-systems work in harmony under a single interface with local offline reliability.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Lightbulb size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Smart Lighting & Moods</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Touch glass switches, RGB ambient strips, motion pathway sensors, and scheduled welcome scenes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Sliders size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Climate & AC Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                IR smart controllers turn on your ACs before you arrive home and auto-throttle when on solar battery backup.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Home size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Motorized Curtains</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Ultra-quiet motorized tracks that glide open at sunrise and close for night privacy via schedule or voice command.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Music size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Multi-Room Audio</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Ceiling flush architectural speakers with Bluetooth/AirPlay streaming for dinner, cinema, or outdoor patio entertainment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Package Configurations */}
      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Curated Packages</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Turnkey Smart Home Setups
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Engineered turnkey packages customized for apartments, duplexes, and luxury detached mansions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((pkg, i) => (
              <div
                key={pkg.id}
                className="group rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col transition-all"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={pkg.image}
                    alt={pkg.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {pkg.badge && (
                    <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider font-bold bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight px-2.5 py-1 rounded-full shadow-md">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-midnight/65 backdrop-blur-md border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-primary-foreground/80 mb-1">
                      {pkg.tagline}
                    </p>
                    <h3 className="text-xl font-display font-bold text-primary-foreground leading-tight">
                      {pkg.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Starting From</p>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(pkg)}</p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="space-y-2 mb-6 flex-1">
                    {pkg.features.slice(0, 5).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                        <Check size={14} className="text-primary shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    {pkg.price ? (
                      <button
                        onClick={() =>
                          add({
                            id: `automation-${pkg.id}`,
                            name: pkg.name,
                            price: pkg.price || 0,
                            category: "Home Automation",
                            image: pkg.image,
                          })
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                      >
                        <ShoppingBag size={14} /> Add System to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => openLeadForm(`automation_${pkg.id}`)}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold text-midnight text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                      >
                        Request Custom Design
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openLeadForm(`consult_${pkg.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-[11px] font-semibold text-foreground transition-colors"
                      >
                        <Eye size={12} /> Book Site Survey
                      </button>
                      {pkg.price && pkg.price > 300_000 && (
                        <div className="flex-1">
                          <FlexiblePaymentButton
                            amount={pkg.price}
                            productName={pkg.name}
                            productType="package"
                            className="w-full text-[11px] py-2 rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomeAutomation;
