import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Briefcase, MapPin, Calendar } from "lucide-react";

type Career = {
  id: string;
  title: string;
  location: string;
  summary: string;
  highlights: string[];
  requirements: string;
  email_subject: string;
  deadline: string;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Career, "id"> = {
  title: "",
  location: "",
  summary: "",
  highlights: [],
  requirements: "",
  email_subject: "",
  deadline: "30th May, 2026",
  is_active: true,
  sort_order: 0,
};

const AdminCareers = () => {
  const [items, setItems] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Career | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Career, "id">>(empty);
  const [highlightsText, setHighlightsText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("careers")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Could not load roles");
    } else {
      setItems((data as Career[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 });
    setHighlightsText("");
    setOpen(true);
  };

  const startEdit = (c: Career) => {
    setEditing(c);
    setForm({
      title: c.title,
      location: c.location,
      summary: c.summary,
      highlights: c.highlights || [],
      requirements: c.requirements,
      email_subject: c.email_subject,
      deadline: c.deadline,
      is_active: c.is_active,
      sort_order: c.sort_order,
    });
    setHighlightsText((c.highlights || []).join("\n"));
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      highlights: highlightsText.split("\n").map((s) => s.trim()).filter(Boolean),
      email_subject: form.email_subject.trim() || `Application - ${form.title}`,
    };
    const { error } = editing
      ? await supabase.from("careers").update(payload).eq("id", editing.id)
      : await supabase.from("careers").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Role updated" : "Role created");
    setOpen(false);
    load();
  };

  const remove = async (c: Career) => {
    if (!confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("careers").delete().eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role deleted");
    load();
  };

  const toggleActive = async (c: Career) => {
    const { error } = await supabase.from("careers").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Careers</h2>
            <p className="text-sm text-muted-foreground">Manage job postings shown on the public Career page.</p>
          </div>
          <Button onClick={startNew} className="gap-2">
            <Plus size={16} /> New Role
          </Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Briefcase className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="text-muted-foreground mb-4">No roles yet.</p>
            <Button onClick={startNew} className="gap-2">
              <Plus size={16} /> Create your first role
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  c.is_active ? "border-border" : "border-dashed border-border opacity-70"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-foreground truncate">{c.title}</h3>
                    {!c.is_active && (
                      <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} /> {c.location || "-"}</span>
                    <span className="inline-flex items-center gap-1"><Calendar size={11} /> {c.deadline}</span>
                    <span>Order: {c.sort_order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2">
                    <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)} className="gap-1.5">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c)} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Role" : "New Role"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Project Engineer" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos | Abuja | Jos" />
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="30th May, 2026" />
                </div>
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Short description shown on the card." />
              </div>
              <div>
                <Label>Highlights (one per line)</Label>
                <Textarea
                  rows={4}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  placeholder={"2 to 5 years experience\nPV and ESS Storage\nField-ready"}
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="HND / B.Eng in Electrical Engineering…" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email Subject (auto if empty)</Label>
                  <Input value={form.email_subject} onChange={(e) => setForm({ ...form, email_subject: e.target.value })} placeholder="Application - …" />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="cursor-pointer" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                  Visible on public Career page
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCareers;
