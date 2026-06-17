
-- Inventory movements
CREATE TABLE public.product_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  note text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_psm_product ON public.product_stock_movements(product_id, created_at DESC);
GRANT SELECT, INSERT ON public.product_stock_movements TO authenticated;
GRANT ALL ON public.product_stock_movements TO service_role;
ALTER TABLE public.product_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read movements" ON public.product_stock_movements FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
CREATE POLICY "Staff insert movements" ON public.product_stock_movements FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- Auto-apply movement to stock
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
    SET stock = GREATEST(0, COALESCE(stock,0) + NEW.delta)
    WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_apply_stock_movement
AFTER INSERT ON public.product_stock_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Order status: auto-log history on change + allow user-visible reads
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history(order_id, from_status, to_status, actor_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status
AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Let order owner read their own history
DROP POLICY IF EXISTS "Users read own order history" ON public.order_status_history;
CREATE POLICY "Users read own order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id
    AND (o.user_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]))));
DROP POLICY IF EXISTS "Staff read order history" ON public.order_status_history;
CREATE POLICY "Staff read order history" ON public.order_status_history FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- low_stock_threshold on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;
