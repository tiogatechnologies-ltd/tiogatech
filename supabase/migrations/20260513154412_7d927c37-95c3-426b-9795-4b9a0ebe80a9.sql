-- Create a private storage bucket for career CV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'career-cvs',
  'career-cvs',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

-- Create career applications table
CREATE TABLE IF NOT EXISTS public.career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid,
  role_title text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL DEFAULT '',
  years_experience text NOT NULL DEFAULT '',
  cover_note text NOT NULL DEFAULT '',
  cv_path text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for admin review
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON public.career_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_applications_role_title ON public.career_applications (role_title);

-- Timestamp helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_career_applications_updated_at ON public.career_applications;
CREATE TRIGGER set_career_applications_updated_at
BEFORE UPDATE ON public.career_applications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Replace policies so the migration is safe to re-run
DROP POLICY IF EXISTS "Anyone can submit career applications" ON public.career_applications;
DROP POLICY IF EXISTS "Admins can manage career applications" ON public.career_applications;

CREATE POLICY "Anyone can submit career applications"
ON public.career_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(role_title)) BETWEEN 2 AND 160
  AND length(trim(full_name)) BETWEEN 2 AND 120
  AND length(trim(email)) BETWEEN 5 AND 255
  AND length(trim(phone)) BETWEEN 7 AND 40
  AND length(trim(cv_path)) BETWEEN 8 AND 500
  AND length(cover_note) <= 2000
);

CREATE POLICY "Admins can manage career applications"
ON public.career_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage access rules for CV files
DROP POLICY IF EXISTS "Anyone can upload career CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read career CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete career CVs" ON storage.objects;

CREATE POLICY "Anyone can upload career CVs"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'career-cvs');

CREATE POLICY "Admins can read career CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'career-cvs' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete career CVs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'career-cvs' AND public.has_role(auth.uid(), 'admin'::app_role));