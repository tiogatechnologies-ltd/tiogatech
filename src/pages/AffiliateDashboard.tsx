import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Copy, Wallet, TrendingUp, LogOut, Users, MousePointerClick, Target, Loader2,
  ShoppingBag, BadgePercent, Banknote, RefreshCw, Building2,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import AffiliateLinkManager, { AffiliateLinkStat } from "@/components/affiliate/AffiliateLinkManager";

const NGN = (n: number) => `₦${Math.round(n || 0).toLocaleString("en-NG")}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

type Portal = {
  affiliate: {
    id: string; full_name: string; email: string; phone: string | null; code: string;
    commission_rate: number; status: string; payout_method: string | null; payout_details: string | null;
  } | null;
  stats?: {
    clicks: number; unique_visitors: number; leads: number; orders: number; conversions: number;
    revenue: number; commission_earned: number; paid_out: number; requested_pending: number;
    available: number; conversion_rate: number; close_rate: number;
  };
  links?: AffiliateLinkStat[];
  series?: { date: string; clicks: number; leads: number; revenue: number }[];
  leads?: any[];
  orders?: any[];
  payouts?: any[];
  payout_requests?: any[];
};

const statusTone: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  new: "bg-blue-100 text-blue-800",
};

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

const AffiliateDashboard = () => {
  const { user, signOut } = useAuth();
  const [data, setData] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bank, setBank] = useState({ payout_method: "", payout_details: "", phone: "" });
  const [savingBank, setSavingBank] = useState(false);

  const load = useCallback(async () => {
    const { data: res, error } = await supabase.functions.invoke("affiliate-portal", { body: {} });
    if (error) {
      toast.error("Could not load your dashboard");
    } else {
      const portal = res as Portal;
      setData(portal);
      if (portal.affiliate) {
        setBank({
          payout_method: portal.affiliate.payout_method || "",
          payout_details: portal.affiliate.payout_details || "",
          phone: portal.affiliate.phone || "",
        });
      }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const affiliate = data?.affiliate;
  const stats = data?.stats;
  const refLink = affiliate?.code ? `${window.location.origin}/?aff=${affiliate.code}` : "";

  const series = useMemo(() => (data?.series || []).slice(-30), [data?.series]);

  const copy = (text: string, what = "Link") => {
    navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  };

  const submitPayout = async () => {
    setSubmitting(true);
    const { data: res, error } = await supabase.functions.invoke("affiliate-payout-request", {
      body: { amount: Number(payoutAmount), note: payoutNote || null },
    });
    setSubmitting(false);
    const err = error?.message || (res as any)?.error;
    if (err) { toast.error(typeof err === "string" ? err : "Request failed"); return; }
    toast.success("Payout request submitted");
    setPayoutOpen(false);
    setPayoutAmount("");
    setPayoutNote("");
    setRefreshing(true);
    load();
  };

  const saveBank = async () => {
    if (!affiliate) return;
    setSavingBank(true);
    const { error } = await supabase
      .from("affiliates")
      .update({ payout_method: bank.payout_method, payout_details: bank.payout_details, phone: bank.phone } as never)
      .eq("id", affiliate.id);
    setSavingBank(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payout details saved");
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 pb-20 pt-28 text-center">
          <h1 className="text-2xl font-bold">No affiliate account found</h1>
          <p className="mt-3 text-muted-foreground">
            We could not match <span className="font-medium">{user?.email}</span> to an approved affiliate account.
            Apply to the programme, or contact us if you already applied with a different email.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/affiliate">Apply to the programme</Link></Button>
            <Button variant="outline" asChild><Link to="/contact">Contact support</Link></Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Affiliate Portal | Tioga Technologies" description="Track your referral links, leads, sales and payouts." />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">Affiliate portal</h1>
              <Badge className={statusTone[affiliate.status] || "bg-muted"}>{affiliate.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {affiliate.full_name} · {affiliate.commission_rate}% commission on every paid order
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); load(); }} disabled={refreshing}>
              <RefreshCw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
          </div>
        </div>

        {/* Quick referral link */}
        <Card className="mt-6">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your default referral link</p>
              <p className="truncate font-mono text-sm">{refLink}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => copy(refLink)}><Copy className="mr-1 h-4 w-4" /> Copy</Button>
            <Button size="sm" variant="outline" onClick={() => copy(affiliate.code, "Code")}>Code: {affiliate.code}</Button>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={MousePointerClick} label="Link clicks" value={String(stats?.clicks ?? 0)} sub={`${stats?.unique_visitors ?? 0} unique visitors`} />
          <StatCard icon={Users} label="Leads" value={String(stats?.leads ?? 0)} sub={`${(stats?.conversion_rate ?? 0).toFixed(1)}% of clicks`} />
          <StatCard icon={ShoppingBag} label="Paid orders" value={String(stats?.conversions ?? 0)} sub={`${(stats?.close_rate ?? 0).toFixed(1)}% of leads`} />
          <StatCard icon={TrendingUp} label="Revenue driven" value={NGN(stats?.revenue ?? 0)} />
          <StatCard icon={BadgePercent} label="Commission earned" value={NGN(stats?.commission_earned ?? 0)} />
          <StatCard icon={Banknote} label="Paid out" value={NGN(stats?.paid_out ?? 0)} />
          <StatCard icon={Wallet} label="Pending requests" value={NGN(stats?.requested_pending ?? 0)} />
          <StatCard icon={Target} label="Available to withdraw" value={NGN(stats?.available ?? 0)} />
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Links & QR</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Last 30 days</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="cl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="clicks" name="Clicks" stroke="hsl(var(--primary))" fill="url(#cl)" />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#f59e0b" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Top performing links</CardTitle></CardHeader>
              <CardContent>
                {(data?.links || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Create your first tracking link in the “Links & QR” tab.</p>
                ) : (
                  <div className="space-y-3">
                    {[...(data?.links || [])]
                      .sort((a, b) => b.leads - a.leads || b.clicks - a.clicks)
                      .slice(0, 5)
                      .map((l) => (
                        <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{l.label}</p>
                            <p className="truncate font-mono text-xs text-muted-foreground">/r/{l.slug}</p>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>{l.clicks} clicks</span>
                            <span>{l.leads} leads</span>
                            <span className="font-semibold">{NGN(l.revenue)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links */}
          <TabsContent value="links" className="mt-6">
            <AffiliateLinkManager
              affiliateId={affiliate.id}
              code={affiliate.code}
              links={data?.links || []}
              onChanged={load}
            />
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Referred leads ({data?.leads?.length ?? 0})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {(data?.leads || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads yet. Share your links to get started.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.leads || []).slice(0, 200).map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.full_name}</TableCell>
                          <TableCell className="text-xs">
                            <div>{l.phone}</div>
                            <div className="text-muted-foreground">{l.email}</div>
                          </TableCell>
                          <TableCell className="text-xs">{l.location}</TableCell>
                          <TableCell className="text-xs">{(l.products || []).join(", ")}</TableCell>
                          <TableCell className="text-xs">
                            {l.affiliate_link_slug ? `/r/${l.affiliate_link_slug}` : l.utm_source || "direct"}
                          </TableCell>
                          <TableCell><Badge className={statusTone[l.status] || "bg-muted"}>{l.status}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(l.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Attributed orders ({data?.orders?.length ?? 0})</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {(data?.orders || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders attributed to you yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Your commission</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.orders || []).slice(0, 200).map((o: any) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                          <TableCell className="text-xs">{o.full_name}</TableCell>
                          <TableCell className="text-right">{NGN(Number(o.total || 0))}</TableCell>
                          <TableCell className="text-right">
                            {o.payment_status === "paid" ? NGN(Number(o.total || 0) * (affiliate.commission_rate / 100)) : "—"}
                          </TableCell>
                          <TableCell><Badge className={statusTone[o.payment_status] || "bg-muted"}>{o.payment_status || "pending"}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(o.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="mt-6 space-y-6">
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Available to withdraw</p>
                  <p className="text-3xl font-bold">{NGN(stats?.available ?? 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Minimum request ₦10,000 · paid within 5 working days</p>
                </div>
                <Button onClick={() => { setPayoutAmount(String(Math.floor(stats?.available ?? 0))); setPayoutOpen(true); }} disabled={(stats?.available ?? 0) < 10000}>
                  <Wallet className="mr-2 h-4 w-4" /> Request payout
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Payout requests</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {(data?.payout_requests || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No requests yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.payout_requests || []).map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(r.created_at)}</TableCell>
                          <TableCell className="text-right">{NGN(Number(r.amount))}</TableCell>
                          <TableCell><Badge className={statusTone[r.status] || "bg-muted"}>{r.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.admin_note || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Payment history</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                {(data?.payouts || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payouts processed yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.payouts || []).map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(p.period_start)} – {fmtDate(p.period_end)}</TableCell>
                          <TableCell className="text-right">{NGN(Number(p.amount))}</TableCell>
                          <TableCell><Badge className={statusTone[p.status] || "bg-muted"}>{p.status}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{p.payment_reference || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" /> Payout details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bank name</Label>
                    <Input value={bank.payout_method} placeholder="e.g. GTBank"
                      onChange={(e) => setBank({ ...bank, payout_method: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone number</Label>
                    <Input value={bank.phone} onChange={(e) => setBank({ ...bank, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account name & number</Label>
                  <Textarea rows={3} value={bank.payout_details} placeholder="Jane Doe — 0123456789"
                    onChange={(e) => setBank({ ...bank, payout_details: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your commission rate and referral code are managed by Tioga and cannot be changed here.
                </p>
                <Button onClick={saveBank} disabled={savingBank}>{savingBank ? "Saving…" : "Save details"}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request a payout</DialogTitle>
            <DialogDescription>
              You have {NGN(stats?.available ?? 0)} available. Payments go to the account saved in Settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea rows={3} value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button onClick={submitPayout} disabled={submitting}>{submitting ? "Submitting…" : "Submit request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default AffiliateDashboard;
