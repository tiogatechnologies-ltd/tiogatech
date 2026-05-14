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
import { Pencil, Trash2, Plus, Home } from "lucide-react";

type Pkg = {
  id: string;
  tier: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  entertainment: string[];
  price: number | null;
  price_label: string | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Pkg, "id"> = {
  tier: "",
  name: "",
  tagline: "",
  description: "",
  features: [],
  entertainment: [],
  price: null,
  price_label: "",
  badge: "",
  is_active: true,
  sort_order: 0,
};

const AdminHomeAutomation = () => {
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Pkg, "id">>(empty);
  const [featuresText, setFeaturesText] = useState("");
  const [entertainmentText, setEntertainmentText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("home_automation_packages" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Could not load packages");
    else setItems(((data as any) || []) as Pkg[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 });
    setFeaturesText("");
    setEntertainmentText("");
    setOpen(true);
  };

  const startEdit = (p: Pkg) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setFeaturesText(p.features.join("\n"));
    setEntertainmentText(p.entertainment.join("\n"));
    setOpen(true);
  };

  const save = async () => {
    if (!form.tier.trim() || !form.name.trim()) {
      toast.error("Tier and name are required");
      return;
    }
    const payload = {
      ...form,
      features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      entertainment: entertainmentText.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("home_automation_packages" as any).update(payload).eq("id", editing.id)
      : await supabase.from("home_automation_packages" as any).insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Package updated" : "Package created");
    setOpen(false);
    load();
  };

  const remove = async (p: Pkg) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("home_automation_packages" as any).delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (p: Pkg) => {
    const { error } = await supabase
      .from("home_automation_packages" as any)
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Home Automation Packages</h2>
            <p className="text-sm text-muted-foreground">
              Manage Ascentia, Sprout, Ibiza and other smart home tiers shown on the Packages page.
            </p>
          </div>
          <Button onClick={startNew} className="gap-2"><Plus size={16} /> New Package</Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Home className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="text-muted-foreground mb-4">No packages yet.</p>
            <Button onClick={startNew} className="gap-2"><Plus size={16} /> Create first package</Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => (
              <div key={p.id} className={`rounded-2xl border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${p.is_active ? "border-border" : "border-dashed border-border opacity-70"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded-full">{p.tier}</span>
                    {p.badge && <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold-foreground px-2 py-0.5 rounded-full">{p.badge}</span>}
                    <h3 className="font-display font-bold text-foreground truncate">{p.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{p.tagline}</span>
                    <span className="text-foreground font-semibold">{p.price_label ?? (p.price ? `₦${p.price.toLocaleString("en-NG")}` : "—")}</span>
                    <span>{p.features.length} features</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1.5"><Pencil size={14} /> Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p)} className="gap-1.5 text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Tier (key)</Label>
                  <Input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="Ascentia | Sprout | Ibiza" />
                </div>
                <div>
                  <Label>Display Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tagline</Label>
                  <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Essential Areas" />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Most Popular" />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Price (₦, numeric)</Label>
                  <Input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Price Label (display)</Label>
                  <Input value={form.price_label ?? ""} onChange={(e) => setForm({ ...form, price_label: e.target.value })} placeholder="From ₦4.9M" />
                </div>
              </div>

              <div>
                <Label>Features (one per line)</Label>
                <Textarea rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Smart Cameras&#10;Video Doorbell&#10;Smart Lock" />
              </div>

              <div>
                <Label>Entertainment (one per line)</Label>
                <Textarea rows={3} value={entertainmentText} onChange={(e) => setEntertainmentText(e.target.value)} placeholder="Amazon Echo Pop&#10;Acoustic Ceiling Speakers" />
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

export default AdminHomeAutomation;
