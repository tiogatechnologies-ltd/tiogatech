-- Replaces the fabricated "was price" shown across the storefront.
--
-- Product cards, package cards and detail pages rendered a strikethrough price
-- computed as `price * 1.12` plus a hash-derived "save X%", "N sold this week"
-- and "N people viewing". None of it was real: the discount never existed and
-- the counts were a hash of the row id. This adds a genuine, admin-set
-- compare-at price so a strikethrough only ever reflects a price the business
-- actually charged.
--
-- NULL means "no previous price" - the storefront then shows no strikethrough.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric;

COMMENT ON COLUMN public.products.compare_at_price IS
  'Optional genuine previous/list price in NGN. Must be higher than price to display; NULL hides the strikethrough.';
