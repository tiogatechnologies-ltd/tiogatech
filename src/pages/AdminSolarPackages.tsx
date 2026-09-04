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
import { Pencil, Trash2, Plus, Sun } from "lucide-react";

type Pkg = {
  id: string;
  package_number: number;
  battery_type: "lithium" | "tubular";
  inverter: string;
  inverter_price: number | null;
  solar_panels: string;
  solar_panels_price: number | null;
  battery: string;
  battery_price: number | null;
  charge_controller: string;
  charge_controller_price: number | null;
  accessories_price: number | null;
  setup_fee: number | null;
  total_price: number;
  appliances: string;
  tagline: string | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Pkg, "id"> = {
  package_number: 1,
  battery_type: "lithium",
  inverter: "",
  inverter_price: 0,
  solar_panels: "",
  solar_panels_price: 0,
  battery: "",
  battery_price: 0,
  charge_controller: "NIL",
  charge_controller_price: 0,
  accessories_price: 0,
  setup_fee: 0,
  total_price: 0,
  appliances: "",
  tagline: "",
  badge: "",
  is_active: true,
  sort_order: 0,
};

const fmt = (n: number | null) =>
  n == null ? "-" : `₦${Math.round(n).toLocaleString("en-NG")}`;

const AdminSolarPackages = () => {
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Pkg, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("solar_packages" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Could not load packages");
    else setItems(((data as any) || []) as Pkg[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm({
      ...empty,
      sort_order: (items.at(-1)?.sort_order ?? 0) + 1,
      package_number: (items.at(-1)?.package_number ?? 0) + 1,
    });
    setOpen(true);
  };

  const startEdit = (p: Pkg) => {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setOpen(true);
  };

  const save = async () => {
    if (!form.inverter.trim() || !form.total_price) {
      toast.error("Inverter and total price are required");
      return;
    }
    setSaving(true);
    const { error } = editing
      ? await supabase.from("solar_packages" as any).update(form).eq("id", editing.id)
      : await supabase.from("solar_packages" as any).insert(form);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Package updated" : "Package created");
    setOpen(false);
    load();
  };

  const remove = async (p: Pkg) => {
    if (!confirm(`Delete package #${p.package_number} - ${p.inverter}?`)) return;
    const { error } = await supabase.from("solar_packages" as any).delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (p: Pkg) => {
    const { error } = await supabase
      .from("solar_packages" as any)
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const num = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Solar Packages</h2>
            <p className="text-sm text-muted-foreground">
              Manage the pre-engineered solar inverter packages displayed on the Packages page.
            </p>
          </div>
          <Button onClick={startNew} className="gap-2">
            <Plus size={16} /> New Package
          </Button>
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Sun className="text-muted-foreground mx-auto mb-3" size={28} />
            <p className="text-muted-foreground mb-4">No packages yet.</p>
            <Button onClick={startNew} className="gap-2">
              <Plus size={16} /> Create first package
            </Button>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/20 text-gold-foreground px-2 py-0.5 rounded-full">
                      #{p.package_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        p.battery_type === "lithium"
                          ? "bg-primary/15 text-primary"
                          : "bg-accent/15 text-accent-foreground"
                      }`}
                    >
                      {p.battery_type}
                    </span>
                    <h3 className="font-display font-bold text-foreground truncate">{p.inverter}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Panels: {p.solar_panels}</span>
                    <span>Battery: {p.battery}</span>
                    <span className="text-foreground font-semibold">Total: {fmt(p.total_price)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1.5">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(p)}
                    className="gap-1.5 text-destructive hover:text-destructive"
                  >
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
              <DialogTitle>{editing ? "Edit Package" : "New Package"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Package #</Label>
                  <Input
                    type="number"
                    value={form.package_number}
                    onChange={(e) => setForm({ ...form, package_number: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Battery Type</Label>
                  <Select
                    value={form.battery_type}
                    onValueChange={(v: "lithium" | "tubular") => setForm({ ...form, battery_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lithium">Lithium (LiFePO4)</SelectItem>
                      <SelectItem value="tubular">Tubular / Gel</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Inverter</Label>
                  <Input value={form.inverter} onChange={(e) => setForm({ ...form, inverter: e.target.value })} placeholder="Hybrid 5KVA 24V/48V…" />
                </div>
                <div>
                  <Label>Inverter Price (₦)</Label>
                  <Input type="number" value={form.inverter_price ?? ""} onChange={(e) => setForm({ ...form, inverter_price: num(e.target.value) })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Solar Panels</Label>
                  <Input value={form.solar_panels} onChange={(e) => setForm({ ...form, solar_panels: e.target.value })} placeholder="450W Panels x 12" />
                </div>
                <div>
                  <Label>Panels Price (₦)</Label>
                  <Input type="number" value={form.solar_panels_price ?? ""} onChange={(e) => setForm({ ...form, solar_panels_price: num(e.target.value) })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Battery</Label>
                  <Input value={form.battery} onChange={(e) => setForm({ ...form, battery: e.target.value })} placeholder="10kWh 24/48V x 1" />
                </div>
                <div>
                  <Label>Battery Price (₦)</Label>
                  <Input type="number" value={form.battery_price ?? ""} onChange={(e) => setForm({ ...form, battery_price: num(e.target.value) })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Charge Controller</Label>
                  <Input value={form.charge_controller} onChange={(e) => setForm({ ...form, charge_controller: e.target.value })} placeholder="60Amp MPPT or NIL" />
                </div>
                <div>
                  <Label>Controller Price (₦)</Label>
                  <Input type="number" value={form.charge_controller_price ?? ""} onChange={(e) => setForm({ ...form, charge_controller_price: num(e.target.value) })} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Accessories (₦)</Label>
                  <Input type="number" value={form.accessories_price ?? ""} onChange={(e) => setForm({ ...form, accessories_price: num(e.target.value) })} />
                </div>
                <div>
                  <Label>Setup Fee (₦)</Label>
                  <Input type="number" value={form.setup_fee ?? ""} onChange={(e) => setForm({ ...form, setup_fee: num(e.target.value) })} />
                </div>
                <div>
                  <Label>Total Price (₦)</Label>
                  <Input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) || 0 })} />
                </div>
              </div>

              <div>
                <Label>Appliances Powered</Label>
                <Textarea rows={2} value={form.appliances} onChange={(e) => setForm({ ...form, appliances: e.target.value })} placeholder="30 Bulbs, 6 Fans, 5 TVs…" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tagline</Label>
                  <Input value={form.tagline ?? ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="For mid-sized homes" />
                </div>
                <div>
                  <Label>Badge</Label>
                  <Input value={form.badge ?? ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Popular | Family | Premium" />
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

export default AdminSolarPackages;
