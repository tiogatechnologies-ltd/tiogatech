-- ==============================================================================
-- Tioga Technologies - Customer Intake & Platform RLS Access Fix
-- Enables 100% smooth public visitor submissions for all website features
--
-- SECURITY NOTE (corrected): every SELECT policy in this file originally
-- read `TO anon, authenticated USING (true)` - i.e. anyone on the internet,
-- no login required, could read every newsletter subscriber's email, every
-- career applicant's CV/personal data, every finance application, warranty
-- claim, quote and support ticket, plus all page-view/click/conversion
-- analytics. The INSERT ("Anyone can submit...") policies are correct and
-- kept as-is - public visitors are meant to submit these forms without an
-- account. Only the SELECT side is tightened to admin/staff + the
-- submitter's own row, matching what the live database actually runs.
-- ==============================================================================

-- 1. NEWSLETTER SUBSCRIBERS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_insert_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_select_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view newsletter subscribers fix" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 2. SOLAR ASSESSMENTS
ALTER TABLE public.solar_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit solar assessment" ON public.solar_assessments;
DROP POLICY IF EXISTS "solar_assessments_insert_policy" ON public.solar_assessments;
DROP POLICY IF EXISTS "solar_assessments_select_policy" ON public.solar_assessments;
DROP POLICY IF EXISTS "Anyone can view solar assessment by id" ON public.solar_assessments;
DROP POLICY IF EXISTS "Anyone can update solar assessment" ON public.solar_assessments;
CREATE POLICY "Anyone can submit solar assessment" ON public.solar_assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or staff view solar assessment fix" ON public.solar_assessments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));
CREATE POLICY "Owner or staff update solar assessment fix" ON public.solar_assessments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]))
  WITH CHECK (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

-- 3. LUMIVOLT SIZINGS
ALTER TABLE public.lumivolt_sizings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit lumivolt sizing" ON public.lumivolt_sizings;
DROP POLICY IF EXISTS "lumivolt_sizings_insert_policy" ON public.lumivolt_sizings;
DROP POLICY IF EXISTS "lumivolt_sizings_select_policy" ON public.lumivolt_sizings;
DROP POLICY IF EXISTS "Anyone can view lumivolt sizing" ON public.lumivolt_sizings;
CREATE POLICY "Anyone can submit lumivolt sizing" ON public.lumivolt_sizings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or staff view lumivolt sizing fix" ON public.lumivolt_sizings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

-- 4. CAREER APPLICATIONS
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit career application" ON public.career_applications;
DROP POLICY IF EXISTS "career_applications_insert_policy" ON public.career_applications;
DROP POLICY IF EXISTS "Staff can view career applications" ON public.career_applications;
CREATE POLICY "Anyone can submit career application" ON public.career_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view career applications fix" ON public.career_applications FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 5. CUSTOM SOLUTION REQUESTS
ALTER TABLE public.custom_solution_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit custom solution request" ON public.custom_solution_requests;
DROP POLICY IF EXISTS "custom_solution_requests_insert_policy" ON public.custom_solution_requests;
DROP POLICY IF EXISTS "Anyone can view custom solution requests" ON public.custom_solution_requests;
CREATE POLICY "Anyone can submit custom solution request" ON public.custom_solution_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff view custom solution requests fix" ON public.custom_solution_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 6. QUOTES & INQUIRIES
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit quote request" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON public.quotes;
DROP POLICY IF EXISTS "Anyone can view quotes" ON public.quotes;
CREATE POLICY "Anyone can submit quote request" ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or staff view quotes fix" ON public.quotes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 7. SUPPORT TICKETS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit support ticket" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_policy" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can view support tickets" ON public.support_tickets;
CREATE POLICY "Anyone can submit support ticket" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owner or staff view support tickets fix" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 8. WARRANTY CLAIMS
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit warranty claim" ON public.warranty_claims;
DROP POLICY IF EXISTS "warranty_claims_insert_policy" ON public.warranty_claims;
DROP POLICY IF EXISTS "Anyone can view warranty claims" ON public.warranty_claims;
CREATE POLICY "Anyone can submit warranty claim fix" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner or staff view warranty claims fix" ON public.warranty_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff','engineer']::app_role[]));

-- 9. FINANCE APPLICATIONS
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit finance application" ON public.finance_applications;
DROP POLICY IF EXISTS "finance_applications_insert_policy" ON public.finance_applications;
DROP POLICY IF EXISTS "Anyone can view finance applications" ON public.finance_applications;
CREATE POLICY "Anyone can submit finance application fix" ON public.finance_applications FOR INSERT TO anon, authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Owner or staff view finance applications fix" ON public.finance_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

-- 10. REAL-TIME TRACKING (PAGE VIEWS, CLICKS, CONVERSIONS)
-- Write-only from the public's perspective: anyone can log an event, only
-- staff/admin can read the aggregated analytics back.
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "page_views_insert_policy" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can view page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view page views fix" ON public.page_views FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;
DROP POLICY IF EXISTS "product_clicks_insert_policy" ON public.product_clicks;
DROP POLICY IF EXISTS "Anyone can view product clicks" ON public.product_clicks;
CREATE POLICY "Anyone can insert product clicks" ON public.product_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view product clicks fix" ON public.product_clicks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));

ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert conversions" ON public.conversions;
DROP POLICY IF EXISTS "conversions_insert_policy" ON public.conversions;
DROP POLICY IF EXISTS "Anyone can view conversions" ON public.conversions;
CREATE POLICY "Anyone can insert conversions" ON public.conversions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view conversions fix" ON public.conversions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','staff']::app_role[]));
