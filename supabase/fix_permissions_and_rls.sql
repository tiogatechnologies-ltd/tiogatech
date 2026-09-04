-- SECURITY NOTE (corrected): this file originally granted
-- `USING (true) WITH CHECK (true)` to `anon, authenticated` on leads, orders,
-- order_items and support_tickets - i.e. any visitor, logged in or not,
-- could read, edit or delete every customer's leads, orders and support
-- tickets with no authentication at all. Rewritten to match the properly
-- scoped policies the live database actually runs: anyone can submit
-- (insert) their own lead/order/ticket, customers can read their own,
-- and only admin/staff can read, update or delete everyone's.

DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public can view leads" ON public.leads;
DROP POLICY IF EXISTS "Public full lead access" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit a lead fix" ON public.leads;
CREATE POLICY "Anyone can submit a lead fix" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins manage leads fix" ON public.leads;
CREATE POLICY "Admins manage leads fix" ON public.leads FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public full orders access" ON public.orders;
DROP POLICY IF EXISTS "Anyone can place an order fix" ON public.orders;
CREATE POLICY "Anyone can place an order fix" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users read own orders fix" ON public.orders;
CREATE POLICY "Users read own orders fix" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Staff manage orders fix" ON public.orders;
CREATE POLICY "Staff manage orders fix" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins delete orders fix" ON public.orders;
CREATE POLICY "Admins delete orders fix" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public full order items access" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can add order items fix" ON public.order_items;
CREATE POLICY "Anyone can add order items fix" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Customers read own order items fix" ON public.order_items;
CREATE POLICY "Customers read own order items fix" ON public.order_items FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[])
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Staff manage order items fix" ON public.order_items;
CREATE POLICY "Staff manage order items fix" ON public.order_items FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins delete order items fix" ON public.order_items;
CREATE POLICY "Admins delete order items fix" ON public.order_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can submit support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public can view support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Public full support tickets access" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can create a support ticket fix" ON public.support_tickets;
CREATE POLICY "Anyone can create a support ticket fix" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users view own tickets fix" ON public.support_tickets;
CREATE POLICY "Users view own tickets fix" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Staff manage tickets fix" ON public.support_tickets;
CREATE POLICY "Staff manage tickets fix" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
DROP POLICY IF EXISTS "Admins delete tickets fix" ON public.support_tickets;
CREATE POLICY "Admins delete tickets fix" ON public.support_tickets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
