import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Camera, Eye, Sun, HardDrive, Check, ShoppingBag, Cpu } from "lucide-react";
import SiteHeader, { openLeadForm } from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageHero from "@/components/PageHero";
import SEO from "@/components/SEO";
import { useCart } from "@/contexts/CartContext";
import FlexiblePaymentButton from "@/components/FlexiblePaymentButton";
import featureCctv from "@/assets/feature-cctv.jpg";
import featureSecurity from "@/assets/feature-security.jpg";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/seoSchema";
import { supabase } from "@/integrations/supabase/client";

type CctvPackage = {
  id: string;
  name: string;
  brand: string;
  tagline: string | null;
  badge: string | null;
  price: number | null;
  channels: number;
  specs: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

// Static fallback - matches the seeded rows so the page always has content
// even before the cctv_packages table is created in Supabase.
const STATIC_FALLBACK: CctvPackage[] = [
  {
    id: "cctv-4ch",
    name: "4-Channel Smart AI CCTV Kit",
    brand: "Hikvision / Dahua Tier-1",
    tagline: "Ideal for 3-4 Bedroom Residences & Retail Stores",
    badge: "Most Popular",
    price: 480_000,
    channels: 4,
    specs: [
      "4x 5MP ColorVu Full-Color Cameras",
      "1TB Surveillance Hard Drive (30 Days)",
      "AI Human & Vehicle Motion Filtering",
      "4K PoE NVR with Remote Phone Streaming",
      "Complete Cabling & In-House Installation",
    ],
    image_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: "cctv-8ch",
    name: "8-Channel Perimeter Surveillance System",
    brand: "Hikvision Pro Series",
    tagline: "Full Perimeter Coverage for Duplexes & Commercial Offices",
    badge: "Commercial Grade",
    price: 920_000,
    channels: 8,
    specs: [
      "8x 5MP Audio-Enabled Weatherproof IP Cameras",
      "2TB High-Endurance NVR Storage",
      "Perimeter Tripwire & Intrusion Siren",
      "Night Vision up to 40 meters",
      "Free Expert Setup & Mobile App Onboarding",
    ],
    image_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    id: "cctv-solar-ptz",
    name: "4G Solar Standalone Dual-Lens PTZ Camera",
    brand: "Tioga Standalone Pro",
    tagline: "Zero Electricity & Zero WiFi Required - Built-in Solar & SIM Slot",
    badge: "100% Off-Grid",
    price: 165_000,
    channels: 0,
    specs: [
      "Integrated 20W Solar Panel + Lithium Battery",
      "4G LTE SIM Card Slot (Works on MTN/Airtel)",
      "360° Pan-Tilt-Zoom with Auto Motion Tracking",
      "Two-Way Audio Intercom & Flashing Warning Light",
      "128GB High-Speed MicroSD Included",
    ],
    image_url: null,
    is_active: true,
    sort_order: 3,
  },
];

// Resolve the image for a package - prefer DB image_url, else fall back by index.
const resolveImage = (pkg: CctvPackage, idx: number) => {
  if (pkg.image_url) return pkg.image_url;
  return idx % 2 === 0 ? featureCctv : featureSecurity;
};

export const CCTV = () => {
  const { add } = useCart();
  const [packages, setPackages] = useState<CctvPackage[]>(STATIC_FALLBACK);

  useEffect(() => {
    supabase
      .from("cctv_packages" as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && (data as any[]).length > 0) {
          setPackages((data as any[]) as CctvPackage[]);
        }
        // On error or empty table, static fallback stays in place
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="AI CCTV & Security Cameras - 24/7 ColorVu Surveillance Nigeria"
        description="Protect your property with AI-powered CCTV surveillance, 24/7 ColorVu night vision, solar 4G standalone cameras, and remote mobile viewing across Nigeria."
        path="/cctv"
        jsonLd={[
          breadcrumbJsonLd([{ name: "CCTV & Security", path: "/cctv" }]),
          serviceJsonLd({
            name: "Tioga AI CCTV & Security Installation",
            description: "Surveillance camera design, equipment supply, cabling, and remote streaming setup for homes and enterprises in Nigeria.",
            path: "/cctv",
            serviceType: "CCTV and security systems integration",
          }),
        ]}
      />
      <SiteHeader />

      <PageHero
        eyebrow="AI Surveillance & Security · Tioga"
        title="24/7 AI-Powered Property Surveillance"
        subtitle="Full-color night vision, perimeter intrusion detection, solar standalone 4G cameras, and seamless mobile live streaming engineered for Nigerian homes and businesses."
        backgroundImage={featureSecurity}
        backgroundAlt="High-definition AI security surveillance camera monitoring modern building"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openLeadForm("cctv_hero")}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
          >
            Request Free Security Audit
          </button>
          <Link
            to="/retail?category=CCTV"
            className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/20 transition-all"
          >
            <ShoppingBag size={16} /> Shop Individual Cameras
          </Link>
        </div>
      </PageHero>

      {/* Tech Advantages */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Smart Features</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Engineered Beyond Standard Cameras
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Avoid false alarms with real-time AI classification and uninterrupted recording.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Eye size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">24/7 ColorVu Night Vision</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                F1.0 super-apertures capture vivid full-color video even in pitch-black grid blackouts.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Cpu size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">AI Human & Car Filter</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                No more spam alerts from rain or swaying trees. Only get notified when an actual person or car approaches.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Sun size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Solar 4G Off-Grid Ready</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Standalone solar cameras for farmhouses, construction sites, and remote gates with zero wiring needed.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-[var(--shadow-card)] flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <HardDrive size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Encrypted Cloud & NVR</h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                Bank-level AES encryption ensures your video feeds are only accessible to you and authorized family members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Package Configurations */}
      <main className="flex-1 section-padding py-12">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-2">Turnkey Installations</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Complete CCTV Surveillance Packages
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              All kits include high-grade weatherproof cameras, storage drive, professional cabling, and mobile app setup.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="group rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] hover-lift overflow-hidden flex flex-col transition-all"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={resolveImage(pkg, idx)}
                    alt={pkg.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-midnight/90" />
                  {pkg.badge && (
                    <span className="absolute top-4 left-4 text-[10px] uppercase tracking-wider font-bold bg-gold text-midnight px-2.5 py-1 rounded-full shadow-sm">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-primary-foreground/80 mb-1">
                      {pkg.brand}
                    </p>
                    <h3 className="text-xl font-display font-bold text-primary-foreground leading-tight">
                      {pkg.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Complete Installed Package</p>
                    {pkg.price != null ? (
                      <p className="text-2xl font-display font-bold text-foreground">
                        ₦{pkg.price.toLocaleString("en-NG")}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-primary">Contact for pricing</p>
                    )}
                  </div>

                  {pkg.tagline && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{pkg.tagline}</p>
                  )}

                  <div className="space-y-2 mb-6 flex-1">
                    {pkg.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/90">
                        <Check size={14} className="text-primary shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col gap-2">
                    <button
                      onClick={() =>
                        add({
                          refId: pkg.id,
                          type: "package",
                          name: pkg.name,
                          price: pkg.price != null ? `₦${pkg.price.toLocaleString("en-NG")}` : null,
                          numericPrice: pkg.price,
                          category: "CCTV",
                          image: resolveImage(pkg, idx),
                        })
                      }
                      className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 shadow-sm transition-all"
                    >
                      <Camera size={14} /> Add System to Cart
                    </button>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <button
                        onClick={() => openLeadForm(`cctv_${pkg.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-[11px] font-semibold text-foreground transition-colors"
                      >
                        Free Site Survey
                      </button>
                      <FlexiblePaymentButton
                        itemName={pkg.name}
                        itemType="package"
                        itemId={pkg.id}
                        price={pkg.price ?? undefined}
                        className="w-full text-[11px] py-2.5 rounded-xl"
                      />
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

export default CCTV;
