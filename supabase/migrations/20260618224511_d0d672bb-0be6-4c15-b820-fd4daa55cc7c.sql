
-- Allow customers to read items for orders they own
CREATE POLICY "Customers can read their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

-- Rewrite site_settings public-read policy as an explicit allowlist
DROP POLICY IF EXISTS "Public can read non-sensitive site settings" ON public.site_settings;

CREATE POLICY "Public can read whitelisted site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (key = ANY (ARRAY['general','branding','social_links','hero_content','contact_public','seo','homepage','footer']));
