import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";

const PIPELINE = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "received",
  "repaired",
  "replaced",
  "refunded",
  "closed",
] as const;

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  received: "bg-indigo-100 text-indigo-700 border-indigo-200",
  repaired: "bg-emerald-100 text-emerald-700 border-emerald-200",
  replaced: "bg-emerald-100 text-emerald-700 border-emerald-200",
  refunded: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-muted text-muted-foreground border-border",
};

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const AdminWarranty = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [staff, setStaff] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [selected, setSelected] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: profiles }] = await Promise.all([
      supabase.from("warranty_claims" as any).select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("id,email").limit(500),
    ]);
    if (error) toast.error(error.message);
    setRows(((data as any) || []) as any[]);
    setStaff((((profiles as any) || []) as any[]).map((p) => ({ id: p.id, email: p.email })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openClaim = async (id: string) => {
    if (selected === id) return setSelected(null);
    setSelected(id);
    if (events[id]) return;
    const { data } = await supabase
      .from("warranty_claim_events" as any)
      .select("*")
      .eq("claim_id", id)
      .order("created_at");
    setEvents((e) => ({ ...e, [id]: ((data as any) || []) as any[] }));
  };

  const logEvent = async (claimId: string, event_type: string, from_value: string | null, to_value: string | null, note?: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const row = {
      claim_id: claimId,
      event_type,
      from_value,
      to_value,
      note: note || null,
      actor_id: auth?.user?.id ?? null,
      actor_email: auth?.user?.email ?? null,
    };
    const { data } = await supabase.from("warranty_claim_events" as any).insert(row).select().single();
    if (data) setEvents((e) => ({ ...e, [claimId]: [...(e[claimId] || []), data as any] }));
  };

  const notifyCustomer = async (claim: any, status: string) => {
    if (!claim.customer_email) return;
    try {
      await supabase.functions.invoke("send-gmail", {
        body: {
          recipients: [claim.customer_email],
          subject: `Update on your warranty claim ${claim.rma_number}`,
          message:
            `Hi ${claim.customer_name || "there"},\n\n` +
            `Your warranty claim ${claim.rma_number} for ${claim.product_name || "your device"}` +
            `${claim.serial ? ` (serial ${claim.serial})` : ""} is now: ${pretty(status)}.\n\n` +
            `${claim.resolution ? `Resolution: ${claim.resolution}\n\n` : ""}` +
            `We will keep you posted at every stage.\n\n— Tioga Technologies Support`,
        },
      });
    } catch { /* email is best-effort */ }
  };

  const patch = async (claim: any, values: any, options: { event?: string; notify?: boolean } = {}) => {
    const { error } = await supabase.from("warranty_claims" as any).update(values).eq("id", claim.id);
    if (error) return toast.error(error.message);
    const next = { ...claim, ...values };
    setRows((p) => p.map((r) => (r.id === claim.id ? next : r)));
    if (options.event === "status") {
      await logEvent(claim.id, "status", claim.status, values.status);
      if (options.notify) notifyCustomer(next, values.status);
    }
    toast.success("Claim updated");
  };

  const setStatus = (claim: any, status: string) => {
    const values: any = { status };
    if (["repaired", "replaced", "refunded", "closed", "rejected"].includes(status)) {
      values.resolved_at = new Date().toISOString();
    }
    patch(claim, values, { event: "status", notify: true });
  };

  const saveNote = async (claim: any) => {
    const note = (noteDraft[claim.id] ?? "").trim();
    if (!note) return;
    await patch(claim, { internal_notes: note });
    await logEvent(claim.id, "note", null, null, note);
  };

  const counts = useMemo(() => {
    const open = rows.filter((r) => !["closed", "rejected", "refunded", "repaired", "replaced"].includes(r.status)).length;
    return {
      total: rows.length,
      open,
      inWarranty: rows.filter((r) => r.in_warranty).length,
      closed: rows.length - open,
    };
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const closedStates = ["closed", "rejected", "refunded", "repaired", "replaced"];
        const okStatus =
          statusFilter === "all" ||
          (statusFilter === "open" ? !closedStates.includes(r.status) : r.status === statusFilter);
        const q = query.trim().toLowerCase();
        const okQuery =
          !q ||
          [r.rma_number, r.serial, r.product_name, r.customer_name, r.customer_email, r.customer_phone]
            .filter(Boolean)
            .some((v: string) => String(v).toLowerCase().includes(q));
        return okStatus && okQuery;
      }),
    [rows, query, statusFilter],
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warranty & returns</h1>
          <p className="text-sm text-muted-foreground">Track RMA claims from submission through resolution.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" /> Refresh</Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total claims", value: counts.total },
          { label: "Open", value: counts.open },
          { label: "In warranty", value: counts.inWarranty },
          { label: "Resolved", value: counts.closed },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search RMA, serial, product or customer" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open claims</SelectItem>
              <SelectItem value="all">All claims</SelectItem>
              {PIPELINE.map((s) => <SelectItem key={s} value={s}>{pretty(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No claims match this filter.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <button className="w-full text-left" onClick={() => openClaim(r.id)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-foreground">{r.rma_number}</p>
                      <Badge variant="outline" className={STATUS_STYLE[r.status] || ""}>{pretty(r.status)}</Badge>
                      <Badge variant="outline" className={r.in_warranty ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                        {r.in_warranty ? <ShieldCheck size={12} className="mr-1" /> : <ShieldAlert size={12} className="mr-1" />}
                        {r.in_warranty ? "In warranty" : "Out of warranty"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{r.product_name || "—"} {r.serial ? `· ${r.serial}` : ""}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.customer_name} · {[r.customer_email, r.customer_phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} /> {new Date(r.created_at).toLocaleDateString("en-NG")}
                  </p>
                </div>
              </button>

              {selected === r.id && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason</p>
                    <p className="text-sm text-foreground">{pretty(r.reason || "—")}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.description}</p>
                  </div>

                  {!!(r.photo_urls || []).length && (
                    <div className="flex flex-wrap gap-2">
                      {r.photo_urls.map((u: string) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Photo</a>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={r.status} onValueChange={(v) => setStatus(r, v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PIPELINE.map((s) => <SelectItem key={s} value={s}>{pretty(s)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Assignee</Label>
                      <Select value={r.assigned_to || "unassigned"} onValueChange={(v) => patch(r, { assigned_to: v === "unassigned" ? null : v })}>
                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.email}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Warranty</Label>
                      <Select value={r.in_warranty ? "yes" : "no"} onValueChange={(v) => patch(r, { in_warranty: v === "yes" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">In warranty</SelectItem>
                          <SelectItem value="no">Out of warranty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Resolution shared with customer</Label>
                      <Textarea
                        rows={3}
                        defaultValue={r.resolution || ""}
                        onBlur={(e) => e.target.value !== (r.resolution || "") && patch(r, { resolution: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Internal note</Label>
                      <Textarea
                        rows={3}
                        value={noteDraft[r.id] ?? r.internal_notes ?? ""}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => saveNote(r)}>Save note</Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</p>
                    <ul className="space-y-2">
                      {(events[r.id] || []).map((ev) => (
                        <li key={ev.id} className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {ev.event_type === "status" ? `${pretty(ev.from_value || "—")} → ${pretty(ev.to_value || "—")}` : "Note"}
                          </span>
                          {ev.note ? ` · ${ev.note}` : ""} · {new Date(ev.created_at).toLocaleString("en-NG")}
                          {ev.actor_email ? ` · ${ev.actor_email}` : ""}
                        </li>
                      ))}
                      {!(events[r.id] || []).length && <li className="text-xs text-muted-foreground">No activity yet.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminWarranty;
