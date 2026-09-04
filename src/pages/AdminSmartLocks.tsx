import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Lock } from "lucide-react";

type Lock = {
  id: string;
  category: "lock" | "accessory" | "hotel";
  series: string;
  model: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number | null;
  price_label: string | null;
  features: string[];
  power_system: string;
  ideal_for: string;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Lock, "id"> = {
  category: "lock",
  series: "",
  model: "",
  name: "",
  tagline: "",
  description: "",
  price: 0,
  price_label: "",
  features: [],
  power_system: "",
  ideal_for: "",
  badge: "",
  is_active: true,
  sort_order: 0,
};

const AdminSmartLocks = () => {
  const [items, setItems] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Lock | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Lock, "id">>(empty);
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("smart_locks" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Could not load smart locks");
    else setItems(((data as any) || []) as Lock[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 });
    setFeaturesText("");
    setOpen(true);
  };

  const startEdit = (p: Lock) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setFeaturesText((p.features || []).join("\n"));
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      features: featuresText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const { error } = editing
      ? await supabase.from("smart_locks" as any).update(payload).eq("id", editing.id)
      : await supabase.from("smart_locks" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    load();
  };

  const remove = async (p: Lock) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("smart_locks" as any).delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (p: Lock) => {
    const { error } = await supabase
      .from("smart_locks" as any)
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const fmt = (p: Lock) =>
    p.price_label?.trim() || (p.price ? `₦${Math.round(p.price).toLocaleString("en-NG")}` : "-");

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Smart Locks & Hotel</h2>
            <p className="text-sm text-muted-foreground">
              Manage STAMA smart locks, accessories and the hotel ecosystem displayed on the Packages page.
            </p>
          </div>
          <Button onClick={startNew} className="gap-2"><Plus size={16} /> New Item</Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Lock className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="text-muted-foreground mb-4">No items yet.</p>
            <Button onClick={startNew} className="gap-2"><Plus size={16} /> Create first item</Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  p.is_active ? "border-border" : "border-dashed border-border opacity-70"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                    {p.model && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-foreground px-2 py-0.5 rounded-full">
                        {p.model}
                      </span>
                    )}
                    <h3 className="font-display font-bold text-foreground truncate">{p.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{p.series}</span>
                    <span className="text-foreground font-semibold">{fmt(p)}</span>
                    <span>{p.features.length} features</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1.5">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p)} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Item" : "New Item"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v: "lock" | "accessory" | "hotel") => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lock">Smart Lock</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="hotel">Hotel Ecosystem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Series</Label>
                  <Input value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} placeholder="Elite Series A" />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="K209" />
                </div>
              </div>

              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="STAMA Elite K209" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tagline</Label>
                  <Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Premium intelligent access" />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Flagship | Popular | Best Value" />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    value={form.price ?? ""}
                    onChange={(e) => setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price label override</Label>
                  <Input
                    value={form.price_label ?? ""}
                    onChange={(e) => setForm({ ...form, price_label: e.target.value })}
                    placeholder="e.g. Quote on request"
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Features (one per line)</Label>
                <Textarea
                  rows={6}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={"Facial Recognition Entry\nFingerprint (up to 100 users)\nWi-Fi Mobile App Control"}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Power System</Label>
                  <Input value={form.power_system} onChange={(e) => setForm({ ...form, power_system: e.target.value })} placeholder="7.4V Lithium Battery" />
                </div>
                <div>
                  <Label>Ideal For</Label>
                  <Input value={form.ideal_for} onChange={(e) => setForm({ ...form, ideal_for: e.target.value })} placeholder="Modern homes, hotels" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="cursor-pointer" onClick={() => setForm({ ...form, is_active: !form.is_active })}>
                  Visible on public Packages page
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

export default AdminSmartLocks;
