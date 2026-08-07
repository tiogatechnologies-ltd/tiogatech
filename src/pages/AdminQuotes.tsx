import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, RefreshCw, Search, Trash2, FileDown, Send, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { downloadReportPdf, whatsappShareUrl } from "@/lib/reportPdf";
import { quoteToReport, quoteTotals, sectionTotal, emptySection, ngn, type QuoteSection } from "@/lib/quoteDoc";

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-amber-100 text-amber-700 border-amber-200",
};

type Draft = {
  id?: string;
  quote_number?: string;
  version?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_location: string;
  title: string;
  subtitle: string;
  scope: string;
  intro: string;
  sections: QuoteSection[];
  notes: string;
  exclusions: string;
  discount: number;
  deposit_pct: number;
  valid_until: string;
  status: string;
  created_at?: string;
};

const blankDraft = (): Draft => ({
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_location: "",
  title: "Solar System Quotation",
  subtitle: "",
  scope: "Supply, installation and commissioning",
  intro: "",
  sections: [
    { title: "Inverter", items: [{ item: "", qty: 1, unit: 0 }] },
    { title: "Solar array", items: [{ item: "", qty: 1, unit: 0 }] },
    { title: "Batteries", items: [{ item: "", qty: 1, unit: 0 }] },
    { title: "Balance of system & labour", items: [{ item: "", qty: 1, unit: 0 }] },
  ],
  notes: "",
  exclusions: "",
  discount: 0,
  deposit_pct: 30,
  valid_until: "",
  status: "draft",
});

const toDraft = (row: any): Draft => ({
  id: row.id,
  quote_number: row.quote_number,
  version: row.version,
  customer_name: row.customer_name || "",
  customer_email: row.customer_email || "",
  customer_phone: row.customer_phone || "",
  customer_location: row.customer_location || "",
  title: row.title || "",
  subtitle: row.subtitle || "",
  scope: row.scope || "",
  intro: row.intro || "",
  sections: Array.isArray(row.sections) && row.sections.length ? row.sections : [emptySection()],
  notes: Array.isArray(row.notes) ? row.notes.join("\n") : "",
  exclusions: row.exclusions || "",
  discount: Number(row.discount || 0),
  deposit_pct: Number(row.deposit_pct ?? 30),
  valid_until: row.valid_until || "",
  status: row.status || "draft",
  created_at: row.created_at,
});

const AdminQuotes = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const okStatus = statusFilter === "all" || r.status === statusFilter;
        const q = query.trim().toLowerCase();
        const okQuery =
          !q ||
          [r.quote_number, r.customer_name, r.customer_email, r.customer_phone]
            .filter(Boolean)
            .some((v: string) => String(v).toLowerCase().includes(q));
        return okStatus && okQuery;
      }),
    [rows, query, statusFilter],
  );

  const totals = quoteTotals(draft.sections, draft.discount);

  const newQuote = () => { setDraft(blankDraft()); setOpen(true); };
  const editQuote = (row: any) => { setDraft(toDraft(row)); setOpen(true); };

  const save = async () => {
    if (!draft.customer_name.trim()) return toast.error("Customer name is required");
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload: any = {
      customer_name: draft.customer_name.trim(),
      customer_email: draft.customer_email.trim() || null,
      customer_phone: draft.customer_phone.trim() || null,
      customer_location: draft.customer_location.trim() || null,
      title: draft.title || "Solar System Quotation",
      subtitle: draft.subtitle || null,
      scope: draft.scope || null,
      intro: draft.intro || null,
      sections: draft.sections,
      notes: draft.notes.split("\n").map((s) => s.trim()).filter(Boolean),
      exclusions: draft.exclusions || null,
      subtotal: totals.subtotal,
      discount: Number(draft.discount) || 0,
      total: totals.total,
      deposit_pct: Number(draft.deposit_pct) || 0,
      valid_until: draft.valid_until || null,
      status: draft.status,
    };

    if (draft.id) {
      const { error } = await supabase.from("quotes" as any).update(payload).eq("id", draft.id);
      if (error) { setSaving(false); return toast.error(error.message); }
      toast.success("Quotation updated");
    } else {
      payload.quote_number = `QT-${Date.now().toString().slice(-8)}`;
      payload.created_by = auth?.user?.id ?? null;
      const { error } = await supabase.from("quotes" as any).insert(payload);
      if (error) { setSaving(false); return toast.error(error.message); }
      toast.success("Quotation created");
    }
    setSaving(false);
    setOpen(false);
    load();
  };

  const setStatus = async (row: any, status: string) => {
    const patch: any = { status };
    if (status === "sent") patch.sent_at = new Date().toISOString();
    if (status === "accepted") patch.accepted_at = new Date().toISOString();
    const { error } = await supabase.from("quotes" as any).update(patch).eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((p) => p.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    toast.success(`Marked as ${status}`);
  };

  const remove = async (row: any) => {
    if (!confirm(`Delete quotation ${row.quote_number}?`)) return;
    const { error } = await supabase.from("quotes" as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((p) => p.filter((r) => r.id !== row.id));
    toast.success("Quotation deleted");
  };

  const pdf = (row: any) => downloadReportPdf(quoteToReport(row), `tioga-quotation-${row.quote_number}.pdf`);

  const share = (row: any) => {
    const msg = `Hello ${row.customer_name}, here is your Tioga Technologies quotation ${row.quote_number} for ${ngn(Number(row.total))}. Kindly review and let us know if you would like to proceed.`;
    window.open(whatsappShareUrl(msg, row.customer_phone || undefined), "_blank");
  };

  // ---- section editing helpers ----
  const patchSection = (si: number, values: Partial<QuoteSection>) =>
    setDraft((d) => ({ ...d, sections: d.sections.map((s, i) => (i === si ? { ...s, ...values } : s)) }));

  const patchItem = (si: number, ii: number, values: any) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s, i) =>
        i === si ? { ...s, items: s.items.map((it, j) => (j === ii ? { ...it, ...values } : it)) } : s,
      ),
    }));

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotations</h1>
          <p className="text-sm text-muted-foreground">Build branded quotes, send them and track acceptance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" /> Refresh</Button>
          <Button size="sm" onClick={newQuote}><Plus size={14} className="mr-1.5" /> New quotation</Button>
        </div>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search number, name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No quotations yet.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-foreground">{r.quote_number}</p>
                    <Badge variant="outline" className={STATUS_STYLE[r.status] || ""}>{r.status}</Badge>
                    {r.version > 1 && <Badge variant="outline">v{r.version}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foreground">{r.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[r.customer_email, r.customer_phone, r.customer_location].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-NG")}
                    {r.valid_until ? ` · valid until ${new Date(r.valid_until).toLocaleDateString("en-NG")}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{ngn(Number(r.total))}</p>
                  <p className="text-xs text-muted-foreground">{r.deposit_pct}% deposit</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => editQuote(r)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => pdf(r)}><FileDown size={14} className="mr-1.5" /> PDF</Button>
                <Button size="sm" variant="outline" onClick={() => share(r)}><Copy size={14} className="mr-1.5" /> WhatsApp</Button>
                {r.status === "draft" && (
                  <Button size="sm" onClick={() => setStatus(r, "sent")}><Send size={14} className="mr-1.5" /> Mark sent</Button>
                )}
                {r.status === "sent" && (
                  <>
                    <Button size="sm" onClick={() => setStatus(r, "accepted")}><Check size={14} className="mr-1.5" /> Accepted</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r, "rejected")}>Rejected</Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? `Edit ${draft.quote_number}` : "New quotation"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Customer name</Label><Input value={draft.customer_name} onChange={(e) => setDraft({ ...draft, customer_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={draft.customer_email} onChange={(e) => setDraft({ ...draft, customer_email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={draft.customer_phone} onChange={(e) => setDraft({ ...draft, customer_phone: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={draft.customer_location} onChange={(e) => setDraft({ ...draft, customer_location: e.target.value })} /></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div><Label>Subtitle / spec summary</Label><Input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="5kVA inverter · 10kWh storage · 6 × 550W" /></div>
              <div className="sm:col-span-2"><Label>Scope</Label><Input value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Intro / callout</Label><Textarea rows={3} value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} /></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Line items</Label>
                <Button size="sm" variant="outline" onClick={() => setDraft({ ...draft, sections: [...draft.sections, emptySection()] })}>
                  <Plus size={14} className="mr-1.5" /> Section
                </Button>
              </div>

              {draft.sections.map((s, si) => (
                <Card key={si} className="p-3">
                  <div className="mb-2 flex gap-2">
                    <Input value={s.title} onChange={(e) => patchSection(si, { title: e.target.value })} className="font-semibold" />
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== si) })}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {s.items.map((it, ii) => (
                      <div key={ii} className="grid grid-cols-12 gap-2">
                        <Input className="col-span-6" placeholder="Item description" value={it.item} onChange={(e) => patchItem(si, ii, { item: e.target.value })} />
                        <Input className="col-span-2" type="number" placeholder="Qty" value={it.qty as any} onChange={(e) => patchItem(si, ii, { qty: Number(e.target.value) })} />
                        <Input className="col-span-3" type="number" placeholder="Unit ₦" value={it.unit as any} onChange={(e) => patchItem(si, ii, { unit: Number(e.target.value) })} />
                        <Button size="sm" variant="ghost" className="col-span-1 text-destructive" onClick={() => patchSection(si, { items: s.items.filter((_, j) => j !== ii) })}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Button size="sm" variant="ghost" onClick={() => patchSection(si, { items: [...s.items, { item: "", qty: 1, unit: 0 }] })}>
                      <Plus size={13} className="mr-1" /> Item
                    </Button>
                    <p className="text-sm font-semibold text-foreground">{ngn(sectionTotal(s))}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label>Discount (₦)</Label><Input type="number" value={draft.discount} onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) })} /></div>
              <div><Label>Deposit %</Label><Input type="number" value={draft.deposit_pct} onChange={(e) => setDraft({ ...draft, deposit_pct: Number(e.target.value) })} /></div>
              <div><Label>Valid until</Label><Input type="date" value={draft.valid_until} onChange={(e) => setDraft({ ...draft, valid_until: e.target.value })} /></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Notes (one per line)</Label><Textarea rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
              <div><Label>Exclusions</Label><Textarea rows={4} value={draft.exclusions} onChange={(e) => setDraft({ ...draft, exclusions: e.target.value })} /></div>
            </div>

            <Card className="flex items-center justify-between bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Subtotal {ngn(totals.subtotal)}</span>
              <span className="text-lg font-bold text-foreground">Total {ngn(totals.total)}</span>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />} Save quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuotes;
