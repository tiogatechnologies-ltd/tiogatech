
-- Newsletter: double opt-in + admin broadcasts
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

CREATE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON public.newsletter_subscribers (confirm_token);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_idx
  ON public.newsletter_subscribers (unsubscribe_token);

-- Blog: scheduled publishing
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

-- Update RLS so scheduled posts are NOT publicly visible until time arrives
DROP POLICY IF EXISTS "Anyone can read published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published blog posts"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (
  published = true
  AND (published_at IS NULL OR published_at <= now())
);

-- Broadcast log so admin can track campaigns
CREATE TABLE IF NOT EXISTS public.newsletter_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  html text NOT NULL,
  sent_count integer NOT NULL DEFAULT 0,
  sent_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.newsletter_broadcasts TO authenticated;
GRANT ALL ON public.newsletter_broadcasts TO service_role;

ALTER TABLE public.newsletter_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read broadcasts"
ON public.newsletter_broadcasts FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert broadcasts"
ON public.newsletter_broadcasts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
