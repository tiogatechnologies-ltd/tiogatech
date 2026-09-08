-- ============================================================================
-- Tioga: enable the scheduled automations, and add products.compare_at_price
--
-- Run this ONCE in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/xwxskzwceghftlcsbyyh/sql/new
--
-- It has to be applied by hand because the remote migration history is out of
-- sync: roughly 70 migrations were applied through the dashboard without being
-- recorded, so `supabase db push` tries to replay them and fails on the first
-- CREATE TABLE. Everything below is idempotent - safe to run more than once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Real compare-at price
--    Replaces the fabricated strikethrough price (price * 1.12) that the
--    storefront used to show on every product. NULL = no previous price = no
--    strikethrough. Admin > Product Catalog exposes the field once this exists.
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric;

COMMENT ON COLUMN public.products.compare_at_price IS
  'Optional genuine previous/list price in NGN. Must exceed price to display; NULL hides the strikethrough.';


-- ---------------------------------------------------------------------------
-- 2. Seed the automation rules
--    Admin > System Automations reads this table. It was created but never
--    populated, so the page showed "0/0 rules" and its toggles controlled
--    nothing. Each key below corresponds to a deployed Edge Function.
-- ---------------------------------------------------------------------------
INSERT INTO public.automation_settings (key, label, category, description, enabled, config) VALUES
  ('finance_installment_reminder',
   'Installment due & overdue reminders',
   'Finance',
   'Emails customers before an Easy Flex installment falls due, and again once it is overdue.',
   true,
   '{"days_before": 3}'::jsonb),

  ('finance_mark_overdue',
   'Mark passed installments overdue',
   'Finance',
   'Flips schedules whose due date has passed from upcoming/due to overdue.',
   true,
   '{}'::jsonb),

  ('finance_auto_charge',
   'Auto-charge due installments',
   'Finance',
   'Charges saved Paystack authorizations on the due date; falls back to a manual payment link when no authorization is stored or the charge fails.',
   true,
   '{}'::jsonb),

  ('monthly_free_credits',
   'Monthly free AI credit top-up',
   'AI Platform',
   'Tops every account back up to its monthly free credit allowance. Idempotent, so a daily run is safe.',
   true,
   '{}'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      category = EXCLUDED.category,
      description = EXCLUDED.description;
      -- enabled and config are intentionally NOT overwritten: re-running this
      -- script must not silently re-enable a rule an admin switched off.


-- ---------------------------------------------------------------------------
-- 3. Schedule the jobs
--    These four Edge Functions each declare themselves a cron job in their own
--    header comment, but none were ever scheduled - so no installment reminder
--    was ever sent, nothing was ever marked overdue, no installment was ever
--    auto-charged, and monthly AI credits were never topped up.
--
--    Reuses the vault secret the email queue already relies on. If that secret
--    is missing this block raises a clear error instead of creating jobs that
--    would silently 401 forever.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  svc_key text;
  base_url text := 'https://xwxskzwceghftlcsbyyh.supabase.co/functions/v1/';
BEGIN
  SELECT decrypted_secret INTO svc_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key';

  IF svc_key IS NULL THEN
    RAISE EXCEPTION
      'Vault secret "email_queue_service_role_key" not found. The email queue cron created it; if it is missing, add the service_role key to Vault first.';
  END IF;

  -- Drop first so re-running updates the schedule rather than erroring.
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN (
    'finance-reminders-daily',
    'finance-mark-overdue-daily',
    'finance-auto-charge-daily',
    'reset-free-credits-daily'
  );

  -- 07:00 UTC = 08:00 WAT. Order matters: mark overdue, then remind, then charge.
  PERFORM cron.schedule('finance-mark-overdue-daily', '0 6 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
         body := '{}'::jsonb
       )$q$, base_url || 'check-overdue-and-deadlines', svc_key));

  PERFORM cron.schedule('finance-reminders-daily', '0 7 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
         body := '{}'::jsonb
       )$q$, base_url || 'finance-reminders', svc_key));

  PERFORM cron.schedule('finance-auto-charge-daily', '0 8 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
         body := '{}'::jsonb
       )$q$, base_url || 'auto-charge-due', svc_key));

  PERFORM cron.schedule('reset-free-credits-daily', '30 0 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer %s'),
         body := '{}'::jsonb
       )$q$, base_url || 'reset-monthly-free-credits', svc_key));
END $$;


-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
SELECT key, label, enabled FROM public.automation_settings ORDER BY category, key;
