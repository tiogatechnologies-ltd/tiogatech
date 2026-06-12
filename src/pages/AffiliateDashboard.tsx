import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Share2, Copy, Wallet, TrendingUp, LogOut } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const AffiliateDashboard = () => {
  const { user, signOut } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data: aff } = await supabase.from("affiliates").select("*").eq("email", user.email!).maybeSingle();
      setAffiliate(aff);
      if (aff) {
        const { data: p } = await supabase.from("affiliate_payouts").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false });
        setPayouts(p || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const refLink = affiliate?.code ? `${window.location.origin}/?ref=${affiliate.code}` : "";

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Affiliate Dashboard" description="Track your affiliate referrals, commission and payouts." path="/affiliate" />
      <SiteHeader />
      <main className="flex-1 section-padding bg-muted/30">
        <div className="section-container max-w-5xl">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Affiliate Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <button onClick={signOut} className="inline-flex items-center gap-2 text-sm rounded-full border border-border bg-card px-4 py-2"><LogOut size={14} /> Sign out</button>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading…</div>
          ) : !affiliate ? (
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <Share2 className="text-primary mx-auto mb-3" size={32} />
              <h2 className="font-display font-bold text-foreground mb-2">You're not an active affiliate yet</h2>
              <p className="text-sm text-muted-foreground mb-4">Apply to join our affiliate program to start earning commissions on referrals.</p>
              <Link to="/?affiliate=apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Apply now</Link>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                <Stat icon={Share2} label="Your code" value={affiliate.code} />
                <Stat icon={TrendingUp} label="Commission rate" value={`${affiliate.commission_rate}%`} />
                <Stat icon={Wallet} label="Total payouts" value={`₦${payouts.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-NG")}`} />
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your referral link</p>
                <div className="flex gap-2">
                  <input readOnly value={refLink} className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm font-mono" />
                  <button onClick={() => { navigator.clipboard.writeText(refLink); toast.success("Copied"); }} className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"><Copy size={14} /> Copy</button>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-display font-bold text-foreground mb-4">Payouts</h2>
                {payouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No payouts yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {payouts.map((p) => (
                      <li key={p.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">₦{Number(p.amount).toLocaleString("en-NG")}</p>
                          <p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <Icon className="text-primary mb-2" size={18} />
    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-lg font-display font-bold text-foreground mt-0.5 truncate">{value}</p>
  </div>
);

export default AffiliateDashboard;
