BEGIN;

ALTER TABLE public.careers ALTER COLUMN deadline SET DEFAULT '';

-- Carry the previously manual security fixes into normal deployments.
DROP POLICY IF EXISTS "Affiliates create own payout requests" ON public.affiliate_payout_requests;
REVOKE INSERT ON public.affiliate_payout_requests FROM anon, authenticated;
CREATE POLICY "Public read affiliate settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (key = 'affiliate');

-- Approved accounts work whether they sign up before or after approval.
CREATE FUNCTION public.sync_affiliate_access() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_SCHEMA = 'auth' THEN
    IF NEW.email_confirmed_at IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.affiliates a WHERE lower(a.email)=lower(NEW.email)) THEN
      INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'affiliate')
        ON CONFLICT (user_id,role) DO NOTHING;
    END IF;
  ELSE
    INSERT INTO public.user_roles(user_id,role)
    SELECT u.id,'affiliate'::public.app_role FROM auth.users u
      WHERE u.email_confirmed_at IS NOT NULL AND lower(u.email)=lower(NEW.email)
    ON CONFLICT (user_id,role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER affiliates_grant_access AFTER INSERT OR UPDATE OF email ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_access();
CREATE TRIGGER affiliate_user_grant_access AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_access();
INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'affiliate'::public.app_role FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.affiliates a WHERE lower(a.email) = lower(u.email))
ON CONFLICT (user_id, role) DO NOTHING;

-- Historical rates cannot be reconstructed: freeze existing orders at the rate
-- currently on file. All future orders capture their own rate at attribution.
ALTER TABLE public.orders ADD COLUMN affiliate_commission_rate numeric(5,2);
ALTER TABLE public.orders ADD COLUMN affiliate_commission_amount numeric(14,2);
UPDATE public.orders o SET affiliate_commission_rate = a.commission_rate,
  affiliate_commission_amount = round(o.total * a.commission_rate / 100, 2)
FROM public.affiliates a WHERE lower(btrim(o.affiliate_code)) = lower(a.code);
UPDATE public.orders SET affiliate_code = lower(btrim(affiliate_code)) WHERE affiliate_code IS NOT NULL;
UPDATE public.leads SET affiliate_code = lower(btrim(affiliate_code)) WHERE affiliate_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.orders_validate_affiliate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.affiliates;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.affiliate_code := OLD.affiliate_code;
    NEW.affiliate_link_slug := OLD.affiliate_link_slug;
    NEW.affiliate_commission_rate := OLD.affiliate_commission_rate;
    -- Freeze the monetary commission once an order has first been paid.
    NEW.affiliate_commission_amount := OLD.affiliate_commission_amount;
    IF NEW.payment_status = 'paid' AND OLD.affiliate_commission_amount IS NULL THEN
      NEW.affiliate_commission_amount := round(NEW.total * NEW.affiliate_commission_rate / 100, 2);
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO a FROM public.affiliates WHERE lower(code) = lower(btrim(NEW.affiliate_code)) LIMIT 1;
  IF NOT FOUND OR a.status <> 'active' OR lower(btrim(NEW.email)) = lower(btrim(a.email)) THEN
    NEW.affiliate_code := NULL;
    NEW.affiliate_link_slug := NULL;
    NEW.affiliate_commission_rate := NULL;
    NEW.affiliate_commission_amount := NULL;
  ELSE
    NEW.affiliate_code := lower(a.code);
    NEW.affiliate_commission_rate := a.commission_rate;
    NEW.affiliate_commission_amount := CASE WHEN NEW.payment_status = 'paid'
      THEN round(NEW.total * a.commission_rate / 100, 2) ELSE NULL END;
    IF NOT EXISTS (SELECT 1 FROM public.affiliate_links l WHERE l.slug = NEW.affiliate_link_slug AND l.affiliate_id = a.id) THEN
      NEW.affiliate_link_slug := NULL;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS orders_validate_affiliate ON public.orders;
CREATE TRIGGER orders_validate_affiliate BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_validate_affiliate();

CREATE FUNCTION public.affiliate_balance(p_affiliate_id uuid) RETURNS numeric
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT sum(o.affiliate_commission_amount) FROM public.orders o
      JOIN public.affiliates a ON lower(a.code) = lower(o.affiliate_code)
      WHERE a.id = p_affiliate_id AND o.payment_status = 'paid'), 0)
    - coalesce((SELECT sum(amount) FROM public.affiliate_payouts
      WHERE affiliate_id = p_affiliate_id AND status IN ('pending','approved','paid')), 0)
    - coalesce((SELECT sum(amount) FROM public.affiliate_payout_requests
      WHERE affiliate_id = p_affiliate_id AND status = 'pending'), 0)
$$;

-- Every writer takes the same affiliate row lock before checking commitments.
-- Triggers also protect admin REST writes and older clients.
CREATE FUNCTION public.guard_affiliate_payout() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE available numeric; previous_amount numeric := 0;
BEGIN
  PERFORM 1 FROM public.affiliates WHERE id = NEW.affiliate_id FOR UPDATE;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.affiliate_id <> OLD.affiliate_id THEN RAISE EXCEPTION 'Cannot change payout affiliate'; END IF;
    IF OLD.status = 'paid' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Paid payouts cannot be edited'; END IF;
    IF OLD.status IN ('pending','approved','paid') THEN previous_amount := OLD.amount; END IF;
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 OR NEW.amount::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Enter a positive payout amount';
  END IF;
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status <> 'approved' OR nullif(btrim(NEW.payment_reference),'') IS NULL) THEN
    RAISE EXCEPTION 'Approve the payout and enter a payment reference before marking paid';
  END IF;
  IF NEW.status IN ('pending','approved','paid') THEN
    available := public.affiliate_balance(NEW.affiliate_id) + previous_amount;
    IF NEW.amount > available THEN RAISE EXCEPTION 'Payout exceeds current available balance'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_affiliate_payout BEFORE INSERT OR UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION public.guard_affiliate_payout();

CREATE FUNCTION public.request_affiliate_payout(p_amount numeric, p_note text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.affiliates; minimum numeric; available numeric; r public.affiliate_payout_requests;
BEGIN
  SELECT * INTO a FROM public.affiliates WHERE id = public.current_affiliate_id() FOR UPDATE;
  IF NOT FOUND OR a.status <> 'active' THEN RAISE EXCEPTION 'No active affiliate account found'; END IF;
  IF nullif(btrim(a.payout_details),'') IS NULL THEN RAISE EXCEPTION 'Add your bank details in Settings first'; END IF;
  SELECT coalesce(nullif(value->>'min_payout_ngn','')::numeric,10000) INTO minimum FROM public.site_settings WHERE key = 'affiliate';
  minimum := CASE WHEN minimum > 0 THEN minimum ELSE 10000 END;
  available := public.affiliate_balance(a.id);
  IF p_amount IS NULL OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount < minimum OR p_amount <> round(p_amount,2) THEN
    RAISE EXCEPTION 'Minimum payout is NGN %. Use at most two decimal places.', minimum;
  END IF;
  IF p_amount > available THEN RAISE EXCEPTION 'Requested amount exceeds current available balance'; END IF;
  INSERT INTO public.affiliate_payout_requests(affiliate_id,amount,note,status)
    VALUES(a.id,p_amount,left(p_note,500),'pending') RETURNING * INTO r;
  RETURN jsonb_build_object('success',true,'request',to_jsonb(r),'available',available-p_amount,'min_payout',minimum);
END $$;

CREATE FUNCTION public.approve_affiliate_payout_request(p_request_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.affiliate_payout_requests; a public.affiliates; payout uuid; first_day date; last_day date := (now() AT TIME ZONE 'Africa/Lagos')::date;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT a1.* INTO a FROM public.affiliates a1 JOIN public.affiliate_payout_requests r1 ON r1.affiliate_id=a1.id
    WHERE r1.id=p_request_id FOR UPDATE OF a1;
  SELECT * INTO r FROM public.affiliate_payout_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status = 'approved' AND r.payout_id IS NOT NULL THEN RETURN r.payout_id; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'This request has already been decided'; END IF;
  IF a.status <> 'active' OR nullif(btrim(a.payout_details),'') IS NULL THEN RAISE EXCEPTION 'Active account and bank details required'; END IF;
  -- Release this reservation inside the same transaction, then replace it.
  UPDATE public.affiliate_payout_requests SET status='approved',decided_by=auth.uid(),decided_at=now() WHERE id=r.id;
  IF r.amount > public.affiliate_balance(a.id) THEN RAISE EXCEPTION 'Balance changed; review this request'; END IF;
  first_day := (a.created_at AT TIME ZONE 'Africa/Lagos')::date;
  INSERT INTO public.affiliate_payouts(affiliate_id,period_start,period_end,lead_count,revenue_total,commission_total,amount,status,notes)
  SELECT a.id,first_day,last_day,count(*),coalesce(sum(o.total),0),coalesce(sum(o.affiliate_commission_amount),0),r.amount,'approved',
    'Request ' || r.id || '. Lifetime earnings summary; payout may cover part of available earnings.'
  FROM public.orders o WHERE lower(o.affiliate_code)=lower(a.code) AND o.payment_status='paid'
  RETURNING id INTO payout;
  UPDATE public.affiliate_payout_requests SET payout_id=payout WHERE id=r.id;
  RETURN payout;
END $$;

CREATE FUNCTION public.reject_affiliate_payout_request(p_request_id uuid,p_note text DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.affiliate_payout_requests;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  PERFORM 1 FROM public.affiliates a JOIN public.affiliate_payout_requests q ON q.affiliate_id=a.id WHERE q.id=p_request_id FOR UPDATE OF a;
  SELECT * INTO r FROM public.affiliate_payout_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'This request has already been decided'; END IF;
  UPDATE public.affiliate_payout_requests SET status='rejected',admin_note=left(p_note,500),decided_by=auth.uid(),decided_at=now() WHERE id=r.id;
END $$;
REVOKE UPDATE,DELETE ON public.affiliate_payout_requests FROM authenticated;
REVOKE ALL ON FUNCTION public.affiliate_balance(uuid),public.sync_affiliate_access(),public.guard_affiliate_payout(),public.orders_validate_affiliate() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.request_affiliate_payout(numeric,text),public.approve_affiliate_payout_request(uuid),public.reject_affiliate_payout_request(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_affiliate_payout(numeric,text),public.approve_affiliate_payout_request(uuid),public.reject_affiliate_payout_request(uuid,text) TO authenticated;

CREATE FUNCTION public.calculate_affiliate_payout(p_affiliate_id uuid,p_start date,p_end date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_start IS NULL OR p_end IS NULL OR p_end < p_start THEN RAISE EXCEPTION 'Choose a valid period'; END IF;
  SELECT jsonb_build_object('leads',count(*),'revenue',coalesce(sum(total),0),
    'commission',coalesce(sum(affiliate_commission_amount),0),'available',greatest(0,public.affiliate_balance(p_affiliate_id)))
  INTO result FROM public.orders WHERE lower(affiliate_code)=(SELECT lower(code) FROM public.affiliates WHERE id=p_affiliate_id)
    AND payment_status='paid' AND (created_at AT TIME ZONE 'Africa/Lagos')::date BETWEEN p_start AND p_end;
  RETURN result;
END $$;
CREATE FUNCTION public.create_affiliate_payout(p_affiliate_id uuid,p_start date,p_end date,p_amount numeric,p_notes text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.affiliates; summary jsonb; payout uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO a FROM public.affiliates WHERE id=p_affiliate_id FOR UPDATE;
  IF NOT FOUND OR a.status <> 'active' THEN RAISE EXCEPTION 'Choose an active affiliate'; END IF;
  summary := public.calculate_affiliate_payout(a.id,p_start,p_end);
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text IN ('NaN','Infinity','-Infinity') OR p_amount <> round(p_amount,2)
    OR p_amount > (summary->>'available')::numeric THEN RAISE EXCEPTION 'Amount exceeds current available balance or is invalid'; END IF;
  INSERT INTO public.affiliate_payouts(affiliate_id,period_start,period_end,lead_count,revenue_total,commission_total,amount,status,notes)
  VALUES(a.id,p_start,p_end,(summary->>'leads')::integer,(summary->>'revenue')::numeric,(summary->>'commission')::numeric,p_amount,'pending',left(p_notes,2000))
  RETURNING id INTO payout;
  RETURN payout;
END $$;
REVOKE ALL ON FUNCTION public.calculate_affiliate_payout(uuid,date,date),public.create_affiliate_payout(uuid,date,date,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.calculate_affiliate_payout(uuid,date,date),public.create_affiliate_payout(uuid,date,date,numeric,text) TO authenticated;

-- Enqueue both messages atomically with the application. The existing email
-- worker owns retries/delivery; closing the browser cannot lose the notification.
CREATE FUNCTION public.queue_career_application_mail() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient text; label text; subject text; body text; message_id uuid;
BEGIN
  FOREACH label IN ARRAY ARRAY['career-application-admin','career-application-receipt'] LOOP
    recipient := CASE WHEN label='career-application-admin' THEN 'careers@tiogatechnologies.com' ELSE NEW.email END;
    subject := CASE WHEN label='career-application-admin' THEN 'New job application' ELSE 'We received your application' END;
    body := CASE WHEN label='career-application-admin'
      THEN format('New application for %s from %s (%s, %s). Review the application and CV at https://tiogatechnologies.com/admin/career-applications',NEW.role_title,NEW.full_name,NEW.email,NEW.phone)
      ELSE format('Hi %s, thank you for applying for %s at Tioga Technologies. We received your application and CV. We will contact you if your profile is a match.',NEW.full_name,NEW.role_title) END;
    message_id := gen_random_uuid();
    PERFORM public.enqueue_email('transactional_emails',jsonb_build_object(
      'message_id',message_id,'to',recipient,'from','Tioga Technologies <info@notify.tiogatechnologies.com>',
      'sender_domain','notify.tiogatechnologies.com','subject',subject,'text',body,
      'html','<p>' || replace(replace(replace(body,'&','&amp;'),'<','&lt;'),'>','&gt;') || '</p>',
      'purpose','transactional','label',label,'idempotency_key',label || '-' || NEW.id,'queued_at',now()));
    INSERT INTO public.email_send_log(message_id,template_name,recipient_email,status) VALUES(message_id::text,label,recipient,'pending');
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER queue_career_application_mail AFTER INSERT ON public.career_applications
  FOR EACH ROW EXECUTE FUNCTION public.queue_career_application_mail();
REVOKE ALL ON FUNCTION public.queue_career_application_mail() FROM PUBLIC,anon,authenticated;

COMMIT;
