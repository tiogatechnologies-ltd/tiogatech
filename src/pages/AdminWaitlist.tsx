import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  platform: string;
  source: string;
  created_at: string;
}

const AdminWaitlist = () => {
  const [items, setItems] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("app_waitlist")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load waitlist");
    setItems((data as WaitlistEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Remove this entry?")) return;
    const { error } = await supabase.from("app_waitlist").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed");
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Platform", "Source", "Joined"],
      ...items.map((i) => [i.full_name, i.email, i.platform, i.source, new Date(i.created_at).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const platformCount = (p: string) => items.filter((i) => i.platform === p).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Smartphone size={22} className="text-primary" /> App Waitlist
            </h2>
            <p className="text-sm text-muted-foreground">People waiting for the Tioga mobile app launch.</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={!items.length}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: items.length },
            { label: "iOS", value: platformCount("ios") },
            { label: "Android", value: platformCount("android") },
            { label: "Both", value: platformCount("both") },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="font-display text-2xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No signups yet. Share the Coming Soon page to start collecting.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Platform</th>
                    <th className="text-left px-4 py-3">Joined</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-foreground">{i.full_name}</td>
                      <td className="px-4 py-3 text-foreground">
                        <a href={`mailto:${i.email}`} className="hover:text-primary">{i.email}</a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 uppercase">
                          {i.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(i.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remove(i.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWaitlist;
