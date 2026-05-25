import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  unsubscribed: boolean;
  created_at: string;
}

const AdminNewsletter = () => {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load");
    setItems((data as Subscriber[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Remove subscriber?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    setItems((p) => p.filter((i) => i.id !== id));
  };

  const toggleUnsub = async (i: Subscriber) => {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ unsubscribed: !i.unsubscribed })
      .eq("id", i.id);
    if (error) return toast.error("Update failed");
    load();
  };

  const exportCSV = () => {
    const rows = [
      ["Email", "Name", "Source", "Status", "Joined"],
      ...items.map((i) => [
        i.email,
        i.full_name ?? "",
        i.source,
        i.unsubscribed ? "unsubscribed" : "active",
        new Date(i.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const activeCount = items.filter((i) => !i.unsubscribed).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Mail size={22} className="text-primary" /> Newsletter Subscribers
            </h2>
            <p className="text-sm text-muted-foreground">People subscribed to energy tips and updates.</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={!items.length}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active", value: activeCount },
            { label: "Unsubscribed", value: items.length - activeCount },
            { label: "Total", value: items.length },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="font-display text-2xl font-bold">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No subscribers yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <a href={`mailto:${i.email}`} className="font-medium hover:text-primary">{i.email}</a>
                      {i.full_name && <div className="text-xs text-muted-foreground">{i.full_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.source}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUnsub(i)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${i.unsubscribed ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                      >
                        {i.unsubscribed ? "Unsubscribed" : "Active"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(i.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNewsletter;
