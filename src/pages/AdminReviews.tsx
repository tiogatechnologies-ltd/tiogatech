import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Check, X, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Row = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  admin_reply: string | null;
  verified_purchase: boolean;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const AdminReviews = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: prods }] = await Promise.all([
      supabase.from("product_reviews" as any).select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("products").select("id,name").limit(1000),
    ]);
    if (error) toast.error(error.message);
    setRows(((data as any) || []) as Row[]);
    setProducts(Object.fromEntries(((prods as any) || []).map((p: any) => [p.id, p.name])));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const patch = async (id: string, values: Partial<Row>) => {
    const { error } = await supabase.from("product_reviews" as any).update(values).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...values } as Row : r)));
    toast.success("Review updated");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("product_reviews" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((p) => p.filter((r) => r.id !== id));
    toast.success("Review deleted");
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return [r.author_name, r.title, r.body, products[r.product_id]]
          .filter(Boolean)
          .some((s) => s!.toLowerCase().includes(q));
      }),
    [rows, statusFilter, query, products],
  );

  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Product Reviews</h1>
            <p className="text-sm text-muted-foreground">Approve, reply to, or remove customer reviews.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-2" />Refresh</Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <Card key={s} className="p-4">
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
              <p className="text-2xl font-bold">{counts[s] || 0}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, reviewer, text…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">No reviews match your filters.</Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={13} className={n <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/40"} />
                    ))}
                  </span>
                  <span className="font-semibold text-sm">{r.author_name}</span>
                  <Badge variant="outline" className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                  {r.verified_purchase && <Badge variant="outline" className="text-[10px]">Verified</Badge>}
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(r.created_at), "MMM d, yyyy")}</span>
                </div>
                <p className="text-xs text-muted-foreground">{products[r.product_id] || r.product_id}</p>
                {r.title && <p className="font-medium text-sm">{r.title}</p>}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>

                <Textarea
                  rows={2}
                  placeholder="Public reply (optional)"
                  value={replyDraft[r.id] ?? r.admin_reply ?? ""}
                  onChange={(e) => setReplyDraft((p) => ({ ...p, [r.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => patch(r.id, { status: "approved" })}>
                      <Check size={14} className="mr-2" />Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => patch(r.id, { status: "rejected" })}>
                      <X size={14} className="mr-2" />Reject
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => patch(r.id, { verified_purchase: !r.verified_purchase })}>
                    {r.verified_purchase ? "Unmark verified" : "Mark verified"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patch(r.id, { admin_reply: (replyDraft[r.id] ?? r.admin_reply ?? "") || null })}
                  >
                    Save reply
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 size={14} className="mr-2" />Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
