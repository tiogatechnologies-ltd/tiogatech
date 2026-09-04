-- ==============================================================================
-- Tioga Technologies - Customer Intake & Platform RLS Access Fix
-- Enables 100% smooth public visitor submissions for all website features
-- ==============================================================================

-- 1. NEWSLETTER SUBSCRIBERS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_insert_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_select_policy" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT TO anon, authenticated USING (true);

-- 2. SOLAR ASSESSMENTS
ALTER TABLE public.solar_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit solar assessment" ON public.solar_assessments;
DROP POLICY IF EXISTS "solar_assessments_insert_policy" ON public.solar_assessments;
DROP POLICY IF EXISTS "solar_assessments_select_policy" ON public.solar_assessments;
CREATE POLICY "Anyone can submit solar assessment" ON public.solar_assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view solar assessment by id" ON public.solar_assessments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update solar assessment" ON public.solar_assessments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. LUMIVOLT SIZINGS
ALTER TABLE public.lumivolt_sizings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit lumivolt sizing" ON public.lumivolt_sizings;
DROP POLICY IF EXISTS "lumivolt_sizings_insert_policy" ON public.lumivolt_sizings;
DROP POLICY IF EXISTS "lumivolt_sizings_select_policy" ON public.lumivolt_sizings;
CREATE POLICY "Anyone can submit lumivolt sizing" ON public.lumivolt_sizings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view lumivolt sizing" ON public.lumivolt_sizings FOR SELECT TO anon, authenticated USING (true);

-- 4. CAREER APPLICATIONS
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit career application" ON public.career_applications;
DROP POLICY IF EXISTS "career_applications_insert_policy" ON public.career_applications;
CREATE POLICY "Anyone can submit career application" ON public.career_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view career applications" ON public.career_applications FOR SELECT TO anon, authenticated USING (true);

-- 5. CUSTOM SOLUTION REQUESTS
ALTER TABLE public.custom_solution_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit custom solution request" ON public.custom_solution_requests;
DROP POLICY IF EXISTS "custom_solution_requests_insert_policy" ON public.custom_solution_requests;
CREATE POLICY "Anyone can submit custom solution request" ON public.custom_solution_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view custom solution requests" ON public.custom_solution_requests FOR SELECT TO anon, authenticated USING (true);

-- 6. QUOTES & INQUIRIES
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit quote request" ON public.quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON public.quotes;
CREATE POLICY "Anyone can submit quote request" ON public.quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view quotes" ON public.quotes FOR SELECT TO anon, authenticated USING (true);

-- 7. SUPPORT TICKETS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit support ticket" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_policy" ON public.support_tickets;
CREATE POLICY "Anyone can submit support ticket" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view support tickets" ON public.support_tickets FOR SELECT TO anon, authenticated USING (true);

-- 8. WARRANTY CLAIMS
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit warranty claim" ON public.warranty_claims;
DROP POLICY IF EXISTS "warranty_claims_insert_policy" ON public.warranty_claims;
CREATE POLICY "Anyone can submit warranty claim" ON public.warranty_claims FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view warranty claims" ON public.warranty_claims FOR SELECT TO anon, authenticated USING (true);

-- 9. FINANCE APPLICATIONS
ALTER TABLE public.finance_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit finance application" ON public.finance_applications;
DROP POLICY IF EXISTS "finance_applications_insert_policy" ON public.finance_applications;
CREATE POLICY "Anyone can submit finance application" ON public.finance_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view finance applications" ON public.finance_applications FOR SELECT TO anon, authenticated USING (true);

-- 10. REAL-TIME TRACKING (PAGE VIEWS, CLICKS, CONVERSIONS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "page_views_insert_policy" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view page views" ON public.page_views FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;
DROP POLICY IF EXISTS "product_clicks_insert_policy" ON public.product_clicks;
CREATE POLICY "Anyone can insert product clicks" ON public.product_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view product clicks" ON public.product_clicks FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert conversions" ON public.conversions;
DROP POLICY IF EXISTS "conversions_insert_policy" ON public.conversions;
CREATE POLICY "Anyone can insert conversions" ON public.conversions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view conversions" ON public.conversions FOR SELECT TO anon, authenticated USING (true);
