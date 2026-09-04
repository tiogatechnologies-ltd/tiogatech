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
import { Pencil, Trash2, Plus, Camera, Loader2, AlertCircle } from "lucide-react";

type CctvPackage = {
  id: string;
  name: string;
  brand: string;
  tagline: string | null;
  badge: string | null;
  price: number | null;
  channels: number;
  specs: string[];
  features: string[];
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<CctvPackage, "id"> = {
  name: "",
  brand: "Hikvision / Dahua Tier-1",
  tagline: "",
  badge: "",
  price: null,
  channels: 4,
  specs: [],
  features: [],
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const fmt = (n: number | null) =>
  n == null ? "—" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const AdminCCTV = () => {
  const [items, setItems] = useState<CctvPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CctvPackage | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<CctvPackage, "id">>(empty);
  const [specsText, setSpecsText] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cctv_packages" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Could not load CCTV packages: " + error.message);
    else setItems(((data as any) || []) as CctvPackage[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 });
    setSpecsText("");
    setFeaturesText("");
    setOpen(true);
  };

  const startEdit = (pkg: CctvPackage) => {
    setEditing(pkg);
    const { id: _id, ...rest } = pkg;
    setForm(rest);
    setSpecsText((pkg.specs || []).join("\n"));
    setFeaturesText((pkg.features || []).join("\n"));
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Package name is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      specs: specsText.split("\n").map((s) => s.trim()).filter(Boolean),
      features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = editing
      ? await supabase.from("cctv_packages" as any).update(payload).eq("id", editing.id)
      : await supabase.from("cctv_packages" as any).insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Package updated" : "Package created");
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("cctv_packages" as any).delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Package deleted");
    setDeleteId(null);
    load();
  };

  const toggleActive = async (pkg: CctvPackage) => {
    const { error } = await supabase
      .from("cctv_packages" as any)
      .update({ is_active: !pkg.is_active })
      .eq("id", pkg.id);
    if (error) toast.error(error.message);
    else setItems((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !p.is_active } : p)));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Camera size={22} /></div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">CCTV & Surveillance Packages</h1>
              <p className="text-xs text-muted-foreground">{items.length} packages · Edits update the /cctv page in real time</p>
            </div>
          </div>
          <Button onClick={startNew} className="gap-2 rounded-xl font-bold text-sm">
            <Plus size={16} /> New Package
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No CCTV packages found.</p>
            <p className="text-xs mt-1">Run the SQL migration in Supabase to create the cctv_packages table.</p>
            <Button onClick={startNew} variant="outline" className="mt-4 rounded-xl gap-1.5 text-xs">
              <Plus size={13} /> Add First Package
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((pkg) => (
              <div key={pkg.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-foreground text-sm">{pkg.name}</span>
                    {pkg.badge && <span className="text-[10px] uppercase font-bold bg-gold/20 text-gold-dark dark:text-gold px-2 py-0.5 rounded-full">{pkg.badge}</span>}
                    {!pkg.is_active && <span className="text-[10px] uppercase font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{pkg.brand} · {pkg.channels > 0 ? `${pkg.channels}-Channel` : "Standalone"} · {fmt(pkg.price)}</p>
                  {pkg.tagline && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pkg.tagline}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{pkg.is_active ? "Live" : "Hidden"}</span>
                    <Switch checked={pkg.is_active} onCheckedChange={() => toggleActive(pkg)} />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(pkg)} className="rounded-xl gap-1.5 text-xs">
                    <Pencil size={13} /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(pkg.id)} className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs gap-1">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg">{editing ? "Edit CCTV Package" : "Add New CCTV Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Package Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="4-Channel Smart AI CCTV Kit" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Brand / Supplier</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Badge (optional)</Label>
                <Input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Most Popular…" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Price (₦)</Label>
                <Input type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })} placeholder="480000" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Channels (0 = standalone)</Label>
                <Input type="number" value={form.channels} onChange={(e) => setForm({ ...form, channels: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Tagline</Label>
                <Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Ideal for 3-4 bedroom homes…" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL (optional)</Label>
                <Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Specs (one per line) *</Label>
                <Textarea value={specsText} onChange={(e) => setSpecsText(e.target.value)} placeholder={"4x 5MP ColorVu Cameras\n1TB NVR Storage\nAI Motion Filtering"} rows={6} className="rounded-xl text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Feature Highlights (one per line, optional)</Label>
                <Textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder={"Remote Phone Streaming\nNight Vision 40m"} rows={4} className="rounded-xl text-xs" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Visible on CCTV page</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl gap-2 font-bold">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editing ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-card border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-base">Delete Package?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This package will be permanently deleted and removed from the CCTV page.</p>
          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} className="rounded-xl font-bold">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCCTV;
