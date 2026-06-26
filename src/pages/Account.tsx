import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, User as UserIcon, LogOut, Loader2, ShoppingBag, Wallet, Share2,
  ShieldCheck, Sun, Zap, Wrench, Mail, Phone, MapPin, TrendingUp, Coins,
  Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, Copy, Sparkles, Crown,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const formatNGN = (n: number | null | undefined) =>
  n == null ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

const StatTile = ({ icon: Icon, label, value, hint, accent }: any) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`w-8 h-8 rounded-xl inline-flex items-center justify-center ${accent || "bg-primary/10 text-primary"}`}>
        <Icon size={15} />
      </span>
    </div>
    <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-foreground">{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
  </div>
);

const SectionCard = ({ title, icon: Icon, action, children }: any) => (
  <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={18} className="text-primary shrink-0" />}
        <h2 className="font-display font-bold text-foreground truncate">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const s = (status || "").toLowerCase();
  const tone =
    s === "paid" || s === "approved" || s === "active" || s === "completed" || s === "delivered"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : s === "pending" || s === "in_review" || s === "processing" || s === "shipped"
      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
      : s === "rejected" || s === "cancelled" || s === "failed"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone}`}>
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
};

const Account = () => {
  const { user, profile, roles, isAdmin, isStaff, isAffiliate, signOut, refreshProfile, hasRole } = useAuth();
  const isEngineer = hasRole("engineer");

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [aiSub, setAiSub] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [affConvCount, setAffConvCount] = useState(0);
  const [affEarnings, setAffEarnings] = useState(0);
  const [engineerQueue, setEngineerQueue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const tasks: any[] = [
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("finance_applications").select("id,item_name,status,monthly_payment_ngn,months,total_amount_ngn,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("solar_assessments").select("id,location,system_type,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("ai_subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("assessment_credits").select("*").eq("user_id", user.id).maybeSingle(),
      ];
      if (isAffiliate && user.email) {
        tasks.push(supabase.from("affiliates").select("*").eq("email", user.email).maybeSingle());
      }
      if (isEngineer || isStaff) {
        tasks.push(supabase.from("solar_assessments").select("id", { count: "exact", head: true }).in("status", ["pending_review", "submitted"]));
      }

      const results: any[] = await Promise.all(tasks);
      setOrders(results[0].data || []);
      setFinance(results[1].data || []);
      setAssessments(results[2].data || []);
      setAiSub(results[3].data);
      setCredits(results[4].data);

      let idx = 5;
      if (isAffiliate && user.email) {
        const aff = results[idx++]?.data;
        setAffiliate(aff);
        if (aff?.id) {
          const { data: payouts } = await supabase
            .from("affiliate_payouts")
            .select("amount_ngn,status")
            .eq("affiliate_id", aff.id);
          setAffConvCount((payouts || []).length);
          setAffEarnings((payouts || []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount_ngn || 0), 0));
        }
      }
      if (isEngineer || isStaff) {
        setEngineerQueue(results[idx]?.count || 0);
      }
      setLoading(false);
    })();
  }, [user, isAffiliate, isEngineer, isStaff]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, phone, email: user.email });
    setSaving(false);
    if (error) return toast.error(error.message);
    await refreshProfile();
    toast.success("Profile saved");
  };

  const activeSub = aiSub?.status === "active" && (aiSub?.plan === "starter" || aiSub?.plan === "business") &&
    (!aiSub.expires_at || new Date(aiSub.expires_at) > new Date());
  const totalCredits = credits ? (credits.total_credits || 0) + (credits.purchased_credits || 0) : 3;
  const usedCredits = credits?.used_credits || 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  const activeFinance = finance.find((f) => f.status === "approved" || f.status === "active");
  const totalSpent = useMemo(
    () => orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total || 0), 0),
    [orders]
  );

  const copy = (txt: string, label = "Copied") => {
    navigator.clipboard.writeText(txt);
    toast.success(label);
  };

  const initial = (profile?.full_name || user?.email || "?")[0]?.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="My Account — Tioga" description="Manage your Tioga profile, orders, financing, AI credits and role-specific dashboards." path="/account" />
      <SiteHeader />
      <main className="flex-1 py-8 sm:py-10 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header card */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-primary text-primary-foreground font-display text-2xl font-bold grid place-items-center">
                  {initial}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-display font-bold truncate">{profile?.full_name || "Welcome"}</h1>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 truncate">
                    <Mail size={12} /> {user?.email}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(roles.length === 0 ? ["customer"] : roles).map((r) => (
                      <span key={r} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={signOut} className="inline-flex items-center gap-2 text-xs sm:text-sm rounded-full border border-border bg-background px-3 sm:px-4 py-2 hover:bg-muted">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile icon={ShoppingBag} label="Orders" value={orders.length} hint={`${formatNGN(totalSpent)} lifetime`} />
            <StatTile icon={Wallet} label="Active finance" value={activeFinance ? formatNGN(activeFinance.monthly_payment_ngn) + "/mo" : "—"} hint={activeFinance ? `${activeFinance.months} months` : "No active plan"} accent="bg-amber-500/10 text-amber-600" />
            <StatTile icon={Sun} label="AI assessments" value={assessments.length} hint={`${remainingCredits} free credit${remainingCredits === 1 ? "" : "s"} left`} accent="bg-blue-500/10 text-blue-600" />
            <StatTile icon={Zap} label="AI plan" value={activeSub ? (aiSub.plan === "business" ? "Business" : "Starter") : "Free"} hint={activeSub ? "Unlimited" : `${usedCredits}/${totalCredits} used`} accent={activeSub ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} />
          </div>

          {/* Role spotlight cards */}
          {(isAffiliate || isStaff || isEngineer) && (
            <div className="grid md:grid-cols-2 gap-4">
              {isAffiliate && affiliate && (
                <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Share2 size={18} className="text-primary" />
                      <h2 className="font-display font-bold">Affiliate program</h2>
                    </div>
                    <StatusPill status={affiliate.status} />
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-3 flex items-center justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your referral code</div>
                      <div className="font-mono font-bold text-foreground truncate">{affiliate.code}</div>
                    </div>
                    <button
                      onClick={() => copy(`${window.location.origin}/?ref=${affiliate.code}`, "Link copied")}
                      className="text-xs rounded-lg bg-primary text-primary-foreground px-3 py-2 inline-flex items-center gap-1.5"
                    >
                      <Copy size={12} /> Link
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-background border border-border p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Conv.</div>
                      <div className="font-bold text-foreground">{affConvCount}</div>
                    </div>
                    <div className="rounded-xl bg-background border border-border p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate</div>
                      <div className="font-bold text-foreground">{Math.round((affiliate.commission_rate || 0) * 100)}%</div>
                    </div>
                    <div className="rounded-xl bg-background border border-border p-2">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</div>
                      <div className="font-bold text-foreground">{formatNGN(affEarnings)}</div>
                    </div>
                  </div>
                  <Link to="/affiliate" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Open affiliate dashboard <ExternalLink size={12} />
                  </Link>
                </div>
              )}

              {(isStaff || isEngineer) && (
                <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {isAdmin ? <Crown size={18} className="text-amber-600" /> : isStaff ? <ShieldCheck size={18} className="text-amber-600" /> : <Wrench size={18} className="text-amber-600" />}
                      <h2 className="font-display font-bold">{isAdmin ? "Admin workspace" : isStaff ? "Staff workspace" : "Engineer workspace"}</h2>
                    </div>
                    {engineerQueue > 0 && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        {engineerQueue} in queue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isAdmin
                      ? "Full access to dashboard, CRM, inventory, finance approvals, AI usage and audit log."
                      : isStaff
                      ? "Manage orders, leads, content and customer questions from the admin workspace."
                      : "Review pending solar assessments and publish full engineering reports."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(isStaff || isAdmin) && (
                      <Link to="/admin" className="text-xs sm:text-sm font-semibold rounded-xl bg-amber-600 text-white px-3 py-2 inline-flex items-center gap-1.5">
                        Open admin <ExternalLink size={12} />
                      </Link>
                    )}
                    {(isEngineer || isAdmin) && (
                      <Link to="/admin/assessments" className="text-xs sm:text-sm font-semibold rounded-xl border border-border bg-background px-3 py-2 inline-flex items-center gap-1.5">
                        Review queue
                      </Link>
                    )}
                    {(isStaff || isAdmin) && (
                      <Link to="/admin/orders" className="text-xs sm:text-sm font-semibold rounded-xl border border-border bg-background px-3 py-2 inline-flex items-center gap-1.5">
                        Orders
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI plan summary */}
          <div className={`rounded-3xl border p-5 sm:p-6 ${activeSub ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${activeSub ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {activeSub ? (aiSub.plan === "business" ? <Crown size={20} /> : <Zap size={20} />) : <Sparkles size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Energy Intelligence</div>
                  <div className="font-display text-lg font-bold capitalize">
                    {activeSub ? `AI ${aiSub.plan}` : "Free Starter — 3 analyses"}
                  </div>
                  {!activeSub && (
                    <div className="text-xs text-muted-foreground mt-1">{remainingCredits} of {totalCredits} free analyses remaining</div>
                  )}
                  {activeSub && aiSub.expires_at && (
                    <div className="text-xs text-muted-foreground mt-1">Renews/expires {new Date(aiSub.expires_at).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              <Link to="/account/subscription" className="text-xs sm:text-sm font-semibold rounded-xl bg-foreground text-background px-4 py-2 inline-flex items-center gap-1.5">
                Manage AI plan <ExternalLink size={12} />
              </Link>
            </div>
            {!activeSub && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${totalCredits ? Math.min(100, (usedCredits / totalCredits) * 100) : 0}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Profile + Recent orders */}
          <div className="grid lg:grid-cols-3 gap-6">
            <SectionCard title="Profile" icon={UserIcon}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input value={user?.email || ""} disabled className="w-full mt-1 rounded-xl border border-border bg-muted px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Full name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={11} /> Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {(profile as any)?.account_type && (
                  <div>
                    <label className="text-xs text-muted-foreground">Account type</label>
                    <div className="mt-1 text-sm font-semibold capitalize text-foreground">{(profile as any).account_type}</div>
                  </div>
                )}
                <button onClick={saveProfile} disabled={saving} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save changes
                </button>
              </div>
            </SectionCard>

            <div className="lg:col-span-2 space-y-6">
              <SectionCard
                title="Recent orders"
                icon={Package}
                action={<Link to="/catalog" className="text-xs text-primary font-semibold">Shop</Link>}
              >
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
                ) : orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    <p>No orders yet.</p>
                    <Link to="/catalog" className="inline-block mt-2 text-primary font-semibold underline">Start shopping</Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {orders.map((o) => (
                      <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{o.order_number}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.items_summary || `${o.item_count} item(s)`}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{formatNGN(o.total)}</p>
                          <StatusPill status={o.payment_status || o.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Flexible payment"
                icon={Wallet}
                action={
                  <Link to="/account/finance" className="text-xs text-primary font-semibold">All applications</Link>
                }
              >
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
                ) : finance.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    <p>No finance applications yet.</p>
                    <Link to="/finance" className="inline-block mt-2 text-primary font-semibold underline">Apply for financing</Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {finance.map((f) => (
                      <li key={f.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{f.item_name}</p>
                          <p className="text-xs text-muted-foreground">{f.months} months · {formatNGN(f.monthly_payment_ngn)}/mo</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{formatNGN(f.total_amount_ngn)}</p>
                          <StatusPill status={f.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Solar assessments"
                icon={Sun}
                action={<Link to="/account/assessments" className="text-xs text-primary font-semibold">View all</Link>}
              >
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
                ) : assessments.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    <p>No AI assessments yet.</p>
                    <Link to="/solar-assessment" className="inline-block mt-2 text-primary font-semibold underline">Run your first analysis</Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {assessments.map((a) => (
                      <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1"><MapPin size={12} /> {a.location || "Assessment"}</p>
                          <p className="text-xs text-muted-foreground capitalize">{a.system_type?.replace(/_/g, " ") || "Solar"}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <StatusPill status={a.status} />
                          <Link to={`/solar-assessment/${a.id}/full`} className="text-[11px] text-primary font-semibold inline-flex items-center gap-1">Open <ExternalLink size={10} /></Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Account;
