import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AdminCustomRequests = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("custom_solution_requests" as any).select("*").order("created_at", { ascending: false }).limit(200);
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("custom_solution_requests" as any).update({ status }).eq("id", id) as any);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-display font-bold">Custom Solution Requests</h1>
        {loading ? <Loader2 className="animate-spin" /> : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Customer</th><th className="text-left">Location</th><th className="text-left">Requirements</th><th className="text-left">Status</th><th className="text-left">Date</th></tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.email} • {r.phone}</div>
                    </td>
                    <td>{r.location}</td>
                    <td className="max-w-xs"><div className="text-xs text-muted-foreground line-clamp-2">{r.requirements}</div></td>
                    <td>
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="text-xs rounded border border-border bg-background px-2 py-1">
                        {["new", "contacted", "quoted", "won", "lost"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No custom requests</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomRequests;
