import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, RefreshCw } from "lucide-react";
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
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const STATUS_STYLE: Record<Ticket["status"], string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setTickets((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: Ticket["status"]) => {
    const patch: any = { status };
    if (status === "resolved" || status === "closed") patch.resolved_at = new Date().toISOString();
    else patch.resolved_at = null;
    const { error } = await supabase.from("support_tickets" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (selected?.id === id) setSelected({ ...selected, ...patch });
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [t.ticket_number, t.user_name, t.user_contact, t.subject, t.message]
      .filter(Boolean).some((s) => s!.toLowerCase().includes(q));
  });

  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No tickets yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Ticket</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Subject</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Channel</th>
                    <th className="text-left px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} onClick={() => setSelected(t)} className="border-t border-border hover:bg-muted/40 cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs">{t.ticket_number}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.user_name}</div>
                        <div className="text-xs text-muted-foreground">{t.user_contact}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell max-w-xs truncate">{t.subject || t.message}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell capitalize">{t.channel}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(t.created_at), "MMM d, HH:mm")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
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
                  <p className="text-xs text-muted-foreground mb-1">Update status</p>
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
