import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye, X, Download, Search, MessageCircle, Mail, Plus, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  location: string;
  products: string[];
  has_electricity: string | null;
  main_goal: string | null;
  appliances: string[] | null;
  budget: string | null;
  timeline: string | null;
  notes: string | null;
  consent: boolean;
  created_at: string;
  status: string;
  source?: string;
}

interface Activity {
  id: string;
  action_type: string;
  note: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  converted: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const statuses = ["new", "contacted", "converted", "closed"];
const activityTypes = ["call", "email", "whatsapp", "meeting", "note"];

const AdminLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newAction, setNewAction] = useState("note");
  const [newNote, setNewNote] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const fetchActivities = async (leadId: string) => {
    const { data } = await supabase
      .from("lead_activities")
      .select("id, action_type, note, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    setActivities((data as Activity[]) ?? []);
  };

  const viewLead = (lead: Lead) => {
    setViewing(lead);
    fetchActivities(lead.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Lead deleted");
    setViewing(null);
    fetchLeads();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    fetchLeads();
    if (viewing?.id === id) setViewing(v => v ? { ...v, status } : null);
  };

  const addActivity = async () => {
    if (!viewing || !user) return;
    setAddingActivity(true);
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: viewing.id,
      action_type: newAction,
      note: newNote || null,
      created_by: user.id,
    });
    if (error) { toast.error("Failed to add activity"); }
    else {
      toast.success("Activity logged");
      setNewNote("");
      fetchActivities(viewing.id);
    }
    setAddingActivity(false);
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Location", "Products", "Budget", "Goal", "Status", "Source", "Date"];
    const rows = leads.map(l => [
      l.full_name, l.phone, l.email ?? "", l.location,
      l.products.join("; "), l.budget ?? "", l.main_goal ?? "", l.status,
      l.source ?? "website_form",
      new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads
    .filter(l => !statusFilter || l.status === statusFilter)
    .filter(l => !search || l.full_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || (l.email?.toLowerCase().includes(search.toLowerCase())));

  const counts = statuses.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded-2xl border p-3 text-left transition-all ${statusFilter === s ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
              <p className="text-2xl font-display font-bold text-card-foreground">{counts[s] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all shrink-0">
            <Download size={14} /> Export CSV
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading leads...</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 font-medium">Budget</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-card-foreground">{lead.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.location}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.budget ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                          className={`text-[11px] px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[lead.status] || "bg-muted text-muted-foreground"}`}>
                          {statuses.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=Hi ${encodeURIComponent(lead.full_name)}, this is Tioga Technologies. Thanks for your interest!`}
                            target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-50 text-muted-foreground hover:text-green-600" title="WhatsApp">
                            <MessageCircle size={14} />
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title="Email">
                              <Mail size={14} />
                            </a>
                          )}
                          <button onClick={() => viewLead(lead)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Eye size={14} /></button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No leads found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-display font-bold text-card-foreground text-lg">Lead Details</h3>
              <button onClick={() => setViewing(null)} className="p-1 rounded-lg hover:bg-muted"><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <select value={viewing.status} onChange={e => updateStatus(viewing.id, e.target.value)}
                  className={`block mt-1 text-xs px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${statusColors[viewing.status]}`}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {[
                ["Name", viewing.full_name], ["Phone", viewing.phone], ["Email", viewing.email],
                ["Location", viewing.location], ["Products", viewing.products.join(", ")],
                ["Budget", viewing.budget], ["Electricity", viewing.has_electricity],
                ["Main Goal", viewing.main_goal], ["Appliances", viewing.appliances?.join(", ")],
                ["Timeline", viewing.timeline], ["Source", viewing.source?.replace(/_/g, " ") || "Website Form"],
                ["Notes", viewing.notes], ["Submitted", new Date(viewing.created_at).toLocaleString()],
              ].map(([label, value]) => value ? (
                <div key={label as string}>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <p className="text-card-foreground">{value}</p>
                </div>
              ) : null)}
            </div>

            {/* Activity Log */}
            <div className="px-6 py-4 border-t border-border space-y-3">
              <h4 className="text-sm font-bold text-card-foreground flex items-center gap-1.5"><Clock size={14} /> Activity Log</h4>
              
              <div className="flex gap-2">
                <select value={newAction} onChange={e => setNewAction(e.target.value)}
                  className="text-xs rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-foreground">
                  {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="Add note..." value={newNote} onChange={e => setNewNote(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={addActivity} disabled={addingActivity}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40">
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activities.length > 0 ? activities.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium capitalize shrink-0">{a.action_type}</span>
                    <span className="text-card-foreground flex-1">{a.note || "—"}</span>
                    <span className="text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground">No activities yet</p>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 space-y-2">
              <div className="flex gap-2">
                <a href={`https://wa.me/${viewing.phone.replace(/\D/g, "")}?text=Hi ${encodeURIComponent(viewing.full_name)}, this is Tioga Technologies.`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-all">
                  <MessageCircle size={14} /> WhatsApp
                </a>
                {viewing.email && (
                  <a href={`mailto:${viewing.email}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-all">
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
              <button onClick={() => handleDelete(viewing.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
                <Trash2 size={14} /> Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeads;
