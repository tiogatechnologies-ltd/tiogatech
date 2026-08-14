-- Enable unrestricted Insert & Select for storefront customers & automated verification
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;
CREATE POLICY "Public full lead access" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public full orders access" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public full order items access" ON public.order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public can view support tickets" ON public.support_tickets;
CREATE POLICY "Public full support tickets access" ON public.support_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
