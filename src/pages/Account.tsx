import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, User as UserIcon, LogOut, Loader2, ShoppingBag, Wallet, Share2, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const formatNGN = (n: number | null | undefined) => n == null ? "—" : `₦${Number(n).toLocaleString("en-NG")}`;

const Account = () => {
  const { user, profile, roles, isAdmin, isAffiliate, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setOrders(data || []); setLoadingOrders(false); });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: fullName, phone, email: user.email });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile saved");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="My Account" path="/account" />
      <SiteHeader />
      <main className="flex-1 section-padding bg-muted/30">
        <div className="section-container max-w-5xl">
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">My Account</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || user?.email}</p>
            </div>
            <button onClick={signOut} className="inline-flex items-center gap-2 text-sm rounded-full border border-border bg-card px-4 py-2 hover:bg-muted">
              <LogOut size={14} /> Sign out
            </button>
          </div>

          {/* Quick links by role */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <Link to="/catalog" className="rounded-2xl border border-border bg-card p-4 hover-lift">
              <ShoppingBag className="text-primary mb-2" size={18} />
              <p className="font-semibold text-foreground text-sm">Browse Catalog</p>
              <p className="text-xs text-muted-foreground">Solar, smart locks, automation</p>
            </Link>
            <Link to="/finance" className="rounded-2xl border border-border bg-card p-4 hover-lift">
              <Wallet className="text-primary mb-2" size={18} />
              <p className="font-semibold text-foreground text-sm">Financing</p>
              <p className="text-xs text-muted-foreground">3, 6, or 12 month plans</p>
            </Link>
            {isAffiliate && (
              <Link to="/affiliate" className="rounded-2xl border border-border bg-card p-4 hover-lift">
                <Share2 className="text-primary mb-2" size={18} />
                <p className="font-semibold text-foreground text-sm">Affiliate Dashboard</p>
                <p className="text-xs text-muted-foreground">Track referrals & payouts</p>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="rounded-2xl border border-border bg-card p-4 hover-lift">
                <ShieldCheck className="text-primary mb-2" size={18} />
                <p className="font-semibold text-foreground text-sm">Admin Dashboard</p>
                <p className="text-xs text-muted-foreground">Manage the site</p>
              </Link>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile */}
            <div className="lg:col-span-1 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon size={18} className="text-primary" />
                <h2 className="font-display font-bold text-foreground">Profile</h2>
              </div>
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
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Roles</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {roles.length === 0 && <span className="text-xs text-muted-foreground">customer</span>}
                    {roles.map((r) => (
                      <span key={r} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{r}</span>
                    ))}
                  </div>
                </div>
                <button onClick={saveProfile} disabled={saving} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save changes
                </button>
              </div>
            </div>

            {/* Orders */}
            <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-primary" />
                <h2 className="font-display font-bold text-foreground">My Orders</h2>
              </div>
              {loadingOrders ? (
                <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
              ) : orders.length === 0 ? (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  <p>No orders yet.</p>
                  <Link to="/catalog" className="inline-block mt-3 text-primary font-semibold underline">Start shopping</Link>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {orders.map((o) => (
                    <li key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{o.order_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{o.items_summary || `${o.item_count} item(s)`}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{formatNGN(o.total)}</p>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${o.payment_status === "paid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {o.payment_status || o.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Account;
