import { useState } from "react";
import { Star, ShieldCheck, ThumbsUp, MessageSquare, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useProductReviews } from "@/hooks/useProductReviews";
import type { ProductReview } from "@/types/retail";

interface ReviewsProps {
  productId?: string;
  productName: string;
}

export const CustomerReviewsSection = ({ productId, productName }: ReviewsProps) => {
  const { reviews, averageRating, totalReviews, submitReview, submitting } = useProductReviews(productId);
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !content) return;
    const res = await submitReview({
      author_name: name,
      author_email: email,
      rating,
      title,
      content,
    });
    if (res.success) {
      setModalOpen(false);
      setName("");
      setTitle("");
      setContent("");
    }
  };

  // Calculate rating counts for 5, 4, 3, 2, 1 stars
  const counts = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, pct };
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-10 shadow-[var(--shadow-card)] my-12" id="reviews">
      {/* Top Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <MessageSquare size={15} />
            <span>Verified Customer Reviews</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground">
            Customer Feedback & Ratings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Real feedback from verified home and business owners across Nigeria.
          </p>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2 rounded-xl shadow-md">
              <Plus size={16} />
              <span>Write a Review</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-border rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-display font-bold text-foreground">
                Write a Review for {productName}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-foreground">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        size={24}
                        fill={star <= rating ? "#F59E0B" : "none"}
                        className={star <= rating ? "text-amber-500" : "text-muted-foreground"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">Your Name / Title *</label>
                <Input
                  required
                  placeholder="e.g. Engr. Babatunde (Ikeja)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">Email (Optional)</label>
                <Input
                  type="email"
                  placeholder="For purchase verification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">Review Headline *</label>
                <Input
                  required
                  placeholder="e.g. Flawless solar performance during power cuts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">Your Experience *</label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Describe installation experience, battery backup duration, or energy savings..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="rounded-xl resize-none"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full py-5 rounded-xl font-bold gap-2">
                {submitting ? "Submitting..." : "Submit Verified Review"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-border">
        {/* Big Score */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 text-center">
          <span className="text-5xl font-display font-bold text-foreground">{averageRating}</span>
          <div className="flex items-center gap-1 text-amber-500 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={18} fill={s <= Math.round(averageRating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Based on {totalReviews} verified review{totalReviews !== 1 ? "s" : ""}
          </span>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-2.5">
          {counts.map(({ stars, count, pct }) => (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-12 text-muted-foreground font-medium flex items-center gap-1">
                {stars} <Star size={11} fill="currentColor" className="text-amber-500" />
              </span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 pt-8">
        {reviews.map((review) => (
          <div key={review.id} className="p-6 rounded-2xl bg-card border border-border/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-500">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <h4 className="font-display font-bold text-sm text-foreground">{review.title}</h4>
              </div>

              <span className="text-[11px] text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>

            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{review.author_name}</span>
                {review.is_verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck size={13} />
                    Verified Buyer
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <ThumbsUp size={12} />
                <span>Helpful ({review.helpful_count || 0})</span>
              </div>
            </div>

            {/* Admin Response if available */}
            {review.admin_reply && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 mt-3 text-xs">
                <span className="font-bold text-primary block text-[10px] uppercase tracking-wider mb-0.5">
                  Tioga Engineering Team Response:
                </span>
                <p className="text-muted-foreground text-xs">{review.admin_reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
