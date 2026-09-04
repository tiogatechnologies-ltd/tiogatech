import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck, KeyRound, Smartphone, Building2, Check, ArrowRight, Truck, Wrench, Shield, ShoppingBag, Eye, SlidersHorizontal } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useSmartLocks, type SmartLock } from "@/hooks/useSmartLocks";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import bgSmartLockApex from "@/assets/bg-smartlock-apex.jpg";
import bgSmartLockHotel from "@/assets/bg-smartlock-hotel.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";

const fmt = (item: SmartLock) =>
  item.price_label?.trim() ||
  (item.price ? `₦${Math.round(item.price).toLocaleString("en-NG")}` : "Quote on Request");

export const SmartLocks = () => {
  const { items, loading } = useSmartLocks();
  const [filter, setFilter] = useState<"all" | "residential" | "commercial" | "hotel">("all");
  const { add } = useCart();

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => x.category === filter);
  }, [items, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="STAMA Smart Locks - Biometric, 3D Face ID & Hotel Keyless Entry"
        description="Explore STAMA intelligent door locks with 3D Face Recognition, biometric fingerprint, Tuya / TTLock app control, and hotel card access across Nigeria."
        path="/smart-locks"
        jsonLd={[
          breadcrumbJsonLd([{ name: "Smart Locks", path: "/smart-locks" }]),
          serviceJsonLd({
            name: "STAMA Smart Lock Supply and Installation",
            description: "Biometric and smart access locks for Nigerian homes, luxury apartments, and commercial hotels.",
            path: "/smart-locks",
            serviceType: "Access control and security installation",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="STAMA Security Hardware · Powered by Tioga"
        title="Next-Generation Keyless Access & Smart Locks"
        subtitle="Military-grade security, biometric fingerprint, 3D structured-light facial recognition, and smartphone app control engineered for Nigerian homes, estates, and hotels."
        backgroundImage={bgSmartLockApex}
        backgroundAlt="Luxury STAMA smart door lock installed on modern wooden door"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("smart_locks_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
          >
            Request Lock Installation
          </button>
          <Link
            to="/retail?category=Smart+Locks"
            className="inline-flex items-center gap-2 rounded-full bg-midnight/70 backdrop-blur-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-midnight/90 hover:border-white/50 shadow-lg shadow-black/20 transition-all"
          >
            <ShoppingBag size={16} /> Browse Retail Inventory
          </Link>
        </div>
      </PageHero>

      {/* Trust Highlights */}
      <section className="border-b border-border bg-card/60 py-6">
        <div className="section-container grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Anti-Tamper Alarm</p>
              <p className="text-[11px] text-muted-foreground">Built-in siren & phone alert</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-gold/15 text-gold-dark dark:text-gold flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Tuya & TTLock</p>
              <p className="text-[11px] text-muted-foreground">Remote OTP & log history</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wrench size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">Free Expert Install</p>
              <p className="text-[11px] text-muted-foreground">Lagos & Abuja warranty</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 p-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <KeyRound size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-xs sm:text-sm text-foreground">6-in-1 Unlock</p>
              <p className="text-[11px] text-muted-foreground">Face, Finger, Card, Key, App, PIN</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Showcase */}
      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-2">Hardware Collection</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
                STAMA Smart Lock Models
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
                Choose the exact form factor and security level for your main security door, wooden interior door, or hotel master suite.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: "all", label: "All Locks" },
                { id: "residential", label: "Residential" },
                { id: "commercial", label: "Commercial / Office" },
                { id: "hotel", label: "Hotel Keycard" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filter === t.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((lock, i) => (
              <div
                key={lock.id}
                className="group rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col transition-all"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={lock.image}
                    alt={lock.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                    {lock.model && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-gold/90 backdrop-blur-md border border-gold/40 text-midnight px-2.5 py-1 rounded-full shadow-md">
                        {lock.model}
                      </span>
                    )}
                    {lock.badge && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/90 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full shadow-md">
                        {lock.badge}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-midnight/80 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-primary-foreground/80 mb-1">
                      {lock.series || "STAMA Series"}
                    </p>
                    <h3 className="text-xl font-display font-bold text-primary-foreground leading-tight">
                      {lock.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Price</p>
                    <p className="text-2xl font-display font-bold text-foreground">{fmt(lock)}</p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {lock.description}
                  </p>

                  <div className="space-y-2 mb-6 flex-1">
                    {lock.features.slice(0, 4).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    {lock.price ? (
                      <button
                        onClick={() =>
                          add({
                            id: `lock-${lock.id}`,
                            name: lock.name,
                            price: lock.price || 0,
                            category: "Smart Locks",
                            image: lock.image,
                          })
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                      >
                        <ShoppingBag size={14} /> Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => openLeadForm(`smart_lock_${lock.id}`)}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold text-midnight text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                      >
                        Request Quote / Consultation
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/retail?category=Smart+Locks&search=${encodeURIComponent(lock.name)}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-[11px] font-semibold text-foreground transition-colors"
                      >
                        <Eye size={12} /> Retail Specs
                      </Link>
                      {lock.price && lock.price > 100_000 && (
                        <div className="flex-1">
                          <FlexiblePaymentButton
                            amount={lock.price}
                            productName={lock.name}
                            productType="lock"
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

          {/* Architectural Lock Comparison Table */}
          <div className="mt-16 p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)]">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Technical Matrix</p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                STAMA Feature Comparison
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Detailed hardware capabilities across our smart lock product tiers.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-foreground font-display font-bold">
                    <th className="p-3.5">Feature</th>
                    <th className="p-3.5">Apex (Face ID)</th>
                    <th className="p-3.5">Pro (Biometric)</th>
                    <th className="p-3.5">Base (Keypad)</th>
                    <th className="p-3.5">Hotel (Keycard)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">3D Face Recognition</td>
                    <td className="p-3.5 text-emerald-500 font-bold">Structured Light (0.3s)</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Biometric Fingerprint</td>
                    <td className="p-3.5 text-emerald-500">Live Semiconductor (99.8%)</td>
                    <td className="p-3.5 text-emerald-500">Live Semiconductor (99.8%)</td>
                    <td className="p-3.5">-</td>
                    <td className="p-3.5">-</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Mobile App Control</td>
                    <td className="p-3.5 text-emerald-500">Tuya Smart / Smart Life</td>
                    <td className="p-3.5 text-emerald-500">Tuya Smart / TTLock</td>
                    <td className="p-3.5 text-emerald-500">TTLock Bluetooth</td>
                    <td className="p-3.5 text-emerald-500">Hotel PMS Integration</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Emergency Physical Key</td>
                    <td className="p-3.5 text-emerald-500">Class C Hidden Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Class C Hidden Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Class C Cylinder</td>
                    <td className="p-3.5 text-emerald-500">Master Key Override</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-foreground">Battery Life</td>
                    <td className="p-3.5">Rechargeable Li-Ion (6-8 mos)</td>
                    <td className="p-3.5">8x AA Alkaline (10-12 mos)</td>
                    <td className="p-3.5">4x AA Alkaline (12 mos)</td>
                    <td className="p-3.5">4x AA Alkaline (14 mos)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SmartLocks;
