import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, MessageCircle, Sparkles, Zap, Crown } from "lucide-react";

const WA = "https://wa.me/2348000000000?text=";

const PLANS = [
  {
    id: "free",
    name: "Free Starter",
    price: "₦0",
    period: "/forever",
    icon: Sparkles,
    accent: "border-border",
    features: [
      "3 free AI solar analyses",
      "Basic system sizing",
      "Recommended package match",
      "Email summary",
    ],
    cta: "Start free",
    href: "/solar-assessment",
    external: false,
  },
  {
    id: "starter",
    name: "AI Starter",
    price: "₦2,500",
    period: "/month",
    icon: Zap,
    accent: "border-primary shadow-[var(--shadow-elevated)]",
    badge: "Most popular",
    features: [
      "20 AI credits per month",
      "Full engineering reports + PDF",
      "Bill of materials breakdown",
      "Priority recommendations",
      "Unused credits roll over up to 30 days",
    ],
    cta: "Talk to sales",
    href: `${WA}${encodeURIComponent("Hi Tioga, I'd like to subscribe to AI Starter (₦2,500/mo, 20 credits).")}`,
    external: true,
  },
  {
    id: "custom",
    name: "AI Custom",
    price: "Custom",
    period: "",
    icon: Crown,
    accent: "border-accent",
    features: [
      "Everything in Starter",
      "Choose your monthly credit pack",
      "Commercial & multi-site assessments",
      "Installer / consultant dashboard",
      "Priority engineer review",
      "API / bulk access on request",
    ],
    cta: "Build my plan",
    href: `${WA}${encodeURIComponent("Hi Tioga, I'd like a custom AI plan. My monthly usage is around: ")}`,
    external: true,
  },
];


const Pricing = () => {
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("ai_subscriptions").select("*").eq("user_id", user.id).maybeSingle();
      setSub(data);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="AI Pricing — Tioga Energy Intelligence" description="Tioga AI plans: 3 free solar assessments, then 20 monthly AI credits for ₦2,500, or a custom credit pack for installers and SMEs." path="/ai-pricing" />
      <SiteHeader />
      <main className="flex-1 bg-muted/20 py-14 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} /> AI Energy Intelligence
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight no-clip">Plans for every solar journey</h1>
            <p className="mt-4 text-muted-foreground">Use Tioga AI free for your first 3 analyses. Upgrade to 20 monthly credits, or build a custom pack sized to your usage.</p>
          </div>

          {sub && (sub.plan === "starter" || sub.plan === "business" || sub.plan === "custom") && sub.status === "active" && (
            <div className="max-w-md mx-auto mb-8 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-center text-sm">
              You're on <strong className="capitalize">{sub.plan}</strong> · active{sub.expires_at ? ` until ${new Date(sub.expires_at).toLocaleDateString()}` : ""}.
            </div>
          )}


          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.id} className={`relative rounded-3xl border bg-card p-7 flex flex-col ${p.accent}`}>
                  {p.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">{p.badge}</span>}
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-4"><Icon size={20} /></div>
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold">{p.price}</span>
                    <span className="text-muted-foreground text-sm">{p.period}</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2"><Check className="text-primary mt-0.5 shrink-0" size={14} />{f}</li>
                    ))}
                  </ul>
                  {p.external ? (
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
                      <MessageCircle size={14} /> {p.cta}
                    </a>
                  ) : (
                    <Link to={p.href} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted">
                      {p.cta}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center text-xs text-muted-foreground max-w-xl mx-auto">
            All AI plans are activated manually by our sales team once payment is confirmed. We accept bank transfer and will activate your account within 1 business hour.
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
