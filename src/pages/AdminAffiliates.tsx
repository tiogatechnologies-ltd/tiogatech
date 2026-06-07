import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Copy,
  Link as LinkIcon,
  Check,
  Trash2,
  RefreshCw,
  UserCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Affiliate = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  code: string;
  commission_rate: number;
  status: string;
  payout_method: string | null;
  payout_details: string | null;
  notes: string | null;
  created_at: string;
};

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string | null;
  audience_size: string | null;
  channels: string[];
  social_links: string | null;
  why: string | null;
  status: string;
  created_at: string;
};

const PUBLIC_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://tiogatechnologies.com";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12) || Math.random().toString(36).slice(2, 8);

const PATHS = [
  { value: "/", label: "Home" },
  { value: "/packages", label: "Packages" },
  { value: "/lumivolt", label: "LumiVolt (Solar)" },
  { value: "/voltai", label: "VoltAI (Automation)" },
  { value: "/catalog", label: "Catalog" },
  { value: "/contact", label: "Contact" },
];

const AdminAffiliates = () => {
  const [tab, setTab] = useState<"affiliates" | "applications" | "links">("affiliates");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [appOpen, setAppOpen] = useState<Application | null>(null);

  const load = async () => {
    setLoading(true);
    const [aff, apps, leads] = await Promise.all([
      supabase.from("affiliates" as any).select("*").order("created_at", { ascending: false }),
      supabase
        .from("affiliate_applications" as any)
        .select("*")
        .order("created_at", { ascending: false }),
      (supabase.from("leads") as any).select("affiliate_code").not("affiliate_code", "is", null),
    ]);
    if (aff.data) setAffiliates(aff.data as unknown as Affiliate[]);
    if (apps.data) setApplications(apps.data as unknown as Application[]);
    if (leads.data) {
      const counts: Record<string, number> = {};
      (leads.data as { affiliate_code: string | null }[]).forEach((l) => {
        if (l.affiliate_code) counts[l.affiliate_code] = (counts[l.affiliate_code] || 0) + 1;
      });
      setLeadCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredAffiliates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return affiliates;
    return affiliates.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q),
    );
  }, [affiliates, search]);

  const approve = async (app: Application) => {
    const code = slug(app.full_name);
    const { error } = await supabase.from("affiliates" as any).insert({
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      code,
      commission_rate: 10,
      status: "active",
      application_id: app.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase
      .from("affiliate_applications" as any)
      .update({ status: "approved" })
      .eq("id", app.id);
    toast.success(`${app.full_name} approved as affiliate with code ${code.toUpperCase()}`);
    setAppOpen(null);
    void load();
  };

  const reject = async (app: Application) => {
    await supabase
      .from("affiliate_applications" as any)
      .update({ status: "rejected" })
      .eq("id", app.id);
    toast.success("Application marked as rejected");
    setAppOpen(null);
    void load();
  };

  const removeAffiliate = async (a: Affiliate) => {
    if (!confirm(`Delete affiliate ${a.full_name}? Their links will stop tracking.`)) return;
    const { error } = await supabase.from("affiliates" as any).delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Affiliate removed");
    void load();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Affiliates</h1>
            <p className="text-sm text-muted-foreground">
              Manage your affiliate program, review applications, and generate tracked UTM links.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> New affiliate
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="affiliates">
              Affiliates ({affiliates.length})
            </TabsTrigger>
            <TabsTrigger value="applications">
              Applications ({applications.filter((a) => a.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="links">Generate links</TabsTrigger>
          </TabsList>

          <TabsContent value="affiliates" className="space-y-3">
            <Input
              placeholder="Search affiliates by name, email, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : filteredAffiliates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
                No affiliates yet. Approve an application or add one manually.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAffiliates.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{a.full_name}</p>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                            a.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.status}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {a.commission_rate}% commission
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.email} • {a.phone || "—"}</p>
                      <p className="text-xs mt-1">
                        <span className="text-muted-foreground">Code:</span>{" "}
                        <span className="font-mono font-bold text-foreground">{a.code.toUpperCase()}</span>
                        <span className="text-muted-foreground"> • Leads attributed:</span>{" "}
                        <span className="font-bold text-foreground">{leadCounts[a.code] || 0}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeAffiliate(a)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-2">
            {applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-2xl">
                No applications yet.
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{app.full_name}</p>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          app.status === "pending"
                            ? "bg-amber-500/15 text-amber-600"
                            : app.status === "approved"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.email} • {app.phone} • {app.location || "—"}
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Audience: {app.audience_size || "—"} • Channels:{" "}
                      {app.channels.length ? app.channels.join(", ") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setAppOpen(app)}>
                      View
                    </Button>
                    {app.status === "pending" && (
                      <Button size="sm" onClick={() => approve(app)}>
                        <UserCheck size={14} /> Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="links">
            <LinkGenerator affiliates={affiliates} />
          </TabsContent>
        </Tabs>
      </div>

      <AffiliateEditor
        open={createOpen || !!editing}
        affiliate={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      <Dialog open={!!appOpen} onOpenChange={(o) => !o && setAppOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{appOpen?.full_name}</DialogTitle>
          </DialogHeader>
          {appOpen && (
            <div className="space-y-3 text-sm">
              <p><strong>Email:</strong> {appOpen.email}</p>
              <p><strong>Phone:</strong> {appOpen.phone}</p>
              <p><strong>Location:</strong> {appOpen.location || "—"}</p>
              <p><strong>Audience:</strong> {appOpen.audience_size || "—"}</p>
              <p><strong>Channels:</strong> {appOpen.channels.join(", ") || "—"}</p>
              <p><strong>Links:</strong> <span className="break-all">{appOpen.social_links || "—"}</span></p>
              <p><strong>Why:</strong> {appOpen.why || "—"}</p>
              {appOpen.status === "pending" && (
                <div className="flex gap-2 pt-3">
                  <Button onClick={() => approve(appOpen)} className="flex-1">
                    <UserCheck size={14} /> Approve & create affiliate
                  </Button>
                  <Button variant="outline" onClick={() => reject(appOpen)}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const AffiliateEditor = ({
  open,
  affiliate,
  onClose,
  onSaved,
}: {
  open: boolean;
  affiliate: Affiliate | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!affiliate;
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    code: "",
    commission_rate: 10,
    status: "active",
    payout_method: "",
    payout_details: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (affiliate) {
      setForm({
        full_name: affiliate.full_name,
        email: affiliate.email,
        phone: affiliate.phone || "",
        code: affiliate.code,
        commission_rate: Number(affiliate.commission_rate),
        status: affiliate.status,
        payout_method: affiliate.payout_method || "",
        payout_details: affiliate.payout_details || "",
        notes: affiliate.notes || "",
      });
    } else {
      setForm({
        full_name: "",
        email: "",
        phone: "",
        code: "",
        commission_rate: 10,
        status: "active",
        payout_method: "",
        payout_details: "",
        notes: "",
      });
    }
  }, [affiliate, open]);

  const save = async () => {
    if (!form.full_name || !form.email || !form.code) {
      toast.error("Name, email and code are required");
      return;
    }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      code: form.code.trim().toLowerCase(),
      commission_rate: form.commission_rate,
      status: form.status,
      payout_method: form.payout_method.trim() || null,
      payout_details: form.payout_details.trim() || null,
      notes: form.notes.trim() || null,
    };
    const op = isEdit
      ? supabase.from("affiliates" as any).update(payload).eq("id", affiliate!.id)
      : supabase.from("affiliates" as any).insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Affiliate updated" : "Affiliate created");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit affiliate" : "Create affiliate"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Code (used in ?aff=)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.replace(/[^a-z0-9]/gi, "") })}
                placeholder="e.g. tunde"
              />
            </div>
            <div>
              <Label>Commission rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Payout method</Label>
            <Input
              placeholder="Bank transfer, mobile money…"
              value={form.payout_method}
              onChange={(e) => setForm({ ...form, payout_method: e.target.value })}
            />
          </div>
          <div>
            <Label>Payout details</Label>
            <Textarea
              rows={2}
              placeholder="Account name, number, bank"
              value={form.payout_details}
              onChange={(e) => setForm({ ...form, payout_details: e.target.value })}
            />
          </div>
          <div>
            <Label>Internal notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create affiliate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LinkGenerator = ({ affiliates }: { affiliates: Affiliate[] }) => {
  const active = affiliates.filter((a) => a.status === "active");
  const [code, setCode] = useState(active[0]?.code || "");
  const [path, setPath] = useState("/");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("social");
  const [campaign, setCampaign] = useState("affiliate");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code && active[0]) setCode(active[0].code);
  }, [active, code]);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (code) params.set("aff", code);
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (campaign) params.set("utm_campaign", campaign);
    return `${PUBLIC_ORIGIN}${path}?${params.toString()}`;
  }, [code, path, source, medium, campaign]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <LinkIcon size={16} className="text-primary" />
        <h2 className="font-display font-bold text-foreground">Generate a tracked link</h2>
      </div>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create or approve an active affiliate first to generate links.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Affiliate</Label>
              <Select value={code} onValueChange={setCode}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {active.map((a) => (
                    <SelectItem key={a.id} value={a.code}>
                      {a.full_name} ({a.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Landing page</Label>
              <Select value={path} onValueChange={setPath}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PATHS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>utm_source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div>
              <Label>utm_medium</Label>
              <Input value={medium} onChange={(e) => setMedium(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>utm_campaign</Label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 border border-border p-3 break-all text-xs font-mono">
            {url}
          </div>

          <Button onClick={copy} className="w-full">
            {copied ? (<><Check size={14} /> Copied</>) : (<><Copy size={14} /> Copy link</>)}
          </Button>
          <p className="text-xs text-muted-foreground">
            When someone clicks this link, the affiliate code and UTM params are stored for 60 days and attached to any lead they submit.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminAffiliates;
