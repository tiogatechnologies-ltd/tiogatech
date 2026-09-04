import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  MessageSquare,
  Star,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Sparkles,
  Search,
  Filter,
  Reply,
  Trash2,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Review } from "@/components/ProductReviews";

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews((data as Review[]) ?? []);
    } catch (err: any) {
      toast.error("Failed to load reviews", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const previous = reviews;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    const { error } = await supabase.from("product_reviews").update({ status: newStatus }).eq("id", id);
    if (error) {
      setReviews(previous);
      toast.error("Failed to update review", { description: error.message });
      return;
    }
    toast.success(`Review ${newStatus.toUpperCase()}`, {
      description: `Review status updated to ${newStatus}.`,
    });
  };

  const handleSaveReply = async () => {
    if (!replyReview) return;
    const { error } = await supabase
      .from("product_reviews")
      .update({ admin_reply: replyText })
      .eq("id", replyReview.id);
    if (error) {
      toast.error("Failed to publish reply", { description: error.message });
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === replyReview.id ? { ...r, admin_reply: replyText } : r))
    );
    toast.success("Official Response Published", {
      description: "Your reply is now visible below the customer's review.",
    });
    setReplyReview(null);
    setReplyText("");
  };

  const handleDelete = async (id: string) => {
    const previous = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      setReviews(previous);
      toast.error("Failed to delete review", { description: error.message });
      return;
    }
    toast.info("Review Deleted");
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.author_name.toLowerCase().includes(q) ||
        (r.title || "").toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
              <MessageSquare size={24} className="text-primary" />
              Customer Reviews & Ratings Moderation
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Moderate verified customer feedback, manage featured badges, and publish official engineering responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-xs">
              {reviews.filter((r) => r.status === "pending").length} Pending Moderation
            </Badge>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reviewer, title, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-xs bg-muted/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["all", "pending", "approved", "featured", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
              <p className="text-xs text-muted-foreground animate-pulse">Loading reviews...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-6">
              <MessageSquare size={32} className="mx-auto text-muted-foreground mb-2" />
              <h3 className="font-bold text-foreground text-sm">No Reviews Found</h3>
              <p className="text-xs text-muted-foreground mt-1">No reviews match the selected filter criteria.</p>
            </div>
          ) : (
            filtered.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3 hover:border-border/80 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <h3 className="font-display font-bold text-sm text-foreground">{review.title || "(No title)"}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] uppercase font-bold px-2.5 py-0.5 ${
                        review.status === "featured"
                          ? "bg-gold text-midnight"
                          : review.status === "approved"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : review.status === "pending"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-red-500/15 text-red-600"
                      }`}
                    >
                      {review.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed">{review.body}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span className="font-semibold text-foreground">{review.author_name}</span>
                    {review.verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck size={13} />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyReview(review);
                        setReplyText(review.admin_reply || "");
                      }}
                      className="text-xs rounded-xl h-8 gap-1"
                    >
                      <Reply size={13} />
                      <span>{review.admin_reply ? "Edit Reply" : "Reply"}</span>
                    </Button>

                    {review.status !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(review.id, "approved")}
                        className="text-xs rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <CheckCircle size={13} />
                        <span>Approve</span>
                      </Button>
                    )}

                    {review.status !== "featured" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(review.id, "featured")}
                        className="text-xs rounded-xl h-8 gap-1 bg-gold/20 text-gold-dark dark:text-gold hover:bg-gold/30"
                      >
                        <Sparkles size={13} />
                        <span>Feature</span>
                      </Button>
                    )}

                    {review.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(review.id, "rejected")}
                        className="text-xs rounded-xl h-8 text-red-500 hover:bg-red-500/10 gap-1"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(review.id)}
                      className="text-xs rounded-xl h-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>

                {/* Published Reply Preview */}
                {review.admin_reply && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                    <span className="font-bold text-primary block text-[10px] uppercase tracking-wider mb-0.5">
                      Published Official Response:
                    </span>
                    <p className="text-muted-foreground text-xs">{review.admin_reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply Modal */}
      <Dialog open={Boolean(replyReview)} onOpenChange={(o) => !o && setReplyReview(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-bold text-foreground">
              Reply to {replyReview?.author_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border text-muted-foreground italic">
              "{replyReview?.body}"
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Official Response Message</label>
              <Textarea
                rows={4}
                placeholder="Thank the customer or provide technical assistance..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReplyReview(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button onClick={handleSaveReply} className="rounded-xl font-bold text-xs">
                Publish Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReviews;
