import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP = "https://wa.me/2348178000023";

interface Product {
  id: string;
  name: string;
  category: string;
  series: string | null;
  description: string;
  features: string[];
  best_for: string;
  price: string | null;
  tier: string;
  image_url: string | null;
}

const tierColors: Record<string, string> = {
  premium: "bg-accent/15 text-accent-foreground border-accent/30",
  mid: "bg-primary/10 text-primary border-primary/30",
  affordable: "bg-muted text-muted-foreground border-border",
  entry: "bg-background text-muted-foreground border-border",
};

const tierLabels: Record<string, string> = {
  premium: "Premium",
  mid: "Mid-tier",
  affordable: "Affordable",
  entry: "Entry Level",
};

function getTierOrder(budget?: string): string[] {
  if (budget === "₦3M+" || budget === "₦1M – ₦3M") return ["premium", "mid", "affordable", "entry"];
  if (budget === "Below ₦500k") return ["entry", "affordable", "mid", "premium"];
  return ["mid", "premium", "affordable", "entry"];
}

const ProductCard = ({ product }: { product: Product }) => {
  const [expanded, setExpanded] = useState(false);
  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${product.name}`);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="h-28 sm:h-36 bg-muted flex items-center justify-center px-3 text-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg sm:text-2xl font-display font-bold text-muted-foreground/40">{product.name}</span>
        )}
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-2 sm:gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-card-foreground text-sm sm:text-base leading-tight">{product.name}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${tierColors[product.tier] ?? tierColors.entry}`}>
            {tierLabels[product.tier] ?? product.tier}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{product.description}</p>

        <span className="text-xs font-medium text-primary">Best for: {product.best_for}</span>

        <ul className="text-xs text-muted-foreground space-y-1">
          {product.features.slice(0, expanded ? undefined : 2).map((f) => (
            <li key={f} className="flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {f}
            </li>
          ))}
        </ul>

        {product.features.length > 2 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium flex items-center gap-1">
            {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> +{product.features.length - 2} more</>}
          </button>
        )}

        <p className="text-xs font-semibold text-accent">{product.price ?? "Price on request"}</p>

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
  const state = location.state as { products?: string[]; budget?: string; fullName?: string } | null;
  const interests = state?.products ?? [];
  const budget = state?.budget;
  const userName = state?.fullName;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const cats = interests.length > 0
        ? [...new Set(interests.map((i) => {
            if (["solar", "panels", "batteries", "full_solar"].includes(i)) return "solar";
            if (i === "smartlocks") return "smart_locks";
            return i;
          }))]
        : ["solar", "smart_locks", "smarthome", "cctv"];

      const { data } = await supabase
        .from("products")
        .select("id, name, category, series, description, features, best_for, price, tier, image_url")
        .in("category", cats)
        .eq("is_active", true)
        .order("sort_order");

      let results = (data as Product[]) ?? [];
      const tierOrder = getTierOrder(budget);
      results.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
      setProducts(results);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Group by series
  const grouped: Record<string, Product[]> = {};
  for (const p of products) {
    const key = p.series || p.category;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-secondary text-secondary-foreground">
        <div className="section-container py-6 sm:py-8 space-y-3">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-secondary-foreground/60 hover:text-secondary-foreground transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </button>
          <h1 className="text-xl sm:text-3xl font-display font-bold leading-tight">
            {userName ? `${userName}, here's` : "Here's"} what we{" "}
            <span className="text-accent">recommend for you</span>
          </h1>
          <p className="text-sm text-secondary-foreground/70">
            Carefully selected solutions tailored to your request.
          </p>
        </div>
      </div>

      <div className="section-container py-6 sm:py-10 space-y-8 sm:space-y-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-muted-foreground">Loading recommendations...</div>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([series, prods]) => (
              <section key={series} className="space-y-4">
                <h2 className="text-base sm:text-lg font-display font-bold text-foreground">{series}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {prods.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}

            {products.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <p className="text-muted-foreground">No products matched your selection.</p>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                  <MessageCircle size={16} /> Chat with us
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border py-3 px-4">
        <div className="max-w-6xl mx-auto flex gap-3">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 sm:px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Chat on </span>WhatsApp
          </a>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hi, I'd like to request an installation consultation.")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 sm:px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all"
          >
            <span className="hidden sm:inline">Request </span>Installation
          </a>
        </div>
      </div>
    </div>
  );
};

export default Catalog;
