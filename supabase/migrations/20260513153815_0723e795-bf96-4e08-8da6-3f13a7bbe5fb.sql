CREATE TABLE public.careers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  requirements text NOT NULL DEFAULT '',
  email_subject text NOT NULL DEFAULT '',
  deadline text NOT NULL DEFAULT '30th May, 2026',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active careers"
  ON public.careers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins full access on careers"
  ON public.careers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.careers (title, location, summary, highlights, requirements, email_subject, sort_order) VALUES
('Call for Partnership — Nationwide Installers', 'Nationwide, Nigeria', 'Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions, integrated inverters and lithium battery systems, that reduce grid dependence.', ARRAY['Attractive commission structure','Reduce client grid dependence','Access to premium hardware stack'], 'Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.', 'Application - Partnership (Nationwide Installer)', 1),
('Engineering Force — Project Engineers & Solar Installers', 'Lagos | Abuja | Jos', 'Contract-based roles for engineers who can design, install and commission PV and ESS storage systems at scale.', ARRAY['2 to 5 years in Renewable Energy or Electrical Engineering','PV, ESS Storage and commissioning experience','Field-ready, safety-first mindset'], 'HND / B.Eng in Electrical Engineering or related field. COREN / NSE certification is an advantage.', 'Application - Project Engineer / Solar Installer', 2),
('Admin / Sales Representative', 'Jos', 'Front-line role supporting customers, coordinating quotes and keeping the Jos office running smoothly.', ARRAY['1 to 3 years in Admin or Sales','Strong multitasking and customer service skills','Comfortable with CRM and basic reporting'], 'Minimum OND / HND / B.Sc in any related discipline.', 'Application - Admin/Sales Representative (Jos)', 3),
('Business Development Manager', 'Abuja | Jos', 'Drive strategic growth across enterprise, SME and residential segments. Own pipeline, partnerships and regional expansion.', ARRAY['3 to 6 years in business development','Strategic growth and partnership focus','Renewable Energy background is an advantage'], 'Bachelor''s degree in Business, Engineering or a related field.', 'Application - Business Development Manager', 4);