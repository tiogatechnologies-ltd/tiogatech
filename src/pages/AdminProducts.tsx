import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon, Search, Tag, Settings2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductGalleryManager from "@/components/admin/ProductGalleryManager";
import { resolveProductImage } from "@/lib/productImages";
import { PRODUCTS } from "@/data/products";
import { mergeProducts } from "@/lib/mergeProducts";
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
  /** Genuine previous price. Only set when the product really cost more before. */
  compare_at_price?: number | null;
  tier: string;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  tags: string[] | null;
  specifications: Record<string, string> | null;
}

// `compare_at_price` is not in the generated type map until the migration has
// been applied and types regenerated, so writes go through an untyped handle.
const productsTable = () => (supabase as any).from("products");

const tiers = ["premium", "mid", "affordable", "entry"];
const categories = ["solar", "smart_locks", "smarthome", "cctv", "Inverters", "Batteries", "Solar Panels", "Smart Locks", "Home Automation", "CCTV"];

const emptyProduct: Omit<Product, "id"> = {
  name: "", category: "solar", series: "", description: "", features: [],
  best_for: "", price: "", compare_at_price: null, tier: "entry", is_active: true, sort_order: 0,
  image_url: null, tags: [], specifications: {},
};

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbIds, setDbIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct);
  const [featuresText, setFeaturesText] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [supportsCompareAt, setSupportsCompareAt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Probe once for the compare-at column so the field is hidden (rather than
  // breaking every save) on installs where the migration has not been run.
  useEffect(() => {
    supabase
      .from("products")
      .select("compare_at_price")
      .limit(1)
      .then(({ error }) => setSupportsCompareAt(!error));
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error) {
        console.error("Failed to fetch products:", error);
      }
      const dbList = (data as Product[]) ?? [];
      const combined = mergeProducts(PRODUCTS as any[], dbList);
      setProducts(combined as Product[]);
      setDbIds(new Set(dbList.map((d) => d.id)));
    } catch (err) {
      console.error("Products fetch error:", err);
      setProducts(PRODUCTS as any[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setForm({ ...emptyProduct, tags: [], specifications: {} });
    setFeaturesText("");
    setImagePreview(null);
    setTagInput("");
    setSpecKey("");
    setSpecVal("");
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name, category: p.category, series: p.series, description: p.description,
      features: p.features || [], best_for: p.best_for, price: p.price, tier: p.tier,
      compare_at_price: p.compare_at_price ?? null,
      is_active: p.is_active, sort_order: p.sort_order, image_url: p.image_url,
      tags: p.tags || [], specifications: (p.specifications as Record<string, string>) || {},
    });
    setFeaturesText((p.features || []).join("\n"));
    setImagePreview(p.image_url);
    setTagInput("");
    setSpecKey("");
    setSpecVal("");
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
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setImagePreview(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const removeImage = () => { setForm((f) => ({ ...f, image_url: null })); setImagePreview(null); };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm((f) => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
    setTagInput("");
  };

  const removeTag = (idx: number) => {
    setForm((f) => ({ ...f, tags: (f.tags || []).filter((_, i) => i !== idx) }));
  };

  const addSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setForm((f) => ({ ...f, specifications: { ...(f.specifications || {}), [specKey.trim()]: specVal.trim() } }));
    setSpecKey("");
    setSpecVal("");
  };

  const removeSpec = (key: string) => {
    setForm((f) => {
      const specs = { ...(f.specifications || {}) };
      delete specs[key];
      return { ...f, specifications: specs };
    });
  };

  // Seed products ship hardcoded in src/data/products.ts to keep the catalog
  // populated before real inventory exists. They render in this table but
  // have no row in `products` - update/delete .eq("id", ...) calls against
  // them match zero rows and Supabase reports that as success, so every
  // edit/delete/toggle on a seed product used to silently do nothing while
  // still showing a success toast. Upserting on save "graduates" the seed
  // product into a real row (mergeProducts already prefers DB rows by id).
  const isSeedOnly = (id: string) => !dbIds.has(id);

  const handleSave = async () => {
    const payload: Record<string, any> = {
      ...form,
      features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      series: form.series?.trim() || null,
      price: form.price?.trim() || null,
      tags: form.tags || [],
      specifications: form.specifications || {},
    };
    // `compare_at_price` is a newer column. PostgREST rejects an entire
    // statement that names a column the table does not have, so omit it until
    // the migration has been applied rather than failing every save.
    if (!supportsCompareAt) delete payload.compare_at_price;
    if (editing) {
      const { error } = isSeedOnly(editing.id)
        ? await productsTable().upsert({ ...payload, id: editing.id })
        : await productsTable().update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await productsTable().insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Product created");
    }
    closeForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (isSeedOnly(id)) {
      toast.error("This is a seed product, not saved to the catalog yet", { description: "Edit and save it first, then you can delete it." });
      return;
    }
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete product", { description: error.message });
      return;
    }
    toast.success("Product deleted");
    fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    const { error } = isSeedOnly(p.id)
      ? await productsTable().upsert({ ...p, is_active: !p.is_active })
      : await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) {
      toast.error("Failed to update product", { description: error.message });
      return;
    }
    fetchProducts();
  };

  const handleDuplicate = (p: Product) => {
    setForm({
      name: `${p.name} (Copy)`, category: p.category, series: p.series, description: p.description,
      features: p.features || [], best_for: p.best_for, price: p.price, tier: p.tier,
      compare_at_price: p.compare_at_price ?? null,
      is_active: false, sort_order: p.sort_order + 1, image_url: p.image_url,
      tags: p.tags || [], specifications: (p.specifications as Record<string, string>) || {},
    });
    setFeaturesText((p.features || []).join("\n"));
    setImagePreview(p.image_url);
    setCreating(true);
    setEditing(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkToggleActive = async (active: boolean) => {
    const total = selectedIds.size;
    let failed = 0;
    for (const id of selectedIds) {
      const p = products.find((x) => x.id === id);
      const { error } = isSeedOnly(id) && p
        ? await productsTable().upsert({ ...p, is_active: active })
        : await supabase.from("products").update({ is_active: active }).eq("id", id);
      if (error) failed++;
    }
    setSelectedIds(new Set());
    fetchProducts();
    if (failed > 0) {
      toast.error(`${failed} of ${total} products failed to update`);
    } else {
      toast.success(`${total} products ${active ? "activated" : "deactivated"}`);
    }
  };

  const bulkDelete = async () => {
    const deletable = [...selectedIds].filter((id) => !isSeedOnly(id));
    const skipped = selectedIds.size - deletable.length;
    if (deletable.length === 0) {
      toast.error("All selected products are seed products - save them first, then delete.");
      return;
    }
    if (!confirm(`Delete ${deletable.length} product(s)?${skipped ? ` (${skipped} seed product(s) will be skipped)` : ""}`)) return;
    let failed = 0;
    for (const id of deletable) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) failed++;
    }
    setSelectedIds(new Set());
    fetchProducts();
    if (failed > 0) {
      toast.error(`${failed} of ${deletable.length} products failed to delete`);
    } else {
      toast.success(skipped ? `${deletable.length} products deleted, ${skipped} seed product(s) skipped` : "Products deleted");
    }
  };

  const filtered = products
    .filter((p) => !filter || p.category.toLowerCase().includes(filter.toLowerCase()))
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
  const isFormOpen = editing || creating;

  return (
    <AdminLayout>
      <div className="space-y-4">
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
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="w-full sm:w-72 rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {selectedIds.size > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                <button onClick={() => bulkToggleActive(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">Activate</button>
                <button onClick={() => bulkToggleActive(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80">Deactivate</button>
                <button onClick={bulkDelete} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20">Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 w-8">
                    <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filtered.length} onChange={() => {
                      if (selectedIds.size === filtered.length) setSelectedIds(new Set());
                      else setSelectedIds(new Set(filtered.map((p) => p.id)));
                    }} className="rounded" />
                  </th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-xs text-muted-foreground animate-pulse">Loading products...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">No products found.</td></tr>
                ) : filtered.map((p) => {
                  const resolvedImg = resolveProductImage(p.image_url, p.category, p.name);

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {resolvedImg ? (
                            <img src={resolvedImg} alt="" className="h-10 w-10 rounded-lg object-contain bg-muted p-0.5 shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0"><ImageIcon size={16} /></div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-foreground truncate">{p.name}</p>
                              {isSeedOnly(p.id) && (
                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700" title="Not saved to the catalog yet - edit and save to make it a real product">Seed</span>
                              )}
                            </div>
                            {p.series && <p className="text-xs text-muted-foreground truncate">{p.series}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground capitalize">{p.category.replace("_", " ")}</td>
                      <td className="p-3 font-medium text-foreground">{p.price ?? "-"}</td>
                      <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">{p.tier}</span></td>
                      <td className="p-3">
                        <button onClick={() => toggleActive(p)} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {p.is_active ? "Active" : "Draft"}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleDuplicate(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Duplicate"><Plus size={14} /></button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all" title="Edit"><Pencil size={14} /></button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={isSeedOnly(p.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                            title={isSeedOnly(p.id) ? "Seed product - save it first, then you can delete it" : "Delete"}
                          ><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal / Drawer for editing */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4 my-8">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-display text-lg font-bold text-foreground">{editing ? "Edit Product" : "Add Product"}</h3>
                <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {/* Image upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground">Product Image (PNG Cutout Recommended)</label>
                    <span className="text-[10px] text-muted-foreground">Transparent PNG / WebP</span>
                  </div>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden bg-muted/30 border border-border h-36 flex items-center justify-center p-3">
                      <img src={resolveProductImage(imagePreview, form.category, form.name)} alt="" className="max-h-full max-w-full object-contain drop-shadow-sm" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg bg-card/90 hover:bg-card shadow-sm text-foreground"><Upload size={14} /></button>
                        <button type="button" onClick={removeImage} className="p-1.5 rounded-lg bg-card/90 hover:bg-card shadow-sm text-destructive"><X size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all">
                      {uploading ? <span className="text-sm animate-pulse">Uploading...</span> : <><Upload size={20} /><span className="text-xs">Click to upload PNG product cutout (max 5MB)</span></>}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/png,image/webp,image/jpeg,image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="mt-2">
                    <input
                      type="text"
                      className="w-full rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                      placeholder="Or enter direct PNG/WebP image URL..."
                      value={form.image_url ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setForm({ ...form, image_url: val || null });
                        setImagePreview(val || null);
                      }}
                    />
                  </div>
                </div>

                {editing && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <ProductGalleryManager productId={editing.id} />
                  </div>
                )}

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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
                    <input className={inputClass} value={form.series ?? ""} onChange={(e) => setForm({ ...form, series: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Price</label>
                    <input className={inputClass} value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. ₦250,000" />
                  </div>
                </div>

                {supportsCompareAt && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Previous price (optional)
                    </label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.compare_at_price ?? ""}
                      onChange={(e) => setForm({ ...form, compare_at_price: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Leave blank if the price has not been reduced"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Shown struck through next to the current price, with the real saving. Only enter a price this product
                      genuinely sold at — leave blank and no discount is advertised.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea className={`${inputClass} min-h-[70px] resize-none`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Best For</label>
                  <input className={inputClass} value={form.best_for} onChange={(e) => setForm({ ...form, best_for: e.target.value })} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Features (one per line)</label>
                  <textarea className={`${inputClass} min-h-[80px] resize-none`} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Feature 1&#10;Feature 2" />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5"><Tag size={12} /> Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input className={inputClass} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Type tag and press Enter" />
                    <button onClick={addTag} className="px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(form.tags || []).map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent">
                        {t}
                        <button onClick={() => removeTag(i)} className="text-accent/60 hover:text-destructive"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1.5"><Settings2 size={12} /> Specifications</label>
                  <div className="flex gap-2 mb-2">
                    <input className={`${inputClass} flex-1`} value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Key (e.g. Wattage)" />
                    <input className={`${inputClass} flex-1`} value={specVal} onChange={(e) => setSpecVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())} placeholder="Value (e.g. 5kW)" />
                    <button onClick={addSpec} className="px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0"><Plus size={16} /></button>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(form.specifications || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <span><span className="font-medium text-foreground">{k}:</span> <span className="text-muted-foreground">{v}</span></span>
                        <button onClick={() => removeSpec(k)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>
                      </div>
                    ))}
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
                <button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
