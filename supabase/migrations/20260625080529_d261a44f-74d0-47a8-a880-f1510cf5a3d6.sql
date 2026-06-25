ALTER TABLE public.finance_applications DROP CONSTRAINT IF EXISTS finance_applications_months_check;
ALTER TABLE public.finance_applications ADD CONSTRAINT finance_applications_months_check CHECK (months = ANY (ARRAY[3, 6, 12, 24]));

UPDATE public.site_settings
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{tenures_months}',
  '[3,6,12,24]'::jsonb,
  true
)
WHERE key = 'finance';

INSERT INTO public.site_settings (key, value)
SELECT 'finance', '{"tenures_months":[3,6,12,24],"vat_pct":0.075,"deposit_pct":0.30,"install_pct":0.10,"insurance_pct":0.02,"management_pct":0.01,"interest_tiers":[{"min":1000000,"max":5000000,"rate":0.09},{"min":5000001,"max":7500000,"rate":0.15},{"min":7500001,"max":null,"rate":0.25}]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'finance');