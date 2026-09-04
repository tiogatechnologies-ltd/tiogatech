import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Zap, Crown, ArrowRight, Clock, CheckCircle2, Sun, Calculator, Lightbulb, BarChart3, Calendar, Check, Building2, Star, Loader2 } from "lucide-react";
import { startAiSubscription, type AiPlanId } from "@/lib/subscribe";
import { toast } from "sonner";

const WA = "https://wa.me/2348178000023?text=";
const WA_CUSTOM = WA + encodeURIComponent("Hi Tioga, I'd like a custom AI plan. My monthly usage is around: ");
const WA_CANCEL = WA + encodeURIComponent("Hi Tioga, I'd like to cancel/pause my AI subscription.");

type PlanTier = { id: AiPlanId; name: string; bestFor: string; price: string; period: string; credits: string; amountNgn: number; icon: any; ring: string; accent: string; badge?: string; features: string[]; cta: string; href?: string };
const TIERS: PlanTier[] = [
  {
    id: "starter",
    name: "Starters",
    bestFor: "Homeowners & DIY planners",
    price: "₦2,500",
    period: "/mo",
    credits: "20 AI credits",
    amountNgn: 2500,
    icon: Zap,
    ring: "border-border",
    accent: "bg-emerald-500/10",
    features: ["20 AI assessments / month", "Full sizing report + BoM PDF", "Personalised package match", "Email support (24h)", "Cancel anytime"],
    cta: "Subscribe",
  },
  {
    id: "business",
    name: "Businesses",
    bestFor: "Installers, SMEs & multi-site",
    price: "₦12,000",
    period: "/mo",
    credits: "120 AI credits",
    amountNgn: 12000,
    icon: Building2,
    ring: "border-primary shadow-[var(--shadow-elevated)]",
    accent: "bg-primary/15",
    badge: "Most popular",
    features: ["120 AI assessments / month", "Team seats (up to 3)", "Installer dashboard + CSV export", "Priority engineer review", "WhatsApp support (4h)"],
    cta: "Subscribe",
  },
  {
    id: "custom",
    name: "Custom",
    bestFor: "Agencies, EPCs & enterprise",
    price: "Let's talk",
    period: "",
    credits: "Unlimited team seats",
    amountNgn: 0,
    icon: Crown,
    ring: "border-accent",
    accent: "bg-accent/20",
    features: ["Choose your monthly credit pack", "Unlimited team seats", "Dedicated engineer review", "API access & SSO", "SLA + named account manager"],
    cta: "Build my plan",
    href: WA_CUSTOM,
  },
];



interface UsageRow {
  id: string;
  feature: string;
  description: string | null;
  used_free_credit: boolean;
  subscription_plan: string | null;
  created_at: string;
  assessment_id: string | null;
}

const FEATURE_LABEL: Record<string, { label: string; icon: any }> = {
  solar_assess: { label: "Full engineering report", icon: Sun },
  lumivolt: { label: "LumiVolt system sizing", icon: Calculator },
  ai_recommend: { label: "AI package recommendation", icon: Lightbulb },
};

const AccountSubscription = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const adminUnlimited = isAdmin || isStaff;
  const [credits, setCredits] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<AiPlanId | null>(null);

  const subscribe = async (tier: PlanTier) => {
    if (tier.id === "custom") { window.open(tier.href || WA_CUSTOM, "_blank", "noopener,noreferrer"); return; }
    if (!user?.email) { toast.error("Please sign in first."); return; }
    setSubscribing(tier.id);
    const err = await startAiSubscription({ plan: tier.id, amountNgn: tier.amountNgn, email: user.email, userId: user.id });
    if (err) { toast.error(err); setSubscribing(null); }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: s }, { data: u }] = await Promise.all([
        supabase.from("assessment_credits" as any).select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("ai_subscriptions" as any).select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("ai_credit_usage" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);
      setCredits(c);
      setSub(s);
      setUsage((u as any) || []);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "success") {
      toast.success("Payment received - your plan is being activated. Credits will appear within a minute.");
      // Clean URL
      window.history.replaceState({}, "", "/account/subscription");
    }
  }, []);



  const total = credits ? (credits.total_credits || 0) + (credits.purchased_credits || 0) : 3;
  const used = credits?.used_credits || 0;
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const hasActiveSub = sub && sub.status === "active" && (sub.plan === "starter" || sub.plan === "business" || sub.plan === "custom") && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  // Aggregations
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const usage30 = usage.filter((u) => new Date(u.created_at) >= last30);
  const usageMonth = usage.filter((u) => new Date(u.created_at) >= monthStart);
  const byFeature = usage30.reduce<Record<string, number>>((acc, u) => {
    acc[u.feature] = (acc[u.feature] || 0) + 1;
    return acc;
  }, {});
  const featureMax = Math.max(1, ...Object.values(byFeature));

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="My AI Plan & Credits - Tioga" description="Manage your AI subscription, view free credits and usage history." path="/account/subscription" />
      <SiteHeader />
      <main className="flex-1 pt-24 sm:pt-28 pb-10 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">AI plan & credits</h1>
            <p className="text-sm text-muted-foreground mt-1">Your Tioga AI subscription, free analyses, and usage history.</p>
          </div>

          {/* Plan card */}
          <div className={`rounded-3xl border p-6 ${adminUnlimited || hasActiveSub ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${adminUnlimited || hasActiveSub ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {adminUnlimited ? <Crown size={22} /> : hasActiveSub ? (sub.plan === "business" ? <Crown size={22} /> : <Zap size={22} />) : <Zap size={22} />}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current plan</div>
                  <div className="font-display text-xl font-bold capitalize">
                    {adminUnlimited ? "Admin - Unlimited" : hasActiveSub ? `AI ${sub.plan}` : "Free Starter"}
                  </div>
                  {adminUnlimited && (
                    <div className="text-xs text-muted-foreground mt-0.5">Unlimited AI usage for admins and staff. Your team never runs out of credits.</div>
                  )}
                  {!adminUnlimited && hasActiveSub && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ₦{Number(sub.monthly_price_ngn || 2500).toLocaleString()}/month
                      {sub.expires_at ? ` · renews/expires ${new Date(sub.expires_at).toLocaleDateString()}` : " · no expiry"}
                    </div>
                  )}
                </div>
              </div>
              {!adminUnlimited && !hasActiveSub ? (
                <Link to="/ai-pricing" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  Upgrade plan <ArrowRight size={14} />
                </Link>
              ) : !adminUnlimited && hasActiveSub ? (
                <div className="flex flex-col items-end gap-2">
                  <Link to="/ai-pricing" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                    Manage plan
                  </Link>
                  <a href={WA_CANCEL} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-destructive">
                    Pause or cancel
                  </a>
                </div>
              ) : null}
            </div>

            {!adminUnlimited && !hasActiveSub && (
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Free analyses this month</span>
                  <span className="font-semibold">{used} of {total} used · {remaining} left · auto-renews monthly</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                {remaining === 0 && (
                  <p className="text-xs text-destructive mt-2">You've used all your free analyses. They refresh at the start of every month, or upgrade to AI Starter (₦2,500/mo · 20 credits) for more now.</p>
                )}
              </div>
            )}
          </div>


          {/* Usage stats grid */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">This month</span>
                <Calendar size={14} className="text-muted-foreground" />
              </div>
              <div className="font-display text-2xl font-bold mt-1">{usageMonth.length}</div>
              <div className="text-xs text-muted-foreground">AI analyses generated</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Last 30 days</span>
                <BarChart3 size={14} className="text-muted-foreground" />
              </div>
              <div className="font-display text-2xl font-bold mt-1">{usage30.length}</div>
              <div className="text-xs text-muted-foreground">Across all features</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">All time</span>
                </div>
              <div className="font-display text-2xl font-bold mt-1">{usage.length}</div>
              <div className="text-xs text-muted-foreground">Total reports run</div>
            </div>
          </div>

          {/* Feature breakdown */}
          {Object.keys(byFeature).length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-display font-bold mb-1">Usage by feature</h2>
              <p className="text-xs text-muted-foreground mb-4">Last 30 days breakdown.</p>
              <div className="space-y-3">
                {Object.entries(byFeature).sort((a, b) => b[1] - a[1]).map(([f, n]) => {
                  const meta = FEATURE_LABEL[f] || { label: f, icon: Star };
                  const Icon = meta.icon;
                  return (
                    <div key={f}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 font-medium"><Icon size={13} className="text-primary" /> {meta.label}</span>
                        <span className="font-bold tabular-nums">{n}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(n / featureMax) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full 3-tier plan grid - merged from the standalone AI pricing page */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display font-bold">{hasActiveSub ? "Compare & change plan" : "Choose your AI plan"}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Every account starts with <strong className="text-foreground">3 free AI assessments</strong>. Upgrade only when you need more.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {TIERS.map((p) => {
                const Icon = p.icon;
                const isCurrent = hasActiveSub && sub?.plan === p.id;
                return (
                  <div key={p.id} className={`relative rounded-2xl border bg-background overflow-hidden flex flex-col ${p.ring}`}>
                    <div className={`absolute inset-x-0 top-0 h-24 ${p.accent} pointer-events-none`} />
                    {p.badge && (
                      <span className="absolute top-3 right-3 inline-flex px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest">
                        {p.badge}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                        <Star size={10} /> Current
                      </span>
                    )}
                    <div className="relative p-5 flex flex-col flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-background border border-border inline-flex items-center justify-center mb-3 text-primary">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-display text-lg font-bold">{p.name}</h3>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{p.bestFor}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold">{p.price}</span>
                        <span className="text-xs text-muted-foreground">{p.period}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-primary">{p.credits}</p>
                      <div className="my-3 h-px bg-border" />
                      <ul className="space-y-1.5 text-xs flex-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="text-primary mt-0.5 shrink-0" size={12} />
                            <span className="text-foreground/90">{f}</span>
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <button disabled className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold border border-border bg-background text-foreground opacity-70 cursor-default">
                          <Star size={12} /> Current plan
                        </button>
                      ) : (
                        <button
                          onClick={() => subscribe(p)}
                          disabled={subscribing === p.id}
                          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-60"
                        >
                          {subscribing === p.id ? <><Loader2 size={12} className="animate-spin" /> Redirecting…</> : p.cta}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-[11px] text-muted-foreground text-center">
              Pay securely with card or bank transfer via Paystack - your plan activates automatically the moment payment is confirmed. Custom plans are quoted by our team on WhatsApp.
            </p>
          </div>




          {/* Usage history */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">Usage history</h2>
                <p className="text-xs text-muted-foreground">Every time the AI generated a report for you.</p>
              </div>
              <Clock size={18} className="text-muted-foreground" />
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : usage.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No AI usage yet. <Link to="/solar-assessment" className="text-primary font-semibold hover:underline">Run your first analysis →</Link></div>
            ) : (
              <ul className="divide-y divide-border">
                {usage.map((u) => {
                  const meta = FEATURE_LABEL[u.feature] || { label: u.feature, icon: Star };
                  const Icon = meta.icon;
                  return (
                    <li key={u.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0"><Icon size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{meta.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.description || "AI analysis"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()} · {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
                          {u.used_free_credit ? (
                            <span className="text-amber-600 flex items-center gap-1">Free credit</span>
                          ) : (
                            <span className="text-primary flex items-center gap-1"><CheckCircle2 size={10} /> {u.subscription_plan || "Plan"}</span>
                          )}
                        </div>
                      </div>
                      {u.assessment_id && (
                        <Link to={`/solar-assessment/${u.assessment_id}/full`} className="text-xs text-primary font-semibold shrink-0 hidden sm:inline-flex items-center gap-1">View <ArrowRight size={12} /></Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Need a custom enterprise plan? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact our team</Link>.
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default AccountSubscription;
