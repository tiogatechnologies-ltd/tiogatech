CREATE TABLE public.home_automation_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  entertainment text[] NOT NULL DEFAULT '{}',
  price numeric,
  price_label text,
  badge text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_automation_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active home automation packages"
ON public.home_automation_packages FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins full access on home automation packages"
ON public.home_automation_packages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_home_automation_packages_updated_at
BEFORE UPDATE ON public.home_automation_packages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.home_automation_packages (tier, name, tagline, description, features, entertainment, price, price_label, badge, sort_order) VALUES
('Ascentia', 'Ascentia', 'Essential Areas', 'Our foundational package designed for modern security and core smart integration.',
 ARRAY['Smart Cameras','Video Doorbell','Smart Lock','Smart Control Panel','Motion & Door Sensors'],
 ARRAY['Amazon Echo Pop','Acoustic Ceiling Speakers'],
 4900000, 'From ₦4.9M', 'Foundational', 1),
('Sprout', 'Sprout', 'Core Areas', 'Elevate your living experience with enhanced lighting and automated window treatments. Includes everything in Ascentia.',
 ARRAY['Everything in Ascentia','Specialized Staircase Smart Lighting','Motorized Blinds or Curtains','Smart Control Panel'],
 ARRAY['Amazon Echo Show','Acoustic Ceiling Speakers with Amplifier'],
 10900000, 'From ₦10.9M', 'Most Popular', 2),
('Ibiza', 'Ibiza', 'Complete Home Automation', 'The ultimate luxury ecosystem for total property control and advanced technology. Includes everything in Ascentia & Sprout.',
 ARRAY['Everything in Ascentia & Sprout','Advanced AI Cameras','Starlight Night Vision','Motorised Gate','Starlink High-Speed Internet'],
 ARRAY['Multi-Surround Sound System','Amazon Echo Show 15'],
 18900000, 'From ₦18.9M', 'Luxury', 3);