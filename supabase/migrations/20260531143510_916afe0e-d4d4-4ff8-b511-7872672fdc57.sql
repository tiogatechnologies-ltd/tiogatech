-- Remove unused public INSERT policy on order_items. Orders are submitted exclusively
-- through the submit-order edge function (service role), so anonymous direct inserts
-- are not needed and were enabling unlinked rows to be attached to any order.
DROP POLICY IF EXISTS "Anyone can add order items" ON public.order_items;
REVOKE INSERT ON public.order_items FROM anon, authenticated;