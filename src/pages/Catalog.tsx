import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { getProductsForInterests, groupBySeries, type Product, type ProductInterest } from "@/data/products";

const WHATSAPP = "https://wa.me/2348178000023";

const tierColors: Record<Product["tier"], string> = {
  premium: "bg-accent/15 text-accent-foreground border-accent/30",
  mid: "bg-primary/10 text-primary border-primary/30",
  affordable: "bg-muted text-muted-foreground border-border",
  entry: "bg-background text-muted-foreground border-border",
};

const tierLabels: Record<Product["tier"], string> = {
  premium: "Premium",
  mid: "Mid-tier",
  affordable: "Affordable",
  entry: "Entry Level",
};

const ProductCard = ({ product }: { product: Product }) => {
  const [expanded, setExpanded] = useState(false);
  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${product.name}`);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Placeholder image */}
      <div className="h-36 bg-muted flex items-center justify-center">
        <span className="text-3xl font-display font-bold text-muted-foreground/30">{product.name}</span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-card-foreground text-base leading-tight">{product.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${tierColors[product.tier]}`}>
            {tierLabels[product.tier]}
          </span>
        </div>

        <span className="text-xs font-medium text-primary">Best for: {product.bestFor}</span>

        <ul className="text-xs text-muted-foreground space-y-1">
          {product.features.slice(0, expanded ? undefined : 3).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {f}
            </li>
          ))}
        </ul>

        {product.features.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium flex items-center gap-1">
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> More</>}
          </button>
        )}

        {product.price && <p className="text-xs font-semibold text-accent">{product.price}</p>}

        <a
          href={`${WHATSAPP}?text=${waMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all"
        >
          <MessageCircle size={14} />
          Chat to Order
        </a>
      </div>
    </div>
  );
};

const Catalog = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { products?: ProductInterest[]; budget?: string; fullName?: string } | null;

  const interests = state?.products ?? [];
  const budget = state?.budget;
  const userName = state?.fullName;

  const allProducts = getProductsForInterests(
    interests.length > 0 ? interests : ["solar", "smartlocks", "smarthome", "cctv"],
    budget
  );
  const grouped = groupBySeries(allProducts);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="section-container py-8 space-y-3">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </button>
          <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
            {userName ? `${userName}, here's` : "Here's"} what we{" "}
            <span className="text-accent">recommend for you</span>
          </h1>
          <p className="text-sm text-secondary-foreground/70">
            Carefully selected solutions tailored to your request.
          </p>
        </div>
      </div>

      {/* Product grid */}
      <div className="section-container py-10 space-y-12">
        {Object.entries(grouped).map(([series, products]) => (
          <section key={series} className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">{series}</h2>
              {series === "AlpSolarr Systems" && (
                <p className="text-xs text-muted-foreground mt-1">Smart, efficient residential energy storage systems for modern homes</p>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ))}

        {allProducts.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">No products matched your selection.</p>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              <MessageCircle size={16} /> Chat with us
            </a>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border py-3 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex gap-3">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
          >
            <MessageCircle size={16} />
            Chat on WhatsApp
          </a>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hi, I'd like to request an installation consultation.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            Request Installation
          </a>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
