BEGIN;

-- These four seeded listings still advertised a deadline that has passed.
-- Keep them in Admin > Careers for editing/reopening, but stop advertising them.
UPDATE public.careers SET is_active = false
WHERE is_active AND deadline = '30th May, 2026'
  AND current_date > DATE '2026-05-30';

-- Configuration is held in Vault, never in the cron command or a public setting.
CREATE OR REPLACE FUNCTION public.dispatch_email_queue() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE worker_secret text; project_url text;
BEGIN
  SELECT decrypted_secret INTO worker_secret FROM vault.decrypted_secrets WHERE name='tiogatech_email_worker_secret' LIMIT 1;
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name='tiogatech_email_worker_url' LIMIT 1;
  IF worker_secret IS NULL OR project_url IS NULL THEN RAISE EXCEPTION 'Email worker Vault configuration is missing'; END IF;
  PERFORM net.http_post(
    url := project_url || '/functions/v1/process-email-queue',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',worker_secret),
    body := '{}'::jsonb
  );
END $$;
REVOKE ALL ON FUNCTION public.dispatch_email_queue() FROM PUBLIC,anon,authenticated;

SELECT cron.schedule('process-email-queue','* * * * *','SELECT public.dispatch_email_queue()');

COMMIT;
