import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Image as ImageIcon, Upload, Trash2, Copy, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface FileRow { name: string; id: string | null; updated_at: string | null; created_at: string | null; metadata: { size?: number; mimetype?: string } | null; }

const BUCKET = "product-images";

const AdminStorage = () => {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast.error(error.message);
    setFiles((data || []).filter((f) => f.name !== ".emptyFolderPlaceholder") as FileRow[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Uploaded");
    if (fileInput.current) fileInput.current.value = "";
    void load();
  };

  const remove = async (name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); void load();
  };

  const publicUrl = (name: string) => supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  const copy = (name: string) => { navigator.clipboard.writeText(publicUrl(name)); toast.success("URL copied"); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><FolderOpen size={22} />Media library</h1>
            <p className="text-sm text-muted-foreground">Browse, upload, and remove files in the <code className="px-1 py-0.5 rounded bg-muted text-xs">{BUCKET}</code> bucket.</p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload image
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : files.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground text-sm">
            <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
            No files yet. Upload your first image.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((f) => (
              <div key={f.name} className="rounded-xl border border-border bg-card overflow-hidden group">
                <div className="aspect-square bg-muted/40 overflow-hidden">
                  <img src={publicUrl(f.name)} alt={f.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-2 text-[11px] space-y-1">
                  <p className="truncate font-medium" title={f.name}>{f.name}</p>
                  <p className="text-muted-foreground">{f.metadata?.size ? `${Math.round(f.metadata.size / 1024)} KB` : ""}</p>
                  <div className="flex gap-1 pt-1">
                    <button onClick={() => copy(f.name)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/70 text-xs"><Copy size={11} />URL</button>
                    <button onClick={() => remove(f.name)} className="px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStorage;
