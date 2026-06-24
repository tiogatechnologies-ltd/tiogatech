
CREATE TABLE IF NOT EXISTS public.ai_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  assessment_id uuid,
  source text,
  description text,
  used_free_credit boolean NOT NULL DEFAULT true,
  subscription_plan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_usage_user ON public.ai_credit_usage(user_id, created_at DESC);

GRANT SELECT ON public.ai_credit_usage TO authenticated;
GRANT ALL ON public.ai_credit_usage TO service_role;

ALTER TABLE public.ai_credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI usage"
  ON public.ai_credit_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff view all AI usage"
  ON public.ai_credit_usage FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
