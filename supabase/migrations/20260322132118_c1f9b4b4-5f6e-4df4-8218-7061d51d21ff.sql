
-- Add status column to leads
ALTER TABLE public.leads ADD COLUMN status text NOT NULL DEFAULT 'new';

-- Create form_questions table
CREATE TABLE public.form_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  step_key text NOT NULL,
  question_text text NOT NULL,
  subtitle text,
  question_type text NOT NULL DEFAULT 'single_select',
  options jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on form_questions" ON public.form_questions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active form_questions" ON public.form_questions
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Create landing_content table
CREATE TABLE public.landing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on landing_content" ON public.landing_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read landing_content" ON public.landing_content
  FOR SELECT TO anon, authenticated
  USING (true);

-- Add tags and specifications to products
ALTER TABLE public.products ADD COLUMN tags text[] DEFAULT '{}'::text[];
ALTER TABLE public.products ADD COLUMN specifications jsonb DEFAULT '{}'::jsonb;
