import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startAiSubscription, type AiPlanId } from "@/lib/subscribe";
import { toast } from "sonner";
import { Check, Sparkles, Zap, Crown, Building2, ArrowRight, Star, Loader2, MessageCircle } from "lucide-react";

const WA_CUSTOM = "https://wa.me/2348178000023?text=" + encodeURIComponent("Hi Tioga, I'd like a custom AI plan. My monthly usage is around: ");

type Plan = {
  id: AiPlanId;
  name: string;
  bestFor: string;
  price: string;
  amount: number; // NGN — 0 means "contact sales"
  period: string;
  credits: string;
  icon: any;
  accent: string;
  ring: string;
  badge?: string;
  features: string[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starters",
    bestFor: "Homeowners & DIY planners",
    price: "₦2,500",
    amount: 2500,
    period: "/month",
    credits: "20 AI credits",
    icon: Zap,
    accent: "from-emerald-500/10 to-emerald-500/0",
    ring: "border-border",
    features: [
      "20 AI assessments / month",
      "Full sizing report + BoM PDF",
      "Personalised package match",
      "Email support (24h)",
      "Unused credits roll over 30 days",
      "Cancel anytime",
    ],
    cta: "Subscribe",
  },
  {
    id: "business",
    name: "Businesses",
    bestFor: "Installers, SMEs & multi-site",
    price: "₦12,000",
    amount: 12000,
    period: "/month",
    credits: "120 AI credits",
    icon: Building2,
    accent: "from-primary/15 to-primary/0",
    ring: "border-primary shadow-[var(--shadow-elevated)]",
    badge: "Most popular",
    features: [
      "120 AI assessments / month",
      "Team seats (up to 3 users)",
      "Commercial & multi-site sizing",
      "Installer dashboard + CSV export",
      "Priority queue & engineer review",
      "Monthly performance insights",
      "Priority WhatsApp support (4h)",
    ],
    cta: "Subscribe",
  },
  {
    id: "custom",
    name: "Custom",
    bestFor: "Agencies, EPCs & enterprise",
    price: "Let's talk",
    amount: 0,
    period: "",
    credits: "Unlimited team seats",
    icon: Crown,
    accent: "from-accent/20 to-accent/0",
    ring: "border-accent",
    features: [
      "Choose your monthly credit pack",
      "Unlimited team seats",
      "Dedicated engineer review",
      "API / bulk access",
      "Custom integrations & SSO",
      "SLA + named account manager",
      "Procurement-friendly invoicing",
    ],
    cta: "Talk to sales",
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
      <SEO
        title="AI Credit Pricing — Tioga Energy Intelligence"
        description="Three clear AI plans for Tioga: Starters (₦2,500/mo, 20 credits), Businesses (₦12,000/mo, 120 credits) and a Custom plan for installers, agencies and enterprise."
        path="/ai-pricing"
      />
      <SiteHeader />
      <main className="flex-1 bg-muted/20 py-14 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} /> AI Energy Intelligence
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight no-clip">Plans built for every solar journey</h1>
            <p className="mt-4 text-muted-foreground">
              Every account starts with <strong>3 free AI assessments</strong>. Upgrade only when you need more.
            </p>
          </div>

          {/* Free starter banner */}
          <div className="max-w-2xl mx-auto mb-10 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Star size={18} />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Try Tioga AI free — 3 assessments on us</p>
              <p className="text-sm text-muted-foreground">Get a full sizing report and engineering match. No card required.</p>
            </div>
            <Link to="/solar-assessment" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 whitespace-nowrap">
              Start free <ArrowRight size={14} />
            </Link>
          </div>

          {sub && (sub.plan === "starter" || sub.plan === "business" || sub.plan === "custom") && sub.status === "active" && (
            <div className="max-w-md mx-auto mb-8 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-center text-sm">
              You're on <strong className="capitalize">{sub.plan}</strong> · active{sub.expires_at ? ` until ${new Date(sub.expires_at).toLocaleDateString()}` : ""}.
              {" · "}<Link to="/account/subscription" className="text-primary font-semibold">Manage</Link>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-5">
            {PLANS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.id} className={`relative rounded-3xl border bg-card overflow-hidden flex flex-col ${p.ring}`}>
                  <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${p.accent} pointer-events-none`} />
                  {p.badge && (
                    <span className="absolute top-4 right-4 inline-flex px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
                      {p.badge}
                    </span>
                  )}
                  <div className="relative p-7 flex flex-col flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-background border border-border inline-flex items-center justify-center mb-4 text-primary">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display text-2xl font-bold">{p.name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{p.bestFor}</p>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold">{p.price}</span>
                      <span className="text-muted-foreground text-sm">{p.period}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-primary">{p.credits}</p>

                    <div className="my-5 h-px bg-border" />

                    <ul className="space-y-2.5 text-sm flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="text-primary mt-0.5 shrink-0" size={15} />
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all active:scale-[0.98]"
                    >
                      <MessageCircle size={14} /> {p.cta}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison strip */}
          <div className="mt-12 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-4 text-sm">
              <div className="px-4 py-3 font-semibold bg-muted/50">Compare</div>
              <div className="px-4 py-3 font-semibold bg-muted/50 text-center">Starters</div>
              <div className="px-4 py-3 font-semibold bg-muted/50 text-center">Businesses</div>
              <div className="px-4 py-3 font-semibold bg-muted/50 text-center">Custom</div>

              {[
                ["AI credits / month", "20", "120", "Custom"],
                ["Team seats", "1", "Up to 3", "Unlimited"],
                ["Engineer review", "Standard", "Priority", "Dedicated"],
                ["CSV / API export", "—", "CSV", "CSV + API"],
                ["Support SLA", "Email 24h", "WhatsApp 4h", "Named AM + SLA"],
                ["Best for", "Homes", "Installers / SMEs", "Agencies / EPC"],
              ].map((row, i) => (
                <div key={i} className="contents">
                  <div className="px-4 py-3 border-t border-border text-muted-foreground">{row[0]}</div>
                  <div className="px-4 py-3 border-t border-border text-center">{row[1]}</div>
                  <div className="px-4 py-3 border-t border-border text-center font-medium">{row[2]}</div>
                  <div className="px-4 py-3 border-t border-border text-center">{row[3]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto">
            Plans are activated by our sales team after payment confirmation (bank transfer or Paystack). Activation happens within 1 business hour.
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
