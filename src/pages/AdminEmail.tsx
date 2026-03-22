import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Search, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
}

const AdminEmail = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, email, phone")
        .order("created_at", { ascending: false });
      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = leads.filter((l) =>
    l.email && (
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  const toggleSelect = (lead: Lead) => {
    setSelected((s) =>
      s.find((l) => l.id === lead.id)
        ? s.filter((l) => l.id !== lead.id)
        : [...s, lead]
    );
  };

  const handleSend = async () => {
    if (!selected.length || !subject.trim() || !body.trim()) {
      toast.error("Select recipients and fill in subject and message");
      return;
    }
    setSending(true);

    let successCount = 0;
    for (const lead of selected) {
      if (!lead.email) continue;
      try {
        await supabase.functions.invoke("notify-new-lead", {
          body: {
            custom_email: true,
            to: lead.email,
            subject: subject,
            message: body,
            recipient_name: lead.full_name,
          },
        });
        successCount++;
      } catch {
        console.error(`Failed to send to ${lead.email}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Email sent to ${successCount} recipient(s)`);
      setSelected([]);
      setSubject("");
      setBody("");
    } else {
      toast.error("Failed to send emails");
    }
    setSending(false);
  };

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  return (
    <AdminLayout>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recipients */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-foreground">Select Recipients</h2>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="Search leads with email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-medium">
                  {s.full_name}
                  <button onClick={() => toggleSelect(s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No leads with email found</div>
            ) : (
              filtered.map((lead) => {
                const isSelected = selected.some((s) => s.id === lead.id);
                return (
                  <button
                    key={lead.id}
                    onClick={() => toggleSelect(lead)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 text-left hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                      {isSelected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{lead.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Compose */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-foreground">Compose Email</h2>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject *</label>
            <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Message *</label>
            <textarea
              className={`${inputClass} min-h-[250px] resize-none`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !selected.length || !subject.trim() || !body.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40"
          >
            <Send size={16} />
            {sending ? "Sending..." : `Send to ${selected.length} recipient(s)`}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmail;
