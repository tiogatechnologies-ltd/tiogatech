
CREATE TABLE public.app_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  platform text NOT NULL DEFAULT 'both',
  source text NOT NULL DEFAULT 'coming_soon',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_waitlist_email_unique UNIQUE (email),
  CONSTRAINT app_waitlist_platform_chk CHECK (platform IN ('ios','android','both')),
  CONSTRAINT app_waitlist_name_len CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  CONSTRAINT app_waitlist_email_len CHECK (char_length(trim(email)) BETWEEN 5 AND 255)
);

ALTER TABLE public.app_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.app_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read waitlist"
  ON public.app_waitlist FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist"
  ON public.app_waitlist FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX app_waitlist_created_idx ON public.app_waitlist (created_at DESC);
