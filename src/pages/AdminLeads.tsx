import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Eye, X, Download } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

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
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Lead deleted");
    setViewing(null);
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Location", "Products", "Budget", "Goal", "Date"];
    const rows = leads.map((l) => [
      l.full_name, l.phone, l.email ?? "", l.location,
      l.products.join("; "), l.budget ?? "", l.main_goal ?? "",
      new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{leads.length} total leads</p>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all">
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
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-card-foreground">{lead.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{lead.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{lead.location}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lead.budget ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setViewing(lead)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Eye size={14} /></button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No leads yet</td></tr>
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
              {[
                ["Name", viewing.full_name],
                ["Phone", viewing.phone],
                ["Email", viewing.email],
                ["Location", viewing.location],
                ["Products", viewing.products.join(", ")],
                ["Budget", viewing.budget],
                ["Electricity", viewing.has_electricity],
                ["Main Goal", viewing.main_goal],
                ["Appliances", viewing.appliances?.join(", ")],
                ["Timeline", viewing.timeline],
                ["Notes", viewing.notes],
                ["Submitted", new Date(viewing.created_at).toLocaleString()],
              ].map(([label, value]) => value ? (
                <div key={label as string}>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <p className="text-card-foreground">{value}</p>
                </div>
              ) : null)}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => handleDelete(viewing.id)} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
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
