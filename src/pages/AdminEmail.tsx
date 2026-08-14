import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Search, X, Mail, Plus, Users as UsersIcon, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Recipient { id: string; name: string; email: string; source: "lead" | "user" | "affiliate" | "custom" }

const TEMPLATES: { label: string; subject: string; body: string }[] = [
  { label: "Follow-up", subject: "Following up on your Tioga inquiry", body: "Hi {{name}},\n\nJust checking in on the solution we discussed. Let me know if you'd like to move forward or have any questions.\n\nBest,\nTioga Technologies" },
  { label: "Quote Ready", subject: "Your custom quote is ready", body: "Hi {{name}},\n\nYour personalised quote is ready. Reply to this email and we'll send it across or schedule a quick call.\n\nThanks,\nTioga Technologies" },
  { label: "Welcome", subject: "Welcome to Tioga Technologies", body: "Hi {{name}},\n\nWelcome aboard! Reach out anytime via WhatsApp on +234 817 800 0023.\n\nTioga Technologies" },
];

const AdminEmail = () => {
  const [tab, setTab] = useState<"lead" | "user" | "affiliate" | "custom">("lead");
  const [pool, setPool] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipient[]>([]);
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPool = async () => {
      setLoading(true);
      let rows: Recipient[] = [];
      if (tab === "lead") {
        const { data } = await supabase.from("leads").select("id, full_name, email").order("created_at", { ascending: false });
        rows = (data || []).filter((d: any) => d.email).map((d: any) => ({ id: d.id, name: d.full_name, email: d.email, source: "lead" }));
      } else if (tab === "user") {
        const { data } = await supabase.from("profiles").select("id, full_name, email").order("created_at", { ascending: false });
        rows = (data || []).filter((d: any) => d.email).map((d: any) => ({ id: d.id, name: d.full_name || d.email, email: d.email, source: "user" }));
      } else if (tab === "affiliate") {
        const { data } = await supabase.from("affiliates").select("id, full_name, email").order("created_at", { ascending: false });
        rows = (data || []).filter((d: any) => d.email).map((d: any) => ({ id: d.id, name: d.full_name, email: d.email, source: "affiliate" }));
      } else {
        rows = [];
      }
      if (active) { setPool(rows); setLoading(false); }
    };
    fetchPool();
    return () => { active = false; };
  }, [tab]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pool.filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [pool, search]);

  const toggleSelect = (r: Recipient) => {
    setSelected((s) => s.find((x) => x.email === r.email) ? s.filter((x) => x.email !== r.email) : [...s, r]);
  };

  const addCustom = () => {
    const e = customEmail.trim();
    if (!e.includes("@")) return toast.error("Enter a valid email");
    if (selected.find((s) => s.email === e)) return toast.error("Already added");
    setSelected((s) => [...s, { id: e, name: e, email: e, source: "custom" }]);
    setCustomEmail("");
  };

  const selectAll = () => setSelected((s) => {
    const map = new Map(s.map((x) => [x.email, x]));
    filtered.forEach((r) => map.set(r.email, r));
    return Array.from(map.values());
  });

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setSubject(t.subject); setBody(t.body);
  };

  const handleSend = async () => {
    if (!selected.length || !subject.trim() || !body.trim()) {
      toast.error("Add recipients, subject and a message");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gmail", {
        body: {
          recipients: selected.map((s) => s.email),
          subject,
          message: body,
          from_name: "Tioga Technologies",
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const total = (data as any)?.total ?? selected.length;
      if (sent === total) {
        toast.success(`Email sent to ${sent} recipient(s)`);
        setSelected([]); setSubject(""); setBody("");
      } else if (sent > 0) {
        toast.warning(`Sent to ${sent} of ${total}. Check logs for failures.`);
      } else {
        toast.error("Failed to send. Verify Gmail connector permissions.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 text-xs text-foreground/80">
          <Mail size={14} className="mt-0.5 shrink-0 text-primary" />
          <span>Emails are sent through your connected <strong>Gmail</strong> account via the Lovable connector. Each recipient receives an individual message.</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recipients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-foreground">Recipients</h2>
              <span className="text-xs text-muted-foreground">{selected.length} selected</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted rounded-xl text-xs">
              {(["lead", "user", "affiliate", "custom"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`py-2 rounded-lg font-medium capitalize ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>{t}s</button>
              ))}
            </div>

            {tab !== "custom" && (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input className={`${inputClass} pl-9`} placeholder={`Search ${tab}s with email...`} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button onClick={selectAll} className="text-primary hover:underline inline-flex items-center gap-1"><UsersIcon size={12} /> Add all filtered ({filtered.length})</button>
                  {selected.length > 0 && <button onClick={() => setSelected([])} className="text-muted-foreground hover:text-destructive">Clear selection</button>}
                </div>

                <div className="rounded-2xl border border-border bg-card max-h-[340px] overflow-y-auto">
                  {loading ? <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
                    : filtered.length === 0 ? <div className="p-6 text-center text-muted-foreground text-sm">No {tab}s with email found.</div>
                    : filtered.map((r) => {
                      const isSel = selected.some((s) => s.email === r.email);
                      return (
                        <button key={r.id + r.email} onClick={() => toggleSelect(r)} className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/50 text-left hover:bg-muted/30 transition-colors ${isSel ? "bg-primary/5" : ""}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-primary border-primary" : "border-border"}`}>{isSel && <span className="text-primary-foreground text-[9px] font-bold">✓</span>}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-card-foreground truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            )}

            {tab === "custom" && (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Add any email address manually.</p>
                <div className="flex gap-2">
                  <input className={inputClass} placeholder="someone@example.com" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
                  <button onClick={addCustom} className="px-3 rounded-xl bg-primary text-primary-foreground"><Plus size={16} /></button>
                </div>
              </div>
            )}

            {selected.length > 0 && (
              <div className="rounded-2xl border border-border bg-muted/30 p-3 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <span key={s.email} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                      {s.email}
                      <button onClick={() => toggleSelect(s)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compose */}
          <div className="space-y-3">
            <h2 className="font-display font-bold text-foreground">Compose</h2>

            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => applyTemplate(t)} className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:text-primary text-muted-foreground">{t.label}</button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
              <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
              <textarea className={`${inputClass} min-h-[260px] resize-none font-mono text-[13px]`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
              <p className="text-[10px] text-muted-foreground mt-1">Line breaks are preserved. HTML is escaped for safety.</p>
            </div>

            <button onClick={handleSend} disabled={sending || !selected.length || !subject.trim() || !body.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">
              <Send size={16} />
              {sending ? "Sending via Gmail..." : `Send to ${selected.length} recipient${selected.length === 1 ? "" : "s"}`}
            </button>
            {!selected.length && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><AlertCircle size={11} /> Select at least one recipient.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmail;
