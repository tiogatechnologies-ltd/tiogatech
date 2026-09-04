export interface RetailProduct {
  id: string;
  name: string;
  category: string;
  series: string | null;
  description: string;
  features: string[];
  best_for: string;
  price: string | null;
  numeric_price?: number;
  compare_at_price?: number | null;
  tier: "premium" | "mid" | "affordable" | "entry";
  image_url: string | null;
  secondary_image_url?: string | null;
  specifications: Record<string, string> | null;
  tags: string[] | null;
  brand?: string;
  rating?: number;
  review_count?: number;
  stock_status?: "in_stock" | "low_stock" | "pre_order" | "out_of_stock";
  is_featured?: boolean;
  warranty_years?: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title: string;
  option_type: string;
  option_value: string;
  price_adjustment: number;
  final_price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url?: string | null;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  author_email?: string;
  rating: number;
  title: string;
  content: string;
  is_verified_purchase: boolean;
  status: "pending" | "approved" | "rejected" | "featured";
  admin_reply?: string | null;
  helpful_count: number;
  created_at: string;
}

export interface StoreBanner {
  id: string;
  badge_text: string;
  headline: string;
  subheadline?: string;
  cta_text: string;
  cta_link: string;
  discount_code?: string;
  ends_at?: string;
  bg_gradient?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProductBundle {
  id: string;
  title: string;
  primary_product_id: string;
  bundled_product_ids: string[];
  discount_percentage: number;
  is_active: boolean;
}

export interface CompareProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: string | null;
  numeric_price?: number;
  image_url: string | null;
  specifications: Record<string, string> | null;
  rating: number;
  review_count: number;
  warranty_years: number;
  stock_status: string;
}
