import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Image as ImageIcon, Upload, Trash2, Copy, Loader2, FolderOpen, Search, Download, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface FileRow {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
}

type BucketDef = { id: string; label: string; public: boolean; adminOnly: boolean; accept: string };

const BUCKETS: BucketDef[] = [
  { id: "product-images", label: "Product images", public: true, adminOnly: false, accept: "image/*" },
  { id: "career-cvs", label: "Career CVs", public: false, adminOnly: true, accept: ".pdf,.doc,.docx" },
  { id: "finance-docs", label: "Finance documents", public: false, adminOnly: true, accept: ".pdf,.jpg,.jpeg,.png" },
];

const prettySize = (bytes?: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminStorage = () => {
  const { isAdmin } = useAuth();
  const available = useMemo(() => BUCKETS.filter((b) => isAdmin || !b.adminOnly), [isAdmin]);

  const [bucket, setBucket] = useState<BucketDef>(available[0]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "largest" | "name">("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!available.some((b) => b.id === bucket.id)) setBucket(available[0]);
  }, [available, bucket.id]);

  const load = async () => {
    setLoading(true);
    setSelected([]);
    const { data, error } = await supabase.storage
      .from(bucket.id)
      .list("", { limit: 500, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast.error(error.message);
    setFiles(((data || []) as FileRow[]).filter((f) => f.name !== ".emptyFolderPlaceholder"));
    setLoading(false);
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [bucket.id]);

  const uploadFiles = async (list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of arr) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from(bucket.id).upload(path, file, { contentType: file.type, upsert: false });
      if (error) toast.error(`${file.name}: ${error.message}`);
      else ok++;
    }
    setUploading(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`);
    if (fileInput.current) fileInput.current.value = "";
    void load();
  };

  const removeMany = async (names: string[]) => {
    if (!names.length) return;
    if (!confirm(`Delete ${names.length} file${names.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const { error } = await supabase.storage.from(bucket.id).remove(names);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    void load();
  };

  const publicUrl = (name: string) => supabase.storage.from(bucket.id).getPublicUrl(name).data.publicUrl;

  const openFile = async (name: string) => {
    if (bucket.public) return setPreview({ name, url: publicUrl(name) });
    const { data, error } = await supabase.storage.from(bucket.id).createSignedUrl(name, 300);
    if (error || !data) return toast.error(error?.message || "Could not create link");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const copyUrl = async (name: string, markdown = false) => {
    let url = publicUrl(name);
    if (!bucket.public) {
      const { data, error } = await supabase.storage.from(bucket.id).createSignedUrl(name, 3600);
      if (error || !data) return toast.error(error?.message || "Could not create link");
      url = data.signedUrl;
    }
    await navigator.clipboard.writeText(markdown ? `![${name}](${url})` : url);
    toast.success(markdown ? "Markdown copied" : "URL copied");
  };

  const shown = useMemo(() => {
    let out = files.filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()));
    out = [...out].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "largest") return (b.metadata?.size || 0) - (a.metadata?.size || 0);
      const at = +new Date(a.created_at || 0), bt = +new Date(b.created_at || 0);
      return sort === "oldest" ? at - bt : bt - at;
    });
    return out;
  }, [files, q, sort]);

  const totalSize = files.reduce((s, f) => s + (f.metadata?.size || 0), 0);
  const allSelected = shown.length > 0 && selected.length === shown.length;
  const isImage = (f: FileRow) => (f.metadata?.mimetype || "").startsWith("image/") || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(f.name);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><FolderOpen size={22} />Media library</h1>
            <p className="text-sm text-muted-foreground">{files.length} files · {prettySize(totalSize)} in <code className="px-1 py-0.5 rounded bg-muted text-xs">{bucket.id}</code></p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
            <input ref={fileInput} type="file" multiple accept={bucket.accept} className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} disabled={uploading} />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {available.map((b) => (
            <button key={b.id} onClick={() => setBucket(b)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${bucket.id === b.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {b.label}{!b.public && <span className="ml-1.5 text-[10px] opacity-70">private</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file names…" className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="largest">Largest first</option>
            <option value="name">Name A–Z</option>
          </select>
          <button onClick={() => setSelected(allSelected ? [] : shown.map((f) => f.name))} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">
            {allSelected ? "Clear selection" : "Select all"}
          </button>
          {selected.length > 0 && (
            <button onClick={() => removeMany(selected)} className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 inline-flex items-center gap-1.5">
              <Trash2 size={14} />Delete {selected.length}
            </button>
          )}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files); }}
          className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : shown.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
              {q ? "No files match your search." : "No files yet - drag and drop here to upload."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {shown.map((f) => {
                const checked = selected.includes(f.name);
                return (
                  <div key={f.name} className={`rounded-xl border bg-card overflow-hidden relative ${checked ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelected((s) => (checked ? s.filter((n) => n !== f.name) : [...s, f.name]))}
                      className="absolute top-2 left-2 z-10 h-4 w-4 accent-primary"
                      aria-label={`Select ${f.name}`}
                    />
                    <button onClick={() => openFile(f.name)} className="block w-full aspect-square bg-muted/40 overflow-hidden">
                      {bucket.public && isImage(f) ? (
                        <img src={publicUrl(f.name)} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileText size={28} /></div>
                      )}
                    </button>
                    <div className="p-2 text-[11px] space-y-1">
                      <p className="truncate font-medium" title={f.name}>{f.name}</p>
                      <p className="text-muted-foreground">{prettySize(f.metadata?.size)} · {f.created_at ? new Date(f.created_at).toLocaleDateString() : "-"}</p>
                      <div className="flex gap-1 pt-1">
                        <button onClick={() => copyUrl(f.name)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/70 text-xs" title="Copy URL"><Copy size={11} />URL</button>
                        <button onClick={() => copyUrl(f.name, true)} className="px-2 py-1 rounded bg-muted hover:bg-muted/70 text-xs" title="Copy markdown">MD</button>
                        <button onClick={() => openFile(f.name)} className="px-2 py-1 rounded bg-muted hover:bg-muted/70" title="Open"><Download size={11} /></button>
                        <button onClick={() => removeMany([f.name])} className="px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-lg bg-background/10 text-background" onClick={() => setPreview(null)} aria-label="Close preview"><X size={20} /></button>
          <img src={preview.url} alt={preview.name} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStorage;
