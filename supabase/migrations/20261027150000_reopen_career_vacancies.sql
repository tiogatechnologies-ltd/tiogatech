BEGIN;

-- Reopen the four vacancies as requested, without their expired seed deadline.
UPDATE public.careers
SET is_active = true, deadline = ''
WHERE title IN (
  'Call for Partnership — Nationwide Installers',
  'Engineering Force — Project Engineers & Solar Installers',
  'Admin / Sales Representative',
  'Business Development Manager'
);

COMMIT;
