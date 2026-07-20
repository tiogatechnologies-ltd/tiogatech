
CREATE SEQUENCE IF NOT EXISTS public.support_tickets_number_seq START 1000;

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || nextval('public.support_tickets_number_seq')::text),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_contact TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  conversation_context TEXT,
  channel TEXT NOT NULL DEFAULT 'web',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.support_tickets_number_seq OWNED BY public.support_tickets.ticket_number;

GRANT SELECT, INSERT ON public.support_tickets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
GRANT USAGE ON SEQUENCE public.support_tickets_number_seq TO anon, authenticated, service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests) can create a ticket, but only with safe defaults.
CREATE POLICY "Anyone can create a support ticket"
  ON public.support_tickets FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'open'
    AND resolved_at IS NULL
    AND length(user_name) BETWEEN 1 AND 200
    AND length(user_contact) BETWEEN 1 AND 200
    AND length(message) BETWEEN 1 AND 10000
  );

-- Signed-in users can read their own tickets.
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin and staff can view all tickets.
CREATE POLICY "Admin/staff can view all tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]));

-- Admin and staff can update tickets.
CREATE POLICY "Admin/staff can update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'staff'::app_role]));

-- Admin can delete tickets.
CREATE POLICY "Admin can delete tickets"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX support_tickets_status_idx ON public.support_tickets(status);
CREATE INDEX support_tickets_created_at_idx ON public.support_tickets(created_at DESC);
CREATE INDEX support_tickets_user_id_idx ON public.support_tickets(user_id);

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
