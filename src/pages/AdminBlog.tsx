import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, Eye, EyeOff, Save, X, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MarkdownToolbar from "@/components/MarkdownToolbar";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author: string;
  tags: string[];
  category: string;
  published: boolean;
  published_at: string | null;
  scheduled_for: string | null;
  seo_title: string | null;
  seo_description: string | null;
  read_minutes: number;
}

const wordsPerMinute = 220;
const calcReadMinutes = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
};

const blank = (): Partial<BlogPost> => ({
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  author: "Tioga Team",
  tags: [],
  category: "general",
  published: false,
  read_minutes: 5,
  seo_title: "",
  seo_description: "",
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title || !editing.slug) return toast.error("Title and slug are required");

    const autoMinutes = calcReadMinutes(editing.content || "");
    const payload: any = {
      ...editing,
      tags: editing.tags ?? [],
      slug: slugify(editing.slug),
      read_minutes: editing.read_minutes && editing.read_minutes > 0 ? editing.read_minutes : autoMinutes,
      published_at:
        editing.published && !editing.published_at
          ? (editing.scheduled_for ?? new Date().toISOString())
          : editing.published_at,
    };

    const { error } = editing.id
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);

    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const togglePublish = async (p: BlogPost) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({
        published: !p.published,
        published_at: !p.published && !p.published_at ? new Date().toISOString() : p.published_at,
      })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const uploadCover = async (file: File) => {
    if (!file) return;
    const path = `blog/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return toast.error("Upload failed: " + error.message);
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing((e) => ({ ...e!, cover_image_url: data.publicUrl }));
    toast.success("Cover uploaded");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              <FileText size={22} className="text-primary" /> Blog Posts
            </h2>
            <p className="text-sm text-muted-foreground">Write and publish articles for SEO and customer engagement.</p>
          </div>
          <button
            onClick={() => setEditing(blank())}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
          >
            <Plus size={14} /> New Post
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Slug</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Published</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">/{p.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => togglePublish(p)} className="text-xs text-foreground hover:text-primary">
                        {p.published ? <EyeOff size={14} className="inline" /> : <Eye size={14} className="inline" />}
                      </button>
                      <button onClick={() => setEditing(p)} className="text-xs text-primary hover:underline">
                        <Edit size={14} className="inline" />
                      </button>
                      <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:text-red-600">
                        <Trash2 size={14} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No posts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
          <div className="w-full max-w-4xl bg-background rounded-2xl border border-border my-8">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10 rounded-t-2xl">
              <h3 className="font-display text-lg font-bold">{editing.id ? "Edit Post" : "New Post"}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreview((v) => !v)} className="text-sm text-foreground hover:text-primary">
                  {showPreview ? "Edit" : "Preview"}
                </button>
                <button onClick={save} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold">
                  <Save size={14} /> Save
                </button>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-muted"><X size={16} /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {showPreview ? (
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h1>{editing.title}</h1>
                  <p className="lead">{editing.excerpt}</p>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{editing.content || ""}</ReactMarkdown>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Title</label>
                    <input
                      value={editing.title || ""}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Slug</label>
                      <input
                        value={editing.slug || ""}
                        onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Author</label>
                      <input
                        value={editing.author || ""}
                        onChange={(e) => setEditing({ ...editing, author: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Excerpt (shown on listings & SEO)</label>
                    <textarea
                      rows={2}
                      value={editing.excerpt || ""}
                      onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Cover Image URL</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={editing.cover_image_url || ""}
                        onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                      <label className="px-3 py-2 rounded-lg border border-border bg-card text-xs cursor-pointer hover:bg-muted">
                        Upload
                        <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                      </label>
                    </div>
                    {editing.cover_image_url && (
                      <img src={editing.cover_image_url} alt="cover preview" className="mt-2 max-h-40 rounded-lg border border-border"  loading="lazy" decoding="async" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                      <input
                        value={editing.category || ""}
                        onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase" title="Auto-calculated from content if left at 0">
                        Read min
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editing.read_minutes ?? 0}
                        onChange={(e) => setEditing({ ...editing, read_minutes: parseInt(e.target.value) || 0 })}
                        placeholder={`auto (${calcReadMinutes(editing.content || "")})`}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Schedule for</label>
                      <input
                        type="datetime-local"
                        value={editing.scheduled_for ? new Date(editing.scheduled_for).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setEditing({ ...editing, scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!editing.published}
                          onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                        />
                        Published
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tagInput.trim()) {
                            e.preventDefault();
                            setEditing({ ...editing, tags: [...(editing.tags ?? []), tagInput.trim()] });
                            setTagInput("");
                          }
                        }}
                        placeholder="Add a tag and press Enter"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(editing.tags ?? []).map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          {t}
                          <button onClick={() => setEditing({ ...editing, tags: editing.tags!.filter((_, j) => j !== i) })}>
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Content</label>
                    <div className="mt-1">
                      <MarkdownToolbar
                        value={editing.content || ""}
                        onChange={(v) => setEditing({ ...editing, content: v })}
                        rows={20}
                        placeholder="Write your post. Use the toolbar for headings, bold, links, lists, images…"
                        onImageUpload={async () => {
                          return new Promise((resolve) => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = async () => {
                              const file = input.files?.[0];
                              if (!file) return resolve(null);
                              const path = `blog/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
                              const { error } = await supabase.storage.from("product-images").upload(path, file);
                              if (error) { toast.error("Upload failed"); return resolve(null); }
                              const { data } = supabase.storage.from("product-images").getPublicUrl(path);
                              resolve(data.publicUrl);
                            };
                            input.click();
                          });
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">Tip: leave a blank line between paragraphs for proper spacing.</p>
                  </div>

                  <details className="rounded-lg border border-border p-3">
                    <summary className="cursor-pointer text-xs font-semibold uppercase text-muted-foreground">SEO Overrides (optional)</summary>
                    <div className="mt-3 space-y-2">
                      <input
                        value={editing.seo_title || ""}
                        onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })}
                        placeholder="SEO Title (defaults to post title)"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                      <textarea
                        rows={2}
                        value={editing.seo_description || ""}
                        onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })}
                        placeholder="SEO Description (defaults to excerpt)"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs"
                      />
                    </div>
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBlog;
