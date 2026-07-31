import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type Ticket = {
  id: string;
  ticket_number: string;
  user_id: string | null;
  user_name: string;
  user_contact: string;
  subject: string | null;
  message: string;
  conversation_context: string | null;
  channel: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  assigned_to: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type StaffMember = { id: string; name: string };

const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  normal: "bg-sky-100 text-sky-700 border-sky-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

// Ageing / SLA: hours since creation for tickets that are still open.
const ageHours = (t: Ticket) =>
  (Date.now() - new Date(t.created_at).getTime()) / 36e5;

const AgeBadge = ({ t }: { t: Ticket }) => {
  const done = t.status === "resolved" || t.status === "closed";
  const h = ageHours(t);
  const label = h < 1 ? "<1h" : h < 24 ? `${Math.floor(h)}h` : `${Math.floor(h / 24)}d`;
  const cls = done
    ? "bg-gray-100 text-gray-500 border-gray-200"
    : h >= 48
    ? "bg-red-100 text-red-700 border-red-200"
    : h >= 24
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return <Badge variant="outline" className={cls}>{label}</Badge>;
};

type SortKey = "ticket_number" | "user_name" | "status" | "channel" | "created_at" | "priority";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");

const UNASSIGNED = "__unassigned__";


const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error(error.message);
    setTickets((data as any) || []);
    setLoading(false);
  };

  const loadStaff = async () => {
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "staff", "engineer"]);
    const ids = Array.from(new Set(((roleRows as any) || []).map((r: any) => r.user_id))) as string[];
    if (!ids.length) return setStaff([]);
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
    setStaff(
      ids.map((id) => {
        const p = ((profs as any) || []).find((x: any) => x.id === id);
        return { id, name: p?.full_name || p?.email || id.slice(0, 8) };
      }),
    );
  };

  useEffect(() => { load(); loadStaff(); }, []);

  const staffName = (id: string | null) => (id ? staff.find((s) => s.id === id)?.name || "Assigned" : "Unassigned");

  const patchTicket = async (id: string, values: Partial<Ticket>) => {
    const { error } = await supabase.from("support_tickets" as any).update(values).eq("id", id);
    if (error) return toast.error(error.message);
    setTickets((p) => p.map((t) => (t.id === id ? { ...t, ...values } as Ticket : t)));
    setSelected((s) => (s && s.id === id ? ({ ...s, ...values } as Ticket) : s));
    toast.success("Ticket updated");
  };


  const notifyStatusChange = async (ticket: Ticket, newStatus: Ticket["status"]) => {
    if (!isEmail(ticket.user_contact)) return;
    try {
      await supabase.functions.invoke("send-gmail", {
        body: {
          recipients: [ticket.user_contact],
          subject: `Update on your support ticket ${ticket.ticket_number}`,
          message:
            `Hi ${ticket.user_name || "there"},\n\n` +
            `Your support ticket ${ticket.ticket_number} status is now: ${newStatus.replace("_", " ").toUpperCase()}.\n\n` +
            `Subject: ${ticket.subject || ticket.message.slice(0, 80)}\n\n` +
            `Our team will keep you posted. Reply to this email if you need to add anything.\n\n— Tioga Technologies Support`,
          from_name: "Tioga Technologies Support",
        },
      });
    } catch (e) {
      console.warn("notify failed", e);
    }
  };

  const updateStatus = async (id: string, status: Ticket["status"]) => {
    const prev = tickets.find((t) => t.id === id);
    const patch: any = { status };
    if (status === "resolved" || status === "closed") patch.resolved_at = new Date().toISOString();
    else patch.resolved_at = null;
    const { error } = await supabase.from("support_tickets" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setTickets((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (selected?.id === id) setSelected({ ...selected, ...patch });
    if (prev && prev.status !== status) {
      notifyStatusChange(prev, status).then(() => {
        if (isEmail(prev.user_contact)) toast.message("Customer notified by email");
      });
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "created_at" ? "desc" : "asc"); }
    setPage(1);
  };

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

  const filtered = useMemo(() => {
    let list = tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter === UNASSIGNED && t.assigned_to) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== UNASSIGNED && t.assigned_to !== assigneeFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return [t.ticket_number, t.user_name, t.user_contact, t.subject, t.message]
        .filter(Boolean).some((s) => s!.toLowerCase().includes(q));
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = (a[sortKey] ?? "") as any;
      const bv = (b[sortKey] ?? "") as any;
      if (sortKey === "created_at") return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
      if (sortKey === "priority")
        return ((PRIORITY_ORDER[av] ?? 2) - (PRIORITY_ORDER[bv] ?? 2)) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [tickets, statusFilter, assigneeFilter, query, sortKey, sortDir]);

  useEffect(() => { setPage(1); }, [query, statusFilter, assigneeFilter]);


  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };
  const Th = ({ k, label, className = "" }: { k: SortKey; label: string; className?: string }) => (
    <th className={`text-left px-4 py-3 ${className}`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label} <SortIcon k={k} />
      </button>
    </th>
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">Escalations from AI chat and other channels.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-2" />Refresh</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
            <Card key={s} className="p-4">
              <p className="text-xs text-muted-foreground capitalize">{s.replace("_", " ")}</p>
              <p className="text-2xl font-bold">{counts[s] || 0}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ticket #, name, contact, message…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No tickets match your filters.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <Th k="ticket_number" label="Ticket" />
                      <Th k="user_name" label="Customer" />
                      <th className="text-left px-4 py-3">Subject</th>
                      <Th k="status" label="Status" />
                      <Th k="priority" label="Priority" />
                      <th className="text-left px-4 py-3">Assignee</th>
                      <th className="text-left px-4 py-3">Age</th>
                      <Th k="channel" label="Channel" />
                      <Th k="created_at" label="Created" />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((t) => (
                      <tr key={t.id} onClick={() => setSelected(t)} className="border-t border-border hover:bg-muted/40 cursor-pointer">
                        <td className="px-4 py-3 font-mono text-xs">{t.ticket_number}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.user_name}</div>
                          <div className="text-xs text-muted-foreground">{t.user_contact}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{t.subject || t.message}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status.replace("_", " ")}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={PRIORITY_STYLE[t.priority || "normal"]}>{t.priority || "normal"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">{staffName(t.assigned_to)}</td>
                        <td className="px-4 py-3"><AgeBadge t={t} /></td>
                        <td className="px-4 py-3 capitalize">{t.channel}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(t.created_at), "MMM d, HH:mm")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {paged.map((t) => (
                  <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left p-4 hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs">{t.ticket_number}</span>
                      <div className="flex items-center gap-1">
                        <AgeBadge t={t} />
                        <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status.replace("_", " ")}</Badge>
                      </div>
                    </div>

                    <div className="font-medium text-sm">{t.user_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.user_contact}</div>
                    <div className="text-xs mt-1 line-clamp-2">{t.subject || t.message}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {format(new Date(t.created_at), "MMM d, HH:mm")} · {t.channel} · {t.priority || "normal"} · {staffName(t.assigned_to)}
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="px-2 text-xs">Page {pageSafe} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm">{selected.ticket_number}</span>
                  <Badge variant="outline" className={STATUS_STYLE[selected.status]}>{selected.status.replace("_", " ")}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{selected.user_name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Contact</p><p className="font-medium break-all">{selected.user_contact}</p></div>
                  <div><p className="text-xs text-muted-foreground">Channel</p><p className="capitalize">{selected.channel}</p></div>
                  <div><p className="text-xs text-muted-foreground">Created</p><p>{format(new Date(selected.created_at), "PPpp")}</p></div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <div className="p-3 rounded-lg bg-muted/40 whitespace-pre-wrap">{selected.message}</div>
                </div>

                {selected.conversation_context && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conversation context</p>
                    <pre className="p-3 rounded-lg bg-muted/40 whitespace-pre-wrap font-sans text-xs">{selected.conversation_context}</pre>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Update status {isEmail(selected.user_contact) && <span className="text-emerald-600">· customer will be emailed</span>}
                  </p>
                  <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v as Ticket["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSupportTickets;
