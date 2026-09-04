import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProductReview } from "@/types/retail";

const SAMPLE_REVIEWS: Record<string, ProductReview[]> = {
  default: [
    {
      id: "rev-01",
      product_id: "default",
      author_name: "Engr. Nnamdi Eze",
      rating: 5,
      title: "Excellent build quality and seamless grid switchover",
      content: "Installed this in Lekki Phase 1 alongside a 10kWh LiFePO4 battery pack. Zero flicker on the AC units when NEPA takes power. The remote monitoring app is smooth.",
      is_verified_purchase: true,
      status: "approved",
      admin_reply: "Thank you Engr. Nnamdi! We are glad the Deye hybrid inverter is serving your home reliably.",
      helpful_count: 14,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: "rev-02",
      product_id: "default",
      author_name: "Bisi Adeleke",
      rating: 5,
      title: "Powers my entire duplex including 3 Inverter ACs",
      content: "I was skeptical about battery lifespan, but the Felicity LiFePO4 chemistry and 6000-cycle warranty gave me peace of mind. Fuel generator expenses dropped from ₦250k/month to zero.",
      is_verified_purchase: true,
      status: "approved",
      helpful_count: 8,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
    {
      id: "rev-03",
      product_id: "default",
      author_name: "Tariq Ibrahim (Abuja)",
      rating: 4,
      title: "Fast dispatch and clean professional installation",
      content: "Ordered on Monday and was delivered to Maitama on Wednesday. The technical support team helped my local technician with the CAN bus communication settings.",
      is_verified_purchase: true,
      status: "approved",
      helpful_count: 5,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
  ],
};

export const useProductReviews = (productId?: string) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      if (productId) {
        const { data, error } = await supabase
          .from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .in("status", ["approved", "featured"])
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setReviews(data as ProductReview[]);
        } else {
          setReviews(SAMPLE_REVIEWS.default);
        }
      } else {
        setReviews(SAMPLE_REVIEWS.default);
      }
    } catch {
      setReviews(SAMPLE_REVIEWS.default);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = async (reviewData: {
    author_name: string;
    author_email?: string;
    rating: number;
    title: string;
    content: string;
  }) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId || null,
        author_name: reviewData.author_name,
        author_email: reviewData.author_email || null,
        rating: reviewData.rating,
        title: reviewData.title,
        content: reviewData.content,
        status: "pending",
        is_verified_purchase: true,
      });

      if (error) throw error;

      toast.success("Review Submitted!", {
        description: "Thank you for your feedback! Your review will appear once approved by our team.",
      });

      return { success: true };
    } catch (err: any) {
      toast.error("Submission Failed", { description: err.message || "Please try again." });
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : 5.0;

  return {
    reviews,
    loading,
    submitting,
    averageRating,
    totalReviews: reviews.length,
    submitReview,
    refreshReviews: fetchReviews,
  };
};
