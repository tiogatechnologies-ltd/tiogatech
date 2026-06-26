import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Zap, Crown, Sparkles, ArrowRight, Clock, CheckCircle2, Sun, Calculator, Lightbulb, BarChart3, Calendar, MessageCircle, Check } from "lucide-react";

const WA_STARTER = "https://wa.me/2348000000000?text=" + encodeURIComponent("Hi Tioga, I'd like to subscribe to AI Starter (₦2,500/mo).");
const WA_BUSINESS = "https://wa.me/2348000000000?text=" + encodeURIComponent("Hi Tioga, I'd like a quote for the AI Business plan.");
const WA_CANCEL = "https://wa.me/2348000000000?text=" + encodeURIComponent("Hi Tioga, I'd like to cancel/pause my AI subscription.");

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
  const { user } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  const total = credits ? (credits.total_credits || 0) + (credits.purchased_credits || 0) : 3;
  const used = credits?.used_credits || 0;
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const hasActiveSub = sub && sub.status === "active" && (sub.plan === "starter" || sub.plan === "business") && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="My AI Plan & Credits — Tioga" description="Manage your AI subscription, view free credits and usage history." path="/account/subscription" />
      <SiteHeader />
      <main className="flex-1 py-10 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">AI plan & credits</h1>
            <p className="text-sm text-muted-foreground mt-1">Your Tioga AI subscription, free analyses, and usage history.</p>
          </div>

          {/* Plan card */}
          <div className={`rounded-3xl border p-6 ${hasActiveSub ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasActiveSub ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {hasActiveSub ? (sub.plan === "business" ? <Crown size={22} /> : <Zap size={22} />) : <Sparkles size={22} />}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current plan</div>
                  <div className="font-display text-xl font-bold capitalize">
                    {hasActiveSub ? `AI ${sub.plan}` : "Free Starter"}
                  </div>
                  {hasActiveSub && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ₦{Number(sub.monthly_price_ngn || 2500).toLocaleString()}/month
                      {sub.expires_at ? ` · renews/expires ${new Date(sub.expires_at).toLocaleDateString()}` : " · no expiry"}
                    </div>
                  )}
                </div>
              </div>
              {!hasActiveSub ? (
                <Link to="/ai-pricing" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  Upgrade to unlimited <ArrowRight size={14} />
                </Link>
              ) : (
                <Link to="/ai-pricing" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                  Manage plan
                </Link>
              )}
            </div>

            {!hasActiveSub && (
              <div className="mt-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Free analyses used</span>
                  <span className="font-semibold">{used} of {total} · {remaining} left</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                {remaining === 0 && (
                  <p className="text-xs text-destructive mt-2">You've used all your free analyses. Upgrade to AI Starter (₦2,500/mo) for unlimited reports.</p>
                )}
              </div>
            )}
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
                  const meta = FEATURE_LABEL[u.feature] || { label: u.feature, icon: Sparkles };
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
                            <span className="text-amber-600 flex items-center gap-1"><Sparkles size={10} /> Free credit</span>
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
