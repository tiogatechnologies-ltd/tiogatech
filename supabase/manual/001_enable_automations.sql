-- ============================================================================
-- Tioga: enable the scheduled automations, and add products.compare_at_price
--
-- Run this ONCE in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/xwxskzwceghftlcsbyyh/sql/new
--
-- BEFORE RUNNING:
--   1. Invent a long random string - this is your cron shared secret.
--   2. Add it under Project Settings -> Edge Functions -> Secrets as
--      CRON_SHARED_SECRET (same place PAYSTACK_SECRET_KEY lives).
--   3. Replace PUT_YOUR_CRON_SHARED_SECRET_HERE below with that same value.
--
-- The secret only grants the ability to trigger these four jobs. No Supabase
-- service-role key is stored in the database and no Vault entry is required.
--
-- This has to be applied by hand because the remote migration history is out
-- of sync: roughly 70 migrations were applied through the dashboard without
-- being recorded, so `supabase db push` replays them and fails on the first
-- CREATE TABLE. Everything below is idempotent - safe to run more than once.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0. Extensions the scheduler needs
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;


-- ---------------------------------------------------------------------------
-- 1. Real compare-at price
--    Backs the struck-through list price. NULL means no recorded previous
--    price, in which case the storefront falls back to the markup configured
--    in Admin > Settings > Delivery, Tax & Promotions.
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_price numeric;

COMMENT ON COLUMN public.products.compare_at_price IS
  'Optional genuine previous/list price in NGN. Must exceed price to display; NULL falls back to the configured markup.';


-- ---------------------------------------------------------------------------
-- 2. Seed the automation rules
--    Admin > System Automations reads this table. It was created but never
--    populated, so the page showed no rules and its toggles controlled
--    nothing. Each key corresponds to a deployed Edge Function.
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
      -- enabled and config are deliberately NOT overwritten: re-running this
      -- must not silently re-enable a rule an admin switched off.


-- ---------------------------------------------------------------------------
-- 3. Schedule the jobs
--    These four Edge Functions each declare themselves a cron job in their own
--    header comment, but none were ever scheduled - so no installment reminder
--    was ever sent, nothing was ever marked overdue, no installment was ever
--    auto-charged, and monthly AI credits were never topped up.
--
--    Each function rejects any caller that does not present this secret.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  cron_secret text := 'PUT_YOUR_CRON_SHARED_SECRET_HERE';
  base_url text := 'https://xwxskzwceghftlcsbyyh.supabase.co/functions/v1/';
BEGIN
  IF cron_secret = 'PUT_YOUR_CRON_SHARED_SECRET_HERE' OR length(cron_secret) < 16 THEN
    RAISE EXCEPTION
      'Replace PUT_YOUR_CRON_SHARED_SECRET_HERE with the same value you saved as CRON_SHARED_SECRET under Edge Functions -> Secrets (at least 16 characters).';
  END IF;

  -- Drop first so re-running updates the schedule rather than erroring.
  PERFORM cron.unschedule(jobname)
  FROM cron.job
  WHERE jobname IN (
    'finance-reminders-daily',
    'finance-mark-overdue-daily',
    'finance-auto-charge-daily',
    'reset-free-credits-daily',
    'process-email-queue'
  );

  -- Drains the outbound email queue. NOTHING has ever drained it, so every
  -- order confirmation, support acknowledgement and password email since
  -- launch is still sitting in pgmq. Messages past their TTL (15 min for auth,
  -- 60 min for transactional) are discarded to a dead-letter queue rather than
  -- delivered, so switching this on does not blast a backlog at customers.
  -- Requires RESEND_API_KEY (or LOVABLE_API_KEY) to actually send.
  PERFORM cron.schedule('process-email-queue', '* * * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
         body := '{}'::jsonb
       )$q$, base_url || 'process-email-queue', cron_secret));

  -- Times are UTC; WAT is UTC+1. Order matters: mark overdue, then remind,
  -- then charge, so each step sees the previous step's result.
  PERFORM cron.schedule('finance-mark-overdue-daily', '0 6 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
         body := '{}'::jsonb
       )$q$, base_url || 'check-overdue-and-deadlines', cron_secret));

  PERFORM cron.schedule('finance-reminders-daily', '0 7 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
         body := '{}'::jsonb
       )$q$, base_url || 'finance-reminders', cron_secret));

  PERFORM cron.schedule('finance-auto-charge-daily', '0 8 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
         body := '{}'::jsonb
       )$q$, base_url || 'auto-charge-due', cron_secret));

  PERFORM cron.schedule('reset-free-credits-daily', '30 0 * * *', format(
    $q$SELECT net.http_post(
         url := %L,
         headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
         body := '{}'::jsonb
       )$q$, base_url || 'reset-monthly-free-credits', cron_secret));
END $$;


-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
SELECT key, label, enabled FROM public.automation_settings ORDER BY category, key;
