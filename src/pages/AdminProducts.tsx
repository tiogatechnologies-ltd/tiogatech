import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Check, Upload, Image as ImageIcon, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  series: string | null;
  description: string;
  features: string[];
  best_for: string;
  price: string | null;
  tier: string;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
}

const tiers = ["premium", "mid", "affordable", "entry"];
const categories = ["solar", "smart_locks", "smarthome", "cctv"];

const emptyProduct: Omit<Product, "id"> = {
  name: "", category: "solar", series: "", description: "", features: [],
  best_for: "", price: "", tier: "entry", is_active: true, sort_order: 0, image_url: null,
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [featuresText, setFeaturesText] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setForm({ ...emptyProduct });
    setFeaturesText("");
    setImagePreview(null);
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, category: p.category, series: p.series, description: p.description,
      features: p.features, best_for: p.best_for, price: p.price, tier: p.tier,
      is_active: p.is_active, sort_order: p.sort_order, image_url: p.image_url,
    });
    setFeaturesText(p.features.join("\n"));
    setImagePreview(p.image_url);
    setEditing(p);
    setCreating(false);
  };

  const closeForm = () => { setEditing(null); setCreating(false); setImagePreview(null); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    const url = urlData.publicUrl;
    setForm((f) => ({ ...f, image_url: url }));
    setImagePreview(url);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image_url: null }));
    setImagePreview(null);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      series: form.series?.trim() || null,
      price: form.price?.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Product created");
    }
    closeForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Product deleted");
    fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchProducts();
  };

  const handleDuplicate = (p: Product) => {
    setForm({
      name: `${p.name} (Copy)`, category: p.category, series: p.series, description: p.description,
      features: p.features, best_for: p.best_for, price: p.price, tier: p.tier,
      is_active: false, sort_order: p.sort_order + 1, image_url: p.image_url,
    });
    setFeaturesText(p.features.join("\n"));
    setImagePreview(p.image_url);
    setCreating(true);
    setEditing(null);
  };

  const filtered = products
    .filter((p) => !filter || p.category === filter)
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
  const isFormOpen = editing || creating;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>All</button>
              {categories.map((c) => (
                <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {c.replace("_", " ")}
                </button>
              ))}
            </div>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full sm:w-72 rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading products...</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Image</th>
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Series</th>
                    <th className="text-left px-4 py-3 font-medium">Tier</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Price</th>
                    <th className="text-left px-4 py-3 font-medium">Active</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon size={14} className="text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-card-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">{p.category.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.series ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{p.tier}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.price ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p)} className={`w-8 h-5 rounded-full transition-all ${p.is_active ? "bg-primary" : "bg-muted"}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-primary-foreground transition-all ${p.is_active ? "translate-x-3.5" : "translate-x-0.5"}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil size={14} /></button>
                          <button onClick={() => handleDuplicate(p)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Duplicate"><Plus size={14} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-display font-bold text-card-foreground text-lg">{editing ? "Edit Product" : "Add Product"}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-muted"><X size={18} className="text-muted-foreground" /></button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Product Image</label>
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-muted">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg bg-card/90 hover:bg-card shadow-sm text-foreground"><Upload size={14} /></button>
                      <button onClick={removeImage} className="p-1.5 rounded-lg bg-card/90 hover:bg-card shadow-sm text-destructive"><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {uploading ? (
                      <span className="text-sm animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-xs">Click to upload (max 5MB)</span>
                      </>
                    )}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                  <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categories.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tier</label>
                  <select className={inputClass} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
                    {tiers.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
                <input className={inputClass} value={form.series ?? ""} onChange={(e) => setForm({ ...form, series: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea className={`${inputClass} min-h-[70px] resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Features (one per line)</label>
                <textarea className={`${inputClass} min-h-[80px] resize-none`} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Feature 1&#10;Feature 2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Best For</label>
                  <input className={inputClass} value={form.best_for} onChange={(e) => setForm({ ...form, best_for: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Price</label>
                  <input className={inputClass} value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. ₦250,000 (add later)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
                  <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={closeForm} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">
                <Check size={16} /> {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
