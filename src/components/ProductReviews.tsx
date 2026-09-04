import { useEffect, useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  verified_purchase: boolean;
  status: string;
  admin_reply: string | null;
  created_at: string;
};

export const Stars = ({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled = n <= Math.round(value);
      const cls = filled ? "fill-accent text-accent" : "text-muted-foreground/40";
      return onChange ? (
        <button key={n} type="button" aria-label={`${n} star`} onClick={() => onChange(n)} className="p-0.5">
          <Star size={size + 4} className={cls} />
        </button>
      ) : (
        <Star key={n} size={size} className={cls} />
      );
    })}
  </span>
);

type Props = {
  productId: string;
  onStats?: (stats: { count: number; average: number }) => void;
};

const ProductReviews = ({ productId, onStats }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mine, setMine] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_reviews" as any)
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    const rows = ((data as any) || []) as Review[];
    const approved = rows.filter((r) => r.status === "approved");
    setReviews(approved);
    const own = user ? rows.find((r) => r.user_id === user.id) || null : null;
    setMine(own);
    if (own) {
      setRating(own.rating);
      setTitle(own.title || "");
      setBody(own.body);
    }
    onStats?.({
      count: approved.length,
      average: approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?.id]);

  const submit = async () => {
    if (!user) return;
    if (body.trim().length < 5) return toast.error("Please write at least a few words.");
    setSaving(true);
    if (mine) {
      const { error } = await supabase
        .from("product_reviews" as any)
        .update({ rating, title: title || null, body })
        .eq("id", mine.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Review updated - it will reappear once re-approved.");
    } else {
      const name =
        (user.user_metadata as any)?.full_name || user.email?.split("@")[0] || "Customer";
      const { error } = await supabase.from("product_reviews" as any).insert({
        product_id: productId,
        user_id: user.id,
        author_name: name,
        rating,
        title: title || null,
        body,
      });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Thanks! Your review is awaiting approval.");
    }
    load();
  };

  const remove = async () => {
    if (!mine) return;
    const { error } = await supabase.from("product_reviews" as any).delete().eq("id", mine.id);
    if (error) return toast.error(error.message);
    setMine(null);
    setRating(5);
    setTitle("");
    setBody("");
    toast.success("Review removed");
    load();
  };

  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section id="reviews" className="section-container pb-16 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-bold">Customer reviews</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={average} />
            {average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <h3 className="font-semibold text-sm">{mine ? "Your review" : "Write a review"}</h3>
            {!user ? (
              <p className="text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary font-medium underline">Sign in</Link> to leave a review.
              </p>
            ) : (
              <>
                {mine && mine.status !== "approved" && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                    Awaiting approval
                  </Badge>
                )}
                <Stars value={rating} onChange={setRating} />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                  maxLength={120}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="How has this product worked for you?"
                  rows={4}
                  maxLength={4000}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={submit} disabled={saving}>
                    {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                    {mine ? "Update review" : "Submit review"}
                  </Button>
                  {mine && (
                    <Button size="sm" variant="outline" onClick={remove}>
                      <Trash2 size={14} className="mr-2" />Delete
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet - be the first to share your experience.</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold">{r.author_name}</span>
                    {r.verified_purchase && (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                        Verified purchase
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {r.title && <p className="font-medium text-sm">{r.title}</p>}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
                  {r.admin_reply && (
                    <div className="rounded-xl bg-muted/50 p-3 text-sm">
                      <p className="text-xs font-semibold mb-1">Tioga Technologies replied</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{r.admin_reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};

export default ProductReviews;
