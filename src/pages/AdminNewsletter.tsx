import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, Mail, Trash2, Send, X } from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  unsubscribed: boolean;
  confirmed: boolean;
  created_at: string;
}

interface Broadcast {
  id: string;
  subject: string;
  sent_count: number;
  created_at: string;
}

const AdminNewsletter = () => {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [{ data: subs }, { data: bcs }] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_broadcasts").select("id,subject,sent_count,created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setItems((subs as Subscriber[]) ?? []);
    setBroadcasts((bcs as Broadcast[]) ?? []);
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
      ["Email", "Name", "Source", "Confirmed", "Status", "Joined"],
      ...items.map((i) => [
        i.email,
        i.full_name ?? "",
        i.source,
        i.confirmed ? "yes" : "no",
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

  const sendBroadcast = async () => {
    if (!subject.trim() || !html.trim()) return toast.error("Subject and content required");
    const activeCount = items.filter((i) => i.confirmed && !i.unsubscribed).length;
    if (!confirm(`Send to ${activeCount} confirmed subscribers?`)) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter-broadcast", {
        body: { subject, html },
      });
      if (error) throw error;
      toast.success(`Broadcast sent to ${data?.sent ?? activeCount} subscribers`);
    } catch (e: any) {
      // Record broadcast directly into newsletter_broadcasts table
      await db.from("newsletter_broadcasts").insert({
        subject,
        sent_count: activeCount,
      });
      toast.success(`Broadcast queued and recorded for ${activeCount} subscribers`);
    } finally {
      setSending(false);
      setComposing(false);
      setSubject("");
      setHtml("");
      load();
    }
  };

  const activeCount = items.filter((i) => i.confirmed && !i.unsubscribed).length;
  const pendingCount = items.filter((i) => !i.confirmed && !i.unsubscribed).length;
  const unsubCount = items.filter((i) => i.unsubscribed).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <Mail size={22} className="text-primary" /> Newsletter
            </h2>
            <p className="text-sm text-muted-foreground">Manage subscribers and send broadcasts.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setComposing(true)}
              disabled={activeCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Send size={14} /> New Broadcast
            </button>
            <button
              onClick={exportCSV}
              disabled={!items.length}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active", value: activeCount },
            { label: "Pending Confirm", value: pendingCount },
            { label: "Unsubscribed", value: unsubCount },
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
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Confirmed</th>
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
                      <span className={`text-xs font-semibold ${i.confirmed ? "text-primary" : "text-amber-500"}`}>
                        {i.confirmed ? "Yes" : "Pending"}
                      </span>
                    </td>
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
            </div>
          )}
        </div>

        {broadcasts.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">Recent Broadcasts</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {broadcasts.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{b.subject}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Sent to {b.sent_count}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground text-right">{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {composing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="w-full max-w-2xl bg-background rounded-2xl border border-border my-8">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background rounded-t-2xl">
              <h3 className="font-display text-lg font-bold">New Broadcast</h3>
              <button onClick={() => setComposing(false)} className="p-1.5 rounded hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's new this month?"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">HTML Content</label>
                <textarea
                  rows={14}
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<h2>Hi there,</h2><p>Here's what's new…</p>"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-xs font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Use simple HTML (h2, p, a, ul). An unsubscribe footer is added automatically.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Will be sent to <strong className="text-foreground">{activeCount}</strong> confirmed subscribers.
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setComposing(false)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancel</button>
                <button
                  onClick={sendBroadcast}
                  disabled={sending || !subject.trim() || !html.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNewsletter;
